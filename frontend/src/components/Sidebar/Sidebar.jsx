import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBox, 
  FaShoppingCart, 
  FaChartBar,
  FaCog,
  FaRobot,
  FaSignOutAlt,
  FaBuilding,
  FaFileInvoiceDollar
} from "react-icons/fa";
import { MdDashboard, MdInventory } from "react-icons/md";
import axios from "axios";
import "./Sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || "EMPLOYEE";
  const token = localStorage.getItem("token");
  const API_URL = 'http://localhost:5001/api';
  
  const [employeeCount, setEmployeeCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      if (!token) return;
      
      // Fetch employees count
      const employeesRes = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeCount(employeesRes.data?.length || 0);

      // Fetch orders count (pending + processing)
      const ordersRes = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const pendingOrders = ordersRes.data?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0;
      setOrderCount(pendingOrders);
    } catch (error) {
      console.error('Failed to fetch counts:', error);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const getInitials = (email) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const adminMenu = [
    { path: "/dashboard", icon: <MdDashboard />, label: "Dashboard" },
    { path: "/dashboard/employees", icon: <FaUsers />, label: "Employees" },
    { path: "/dashboard/inventory", icon: <MdInventory />, label: "Inventory" },
    { path: "/dashboard/orders", icon: <FaShoppingCart />, label: "Orders" },
    { path: "/dashboard/analytics", icon: <FaChartBar />, label: "Analytics" },
    //{ path: "/dashboard/ai", icon: <FaRobot />, label: "AI Insights", badge: "New" },
    { path: "/dashboard/settings", icon: <FaCog />, label: "Settings" },
  ];

  const managerMenu = [
    { path: "/dashboard", icon: <MdDashboard />, label: "Dashboard" },
    { path: "/dashboard/employees", icon: <FaUsers />, label: "Employees" },
    { path: "/dashboard/inventory", icon: <MdInventory />, label: "Inventory" },
    { path: "/dashboard/orders", icon: <FaShoppingCart />, label: "Orders" },
    { path: "/dashboard/analytics", icon: <FaChartBar />, label: "Analytics" },
  ];

  const employeeMenu = [
    { path: "/dashboard", icon: <MdDashboard />, label: "Dashboard" },
    { path: "/dashboard/tasks", icon: <FaUsers />, label: "My Tasks" },
  ];

  const getMenuItems = () => {
    switch(role) {
      case "ADMIN": return adminMenu;
      case "MANAGER": return managerMenu;
      default: return employeeMenu;
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <FaBuilding />
          </div>
          <div className="logo-text">
            <h2>ERPify</h2>
            <p>Enterprise Portal</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Navigation</div>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive ? "active" : ""}`
              }
              end={item.path === "/dashboard"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {getInitials(user.email)}
          </div>
          <div className="user-info">
            <div className="user-name">{user.email?.split('@')[0] || "User"}</div>
            <div className="user-role">{role}</div>
          </div>
        </div>
        
        <button onClick={logout} className="logout-btn">
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;