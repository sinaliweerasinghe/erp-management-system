import express from "express";
import {
  registerCompany,
  loginUser
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", registerCompany);
router.post("/login", loginUser);

export default router;
