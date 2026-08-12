import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerCompany = async (req, res) => {
  try {
    const { companyName, adminEmail, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert company
    const [companyResult] = await pool.query(
      "INSERT INTO companies (name) VALUES (?)",
      [companyName]
    );

    const companyId = companyResult.insertId;

    // Insert admin user
    await pool.query(
      "INSERT INTO users (company_id, email, password, role) VALUES (?, ?, ?, ?)",
      [companyId, adminEmail, hashedPassword, "ADMIN"]
    );

    res.status(201).json({
      message: "Company registered successfully 🎉",
      companyId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Registration failed ❌" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid credentials ❌" });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials ❌" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        companyId: user.company_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful ✅",
      token,
      user: {
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed ❌" });
  }
};
