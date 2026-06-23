/**
 * Serializer for Menu Variant
 */
const serializeVariant = (variant) => {
    if (!variant) return null;

    return {
        id: variant.id,
        item_id: variant.item_id,
        menu_item: variant.menu_item ? { name: variant.menu_item.name } : null,
        label: variant.label,
        extra_price: parseFloat(variant.extra_price),
        created_at: variant.created_at,
        updated_at: variant.updated_at,
    };
};

const serializeVariantList = (variants) => {
    if (!Array.isArray(variants)) return [];
    return variants.map(serializeVariant);
};

module.exports = {
    serializeVariant,
    serializeVariantList,
};
