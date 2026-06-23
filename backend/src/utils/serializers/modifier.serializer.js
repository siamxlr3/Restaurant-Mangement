/**
 * Serializer for Menu Modifier
 */
const serializeModifier = (modifier) => {
    if (!modifier) return null;

    return {
        id: modifier.id,
        item_id: modifier.item_id,
        menu_item: modifier.menu_item ? { name: modifier.menu_item.name } : null,
        name: modifier.name,
        extra_price: parseFloat(modifier.extra_price),
        is_required: modifier.is_required,
        created_at: modifier.created_at,
        updated_at: modifier.updated_at,
    };
};

const serializeModifierList = (modifiers) => {
    if (!Array.isArray(modifiers)) return [];
    return modifiers.map(serializeModifier);
};

module.exports = {
    serializeModifier,
    serializeModifierList,
};
