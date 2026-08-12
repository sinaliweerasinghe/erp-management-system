import pool from '../config/db.js';

class EmployeeModel {
    // Get all employees with filters (company-specific)
    static async findAll(companyId, filters = {}) {
        let query = "SELECT * FROM employees WHERE company_id = ?";
        const params = [companyId];

        if (filters.department && filters.department !== "all") {
            query += " AND department = ?";
            params.push(filters.department);
        }

        if (filters.status && filters.status !== "all") {
            query += " AND status = ?";
            params.push(filters.status);
        }

        if (filters.search) {
            query += " AND (name LIKE ? OR email LIKE ? OR role LIKE ?)";
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        query += " ORDER BY created_at DESC";

        console.log('📊 Employee query for company:', companyId);
        console.log('📊 Query:', query, params);

        const [rows] = await pool.query(query, params);
        return rows;
    }

    // Get employee by ID (company-specific)
    static async findById(companyId, id) {
        const [rows] = await pool.query(
            "SELECT * FROM employees WHERE company_id = ? AND id = ?",
            [companyId, id]
        );
        return rows[0];
    }

    // Find employee by email (company-specific)
    static async findByEmail(companyId, email) {
        const [rows] = await pool.query(
            "SELECT * FROM employees WHERE company_id = ? AND email = ?",
            [companyId, email]
        );
        return rows[0];
    }

    // Create new employee
    static async create(companyId, employeeData) {
        try {
            const {
                name,
                email,
                role,
                department,
                status = "active",
                joinDate,
                location,
                phone,
                performance = 0,
                projects = 0,
                avatar,
                skills = [],
            } = employeeData;

            // Validate required fields
            if (!name || !email || !role || !department) {
                throw new Error("Missing required fields: name, email, role, department");
            }

            // Format date if provided
            let formattedDate = null;
            if (joinDate) {
                formattedDate = new Date(joinDate).toISOString().split('T')[0];
            }

            const query = `
                INSERT INTO employees 
                (company_id, name, email, role, department, status, join_date, location, 
                 phone, performance, projects, avatar, skills)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                companyId,  // Critical: Always use companyId from token
                name.trim(),
                email.trim().toLowerCase(),
                role.trim(),
                department.trim(),
                status,
                formattedDate,
                location ? location.trim() : null,
                phone ? phone.trim() : null,
                parseInt(performance) || 0,
                parseInt(projects) || 0,
                avatar ? avatar.trim().toUpperCase() : null,
                JSON.stringify(skills || []),
            ];

            console.log('📝 Creating employee for company:', companyId);

            const [result] = await pool.query(query, values);
            return result.insertId;
        } catch (error) {
            console.error("Model create error:", error);
            throw error;
        }
    }

    // Update employee (company-specific)
    static async update(companyId, id, employeeData) {
        try {
            const {
                name,
                email,
                role,
                department,
                status,
                joinDate,
                location,
                phone,
                performance,
                projects,
                avatar,
                skills,
            } = employeeData;

            // Format date if provided
            let formattedDate = null;
            if (joinDate) {
                formattedDate = new Date(joinDate).toISOString().split('T')[0];
            }

            const query = `
                UPDATE employees SET
                    name = ?, email = ?, role = ?, department = ?, status = ?,
                    join_date = ?, location = ?, phone = ?, performance = ?,
                    projects = ?, avatar = ?, skills = ?
                WHERE company_id = ? AND id = ?
            `;

            const values = [
                name ? name.trim() : null,
                email ? email.trim().toLowerCase() : null,
                role ? role.trim() : null,
                department ? department.trim() : null,
                status || 'active',
                formattedDate,
                location ? location.trim() : null,
                phone ? phone.trim() : null,
                parseInt(performance) || 0,
                parseInt(projects) || 0,
                avatar ? avatar.trim().toUpperCase() : null,
                skills ? JSON.stringify(skills) : JSON.stringify([]),
                companyId,  // Critical: Ensure company matches
                id
            ];

            console.log('📝 Updating employee for company:', companyId);

            const [result] = await pool.query(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Model update error:", error);
            throw error;
        }
    }

    // Delete employee (company-specific)
    static async delete(companyId, id) {
        try {
            const [result] = await pool.query(
                "DELETE FROM employees WHERE company_id = ? AND id = ?",
                [companyId, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error("Model delete error:", error);
            throw error;
        }
    }

    // Get stats (company-specific)
    static async getStats(companyId) {
        const [total] = await pool.query(
            "SELECT COUNT(*) as total FROM employees WHERE company_id = ?",
            [companyId]
        );
        const [active] = await pool.query(
            "SELECT COUNT(*) as active FROM employees WHERE company_id = ? AND status = 'active'",
            [companyId]
        );
        const [onLeave] = await pool.query(
            "SELECT COUNT(*) as onLeave FROM employees WHERE company_id = ? AND status = 'on-leave'",
            [companyId]
        );
        const [avgPerformance] = await pool.query(
            "SELECT AVG(performance) as avgPerformance FROM employees WHERE company_id = ?",
            [companyId]
        );

        const [departments] = await pool.query(
            "SELECT DISTINCT department FROM employees WHERE company_id = ?",
            [companyId]
        );

        return {
            total: total[0].total || 0,
            active: active[0].active || 0,
            onLeave: onLeave[0].onLeave || 0,
            avgPerformance: Math.round(avgPerformance[0].avgPerformance || 0),
            departments: departments.map((d) => d.department)
        };
    }
}

export default EmployeeModel;