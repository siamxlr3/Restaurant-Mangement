const { supabase } = require('../config/supabase');

/**
 * Fetch test data from Supabase
 */
const fetchTestData = async () => {
    // For now, returning dummy data since table might not exist
    // In real app: const { data, error } = await supabase.from('test').select('*');
    return [
        { id: 1, name: 'Sample Item 1' },
        { id: 2, name: 'Sample Item 2' },
    ];
};

/**
 * Save test data to Supabase
 */
const saveTestData = async (name) => {
    // In real app: const { data, error } = await supabase.from('test').insert([{ name }]).select();
    return { id: Date.now(), name };
};

module.exports = {
    fetchTestData,
    saveTestData,
};
