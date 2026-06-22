const { supabase } = require('../config/supabase');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Valid groups for app settings.
 */
const VALID_GROUPS = ['general', 'payments', 'ai', 'notifications'];

/**
 * Service for managing application settings.
 * Handles encryption/decryption transparently.
 * Never returns raw decrypted values — callers receive DB rows
 * with a `_raw_value` field stripped by the serializer.
 */
class SettingService {
    /**
     * Get all settings, grouped by their "group" field.
     * Decrypts values internally; serializer will mask them.
     * @returns {Object[]} array of setting rows (with decrypted value for internal use)
     */
    async getAll() {
        const { data, error } = await supabase
            .from('app_setting')
            .select('id, key, value, group, label, description, is_encrypted, type, created_at, updated_at')
            .order('group')
            .order('key');

        if (error) throw new Error(`Failed to fetch settings: ${error.message}`);

        return this._decryptRows(data);
    }

    /**
     * Get all settings for a specific group.
     * @param {string} group
     * @returns {Object[]}
     */
    async getByGroup(group) {
        this._validateGroup(group);

        const { data, error } = await supabase
            .from('app_setting')
            .select('id, key, value, group, label, description, is_encrypted, type, created_at, updated_at')
            .eq('group', group)
            .order('key');

        if (error) throw new Error(`Failed to fetch settings for group '${group}': ${error.message}`);

        return this._decryptRows(data);
    }

    /**
     * Upsert a batch of settings for a group.
     * Encrypts values where is_encrypted=true before writing.
     * @param {string} group
     * @param {Object[]} settings
     * @returns {Object[]}
     */
    async upsertGroup(group, settings) {
        this._validateGroup(group);

        const rows = settings.map((s) => ({
            key:          s.key,
            value:        s.is_encrypted ? encrypt(s.value) : s.value,
            group:        group,
            label:        s.label,
            description:  s.description || null,
            is_encrypted: s.is_encrypted ?? false,
            type:         s.type ?? 'text',
        }));

        const { data, error } = await supabase
            .from('app_setting')
            .upsert(rows, { onConflict: 'group,key' })
            .select('id, key, value, group, label, description, is_encrypted, type, created_at, updated_at');

        if (error) throw new Error(`Failed to save settings: ${error.message}`);

        return this._decryptRows(data);
    }

    /**
     * Test a third-party API connection using the provided key.
     * Performs a minimal ping to validate the key.
     * @param {string} provider  - e.g. 'stripe', 'openai', 'sendgrid'
     * @param {string} key       - raw API key (NOT encrypted)
     * @returns {{ success: boolean, message: string }}
     */
    async testConnection(provider, key) {
        const providerMap = {
            stripe:     () => this._testStripe(key),
            paypal:     () => this._testPayPal(key),
            openai:     () => this._testOpenAI(key),
            gemini:     () => this._testGemini(key),
            sendgrid:   () => this._testSendGrid(key),
            twilio:     () => this._testTwilio(key),
        };

        const tester = providerMap[provider.toLowerCase()];
        if (!tester) {
            return { success: false, message: `Unknown provider: ${provider}` };
        }

        try {
            return await tester();
        } catch (err) {
            return { success: false, message: err.message || 'Connection failed' };
        }
    }

    // ── Private helpers ─────────────────────────────────────────────────────

    _validateGroup(group) {
        if (!VALID_GROUPS.includes(group)) {
            throw new Error(`Invalid settings group. Must be one of: ${VALID_GROUPS.join(', ')}`);
        }
    }

    /**
     * Decrypt rows returned from DB.
     * Stores decrypted value as `_raw_value` for masking in serializer.
     */
    _decryptRows(rows) {
        return (rows || []).map((row) => {
            if (row.is_encrypted && row.value) {
                try {
                    const decrypted = decrypt(row.value);
                    return { ...row, _raw_value: decrypted };
                } catch {
                    // If decryption fails (e.g., legacy plaintext), surface as-is
                    return { ...row, _raw_value: row.value };
                }
            }
            return row;
        });
    }

    // ── Provider testers ────────────────────────────────────────────────────

    async _testStripe(key) {
        const https = require('https');
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.stripe.com',
                path: '/v1/account',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'User-Agent': 'RestaurantMS/1.0',
                },
                timeout: 8000,
            };
            const req = https.request(options, (res) => {
                resolve(
                    res.statusCode === 200
                        ? { success: true,  message: 'Stripe connection successful' }
                        : { success: false, message: `Stripe returned HTTP ${res.statusCode}` }
                );
            });
            req.on('error', (e) => resolve({ success: false, message: e.message }));
            req.on('timeout', ()  => resolve({ success: false, message: 'Request timed out' }));
            req.end();
        });
    }

    async _testPayPal(key) {
        // PayPal requires OAuth — just validate key format
        if (!key || key.length < 20) {
            return { success: false, message: 'Invalid PayPal client ID format' };
        }
        return { success: true, message: 'PayPal key format valid (live test requires OAuth)' };
    }

    async _testOpenAI(key) {
        const https = require('https');
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/models',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'User-Agent': 'RestaurantMS/1.0',
                },
                timeout: 8000,
            };
            const req = https.request(options, (res) => {
                resolve(
                    res.statusCode === 200
                        ? { success: true,  message: 'OpenAI connection successful' }
                        : { success: false, message: `OpenAI returned HTTP ${res.statusCode}` }
                );
            });
            req.on('error', (e) => resolve({ success: false, message: e.message }));
            req.on('timeout', ()  => resolve({ success: false, message: 'Request timed out' }));
            req.end();
        });
    }

    async _testGemini(key) {
        const https = require('https');
        return new Promise((resolve) => {
            const options = {
                hostname: 'generativelanguage.googleapis.com',
                path: `/v1beta/models?key=${encodeURIComponent(key)}`,
                method: 'GET',
                headers: { 'User-Agent': 'RestaurantMS/1.0' },
                timeout: 8000,
            };
            const req = https.request(options, (res) => {
                resolve(
                    res.statusCode === 200
                        ? { success: true,  message: 'Gemini connection successful' }
                        : { success: false, message: `Gemini returned HTTP ${res.statusCode}` }
                );
            });
            req.on('error', (e) => resolve({ success: false, message: e.message }));
            req.on('timeout', ()  => resolve({ success: false, message: 'Request timed out' }));
            req.end();
        });
    }

    async _testSendGrid(key) {
        const https = require('https');
        return new Promise((resolve) => {
            const options = {
                hostname: 'api.sendgrid.com',
                path: '/v3/scopes',
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${key}`,
                    'User-Agent': 'RestaurantMS/1.0',
                },
                timeout: 8000,
            };
            const req = https.request(options, (res) => {
                resolve(
                    res.statusCode === 200
                        ? { success: true,  message: 'SendGrid connection successful' }
                        : { success: false, message: `SendGrid returned HTTP ${res.statusCode}` }
                );
            });
            req.on('error', (e) => resolve({ success: false, message: e.message }));
            req.on('timeout', ()  => resolve({ success: false, message: 'Request timed out' }));
            req.end();
        });
    }

    async _testTwilio(key) {
        if (!key || key.length < 20) {
            return { success: false, message: 'Invalid Twilio credentials format' };
        }
        return { success: true, message: 'Twilio key format valid (live test requires Account SID + Auth Token pair)' };
    }
}

module.exports = new SettingService();
