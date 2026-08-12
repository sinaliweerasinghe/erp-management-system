import OrderModel from '../models/order.model.js';

// Get all orders with filters
export const getOrders = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { search, status, priority, timeframe, sortBy, sortOrder } = req.query;
        const orders = await OrderModel.findAll(companyId, { 
            search, 
            status, 
            priority,
            timeframe,
            sortBy,
            sortOrder
        });
        res.json(orders);
    } catch (error) {
        console.error("Get orders error:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
    }
};

// Get order by ID
export const getOrderById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const order = await OrderModel.findById(companyId, req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json(order);
    } catch (error) {
        console.error("Get order error:", error);
        res.status(500).json({ error: "Failed to fetch order" });
    }
};

// Create new order
export const createOrder = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log("Creating order for company:", companyId);
        console.log("Order data:", req.body);
        
        // Validate required fields
        const required = ['order_id', 'customer_name', 'customer_email', 'items', 'total'];
        const missing = required.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missing.join(', ')}` 
            });
        }

        // Check if order_id already exists for this company
        const existingOrder = await OrderModel.findByOrderId(companyId, req.body.order_id);
        if (existingOrder) {
            return res.status(400).json({ error: "Order ID already exists" });
        }

        const orderId = await OrderModel.create(companyId, req.body);
        const order = await OrderModel.findById(companyId, orderId);

        res.status(201).json({
            message: "Order created successfully",
            order
        });
    } catch (error) {
        console.error("Create order error:", error);
        res.status(500).json({ 
            error: "Failed to create order",
            details: error.message 
        });
    }
};

// Update order
export const updateOrder = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const updated = await OrderModel.update(companyId, req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: "Order not found" });
        }

        const order = await OrderModel.findById(companyId, req.params.id);
        res.json({
            message: "Order updated successfully",
            order
        });
    } catch (error) {
        console.error("Update order error:", error);
        res.status(500).json({ error: "Failed to update order" });
    }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const updated = await OrderModel.updateStatus(companyId, req.params.id, status);
        if (!updated) {
            return res.status(404).json({ error: "Order not found" });
        }

        const order = await OrderModel.findById(companyId, req.params.id);
        res.json({
            message: "Order status updated successfully",
            order
        });
    } catch (error) {
        console.error("Update status error:", error);
        res.status(500).json({ error: "Failed to update order status" });
    }
};

// Delete order
export const deleteOrder = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const deleted = await OrderModel.delete(companyId, req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Order not found" });
        }
        res.json({ message: "Order deleted successfully" });
    } catch (error) {
        console.error("Delete order error:", error);
        res.status(500).json({ error: "Failed to delete order" });
    }
};

// Get order stats
export const getOrderStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const stats = await OrderModel.getStats(companyId);
        res.json(stats);
    } catch (error) {
        console.error("Get order stats error:", error);
        res.status(500).json({ error: "Failed to fetch order stats" });
    }
};