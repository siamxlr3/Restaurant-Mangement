/**
 * Serializer for Menu Category
 */
const serializeCategory = (category) => {
    if (!category) return null;
    
    return {
        id: category.id,
        name: category.name,
        sort_order: category.sort_order,
        is_active: category.is_active,
        created_at: category.created_at,
        updated_at: category.updated_at,
    };
};

const serializeCategoryList = (categories) => {
    if (!Array.isArray(categories)) return [];
    return categories.map(serializeCategory);
};

module.exports = {
    serializeCategory,
    serializeCategoryList,
};
