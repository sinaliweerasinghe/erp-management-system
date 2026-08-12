import dotenv from "dotenv";
import app from "./app.js";
import pool from "./config/db.js"; // ADD THIS

dotenv.config();

const PORT = process.env.PORT || 5001;

// Test database connection
try {
  const [rows] = await pool.query("SELECT 1");
  console.log("✅ Database connected successfully!");
} catch (error) {
  console.error("❌ Database connection failed:", error.message);
}

app.listen(PORT, () => {
  console.log(`✅ SERVER RUNNING ON: http://localhost:${PORT}`);
});