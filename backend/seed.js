require("dotenv").config();

const bcrypt = require("bcrypt");
const pool = require("./db");

async function seedDatabase() {
    try {
        const email = "demo@sweety.com";
        const password = "SweetyDemo123!";
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create demo user if it does not exist
        const userResult = await pool.query(
            `INSERT INTO users (name, email, password_hash)
             VALUES ($1, $2, $3)
             ON CONFLICT (email)
             DO UPDATE SET name = EXCLUDED.name
             RETURNING id`,
            ["Sweety Demo", email, hashedPassword]
        );

        const userId = userResult.rows[0].id;

        // Add sample readings only if the demo user has none
        const existing = await pool.query(
            "SELECT COUNT(*) FROM readings WHERE user_id = $1",
            [userId]
        );

        if (Number(existing.rows[0].count) === 0) {
            const readings = [
                ["morning_fasting", 105],
                ["after_breakfast", 145],
                ["after_lunch", 132],
                ["after_dinner", 118]
            ];

            for (const [slot, value] of readings) {
                await pool.query(
                    `INSERT INTO readings (user_id, reading_date, slot, value)
                     VALUES ($1, CURRENT_DATE, $2, $3)`,
                    [userId, slot, value]
                );
            }
        }

        console.log("Demo data created successfully!");
        console.log("Demo email:", email);
        console.log("Demo password:", password);

    } catch (error) {
        console.error("Seed error:", error.message);
    } finally {
        await pool.end();
    }
}

seedDatabase();