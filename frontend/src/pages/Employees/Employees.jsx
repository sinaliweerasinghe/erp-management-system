import { useState, useEffect } from "react";
import axios from "axios";
import "./Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Form states - Separate for Add and Edit
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "active",
    joinDate: "",
    location: "",
    phone: "",
    performance: 0,
    projects: 0,
    skills: "",
  });

  const [editFormData, setEditFormData] = useState({
    id: null,
    name: "",
    email: "",
    role: "",
    department: "",
    status: "active",
    joinDate: "",
    location: "",
    phone: "",
    performance: 0,
    projects: 0,
    skills: "",
  });

  const API_URL = 'http://localhost:5001/api';

  // Fetch employees from API
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
      setError('Failed to load employees. Please try again.');
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const departments = ["all", ...new Set(employees.map(emp => emp.department))];
  
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || emp.department === selectedDepartment;
    const matchesStatus = selectedStatus === "all" || emp.status === selectedStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === "active").length,
    onLeave: employees.filter(e => e.status === "on-leave").length,
    avgPerformance: employees.length > 0 
      ? Math.round(employees.reduce((acc, e) => acc + e.performance, 0) / employees.length)
      : 0,
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { class: "status-active", label: "Active" },
      "on-leave": { class: "status-on-leave", label: "On Leave" },
      inactive: { class: "status-inactive", label: "Inactive" },
    };
    return badges[status] || badges.active;
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
      email: "",
      role: "",
      department: "",
      status: "active",
      joinDate: "",
      location: "",
      phone: "",
      performance: 0,
      projects: 0,
      skills: "",
    });
  };

  // Open edit modal with employee data
  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    setEditFormData({
      id: employee.id,
      name: employee.name || "",
      email: employee.email || "",
      role: employee.role || "",
      department: employee.department || "",
      status: employee.status || "active",
      joinDate: employee.join_date ? employee.join_date.split('T')[0] : "",
      location: employee.location || "",
      phone: employee.phone || "",
      performance: employee.performance || 0,
      projects: employee.projects || 0,
      skills: employee.skills ? employee.skills.join(", ") : "",
    });
    setShowEditModal(true);
  };

  // CONTACT EMPLOYEE
  const handleContact = (employee) => {
    setSelectedEmployee(employee);
    setShowContactModal(true);
  };

  // ADD EMPLOYEE - COMPLETELY FIXED
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        setIsSubmitting(false);
        return;
      }

      // Validate required fields
      if (!addFormData.name || !addFormData.email || !addFormData.role || !addFormData.department) {
        alert('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      const skillsArray = addFormData.skills 
        ? addFormData.skills.split(",").map(s => s.trim()).filter(s => s)
        : [];

      const employeeData = {
        name: addFormData.name,
        email: addFormData.email,
        role: addFormData.role,
        department: addFormData.department,
        status: addFormData.status || 'active',
        joinDate: addFormData.joinDate || new Date().toISOString().split('T')[0],
        location: addFormData.location || "",
        phone: addFormData.phone || "",
        performance: parseInt(addFormData.performance) || 0,
        projects: parseInt(addFormData.projects) || 0,
        avatar: addFormData.name.split(" ").map(n => n[0]).join("").toUpperCase(),
        skills: skillsArray
      };

      const response = await axios.post(`${API_URL}/employees`, employeeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Close modal FIRST before updating state
      setShowAddModal(false);
      
      // Reset form
      resetAddForm();
      
      // Then update state with the new employee at the top
      setEmployees(prevEmployees => {
        const newEmployee = response.data.employee;
        // Check if employee already exists to avoid duplicates
        if (prevEmployees.some(emp => emp.id === newEmployee.id)) {
          return prevEmployees;
        }
        return [newEmployee, ...prevEmployees];
      });
      
      alert('✅ Employee added successfully!');
      
    } catch (error) {
      console.error('Add employee error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to add employee';
      alert('❌ ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // EDIT EMPLOYEE - FIXED
  const handleEditEmployee = async (e) => {
    e.preventDefault();
    
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login first');
        setIsUpdating(false);
        return;
      }

      const skillsArray = editFormData.skills 
        ? editFormData.skills.split(",").map(s => s.trim()).filter(s => s)
        : [];

      const employeeData = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        department: editFormData.department,
        status: editFormData.status,
        joinDate: editFormData.joinDate,
        location: editFormData.location,
        phone: editFormData.phone,
        performance: parseInt(editFormData.performance) || 0,
        projects: parseInt(editFormData.projects) || 0,
        avatar: editFormData.name.split(" ").map(n => n[0]).join("").toUpperCase(),
        skills: skillsArray
      };

      const response = await axios.put(
        `${API_URL}/employees/${selectedEmployee.id}`,
        employeeData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Close modal first
      setShowEditModal(false);
      
      // Update state with the edited employee
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === selectedEmployee.id ? response.data.employee : emp
        )
      );
      
      setSelectedEmployee(null);
      alert('✅ Employee updated successfully!');
      
    } catch (error) {
      console.error('Update employee error:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update employee';
      alert('❌ ' + errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  // DELETE EMPLOYEE - FIXED
  const handleDeleteEmployee = async (id) => {
    if (isDeleting) return;
    
    if (window.confirm("Are you sure you want to delete this employee?")) {
      setIsDeleting(true);
      setDeleteId(id);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          alert('Please login first');
          setIsDeleting(false);
          setDeleteId(null);
          return;
        }

        await axios.delete(`${API_URL}/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update state by removing the deleted employee
        setEmployees(prevEmployees => prevEmployees.filter(emp => emp.id !== id));
        alert('✅ Employee deleted successfully!');
        
      } catch (error) {
        console.error('Delete employee error:', error);
        const errorMsg = error.response?.data?.error || 'Failed to delete employee';
        alert('❌ ' + errorMsg);
      } finally {
        setIsDeleting(false);
        setDeleteId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="employee-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-page">
        <div className="error-container">
          <p>❌ {error}</p>
          <button onClick={fetchEmployees}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-page">
      {/* Header Section */}
      <div className="employee-header">
        <div className="header-left">
          <h1 className="page-title">Team Management</h1>
          <p className="page-subtitle">Manage your workforce, track performance, and build culture</p>
        </div>
        <button className="add-employee-btn" onClick={() => { resetAddForm(); setShowAddModal(true); }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add Employee
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card-horizontal">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Employees</p>
          </div>
          <div className="stat-trend">+12% this year</div>
        </div>
        <div className="stat-card-horizontal">
          <div className="stat-icon">💚</div>
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <p>Active</p>
          </div>
          <div className="stat-trend">{stats.total > 0 ? Math.round((stats.active/stats.total)*100) : 0}% workforce</div>
        </div>
        <div className="stat-card-horizontal">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <h3>{stats.avgPerformance}</h3>
            <p>Avg Performance</p>
          </div>
          <div className="stat-trend">Top quartile</div>
        </div>
        <div className="stat-card-horizontal">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{departments.length - 1}</h3>
            <p>Departments</p>
          </div>
          <div className="stat-trend">Growing team</div>
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
            placeholder="Search by name, email, or role..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            {departments.map(dept => (
              <option key={dept} value={dept}>
                {dept === "all" ? "All Departments" : dept}
              </option>
            ))}
          </select>
          
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
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

      <div className="results-info">
        <p>Showing <strong>{filteredEmployees.length}</strong> employees</p>
        <div className="quick-chips">
          <button className="chip" onClick={() => { setSelectedDepartment("all"); setSelectedStatus("all"); setSearchTerm(""); }}>
            Clear all filters
          </button>
        </div>
      </div>

      {/* Employee Grid/Table View */}
      {viewMode === "grid" ? (
        <div className="employee-grid">
          {filteredEmployees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="card-header">
                <div className="employee-avatar large" style={{ background: `linear-gradient(135deg, #667eea, #764ba2)` }}>
                  {employee.avatar}
                </div>
                <div className="card-actions">
                  <button 
                    className="icon-btn edit-btn" 
                    onClick={() => openEditModal(employee)}
                    disabled={isUpdating}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M11.3333 1.99998L14 4.66665M2 14L4.66667 13.3333L13 4.99998L11 2.99998L2.66667 11.3333L2 14Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button 
                    className="icon-btn delete-btn" 
                    onClick={() => handleDeleteEmployee(employee.id)}
                    disabled={isDeleting && deleteId === employee.id}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4H14M12.6667 4V13.3333C12.6667 14 12 14.6667 11.3333 14.6667H4.66667C4 14.6667 3.33333 14 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2 6 1.33333 6.66667 1.33333H9.33333C10 1.33333 10.6667 2 10.6667 2.66667V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span>{isDeleting && deleteId === employee.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <h3 className="employee-name">{employee.name}</h3>
                <p className="employee-role">{employee.role}</p>
                <div className={`status-badge ${getStatusBadge(employee.status).class}`}>
                  {getStatusBadge(employee.status).label}
                </div>
                <div className="employee-details">
                  <div className="detail-item">
                    <span className="detail-icon">📧</span>
                    <span>{employee.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🏢</span>
                    <span>{employee.department}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span>{employee.location}</span>
                  </div>
                </div>
                <div className="performance-bar">
                  <div className="performance-label">
                    <span>Performance</span>
                    <span>{employee.performance}%</span>
                  </div>
                  <div className="bar-bg">
                    <div className="bar-fill" style={{ width: `${employee.performance}%` }}></div>
                  </div>
                </div>
                <div className="skills-section">
                  {employee.skills && employee.skills.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                  {employee.skills && employee.skills.length > 3 && <span className="skill-tag">+{employee.skills.length - 3}</span>}
                </div>
              </div>
              <div className="card-footer">
                <button className="contact-btn" onClick={() => handleContact(employee)}>
                  Contact
                </button>
                <button className="view-profile-btn" onClick={() => openEditModal(employee)}>
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Performance</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(employee => (
                <tr key={employee.id}>
                  <td className="employee-cell">
                    <div className="employee-info">
                      <div className="employee-avatar small" style={{ background: `linear-gradient(135deg, #667eea, #764ba2)` }}>
                        {employee.avatar}
                      </div>
                      <div>
                        <div className="employee-name-table">{employee.name}</div>
                        <div className="employee-email">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.role}</td>
                  <td>{employee.department}</td>
                  <td>
                    <div className={`status-badge ${getStatusBadge(employee.status).class}`}>
                      {getStatusBadge(employee.status).label}
                    </div>
                  </td>
                  <td>
                    <div className="performance-cell">
                      <div className="bar-bg small">
                        <div className="bar-fill" style={{ width: `${employee.performance}%` }}></div>
                      </div>
                      <span>{employee.performance}%</span>
                    </div>
                  </td>
                  <td>{employee.location}</td>
                  <td className="actions-cell">
                    <button 
                      className="table-action-btn" 
                      onClick={() => openEditModal(employee)}
                      disabled={isUpdating}
                    >
                      Edit
                    </button>
                    <button 
                      className="table-action-btn delete" 
                      onClick={() => handleDeleteEmployee(employee.id)}
                      disabled={isDeleting && deleteId === employee.id}
                    >
                      {isDeleting && deleteId === employee.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL - FIXED */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddEmployee} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={addFormData.name}
                    onChange={handleAddInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={addFormData.email}
                    onChange={handleAddInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <input
                    type="text"
                    name="role"
                    value={addFormData.role}
                    onChange={handleAddInputChange}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={addFormData.department}
                    onChange={handleAddInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={addFormData.status}
                    onChange={handleAddInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Join Date</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={addFormData.joinDate}
                    onChange={handleAddInputChange}
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
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={addFormData.phone}
                    onChange={handleAddInputChange}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Performance (%)</label>
                  <input
                    type="number"
                    name="performance"
                    value={addFormData.performance}
                    onChange={handleAddInputChange}
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Projects</label>
                  <input
                    type="number"
                    name="projects"
                    value={addFormData.projects}
                    onChange={handleAddInputChange}
                    placeholder="Number of projects"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={addFormData.skills}
                  onChange={handleAddInputChange}
                  placeholder="e.g., React, JavaScript, Node.js"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Adding...' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EMPLOYEE MODAL - FIXED */}
      {selectedEmployee && showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditEmployee} className="employee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <input
                    type="text"
                    name="role"
                    value={editFormData.role}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Software Engineer"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department *</label>
                  <select
                    name="department"
                    value={editFormData.department}
                    onChange={handleEditInputChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                    <option value="Security">Security</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={editFormData.status}
                    onChange={handleEditInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="on-leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Join Date</label>
                  <input
                    type="date"
                    name="joinDate"
                    value={editFormData.joinDate}
                    onChange={handleEditInputChange}
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
                    placeholder="e.g., San Francisco, CA"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    placeholder="e.g., +1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Performance (%)</label>
                  <input
                    type="number"
                    name="performance"
                    value={editFormData.performance}
                    onChange={handleEditInputChange}
                    placeholder="0-100"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="form-group">
                  <label>Projects</label>
                  <input
                    type="number"
                    name="projects"
                    value={editFormData.projects}
                    onChange={handleEditInputChange}
                    placeholder="Number of projects"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={editFormData.skills}
                  onChange={handleEditInputChange}
                  placeholder="e.g., React, JavaScript, Node.js"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACT EMPLOYEE MODAL */}
      {selectedEmployee && showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <div className="modal-content contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Contact {selectedEmployee.name}</h2>
              <button className="modal-close-btn" onClick={() => setShowContactModal(false)}>×</button>
            </div>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <div>
                  <label>Email</label>
                  <p>{selectedEmployee.email}</p>
                  <button 
                    className="contact-action-btn"
                    onClick={() => window.location.href = `mailto:${selectedEmployee.email}?subject=Hello ${selectedEmployee.name}`}
                  >
                    Send Email
                  </button>
                </div>
              </div>
              {selectedEmployee.phone && (
                <div className="contact-item">
                  <span className="contact-icon">📱</span>
                  <div>
                    <label>Phone</label>
                    <p>{selectedEmployee.phone}</p>
                    <button 
                      className="contact-action-btn"
                      onClick={() => window.location.href = `tel:${selectedEmployee.phone}`}
                    >
                      Call Now
                    </button>
                  </div>
                </div>
              )}
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <div>
                  <label>Location</label>
                  <p>{selectedEmployee.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🏢</span>
                <div>
                  <label>Department</label>
                  <p>{selectedEmployee.department}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;