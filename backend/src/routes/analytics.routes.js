import express from "express";
import {
    getAnalyticsDashboard,
    getKPIs,
    getChartData,
    getTopProducts,
    getTopCustomers,
    getInsights
} from "../controllers/analytics.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Analytics routes
router.get("/dashboard", getAnalyticsDashboard);
router.get("/kpis", getKPIs);
router.get("/chart", getChartData);
router.get("/top-products", getTopProducts);
router.get("/top-customers", getTopCustomers);
router.get("/insights", getInsights);

export default router;