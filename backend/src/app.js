import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import employeeRoutes from "./routes/employee.routes.js"; 
import inventoryRoutes from "./routes/inventory.routes.js"; 
import orderRoutes from "./routes/order.routes.js"; 
import analyticsRoutes from "./routes/analytics.routes.js"; 
import settingsRoutes from "./routes/settings.routes.js";
//import aiRoutes from "./routes/ai.routes.js"; // ADD THIS


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes); 
app.use("/api/inventory", inventoryRoutes); 
app.use("/api/orders", orderRoutes); 
app.use("/api/analytics", analyticsRoutes); 
app.use("/api/settings", settingsRoutes);
//app.use("/api/ai", aiRoutes); // ADD THIS

app.get("/", (req, res) => {
  res.send("ERP BACKEND IS WORKING 🚀!");
});

export default app;