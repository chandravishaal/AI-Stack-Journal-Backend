const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const blogRoutes = require("./routes/blogRoutes");

const app = express();
const PORT = process.env.PORT ;

// Connect to DB
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: "5mb" })); // adjust limit as needed

// Routes
app.use("/api/blogs", blogRoutes);

// quick health check
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Error handler (simple)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
