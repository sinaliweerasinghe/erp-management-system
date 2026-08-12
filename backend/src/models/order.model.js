import pool from '../config/db.js';

class OrderModel {
    // Get all orders with filters (company-specific)
    static async findAll(companyId, filters = {}) {
        let query = "SELECT * FROM orders WHERE company_id = ?";
        const params = [companyId];

        if (filters.status && filters.status !== "all") {
            query += " AND status = ?";
            params.push(filters.status);
        }

        if (filters.priority && filters.priority !== "all") {
            query += " AND priority = ?";
            params.push(filters.priority);
        }

        if (filters.search) {
            query += " AND (order_id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ?)";
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Timeframe filter
        if (filters.timeframe && filters.timeframe !== "all") {
            let days = 7;
            if (filters.timeframe === "month") days = 30;
            if (filters.timeframe === "quarter") days = 90;
            query += " AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)";
            params.push(days);
        }

        // Sorting
        if (filters.sortBy) {
            const validSortFields = ['created_at', 'total', 'customer_name'];
            if (validSortFields.includes(filters.sortBy)) {
                const sortField = filters.sortBy === 'created_at' ? 'created_at' : 
                                 filters.sortBy === 'customer_name' ? 'customer_name' : 'total';
                query += ` ORDER BY ${sortField} ${filters.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
            }
        } else {
            query += " ORDER BY created_at DESC";
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Get order by order_id (company-specific)
    static async findByOrderId(companyId, orderId) {
        const [rows] = await pool.query(
            "SELECT * FROM orders WHERE company_id = ? AND order_id = ?",
            [companyId, orderId]
        );
        return rows[0];
    }

    // Get order by ID (company-specific)
    static async findById(companyId, id) {
        const [rows] = await pool.query(
            "SELECT * FROM orders WHERE company_id = ? AND id = ?",
            [companyId, id]
        );
        return rows[0];
    }

    // Create new order
    static async create(companyId, orderData) {
        try {
            const {
                order_id,
                customer_name,
                customer_email,
                customer_avatar,
                customer_tier = 'Bronze',
                items,
                total,
                status = 'pending',
                priority = 'medium',
                payment_method,
                shipping_address,
                tracking_number,
                estimated_delivery,
                notes
            } = orderData;

            // Validate required fields
            if (!order_id || !customer_name || !customer_email || !items || !total) {
                throw new Error("Missing required fields: order_id, customer_name, customer_email, items, total");
            }

            // Format date if provided
            let formattedDate = null;
            if (estimated_delivery) {
                formattedDate = new Date(estimated_delivery).toISOString().split('T')[0];
            }

            const query = `
                INSERT INTO orders 
                (company_id, order_id, customer_name, customer_email, customer_avatar, 
                 customer_tier, items, total, status, priority, payment_method, 
                 shipping_address, tracking_number, estimated_delivery, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                companyId,
                order_id.trim(),
                customer_name.trim(),
                customer_email.trim().toLowerCase(),
                customer_avatar ? customer_avatar.trim().toUpperCase() : null,
                customer_tier,
                JSON.stringify(items),
                parseFloat(total) || 0,
                status,
                priority,
                payment_method ? payment_method.trim() : null,
                shipping_address ? shipping_address.trim() : null,
                tracking_number ? tracking_number.trim() : null,
                formattedDate,
                notes ? notes.trim() : null
            ];

            const [result] = await pool.query(query, values);
            return result.insertId;
        } catch (error) {
            console.error("Model create error:", error);
            throw error;
        }
    }

    // Update order
    static async update(companyId, id, orderData) {
        try {
            const {
                customer_name,
                customer_email,
                customer_avatar,
                customer_tier,
                items,
                total,
                status,
                priority,
                payment_method,
                shipping_address,
                tracking_number,
                estimated_delivery,
                notes
            } = orderData;

            // Format date if provided
            let formattedDate = null;
            if (estimated_delivery) {
                formattedDate = new Date(estimated_delivery).toISOString().split('T')[0];
            }

            const query = `
                UPDATE orders SET
                    customer_name = ?, customer_email = ?, customer_avatar = ?,
                    customer_tier = ?, items = ?, total = ?, status = ?,
                    priority = ?, payment_method = ?, shipping_address = ?,
                    tracking_number = ?, estimated_delivery = ?, notes = ?
                WHERE company_id = ? AND id = ?
            `;

            const values = [
                customer_name ? customer_name.trim() : null,
                customer_email ? customer_email.trim().toLowerCase() : null,
                customer_avatar ? customer_avatar.trim().toUpperCase() : null,
                customer_tier || 'Bronze',
                items ? JSON.stringify(items) : null,
                total !== undefined ? parseFloat(total) : null,
                status || 'pending',
                priority || 'medium',
                payment_method ? payment_method.trim() : null,
                shipping_address ? shipping_address.trim() : null,
                tracking_number ? tracking_number.trim() : null,
                formattedDate,
                notes ? notes.trim() : null,
                companyId,
                id
            ];

            const [result] = await pool.query(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Model update error:", error);
            throw error;
        }
    }

    // Update order status
    static async updateStatus(companyId, id, status) {
        try {
            const query = `
                UPDATE orders SET status = ?
                WHERE company_id = ? AND id = ?
            `;
            const [result] = await pool.query(query, [status, companyId, id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Update status error:", error);
            throw error;
        }
    }

    // Delete order
    static async delete(companyId, id) {
        try {
            const [result] = await pool.query(
                "DELETE FROM orders WHERE company_id = ? AND id = ?",
                [companyId, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Model delete error:", error);
            throw error;
        }
    }

    // Get order stats (company-specific)
    static async getStats(companyId) {
        const [totalOrders] = await pool.query(
            "SELECT COUNT(*) as total FROM orders WHERE company_id = ?",
            [companyId]
        );
        const [totalRevenue] = await pool.query(
            "SELECT SUM(total) as totalRevenue FROM orders WHERE company_id = ? AND status != 'cancelled'",
            [companyId]
        );
        const [avgOrderValue] = await pool.query(
            "SELECT AVG(total) as avgOrderValue FROM orders WHERE company_id = ? AND status != 'cancelled'",
            [companyId]
        );
        const [pending] = await pool.query(
            "SELECT COUNT(*) as pending FROM orders WHERE company_id = ? AND status = 'pending'",
            [companyId]
        );
        const [processing] = await pool.query(
            "SELECT COUNT(*) as processing FROM orders WHERE company_id = ? AND status = 'processing'",
            [companyId]
        );
        const [shipped] = await pool.query(
            "SELECT COUNT(*) as shipped FROM orders WHERE company_id = ? AND status = 'shipped'",
            [companyId]
        );
        const [delivered] = await pool.query(
            "SELECT COUNT(*) as delivered FROM orders WHERE company_id = ? AND status = 'delivered'",
            [companyId]
        );
        const [cancelled] = await pool.query(
            "SELECT COUNT(*) as cancelled FROM orders WHERE company_id = ? AND status = 'cancelled'",
            [companyId]
        );

        const total = totalOrders[0].total || 0;
        const deliveredCount = delivered[0].delivered || 0;

        return {
            totalOrders: total,
            totalRevenue: Math.round(totalRevenue[0].totalRevenue || 0),
            avgOrderValue: Math.round(avgOrderValue[0].avgOrderValue || 0),
            pendingOrders: pending[0].pending || 0,
            processingOrders: processing[0].processing || 0,
            shippedOrders: shipped[0].shipped || 0,
            deliveredOrders: deliveredCount,
            cancelledOrders: cancelled[0].cancelled || 0,
            completionRate: total > 0 ? Math.round((deliveredCount / total) * 100) : 0
        };
    }
}

export default OrderModel;