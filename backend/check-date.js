const pool = require("./db");

async function checkDateColumn() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'readings'
            AND column_name = 'reading_date'
        `);

        console.table(result.rows);
    } catch (error) {
        console.error(error.message);
    } finally {
        await pool.end();
    }
}

checkDateColumn();