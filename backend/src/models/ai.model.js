import pool from '../config/db.js';

class AIModel {
    // Get AI insights for dashboard
    // Get AI insights for dashboard
static async getInsights(companyId) {
    try {
        const [insights] = await pool.query(
            `SELECT * FROM ai_insights 
             WHERE company_id = ? AND is_dismissed = FALSE 
             ORDER BY 
               FIELD(priority, 'high', 'medium', 'low'),
               created_at DESC 
             LIMIT 10`,
            [companyId]
        );
        return insights || [];
    } catch (error) {
        console.error("Get insights error:", error);
        return [];
    }
}

    // Get AI predictions
    static async getPredictions(companyId) {
        const [predictions] = await pool.query(
            `SELECT * FROM ai_predictions 
             WHERE company_id = ? AND status = 'pending'
             ORDER BY prediction_date ASC 
             LIMIT 5`,
            [companyId]
        );
        return predictions;
    }

    // Get AI recommendations
    static async getRecommendations(companyId) {
        const [recommendations] = await pool.query(
            `SELECT * FROM ai_recommendations 
             WHERE company_id = ? AND status = 'pending'
             ORDER BY 
               CASE impact 
                 WHEN 'high' THEN 1 
                 WHEN 'medium' THEN 2 
                 WHEN 'low' THEN 3 
               END ASC 
             LIMIT 5`,
            [companyId]
        );
        return recommendations;
    }

