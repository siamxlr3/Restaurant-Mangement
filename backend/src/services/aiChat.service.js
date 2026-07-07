const { supabase } = require('../config/supabase');
const { decrypt } = require('../utils/encryption');
const https = require('https');

class AiChatService {

    // ── Sessions ─────────────────────────────────────────────────────────────

    /**
     * List sessions for a staff member (paginated).
     */
    async listSessions({ staff_id = null, page = 1, per_page = 20 } = {}) {
        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        let query = supabase
            .from('ai_chat_session')
            .select('id, staff_id, started_at, last_message_at', { count: 'exact' })
            .order('last_message_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (staff_id) query = query.eq('staff_id', staff_id);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page: parseInt(page) || 1,
                per_page: limit,
                total: count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };
    }

    /**
     * Get or create session for a staff member (returns most recent, or creates new).
     */
    async getOrCreateSession({ staff_id = null } = {}) {
        // Look for most recent session
        let query = supabase
            .from('ai_chat_session')
            .select('id, staff_id, messages, started_at, last_message_at')
            .order('last_message_at', { ascending: false })
            .limit(1);

        if (staff_id) query = query.eq('staff_id', staff_id);

        const { data: existing, error: fetchErr } = await query;
        if (fetchErr) throw fetchErr;

        if (existing && existing.length > 0) {
            return existing[0];
        }

        // Create new session
        const { data: created, error: createErr } = await supabase
            .from('ai_chat_session')
            .insert([{ staff_id: staff_id || null, messages: [] }])
            .select('id, staff_id, messages, started_at, last_message_at')
            .single();

        if (createErr) throw createErr;
        return created;
    }

