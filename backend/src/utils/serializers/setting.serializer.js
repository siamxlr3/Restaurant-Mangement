/**
 * Serializer for app_setting objects.
 * Ensures raw encrypted values never leak in API responses.
 */

const { maskSecret } = require('../encryption');

class SettingSerializer {
    /**
     * Map a single setting. Masks value when is_encrypted=true.
     * @param {Object} setting - Raw DB row
     */
    static map(setting) {
        if (!setting) return null;
        return {
            id:           setting.id,
            key:          setting.key,
            value:        setting.is_encrypted
                              ? maskSecret(setting._raw_value || setting.value)
                              : setting.value,
            group:        setting.group,
            label:        setting.label,
            description:  setting.description || null,
            is_encrypted: setting.is_encrypted,
            type:         setting.type,
            created_at:   setting.created_at,
            updated_at:   setting.updated_at,
        };
    }

    /**
     * Map an array of settings.
     */
    static mapMany(settings) {
        if (!Array.isArray(settings)) return [];
        return settings.map(SettingSerializer.map);
    }

    /**
     * Group settings by their "group" field.
     * Returns { general: [...], payments: [...], ... }
     */
    static mapGrouped(settings) {
        if (!Array.isArray(settings)) return {};
        return settings.reduce((acc, s) => {
            const g = s.group;
            if (!acc[g]) acc[g] = [];
            acc[g].push(SettingSerializer.map(s));
            return acc;
        }, {});
    }
}

module.exports = SettingSerializer;
