import { useState, useEffect } from "react";
import axios from "axios";
import "./Settings.css";

function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Profile settings
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    email_alerts: true,
    push_notifications: true,
    order_updates: true,
    inventory_alerts: false,
    marketing_emails: false,
    weekly_reports: true,
  });

  // Security settings
  const [security, setSecurity] = useState({
    two_factor_auth: false,
    session_timeout: "30",
    login_alerts: true,
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: "light",
    compact_view: false,
    animations: true,
  });

  const API_URL = 'http://localhost:5001/api';

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('Fetching settings from:', `${API_URL}/settings`);
      const response = await axios.get(`${API_URL}/settings`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Settings response:', response.data);
      const data = response.data;
      
      // Update profile
      setProfile({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        bio: data.bio || "",
      });

      // Update notifications
      setNotifications({
        email_alerts: data.email_alerts !== undefined ? data.email_alerts : true,
        push_notifications: data.push_notifications !== undefined ? data.push_notifications : true,
        order_updates: data.order_updates !== undefined ? data.order_updates : true,
        inventory_alerts: data.inventory_alerts !== undefined ? data.inventory_alerts : false,
        marketing_emails: data.marketing_emails !== undefined ? data.marketing_emails : false,
        weekly_reports: data.weekly_reports !== undefined ? data.weekly_reports : true,
      });

      // Update security
      setSecurity({
        two_factor_auth: data.two_factor_auth !== undefined ? data.two_factor_auth : false,
        session_timeout: data.session_timeout || "30",
        login_alerts: data.login_alerts !== undefined ? data.login_alerts : true,
      });

      // Update appearance
      setAppearance({
        theme: data.theme || "light",
        compact_view: data.compact_view !== undefined ? data.compact_view : false,
        animations: data.animations !== undefined ? data.animations : true,
      });

      setError(null);
    } catch (error) {
      console.error('Failed to fetch settings - Full error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to fetch settings';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        errorMessage = 'Settings not found. Creating default settings...';
        // Try to create default settings
        await createDefaultSettings();
        return;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server. Make sure the backend is running.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Create default settings if they don't exist
  const createDefaultSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const defaultSettings = {
        full_name: "",
        email: "",
        phone: "",
        location: "",
        bio: "",
        email_alerts: true,
        push_notifications: true,
        order_updates: true,
        inventory_alerts: false,
        marketing_emails: false,
        weekly_reports: true,
        two_factor_auth: false,
        session_timeout: "30",
        login_alerts: true,
        theme: "light",
        compact_view: false,
        animations: true
      };

      const response = await axios.put(`${API_URL}/settings`, defaultSettings, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Default settings created:', response.data);
      await fetchSettings();
    } catch (error) {
      console.error('Failed to create default settings:', error);
      setError('Failed to create settings. Please try again.');
    }
  };

  // Save all settings
  const saveAllSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const settingsData = {
        ...profile,
        ...notifications,
        ...security,
        ...appearance,
      };

      const response = await axios.put(`${API_URL}/settings`, settingsData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveMessage('✅ All settings saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
      
      // Refresh settings
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  // Save profile settings
  const saveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(`${API_URL}/settings/profile`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveMessage('✅ Profile updated successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  // Save notification settings
  const saveNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(`${API_URL}/settings/notifications`, notifications, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveMessage('✅ Notification settings updated!');
      setTimeout(() => setSaveMessage(null), 3000);
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save notifications:', error);
      alert('Failed to save notification settings. Please try again.');
    }
  };

  // Save security settings
  const saveSecurity = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(`${API_URL}/settings/security`, security, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveMessage('✅ Security settings updated!');
      setTimeout(() => setSaveMessage(null), 3000);
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save security:', error);
      alert('Failed to save security settings. Please try again.');
    }
  };

  // Save appearance settings
  const saveAppearance = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(`${API_URL}/settings/appearance`, appearance, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSaveMessage('✅ Appearance settings updated!');
      setTimeout(() => setSaveMessage(null), 3000);
      await fetchSettings();
    } catch (error) {
      console.error('Failed to save appearance:', error);
      alert('Failed to save appearance settings. Please try again.');
    }
  };

  // Update password
  const updatePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.put(`${API_URL}/settings/password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ Password updated successfully!');
    } catch (error) {
      console.error('Failed to update password:', error);
      alert(error.response?.data?.error || 'Failed to update password. Please try again.');
    }
  };

  // Delete account
  const deleteAccount = async (password) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await axios.delete(`${API_URL}/settings/account`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { password }
      });

      alert('Account deleted successfully!');
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert(error.response?.data?.error || 'Failed to delete account. Please try again.');
    }
  };

  const handleNotificationChange = (key) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
  };

  const handleSecurityChange = (key, value) => {
    setSecurity({ ...security, [key]: value });
  };

  const handleAppearanceChange = (key, value) => {
    setAppearance({ ...appearance, [key]: value });
  };

  const handleProfileChange = (key, value) => {
    setProfile({ ...profile, [key]: value });
  };

  const tabs = [
    { id: "profile", label: "👤 Profile", icon: "👤" },
    { id: "security", label: "🔒 Security", icon: "🔒" },
    { id: "notifications", label: "🔔 Notifications", icon: "🔔" },
    { id: "appearance", label: "🎨 Appearance", icon: "🎨" },
    { id: "billing", label: "💳 Billing", icon: "💳" },
    { id: "team", label: "👥 Team", icon: "👥" },
  ];

  if (loading) {
    return (
      <div className="settings-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchSettings}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      {/* Header Section */}
      <div className="settings-header">
        <div className="header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account preferences and configure system settings</p>
        </div>
        <div className="header-actions">
          {saveMessage && (
            <div className="save-message">{saveMessage}</div>
          )}
          <button className="save-all-btn" onClick={saveAllSettings}>
            💾 Save All Changes
          </button>
        </div>
      </div>

      {/* Settings Container */}
      <div className="settings-container">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {/* Profile Settings */}
          {activeTab === "profile" && (
            <div className="settings-section">
              <div className="section-header">
                <h2 className="section-title">Profile Information</h2>
                <p className="section-description">Update your personal information and how others see you</p>
              </div>

              <div className="profile-avatar-section">
                <div className="avatar-container">
                  <div className="profile-avatar-large">
                    {profile.full_name ? profile.full_name.split(" ").map(n => n[0]).join("") : "U"}
                  </div>
                  <button className="change-avatar-btn">Change Avatar</button>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profile.full_name || ""}
                    onChange={(e) => handleProfileChange("full_name", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={profile.email || ""}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={profile.phone || ""}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profile.location || ""}
                    onChange={(e) => handleProfileChange("location", e.target.value)}
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Bio</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4"
                    value={profile.bio || ""}
                    onChange={(e) => handleProfileChange("bio", e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="section-actions">
                <button className="cancel-btn" onClick={() => fetchSettings()}>Cancel</button>
                <button className="save-btn" onClick={saveProfile}>Save Changes</button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === "security" && (
            <div className="settings-section">
              <div className="section-header">
                <h2 className="section-title">Security & Authentication</h2>
                <p className="section-description">Manage your security preferences and authentication methods</p>
              </div>

              <div className="security-options">
                <div className="security-card">
                  <div className="security-info">
                    <h3>Password</h3>
                    <p>Update your password</p>
                  </div>
                  <button className="security-action-btn" onClick={() => {
                    const newPassword = prompt("Enter new password:");
                    if (newPassword && newPassword.length >= 6) {
                      const currentPassword = prompt("Enter current password:");
                      if (currentPassword) {
                        updatePassword(currentPassword, newPassword);
                      }
                    } else if (newPassword) {
                      alert("Password must be at least 6 characters");
                    }
                  }}>Change Password</button>
                </div>

                <div className="security-card">
                  <div className="security-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={security.two_factor_auth}
                      onChange={(e) => handleSecurityChange("two_factor_auth", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="security-card">
                  <div className="security-info">
                    <h3>Session Timeout</h3>
                    <p>Automatically log out after period of inactivity</p>
                  </div>
                  <select 
                    className="security-select"
                    value={security.session_timeout}
                    onChange={(e) => handleSecurityChange("session_timeout", e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div className="security-card">
                  <div className="security-info">
                    <h3>Login Alerts</h3>
                    <p>Receive email notifications for new sign-ins</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={security.login_alerts}
                      onChange={(e) => handleSecurityChange("login_alerts", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <button className="cancel-btn" onClick={() => fetchSettings()}>Cancel</button>
                <button className="save-btn" onClick={saveSecurity}>Save Changes</button>
              </div>

              <div className="danger-zone">
                <h3 className="danger-title">⚠️ Danger Zone</h3>
                <div className="danger-card">
                  <div className="danger-info">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all associated data</p>
                  </div>
                  <button className="danger-btn" onClick={() => {
                    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone!")) {
                      const password = prompt("Enter your password to confirm:");
                      if (password) {
                        deleteAccount(password);
                      }
                    }
                  }}>Delete Account</button>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="settings-section">
              <div className="section-header">
                <h2 className="section-title">Notification Preferences</h2>
                <p className="section-description">Choose what notifications you want to receive</p>
              </div>

              <div className="notifications-list">
                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">📧</span>
                    <div>
                      <h4>Email Alerts</h4>
                      <p>Receive important updates via email</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.email_alerts}
                      onChange={() => handleNotificationChange("email_alerts")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">🔔</span>
                    <div>
                      <h4>Push Notifications</h4>
                      <p>Get real-time notifications in your browser</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.push_notifications}
                      onChange={() => handleNotificationChange("push_notifications")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">📦</span>
                    <div>
                      <h4>Order Updates</h4>
                      <p>Notifications about new orders and status changes</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.order_updates}
                      onChange={() => handleNotificationChange("order_updates")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">⚠️</span>
                    <div>
                      <h4>Inventory Alerts</h4>
                      <p>Get notified when stock levels are low</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.inventory_alerts}
                      onChange={() => handleNotificationChange("inventory_alerts")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">📊</span>
                    <div>
                      <h4>Weekly Reports</h4>
                      <p>Receive weekly performance summaries</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.weekly_reports}
                      onChange={() => handleNotificationChange("weekly_reports")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="notification-item">
                  <div className="notification-info">
                    <span className="notification-icon">📢</span>
                    <div>
                      <h4>Marketing Emails</h4>
                      <p>Product updates and promotional content</p>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={notifications.marketing_emails}
                      onChange={() => handleNotificationChange("marketing_emails")}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <button className="cancel-btn" onClick={() => fetchSettings()}>Cancel</button>
                <button className="save-btn" onClick={saveNotifications}>Save Changes</button>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === "appearance" && (
            <div className="settings-section">
              <div className="section-header">
                <h2 className="section-title">Appearance & Theme</h2>
                <p className="section-description">Customize how the dashboard looks and feels</p>
              </div>

              <div className="theme-options">
                <div 
                  className={`theme-card ${appearance.theme === "light" ? "active" : ""}`}
                  onClick={() => handleAppearanceChange("theme", "light")}
                >
                  <div className="theme-preview light-preview"></div>
                  <h4>Light Mode</h4>
                  <p>Clean and bright interface</p>
                  {appearance.theme === "light" && <span className="check-mark">✓</span>}
                </div>
                <div 
                  className={`theme-card ${appearance.theme === "dark" ? "active" : ""}`}
                  onClick={() => handleAppearanceChange("theme", "dark")}
                >
                  <div className="theme-preview dark-preview"></div>
                  <h4>Dark Mode</h4>
                  <p>Easy on the eyes</p>
                  {appearance.theme === "dark" && <span className="check-mark">✓</span>}
                </div>
                <div 
                  className={`theme-card ${appearance.theme === "system" ? "active" : ""}`}
                  onClick={() => handleAppearanceChange("theme", "system")}
                >
                  <div className="theme-preview system-preview"></div>
                  <h4>System Default</h4>
                  <p>Follow your OS settings</p>
                  {appearance.theme === "system" && <span className="check-mark">✓</span>}
                </div>
              </div>

              <div className="appearance-options">
                <div className="appearance-item">
                  <div className="appearance-info">
                    <h4>Compact View</h4>
                    <p>Reduce spacing and show more content</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={appearance.compact_view}
                      onChange={(e) => handleAppearanceChange("compact_view", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="appearance-item">
                  <div className="appearance-info">
                    <h4>Animations</h4>
                    <p>Enable smooth transitions and effects</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={appearance.animations}
                      onChange={(e) => handleAppearanceChange("animations", e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="section-actions">
                <button className="cancel-btn" onClick={() => fetchSettings()}>Cancel</button>
                <button className="save-btn" onClick={saveAppearance}>Save Changes</button>
              </div>
            </div>
          )}

          {/* Billing Settings - Keep as is */}
          {activeTab === "billing" && (
            <div className="settings-section">
              <div className="section-header">
                <h2 className="section-title">Billing & Subscription</h2>
                <p className="section-description">Manage your payment methods and subscription plans</p>
              </div>

              <div className="current-plan">
                <div className="plan-info">
                  <h3>Enterprise Plan</h3>
                  <p>Billed annually • $999/year</p>
                </div>
                <button className="upgrade-btn">Upgrade Plan</button>
              </div>

              <div className="payment-methods">
                <h3>Payment Methods</h3>
                <div className="payment-card">
                  <div className="payment-details">
                    <span className="payment-icon">💳</span>
                    <div>
                      <p>Visa ending in 4242</p>
                      <span>Expires 12/2025</span>
                    </div>
                  </div>
                  <button className="payment-action">Edit</button>
                </div>
                <button className="add-payment-btn">+ Add Payment Method</button>
              </div>

              <div className="billing-history">
                <h3>Billing History</h3>
                <table className="billing-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Jan 15, 2024</td>
                      <td>Enterprise Plan - Annual</td>
                      <td>$999.00</td>
                      <td><span className="status-paid">Paid</span></td>
                    </tr>
                    <tr>
                      <td>Jan 15, 2023</td>
                      <td>Enterprise Plan - Annual</td>
                      <td>$999.00</td>
                      <td><span className="status-paid">Paid</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Team Settings - Keep as is */}
          {activeTab === "team" && (
            <div className="settings-section">
              <div className="section-header">
                <h2 className="section-title">Team Management</h2>
                <p className="section-description">Invite team members and manage permissions</p>
              </div>

              <div className="invite-section">
                <div className="invite-form">
                  <input type="email" placeholder="Enter email address" className="invite-input" />
                  <select className="role-select">
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Employee</option>
                    <option>Viewer</option>
                  </select>
                  <button className="invite-btn">Send Invite</button>
                </div>
              </div>

              <div className="team-members">
                <h3>Team Members (8)</h3>
                <div className="members-list">
                  <div className="member-card">
                    <div className="member-avatar">JD</div>
                    <div className="member-info">
                      <h4>John Doe</h4>
                      <p>john.doe@company.com</p>
                      <span className="member-role">Admin</span>
                    </div>
                    <div className="member-actions">
                      <button className="member-action-btn">Edit</button>
                      <button className="member-action-btn remove">Remove</button>
                    </div>
                  </div>
                  <div className="member-card">
                    <div className="member-avatar">JS</div>
                    <div className="member-info">
                      <h4>Jane Smith</h4>
                      <p>jane.smith@company.com</p>
                      <span className="member-role">Manager</span>
                    </div>
                    <div className="member-actions">
                      <button className="member-action-btn">Edit</button>
                      <button className="member-action-btn remove">Remove</button>
                    </div>
                  </div>
                  <div className="member-card">
                    <div className="member-avatar">RJ</div>
                    <div className="member-info">
                      <h4>Robert Johnson</h4>
                      <p>robert.j@company.com</p>
                      <span className="member-role">Employee</span>
                    </div>
                    <div className="member-actions">
                      <button className="member-action-btn">Edit</button>
                      <button className="member-action-btn remove">Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;