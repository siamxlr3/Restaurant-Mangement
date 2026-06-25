const { supabaseAdmin, supabase } = require('../config/supabase');

/**
 * Service for AI-driven Upsell Engine.
 * Handles co-occurrence matrix calculation and recommendations.
 */
class UpsellService {
    /**
     * Compute item co-occurrence matrix from last 90 days of order_item data.
     * Triggers the stored procedure compute_upsell_matrix().
     */
    async computeCoOccurrenceMatrix() {
        const { error } = await supabaseAdmin.rpc('compute_upsell_matrix');

        if (error) {
            console.error('[UpsellService] Error computing matrix:', error.message);
            throw new Error(`Failed to compute co-occurrence matrix: ${error.message}`);
        }

        console.log('[UpsellService] Co-occurrence matrix updated successfully');
        return { success: true, message: 'Matrix updated' };
    }

    /**
     * Get top recommendations for a specific item.
     * @param {string} itemId - The ID of the item to get recommendations for.
     * @param {number} limit - Number of recommendations to return (default 3).
     */
    async getRecommendations(itemId, limit = 3) {
        if (!itemId) throw new Error('Item ID is required');

        // Fetch top pairs where item_a is the given item
        // Join with menu_item to get item details
        const { data, error } = await supabase
            .from('upsell_pair')
            .select(`
                item_b_id,
                confidence,
                co_order_count,
                menu_item!upsell_pair_item_b_id_fkey (
                    id,
                    name,
                    base_price,
                    image_url
                )
            `)
            .eq('item_a_id', itemId)
            .order('confidence', { ascending: false })
            .limit(limit);

        if (error) {
            throw new Error(`Failed to fetch recommendations: ${error.message}`);
        }

        // Standardize output
        return (data || []).map(row => ({
            itemId: row.item_b_id,
            confidence: row.confidence,
            coOrderCount: row.co_order_count,
            ...row.menu_item
        }));
    }

    /**
     * Get all upsell pairs for management.
     */
    async getAllPairs(filters = {}) {
        const { page = 1, per_page = 20, search } = filters;
        const limit = Math.min(per_page, 100);
        const offset = (page - 1) * limit;

        let query = supabase
            .from('upsell_pair')
            .select(`
                id,
                item_a:menu_item!upsell_pair_item_a_id_fkey(name),
                item_b:menu_item!upsell_pair_item_b_id_fkey(name),
                co_order_count,
                confidence,
                last_computed
            `, { count: 'exact' });

        if (search) {
            // Note: complex searching on joined fields might require multiple queries or RPC
            // For now, we filter by confidence threshold or co_order_count if needed
        }

        const { data, error, count } = await query
            .order('confidence', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw new Error(`Failed to fetch pairs: ${error.message}`);

        return {
            data,
            meta: {
                page: parseInt(page),
                per_page: limit,
                total: count,
                total_pages: Math.ceil(count / limit)
            }
        };
    }
}

module.exports = new UpsellService();