    /**
     * Create a fresh session (ignores existing ones).
     */
    async createSession({ staff_id = null } = {}) {
        const { data, error } = await supabase
            .from('ai_chat_session')
            .insert([{ staff_id: staff_id || null, messages: [] }])
            .select('id, staff_id, messages, started_at, last_message_at')
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Get a session by ID.
     */
    async getSession(id) {
        const { data, error } = await supabase
            .from('ai_chat_session')
            .select('id, staff_id, messages, started_at, last_message_at')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                const err = new Error('Session not found');
                err.statusCode = 404;
                throw err;
            }
            throw error;
        }
        return data;
    }

    /**
     * Delete a session by ID.
     */
    async deleteSession(id) {
        const { error } = await supabase
            .from('ai_chat_session')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }

    // ── Chat / Streaming ─────────────────────────────────────────────────────

    /**
     * Send a message and stream the Claude response back via SSE.
     * @param {string} sessionId
     * @param {string} userMessage
     * @param {Response} res  - Express response object (for SSE streaming)
     */
    async sendMessage(sessionId, userMessage, res) {
        // 1. Load session
        const session = await this.getSession(sessionId);
        const history = Array.isArray(session.messages) ? session.messages : [];

        // 2. Append user message to history
        const updatedHistory = [
            ...history,
            { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        ];

        // Persist user message immediately
        await supabase
            .from('ai_chat_session')
            .update({
                messages: updatedHistory,
                last_message_at: new Date().toISOString(),
            })
            .eq('id', sessionId);

        // 3. Fetch API key
        let apiKey = await this._getAnthropicKey();
        let provider = 'anthropic';
        if (!apiKey) {
            apiKey = await this._getGeminiKey();
            provider = 'gemini';
        }
        if (!apiKey) {
            const err = new Error('No AI API key (Anthropic or Gemini) configured. Please add it in Settings → AI Configuration.');
            err.statusCode = 503;
            throw err;
        }

        // 4. Gather live context data
        const contextData = await this._gatherContext();

        // 5. Build system prompt
        const systemPrompt = this._buildSystemPrompt(contextData);

        // 6. Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        // 7. Stream response
        let assistantContent = '';
        try {
            if (provider === 'gemini') {
                const geminiMessages = this._buildGeminiMessages(updatedHistory);
                await this._streamGemini(apiKey, systemPrompt, geminiMessages, (chunk) => {
                    assistantContent += chunk;
                    res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
                });
            } else {
                const claudeMessages = this._buildClaudeMessages(updatedHistory);
                await this._streamClaude(apiKey, systemPrompt, claudeMessages, (chunk) => {
                    assistantContent += chunk;
                    res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
                });
            }

            // 9. Persist assistant message
            const finalHistory = [
                ...updatedHistory,
                { role: 'assistant', content: assistantContent, timestamp: new Date().toISOString() },
            ];

            await supabase
                .from('ai_chat_session')
                .update({
                    messages: finalHistory,
                    last_message_at: new Date().toISOString(),
                })
                .eq('id', sessionId);

            // Send done event
            res.write(`data: ${JSON.stringify({ type: 'done', sessionId })}\n\n`);
        } catch (err) {
            console.error('[AI Chat] Stream error:', err.message);
            res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
        } finally {
            res.end();
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    async _getAnthropicKey() {
        const { data, error } = await supabase
            .from('app_setting')
            .select('value, is_encrypted')
            .eq('group', 'ai')
            .eq('key', 'anthropic_api_key')
            .single();

        if (error || !data?.value) return null;
        if (data.is_encrypted) {
            try { return decrypt(data.value); } catch { return null; }
        }
        return data.value;
    }

    async _getGeminiKey() {
        const { data, error } = await supabase
            .from('app_setting')
            .select('value, is_encrypted')
            .eq('group', 'ai')
            .eq('key', 'gemini_api_key')
            .single();

        if (error || !data?.value) return null;
        if (data.is_encrypted) {
            try { return decrypt(data.value); } catch { return null; }
        }
        return data.value;
    }

    async _gatherContext() {
        const since = new Date();
        since.setDate(since.getDate() - 7);
        const sinceISO = since.toISOString();

        const results = await Promise.allSettled([
            // Last 7 days sales
            supabase
                .from('bills')
                .select('total, status, created_at')
                .gte('created_at', sinceISO)
                .eq('status', 'paid')
                .is('deleted_at', null),

            // Top ordered items in last 7 days
            supabase
                .from('order_items')
                .select('menu_item_id, quantity, menu_item:menu_item_id(name)')
                .gte('created_at', sinceISO)
                .neq('status', 'voided'),

            // Low stock ingredients
            supabase
                .from('ingredient')
                .select('name, quantity, unit, reorder_level')
                .is('deleted_at', null),

            // Staff count
            supabase
                .from('staff')
                .select('id, role, is_active')
                .eq('is_active', true)
                .is('deleted_at', null),
        ]);

        // Sales summary
        let totalRevenue7d = 0;
        let totalOrders7d = 0;
        const billsResult = results[0];
        if (billsResult.status === 'fulfilled' && !billsResult.value.error) {
            const bills = billsResult.value.data || [];
            totalOrders7d = bills.length;
            totalRevenue7d = bills.reduce((sum, b) => sum + (parseFloat(b.total) || 0), 0);
        }

        // Top items
        let topItems = [];
        const itemsResult = results[1];
        if (itemsResult.status === 'fulfilled' && !itemsResult.value.error) {
            const rawItems = itemsResult.value.data || [];
            const itemMap = {};
            for (const oi of rawItems) {
                const name = oi.menu_item?.name || 'Unknown';
                if (!itemMap[name]) itemMap[name] = 0;
                itemMap[name] += parseFloat(oi.quantity) || 0;
            }
            topItems = Object.entries(itemMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([name, qty]) => ({ name, qty: Math.round(qty) }));
        }

        // Low stock
        let lowStockItems = [];
        const ingResult = results[2];
        if (ingResult.status === 'fulfilled' && !ingResult.value.error) {
            const ingredients = ingResult.value.data || [];
            lowStockItems = ingredients
                .filter(i => i.reorder_level && parseFloat(i.quantity) <= parseFloat(i.reorder_level))
                .map(i => ({ name: i.name, qty: `${i.quantity} ${i.unit}`, reorder_at: i.reorder_level }));
        }

        // Staff
        let staffStats = { total: 0, by_role: {} };
        const staffResult = results[3];
        if (staffResult.status === 'fulfilled' && !staffResult.value.error) {
            const staff = staffResult.value.data || [];
            staffStats.total = staff.length;
            for (const s of staff) {
                staffStats.by_role[s.role] = (staffStats.by_role[s.role] || 0) + 1;
            }
        }

        return { totalRevenue7d, totalOrders7d, topItems, lowStockItems, staffStats };
    }

    _buildSystemPrompt({ totalRevenue7d, totalOrders7d, topItems, lowStockItems, staffStats }) {
        const today = new Date().toISOString().split('T')[0];

        const topItemsText = topItems.length > 0
            ? topItems.map(i => `  - ${i.name}: ${i.qty} orders`).join('\n')
            : '  (No order data available)';

        const lowStockText = lowStockItems.length > 0
            ? lowStockItems.map(i => `  - ${i.name}: ${i.qty} (reorder at ${i.reorder_at})`).join('\n')
            : '  (No low-stock alerts)';

        const staffText = staffStats.total > 0
            ? Object.entries(staffStats.by_role).map(([role, count]) => `  - ${role}: ${count}`).join('\n')
            : '  (No staff data)';

        return `You are an intelligent operations assistant for a restaurant management system. You have access to live data from the restaurant's systems. Today is ${today}.

## Live Restaurant Data (Last 7 Days)

### Sales Summary
- Total Revenue: ৳${totalRevenue7d.toFixed(2)}
- Total Orders: ${totalOrders7d}
- Average Order Value: ৳${totalOrders7d > 0 ? (totalRevenue7d / totalOrders7d).toFixed(2) : '0.00'}

### Top Ordered Items
${topItemsText}

### Inventory Alerts (Low Stock)
${lowStockText}

### Active Staff
- Total: ${staffStats.total}
${staffText}

## Your Role
- Answer questions about restaurant performance, inventory, staff, and operations
- Be concise, data-driven, and actionable
- Use the live data above to ground your responses
- If asked about data outside the last 7 days, clearly state you're limited to recent data
- Be conversational but professional
- Format responses with clear bullet points or numbered lists where helpful`;
    }

    _buildClaudeMessages(history) {
        // Take last 20 messages (10 turns) to stay within token limits
        const recent = history.slice(-20);
        return recent.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));
    }

    async _streamClaude(apiKey, systemPrompt, messages, onChunk) {
        const body = JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
            stream: true,
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length': Buffer.byteLength(body),
                    'User-Agent': 'RestaurantMS/1.0',
                },
                timeout: 60000,
            };

            const req = https.request(options, (response) => {
                if (response.statusCode !== 200) {
                    let errBody = '';
                    response.on('data', chunk => { errBody += chunk; });
                    response.on('end', () => {
                        reject(new Error(`Anthropic API error ${response.statusCode}: ${errBody}`));
                    });
                    return;
                }

                let buffer = '';
                response.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith(':')) continue;

                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(dataStr);
                                // Handle content_block_delta events
                                if (
                                    parsed.type === 'content_block_delta' &&
                                    parsed.delta?.type === 'text_delta' &&
                                    parsed.delta?.text
                                ) {
                                    onChunk(parsed.delta.text);
                                }
                            } catch {
                                // Ignore parse errors on SSE frames
                            }
                        }
                    }
                });

                response.on('end', () => resolve());
                response.on('error', reject);
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Anthropic API request timed out after 60s'));
            });
            req.write(body);
            req.end();
        });
    }

    _buildGeminiMessages(history) {
        // Take last 20 messages (10 turns) to stay within limits
        const recent = history.slice(-20);
        return recent.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));
    }

    async _streamGemini(apiKey, systemPrompt, messages, onChunk) {
        const body = JSON.stringify({
            contents: messages,
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            generationConfig: {
                maxOutputTokens: 1024,
                thinkingConfig: {
                    thinkingBudget: 0
                }
            }
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'User-Agent': 'RestaurantMS/1.0',
                },
                timeout: 60000,
            };

            const req = https.request(options, (response) => {
                if (response.statusCode !== 200) {
                    let errBody = '';
                    response.on('data', chunk => { errBody += chunk; });
                    response.on('end', () => {
                        reject(new Error(`Gemini API error ${response.statusCode}: ${errBody}`));
                    });
                    return;
                }

                let buffer = '';
                response.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Keep incomplete line in buffer

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed) continue;

                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            try {
                                const parsed = JSON.parse(dataStr);
                                const token = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (token) {
                                    onChunk(token);
                                }
                            } catch {
                                // Ignore parse errors on incomplete chunk JSON
                            }
                        }
                    }
                });

                response.on('end', () => resolve());
                response.on('error', reject);
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Gemini API request timed out after 60s'));
            });
            req.write(body);
            req.end();
        });
    }
}

module.exports = new AiChatService();
