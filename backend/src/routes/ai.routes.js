import express from "express";
import {
    getInsights,
    generateInsights,
    getPredictions,
    getRecommendations,
    dismissInsight,
    updateRecommendationStatus,
    getAIDashboard
} from "../controllers/ai.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// AI routes
router.get("/dashboard", getAIDashboard);
router.get("/insights", getInsights);
router.post("/insights/generate", generateInsights);
router.get("/predictions", getPredictions);
router.get("/recommendations", getRecommendations);
router.put("/insights/:id/dismiss", dismissInsight);
router.put("/recommendations/:id", updateRecommendationStatus);

export default router;