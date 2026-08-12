import AnalyticsModel from '../models/analytics.model.js';

// Get full analytics dashboard data
export const getAnalyticsDashboard = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { timeframe = 'month' } = req.query;

        const data = await AnalyticsModel.getTimeframeData(companyId, timeframe);

        // Format response for frontend
        const response = {
            kpis: {
                revenue: {
                    current: data.kpis.revenue.current,
                    previous: data.kpis.revenue.previous,
                    growth: data.kpis.revenue.growth
                },
                orders: {
                    current: data.kpis.orders.current,
                    previous: data.kpis.orders.previous,
                    growth: data.kpis.orders.growth
                },
                customers: {
                    current: data.kpis.customers.current,
                    previous: data.kpis.customers.previous,
                    growth: data.kpis.customers.growth
                },
                profit: {
                    current: data.kpis.profit.current,
                    previous: data.kpis.profit.previous,
                    growth: data.kpis.profit.growth
                }
            },
            chartData: data.chartData.map(item => ({
                label: item.label,
                value: Math.round(item.value)
            })),
            topProducts: data.topProducts.map(product => ({
                name: product.name,
                revenue: Math.round(product.revenue),
                units: product.units || 0,
                growth: product.growth || 0
            })),
            topCustomers: data.topCustomers.map(customer => ({
                name: customer.name,
                orders: customer.orders,
                spent: Math.round(customer.spent),
                tier: customer.tier
            })),
            insights: data.insights,
            inventoryValue: data.kpis.inventoryValue,
            avgOrderValue: data.kpis.avgOrderValue
        };

        res.json(response);
    } catch (error) {
        console.error("Get analytics dashboard error:", error);
        res.status(500).json({ error: "Failed to fetch analytics data" });
    }
};

// Get KPI data only
export const getKPIs = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { timeframe = 'month' } = req.query;

        const data = await AnalyticsModel.getKPIs(companyId, timeframe);
        res.json(data);
    } catch (error) {
        console.error("Get KPIs error:", error);
        res.status(500).json({ error: "Failed to fetch KPI data" });
    }
};

// Get chart data
export const getChartData = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { metric = 'revenue', timeframe = 'month' } = req.query;

        const data = await AnalyticsModel.getChartData(companyId, metric, timeframe);
        res.json(data);
    } catch (error) {
        console.error("Get chart data error:", error);
        res.status(500).json({ error: "Failed to fetch chart data" });
    }
};

// Get top products
export const getTopProducts = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { limit = 5 } = req.query;

        const data = await AnalyticsModel.getTopProducts(companyId, parseInt(limit));
        res.json(data);
    } catch (error) {
        console.error("Get top products error:", error);
        res.status(500).json({ error: "Failed to fetch top products" });
    }
};

// Get top customers
export const getTopCustomers = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { limit = 5 } = req.query;

        const data = await AnalyticsModel.getTopCustomers(companyId, parseInt(limit));
        res.json(data);
    } catch (error) {
        console.error("Get top customers error:", error);
        res.status(500).json({ error: "Failed to fetch top customers" });
    }
};

// Get insights
export const getInsights = async (req, res) => {
    try {
        const companyId = req.user.companyId;

        const data = await AnalyticsModel.getInsights(companyId);
        res.json(data);
    } catch (error) {
        console.error("Get insights error:", error);
        res.status(500).json({ error: "Failed to fetch insights" });
    }
};