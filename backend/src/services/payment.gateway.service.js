/**
 * PaymentGatewayService
 *
 * Reads decrypted API credentials from app_setting at runtime.
 * Wraps bKash, Rocket, and Nagad payment flows.
 * Never exposes raw keys — decrypt is only used internally.
 */

const https = require('https');
const { supabase } = require('../config/supabase');
const { decrypt } = require('../utils/encryption');

// ── Helper: make an HTTPS request (returns parsed JSON) ──────────────────────
function httpsRequest(options, body = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Request timed out')));
        if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
        req.end();
    });
}

// ── Helper: read a single decrypted setting value ─────────────────────────────
async function getDecryptedSetting(key) {
    const { data, error } = await supabase
        .from('app_setting')
        .select('value, is_encrypted')
        .eq('group', 'payments')
        .eq('key', key)
        .single();

    if (error || !data) return null;

    try {
        return data.is_encrypted ? decrypt(data.value) : data.value;
    } catch {
        return data.value; // fallback if not yet encrypted
    }
}

// ── Helper: read multiple setting values ──────────────────────────────────────
async function getPaymentSettings(keys) {
    const { data, error } = await supabase
        .from('app_setting')
        .select('key, value, is_encrypted')
        .eq('group', 'payments')
        .in('key', keys);

    if (error || !data) return {};

    const result = {};
    for (const row of data) {
        try {
            result[row.key] = row.is_encrypted ? decrypt(row.value) : row.value;
        } catch {
            result[row.key] = row.value;
        }
    }
    return result;
}

class PaymentGatewayService {
    // ────────────────────────────────────────────────────────────────────────
    // Gateway Status
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Returns which gateways have credentials configured.
     * Never exposes raw key values.
     */
    async getGatewayStatus() {
        const { data } = await supabase
            .from('app_setting')
            .select('key, value')
            .eq('group', 'payments')
            .in('key', [
                'bkash_app_key',
                'rocket_api_key',
                'nagad_merchant_id',
                'bkash_enabled',
                'rocket_enabled',
                'nagad_enabled',
            ]);

        const map = (data || []).reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {});

