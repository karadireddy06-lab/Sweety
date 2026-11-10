require("dotenv").config();

const pool = require("./db");

async function testDatabase() {
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("SUCCESS: PostgreSQL connected!");
        console.log("Database time:", result.rows[0].now);
    } catch (error) {
        console.log("FAILED: PostgreSQL connection error");
        console.log("Error code:", error.code);
        console.log("Error message:", error.message);
    } finally {
        await pool.end();
    }
}

testDatabase();