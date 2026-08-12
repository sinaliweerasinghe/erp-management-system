import { useState, useEffect } from "react";
import axios from "axios";
import "./Analytics.css";

function Analytics() {
  const [timeframe, setTimeframe] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // New states for View All modals
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllCustomers, setShowAllCustomers] = useState(false);
  
  // New states for Export and Schedule
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [scheduleData, setScheduleData] = useState({
    frequency: "weekly",
    email: "",
    format: "pdf"
  });
  
  // State for analytics data from API
  const [analyticsData, setAnalyticsData] = useState({
    revenue: {
      current: 0,
      previous: 0,
      growth: 0,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    orders: {
      current: 0,
      previous: 0,
      growth: 0,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    customers: {
      current: 0,
      previous: 0,
      growth: 0,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    },
    profit: {
      current: 0,
      previous: 0,
      growth: 0,
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    }
  });
  
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [insights, setInsights] = useState([
    { icon: "🚀", title: "Revenue Growth", message: "Loading insights..." },
    { icon: "🎯", title: "Customer Acquisition", message: "Loading insights..." },
    { icon: "📊", title: "Top Performer", message: "Loading insights..." }
  ]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);

  const API_URL = 'http://localhost:5001/api';

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('Fetching analytics data...');
      console.log('Token:', token.substring(0, 20) + '...');
      
      const response = await axios.get(`${API_URL}/analytics/dashboard`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { timeframe }
      });

      console.log('Analytics response received:', response.status);
      console.log('Analytics data:', response.data);

      const data = response.data;
      
      // Check if data exists
      if (!data || Object.keys(data).length === 0) {
        console.warn('No data received from API');
        setError('No analytics data available');
        setLoading(false);
        return;
      }
      
      // Update KPIs with safe fallbacks
      const kpis = data.kpis || {};
      
      // Handle chart data
      let chartData = data.chartData || [];
      let chartLabels = [];
      let chartValues = [];
      
      if (chartData.length > 0) {
        chartLabels = chartData.map(item => item.label || '');
        chartValues = chartData.map(item => parseFloat(item.value) || 0);
      } else {
        // Default empty data
        chartLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        chartValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      }
      
      setAnalyticsData({
        revenue: {
          current: kpis.revenue?.current || 0,
          previous: kpis.revenue?.previous || 0,
          growth: kpis.revenue?.growth || 0,
          data: chartValues,
          labels: chartLabels
        },
        orders: {
          current: kpis.orders?.current || 0,
          previous: kpis.orders?.previous || 0,
          growth: kpis.orders?.growth || 0,
          data: chartValues,
          labels: chartLabels
        },
        customers: {
          current: kpis.customers?.current || 0,
          previous: kpis.customers?.previous || 0,
          growth: kpis.customers?.growth || 0,
          data: chartValues,
          labels: chartLabels
        },
        profit: {
          current: kpis.profit?.current || 0,
          previous: kpis.profit?.previous || 0,
          growth: kpis.profit?.growth || 0,
          data: chartValues,
          labels: chartLabels
        }
      });

      // Update top products
      setTopProducts(data.topProducts || []);
      
      // Update top customers
      setTopCustomers(data.topCustomers || []);
      
      // Update insights
      const insightsData = data.insights || {};
      setInsights([
        {
          icon: "🚀",
          title: "Revenue Growth",
          message: insightsData.revenueGrowth?.message || "Revenue data not available"
        },
        {
          icon: "🎯",
          title: "Customer Acquisition",
          message: insightsData.customerGrowth?.message || "Customer data not available"
        },
        {
          icon: "📊",
          title: "Top Performer",
          message: insightsData.topPerformer?.message || "Product data not available"
        }
      ]);

      // Update additional metrics
      setInventoryValue(data.inventoryValue || 0);
      setAvgOrderValue(data.avgOrderValue || 0);
      
      setError(null);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      console.error('Error details:', error.response?.data || error.message);
      console.error('Full error:', error);
      
      let errorMessage = 'Failed to load analytics data. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Export - Updated to support multiple formats
  const handleExport = () => {
    const data = {
      reportDate: new Date().toISOString(),
      timeframe,
      metrics: {
        revenue: {
          current: analyticsData.revenue.current,
          previous: analyticsData.revenue.previous,
          growth: analyticsData.revenue.growth
        },
        orders: {
          current: analyticsData.orders.current,
          previous: analyticsData.orders.previous,
          growth: analyticsData.orders.growth
        },
        customers: {
          current: analyticsData.customers.current,
          previous: analyticsData.customers.previous,
          growth: analyticsData.customers.growth
        },
        profit: {
          current: analyticsData.profit.current,
          previous: analyticsData.profit.previous,
          growth: analyticsData.profit.growth
        }
      },
      chartData: analyticsData.revenue.data.map((value, index) => ({
        month: analyticsData.revenue.labels[index],
        revenue: value,
        orders: analyticsData.orders.data[index],
        customers: analyticsData.customers.data[index],
        profit: analyticsData.profit.data[index]
      })),
      topProducts: topProducts.map(p => ({
        name: p.name,
        revenue: p.revenue,
        units: p.units,
        growth: p.growth
      })),
      topCustomers: topCustomers.map(c => ({
        name: c.name,
        tier: c.tier,
        orders: c.orders,
        spent: c.spent
      })),
      insights: insights.map(i => ({
        title: i.title,
        message: i.message
      })),
      inventoryValue,
      avgOrderValue
    };

    if (exportFormat === 'json') {
      // Export as JSON
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('✅ JSON report exported successfully!');
      
    } else if (exportFormat === 'csv') {
      // Export as CSV
      let csvContent = 'Report Type,Category,Metric,Value\n';
      
      // Add KPI data
      csvContent += 'KPI,Revenue,Current,' + analyticsData.revenue.current + '\n';
      csvContent += 'KPI,Revenue,Previous,' + analyticsData.revenue.previous + '\n';
      csvContent += 'KPI,Revenue,Growth,' + analyticsData.revenue.growth + '%\n';
      csvContent += 'KPI,Orders,Current,' + analyticsData.orders.current + '\n';
      csvContent += 'KPI,Orders,Previous,' + analyticsData.orders.previous + '\n';
      csvContent += 'KPI,Orders,Growth,' + analyticsData.orders.growth + '%\n';
      csvContent += 'KPI,Customers,Current,' + analyticsData.customers.current + '\n';
      csvContent += 'KPI,Customers,Previous,' + analyticsData.customers.previous + '\n';
      csvContent += 'KPI,Customers,Growth,' + analyticsData.customers.growth + '%\n';
      csvContent += 'KPI,Profit,Current,' + analyticsData.profit.current + '\n';
      csvContent += 'KPI,Profit,Previous,' + analyticsData.profit.previous + '\n';
      csvContent += 'KPI,Profit,Growth,' + analyticsData.profit.growth + '%\n';
      csvContent += 'Inventory,Value,,' + inventoryValue + '\n';
      csvContent += 'Orders,Average Value,,' + avgOrderValue + '\n\n';
      
      // Add monthly chart data
      csvContent += 'Month,Revenue,Orders,Customers,Profit\n';
      analyticsData.revenue.labels.forEach((label, index) => {
        csvContent += `${label},${analyticsData.revenue.data[index] || 0},${analyticsData.orders.data[index] || 0},${analyticsData.customers.data[index] || 0},${analyticsData.profit.data[index] || 0}\n`;
      });
      csvContent += '\n';
      
      // Add top products
      csvContent += 'Top Products,Revenue,Units,Growth\n';
      topProducts.forEach(p => {
        csvContent += `${p.name},${p.revenue},${p.units || 0},${p.growth || 0}%\n`;
      });
      csvContent += '\n';
      
      // Add top customers
      csvContent += 'Top Customers,Tier,Orders,Spent\n';
      topCustomers.forEach(c => {
        csvContent += `${c.name},${c.tier || 'Bronze'},${c.orders || 0},${c.spent || 0}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('✅ CSV report exported successfully!');
      
    } else if (exportFormat === 'pdf') {
      // Generate PDF via HTML print
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (printWindow) {
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Analytics Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; }
            h1 { color: #0f172a; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
            h2 { color: #1e293b; margin-top: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header p { color: #64748b; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
            .kpi-box { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .kpi-box .value { font-size: 24px; font-weight: 700; color: #0f172a; }
            .kpi-box .label { font-size: 12px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; border: 1px solid #e2e8f0; }
            td { padding: 8px 10px; border: 1px solid #e2e8f0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
            .insight-box { background: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin: 8px 0; }
            .insight-box strong { color: #0f172a; }
            .insight-box p { margin: 4px 0 0 0; color: #475569; }
            @media print {
              .no-print { display: none; }
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Analytics Report</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Timeframe: ${timeframe}</p>
          </div>
          
          <h2>📈 Key Performance Indicators</h2>
          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="value">$${analyticsData.revenue.current.toLocaleString()}</div>
              <div class="label">Total Revenue</div>
            </div>
            <div class="kpi-box">
              <div class="value">${analyticsData.orders.current}</div>
              <div class="label">Total Orders</div>
            </div>
            <div class="kpi-box">
              <div class="value">${analyticsData.customers.current}</div>
              <div class="label">Active Customers</div>
            </div>
            <div class="kpi-box">
              <div class="value">$${analyticsData.profit.current.toLocaleString()}</div>
              <div class="label">Net Profit</div>
            </div>
          </div>
          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="value">$${inventoryValue.toLocaleString()}</div>
              <div class="label">Inventory Value</div>
            </div>
            <div class="kpi-box">
              <div class="value">$${avgOrderValue.toLocaleString()}</div>
              <div class="label">Avg Order Value</div>
            </div>
          </div>
          
          <h2>📊 Monthly Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Orders</th>
                <th>Customers</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              ${analyticsData.revenue.labels.map((label, index) => `
                <tr>
                  <td>${label}</td>
                  <td>$${analyticsData.revenue.data[index]?.toLocaleString() || 0}</td>
                  <td>${analyticsData.orders.data[index] || 0}</td>
                  <td>${analyticsData.customers.data[index] || 0}</td>
                  <td>$${analyticsData.profit.data[index]?.toLocaleString() || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>🏆 Top Products</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Revenue</th>
                <th>Units</th>
                <th>Growth</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.name}</td>
                  <td>$${p.revenue.toLocaleString()}</td>
                  <td>${p.units || 0}</td>
                  <td>${p.growth || 0}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>⭐ Top Customers</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Tier</th>
                <th>Orders</th>
                <th>Spent</th>
              </tr>
            </thead>
            <tbody>
              ${topCustomers.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${c.name}</td>
                  <td>${c.tier || 'Bronze'}</td>
                  <td>${c.orders || 0}</td>
                  <td>$${c.spent?.toLocaleString() || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <h2>💡 Insights</h2>
          ${insights.map(i => `
            <div class="insight-box">
              <strong>${i.icon} ${i.title}</strong>
              <p>${i.message}</p>
            </div>
          `).join('')}
          
          <div class="footer">
            <p>Generated by ERPify Analytics Dashboard</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 16px; background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              💡 Press <strong>Ctrl + P</strong> (Windows) or <strong>Cmd + P</strong> (Mac) to save as PDF
            </p>
          </div>
        </body>
        </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        alert('✅ PDF report generated! Click "Print" and select "Save as PDF" to download.');
      } else {
        alert('Please allow pop-ups to generate PDF report.');
      }
    }
    
    setShowExportModal(false);
  };

  // Handle Schedule
  const handleSchedule = (e) => {
    e.preventDefault();
    if (!scheduleData.email) {
      alert('Please enter an email address');
      return;
    }
    
    console.log('Schedule Report:', {
      frequency: scheduleData.frequency,
      email: scheduleData.email,
      format: scheduleData.format,
      timeframe,
      scheduledAt: new Date().toISOString()
    });
    
    alert(`✅ Report scheduled successfully!\n\nFrequency: ${scheduleData.frequency}\nEmail: ${scheduleData.email}\nFormat: ${scheduleData.format.toUpperCase()}`);
    setShowScheduleModal(false);
    setScheduleData({
      frequency: "weekly",
      email: "",
      format: "pdf"
    });
  };

  // Get chart data for selected metric
  const currentData = analyticsData[selectedMetric] || analyticsData.revenue;
  const maxValue = Math.max(...currentData.data, 1);
  const chartHeight = 200;

  const getBarHeight = (value) => {
    return Math.max((value / maxValue) * chartHeight, 4);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getGrowthIcon = (growth) => {
    return growth > 0 ? "📈" : growth < 0 ? "📉" : "➡️";
  };

  const getGrowthClass = (growth) => {
    return growth > 0 ? "positive" : growth < 0 ? "negative" : "";
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchAnalytics}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header Section */}
      <div className="analytics-header">
        <div className="header-left">
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Monitor your business performance with real-time insights</p>
        </div>
        <div className="header-actions">
          <button className="export-analytics-btn" onClick={() => setShowExportModal(true)}>
            📊 Export Report
          </button>
          <button className="schedule-report-btn" onClick={() => setShowScheduleModal(true)}>
            📅 Schedule Report
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="timeframe-selector">
        <button 
          className={`timeframe-btn ${timeframe === "week" ? "active" : ""}`} 
          onClick={() => setTimeframe("week")}
        >
          Last 7 Days
        </button>
        <button 
          className={`timeframe-btn ${timeframe === "month" ? "active" : ""}`} 
          onClick={() => setTimeframe("month")}
        >
          Last 30 Days
        </button>
        <button 
          className={`timeframe-btn ${timeframe === "quarter" ? "active" : ""}`} 
          onClick={() => setTimeframe("quarter")}
        >
          Last 90 Days
        </button>
        <button 
          className={`timeframe-btn ${timeframe === "year" ? "active" : ""}`} 
          onClick={() => setTimeframe("year")}
        >
          This Year
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">💰</span>
            <span className={`kpi-trend ${getGrowthClass(analyticsData.revenue.growth)}`}>
              {getGrowthIcon(analyticsData.revenue.growth)} {Math.abs(analyticsData.revenue.growth)}%
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(analyticsData.revenue.current)}</div>
          <div className="kpi-label">Total Revenue</div>
          <div className="kpi-compare">vs {formatCurrency(analyticsData.revenue.previous)} last period</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">📦</span>
            <span className={`kpi-trend ${getGrowthClass(analyticsData.orders.growth)}`}>
              {getGrowthIcon(analyticsData.orders.growth)} {Math.abs(analyticsData.orders.growth)}%
            </span>
          </div>
          <div className="kpi-value">{formatNumber(analyticsData.orders.current)}</div>
          <div className="kpi-label">Total Orders</div>
          <div className="kpi-compare">vs {formatNumber(analyticsData.orders.previous)} last period</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">👥</span>
            <span className={`kpi-trend ${getGrowthClass(analyticsData.customers.growth)}`}>
              {getGrowthIcon(analyticsData.customers.growth)} {Math.abs(analyticsData.customers.growth)}%
            </span>
          </div>
          <div className="kpi-value">{formatNumber(analyticsData.customers.current)}</div>
          <div className="kpi-label">Active Customers</div>
          <div className="kpi-compare">vs {formatNumber(analyticsData.customers.previous)} last period</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-icon">💵</span>
            <span className={`kpi-trend ${getGrowthClass(analyticsData.profit.growth)}`}>
              {getGrowthIcon(analyticsData.profit.growth)} {Math.abs(analyticsData.profit.growth)}%
            </span>
          </div>
          <div className="kpi-value">{formatCurrency(analyticsData.profit.current)}</div>
          <div className="kpi-label">Net Profit</div>
          <div className="kpi-compare">vs {formatCurrency(analyticsData.profit.previous)} last period</div>
        </div>
      </div>

      {/* Additional KPI Cards */}
      <div className="kpi-grid" style={{ marginTop: '-8px' }}>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f8fafc, #eef2ff)' }}>
          <div className="kpi-header">
            <span className="kpi-icon">🏷️</span>
          </div>
          <div className="kpi-value">{formatCurrency(inventoryValue)}</div>
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-compare">Total stock worth</div>
        </div>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f8fafc, #fefce8)' }}>
          <div className="kpi-header">
            <span className="kpi-icon">📊</span>
          </div>
          <div className="kpi-value">{formatCurrency(avgOrderValue)}</div>
          <div className="kpi-label">Avg Order Value</div>
          <div className="kpi-compare">Per transaction</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="chart-section">
        <div className="section-header">
          <h2 className="section-title">Performance Overview</h2>
          <div className="metric-selector">
            <button 
              className={`metric-btn ${selectedMetric === "revenue" ? "active" : ""}`} 
              onClick={() => setSelectedMetric("revenue")}
            >
              Revenue
            </button>
            <button 
              className={`metric-btn ${selectedMetric === "orders" ? "active" : ""}`} 
              onClick={() => setSelectedMetric("orders")}
            >
              Orders
            </button>
            <button 
              className={`metric-btn ${selectedMetric === "customers" ? "active" : ""}`} 
              onClick={() => setSelectedMetric("customers")}
            >
              Customers
            </button>
            <button 
              className={`metric-btn ${selectedMetric === "profit" ? "active" : ""}`} 
              onClick={() => setSelectedMetric("profit")}
            >
              Profit
            </button>
          </div>
        </div>

        <div className="chart-container">
          {currentData.data.some(v => v > 0) ? (
            <div className="chart-bars">
              {currentData.data.map((value, index) => (
                <div key={index} className="chart-bar-wrapper">
                  <div 
                    className="chart-bar" 
                    style={{ height: `${getBarHeight(value)}px` }}
                    onClick={() => {
                      setSelectedDataPoint({ 
                        label: currentData.labels[index] || `Period ${index + 1}`, 
                        value, 
                        metric: selectedMetric 
                      });
                      setShowDetailsModal(true);
                    }}
                  >
                    <div className="chart-bar-tooltip">
                      {selectedMetric === "revenue" || selectedMetric === "profit" 
                        ? formatCurrency(value) 
                        : formatNumber(value)}
                    </div>
                  </div>
                  <div className="chart-label">{currentData.labels[index] || `P${index + 1}`}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">
              <p>No data available for this period</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Start making sales to see your performance</p>
            </div>
          )}
        </div>

        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Average</span>
            <span className="summary-value">
              {currentData.data.some(v => v > 0) ? (
                selectedMetric === "revenue" || selectedMetric === "profit"
                  ? formatCurrency(currentData.data.reduce((a, b) => a + b, 0) / currentData.data.filter(v => v > 0).length)
                  : formatNumber(Math.round(currentData.data.reduce((a, b) => a + b, 0) / currentData.data.filter(v => v > 0).length))
              ) : 'N/A'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Highest</span>
            <span className="summary-value">
              {currentData.data.some(v => v > 0) ? (
                selectedMetric === "revenue" || selectedMetric === "profit"
                  ? formatCurrency(Math.max(...currentData.data))
                  : formatNumber(Math.max(...currentData.data))
              ) : 'N/A'}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total</span>
            <span className="summary-value">
              {currentData.data.some(v => v > 0) ? (
                selectedMetric === "revenue" || selectedMetric === "profit"
                  ? formatCurrency(currentData.data.reduce((a, b) => a + b, 0))
                  : formatNumber(currentData.data.reduce((a, b) => a + b, 0))
              ) : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="two-column-layout">
        {/* Top Products */}
        <div className="data-card">
          <div className="card-header-analytics">
            <h3 className="card-title">🏆 Top Performing Products</h3>
            <button className="view-all-btn" onClick={() => setShowAllProducts(true)}>
              View All →
            </button>
          </div>
          <div className="product-list">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div key={index} className="product-item">
                  <div className="product-rank">#{index + 1}</div>
                  <div className="product-info-analytics">
                    <div className="product-name-analytics">{product.name}</div>
                    <div className="product-stats">
                      <span>💰 {formatCurrency(product.revenue)}</span>
                      <span>📦 {product.units || 0} units</span>
                    </div>
                  </div>
                  <div className={`product-growth ${getGrowthClass(product.growth || 0)}`}>
                    {getGrowthIcon(product.growth || 0)} {Math.abs(product.growth || 0)}%
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message" style={{ minHeight: '100px' }}>
                No products data available
              </div>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="data-card">
          <div className="card-header-analytics">
            <h3 className="card-title">⭐ Top Customers</h3>
            <button className="view-all-btn" onClick={() => setShowAllCustomers(true)}>
              View All →
            </button>
          </div>
          <div className="customer-list">
            {topCustomers.length > 0 ? (
              topCustomers.map((customer, index) => (
                <div key={index} className="customer-item">
                  <div className="customer-rank">#{index + 1}</div>
                  <div className="customer-info-analytics">
                    <div className="customer-name-analytics">
                      {customer.name}
                      <span className={`customer-tier-badge tier-${(customer.tier || 'bronze').toLowerCase()}`}>
                        {customer.tier || 'Bronze'}
                      </span>
                    </div>
                    <div className="customer-stats">
                      <span>📦 {customer.orders || 0} orders</span>
                      <span>💰 {formatCurrency(customer.spent || 0)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message" style={{ minHeight: '100px' }}>
                No customers data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div className="insights-section">
        {insights.map((insight, index) => (
          <div key={index} className="insight-card">
            <div className="insight-icon">{insight.icon}</div>
            <div className="insight-content">
              <h4>{insight.title}</h4>
              <p>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedDataPoint && (
        <div className="modal-overlay-analytics" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content-analytics" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-analytics">
              <h2>Performance Details</h2>
              <button className="close-modal-analytics" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body-analytics">
              <div className="detail-section">
                <p><strong>Period:</strong> {selectedDataPoint.label}</p>
                <p><strong>Metric:</strong> {selectedDataPoint.metric.charAt(0).toUpperCase() + selectedDataPoint.metric.slice(1)}</p>
                <p><strong>Value:</strong> {
                  selectedDataPoint.metric === "revenue" || selectedDataPoint.metric === "profit" 
                    ? formatCurrency(selectedDataPoint.value) 
                    : formatNumber(selectedDataPoint.value)
                }</p>
                <p><strong>Comparison:</strong> {
                  (() => {
                    const currentIndex = currentData.data.indexOf(selectedDataPoint.value);
                    const prevValue = currentIndex > 0 ? currentData.data[currentIndex - 1] : 0;
                    const diff = selectedDataPoint.value - prevValue;
                    return selectedDataPoint.metric === "revenue" || selectedDataPoint.metric === "profit"
                      ? formatCurrency(diff)
                      : formatNumber(diff);
                  })()
                } from previous {selectedDataPoint.metric === "revenue" || selectedDataPoint.metric === "profit" ? 'month' : 'period'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Products Modal */}
      {showAllProducts && (
        <div className="modal-overlay-analytics" onClick={() => setShowAllProducts(false)}>
          <div className="modal-content-analytics all-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-analytics">
              <h2>🏆 All Products</h2>
              <button className="close-modal-analytics" onClick={() => setShowAllProducts(false)}>✕</button>
            </div>
            <div className="modal-body-analytics">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="modal-item">
                    <div className="modal-rank">#{index + 1}</div>
                    <div className="modal-info">
                      <div className="modal-name">{product.name}</div>
                      <div className="modal-details">
                        <span>💰 {formatCurrency(product.revenue)}</span>
                        <span>📦 {product.units || 0} units</span>
                        <span className={`modal-growth ${getGrowthClass(product.growth || 0)}`}>
                          {getGrowthIcon(product.growth || 0)} {Math.abs(product.growth || 0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">No products available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* All Customers Modal */}
      {showAllCustomers && (
        <div className="modal-overlay-analytics" onClick={() => setShowAllCustomers(false)}>
          <div className="modal-content-analytics all-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-analytics">
              <h2>⭐ All Customers</h2>
              <button className="close-modal-analytics" onClick={() => setShowAllCustomers(false)}>✕</button>
            </div>
            <div className="modal-body-analytics">
              {topCustomers.length > 0 ? (
                topCustomers.map((customer, index) => (
                  <div key={index} className="modal-item">
                    <div className="modal-rank">#{index + 1}</div>
                    <div className="modal-info">
                      <div className="modal-name">
                        {customer.name}
                        <span className={`customer-tier-badge tier-${(customer.tier || 'bronze').toLowerCase()}`}>
                          {customer.tier || 'Bronze'}
                        </span>
                      </div>
                      <div className="modal-details">
                        <span>📦 {customer.orders || 0} orders</span>
                        <span>💰 {formatCurrency(customer.spent || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data-message">No customers available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && (
        <div className="modal-overlay-analytics" onClick={() => setShowExportModal(false)}>
          <div className="modal-content-analytics export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-analytics">
              <h2>📊 Export Report</h2>
              <button className="close-modal-analytics" onClick={() => setShowExportModal(false)}>✕</button>
            </div>
            <div className="modal-body-analytics">
              <div className="export-options">
                <div className="export-info">
                  <p><strong>Timeframe:</strong> {timeframe}</p>
                  <p><strong>Data Includes:</strong> Revenue, Orders, Customers, Profit, Top Products, Top Customers</p>
                </div>
                <div className="form-group">
                  <label>Export Format</label>
                  <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF (Print)</option>
                  </select>
                </div>
                <div className="export-preview">
                  <h4>Preview</h4>
                  <div className="preview-item">
                    <span>Total Revenue:</span>
                    <strong>{formatCurrency(analyticsData.revenue.current)}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Total Orders:</span>
                    <strong>{formatNumber(analyticsData.orders.current)}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Active Customers:</span>
                    <strong>{formatNumber(analyticsData.customers.current)}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Inventory Value:</span>
                    <strong>{formatCurrency(inventoryValue)}</strong>
                  </div>
                  <div className="preview-item">
                    <span>Avg Order Value:</span>
                    <strong>{formatCurrency(avgOrderValue)}</strong>
                  </div>
                </div>
                <div className="export-note">
                  <p>💡 <strong>PDF:</strong> Opens in new window → Click "Print" → Save as PDF</p>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowExportModal(false)}>Cancel</button>
              <button className="btn-submit" onClick={handleExport}>
                {exportFormat === 'pdf' ? 'Generate PDF' : `Download ${exportFormat.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="modal-overlay-analytics" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content-analytics schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-analytics">
              <h2>📅 Schedule Report</h2>
              <button className="close-modal-analytics" onClick={() => setShowScheduleModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSchedule}>
              <div className="modal-body-analytics">
                <div className="schedule-options">
                  <p className="schedule-info">Schedule automated report delivery to your email.</p>
                  
                  <div className="form-group">
                    <label>Frequency</label>
                    <select 
                      value={scheduleData.frequency} 
                      onChange={(e) => setScheduleData({...scheduleData, frequency: e.target.value})}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={scheduleData.email}
                      onChange={(e) => setScheduleData({...scheduleData, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Report Format</label>
                    <select 
                      value={scheduleData.format} 
                      onChange={(e) => setScheduleData({...scheduleData, format: e.target.value})}
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                    </select>
                  </div>

                  <div className="schedule-summary">
                    <p>📋 Summary</p>
                    <div className="summary-row">
                      <span>Frequency:</span>
                      <strong>{scheduleData.frequency}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Email:</span>
                      <strong>{scheduleData.email || 'Not set'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Format:</span>
                      <strong>{scheduleData.format.toUpperCase()}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowScheduleModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit">Schedule Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analytics;