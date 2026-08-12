import pool from '../config/db.js';

class SettingsModel {
    // Get settings by user ID
    static async getByUserId(userId) {
        try {
            console.log('Getting settings for userId:', userId);
            
            const [rows] = await pool.query(
                `SELECT * FROM user_settings WHERE user_id = ?`,
                [userId]
            );
            
            console.log('Settings found:', rows.length > 0 ? 'Yes' : 'No');
            
            // If no settings exist, create default ones
            if (rows.length === 0) {
                console.log('Creating default settings for user:', userId);
                
                // Get user email
                const [userRows] = await pool.query(
                    `SELECT email FROM users WHERE id = ?`,
                    [userId]
                );
                
                if (userRows.length === 0) {
                    console.error('User not found:', userId);
                    return null;
                }
                
                // Insert default settings
                const insertResult = await pool.query(
                    `INSERT INTO user_settings (user_id, full_name, email) VALUES (?, ?, ?)`,
                    [userId, userRows[0].email, userRows[0].email]
                );
                
                console.log('Default settings created, insertId:', insertResult[0].insertId);
                
                // Fetch the newly created settings
                const [newRows] = await pool.query(
                    `SELECT * FROM user_settings WHERE user_id = ?`,
                    [userId]
                );
                return newRows[0];
            }
            
            return rows[0];
        } catch (error) {
            console.error("Get settings error:", error);
            throw error;
        }
    }

    // Update all settings (keep your existing upsert method)
    static async upsert(userId, settingsData) {
        try {
            console.log('Upserting settings for user:', userId);
            
            // Check if settings exist
            const [existing] = await pool.query(
                `SELECT id FROM user_settings WHERE user_id = ?`,
                [userId]
            );

            const {
                full_name,
                email,
                phone,
                location,
                bio,
                avatar,
                email_alerts,
                push_notifications,
                order_updates,
                inventory_alerts,
                marketing_emails,
                weekly_reports,
                two_factor_auth,
                session_timeout,
                login_alerts,
                theme,
                compact_view,
                animations
            } = settingsData;

            if (existing.length > 0) {
                // Update existing settings
                const query = `
                    UPDATE user_settings SET
                        full_name = ?,
                        email = ?,
                        phone = ?,
                        location = ?,
                        bio = ?,
                        avatar = ?,
                        email_alerts = ?,
                        push_notifications = ?,
                        order_updates = ?,
                        inventory_alerts = ?,
                        marketing_emails = ?,
                        weekly_reports = ?,
                        two_factor_auth = ?,
                        session_timeout = ?,
                        login_alerts = ?,
                        theme = ?,
                        compact_view = ?,
                        animations = ?
                    WHERE user_id = ?
                `;
                const values = [
                    full_name || null,
                    email || null,
                    phone || null,
                    location || null,
                    bio || null,
                    avatar || null,
                    email_alerts !== undefined ? (email_alerts ? 1 : 0) : 1,
                    push_notifications !== undefined ? (push_notifications ? 1 : 0) : 1,
                    order_updates !== undefined ? (order_updates ? 1 : 0) : 1,
                    inventory_alerts !== undefined ? (inventory_alerts ? 1 : 0) : 0,
                    marketing_emails !== undefined ? (marketing_emails ? 1 : 0) : 0,
                    weekly_reports !== undefined ? (weekly_reports ? 1 : 0) : 1,
                    two_factor_auth !== undefined ? (two_factor_auth ? 1 : 0) : 0,
                    session_timeout || '30',
                    login_alerts !== undefined ? (login_alerts ? 1 : 0) : 1,
                    theme || 'light',
                    compact_view !== undefined ? (compact_view ? 1 : 0) : 0,
                    animations !== undefined ? (animations ? 1 : 0) : 1,
                    userId
                ];
                await pool.query(query, values);
            } else {
                // Insert new settings
                const query = `
                    INSERT INTO user_settings (
                        user_id, full_name, email, phone, location, bio, avatar,
                        email_alerts, push_notifications, order_updates,
                        inventory_alerts, marketing_emails, weekly_reports,
                        two_factor_auth, session_timeout, login_alerts,
                        theme, compact_view, animations
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    userId,
                    full_name || null,
                    email || null,
                    phone || null,
                    location || null,
                    bio || null,
                    avatar || null,
                    email_alerts !== undefined ? (email_alerts ? 1 : 0) : 1,
                    push_notifications !== undefined ? (push_notifications ? 1 : 0) : 1,
                    order_updates !== undefined ? (order_updates ? 1 : 0) : 1,
                    inventory_alerts !== undefined ? (inventory_alerts ? 1 : 0) : 0,
                    marketing_emails !== undefined ? (marketing_emails ? 1 : 0) : 0,
                    weekly_reports !== undefined ? (weekly_reports ? 1 : 0) : 1,
                    two_factor_auth !== undefined ? (two_factor_auth ? 1 : 0) : 0,
                    session_timeout || '30',
                    login_alerts !== undefined ? (login_alerts ? 1 : 0) : 1,
                    theme || 'light',
                    compact_view !== undefined ? (compact_view ? 1 : 0) : 0,
                    animations !== undefined ? (animations ? 1 : 0) : 1
                ];
                await pool.query(query, values);
            }

            return this.getByUserId(userId);
        } catch (error) {
            console.error("Upsert settings error:", error);
            throw error;
        }
    }

    // Keep your other methods (updateProfile, updateNotifications, etc.)
    // ... (copy the rest from your existing file)
}

export default SettingsModel;