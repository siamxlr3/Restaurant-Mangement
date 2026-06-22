const { serializeVariantList } = require('./variant.serializer');
const { serializeModifierList } = require('./modifier.serializer');

/**
 * Serializer for Menu Item
 */
const serializeItem = (item) => {
    if (!item) return null;

    return {
        id: item.id,
        category_id: item.category_id,
        category_name: item.menu_category?.name || null,
        name: item.name,
        description: item.description,
        base_price: parseFloat(item.base_price),
        food_cost: parseFloat(item.food_cost),
        is_available: item.is_available,
        image_url: item.image_url,
        order_count_30d: item.order_count_30d,
        revenue_30d: parseFloat(item.revenue_30d || 0),
        variants: serializeVariantList(item.menu_variant),
        modifiers: serializeModifierList(item.menu_modifier),
        created_at: item.created_at,
        updated_at: item.updated_at,
    };
};

const serializeItemList = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(serializeItem);
};

module.exports = {
    serializeItem,
    serializeItemList,
};
