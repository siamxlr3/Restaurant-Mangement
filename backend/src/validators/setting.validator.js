const { z } = require('zod');

// Single setting item schema
const settingItemSchema = z.object({
    key: z
        .string({ required_error: 'Setting key is required' })
        .min(1, 'Key cannot be empty')
        .max(100, 'Key too long')
        .regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
    value: z.string().nullable().optional().default(''),
    label: z
        .string({ required_error: 'Label is required' })
        .min(1, 'Label cannot be empty')
        .max(150),
    description: z.string().max(500).optional().nullable(),
    is_encrypted: z.boolean().optional().default(false),
    type: z.enum(['text', 'password', 'boolean', 'number']).optional().default('text'),
});

// Body for POST /settings/:group
const upsertGroupSchema = z.object({
    settings: z
        .array(settingItemSchema)
        .min(1, 'At least one setting is required')
        .max(50, 'Too many settings in a single request'),
});

// Body for POST /settings/test-connection
const testConnectionSchema = z.object({
    provider: z
        .string({ required_error: 'Provider is required' })
        .min(1)
        .max(50),
    key: z
        .string({ required_error: 'API key is required' })
        .min(1, 'API key cannot be empty'),
});

module.exports = {
    upsertGroupSchema,
    testConnectionSchema,
};
