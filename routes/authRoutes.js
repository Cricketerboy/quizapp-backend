const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateJWT = require("../middleware/authMiddleware");

const router = express.Router();

// User Signup Route
router.post("/signup", async (req, res) => {
  const { username, password, role } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password before saving
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({ username, password: hashedPassword, role });
  await newUser.save();

  res.status(201).json({ 
    message: `${role} registered successfully`, 
    role: newUser.role 
  });
});

// User Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "60m" });
  res.json({ token });
});

// Protected Dashboard Route
router.get("/dashboard", authenticateJWT, (req, res) => {
  res.json({ message: `Welcome ${req.user.role} to the dashboard!` });
});

module.exports = router;
