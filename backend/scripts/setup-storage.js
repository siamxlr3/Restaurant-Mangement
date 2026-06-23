const { supabaseAdmin } = require('../src/config/supabase');

async function setupStorage() {
    console.log('Checking for menu-items bucket...');
    
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
        console.error('Error listing buckets:', listError.message);
        return;
    }
    
    const bucketExists = buckets.find(b => b.name === 'menu-items');
    
    if (!bucketExists) {
        console.log('Creating menu-items bucket...');
        const { data, error: createError } = await supabaseAdmin.storage.createBucket('menu-items', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
            console.error('Error creating bucket:', createError.message);
        } else {
            console.log('Bucket "menu-items" created successfully!');
        }
    } else {
        console.log('Bucket "menu-items" already exists.');
    }
}

setupStorage();
