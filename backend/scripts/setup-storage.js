const { supabaseAdmin } = require('../src/config/supabase');

async function setupStorage() {
    console.log('Checking storage buckets...');
    
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
        console.error('Error listing buckets:', listError.message);
        return;
    }
    
    const requiredBuckets = ['menu-items', 'menu-images'];
    
    for (const bucketName of requiredBuckets) {
        const bucketExists = buckets.find(b => b.name === bucketName);
        
        if (!bucketExists) {
            console.log(`Creating ${bucketName} bucket...`);
            const { data, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
                fileSizeLimit: 5242880 // 5MB
            });
            
            if (createError) {
                console.error(`Error creating bucket ${bucketName}:`, createError.message);
            } else {
                console.log(`Bucket "${bucketName}" created successfully!`);
            }
        } else {
            console.log(`Bucket "${bucketName}" already exists.`);
        }
    }
}

setupStorage();
