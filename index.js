const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const blogRoutes = require("./routes/blogRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" })); // for JSON bodies
app.use(express.urlencoded({ extended: true, limit: "5mb" })); // for form bodies

// Routes
app.use("/api/blogs", blogRoutes);

// quick health check
app.get("/", (req, res) => {
  console.log("GET / health check");
  res.send("Backend is running!");
});

// Error handler (simple)
app.use((err, req, res, next) => {
  console.error("UNHANDLED ERROR:", err.stack || err);
  res.status(500).json({ error: "Something went wrong" });
});

// Start server 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
