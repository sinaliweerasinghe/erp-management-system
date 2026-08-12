import express from "express";
import {
    getInventory,
    getInventoryById,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryStats,
    updateStock
} from "../controllers/inventory.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// Inventory routes
router.get("/", getInventory);
router.get("/stats", getInventoryStats);
router.get("/:id", getInventoryById);
router.post("/", createInventoryItem);
router.put("/:id", updateInventoryItem);
router.put("/:id/stock", updateStock);
router.delete("/:id", deleteInventoryItem);

export default router;