    // Generate AI Insights from real data
    static async generateInsights(companyId) {
        const insights = [];
        const now = new Date();

        // 1. Sales Insights
        const [salesData] = await pool.query(
            `SELECT 
                COALESCE(SUM(total), 0) as total_revenue,
                COUNT(*) as total_orders,
                COALESCE(AVG(total), 0) as avg_order_value
             FROM orders 
             WHERE company_id = ? 
               AND status != 'cancelled'
               AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            [companyId]
        );

        const [previousSales] = await pool.query(
            `SELECT 
                COALESCE(SUM(total), 0) as total_revenue
             FROM orders 
             WHERE company_id = ? 
               AND status != 'cancelled'
               AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
               AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            [companyId]
        );

        const currentRevenue = parseFloat(salesData[0]?.total_revenue) || 0;
        const previousRevenue = parseFloat(previousSales[0]?.total_revenue) || 0;
        const revenueGrowth = previousRevenue > 0 
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
            : 0;

        // Revenue insight
        if (revenueGrowth > 20) {
            insights.push({
                insight_type: 'growth',
                title: '🚀 Strong Revenue Growth',
                description: `Your revenue has increased by ${revenueGrowth.toFixed(1)}% compared to last month. This is exceptional growth!`,
                priority: 'high',
                category: 'sales',
                metric_value: currentRevenue,
                metric_change: revenueGrowth,
                recommendation: 'Consider reinvesting in your top-performing products to sustain this momentum.'
            });
        } else if (revenueGrowth < -20) {
            insights.push({
                insight_type: 'alert',
                title: '⚠️ Revenue Decline',
                description: `Your revenue has decreased by ${Math.abs(revenueGrowth).toFixed(1)}% compared to last month.`,
                priority: 'high',
                category: 'sales',
                metric_value: currentRevenue,
                metric_change: revenueGrowth,
                recommendation: 'Review your pricing strategy and consider promotional campaigns to boost sales.'
            });
        }

        // 2. Inventory Insights
        const [inventoryData] = await pool.query(
            `SELECT 
                COUNT(*) as total_items,
                SUM(quantity) as total_stock,
                AVG(quantity) as avg_stock
             FROM inventory 
             WHERE company_id = ?`,
            [companyId]
        );

        const [lowStockItems] = await pool.query(
            `SELECT COUNT(*) as low_stock_count
             FROM inventory 
             WHERE company_id = ? AND quantity <= min_stock`,
            [companyId]
        );

        const [outOfStockItems] = await pool.query(
            `SELECT COUNT(*) as out_of_stock_count
             FROM inventory 
             WHERE company_id = ? AND quantity = 0`,
            [companyId]
        );

        const lowStock = parseInt(lowStockItems[0]?.low_stock_count) || 0;
        const outOfStock = parseInt(outOfStockItems[0]?.out_of_stock_count) || 0;

        if (lowStock > 0) {
            const priority = lowStock > 5 ? 'high' : lowStock > 2 ? 'medium' : 'low';
            insights.push({
                insight_type: 'inventory_alert',
                title: `📦 ${lowStock} Items Low on Stock`,
                description: `${lowStock} products are running low on stock. Review and reorder soon to avoid stockouts.`,
                priority: priority,
                category: 'inventory',
                metric_value: lowStock,
                metric_change: null,
                recommendation: `Check the inventory tab to reorder ${lowStock} low-stock items.`
            });
        }

        if (outOfStock > 0) {
            insights.push({
                insight_type: 'inventory_alert',
                title: `❌ ${outOfStock} Items Out of Stock`,
                description: `${outOfStock} products are currently out of stock. This may be affecting sales.`,
                priority: 'high',
                category: 'inventory',
                metric_value: outOfStock,
                metric_change: null,
                recommendation: `Immediately reorder ${outOfStock} out-of-stock items to resume sales.`
            });
        }

        // 3. Customer Insights
        const [customerData] = await pool.query(
            `SELECT 
                COUNT(DISTINCT customer_email) as total_customers,
                COUNT(DISTINCT CASE 
                    WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                    THEN customer_email 
                END) as new_customers
             FROM orders 
             WHERE company_id = ? AND status != 'cancelled'`,
            [companyId]
        );

        const totalCustomers = parseInt(customerData[0]?.total_customers) || 0;
        const newCustomers = parseInt(customerData[0]?.new_customers) || 0;

        if (newCustomers > 0 && totalCustomers > 0) {
            const customerGrowth = (newCustomers / totalCustomers) * 100;
            if (customerGrowth > 20) {
                insights.push({
                    insight_type: 'customer_growth',
                    title: '👥 Customer Base Growing',
                    description: `You've gained ${newCustomers} new customers this month. Customer acquisition is strong!`,
                    priority: 'medium',
                    category: 'customers',
                    metric_value: newCustomers,
                    metric_change: customerGrowth,
                    recommendation: 'Focus on customer retention strategies to keep these new customers engaged.'
                });
            }
        }

        // 4. Top Product Insights
        const [topProducts] = await pool.query(
            `SELECT 
                JSON_UNQUOTE(JSON_EXTRACT(item, '$.name')) as product_name,
                SUM(JSON_UNQUOTE(JSON_EXTRACT(item, '$.quantity'))) as total_quantity,
                SUM(JSON_UNQUOTE(JSON_EXTRACT(item, '$.quantity')) * JSON_UNQUOTE(JSON_EXTRACT(item, '$.price'))) as total_revenue
             FROM orders,
             JSON_TABLE(orders.items, '$[*]' COLUMNS (
                 item JSON PATH '$'
             )) as items
             WHERE orders.company_id = ? 
               AND orders.status != 'cancelled'
             GROUP BY JSON_UNQUOTE(JSON_EXTRACT(item, '$.name'))
             ORDER BY total_revenue DESC
             LIMIT 1`,
            [companyId]
        );

        if (topProducts.length > 0 && topProducts[0]?.product_name) {
            insights.push({
                insight_type: 'top_product',
                title: '🏆 Top Performing Product',
                description: `"${topProducts[0].product_name}" is your best-selling product with $${Math.round(topProducts[0].total_revenue)} in revenue.`,
                priority: 'medium',
                category: 'sales',
                metric_value: parseFloat(topProducts[0].total_revenue) || 0,
                metric_change: null,
                recommendation: `Consider increasing inventory for ${topProducts[0].product_name} and promoting it more.`
            });
        }

        // 5. Performance Insight
        const [deliveryData] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
             FROM orders 
             WHERE company_id = ? AND status != 'cancelled'`,
            [companyId]
        );

        const totalOrders = parseInt(deliveryData[0]?.total) || 0;
        const delivered = parseInt(deliveryData[0]?.delivered) || 0;
        const deliveryRate = totalOrders > 0 ? (delivered / totalOrders) * 100 : 0;

        if (deliveryRate > 0) {
            insights.push({
                insight_type: 'performance',
                title: '📊 Order Fulfillment Performance',
                description: `${deliveryRate.toFixed(1)}% of your orders are being successfully delivered.`,
                priority: deliveryRate > 90 ? 'low' : deliveryRate > 70 ? 'medium' : 'high',
                category: 'operations',
                metric_value: deliveryRate,
                metric_change: null,
                recommendation: deliveryRate < 80 ? 'Review your delivery process to improve fulfillment rates.' : 'Great job! Maintain your high delivery standards.'
            });
        }

        // Generate predictions
        await generatePredictions(companyId, revenueGrowth, deliveryRate);
        await generateRecommendations(companyId, lowStock, outOfStock, revenueGrowth);

        // Save insights to database
        for (const insight of insights) {
            await pool.query(
                `INSERT INTO ai_insights 
                 (company_id, insight_type, title, description, priority, category, 
                  metric_value, metric_change, recommendation, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    companyId,
                    insight.insight_type,
                    insight.title,
                    insight.description,
                    insight.priority,
                    insight.category,
                    insight.metric_value || null,
                    insight.metric_change || null,
                    insight.recommendation || null
                ]
            );
        }

        return insights;
    }
}

