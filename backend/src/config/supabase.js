const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL and Key are required in environment variables');
}

// Client for general use (anon key)
const supabase = createClient(supabaseUrl, supabaseKey);

// Client for administrative tasks (service role key)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
    supabase,
    supabaseAdmin,
};
