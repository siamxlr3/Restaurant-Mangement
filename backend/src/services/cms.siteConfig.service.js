const { supabase } = require('../config/supabase');
const { uploadImage, deleteImage } = require('../utils/storage');

/**
 * Service for cms_site_config (singleton).
 */
class CmsSiteConfigService {
    async getConfig() {
        const { data, error } = await supabase
            .from('cms_site_config')
            .select('id, brand_name, tagline, logo_url, favicon_url, primary_color, timezone, created_at, updated_at')
            .is('deleted_at', null)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw new Error(`Failed to get site config: ${error.message}`);
        return data;
    }

    async upsertConfig(updateData, logoBuffer, logoName, faviconBuffer, faviconName) {
        const existing = await this.getConfig();
        const updates = { ...updateData };

        if (logoBuffer) {
            if (existing?.logo_key) await deleteImage(existing.logo_key);
            const { imageUrl, imageKey } = await uploadImage(logoBuffer, logoName, 'image/webp');
            updates.logo_url = imageUrl;
            updates.logo_key = imageKey;
        }
        if (faviconBuffer) {
            if (existing?.favicon_key) await deleteImage(existing.favicon_key);
            const { imageUrl, imageKey } = await uploadImage(faviconBuffer, faviconName, 'image/webp');
            updates.favicon_url = imageUrl;
            updates.favicon_key = imageKey;
        }

        if (existing) {
            const { data, error } = await supabase
                .from('cms_site_config')
                .update(updates)
                .eq('id', existing.id)
                .select('id, brand_name, tagline, logo_url, favicon_url, primary_color, timezone, created_at, updated_at')
                .single();
            if (error) throw new Error(`Failed to update site config: ${error.message}`);
            return data;
        } else {
            const { data, error } = await supabase
                .from('cms_site_config')
                .insert([updates])
                .select('id, brand_name, tagline, logo_url, favicon_url, primary_color, timezone, created_at, updated_at')
                .single();
            if (error) throw new Error(`Failed to create site config: ${error.message}`);
            return data;
        }
    }
}

module.exports = new CmsSiteConfigService();
