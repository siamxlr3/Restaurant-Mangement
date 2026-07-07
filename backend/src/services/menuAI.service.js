const { supabase } = require('../config/supabase');
const { decrypt } = require('../utils/encryption');
const https = require('https');

class MenuAIService {

    // ── SUGGESTIONS ─────────────────────────────────────────────────────────

    /**
     * Get AI menu suggestions with pagination + filters.
     */
    async getSuggestions({
        page = 1,
        per_page = 20,
        action = null,
        is_applied = null,
        from_date = null,
        to_date = null,
        search = '',
    } = {}) {
        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        // If search is supplied, resolve matching menu_item IDs first
        let itemIds = null;
        if (search) {
            const { data: items, error: itemErr } = await supabase
                .from('menu_item')
                .select('id')
                .ilike('name', `%${search}%`)
                .is('deleted_at', null);
            if (itemErr) throw itemErr;
            itemIds = (items || []).map(i => i.id);
            if (itemIds.length === 0) {
                return this._emptyPage(page, limit);
            }
        }

        let query = supabase
            .from('ai_menu_suggestion')
            .select(
                `id, action, reason, impact_estimate, is_applied, generated_at, created_at,
                 menu_item:menu_item_id(id, name, base_price, is_available)`,
                { count: 'exact' }
            );

        if (itemIds) query = query.in('menu_item_id', itemIds);
        if (action)  query = query.eq('action', action);
        if (is_applied !== null && is_applied !== undefined && is_applied !== '') {
            query = query.eq('is_applied', is_applied === 'true' || is_applied === true);
        }
        if (from_date && to_date) {
            query = query.gte('created_at', `${from_date}T00:00:00.000Z`).lte('created_at', `${to_date}T23:59:59.999Z`);
        } else if (from_date) {
            query = query.gte('created_at', `${from_date}T00:00:00.000Z`);
        } else if (to_date) {
            query = query.lte('created_at', `${to_date}T23:59:59.999Z`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page:        parseInt(page) || 1,
                per_page:    limit,
                total:       count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };
    }

    /**
     * Apply a suggestion → sets is_applied = true.
     */
    async applySuggestion(id) {
        const { data, error } = await supabase
            .from('ai_menu_suggestion')
            .update({ is_applied: true })
            .eq('id', id)
            .select('id, action, reason, impact_estimate, is_applied, generated_at, created_at, menu_item:menu_item_id(id, name)')
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                const err = new Error('Suggestion not found');
                err.statusCode = 404;
                throw err;
            }
            throw error;
        }
        return data;
    }

    /**
     * Dismiss a suggestion → hard delete.
     */
    async dismissSuggestion(id) {
        const { error } = await supabase
            .from('ai_menu_suggestion')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }

    // ── INSIGHTS ────────────────────────────────────────────────────────────

    /**
     * Get AI insights with pagination + filters.
     */
    async getInsights({
        page = 1,
        per_page = 20,
        feature = null,
        is_read = null,
        is_dismissed = null,
        from_date = null,
        to_date = null,
    } = {}) {
        const limit = Math.min(parseInt(per_page) || 20, 100);
        const offset = (Math.max(parseInt(page) || 1, 1) - 1) * limit;

        let query = supabase
            .from('ai_insight')
            .select('id, feature, payload, is_read, is_dismissed, generated_at, created_at', { count: 'exact' });

        if (feature) query = query.eq('feature', feature);
        if (is_read !== null && is_read !== '') query = query.eq('is_read', is_read === 'true' || is_read === true);
        if (is_dismissed !== null && is_dismissed !== '') query = query.eq('is_dismissed', is_dismissed === 'true' || is_dismissed === true);
        if (from_date && to_date) {
            query = query.gte('created_at', `${from_date}T00:00:00.000Z`).lte('created_at', `${to_date}T23:59:59.999Z`);
        } else if (from_date) {
            query = query.gte('created_at', `${from_date}T00:00:00.000Z`);
        } else if (to_date) {
            query = query.lte('created_at', `${to_date}T23:59:59.999Z`);
        }

        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

        const { data, error, count } = await query;
        if (error) throw error;

        return {
            data: data || [],
            meta: {
                page:        parseInt(page) || 1,
                per_page:    limit,
                total:       count || 0,
                total_pages: Math.ceil((count || 0) / limit),
            },
        };
    }

    async markInsightRead(id) {
        const { data, error } = await supabase
            .from('ai_insight')
            .update({ is_read: true })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            if (error.code === 'PGRST116') { const e = new Error('Insight not found'); e.statusCode = 404; throw e; }
            throw error;
        }
        return data;
    }

    async dismissInsight(id) {
        const { data, error } = await supabase
            .from('ai_insight')
            .update({ is_dismissed: true })
            .eq('id', id)
            .select()
            .single();
        if (error) {
            if (error.code === 'PGRST116') { const e = new Error('Insight not found'); e.statusCode = 404; throw e; }
            throw error;
        }
        return data;
    }

    // ── AI JOB ──────────────────────────────────────────────────────────────

    /**
     * Weekly menu AI analysis job.
     * 1. Fetch Anthropic key from app_setting → decrypt
     * 2. Aggregate last-30-day metrics per menu item
     * 3. Build prompt → call Claude API
     * 4. Parse response → upsert ai_menu_suggestion rows
     * 5. Log result in ai_job_log
     */
    async runMenuAIJob() {
        const startTime = Date.now();
        let recordsProcessed = 0;

        try {
            console.log('[Menu AI] Starting weekly menu analysis job...');

            // 1. Fetch & decrypt API key
            let apiKey = await this._getAnthropicKey();
            let provider = 'anthropic';
            if (!apiKey) {
                apiKey = await this._getGeminiKey();
                provider = 'gemini';
            }
            if (!apiKey) {
                throw new Error('No AI API key (Anthropic or Gemini) configured. Please add it in Settings → AI Configuration.');
            }

            // 2. Aggregate menu item metrics (last 30 days)
            const metrics = await this._aggregateMenuMetrics();

            if (!metrics || metrics.length === 0) {
                console.log('[Menu AI] No menu item data found — skipping job.');
                await this._logJob('success', 0, Date.now() - startTime);
                return { success: true, recordsProcessed: 0 };
            }

            // 3. Build Claude prompt
            const prompt = this._buildPrompt(metrics);

            // 4. Call API depending on provider
            const rawResponse = provider === 'gemini'
                ? await this._callGemini(apiKey, prompt)
                : await this._callClaude(apiKey, prompt);

            // 5. Parse suggestions
            const suggestions = this._parseClaudeResponse(rawResponse, metrics);

            // 6. Upsert into ai_menu_suggestion
            if (suggestions.length > 0) {
                const { error: upsertErr } = await supabase
                    .from('ai_menu_suggestion')
                    .insert(suggestions);
                if (upsertErr) throw upsertErr;
                recordsProcessed = suggestions.length;
            }

            const duration = Date.now() - startTime;
            await this._logJob('success', recordsProcessed, duration);
            console.log(`[Menu AI] Job completed. Inserted ${recordsProcessed} suggestions.`);
            return { success: true, recordsProcessed };

        } catch (err) {
            console.error('[Menu AI] Job failed:', err.message);
            await this._logJob('failed', 0, Date.now() - startTime, err.message);
            throw err;
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

    async _aggregateMenuMetrics() {
        // Fetch all non-deleted menu items
        const { data: items, error: itemErr } = await supabase
            .from('menu_item')
            .select('id, name, base_price')
            .is('deleted_at', null);

        if (itemErr) throw itemErr;
        if (!items || items.length === 0) return [];

        // Last 30 days
        const since = new Date();
        since.setDate(since.getDate() - 30);
        const sinceISO = since.toISOString();

        // Fetch order_items for last 30 days (completed/paid orders only)
        const { data: orderItems, error: oiErr } = await supabase
            .from('order_items')
            .select('menu_item_id, quantity, unit_price, orders!inner(status, deleted_at)')
            .gte('created_at', sinceISO)
            .is('orders.deleted_at', null)
            .in('orders.status', ['closed']);

        if (oiErr) throw oiErr;

        // Aggregate per item
        const metricsMap = {};
        for (const item of items) {
            metricsMap[item.id] = {
                id:            item.id,
                name:          item.name,
                base_price:    parseFloat(item.base_price) || 0,
                order_count:   0,
                revenue:       0,
            };
        }

        for (const oi of orderItems || []) {
            const m = metricsMap[oi.menu_item_id];
            if (!m) continue;
            const qty = parseFloat(oi.quantity) || 0;
            const price = parseFloat(oi.unit_price) || 0;
            m.order_count += qty;
            m.revenue     += qty * price;
        }

        // Return only items with some data, sorted by revenue desc
        return Object.values(metricsMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 60); // cap at 60 items to keep prompt manageable
    }

    _buildPrompt(metrics) {
        const today = new Date().toISOString().split('T')[0];

        const tableRows = metrics.map(m =>
            `| ${m.name} | ৳${m.base_price.toFixed(2)} | ${Math.round(m.order_count)} | ৳${m.revenue.toFixed(2)} |`
        ).join('\n');

        return `You are a senior restaurant consultant analyzing menu performance data.

Today: ${today}
Analysis period: Last 30 days

## Menu Performance Data

| Item Name | Base Price | Orders (30d) | Revenue (30d) |
|-----------|------------|--------------|---------------|
${tableRows}

## Task

Analyze this data and return a JSON array of menu recommendations. Each recommendation must have:
- "item_name": exact item name from the table above
- "action": one of "remove", "reprice", "promote", or "bundle"
- "reason": clear, specific explanation (1-2 sentences, data-driven)
- "impact_estimate": estimated business impact (e.g., "+৳15,000/month", "Margin +8pts", "Frees prep capacity")

Rules:
- Recommend "remove" for items with fewer than 5 orders in 30 days and low revenue
- Recommend "reprice" for high-order items where revenue suggests pricing may be too low
- Recommend "promote" for items with good order volume but strong margin potential
- Recommend "bundle" for items that logically pair well
- Return 5–15 recommendations maximum
- Return ONLY valid JSON, no markdown fences, no explanation outside the array

Example output:
[{"item_name":"Seasonal Veg Curry","action":"remove","reason":"Only 3 orders in 30 days with negligible revenue impact. Removal frees kitchen capacity.","impact_estimate":"Frees prep capacity"},{"item_name":"Garlic Butter Prawns","action":"promote","reason":"Strong order frequency with high revenue per item. Featured placement could increase volume further.","impact_estimate":"+৳18,000/month est."}]`;
    }

    async _callClaude(apiKey, prompt) {
        const body = JSON.stringify({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.anthropic.com',
                path:     '/v1/messages',
                method:   'POST',
                headers: {
                    'Content-Type':      'application/json',
                    'x-api-key':         apiKey,
                    'anthropic-version': '2023-06-01',
                    'Content-Length':    Buffer.byteLength(body),
                    'User-Agent':        'RestaurantMS/1.0',
                },
                timeout: 30000,
            };

            const req = https.request(options, (res) => {
                let raw = '';
                res.on('data', chunk => { raw += chunk; });
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Anthropic API returned HTTP ${res.statusCode}: ${raw}`));
                        return;
                    }
                    try {
                        const parsed = JSON.parse(raw);
                        const text = parsed?.content?.[0]?.text || '';
                        resolve(text);
                    } catch (e) {
                        reject(new Error('Failed to parse Anthropic response'));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Anthropic API request timed out')); });
            req.write(body);
            req.end();
        });
    }

    async _callGemini(apiKey, prompt) {
        const body = JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
                thinkingConfig: {
                    thinkingBudget: 0
                }
            }
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path:     `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
                method:   'POST',
                headers: {
                    'Content-Type':   'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'User-Agent':     'RestaurantMS/1.0',
                },
                timeout: 30000,
            };

            const req = https.request(options, (res) => {
                let raw = '';
                res.on('data', chunk => { raw += chunk; });
                res.on('end', () => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`Gemini API returned HTTP ${res.statusCode}: ${raw}`));
                        return;
                    }
                    try {
                        const parsed = JSON.parse(raw);
                        const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        resolve(text);
                    } catch (e) {
                        reject(new Error('Failed to parse Gemini response'));
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Gemini API request timed out')); });
            req.write(body);
            req.end();
        });
    }

    _parseClaudeResponse(rawText, metrics) {
        // Build name→id map for fast lookup
        const nameToItem = {};
        for (const m of metrics) {
            nameToItem[m.name.toLowerCase()] = m;
        }

        let parsed = [];
        try {
            // Strip any accidental markdown fences
            const cleaned = rawText.replace(/```json|```/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.error('[Menu AI] Failed to parse Claude JSON response:', e.message);
            console.error('[Menu AI] Raw response:', rawText);
            return [];
        }

        if (!Array.isArray(parsed)) return [];

        const validActions = ['remove', 'reprice', 'promote', 'bundle'];
        const suggestions = [];

        for (const item of parsed) {
            if (!item.item_name || !item.action || !item.reason) continue;
            if (!validActions.includes(item.action)) continue;

            const match = nameToItem[item.item_name.toLowerCase()];
            if (!match) continue;

            suggestions.push({
                menu_item_id:    match.id,
                action:          item.action,
                reason:          item.reason,
                impact_estimate: item.impact_estimate || null,
                is_applied:      false,
                generated_at:    new Date().toISOString(),
            });
        }

        return suggestions;
    }

    async _logJob(status, records, duration, errorMessage = null) {
        try {
            await supabase.from('ai_job_log').insert([{
                job_type:          'menu_ai',
                status,
                records_processed: records,
                duration_ms:       duration,
                error_message:     errorMessage || null,
                ran_at:            new Date().toISOString(),
            }]);
        } catch (e) {
            console.error('[Menu AI] Failed to write job log:', e.message);
        }
    }

    _emptyPage(page, limit) {
        return {
            data: [],
            meta: { page: parseInt(page) || 1, per_page: limit, total: 0, total_pages: 0 },
        };
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    /**
     * Get aggregate stats counts for suggestions.
     */
    async getSuggestionStats() {
        const { data, error } = await supabase
            .from('ai_menu_suggestion')
            .select('is_applied');

        if (error) throw error;
        const rows = data || [];
        return {
            total:   rows.length,
            pending: rows.filter(r => !r.is_applied).length,
            applied: rows.filter(r => r.is_applied).length,
        };
    }
}

module.exports = new MenuAIService();
