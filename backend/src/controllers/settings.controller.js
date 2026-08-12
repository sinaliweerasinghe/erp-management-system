import SettingsModel from '../models/settings.model.js';
import pool from '../config/db.js';

// Helper to get userId from req.user
const getUserId = (user) => {
  return user.userId || user.id;
};

// Get all settings
export const getSettings = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        console.log('Getting settings for user:', userId);
        console.log('Decoded user:', req.user);
        
        const settings = await SettingsModel.getByUserId(userId);
        
        if (!settings) {
            // Create default settings if none exist
            const newSettings = await SettingsModel.upsert(userId, {});
            return res.json(newSettings);
        }
        
        res.json(settings);
    } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ error: "Failed to fetch settings: " + error.message });
    }
};

// Update all settings
export const updateAllSettings = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const settingsData = req.body;
        
        const settings = await SettingsModel.upsert(userId, settingsData);
        res.json({
            message: "Settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({ error: "Failed to update settings: " + error.message });
    }
};

// Update profile settings
export const updateProfile = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const profileData = req.body;
        
        const settings = await SettingsModel.updateProfile(userId, profileData);
        res.json({
            message: "Profile updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ error: "Failed to update profile: " + error.message });
    }
};

// Update notification settings
export const updateNotifications = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const notificationData = req.body;
        
        const settings = await SettingsModel.updateNotifications(userId, notificationData);
        res.json({
            message: "Notification settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update notifications error:", error);
        res.status(500).json({ error: "Failed to update notification settings: " + error.message });
    }
};

// Update security settings
export const updateSecurity = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const securityData = req.body;
        
        const settings = await SettingsModel.updateSecurity(userId, securityData);
        res.json({
            message: "Security settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update security error:", error);
        res.status(500).json({ error: "Failed to update security settings: " + error.message });
    }
};

// Update appearance settings
export const updateAppearance = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const appearanceData = req.body;
        
        const settings = await SettingsModel.updateAppearance(userId, appearanceData);
        res.json({
            message: "Appearance settings updated successfully",
            settings
        });
    } catch (error) {
        console.error("Update appearance error:", error);
        res.status(500).json({ error: "Failed to update appearance settings: " + error.message });
    }
};

// Update password
export const updatePassword = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current password and new password are required" });
        }
        
        // Get user with password
        const [users] = await pool.query(
            `SELECT password FROM users WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Verify current password
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(currentPassword, users[0].password);
        
        if (!isValid) {
            return res.status(401).json({ error: "Current password is incorrect" });
        }
        
        await SettingsModel.updatePassword(userId, newPassword);
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Update password error:", error);
        res.status(500).json({ error: "Failed to update password: " + error.message });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const userId = getUserId(req.user);
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: "Password is required to delete account" });
        }
        
        // Verify password
        const [users] = await pool.query(
            `SELECT password FROM users WHERE id = ?`,
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const bcrypt = await import('bcryptjs');
        const isValid = await bcrypt.compare(password, users[0].password);
        
        if (!isValid) {
            return res.status(401).json({ error: "Password is incorrect" });
        }
        
        await SettingsModel.deleteAccount(userId);
        res.json({ message: "Account deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        res.status(500).json({ error: "Failed to delete account: " + error.message });
    }
};