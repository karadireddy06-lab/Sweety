
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");
const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
    res.send("Sweety API is running!");
});

// Database health check
app.get("/api/health", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");

        res.json({
            message: "Sweety API is healthy!",
            database: "Connected",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

// Authentication routes
app.use("/api/auth", authRoutes);
const readingRoutes = require("./routes/readings");

app.use("/api/readings", readingRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Sweety server running on port ${PORT}`);
});
