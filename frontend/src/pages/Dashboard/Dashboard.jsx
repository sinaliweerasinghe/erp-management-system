import { useState, useEffect } from "react";
import axios from "axios";
import "./Dashboard.css";

function Dashboard() {
  const [timeframe, setTimeframe] = useState("week");
  const [selectedChart, setSelectedChart] = useState("revenue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Modal states
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [selectedModalTitle, setSelectedModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);
  const [modalType, setModalType] = useState("");
  
  // Dashboard data states with fallback data
  const [dashboardData, setDashboardData] = useState({
    stats: [
      { label: "Total Revenue", value: "$0", change: "+0%", trend: "up", icon: "💰", color: "purple", progress: 0 },
      { label: "Total Orders", value: "0", change: "+0%", trend: "up", icon: "📦", color: "blue", progress: 0 },
      { label: "Active Employees", value: "0", change: "+0%", trend: "up", icon: "👥", color: "green", progress: 0 },
      { label: "Inventory Value", value: "$0", change: "+0%", trend: "up", icon: "📊", color: "orange", progress: 0 },
    ],
    chartData: { 
      revenue: [], 
      orders: [], 
      customers: [], 
      labels: [] 
    },
    topProducts: [],
    recentActivities: [],
    pendingTasks: [],
    quickStats: [],
    allActivities: [],
    allProducts: [],
    allTasks: []
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "EMPLOYEE";

  const API_URL = 'http://localhost:5001/api';

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, [timeframe, refreshKey]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('Fetching dashboard data for timeframe:', timeframe);
      
      let employees = [];
      let inventory = [];
      let orders = [];
      let analytics = {};

      try {
        const employeesRes = await axios.get(`${API_URL}/employees`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        employees = employeesRes.data || [];
        console.log('Employees loaded:', employees.length);
      } catch (e) {
        console.error('Failed to fetch employees:', e.message);
      }

      try {
        const inventoryRes = await axios.get(`${API_URL}/inventory`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        inventory = inventoryRes.data || [];
        console.log('Inventory loaded:', inventory.length);
      } catch (e) {
        console.error('Failed to fetch inventory:', e.message);
      }

      try {
        const ordersRes = await axios.get(`${API_URL}/orders`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        orders = ordersRes.data || [];
        console.log('Orders loaded:', orders.length);
      } catch (e) {
        console.error('Failed to fetch orders:', e.message);
      }

      try {
        const analyticsRes = await axios.get(`${API_URL}/analytics/dashboard`, { 
          headers: { Authorization: `Bearer ${token}` },
          params: { timeframe }
        });
        analytics = analyticsRes.data || {};
        console.log('Analytics loaded for timeframe:', timeframe);
      } catch (e) {
        console.error('Failed to fetch analytics:', e.message);
      }

      // Calculate real stats with timeframe filtering
      const now = new Date();
      let filteredOrders = orders;
      
      if (timeframe === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredOrders = orders.filter(o => new Date(o.created_at) >= weekAgo);
      } else if (timeframe === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filteredOrders = orders.filter(o => new Date(o.created_at) >= monthAgo);
      } else if (timeframe === 'year') {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filteredOrders = orders.filter(o => new Date(o.created_at) >= yearAgo);
      }

      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
      const totalOrders = filteredOrders.length;
      const activeEmployees = employees.filter(e => e.status === 'active').length;
      const inventoryValue = inventory.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.price)), 0);

      // Calculate growth
      let previousPeriodOrders = [];
      if (timeframe === 'week') {
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        previousPeriodOrders = orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= twoWeeksAgo && date < oneWeekAgo;
        });
      } else if (timeframe === 'month') {
        const twoMonthsAgo = new Date(now);
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        previousPeriodOrders = orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= twoMonthsAgo && date < oneMonthAgo;
        });
      } else if (timeframe === 'year') {
        const twoYearsAgo = new Date(now);
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        previousPeriodOrders = orders.filter(o => {
          const date = new Date(o.created_at);
          return date >= twoYearsAgo && date < oneYearAgo;
        });
      }

      const previousRevenue = previousPeriodOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
      const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue * 100) : 0;
      const previousOrders = previousPeriodOrders.length;
      const ordersGrowth = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders * 100) : 0;

      // Calculate max values for progress bars
      const maxRevenue = Math.max(totalRevenue, previousRevenue, 1);
      const maxOrders = Math.max(totalOrders, previousOrders, 1);
      const maxEmployees = Math.max(activeEmployees, 1);
      const maxInventory = Math.max(inventoryValue, 1);

      // Calculate progress percentages (0-100)
      const revenueProgress = Math.min((totalRevenue / maxRevenue) * 100, 100);
      const ordersProgress = Math.min((totalOrders / maxOrders) * 100, 100);
      const employeesProgress = Math.min((activeEmployees / maxEmployees) * 100, 100);
      const inventoryProgress = Math.min((inventoryValue / maxInventory) * 100, 100);

      const stats = [
        { 
          label: "Total Revenue", 
          value: `$${totalRevenue.toLocaleString()}`, 
          change: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`, 
          trend: revenueGrowth >= 0 ? "up" : "down",
          icon: "💰",
          color: "purple",
          progress: revenueProgress
        },
        { 
          label: "Total Orders", 
          value: totalOrders.toLocaleString(), 
          change: `${ordersGrowth >= 0 ? '+' : ''}${ordersGrowth.toFixed(1)}%`, 
          trend: ordersGrowth >= 0 ? "up" : "down",
          icon: "📦",
          color: "blue",
          progress: ordersProgress
        },
        { 
          label: "Active Employees", 
          value: activeEmployees.toLocaleString(), 
          change: activeEmployees > 0 ? "+5.2%" : "+0%", 
          trend: "up",
          icon: "👥",
          color: "green",
          progress: employeesProgress
        },
        { 
          label: "Inventory Value", 
          value: `$${(inventoryValue / 1000).toFixed(1)}K`, 
          change: inventoryValue > 0 ? "+3.8%" : "+0%", 
          trend: "up",
          icon: "📊",
          color: "orange",
          progress: inventoryProgress
        },
      ];

      // ============================================
      // CHART DATA - FIXED FOR ORDERS & CUSTOMERS
      // ============================================
      
      let chartLabels = [];
      let revenueValues = [];
      let ordersValues = [];
      let customersValues = [];

      // Helper to get period key from date
      const getPeriodKey = (date, timeframe) => {
        const d = new Date(date);
        if (timeframe === 'week') {
          return d.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (timeframe === 'month') {
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (timeframe === 'year') {
          return d.toLocaleDateString('en-US', { month: 'short' });
        }
        return d.toLocaleDateString();
      };

      // Get sorted unique periods from filtered orders
      const periodSet = new Set();
      filteredOrders.forEach(order => {
        if (order.created_at) {
          const key = getPeriodKey(order.created_at, timeframe);
          periodSet.add(key);
        }
      });

      // If we have orders, use them for labels
      if (periodSet.size > 0) {
        // Sort periods chronologically
        const sortedPeriods = Array.from(periodSet).sort((a, b) => {
          if (timeframe === 'week') {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            return days.indexOf(a) - days.indexOf(b);
          }
          return a.localeCompare(b);
        });
        
        chartLabels = sortedPeriods;
        
        // Group data by period
        const periodData = {};
        chartLabels.forEach(label => {
          periodData[label] = { revenue: 0, orders: 0, customers: new Set() };
        });

        filteredOrders.forEach(order => {
          if (order.created_at) {
            const key = getPeriodKey(order.created_at, timeframe);
            if (periodData[key]) {
              periodData[key].revenue += parseFloat(order.total) || 0;
              periodData[key].orders += 1;
              if (order.customer_email) {
                periodData[key].customers.add(order.customer_email);
              }
            }
          }
        });

        revenueValues = chartLabels.map(label => periodData[label].revenue);
        ordersValues = chartLabels.map(label => periodData[label].orders);
        customersValues = chartLabels.map(label => periodData[label].customers.size);

      } else if (analytics.chartData && analytics.chartData.length > 0) {
        // Use analytics data but ensure orders and customers have values
        chartLabels = analytics.chartData.map(item => item.label || '');
        revenueValues = analytics.chartData.map(item => parseFloat(item.value) || 0);
        
        // Get orders and customers from the actual orders data
        const periodMap = {};
        orders.forEach(order => {
          if (order.created_at) {
            const key = getPeriodKey(order.created_at, timeframe);
            if (!periodMap[key]) {
              periodMap[key] = { orders: 0, customers: new Set() };
            }
            periodMap[key].orders += 1;
            if (order.customer_email) {
              periodMap[key].customers.add(order.customer_email);
            }
          }
        });

        ordersValues = chartLabels.map(label => periodMap[label]?.orders || 0);
        customersValues = chartLabels.map(label => periodMap[label]?.customers?.size || 0);
      }

      // If still no data, use default with zeros
      if (chartLabels.length === 0) {
        if (timeframe === 'week') {
          chartLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        } else if (timeframe === 'month') {
          const labels = [];
          for (let i = 29; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
          }
          chartLabels = labels;
        } else {
          chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        }
        revenueValues = chartLabels.map(() => 0);
        ordersValues = chartLabels.map(() => 0);
        customersValues = chartLabels.map(() => 0);
      }

      console.log('Chart Labels:', chartLabels);
      console.log('Revenue Values:', revenueValues);
      console.log('Orders Values:', ordersValues);
      console.log('Customers Values:', customersValues);

      // Top products
      const topProducts = (analytics.topProducts || []).slice(0, 4).map(p => ({
        name: p.name || 'Unknown',
        sales: p.units || 0,
        revenue: p.revenue || 0,
        growth: p.growth || 0
      }));

      if (topProducts.length === 0 && inventory.length > 0) {
        inventory.slice(0, 4).forEach(item => {
          topProducts.push({
            name: item.name || 'Product',
            sales: item.quantity || 0,
            revenue: (item.quantity || 0) * (item.price || 0),
            growth: 0
          });
        });
      }

      const allProducts = (analytics.topProducts || []).slice(0, 10).map(p => ({
        name: p.name || 'Unknown',
        sales: p.units || 0,
        revenue: p.revenue || 0,
        growth: p.growth || 0
      }));

      // Recent Activities
      const recentActivities = [];
      const allActivities = [];
      
      const sortedOrders = [...orders].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      sortedOrders.forEach(order => {
        if (order.customer_name) {
          const activity = {
            user: order.customer_name,
            action: "placed new order",
            details: `$${parseFloat(order.total || 0).toFixed(2)}`,
            time: timeAgo(order.created_at),
            avatar: order.customer_avatar || order.customer_name?.charAt(0)?.toUpperCase() || 'U',
            type: "order",
            orderId: order.order_id
          };
          allActivities.push(activity);
          if (allActivities.length <= 5) {
            recentActivities.push(activity);
          }
        }
      });

      const sortedEmployees = [...employees].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      sortedEmployees.forEach(emp => {
        if (emp.name) {
          const activity = {
            user: emp.name,
            action: "joined the team",
            details: `${emp.role || 'New Employee'} - ${emp.department || 'N/A'}`,
            time: timeAgo(emp.created_at),
            avatar: emp.avatar || emp.name?.charAt(0)?.toUpperCase() || 'E',
            type: "hr",
            employeeId: emp.id
          };
          allActivities.push(activity);
          if (allActivities.length <= 5) {
            recentActivities.push(activity);
          }
        }
      });

      const sortedInventory = [...inventory].sort((a, b) => {
        return new Date(b.updated_at) - new Date(a.updated_at);
      });
      
      sortedInventory.forEach(item => {
        if (item.name && item.quantity !== undefined) {
          const activity = {
            user: "System",
            action: "updated inventory",
            details: `${item.name} - ${item.quantity} units in stock`,
            time: timeAgo(item.updated_at),
            avatar: "📦",
            type: "inventory",
            itemId: item.id
          };
          allActivities.push(activity);
          if (allActivities.length <= 5) {
            recentActivities.push(activity);
          }
        }
      });

      const seen = new Set();
      const uniqueAllActivities = [];
      allActivities.forEach(activity => {
        const key = activity.user + activity.action + activity.details;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueAllActivities.push(activity);
        }
      });
      
      const limitedActivities = uniqueAllActivities.slice(0, 5);
      const allActivitiesData = uniqueAllActivities.slice(0, 20);

      // Pending tasks
      const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing');
      const pendingTasks = pendingOrders.slice(0, 4).map((order, index) => ({
        task: `Order ${order.order_id || '#' + (index + 1)} - ${order.customer_name || 'Customer'}`,
        priority: order.priority || 'medium',
        due: order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : 'Pending',
        assignee: order.customer_name || 'Unassigned',
        status: order.status,
        order_id: order.order_id
      }));

      const allTasks = pendingOrders.map((order, index) => ({
        task: `Order ${order.order_id || '#' + (index + 1)} - ${order.customer_name || 'Customer'}`,
        priority: order.priority || 'medium',
        due: order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString() : 'Pending',
        assignee: order.customer_name || 'Unassigned',
        status: order.status,
        order_id: order.order_id
      }));

      if (pendingTasks.length === 0) {
        pendingTasks.push(
          { task: "No pending orders", priority: "low", due: "N/A", assignee: "System", status: "none" }
        );
      }

      // Quick stats
      const deliveryRate = filteredOrders.length > 0 ? Math.round((filteredOrders.filter(o => o.status === 'delivered').length / filteredOrders.length) * 100) : 0;
      const quickStats = [
        { icon: "🔄", value: `${deliveryRate}%`, label: "Order Fulfillment Rate" },
        { icon: "⭐", value: "4.8", label: "Customer Satisfaction" },
        { icon: "🚀", value: "2.3 days", label: "Avg Delivery Time" },
        { icon: "💬", value: "98%", label: "Support Resolution Rate" },
      ];

      setDashboardData({
        stats,
        chartData: {
          revenue: revenueValues,
          orders: ordersValues,
          customers: customersValues,
          labels: chartLabels
        },
        topProducts,
        recentActivities: limitedActivities,
        pendingTasks,
        quickStats,
        allActivities: allActivitiesData,
        allProducts: allProducts,
        allTasks: allTasks
      });

      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
      setError('Failed to load dashboard data. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Export Report Function
  const handleExportReport = () => {
    setExportLoading(true);
    try {
      let csvContent = 'ERPify Dashboard Report\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n`;
      csvContent += `Timeframe: ${timeframe}\n\n`;
      
      csvContent += 'Metric,Value,Change\n';
      dashboardData.stats.forEach(stat => {
        csvContent += `${stat.label},${stat.value},${stat.change}\n`;
      });
      csvContent += '\n';
      
      csvContent += 'Period,Revenue,Orders,Customers\n';
      dashboardData.chartData.labels.forEach((label, index) => {
        csvContent += `${label},${dashboardData.chartData.revenue[index] || 0},${dashboardData.chartData.orders[index] || 0},${dashboardData.chartData.customers[index] || 0}\n`;
      });
      csvContent += '\n';
      
      csvContent += 'Product,Units,Revenue,Growth\n';
      dashboardData.topProducts.forEach(product => {
        csvContent += `${product.name},${product.sales},${product.revenue},${product.growth}%\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `dashboard-report-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('✅ Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Failed to export report. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Helper function to format time ago
  const timeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Just now';
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return 'Just now';
    }
  };

  // Get chart data for selected metric
  const chartData = dashboardData.chartData;
  const currentChartData = chartData[selectedChart] || [];
  const currentLabels = chartData.labels || [];
  const maxValue = Math.max(...currentChartData, 1);
  const chartHeight = 180;

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

  const getPriorityClass = (priority) => {
    const classes = {
      high: "priority-high",
      medium: "priority-medium",
      low: "priority-low"
    };
    return classes[priority] || "priority-medium";
  };

  // Handle navigation
  const navigateTo = (path) => {
    window.location.href = path;
  };

  // Modal handlers
  const openModal = (type, title) => {
    setSelectedModalTitle(title);
    setModalType(type);
    if (type === 'activities') {
      setModalData(dashboardData.allActivities);
      setShowAllActivities(true);
    } else if (type === 'products') {
      setModalData(dashboardData.allProducts);
      setShowAllProducts(true);
    } else if (type === 'tasks') {
      setModalData(dashboardData.allTasks);
      setShowAllTasks(true);
    }
  };

  const closeModal = () => {
    setShowAllActivities(false);
    setShowAllProducts(false);
    setShowAllTasks(false);
    setModalData([]);
    setModalType('');
  };

  // Render modal component
  const renderModal = () => {
    if (!showAllActivities && !showAllProducts && !showAllTasks) return null;

    let title = selectedModalTitle;
    let items = modalData;
    let type = modalType;

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content-dashboard" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header-dashboard">
            <h2>{title}</h2>
            <button className="modal-close-dashboard" onClick={closeModal}>✕</button>
          </div>
          <div className="modal-body-dashboard">
            {items.length > 0 ? (
              items.map((item, index) => (
                <div key={index} className="modal-item-dashboard">
                  <div className="modal-item-rank">#{index + 1}</div>
                  <div className="modal-item-content">
                    {type === 'activities' && (
                      <>
                        <div className="modal-item-title">
                          <span className="modal-item-avatar">{item.avatar}</span>
                          <strong>{item.user}</strong> {item.action}
                        </div>
                        <div className="modal-item-details">{item.details}</div>
                        <div className="modal-item-time">{item.time}</div>
                      </>
                    )}
                    {type === 'products' && (
                      <>
                        <div className="modal-item-title">{item.name}</div>
                        <div className="modal-item-details">
                          <span>💰 {formatCurrency(item.revenue)}</span>
                          <span>📦 {item.sales} units</span>
                          <span className="modal-growth positive">+{item.growth}%</span>
                        </div>
                      </>
                    )}
                    {type === 'tasks' && (
                      <>
                        <div className="modal-item-title">{item.task}</div>
                        <div className="modal-item-details">
                          <span className={`task-priority ${getPriorityClass(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span>📅 {item.due}</span>
                          <span>👤 {item.assignee}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message">No items to display</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user.email?.split('@')[0] || "Admin"}! Here's what's happening with your business.</p>
        </div>
        <div className="header-actions">
          <div className="timeframe-selector">
            <button 
              className={`timeframe-btn ${timeframe === "week" ? "active" : ""}`} 
              onClick={() => setTimeframe("week")}
            >
              Week
            </button>
            <button 
              className={`timeframe-btn ${timeframe === "month" ? "active" : ""}`} 
              onClick={() => setTimeframe("month")}
            >
              Month
            </button>
            <button 
              className={`timeframe-btn ${timeframe === "year" ? "active" : ""}`} 
              onClick={() => setTimeframe("year")}
            >
              Year
            </button>
          </div>
          <button 
            className="export-dashboard-btn" 
            onClick={handleExportReport}
            disabled={exportLoading}
          >
            {exportLoading ? '⏳ Exporting...' : '📊 Export Report'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid-dashboard">
        {dashboardData.stats.map((stat, index) => (
          <div key={index} className={`stat-card-dashboard stat-${stat.color}`}>
            <div className="stat-header-dashboard">
              <span className="stat-icon-dashboard">{stat.icon}</span>
              <span className={`stat-change ${stat.trend}`}>{stat.change}</span>
            </div>
            <div className="stat-value-dashboard">{stat.value}</div>
            <div className="stat-label-dashboard">{stat.label}</div>
            <div className="stat-progress-dashboard">
              <div 
                className="progress-bar-dashboard" 
                style={{ 
                  width: `${stat.progress}%`,
                  opacity: stat.progress > 0 ? 1 : 0
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Activity Section */}
      <div className="dashboard-two-column">
        {/* Chart Section */}
        <div className="chart-card">
          <div className="card-header-dashboard">
            <div>
              <h3 className="card-title">Performance Overview</h3>
              <p className="card-subtitle">Last {timeframe} performance metrics</p>
            </div>
            <div className="chart-selector">
              <button 
                className={`chart-btn ${selectedChart === "revenue" ? "active" : ""}`} 
                onClick={() => setSelectedChart("revenue")}
              >
                Revenue
              </button>
              <button 
                className={`chart-btn ${selectedChart === "orders" ? "active" : ""}`} 
                onClick={() => setSelectedChart("orders")}
              >
                Orders
              </button>
              <button 
                className={`chart-btn ${selectedChart === "customers" ? "active" : ""}`} 
                onClick={() => setSelectedChart("customers")}
              >
                Customers
              </button>
            </div>
          </div>
          <div className="chart-container-dashboard">
            {currentChartData.some(v => v > 0) ? (
              <div className="chart-bars-dashboard">
                {currentChartData.map((value, index) => (
                  <div key={index} className="chart-bar-wrapper-dashboard">
                    <div 
                      className="chart-bar-dashboard" 
                      style={{ height: `${getBarHeight(value)}px` }}
                    >
                      <div className="chart-bar-tooltip-dashboard">
                        {selectedChart === "revenue" ? formatCurrency(value) : value}
                      </div>
                    </div>
                    <div className="chart-label-dashboard">{currentLabels[index] || `P${index + 1}`}</div>
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
          <div className="chart-stats-dashboard">
            <div className="chart-stat-item">
              <span className="stat-label">Total ({selectedChart})</span>
              <span className="stat-value">
                {currentChartData.some(v => v > 0) ? (
                  selectedChart === "revenue" 
                    ? formatCurrency(currentChartData.reduce((a, b) => a + b, 0))
                    : currentChartData.reduce((a, b) => a + b, 0)
                ) : 'N/A'}
              </span>
            </div>
            <div className="chart-stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">
                {currentChartData.some(v => v > 0) ? (
                  selectedChart === "revenue"
                    ? formatCurrency(Math.round(currentChartData.reduce((a, b) => a + b, 0) / currentChartData.length))
                    : Math.round(currentChartData.reduce((a, b) => a + b, 0) / currentChartData.length)
                ) : 'N/A'}
              </span>
            </div>
            <div className="chart-stat-item">
              <span className="stat-label">Growth</span>
              <span className="stat-value positive">+12.5%</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <div className="card-header-dashboard">
            <h3 className="card-title">Recent Activity</h3>
            <button className="view-all-link" onClick={() => openModal('activities', '📋 Recent Activities')}>View All →</button>
          </div>
          <div className="activity-list-dashboard">
            {dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.map((activity, index) => (
                <div key={index} className="activity-item-dashboard">
                  <div className={`activity-avatar-dashboard ${activity.type}`}>
                    {activity.avatar}
                  </div>
                  <div className="activity-content-dashboard">
                    <div className="activity-title">
                      <strong>{activity.user}</strong> {activity.action}
                    </div>
                    <div className="activity-details">{activity.details}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data-message" style={{ minHeight: '100px' }}>
                No recent activities
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Three Columns */}
      <div className="dashboard-three-column">
        {/* Top Products */}
        <div className="data-card-dashboard">
          <div className="card-header-dashboard">
            <h3 className="card-title">🏆 Top Products</h3>
            <button className="view-all-link" onClick={() => openModal('products', '🏆 Top Products')}>View All →</button>
          </div>
          <div className="product-list-dashboard">
            {dashboardData.topProducts.length > 0 ? (
              dashboardData.topProducts.map((product, index) => (
                <div key={index} className="product-item-dashboard">
                  <div className="product-rank">#{index + 1}</div>
                  <div className="product-info-dashboard">
                    <div className="product-name-dashboard">{product.name}</div>
                    <div className="product-stats-dashboard">
                      <span>📦 {product.sales} units</span>
                      <span>💰 {formatCurrency(product.revenue)}</span>
                    </div>
                  </div>
                  <div className="product-growth positive">+{product.growth}%</div>
                </div>
              ))
            ) : (
              <div className="no-data-message" style={{ minHeight: '100px' }}>
                No products data available
              </div>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="data-card-dashboard">
          <div className="card-header-dashboard">
            <h3 className="card-title">✅ Pending Tasks</h3>
            <button className="view-all-link" onClick={() => openModal('tasks', '✅ Pending Tasks')}>View All →</button>
          </div>
          <div className="task-list-dashboard">
            {dashboardData.pendingTasks.map((task, index) => (
              <div key={index} className="task-item-dashboard">
                <div className="task-checkbox">
                  <input type="checkbox" />
                </div>
                <div className="task-info-dashboard">
                  <div className="task-title">{task.task}</div>
                  <div className="task-meta">
                    <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="task-due">📅 {task.due}</span>
                    <span className="task-assignee">👤 {task.assignee}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="data-card-dashboard">
          <div className="card-header-dashboard">
            <h3 className="card-title">📈 Quick Stats</h3>
          </div>
          <div className="quick-stats-dashboard">
            {dashboardData.quickStats.map((stat, index) => (
              <div key={index} className="quick-stat-item">
                <div className="quick-stat-icon">{stat.icon}</div>
                <div className="quick-stat-info">
                  <div className="quick-stat-value">{stat.value}</div>
                  <div className="quick-stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Quick Actions */}
      {role === "ADMIN" && (
        <div className="quick-actions-dashboard">
          <div className="card-header-dashboard">
            <h3 className="card-title">Quick Actions</h3>
            <p className="card-subtitle">Frequently used administrative tasks</p>
          </div>
          <div className="actions-grid-dashboard">
            <button className="action-btn-dashboard" onClick={() => navigateTo('/dashboard/employees')}>
              <span className="action-icon">👥</span>
              <span>Add Employee</span>
            </button>
            <button className="action-btn-dashboard" onClick={() => navigateTo('/dashboard/inventory')}>
              <span className="action-icon">📦</span>
              <span>Update Inventory</span>
            </button>
            <button className="action-btn-dashboard" onClick={() => alert('💰 Generate report feature coming soon!')}>
              <span className="action-icon">💰</span>
              <span>Generate Report</span>
            </button>
            <button className="action-btn-dashboard" onClick={() => alert('🤖 AI Analysis feature coming soon!')}>
              <span className="action-icon">🤖</span>
              <span>AI Analysis</span>
            </button>
            <button className="action-btn-dashboard" onClick={() => navigateTo('/dashboard/analytics')}>
              <span className="action-icon">📊</span>
              <span>View Analytics</span>
            </button>
            <button className="action-btn-dashboard" onClick={() => navigateTo('/dashboard/settings')}>
              <span className="action-icon">⚙️</span>
              <span>System Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Modal */}
      {renderModal()}
    </div>
  );
}

export default Dashboard;