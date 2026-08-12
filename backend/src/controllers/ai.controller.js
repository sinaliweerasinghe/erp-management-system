import AIModel from '../models/ai.model.js';
import pool from '../config/db.js';

// Get all AI insights
export const getInsights = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const insights = await AIModel.getInsights(companyId);
        res.json(insights || []);
    } catch (error) {
        console.error("Get insights error:", error);
        res.json([]);
    }
};

// Generate new insights
export const generateInsights = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        
        // Delete old insights (older than 7 days)
        await pool.query(
            `DELETE FROM ai_insights 
             WHERE company_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [companyId]
        );
        
        // Delete old predictions
        await pool.query(
            `DELETE FROM ai_predictions 
             WHERE company_id = ? AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            [companyId]
        );
        
        // Delete old recommendations
        await pool.query(
            `DELETE FROM ai_recommendations 
             WHERE company_id = ? AND status IN ('completed', 'dismissed') 
             AND created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            [companyId]
        );

        // Check if there's enough data
        const [orderCount] = await pool.query(
            `SELECT COUNT(*) as count FROM orders WHERE company_id = ? AND status != 'cancelled'`,
            [companyId]
        );

        if (parseInt(orderCount[0]?.count || 0) === 0) {
            return res.json({
                message: "No data available to generate insights. Add some orders first.",
                insights: []
            });
        }

        const insights = await AIModel.generateInsights(companyId);
        
        res.json({
            message: "Insights generated successfully",
            insights: insights || []
        });
    } catch (error) {
        console.error("Generate insights error:", error);
        res.status(500).json({ error: "Failed to generate insights: " + error.message });
    }
};

// Get predictions
export const getPredictions = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const predictions = await AIModel.getPredictions(companyId);
        res.json(predictions || []);
    } catch (error) {
        console.error("Get predictions error:", error);
        res.json([]);
    }
};

// Get recommendations
export const getRecommendations = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const recommendations = await AIModel.getRecommendations(companyId);
        res.json(recommendations || []);
    } catch (error) {
        console.error("Get recommendations error:", error);
        res.json([]);
    }
};

// Dismiss insight
export const dismissInsight = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        
        await pool.query(
            `UPDATE ai_insights 
             SET is_dismissed = TRUE 
             WHERE id = ? AND company_id = ?`,
            [id, companyId]
        );
        
        res.json({ message: "Insight dismissed successfully" });
    } catch (error) {
        console.error("Dismiss insight error:", error);
        res.status(500).json({ error: "Failed to dismiss insight" });
    }
};

// Update recommendation status
export const updateRecommendationStatus = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const { status } = req.body;
        
        await pool.query(
            `UPDATE ai_recommendations 
             SET status = ? 
             WHERE id = ? AND company_id = ?`,
            [status, id, companyId]
        );
        
        res.json({ message: "Recommendation updated successfully" });
    } catch (error) {
        console.error("Update recommendation error:", error);
        res.status(500).json({ error: "Failed to update recommendation" });
    }
};

// Get AI dashboard data
export const getAIDashboard = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        
        const [insights] = await pool.query(
            `SELECT * FROM ai_insights 
             WHERE company_id = ? AND is_dismissed = FALSE 
             ORDER BY FIELD(priority, 'high', 'medium', 'low') 
             LIMIT 5`,
            [companyId]
        );
        
        const [predictions] = await pool.query(
            `SELECT * FROM ai_predictions 
             WHERE company_id = ? AND status = 'pending'
             ORDER BY prediction_date ASC 
             LIMIT 3`,
            [companyId]
        );
        
        const [recommendations] = await pool.query(
            `SELECT * FROM ai_recommendations 
             WHERE company_id = ? AND status = 'pending'
             ORDER BY 
               CASE impact 
                 WHEN 'high' THEN 1 
                 WHEN 'medium' THEN 2 
                 WHEN 'low' THEN 3 
               END ASC 
             LIMIT 3`,
            [companyId]
        );
        
        // Get stats
        const [insightStats] = await pool.query(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority
             FROM ai_insights 
             WHERE company_id = ? AND is_dismissed = FALSE`,
            [companyId]
        );
        
        res.json({
            insights: insights || [],
            predictions: predictions || [],
            recommendations: recommendations || [],
            stats: {
                total: insightStats[0]?.total || 0,
                high: insightStats[0]?.high_priority || 0,
                medium: insightStats[0]?.medium_priority || 0,
                low: insightStats[0]?.low_priority || 0
            }
        });
    } catch (error) {
        console.error("Get AI dashboard error:", error);
        res.json({
            insights: [],
            predictions: [],
            recommendations: [],
            stats: { total: 0, high: 0, medium: 0, low: 0 }
        });
    }
};