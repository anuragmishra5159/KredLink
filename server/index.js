require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes      = require("./routes/auth");
const merchantRoutes  = require("./routes/merchants");
const creditRoutes    = require("./routes/credit");
const decisionRoutes  = require("./routes/decisions");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",") 
  : ["http://localhost:5173", "http://localhost:5174"];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith(".vercel.app") || 
                      origin.startsWith("http://localhost:");
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/v1/auth",      authRoutes);
app.use("/api/v1/merchants", merchantRoutes);
app.use("/api/v1/credit",    creditRoutes);
app.use("/api/v1/decisions", decisionRoutes);

app.get("/api/v1/health", (req, res) =>
  res.json({ status: "ok", service: "kredlink-api", ts: new Date() })
);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: "Route not found" }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
});

// ─── DB + Start ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kredlink";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅  MongoDB connected:", MONGO_URI);
    app.listen(PORT, () => console.log(`🚀  KredLink API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("❌  MongoDB connection failed:", err.message);
    process.exit(1);
  });
