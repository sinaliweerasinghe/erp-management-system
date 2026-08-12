import InventoryModel from '../models/inventory.model.js';

// Get all inventory items with filters
export const getInventory = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { search, category, status, sortBy, sortOrder } = req.query;
        const inventory = await InventoryModel.findAll(companyId, { 
            search, 
            category, 
            status,
            sortBy,
            sortOrder
        });
        res.json(inventory);
    } catch (error) {
        console.error("Get inventory error:", error);
        res.status(500).json({ error: "Failed to fetch inventory" });
    }
};

// Get inventory item by ID
export const getInventoryById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const item = await InventoryModel.findById(companyId, req.params.id);
        if (!item) {
            return res.status(404).json({ error: "Inventory item not found" });
        }
        res.json(item);
    } catch (error) {
        console.error("Get inventory item error:", error);
        res.status(500).json({ error: "Failed to fetch inventory item" });
    }
};

// Create new inventory item
export const createInventoryItem = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log("Creating inventory item for company:", companyId);
        console.log("Item data:", req.body);
        
        // Validate required fields
        const required = ['name', 'sku', 'category'];
        const missing = required.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missing.join(', ')}` 
            });
        }

        // Check if SKU already exists for this company
        const existingItem = await InventoryModel.findBySku(companyId, req.body.sku);
        if (existingItem) {
            return res.status(400).json({ error: "SKU already exists for this company" });
        }

        const itemId = await InventoryModel.create(companyId, req.body);
        const item = await InventoryModel.findById(companyId, itemId);

        res.status(201).json({
            message: "Inventory item created successfully",
            item
        });
    } catch (error) {
        console.error("Create inventory error:", error);
        res.status(500).json({ 
            error: "Failed to create inventory item",
            details: error.message 
        });
    }
};

// Update inventory item
export const updateInventoryItem = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const updated = await InventoryModel.update(companyId, req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: "Inventory item not found" });
        }

        const item = await InventoryModel.findById(companyId, req.params.id);
        res.json({
            message: "Inventory item updated successfully",
            item
        });
    } catch (error) {
        console.error("Update inventory error:", error);
        res.status(500).json({ error: "Failed to update inventory item" });
    }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const deleted = await InventoryModel.delete(companyId, req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Inventory item not found" });
        }
        res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
        console.error("Delete inventory error:", error);
        res.status(500).json({ error: "Failed to delete inventory item" });
    }
};

// Get inventory stats
export const getInventoryStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const stats = await InventoryModel.getStats(companyId);
        res.json(stats);
    } catch (error) {
        console.error("Get inventory stats error:", error);
        res.status(500).json({ error: "Failed to fetch inventory stats" });
    }
};

// Update stock quantity
export const updateStock = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { quantity } = req.body;
        
        if (quantity === undefined || quantity < 0) {
            return res.status(400).json({ error: "Valid quantity is required" });
        }

        const updated = await InventoryModel.updateStock(companyId, req.params.id, quantity);
        if (!updated) {
            return res.status(404).json({ error: "Inventory item not found" });
        }

        const item = await InventoryModel.findById(companyId, req.params.id);
        res.json({
            message: "Stock updated successfully",
            item
        });
    } catch (error) {
        console.error("Update stock error:", error);
        res.status(500).json({ error: "Failed to update stock" });
    }
};