// Helper function to generate predictions
async function generatePredictions(companyId, revenueGrowth, deliveryRate) {
    const pool = (await import('../config/db.js')).default;
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setMonth(futureDate.getMonth() + 1);

    // Revenue prediction
    const [revenueData] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) as monthly_revenue 
         FROM orders 
         WHERE company_id = ? 
           AND status != 'cancelled'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [companyId]
    );

    const monthlyRevenue = parseFloat(revenueData[0]?.monthly_revenue) || 0;
    const predictedRevenue = monthlyRevenue * (1 + (revenueGrowth / 100));

    await pool.query(
        `INSERT INTO ai_predictions 
         (company_id, prediction_type, prediction_date, predicted_value, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
            companyId,
            'revenue',
            futureDate.toISOString().split('T')[0],
            predictedRevenue,
            85 + Math.random() * 10
        ]
    );

    // Order volume prediction
    const [orderData] = await pool.query(
        `SELECT COUNT(*) as order_count 
         FROM orders 
         WHERE company_id = ? 
           AND status != 'cancelled'
           AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
        [companyId]
    );

    const monthlyOrders = parseInt(orderData[0]?.order_count) || 0;
    const predictedOrders = Math.round(monthlyOrders * 1.1);

    await pool.query(
        `INSERT INTO ai_predictions 
         (company_id, prediction_type, prediction_date, predicted_value, confidence, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
            companyId,
            'orders',
            futureDate.toISOString().split('T')[0],
            predictedOrders,
            80 + Math.random() * 10
        ]
    );
}

// Helper function to generate recommendations
async function generateRecommendations(companyId, lowStock, outOfStock, revenueGrowth) {
    const pool = (await import('../config/db.js')).default;

    // Inventory recommendations
    if (lowStock > 0) {
        await pool.query(
            `INSERT INTO ai_recommendations 
             (company_id, title, description, category, impact, effort, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                companyId,
                '📦 Restock Low Inventory',
                `${lowStock} items are running low. Reorder to prevent stockouts and lost sales.`,
                'inventory',
                'high',
                'medium',
                'pending'
            ]
        );
    }

    if (outOfStock > 0) {
        await pool.query(
            `INSERT INTO ai_recommendations 
             (company_id, title, description, category, impact, effort, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                companyId,
                '🚨 Reorder Out-of-Stock Items',
                `${outOfStock} items are completely out of stock. Immediate action required.`,
                'inventory',
                'high',
                'high',
                'pending'
            ]
        );
    }

    // Sales recommendations
    if (revenueGrowth < 0) {
        await pool.query(
            `INSERT INTO ai_recommendations 
             (company_id, title, description, category, impact, effort, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                companyId,
                '📈 Boost Sales with Promotion',
                'Revenue is declining. Consider launching a promotional campaign to attract customers.',
                'sales',
                'high',
                'medium',
                'pending'
            ]
        );
    }

    // Always add a general recommendation
    await pool.query(
        `INSERT INTO ai_recommendations 
         (company_id, title, description, category, impact, effort, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
            companyId,
            '🤖 AI-Powered Insights',
            'Enable AI analytics to get deeper insights into your business performance.',
            'analytics',
            'medium',
            'low',
            'pending'
        ]
    );
}

export default AIModel;