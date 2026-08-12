import EmployeeModel from '../models/employee.model.js';

// Get all employees with filters
export const getEmployees = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log('👤 User companyId:', companyId);
        console.log('👤 User:', req.user);
        
        if (!companyId) {
            return res.status(401).json({ error: "Company ID not found in token" });
        }
        
        const { search, department, status } = req.query;
        const employees = await EmployeeModel.findAll(companyId, { search, department, status });
        res.json(employees);
    } catch (error) {
        console.error("Get employees error:", error);
        res.status(500).json({ error: "Failed to fetch employees" });
    }
};

// Get employee by ID
export const getEmployeeById = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(401).json({ error: "Company ID not found in token" });
        }
        
        const employee = await EmployeeModel.findById(companyId, req.params.id);
        if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
        }
        res.json(employee);
    } catch (error) {
        console.error("Get employee error:", error);
        res.status(500).json({ error: "Failed to fetch employee" });
    }
};

// Create new employee
export const createEmployee = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log('🏢 Creating employee for company:', companyId);
        console.log('📝 Employee data:', req.body);
        
        if (!companyId) {
            return res.status(401).json({ error: "Company ID not found in token" });
        }
        
        // Validate required fields
        const required = ['name', 'email', 'role', 'department'];
        const missing = required.filter(field => !req.body[field]);
        
        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missing.join(', ')}` 
            });
        }

        // Check if email already exists for this company
        const existingEmployee = await EmployeeModel.findByEmail(companyId, req.body.email);
        if (existingEmployee) {
            return res.status(400).json({ error: "Email already exists for this company" });
        }

        const employeeId = await EmployeeModel.create(companyId, req.body);
        const employee = await EmployeeModel.findById(companyId, employeeId);

        res.status(201).json({
            message: "Employee created successfully",
            employee
        });
    } catch (error) {
        console.error("Create employee error:", error);
        res.status(500).json({ 
            error: "Failed to create employee",
            details: error.message 
        });
    }
};

// Update employee
export const updateEmployee = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(401).json({ error: "Company ID not found in token" });
        }
        
        const updated = await EmployeeModel.update(companyId, req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: "Employee not found" });
        }

        const employee = await EmployeeModel.findById(companyId, req.params.id);
        res.json({
            message: "Employee updated successfully",
            employee
        });
    } catch (error) {
        console.error("Update employee error:", error);
        res.status(500).json({ error: "Failed to update employee" });
    }
};

// Delete employee
export const deleteEmployee = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(401).json({ error: "Company ID not found in token" });
        }
        
        const deleted = await EmployeeModel.delete(companyId, req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Employee not found" });
        }
        res.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Delete employee error:", error);
        res.status(500).json({ error: "Failed to delete employee" });
    }
};

// Get employee stats
export const getEmployeeStats = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(401).json({ error: "Company ID not found in token" });
        }
        
        const stats = await EmployeeModel.getStats(companyId);
        res.json(stats);
    } catch (error) {
        console.error("Get stats error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
};