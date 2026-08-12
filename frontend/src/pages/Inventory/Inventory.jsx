import { useState, useEffect } from "react";
import axios from "axios";
import "./Inventory.css";

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState(0);

  // Form states - Separate for Add and Edit
  const [addFormData, setAddFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    status: "in-stock",
    price: 0,
    cost: 0,
    location: "",
    supplier: "",
    lastRestocked: "",
    image: "📦",
    salesVelocity: 0,
    profitMargin: 0,
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    name: "",
    sku: "",
    category: "",
    quantity: 0,
    minStock: 0,
    maxStock: 0,
    status: "in-stock",
    price: 0,
    cost: 0,
    location: "",
    supplier: "",
    lastRestocked: "",
    image: "📦",
    salesVelocity: 0,
    profitMargin: 0,
  });

  const API_URL = 'http://localhost:5001/api';

  // Fetch inventory from API
  useEffect(() => {
    fetchInventory();
  }, [sortBy, sortOrder]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/inventory`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          sortBy,
          sortOrder
        }
      });
      setInventory(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      setError('Failed to load inventory. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = ["all", ...new Set(inventory.map(item => item.category))];
  
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate stats from real data
  const stats = {
    totalProducts: inventory.length,
    totalValue: inventory.reduce((acc, item) => acc + (item.quantity * item.price), 0),
    lowStockItems: inventory.filter(i => i.status === "low-stock").length,
    outOfStockItems: inventory.filter(i => i.status === "out-of-stock").length,
    totalProfit: inventory.reduce((acc, item) => acc + (item.quantity * (item.price - item.cost)), 0),
  };

  const getStatusBadge = (status) => {
    const badges = {
      "in-stock": { class: "status-in-stock", label: "In Stock", icon: "✅" },
      "low-stock": { class: "status-low-stock", label: "Low Stock", icon: "⚠️" },
      "out-of-stock": { class: "status-out-of-stock", label: "Out of Stock", icon: "❌" },
    };
    return badges[status] || badges["in-stock"];
  };

  const getStockLevelWidth = (quantity, minStock, maxStock) => {
    const percentage = (quantity / maxStock) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span className="sort-icon">↕️</span>;
    return <span className="sort-icon">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  // Handle Add Form input changes
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle Edit Form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset Add form
  const resetAddForm = () => {
    setAddFormData({
      name: "",
      sku: "",
      category: "",
      quantity: 0,
      minStock: 0,
      maxStock: 0,
      status: "in-stock",
      price: 0,
      cost: 0,
      location: "",
      supplier: "",
      lastRestocked: "",
      image: "📦",
      salesVelocity: 0,
      profitMargin: 0,
    });
  };

  // Open edit modal with product data
  const openEditModal = (product) => {
    setSelectedProduct(product);
    setEditFormData({
      id: product.id,
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      quantity: product.quantity || 0,
      minStock: product.minStock || 0,
      maxStock: product.maxStock || 0,
      status: product.status || "in-stock",
      price: product.price || 0,
      cost: product.cost || 0,
      location: product.location || "",
      supplier: product.supplier || "",
      lastRestocked: product.last_restocked ? product.last_restocked.split('T')[0] : "",
      image: product.image || "📦",
      salesVelocity: product.salesVelocity || 0,
      profitMargin: product.profitMargin || 0,
    });
    setShowEditModal(true);
  };

  // Open restock modal
  const openRestockModal = (product) => {
    setSelectedProduct(product);
    setRestockQuantity(product.quantity || 0);
    setShowRestockModal(true);
  };

  // ADD PRODUCT
  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const productData = {
        name: addFormData.name,
        sku: addFormData.sku,
        category: addFormData.category,
        quantity: parseInt(addFormData.quantity) || 0,
        minStock: parseInt(addFormData.minStock) || 0,
        maxStock: parseInt(addFormData.maxStock) || 0,
        status: addFormData.status,
        price: parseFloat(addFormData.price) || 0,
        cost: parseFloat(addFormData.cost) || 0,
        location: addFormData.location || "",
        supplier: addFormData.supplier || "",
        lastRestocked: addFormData.lastRestocked || new Date().toISOString().split('T')[0],
        image: addFormData.image || "📦",
        salesVelocity: parseInt(addFormData.salesVelocity) || 0,
        profitMargin: parseInt(addFormData.profitMargin) || 0,
      };

      const response = await axios.post(`${API_URL}/inventory`, productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setInventory([...inventory, response.data.item]);
      setShowAddModal(false);
      resetAddForm();
      alert('Product added successfully!');
    } catch (error) {
      console.error('Add product error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add product';
      alert(errorMsg);
    }
  };

  // EDIT PRODUCT
  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const productData = {
        name: editFormData.name,
        sku: editFormData.sku,
        category: editFormData.category,
        quantity: parseInt(editFormData.quantity) || 0,
        minStock: parseInt(editFormData.minStock) || 0,
        maxStock: parseInt(editFormData.maxStock) || 0,
        status: editFormData.status,
        price: parseFloat(editFormData.price) || 0,
        cost: parseFloat(editFormData.cost) || 0,
        location: editFormData.location || "",
        supplier: editFormData.supplier || "",
        lastRestocked: editFormData.lastRestocked || new Date().toISOString().split('T')[0],
        image: editFormData.image || "📦",
        salesVelocity: parseInt(editFormData.salesVelocity) || 0,
        profitMargin: parseInt(editFormData.profitMargin) || 0,
      };

      const response = await axios.put(
        `${API_URL}/inventory/${selectedProduct.id}`,
        productData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setInventory(inventory.map(item => 
        item.id === selectedProduct.id ? response.data.item : item
      ));
      setShowEditModal(false);
      setSelectedProduct(null);
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Update product error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update product';
      alert(errorMsg);
    }
  };

  // RESTOCK PRODUCT
  const handleRestock = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(
        `${API_URL}/inventory/${selectedProduct.id}/stock`,
        { quantity: restockQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setInventory(inventory.map(item => 
        item.id === selectedProduct.id ? response.data.item : item
      ));
      setShowRestockModal(false);
      setSelectedProduct(null);
      alert('Stock updated successfully!');
    } catch (error) {
      console.error('Restock error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update stock';
      alert(errorMsg);
    }
  };

  // DELETE PRODUCT
  const handleDeleteProduct = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login first');
          return;
        }

        await axios.delete(`${API_URL}/inventory/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setInventory(inventory.filter(item => item.id !== id));
        alert('Product deleted successfully!');
      } catch (error) {
        console.error('Delete product error:', error);
        const errorMsg = error.response?.data?.error || 'Failed to delete product';
        alert(errorMsg);
      }
    }
  };

  if (loading) {
    return (
      <div className="inventory-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchInventory}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="inventory-page">
      {/* Header Section */}
      <div className="inventory-header">
        <div className="header-left">
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track stock levels, monitor trends, and optimize your supply chain</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={() => alert('Export report coming soon!')}>
            📊 Export Report
          </button>
          <button className="add-product-btn" onClick={() => { resetAddForm(); setShowAddModal(true); }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Dashboard - UPDATED to match other pages */}
      <div className="stats-overview">
        <div className="stat-card-horizontal">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.totalProducts}</h3>
            <p>Total Products</p>
          </div>
          <div className="stat-trend">+8.5% this month</div>
        </div>

        <div className="stat-card-horizontal">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>${(stats.totalValue / 1000).toFixed(1)}K</h3>
            <p>Inventory Value</p>
          </div>
          <div className="stat-trend">+12.3% this month</div>
        </div>

        <div className="stat-card-horizontal" style={{ borderColor: stats.lowStockItems + stats.outOfStockItems > 0 ? '#fca5a5' : 'rgba(226, 232, 240, 0.8)' }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3 style={{ color: stats.lowStockItems + stats.outOfStockItems > 0 ? '#dc2626' : '#0f172a' }}>
              {stats.lowStockItems + stats.outOfStockItems}
            </h3>
            <p>Stock Alerts</p>
          </div>
          <div className="stat-trend">{stats.lowStockItems} low, {stats.outOfStockItems} out</div>
        </div>

        <div className="stat-card-horizontal">
          <div className="stat-icon">💵</div>
          <div className="stat-info">
            <h3>${(stats.totalProfit / 1000).toFixed(1)}K</h3>
            <p>Potential Profit</p>
          </div>
          <div className="stat-trend">+18.7% this month</div>
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
            placeholder="Search by product name, SKU, or supplier..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
          
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
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
      <div className="results-header">
        <div className="results-count">
          <span className="count-number">{filteredInventory.length}</span> products found
        </div>
        <div className="sorting-controls">
          <span className="sort-label">Sort by:</span>
          <button className={`sort-btn ${sortBy === "name" ? "active" : ""}`} onClick={() => handleSort("name")}>
            Name <SortIcon field="name" />
          </button>
          <button className={`sort-btn ${sortBy === "quantity" ? "active" : ""}`} onClick={() => handleSort("quantity")}>
            Stock <SortIcon field="quantity" />
          </button>
          <button className={`sort-btn ${sortBy === "price" ? "active" : ""}`} onClick={() => handleSort("price")}>
            Price <SortIcon field="price" />
          </button>
          <button className={`sort-btn ${sortBy === "salesVelocity" ? "active" : ""}`} onClick={() => handleSort("salesVelocity")}>
            Demand <SortIcon field="salesVelocity" />
          </button>
        </div>
      </div>

      {/* Inventory Grid/Table View */}
      {viewMode === "grid" ? (
        <div className="inventory-grid">
          {filteredInventory.map(product => (
            <div key={product.id} className="inventory-card">
              <div className="card-badge" data-status={product.status}>
                {getStatusBadge(product.status).icon} {getStatusBadge(product.status).label}
              </div>
              <div className="card-image">
                <span className="product-emoji">{product.image}</span>
              </div>
              <div className="card-content">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-sku">SKU: {product.sku}</div>
                <div className="product-price">
                  <span className="price">${parseFloat(product.price).toFixed(2)}</span>
                  <span className="cost">COGS: ${parseFloat(product.cost).toFixed(2)}</span>
                </div>
                <div className="stock-info">
                  <div className="stock-level">
                    <div className="stock-bar-bg">
                      <div 
                        className="stock-bar-fill" 
                        style={{ 
                          width: `${getStockLevelWidth(product.quantity, product.minStock, product.maxStock)}%`,
                          background: product.quantity <= product.minStock ? '#ef4444' : '#10b981'
                        }}
                      ></div>
                    </div>
                    <div className="stock-numbers">
                      <span>{product.quantity} / {product.maxStock}</span>
                      <span className="stock-min">Min: {product.minStock}</span>
                    </div>
                  </div>
                </div>
                <div className="product-metrics">
                  <div className="metric">
                    <span className="metric-label">📈 Sales/Month</span>
                    <span className="metric-value">{product.salesVelocity}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">💰 Margin</span>
                    <span className="metric-value">{product.profitMargin}%</span>
                  </div>
                </div>
                <div className="product-location">
                  📍 {product.location} | 🏭 {product.supplier}
                </div>
              </div>
              <div className="card-actions-inventory">
                <button className="action-edit" onClick={() => openEditModal(product)}>
                  ✏️ Edit
                </button>
                <button className="action-restock" onClick={() => openRestockModal(product)}>
                  📦 Restock
                </button>
                <button className="action-delete" onClick={() => handleDeleteProduct(product.id)}>
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Stock Level</th>
                <th>Price</th>
                <th>Status</th>
                <th>Demand</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(product => (
                <tr key={product.id} className={product.status === "low-stock" ? "warning-row" : product.status === "out-of-stock" ? "danger-row" : ""}>
                  <td className="product-cell">
                    <div className="product-info">
                      <span className="product-emoji-small">{product.image}</span>
                      <div>
                        <div className="product-name-table">{product.name}</div>
                        <div className="product-supplier">{product.supplier}</div>
                      </div>
                    </div>
                  </td>
                  <td className="sku-cell">{product.sku}</td>
                  <td>{product.category}</td>
                  <td>
                    <div className="stock-cell">
                      <div className="mini-stock-bar">
                        <div 
                          className="mini-stock-fill" 
                          style={{ 
                            width: `${(product.quantity / product.maxStock) * 100}%`,
                            background: product.quantity <= product.minStock ? '#ef4444' : '#10b981'
                          }}
                        ></div>
                      </div>
                      <span className="stock-quantity">{product.quantity} units</span>
                    </div>
                  </td>
                  <td>
                    <div className="price-cell">
                      <span className="current-price">${parseFloat(product.price).toFixed(2)}</span>
                      <span className="profit-badge">+{product.profitMargin}%</span>
                    </div>
                  </td>
                  <td>
                    <div className={`status-badge-inventory ${getStatusBadge(product.status).class}`}>
                      {getStatusBadge(product.status).icon} {getStatusBadge(product.status).label}
                    </div>
                  </td>
                  <td>
                    <div className="demand-cell">
                      <span className="demand-value">{product.salesVelocity}/mo</span>
                      <div className="demand-bar">
                        <div className="demand-fill" style={{ width: `${(product.salesVelocity / 50) * 100}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="actions-cell-inventory">
                    <button className="table-action-edit" onClick={() => openEditModal(product)}>
                      Edit
                    </button>
                    <button className="table-action-restock" onClick={() => openRestockModal(product)}>
                      Restock
                    </button>
                    <button className="table-action-delete" onClick={() => handleDeleteProduct(product.id)}>
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
      <div className="inventory-footer">
        <div className="footer-stats">
          <div className="footer-stat">
            <span className="stat-dot green"></span>
            <span>{stats.totalProducts - stats.lowStockItems - stats.outOfStockItems} In Stock</span>
          </div>
          <div className="footer-stat">
            <span className="stat-dot yellow"></span>
            <span>{stats.lowStockItems} Low Stock</span>
          </div>
          <div className="footer-stat">
            <span className="stat-dot red"></span>
            <span>{stats.outOfStockItems} Out of Stock</span>
          </div>
        </div>
        <button className="optimize-btn" onClick={() => alert("Running inventory optimization...")}>
          🔄 Run Inventory Optimization
        </button>
      </div>

      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Product</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddProduct} className="inventory-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={addFormData.name}
                    onChange={handleAddInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={addFormData.sku}
                    onChange={handleAddInputChange}
                    placeholder="e.g., PROD-001"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={addFormData.category}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Audio">Audio</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={addFormData.status}
                    onChange={handleAddInputChange}
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={addFormData.quantity}
                    onChange={handleAddInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Image Emoji</label>
                  <input
                    type="text"
                    name="image"
                    value={addFormData.image}
                    onChange={handleAddInputChange}
                    placeholder="📦"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={addFormData.price}
                    onChange={handleAddInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Cost ($)</label>
                  <input
                    type="number"
                    name="cost"
                    value={addFormData.cost}
                    onChange={handleAddInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Stock</label>
                  <input
                    type="number"
                    name="minStock"
                    value={addFormData.minStock}
                    onChange={handleAddInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Max Stock</label>
                  <input
                    type="number"
                    name="maxStock"
                    value={addFormData.maxStock}
                    onChange={handleAddInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={addFormData.location}
                    onChange={handleAddInputChange}
                    placeholder="e.g., Warehouse A"
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={addFormData.supplier}
                    onChange={handleAddInputChange}
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sales Velocity (units/month)</label>
                  <input
                    type="number"
                    name="salesVelocity"
                    value={addFormData.salesVelocity}
                    onChange={handleAddInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Profit Margin (%)</label>
                  <input
                    type="number"
                    name="profitMargin"
                    value={addFormData.profitMargin}
                    onChange={handleAddInputChange}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Last Restocked</label>
                <input
                  type="date"
                  name="lastRestocked"
                  value={addFormData.lastRestocked}
                  onChange={handleAddInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {selectedProduct && showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content inventory-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditProduct} className="inventory-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    placeholder="Enter product name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>SKU *</label>
                  <input
                    type="text"
                    name="sku"
                    value={editFormData.sku}
                    onChange={handleEditInputChange}
                    placeholder="e.g., PROD-001"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Audio">Audio</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                  >
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock</option>
                    <option value="out-of-stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    value={editFormData.quantity}
                    onChange={handleEditInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Image Emoji</label>
                  <input
                    type="text"
                    name="image"
                    value={editFormData.image}
                    onChange={handleEditInputChange}
                    placeholder="📦"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price ($)</label>
                  <input
                    type="number"
                    name="price"
                    value={editFormData.price}
                    onChange={handleEditInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Cost ($)</label>
                  <input
                    type="number"
                    name="cost"
                    value={editFormData.cost}
                    onChange={handleEditInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Stock</label>
                  <input
                    type="number"
                    name="minStock"
                    value={editFormData.minStock}
                    onChange={handleEditInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Max Stock</label>
                  <input
                    type="number"
                    name="maxStock"
                    value={editFormData.maxStock}
                    onChange={handleEditInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={editFormData.location}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Warehouse A"
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    name="supplier"
                    value={editFormData.supplier}
                    onChange={handleEditInputChange}
                    placeholder="Supplier name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sales Velocity (units/month)</label>
                  <input
                    type="number"
                    name="salesVelocity"
                    value={editFormData.salesVelocity}
                    onChange={handleEditInputChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Profit Margin (%)</label>
                  <input
                    type="number"
                    name="profitMargin"
                    value={editFormData.profitMargin}
                    onChange={handleEditInputChange}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Last Restocked</label>
                <input
                  type="date"
                  name="lastRestocked"
                  value={editFormData.lastRestocked}
                  onChange={handleEditInputChange}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESTOCK MODAL */}
      {selectedProduct && showRestockModal && (
        <div className="modal-overlay" onClick={() => setShowRestockModal(false)}>
          <div className="modal-content restock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Restock {selectedProduct.name}</h2>
              <button className="modal-close-btn" onClick={() => setShowRestockModal(false)}>×</button>
            </div>
            <form onSubmit={handleRestock} className="restock-form">
              <div className="restock-info">
                <div className="restock-current">
                  <label>Current Stock</label>
                  <span className="current-value">{selectedProduct.quantity} units</span>
                </div>
                <div className="restock-minmax">
                  <span>Min: {selectedProduct.minStock}</span>
                  <span>Max: {selectedProduct.maxStock}</span>
                </div>
              </div>
              <div className="form-group full-width">
                <label>New Quantity</label>
                <input
                  type="number"
                  value={restockQuantity}
                  onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter new quantity"
                  min="0"
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowRestockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;