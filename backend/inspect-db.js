require("dotenv").config();

const pool = require("./db");

async function inspectChecks() {
    try {
        const result = await pool.query(`
            SELECT
                conrelid::regclass AS table_name,
                conname AS constraint_name,
                pg_get_constraintdef(oid) AS definition
            FROM pg_constraint
            WHERE contype = 'c'
            ORDER BY conrelid::regclass::text, conname
        `);

        console.table(result.rows);
    } catch (error) {
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

inspectChecks();