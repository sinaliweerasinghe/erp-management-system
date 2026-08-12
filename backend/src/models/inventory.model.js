import pool from '../config/db.js';  // Change this line

class InventoryModel {
    // Get all inventory items with filters (company-specific)
    static async findAll(companyId, filters = {}) {
        let query = "SELECT * FROM inventory WHERE company_id = ?";
        const params = [companyId];

        if (filters.category && filters.category !== "all") {
            query += " AND category = ?";
            params.push(filters.category);
        }

        if (filters.status && filters.status !== "all") {
            query += " AND status = ?";
            params.push(filters.status);
        }

        if (filters.search) {
            query += " AND (name LIKE ? OR sku LIKE ? OR supplier LIKE ?)";
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Sorting
        if (filters.sortBy) {
            const validSortFields = ['name', 'quantity', 'price', 'sales_velocity'];
            if (validSortFields.includes(filters.sortBy)) {
                query += ` ORDER BY ${filters.sortBy} ${filters.sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
            }
        } else {
            query += " ORDER BY created_at DESC";
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Get inventory item by ID (company-specific)
    static async findById(companyId, id) {
        const [rows] = await pool.query(
            "SELECT * FROM inventory WHERE company_id = ? AND id = ?",
            [companyId, id]
        );
        return rows[0];
    }

    // Get inventory by SKU (company-specific)
    static async findBySku(companyId, sku) {
        const [rows] = await pool.query(
            "SELECT * FROM inventory WHERE company_id = ? AND sku = ?",
            [companyId, sku]
        );
        return rows[0];
    }

    // Create new inventory item
    static async create(companyId, inventoryData) {
        try {
            const {
                name,
                sku,
                category,
                quantity = 0,
                minStock = 0,
                maxStock = 0,
                status = 'in-stock',
                price = 0,
                cost = 0,
                location,
                supplier,
                lastRestocked,
                image,
                salesVelocity = 0,
                profitMargin = 0
            } = inventoryData;

            // Validate required fields
            if (!name || !sku || !category) {
                throw new Error("Missing required fields: name, sku, category");
            }

            // Calculate status if not provided
            let finalStatus = status;
            if (!status || status === 'auto') {
                if (quantity <= 0) {
                    finalStatus = 'out-of-stock';
                } else if (quantity <= minStock) {
                    finalStatus = 'low-stock';
                } else {
                    finalStatus = 'in-stock';
                }
            }

            // Format date if provided
            let formattedDate = null;
            if (lastRestocked) {
                formattedDate = new Date(lastRestocked).toISOString().split('T')[0];
            }

            const query = `
                INSERT INTO inventory 
                (company_id, name, sku, category, quantity, min_stock, max_stock, 
                 status, price, cost, location, supplier, last_restocked, 
                 image, sales_velocity, profit_margin)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                companyId,
                name.trim(),
                sku.trim().toUpperCase(),
                category.trim(),
                parseInt(quantity) || 0,
                parseInt(minStock) || 0,
                parseInt(maxStock) || 0,
                finalStatus,
                parseFloat(price) || 0,
                parseFloat(cost) || 0,
                location ? location.trim() : null,
                supplier ? supplier.trim() : null,
                formattedDate,
                image ? image.trim() : null,
                parseInt(salesVelocity) || 0,
                parseInt(profitMargin) || 0
            ];

            const [result] = await pool.query(query, values);
            return result.insertId;
        } catch (error) {
            console.error("Model create error:", error);
            throw error;
        }
    }

    // Update inventory item
    static async update(companyId, id, inventoryData) {
        try {
            const {
                name,
                sku,
                category,
                quantity,
                minStock,
                maxStock,
                status,
                price,
                cost,
                location,
                supplier,
                lastRestocked,
                image,
                salesVelocity,
                profitMargin
            } = inventoryData;

            // Calculate status if quantity is provided and status is 'auto'
            let finalStatus = status;
            if (status === 'auto' && quantity !== undefined) {
                if (quantity <= 0) {
                    finalStatus = 'out-of-stock';
                } else if (quantity <= minStock) {
                    finalStatus = 'low-stock';
                } else {
                    finalStatus = 'in-stock';
                }
            }

            // Format date if provided
            let formattedDate = null;
            if (lastRestocked) {
                formattedDate = new Date(lastRestocked).toISOString().split('T')[0];
            }

            const query = `
                UPDATE inventory SET
                    name = ?, sku = ?, category = ?, quantity = ?, 
                    min_stock = ?, max_stock = ?, status = ?, 
                    price = ?, cost = ?, location = ?, supplier = ?, 
                    last_restocked = ?, image = ?, sales_velocity = ?, 
                    profit_margin = ?
                WHERE company_id = ? AND id = ?
            `;

            const values = [
                name ? name.trim() : null,
                sku ? sku.trim().toUpperCase() : null,
                category ? category.trim() : null,
                quantity !== undefined ? parseInt(quantity) : null,
                minStock !== undefined ? parseInt(minStock) : null,
                maxStock !== undefined ? parseInt(maxStock) : null,
                finalStatus || 'in-stock',
                price !== undefined ? parseFloat(price) : null,
                cost !== undefined ? parseFloat(cost) : null,
                location ? location.trim() : null,
                supplier ? supplier.trim() : null,
                formattedDate,
                image ? image.trim() : null,
                salesVelocity !== undefined ? parseInt(salesVelocity) : null,
                profitMargin !== undefined ? parseInt(profitMargin) : null,
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

    // Delete inventory item
    static async delete(companyId, id) {
        try {
            const [result] = await pool.query(
                "DELETE FROM inventory WHERE company_id = ? AND id = ?",
                [companyId, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Model delete error:", error);
            throw error;
        }
    }

    // Get inventory stats (company-specific)
    static async getStats(companyId) {
        const [totalProducts] = await pool.query(
            "SELECT COUNT(*) as total FROM inventory WHERE company_id = ?",
            [companyId]
        );
        const [lowStock] = await pool.query(
            "SELECT COUNT(*) as lowStock FROM inventory WHERE company_id = ? AND status = 'low-stock'",
            [companyId]
        );
        const [outOfStock] = await pool.query(
            "SELECT COUNT(*) as outOfStock FROM inventory WHERE company_id = ? AND status = 'out-of-stock'",
            [companyId]
        );
        const [inStock] = await pool.query(
            "SELECT COUNT(*) as inStock FROM inventory WHERE company_id = ? AND status = 'in-stock'",
            [companyId]
        );
        const [totalValue] = await pool.query(
            "SELECT SUM(quantity * price) as totalValue FROM inventory WHERE company_id = ?",
            [companyId]
        );
        const [totalProfit] = await pool.query(
            "SELECT SUM(quantity * (price - cost)) as totalProfit FROM inventory WHERE company_id = ?",
            [companyId]
        );
        const [categories] = await pool.query(
            "SELECT DISTINCT category FROM inventory WHERE company_id = ?",
            [companyId]
        );

        return {
            totalProducts: totalProducts[0].total || 0,
            lowStockItems: lowStock[0].lowStock || 0,
            outOfStockItems: outOfStock[0].outOfStock || 0,
            inStockItems: inStock[0].inStock || 0,
            totalValue: Math.round(totalValue[0].totalValue || 0),
            totalProfit: Math.round(totalProfit[0].totalProfit || 0),
            categories: categories.map(c => c.category)
        };
    }

    // Update stock quantity
    static async updateStock(companyId, id, quantity, note = '') {
        try {
            // Get current item
            const item = await this.findById(companyId, id);
            if (!item) {
                return false;
            }

            // Calculate new status
            let status = 'in-stock';
            if (quantity <= 0) {
                status = 'out-of-stock';
            } else if (quantity <= item.min_stock) {
                status = 'low-stock';
            }

            const query = `
                UPDATE inventory SET 
                    quantity = ?, 
                    status = ?,
                    last_restocked = ? 
                WHERE company_id = ? AND id = ?
            `;

            const today = new Date().toISOString().split('T')[0];
            const [result] = await pool.query(query, [
                quantity,
                status,
                today,
                companyId,
                id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error("Update stock error:", error);
            throw error;
        }
    }
}

export default InventoryModel;