        return {
            bkash:  !!(map.bkash_app_key  && map.bkash_app_key.trim()),
            rocket: !!(map.rocket_api_key && map.rocket_api_key.trim()),
            nagad:  !!(map.nagad_merchant_id && map.nagad_merchant_id.trim()),
            bkash_enabled:  map.bkash_enabled  === 'true',
            rocket_enabled: map.rocket_enabled === 'true',
            nagad_enabled:  map.nagad_enabled  === 'true',
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // bKash Payment Flow
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Step 1: Get bKash OAuth token
     */
    async _getBkashToken() {
        const settings = await getPaymentSettings([
            'bkash_app_key',
            'bkash_app_secret',
            'bkash_username',
            'bkash_password',
        ]);

        if (!settings.bkash_app_key || !settings.bkash_app_secret) {
            throw new Error('bKash credentials not configured in Settings');
        }

        const body = {
            app_key:    settings.bkash_app_key,
            app_secret: settings.bkash_app_secret,
        };

        const options = {
            hostname: 'tokenized.sandbox.bka.sh',
            path:     '/v1.2.0-beta/tokenized/checkout/token/grant',
            method:   'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept:         'application/json',
                username:       settings.bkash_username || '',
                password:       settings.bkash_password || '',
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, body);
        if (status !== 200 || !resp.id_token) {
            throw new Error(`bKash token error: ${resp.statusMessage || resp.message || 'Unknown error'}`);
        }
        return resp.id_token;
    }

    /**
     * Step 2: Create bKash payment
     * @returns {{ paymentID, bkashURL }}
     */
    async initiateBkashPayment({ amount, billId, callbackURL }) {
        const token = await this._getBkashToken();
        const appKey = await getDecryptedSetting('bkash_app_key');

        const body = {
            mode:              '0011',
            payerReference:    billId,
            callbackURL:       callbackURL || `${process.env.API_BASE_URL}/api/webhooks/bkash`,
            amount:            String(amount),
            currency:          'BDT',
            intent:            'sale',
            merchantInvoiceNumber: `INV-${billId.split('-')[0]}-${Date.now()}`,
        };

        const options = {
            hostname: 'tokenized.sandbox.bka.sh',
            path:     '/v1.2.0-beta/tokenized/checkout/create',
            method:   'POST',
            headers: {
                'Content-Type':  'application/json',
                Accept:          'application/json',
                Authorization:   token,
                'X-APP-Key':     appKey,
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, body);
        if (status !== 200 || resp.statusCode !== '0000') {
            throw new Error(`bKash create payment failed: ${resp.statusMessage || resp.message || 'Unknown error'}`);
        }

        return {
            paymentID: resp.paymentID,
            bkashURL:  resp.bkashURL,
            provider:  'bkash',
        };
    }

    /**
     * Step 3: Execute (confirm) bKash payment
     */
    async executeBkashPayment({ paymentID }) {
        const token = await this._getBkashToken();
        const appKey = await getDecryptedSetting('bkash_app_key');

        const options = {
            hostname: 'tokenized.sandbox.bka.sh',
            path:     '/v1.2.0-beta/tokenized/checkout/execute',
            method:   'POST',
            headers: {
                'Content-Type':  'application/json',
                Accept:          'application/json',
                Authorization:   token,
                'X-APP-Key':     appKey,
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, { paymentID });
        if (status !== 200 || resp.statusCode !== '0000') {
            throw new Error(`bKash execute failed: ${resp.statusMessage || resp.message || 'Unknown error'}`);
        }

        return {
            provider:        'bkash',
            transactionID:   resp.trxID,
            amount:          resp.amount,
            currency:        resp.currency,
            status:          'completed',
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Rocket Payment Flow
    // ────────────────────────────────────────────────────────────────────────

    async _getRocketToken() {
        const settings = await getPaymentSettings(['rocket_api_key', 'rocket_merchant_id']);

        if (!settings.rocket_api_key) {
            throw new Error('Rocket credentials not configured in Settings');
        }
        // Rocket uses API key auth — no OAuth step needed for basic integration
        return settings.rocket_api_key;
    }

    /**
     * Initiate a Rocket (Dutch-Bangla) payment
     */
    async initiateRocketPayment({ amount, billId, callbackURL }) {
        const apiKey = await this._getRocketToken();
        const merchantId = await getDecryptedSetting('rocket_merchant_id');

        const body = {
            merchant_id:   merchantId || '',
            order_id:      `ORD-${billId.split('-')[0]}-${Date.now()}`,
            amount:        String(amount),
            currency:      'BDT',
            desc:          `Restaurant Bill ${billId}`,
            pay_type:      'rocket',
            callback_url:  callbackURL || `${process.env.API_BASE_URL}/api/webhooks/rocket`,
        };

        const bodyStr = JSON.stringify(body);
        const options = {
            hostname: 'api.dbblmobilebankingapi.com',
            path:     '/payment/create',
            method:   'POST',
            headers: {
                'Content-Type':  'application/json',
                Accept:          'application/json',
                'x-api-key':     apiKey,
                'Content-Length': Buffer.byteLength(bodyStr),
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, bodyStr);
        if (status !== 200 && status !== 201) {
            throw new Error(`Rocket payment initiation failed: ${resp.message || 'Unknown error'}`);
        }

        return {
            paymentID:   resp.payment_id || resp.id,
            paymentURL:  resp.payment_url || resp.redirect_url,
            provider:    'rocket',
        };
    }

    async executeRocketPayment({ paymentID }) {
        const apiKey = await this._getRocketToken();

        const bodyStr = JSON.stringify({ payment_id: paymentID });
        const options = {
            hostname: 'api.dbblmobilebankingapi.com',
            path:     '/payment/execute',
            method:   'POST',
            headers: {
                'Content-Type':  'application/json',
                Accept:          'application/json',
                'x-api-key':     apiKey,
                'Content-Length': Buffer.byteLength(bodyStr),
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, bodyStr);
        if (status !== 200) {
            throw new Error(`Rocket execute failed: ${resp.message || 'Unknown error'}`);
        }

        return {
            provider:       'rocket',
            transactionID:  resp.transaction_id || resp.trxID,
            amount:         resp.amount,
            status:         'completed',
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Nagad Payment Flow
    // ────────────────────────────────────────────────────────────────────────

    async _getNagadCredentials() {
        const settings = await getPaymentSettings(['nagad_merchant_id', 'nagad_merchant_key']);
        if (!settings.nagad_merchant_id) {
            throw new Error('Nagad credentials not configured in Settings');
        }
        return settings;
    }

    async initiateNagadPayment({ amount, billId, callbackURL }) {
        const { nagad_merchant_id: merchantId, nagad_merchant_key: merchantKey } = await this._getNagadCredentials();

        const orderId = `ORD-${billId.split('-')[0]}-${Date.now()}`;

        // Nagad requires RSA-signed sensitive data — simplified structure
        const body = {
            merchantId,
            orderId,
            amount:        String(amount),
            currencyCode:  'BDT',
            challenge:     require('crypto').randomBytes(16).toString('hex'),
            merchantCallbackURL: callbackURL || `${process.env.API_BASE_URL}/api/webhooks/nagad`,
        };

        const bodyStr = JSON.stringify(body);
        const options = {
            hostname: 'sandbox.mynagad.com:10080',
            path:     '/remote-payment-gateway-1.0/api/dfs/check-out/initialize/' + merchantId + '/' + orderId,
            method:   'POST',
            headers: {
                'Content-Type':     'application/json',
                Accept:             'application/json',
                'X-KM-Api-Version': 'v-0.2.0',
                'X-KM-IP-V4':       '127.0.0.1',
                'X-KM-Client-Type': 'PC_WEB',
                'X-KM-Signature':   merchantKey || '',
                'Content-Length':   Buffer.byteLength(bodyStr),
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, bodyStr);
        if (status !== 200) {
            throw new Error(`Nagad initiation failed: ${resp.message || 'Unknown error'}`);
        }

        return {
            paymentID:  resp.paymentReferenceId || resp.orderId,
            paymentURL: resp.callBackUrl,
            provider:   'nagad',
        };
    }

    async executeNagadPayment({ paymentID }) {
        const { nagad_merchant_id: merchantId, nagad_merchant_key: merchantKey } = await this._getNagadCredentials();

        const bodyStr = JSON.stringify({ paymentRefId: paymentID });
        const options = {
            hostname: 'sandbox.mynagad.com:10080',
            path:     '/remote-payment-gateway-1.0/api/dfs/check-out/complete/' + paymentID,
            method:   'POST',
            headers: {
                'Content-Type':     'application/json',
                Accept:             'application/json',
                'X-KM-Api-Version': 'v-0.2.0',
                'X-KM-Signature':   merchantKey || '',
                'Content-Length':   Buffer.byteLength(bodyStr),
            },
            timeout: 10000,
        };

        const { status, body: resp } = await httpsRequest(options, bodyStr);
        if (status !== 200) {
            throw new Error(`Nagad execute failed: ${resp.message || 'Unknown error'}`);
        }

        return {
            provider:      'nagad',
            transactionID: resp.issuerPaymentRefNo || resp.paymentRefId,
            amount:        resp.amount,
            status:        'completed',
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // Unified initiate / execute (provider dispatch)
    // ────────────────────────────────────────────────────────────────────────

    async initiatePayment({ provider, amount, billId, callbackURL }) {
        switch (provider) {
            case 'bkash':  return this.initiateBkashPayment({ amount, billId, callbackURL });
            case 'rocket': return this.initiateRocketPayment({ amount, billId, callbackURL });
            case 'nagad':  return this.initiateNagadPayment({ amount, billId, callbackURL });
            default:       throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    async executePayment({ provider, paymentID }) {
        switch (provider) {
            case 'bkash':  return this.executeBkashPayment({ paymentID });
            case 'rocket': return this.executeRocketPayment({ paymentID });
            case 'nagad':  return this.executeNagadPayment({ paymentID });
            default:       throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Webhook Signature Verification
    // ────────────────────────────────────────────────────────────────────────

    async verifyBkashWebhook(headers, body) {
        // bKash sends statusCode in the webhook body — no HMAC in sandbox
        const { statusCode, paymentID } = body;
        if (!paymentID) return { valid: false, error: 'Missing paymentID' };
        // In production, verify X-App-Key header matches stored key
        const storedKey = await getDecryptedSetting('bkash_app_key');
        const headerKey = headers['x-app-key'] || headers['x-bkash-key'] || '';
        const valid = !headerKey || headerKey === storedKey; // allow if header absent (sandbox)
        return { valid, paymentID, status: statusCode === '0000' ? 'completed' : 'failed' };
    }

    async verifyRocketWebhook(headers, body) {
        const crypto = require('crypto');
        const storedKey = await getDecryptedSetting('rocket_api_key');
        const signature = headers['x-rocket-signature'] || headers['x-signature'] || '';
        if (!signature || !storedKey) {
            return { valid: false, error: 'Missing signature or key' };
        }
        const expected = crypto
            .createHmac('sha256', storedKey)
            .update(JSON.stringify(body))
            .digest('hex');
        const valid = signature === expected;
        return {
            valid,
            paymentID:     body.payment_id,
            transactionID: body.transaction_id,
            status:        body.status === 'success' ? 'completed' : 'failed',
        };
    }

    async verifyNagadWebhook(headers, body) {
        // Nagad sends a signed response — verify with merchant key
        const storedKey = await getDecryptedSetting('nagad_merchant_key');
        const signature = headers['x-km-signature'] || '';
        if (!signature || !storedKey) {
            return { valid: false, error: 'Missing signature or merchant key' };
        }
        const crypto = require('crypto');
        const expected = crypto
            .createHmac('sha256', storedKey)
            .update(JSON.stringify(body))
            .digest('hex');
        const valid = signature === expected;
        return {
            valid,
            paymentID:     body.paymentRefId,
            transactionID: body.issuerPaymentRefNo,
            status:        body.status === 'Success' ? 'completed' : 'failed',
        };
    }

    /**
     * Update payment record status in the payments table after webhook verification.
     */
    async recordWebhookPaymentStatus({ provider, referenceNumber, transactionID, status }) {
        const { data, error } = await supabase
            .from('payments')
            .update({
                status,
                reference_number: transactionID || referenceNumber,
                updated_at:       new Date().toISOString(),
            })
            .eq('reference_number', referenceNumber)
            .eq('method', provider)
            .is('deleted_at', null)
            .select('id, bill_id, amount')
            .single();

        if (error) throw new Error(`Failed to update payment record: ${error.message}`);
        return data;
    }
}

module.exports = new PaymentGatewayService();
