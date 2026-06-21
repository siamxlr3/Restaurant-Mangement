const sharp = require('sharp');
const { supabaseAdmin } = require('../config/supabase');

const BUCKET_NAME = 'menu-images';

/**
 * Upload an image to Supabase Storage after processing it with sharp.
 * @param {Buffer} fileBuffer - The buffer of the image file.
 * @param {string} fileName - The name of the file.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {Promise<{ imageUrl: string, imageKey: string }>}
 */
const uploadImage = async (fileBuffer, fileName, mimeType) => {
    // Generate unique key
    const timestamp = Date.now();
    const fileExtension = '.webp';
    const imageKey = `staff/${timestamp}-${fileName.split('.')[0]}${fileExtension}`;

    // Process image: resize and convert to webp
    const processedBuffer = await sharp(fileBuffer)
        .resize(800, 800, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(imageKey, processedBuffer, {
            contentType: 'image/webp',
            upsert: true,
        });

    if (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(imageKey);

    return {
        imageUrl: publicUrl,
        imageKey: data.path,
    };
};

/**
 * Delete an image from Supabase Storage.
 * @param {string} imageKey - The path to the image in the bucket.
 */
const deleteImage = async (imageKey) => {
    if (!imageKey) return;

    const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([imageKey]);

    if (error) {
        console.error(`Failed to delete image from storage: ${error.message}`);
        // We won't throw here to avoid failing the main operation if image cleanup fails
    }
};

module.exports = {
    uploadImage,
    deleteImage,
};
