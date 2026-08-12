import express from "express";
import {
    getSettings,
    updateAllSettings,
    updateProfile,
    updateNotifications,
    updateSecurity,
    updateAppearance,
    updatePassword,
    deleteAccount
} from "../controllers/settings.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Settings routes
router.get("/", getSettings);
router.put("/", updateAllSettings);
router.put("/profile", updateProfile);
router.put("/notifications", updateNotifications);
router.put("/security", updateSecurity);
router.put("/appearance", updateAppearance);
router.put("/password", updatePassword);
router.delete("/account", deleteAccount);

export default router;