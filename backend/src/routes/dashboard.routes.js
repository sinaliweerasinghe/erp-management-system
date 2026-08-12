import express from "express";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", protect, (req, res) => {
  res.json({
    message: "Welcome to ERP Dashboard 🎉",
    user: req.user,
  });
});

export default router;
