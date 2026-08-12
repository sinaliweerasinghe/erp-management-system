import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUser, FaUsers, FaBox, FaShoppingCart, FaChartBar } from "react-icons/fa";
import "./DemoDashboard.css";

function DemoDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Demo stats data
  const stats = [
    { 
      label: "Total Employees", 
      value: "25", 
      change: "+12%", 
      trend: "up",
      icon: <FaUsers />,
      color: "purple"
    },
    { 
      label: "Total Products", 
      value: "120", 
      change: "+8.5%", 
      trend: "up",
      icon: <FaBox />,
      color: "blue"
    },
    { 
      label: "Monthly Sales", 
      value: "$15,200", 
      change: "+16.1%", 
      trend: "up",
      icon: <FaShoppingCart />,
      color: "green"
    },
    { 
      label: "Active Orders", 
      value: "45", 
      change: "+5.2%", 
      trend: "up",
      icon: <FaChartBar />,
      color: "orange"
    },
  ];

  return (
    <div className="demo-dashboard">
      {/* Header */}
      <div className="demo-header">
        <div className="demo-header-left">
          <h1 className="demo-title">🚀 ERPify Demo Dashboard</h1>
          <p className="demo-subtitle">Explore the features with sample data</p>
        </div>
        <button className="demo-logout-btn" onClick={handleLogout}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* Demo Notice */}
      <div className="demo-notice">
        <span className="demo-notice-icon">⚠️</span>
        <span className="demo-notice-text">
          Demo mode – data will not be saved. This is a sample environment to explore features.
        </span>
      </div>

      {/* Stats Grid */}
      <div className="demo-stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className={`demo-stat-card demo-stat-${stat.color}`}>
            <div className="demo-stat-header">
              <span className="demo-stat-icon">{stat.icon}</span>
              <span className={`demo-stat-change ${stat.trend}`}>{stat.change}</span>
            </div>
            <div className="demo-stat-value">{stat.value}</div>
            <div className="demo-stat-label">{stat.label}</div>
            <div className="demo-stat-progress">
              <div className="demo-progress-bar"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="demo-actions">
        <div className="demo-actions-title">Quick Actions</div>
        <div className="demo-actions-grid">
          <button className="demo-action-btn" onClick={() => alert('📋 View all employees (demo)')}>
            <FaUsers /> View Employees
          </button>
          <button className="demo-action-btn" onClick={() => alert('📦 View all products (demo)')}>
            <FaBox /> View Products
          </button>
          <button className="demo-action-btn" onClick={() => alert('🛒 View all orders (demo)')}>
            <FaShoppingCart /> View Orders
          </button>
          <button className="demo-action-btn" onClick={() => alert('📊 View analytics (demo)')}>
            <FaChartBar /> View Analytics
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="demo-user-info">
        <div className="demo-user-avatar">
          <FaUser />
        </div>
        <div className="demo-user-details">
          <div className="demo-user-name">Demo User</div>
          <div className="demo-user-role">Tester</div>
        </div>
        <div className="demo-user-status">
          <span className="demo-status-dot"></span>
          Active
        </div>
      </div>
    </div>
  );
}

export default DemoDashboard;