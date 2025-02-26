require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const quizRoutes = require("./routes/quizRoutes");

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

// Rate Limiting (100 requests/sec per user)
const limiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 100,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
      res.set("Retry-After", Math.ceil(1000 / 1000)); // 1 second retry time
      res.status(429).json({ message: "Too many requests, please try again later." });
    },
  });
  
  app.use(limiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/quizzes", quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
