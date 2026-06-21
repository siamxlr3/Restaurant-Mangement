const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');
const { uploadImage, deleteImage } = require('../utils/storage');

/**
 * Service for managing staff.
 */
class StaffService {
    /**
     * Create a new staff member.
     * @param {Object} staffData - The staff details.
     * @param {Buffer} [imageBuffer] - Optional image buffer.
     * @param {string} [imageName] - Optional image file name.
     */
    async createStaff(staffData, imageBuffer, imageName) {
        const { name, phone, role, pin, is_active } = staffData;

        // Hash the PIN
        const pin_hash = await bcrypt.hash(pin, 10);

        let imageUrl = null;
        let imageKey = null;

        // Handle image upload if provided
        if (imageBuffer) {
            const uploadResult = await uploadImage(imageBuffer, imageName, 'image/webp');
            imageUrl = uploadResult.imageUrl;
            imageKey = uploadResult.imageKey;
        }

        // Check for existing staff with same phone (duplicate check)
        const { data: existingStaff, error: checkError } = await supabase
            .from('staff')
            .select('id')
            .eq('phone', phone)
            .is('deleted_at', null)
            .maybeSingle();

        if (checkError) {
            throw new Error(`Error checking phone uniqueness: ${checkError.message}`);
        }

        if (existingStaff) {
            throw new Error('A staff member with this phone number already exists');
        }

        const { data, error } = await supabase
            .from('staff')
            .insert([
                {
                    name,
                    phone,
                    role,
                    pin_hash,
                    is_active: is_active !== undefined ? is_active : true,
                    image_url: imageUrl,
                    image_key: imageKey,
                },
            ])
            .select('id, name, phone, role, is_active, image_url, created_at, updated_at')
            .single();

        if (error) {
            // Clean up image if DB insert fails
            if (imageKey) await deleteImage(imageKey);
            
            // Handle unique constraint violation specifically if it somehow passes our check
            if (error.code === '23505') {
                throw new Error('A staff member with this phone number already exists');
            }

            throw new Error(`Failed to create staff: ${error.message}`);
        }

        return data;
    }

    /**
     * Get a list of staff with pagination, search, and filtering.
     */
    async listStaff(query) {
        const {
            page = 1,
            per_page = 20,
            search,
            status,
            from_date,
            to_date,
        } = query;

        const limit = Math.min(parseInt(per_page), 100);
        const offset = (parseInt(page) - 1) * limit;

        let supabaseQuery = supabase
            .from('staff')
            .select('id, name, phone, role, is_active, image_url, created_at, updated_at', { count: 'exact' })
            .is('deleted_at', null);

        // Search
        if (search) {
            supabaseQuery = supabaseQuery.ilike('name', `%${search}%`);
        }

        // Filter by status (is_active)
        if (status === 'active') {
            supabaseQuery = supabaseQuery.eq('is_active', true);
        } else if (status === 'inactive') {
            supabaseQuery = supabaseQuery.eq('is_active', false);
        }

        // Date range
        if (from_date && to_date) {
            supabaseQuery = supabaseQuery.filter('created_at', 'gte', from_date);
            supabaseQuery = supabaseQuery.filter('created_at', 'lte', `${to_date}T23:59:59Z`);
        }

        // Pagination & Sorting
        supabaseQuery = supabaseQuery
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        const { data, error, count } = await supabaseQuery;

        if (error) {
            throw new Error(`Failed to list staff: ${error.message}`);
        }

        return {
            items: data,
            total: count,
            page: parseInt(page),
            per_page: limit,
            total_pages: Math.ceil(count / limit),
        };
    }

    /**
     * Get staff by ID.
     */
    async getStaffById(id) {
        const { data, error } = await supabase
            .from('staff')
            .select('id, name, phone, role, is_active, image_url, created_at, updated_at, image_key')
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) {
            throw new Error(`Staff not found: ${error.message}`);
        }

        return data;
    }

    /**
     * Update staff details.
     */
    async updateStaff(id, updateData, imageBuffer, imageName) {
        const { name, phone, role, pin, is_active } = updateData;

        // Fetch existing staff to check for current image
        const existingStaff = await this.getStaffById(id);

        const updates = {};
        if (name) updates.name = name;
        if (phone) updates.phone = phone;
        if (role) updates.role = role;
        if (is_active !== undefined) updates.is_active = is_active;
        if (pin) updates.pin_hash = await bcrypt.hash(pin, 10);

        // Handle image update
        if (imageBuffer) {
            // Delete old image if it exists
            if (existingStaff.image_key) {
                await deleteImage(existingStaff.image_key);
            }

            const uploadResult = await uploadImage(imageBuffer, imageName, 'image/webp');
            updates.image_url = uploadResult.imageUrl;
            updates.image_key = uploadResult.imageKey;
        }

        const { data, error } = await supabase
            .from('staff')
            .update(updates)
            .eq('id', id)
            .select('id, name, phone, role, is_active, image_url, created_at, updated_at')
            .single();

        if (error) {
            throw new Error(`Failed to update staff: ${error.message}`);
        }

        return data;
    }

    /**
     * Soft delete staff.
     */
    async deleteStaff(id) {
        const { data, error } = await supabase
            .from('staff')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            throw new Error(`Failed to delete staff: ${error.message}`);
        }

        return data;
    }
}

module.exports = new StaffService();
