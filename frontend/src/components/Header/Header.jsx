import { useState, useEffect, useRef } from "react";
import { 
  FaBell, 
  FaSearch, 
  FaCog, 
  FaQuestionCircle, 
  FaSun, 
  FaMoon,
  FaUser,
  FaSignOutAlt,
  FaUserCircle,
  FaEnvelope,
  FaClipboardList,
  FaBox,
  FaUsers
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./Header.css";

function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searching, setSearching] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const API_URL = 'http://localhost:5001/api';

  // Load unread count from localStorage on mount
  useEffect(() => {
    const savedUnreadCount = localStorage.getItem('unreadCount');
    if (savedUnreadCount) {
      setUnreadCount(parseInt(savedUnreadCount));
    }
  }, []);

  // Save unread count to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('unreadCount', unreadCount.toString());
  }, [unreadCount]);

  // Fetch notifications
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // Fetch search results with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 1) {
        performSearch(searchTerm);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      if (!token) return;
      
      // Fetch recent activities for notifications
      const [employeesRes, ordersRes, inventoryRes] = await Promise.all([
        axios.get(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/inventory`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const notificationsList = [];
      
      // Add low stock notifications
      const inventory = inventoryRes.data || [];
      const lowStockItems = inventory.filter(item => item.quantity <= item.min_stock);
      lowStockItems.forEach(item => {
        notificationsList.push({
          id: `stock-${item.id}`,
          type: 'warning',
          icon: '📦',
          title: 'Low Stock Alert',
          message: `${item.name} is running low (${item.quantity} units remaining)`,
          time: new Date().toLocaleString(),
          read: false
        });
      });

      // Add new orders notification
      const orders = ordersRes.data || [];
      const recentOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
      recentOrders.slice(0, 3).forEach(order => {
        notificationsList.push({
          id: `order-${order.id}`,
          type: 'info',
          icon: '📋',
          title: 'New Order',
          message: `Order from ${order.customer_name} - $${order.total}`,
          time: new Date(order.created_at).toLocaleString(),
          read: false
        });
      });

      // Add new employees notification
      const employees = employeesRes.data || [];
      const recentEmployees = employees.filter(e => {
        const date = new Date(e.created_at);
        const now = new Date();
        const diff = (now - date) / (1000 * 60 * 60 * 24);
        return diff < 7;
      });
      recentEmployees.forEach(emp => {
        notificationsList.push({
          id: `emp-${emp.id}`,
          type: 'success',
          icon: '👤',
          title: 'New Team Member',
          message: `${emp.name} joined as ${emp.role}`,
          time: new Date(emp.created_at).toLocaleString(),
          read: false
        });
      });

      // Sort by time (newest first) and limit to 10
      notificationsList.sort((a, b) => new Date(b.time) - new Date(a.time));
      const limitedNotifications = notificationsList.slice(0, 10);
      
      setNotifications(limitedNotifications);
      
      // Only update unread count if it hasn't been set from localStorage
      const savedUnread = localStorage.getItem('unreadCount');
      if (!savedUnread) {
        const unread = limitedNotifications.filter(n => !n.read).length;
        setUnreadCount(unread);
        localStorage.setItem('unreadCount', unread.toString());
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const performSearch = async (query) => {
    try {
      if (!token) return;
      setSearching(true);
      
      const [employeesRes, ordersRes, inventoryRes] = await Promise.all([
        axios.get(`${API_URL}/employees?search=${query}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/orders?search=${query}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/inventory?search=${query}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const results = [];
      
      // Add employee results
      (employeesRes.data || []).slice(0, 3).forEach(emp => {
        results.push({
          id: emp.id,
          type: 'employee',
          title: emp.name,
          subtitle: `${emp.role} • ${emp.department}`,
          icon: '👤',
          path: '/dashboard/employees'
        });
      });

      // Add order results
      (ordersRes.data || []).slice(0, 3).forEach(order => {
        results.push({
          id: order.id,
          type: 'order',
          title: `Order ${order.order_id}`,
          subtitle: `${order.customer_name} • $${order.total}`,
          icon: '📋',
          path: '/dashboard/orders'
        });
      });

      // Add inventory results
      (inventoryRes.data || []).slice(0, 3).forEach(item => {
        results.push({
          id: item.id,
          type: 'inventory',
          title: item.name,
          subtitle: `${item.quantity} units • ${item.category}`,
          icon: '📦',
          path: '/dashboard/inventory'
        });
      });

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSelect = (result) => {
    setSearchTerm('');
    setShowSearchResults(false);
    navigate(result.path);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode', !darkMode);
  };

  const handleNotificationClick = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      localStorage.setItem('unreadCount', newCount.toString());
      return newCount;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    localStorage.setItem('unreadCount', '0');
  };

  const handleLogout = () => {
    // Clear all stored data on logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('unreadCount');
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
    setShowUserMenu(false);
  };

  const handleHelpClick = () => {
  setShowHelpModal(true);
};

  return (
    <header className="header">
      {/* Help Modal */}
{showHelpModal && (
  <div className="help-modal-overlay" onClick={() => setShowHelpModal(false)}>
    <div className="help-modal" onClick={(e) => e.stopPropagation()}>
      <div className="help-modal-header">
        <div className="help-modal-icon">🆘</div>
        <button className="help-modal-close-btn" onClick={() => setShowHelpModal(false)}>✕</button>
      </div>
      <div className="help-modal-body">
        <h3>How can we help you?</h3>
        <p>Get support, view documentation, or contact our team.</p>
        
        <div className="help-options">
          <div className="help-option">
            <div className="help-option-icon">📚</div>
            <div className="help-option-content">
              <h4>Documentation</h4>
              <p>Browse our comprehensive guides</p>
              <button className="help-option-btn" onClick={() => window.open('/docs', '_blank')}>
                View Docs →
              </button>
            </div>
          </div>
          
          <div className="help-option">
            <div className="help-option-icon">💬</div>
            <div className="help-option-content">
              <h4>Live Chat</h4>
              <p>Chat with our support team</p>
              <button className="help-option-btn" onClick={() => alert('Live chat coming soon!')}>
                Start Chat →
              </button>
            </div>
          </div>
          
          <div className="help-option">
            <div className="help-option-icon">📧</div>
            <div className="help-option-content">
              <h4>Email Support</h4>
              <p>support@erpify.com</p>
              <button className="help-option-btn" onClick={() => window.location.href = 'mailto:support@erpify.com'}>
                Send Email →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      <div className="header-left">
        <div className="search-container" ref={searchRef}>
          <FaSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search employees, orders, inventory..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
          />
          
          {searching && (
            <div className="search-loading">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </div>
          )}
          
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`}
                  className="search-result-item"
                  onClick={() => handleSearchSelect(result)}
                >
                  <span className="search-result-icon">{result.icon}</span>
                  <div className="search-result-content">
                    <div className="search-result-title">{result.title}</div>
                    <div className="search-result-subtitle">{result.subtitle}</div>
                  </div>
                  <span className="search-result-type">{result.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="header-right">
        <button className="theme-toggle" onClick={toggleDarkMode} title="Toggle Theme">
          {darkMode ? <FaSun /> : <FaMoon />}
        </button>
        
        <button className="help-btn" onClick={handleHelpClick} title="Help">
          <FaQuestionCircle />
        </button>
        
        <button className="settings-btn" onClick={() => handleNavigate('/dashboard/settings')} title="Settings">
          <FaCog />
        </button>
        
        <div className="notifications" ref={notificationRef}>
          <button 
            className="notification-btn" 
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {notifications.length > 0 && (
                  <button className="mark-all-read" onClick={markAllAsRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`notification-item ${!notification.read ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <span className="notification-icon">{notification.icon}</span>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{notification.time}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="user-menu" ref={userMenuRef}>
          <div 
            className="user-menu-trigger"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="user-greeting">
              <span className="welcome-text">Welcome back,</span>
              <span className="user-name">{user.email?.split('@')[0] || "Admin"}</span>
            </div>
            <div className="user-role-badge">{user.role || "ADMIN"}</div>
          </div>
          
          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-user-icon">
                  {user.email?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{user.email?.split('@')[0] || "Admin"}</div>
                  <div className="dropdown-user-email">{user.email || "admin@company.com"}</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item" onClick={() => handleNavigate('/dashboard/settings')}>
                <FaUserCircle /> <span>Profile</span>
              </button>
              <button className="dropdown-item" onClick={() => handleNavigate('/dashboard/settings')}>
                <FaCog /> <span>Settings</span>
              </button>
              <button className="dropdown-item" onClick={() => handleNavigate('/dashboard')}>
                <FaClipboardList /> <span>Dashboard</span>
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout" onClick={handleLogout}>
                <FaSignOutAlt /> <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;