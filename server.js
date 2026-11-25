require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

const origins = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((s) => s.trim()) : "*";
app.use(cors({ origin: origins }));
app.use(express.json());

// Make sure DB is connected before every request (needed for serverless)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.get("/", (req, res) => res.json({ message: "Auth API is running" }));
app.use("/api/auth", require("./routes/authRoutes"));

// Run a normal server locally; Vercel uses the exported app instead
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
