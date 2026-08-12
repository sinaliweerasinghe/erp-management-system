import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root", // MAMP default
  database: "erp_system",
  port: 3306, // MAMP MySQL port
});

export default pool;
