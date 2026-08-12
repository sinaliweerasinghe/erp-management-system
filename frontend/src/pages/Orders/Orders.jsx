import { useState, useEffect } from "react";
import axios from "axios";
import "./Orders.css";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timeframe, setTimeframe] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  // Form states for Create Order
  const [createFormData, setCreateFormData] = useState({
    order_id: "",
    customer_name: "",
    customer_email: "",
    customer_avatar: "",
    customer_tier: "Bronze",
    items: [{ name: "", quantity: 1, price: 0 }],
    total: 0,
    status: "pending",
    priority: "medium",
    payment_method: "",
    shipping_address: "",
    tracking_number: "",
    estimated_delivery: "",
    notes: ""
  });

  const API_URL = 'http://localhost:5001/api';

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, [sortBy, sortOrder, timeframe]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          sortBy,
          sortOrder,
          timeframe,
          search: searchTerm || undefined,
          status: selectedStatus !== "all" ? selectedStatus : undefined,
          priority: selectedPriority !== "all" ? selectedPriority : undefined
        }
      });
      setOrders(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError('Failed to load orders. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 0) {
        fetchOrders();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Handle filter changes
  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, selectedPriority]);

  const filteredOrders = orders;

  // Calculate stats from real data
  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((acc, order) => acc + parseFloat(order.total || 0), 0),
    avgOrderValue: orders.length > 0 ? orders.reduce((acc, order) => acc + parseFloat(order.total || 0), 0) / orders.length : 0,
    pendingOrders: orders.filter(o => o.status === "pending").length,
    processingOrders: orders.filter(o => o.status === "processing").length,
    shippedOrders: orders.filter(o => o.status === "shipped").length,
    deliveredOrders: orders.filter(o => o.status === "delivered").length,
    cancelledOrders: orders.filter(o => o.status === "cancelled").length,
    completionRate: orders.length > 0 ? (orders.filter(o => o.status === "delivered").length / orders.length) * 100 : 0,
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { class: "status-pending", icon: "⏳", label: "Pending" },
      processing: { class: "status-processing", icon: "🔄", label: "Processing" },
      shipped: { class: "status-shipped", icon: "🚚", label: "Shipped" },
      delivered: { class: "status-delivered", icon: "✅", label: "Delivered" },
      cancelled: { class: "status-cancelled", icon: "❌", label: "Cancelled" },
    };
    return configs[status] || configs.pending;
  };

  const getPriorityConfig = (priority) => {
    const configs = {
      high: { class: "priority-high", icon: "🔴", label: "High" },
      medium: { class: "priority-medium", icon: "🟡", label: "Medium" },
      low: { class: "priority-low", icon: "🟢", label: "Low" },
    };
    return configs[priority] || configs.medium;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="sort-icon">↕️</span>;
    return <span className="sort-icon">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  // Open update status modal
  const openUpdateStatusModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setShowUpdateStatusModal(true);
  };

  // Handle Create Form input changes
  const handleCreateInputChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle item changes in create form
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...createFormData.items];
    updatedItems[index][field] = value;
    setCreateFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    // Recalculate total
    calculateTotal(updatedItems);
  };

  // Add item row in create form
  const addItemRow = () => {
    setCreateFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0 }]
    }));
  };

  // Remove item row in create form
  const removeItemRow = (index) => {
    const updatedItems = createFormData.items.filter((_, i) => i !== index);
    setCreateFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
    calculateTotal(updatedItems);
  };

  // Calculate total
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0);
    setCreateFormData(prev => ({
      ...prev,
      total: total
    }));
  };

  // Reset create form
  const resetCreateForm = () => {
    setCreateFormData({
      order_id: "",
      customer_name: "",
      customer_email: "",
      customer_avatar: "",
      customer_tier: "Bronze",
      items: [{ name: "", quantity: 1, price: 0 }],
      total: 0,
      status: "pending",
      priority: "medium",
      payment_method: "",
      shipping_address: "",
      tracking_number: "",
      estimated_delivery: "",
      notes: ""
    });
  };

  // CREATE ORDER
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const orderData = {
        ...createFormData,
        items: createFormData.items.filter(item => item.name && item.price > 0),
        customer_avatar: createFormData.customer_avatar || createFormData.customer_name.split(" ").map(n => n[0]).join("").toUpperCase()
      };

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOrders([response.data.order, ...orders]);
      setShowCreateModal(false);
      resetCreateForm();
      alert('Order created successfully!');
    } catch (error) {
      console.error('Create order error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to create order';
      alert(errorMsg);
    }
  };

  // UPDATE ORDER STATUS
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(
        `${API_URL}/orders/${selectedOrder.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOrders(orders.map(order => 
        order.id === selectedOrder.id ? response.data.order : order
      ));
      setShowUpdateStatusModal(false);
      setSelectedOrder(null);
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Update status error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update status';
      alert(errorMsg);
    }
  };

  // DELETE ORDER
  const handleDeleteOrder = async (id) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login first');
          return;
        }

        await axios.delete(`${API_URL}/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setOrders(orders.filter(order => order.id !== id));
        alert('Order deleted successfully!');
      } catch (error) {
        console.error('Delete order error:', error);
        const errorMsg = error.response?.data?.error || 'Failed to delete order';
        alert(errorMsg);
      }
    }
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchOrders}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Header Section */}
      <div className="orders-header">
        <div className="header-left">
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Track, manage, and fulfill customer orders in real-time</p>
        </div>
        <div className="header-actions">
          <button className="analytics-btn" onClick={() => alert('Analytics coming soon!')}>
            📈 Analytics
          </button>
          <button className="create-order-btn" onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create Order
          </button>
        </div>
      </div>

      {/* Advanced Stats Dashboard */}
      <div className="stats-dashboard-orders">
        <div className="stat-card-orders premium">
          <div className="stat-header-orders">
            <div className="stat-icon-wrapper-orders">
              <span className="stat-icon-big-orders">📊</span>
            </div>
            <div className="stat-trend-orders positive">+15.3%</div>
          </div>
          <div className="stat-value-orders">{stats.totalOrders}</div>
          <div className="stat-label-orders">Total Orders</div>
          <div className="stat-sub-orders">All time</div>
        </div>

        <div className="stat-card-orders premium">
          <div className="stat-header-orders">
            <div className="stat-icon-wrapper-orders">
              <span className="stat-icon-big-orders">💰</span>
            </div>
            <div className="stat-trend-orders positive">+22.8%</div>
          </div>
          <div className="stat-value-orders">${(stats.totalRevenue / 1000).toFixed(1)}K</div>
          <div className="stat-label-orders">Total Revenue</div>
          <div className="stat-sub-orders">Lifetime sales</div>
        </div>

        <div className="stat-card-orders premium">
          <div className="stat-header-orders">
            <div className="stat-icon-wrapper-orders">
              <span className="stat-icon-big-orders">📦</span>
            </div>
            <div className="stat-trend-orders positive">+8.2%</div>
          </div>
          <div className="stat-value-orders">${stats.avgOrderValue.toFixed(0)}</div>
          <div className="stat-label-orders">Avg Order Value</div>
          <div className="stat-sub-orders">Per transaction</div>
        </div>

        <div className="stat-card-orders premium">
          <div className="stat-header-orders">
            <div className="stat-icon-wrapper-orders">
              <span className="stat-icon-big-orders">🎯</span>
            </div>
            <div className="stat-trend-orders positive">+5.7%</div>
          </div>
          <div className="stat-value-orders">{stats.completionRate.toFixed(0)}%</div>
          <div className="stat-label-orders">Completion Rate</div>
          <div className="stat-sub-orders">Successfully delivered</div>
        </div>
      </div>

      {/* Order Funnel */}
      <div className="order-funnel">
        <div className="funnel-step">
          <div className="funnel-count">{stats.pendingOrders}</div>
          <div className="funnel-label">Pending</div>
          <div className="funnel-bar" style={{ width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%`, background: "#f59e0b" }}></div>
        </div>
        <div className="funnel-step">
          <div className="funnel-count">{stats.processingOrders}</div>
          <div className="funnel-label">Processing</div>
          <div className="funnel-bar" style={{ width: `${stats.totalOrders > 0 ? (stats.processingOrders / stats.totalOrders) * 100 : 0}%`, background: "#3b82f6" }}></div>
        </div>
        <div className="funnel-step">
          <div className="funnel-count">{stats.shippedOrders}</div>
          <div className="funnel-label">Shipped</div>
          <div className="funnel-bar" style={{ width: `${stats.totalOrders > 0 ? (stats.shippedOrders / stats.totalOrders) * 100 : 0}%`, background: "#8b5cf6" }}></div>
        </div>
        <div className="funnel-step">
          <div className="funnel-count">{stats.deliveredOrders}</div>
          <div className="funnel-label">Delivered</div>
          <div className="funnel-bar" style={{ width: `${stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0}%`, background: "#10b981" }}></div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M19 19L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by order ID, customer name, or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="all">All time</option>
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 90 days</option>
          </select>

          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <div className="view-toggle">
            <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="11" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="1" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
            <button className={`view-btn ${viewMode === "table" ? "active" : ""}`} onClick={() => setViewMode("table")}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4H16M2 9H16M2 14H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <rect x="1" y="1" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results & Sorting */}
      <div className="results-header-orders">
        <div className="results-count-orders">
          <span className="count-number-orders">{filteredOrders.length}</span> orders found
        </div>
        <div className="sorting-controls-orders">
          <span className="sort-label">Sort by:</span>
          <button className={`sort-btn-orders ${sortBy === "created_at" ? "active" : ""}`} onClick={() => handleSort("created_at")}>
            Date <SortIcon field="created_at" />
          </button>
          <button className={`sort-btn-orders ${sortBy === "total" ? "active" : ""}`} onClick={() => handleSort("total")}>
            Total <SortIcon field="total" />
          </button>
          <button className={`sort-btn-orders ${sortBy === "customer_name" ? "active" : ""}`} onClick={() => handleSort("customer_name")}>
            Customer <SortIcon field="customer_name" />
          </button>
        </div>
      </div>

      {/* Orders Grid/Table View */}
      {viewMode === "grid" ? (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-card-header">
                <div className="order-id-priority">
                  <span className="order-id">{order.order_id}</span>
                  <span className={`priority-badge ${getPriorityConfig(order.priority).class}`}>
                    {getPriorityConfig(order.priority).icon} {getPriorityConfig(order.priority).label}
                  </span>
                </div>
                <div className={`order-status ${getStatusConfig(order.status).class}`}>
                  {getStatusConfig(order.status).icon} {getStatusConfig(order.status).label}
                </div>
              </div>

              <div className="order-customer-info">
                <div className="customer-avatar" style={{ background: `linear-gradient(135deg, #8b5cf6, #7c3aed)` }}>
                  {order.customer_avatar || order.customer_name?.charAt(0) || "U"}
                </div>
                <div className="customer-details">
                  <div className="customer-name">
                    {order.customer_name}
                    <span className={`customer-tier tier-${order.customer_tier?.toLowerCase() || 'bronze'}`}>
                      {order.customer_tier || 'Bronze'}
                    </span>
                  </div>
                  <div className="customer-email">{order.customer_email}</div>
                </div>
              </div>

              <div className="order-items">
                {order.items && order.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="order-item">
                    <span>{item.quantity}x</span>
                    <span>{item.name}</span>
                    <span>${parseFloat(item.price).toFixed(2)}</span>
                  </div>
                ))}
                {order.items && order.items.length > 2 && (
                  <div className="order-item-more">+{order.items.length - 2} more items</div>
                )}
              </div>

              <div className="order-meta">
                <div className="meta-item">
                  <span className="meta-icon">📅</span>
                  <span>{formatDate(order.created_at)} at {formatTime(order.created_at)}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">💳</span>
                  <span>{order.payment_method || 'N/A'}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{order.shipping_address?.split(',')[0] || 'N/A'}</span>
                </div>
              </div>

              <div className="order-total">
                <span>Total Amount</span>
                <span className="total-amount">${parseFloat(order.total).toFixed(2)}</span>
              </div>

              {order.tracking_number && (
                <div className="tracking-info">
                  <span className="tracking-icon">📦</span>
                  <span>Tracking: {order.tracking_number}</span>
                </div>
              )}

              <div className="order-card-actions">
                <button className="btn-view-details" onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}>
                  View Details
                </button>
                <button className="btn-update-status" onClick={() => openUpdateStatusModal(order)}>
                  Update Status
                </button>
                <button className="btn-delete-order" onClick={() => handleDeleteOrder(order.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} className={`priority-${order.priority}`}>
                  <td className="order-id-cell">
                    <span className="order-id-text">{order.order_id}</span>
                  </td>
                  <td className="customer-cell">
                    <div className="customer-info-table">
                      <div className="customer-avatar-small" style={{ background: `linear-gradient(135deg, #8b5cf6, #7c3aed)` }}>
                        {order.customer_avatar || order.customer_name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <div className="customer-name-table">{order.customer_name}</div>
                        <div className="customer-tier-table">{order.customer_tier || 'Bronze'} Member</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <div>{formatDate(order.created_at)}</div>
                      <div className="time-cell">{formatTime(order.created_at)}</div>
                    </div>
                  </td>
                  <td className="items-cell">
                    <div className="items-count">{order.items?.length || 0} items</div>
                    <div className="items-preview">{order.items?.[0]?.name || 'No items'}{order.items?.length > 1 ? ` +${order.items.length - 1}` : ''}</div>
                  </td>
                  <td className="total-cell">
                    <span className="total-amount-table">${parseFloat(order.total).toFixed(2)}</span>
                  </td>
                  <td>
                    <span className={`priority-badge-table ${getPriorityConfig(order.priority).class}`}>
                      {getPriorityConfig(order.priority).label}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge-table ${getStatusConfig(order.status).class}`}>
                      {getStatusConfig(order.status).icon} {getStatusConfig(order.status).label}
                    </span>
                  </td>
                  <td className="payment-cell">
                    <span className="payment-method">{order.payment_method || 'N/A'}</span>
                  </td>
                  <td className="actions-cell-orders">
                    <button className="table-action-view" onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}>
                      View
                    </button>
                    <button className="table-action-update" onClick={() => openUpdateStatusModal(order)}>
                      Status
                    </button>
                    <button className="table-action-delete" onClick={() => handleDeleteOrder(order.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Actions Footer */}
      <div className="orders-footer">
        <div className="footer-actions">
          <button className="bulk-action-btn" onClick={() => alert('Bulk update coming soon!')}>
            📦 Bulk Update
          </button>
          <button className="bulk-action-btn" onClick={() => alert('Export orders coming soon!')}>
            📊 Export Orders
          </button>
          <button className="bulk-action-btn" onClick={() => alert('Print labels coming soon!')}>
            🏷️ Print Labels
          </button>
        </div>
        <div className="footer-summary">
          <span>Total Value: <strong>${stats.totalRevenue.toFixed(2)}</strong></span>
          <span>Pending: <strong>{stats.pendingOrders}</strong></span>
          <span>Processing: <strong>{stats.processingOrders}</strong></span>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && showDetailsModal && (
        <div className="modal-overlay-orders" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content-orders" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-modal" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>Order Information</h3>
                <p><strong>Order ID:</strong> {selectedOrder.order_id}</p>
                <p><strong>Date:</strong> {formatDate(selectedOrder.created_at)} at {formatTime(selectedOrder.created_at)}</p>
                <p><strong>Status:</strong> {getStatusConfig(selectedOrder.status).label}</p>
                <p><strong>Priority:</strong> {getPriorityConfig(selectedOrder.priority).label}</p>
              </div>
              <div className="details-section">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                <p><strong>Tier:</strong> {selectedOrder.customer_tier || 'Bronze'}</p>
              </div>
              <div className="details-section">
                <h3>Shipping Information</h3>
                <p><strong>Address:</strong> {selectedOrder.shipping_address || 'N/A'}</p>
                {selectedOrder.tracking_number && <p><strong>Tracking:</strong> {selectedOrder.tracking_number}</p>}
                {selectedOrder.estimated_delivery && <p><strong>Est. Delivery:</strong> {formatDate(selectedOrder.estimated_delivery)}</p>}
              </div>
              <div className="details-section">
                <h3>Order Items</h3>
                {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="modal-item">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}</span>
                  </div>
                ))}
                <div className="modal-total">
                  <strong>Total: ${parseFloat(selectedOrder.total).toFixed(2)}</strong>
                </div>
              </div>
              {selectedOrder.notes && (
                <div className="details-section">
                  <h3>Notes</h3>
                  <p>{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {selectedOrder && showUpdateStatusModal && (
        <div className="modal-overlay-orders" onClick={() => setShowUpdateStatusModal(false)}>
          <div className="modal-content-orders status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Order Status</h2>
              <button className="close-modal" onClick={() => setShowUpdateStatusModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="modal-body">
                <div className="status-update-info">
                  <p><strong>Order ID:</strong> {selectedOrder.order_id}</p>
                  <p><strong>Current Status:</strong> {getStatusConfig(selectedOrder.status).label}</p>
                </div>
                <div className="form-group">
                  <label>New Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowUpdateStatusModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="modal-overlay-orders" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-orders create-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Order</h2>
              <button className="close-modal" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Order ID *</label>
                    <input
                      type="text"
                      name="order_id"
                      value={createFormData.order_id}
                      onChange={handleCreateInputChange}
                      placeholder="e.g., ORD-010"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Method</label>
                    <input
                      type="text"
                      name="payment_method"
                      value={createFormData.payment_method}
                      onChange={handleCreateInputChange}
                      placeholder="Credit Card, PayPal, etc."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Name *</label>
                    <input
                      type="text"
                      name="customer_name"
                      value={createFormData.customer_name}
                      onChange={handleCreateInputChange}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Customer Email *</label>
                    <input
                      type="email"
                      name="customer_email"
                      value={createFormData.customer_email}
                      onChange={handleCreateInputChange}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Tier</label>
                    <select
                      name="customer_tier"
                      value={createFormData.customer_tier}
                      onChange={handleCreateInputChange}
                    >
                      <option value="Bronze">Bronze</option>
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={createFormData.priority}
                      onChange={handleCreateInputChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={createFormData.status}
                      onChange={handleCreateInputChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estimated Delivery</label>
                    <input
                      type="date"
                      name="estimated_delivery"
                      value={createFormData.estimated_delivery}
                      onChange={handleCreateInputChange}
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Shipping Address</label>
                  <input
                    type="text"
                    name="shipping_address"
                    value={createFormData.shipping_address}
                    onChange={handleCreateInputChange}
                    placeholder="Full shipping address"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Tracking Number</label>
                  <input
                    type="text"
                    name="tracking_number"
                    value={createFormData.tracking_number}
                    onChange={handleCreateInputChange}
                    placeholder="Tracking number (optional)"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Order Items *</label>
                  {createFormData.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                        required
                        style={{ width: '80px' }}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                        style={{ width: '100px' }}
                      />
                      {createFormData.items.length > 1 && (
                        <button type="button" className="remove-item-btn" onClick={() => removeItemRow(index)}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="add-item-btn" onClick={addItemRow}>
                    + Add Item
                  </button>
                  <div className="order-total-display">
                    <strong>Total: ${createFormData.total.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={createFormData.notes}
                    onChange={handleCreateInputChange}
                    placeholder="Additional notes"
                    rows="3"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;