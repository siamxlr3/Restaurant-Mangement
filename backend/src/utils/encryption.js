/**
 * Encryption Utility — AES-256-GCM
 *
 * Uses NODE_ENV APP_SECRET_KEY (32-byte hex string from .env).
 * All encrypt/decrypt operations are synchronous (crypto built-in).
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;     // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;    // 128-bit auth tag

function getKey() {
    const hexKey = process.env.APP_SECRET_KEY;
    if (!hexKey || hexKey.length < 64) {
        throw new Error(
            'APP_SECRET_KEY must be a 64-character hex string (32 bytes). ' +
            'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
    }
    return Buffer.from(hexKey.slice(0, 64), 'hex');
}

/**
 * Encrypt a plaintext string.
 * @param   {string} plaintext
 * @returns {string} base64-encoded payload: iv:tag:ciphertext
 */
function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) return plaintext;
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

    const encrypted = Buffer.concat([
        cipher.update(String(plaintext), 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Encode as: base64(iv):base64(tag):base64(ciphertext)
    return [
        iv.toString('base64'),
        tag.toString('base64'),
        encrypted.toString('base64'),
    ].join(':');
}

/**
 * Decrypt a previously encrypted payload.
 * @param   {string} payload  iv:tag:ciphertext (base64)
 * @returns {string} plaintext
 */
function decrypt(payload) {
    if (!payload) return payload;
    const key = getKey();
    const parts = payload.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted payload format.');
    }

    const iv         = Buffer.from(parts[0], 'base64');
    const tag        = Buffer.from(parts[1], 'base64');
    const ciphertext = Buffer.from(parts[2], 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]);

    return decrypted.toString('utf8');
}

/**
 * Mask a sensitive value for safe API response display.
 * Shows first 3 chars and last 3 chars if long enough, otherwise full mask.
 *
 * @param   {string} value  The raw or already-masked value
 * @returns {string}        e.g. "sk-••••••••" or "••••••••"
 */
function maskSecret(value) {
    if (!value || value.length < 8) return '••••••••';
    // If it already looks masked, return as-is
    if (value.includes('•')) return value;
    const prefix = value.slice(0, 3);
    return `${prefix}${'•'.repeat(8)}`;
}

module.exports = { encrypt, decrypt, maskSecret };
