
const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

const validSlots = [
    "morning_fasting",
    "after_breakfast",
    "after_lunch",
    "after_dinner"
];

// Validate date format YYYY-MM-DD
function normalizeDate(value) {
    if (typeof value !== "string") return null;

    const date = value.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12 || day < 1) return null;

    const leapYear =
        year % 4 === 0 &&
        (year % 100 !== 0 || year % 400 === 0);

    const daysInMonth = [
        31, leapYear ? 29 : 28, 31, 30, 31, 30,
        31, 31, 30, 31, 30, 31
    ];

    if (day > daysInMonth[month - 1]) return null;

    return date;
}

// Get current date in India
function getTodayDate() {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const values = {};

    for (const part of parts) {
        values[part.type] = part.value;
    }

    return `${values.year}-${values.month}-${values.day}`;
}

// Validate reading details
function validateReading(reading_date, slot, value) {
    if (
        reading_date === undefined ||
        reading_date === null ||
        !slot ||
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return {
            error: "Date, slot and value are required"
        };
    }

    if (!validSlots.includes(slot)) {
        return {
            error: "Invalid reading slot"
        };
    }

    const normalizedDate = normalizeDate(reading_date);

    if (!normalizedDate) {
        return {
            error: "Invalid date. Use YYYY-MM-DD format."
        };
    }

    if (normalizedDate > getTodayDate()) {
        return {
            error: "Future dates are not allowed"
        };
    }

    const readingValue = Number(value);

    if (
        !Number.isInteger(readingValue) ||
        readingValue < 40 ||
        readingValue > 600
    ) {
        return {
            error: "Reading value must be a whole number between 40 and 600"
        };
    }

    return {
        error: null,
        reading_date: normalizedDate,
        value: readingValue
    };
}

// CREATE READING
router.post("/", authMiddleware, async (req, res) => {
    try {
        const { reading_date, slot, value } = req.body;

        const validation = validateReading(
            reading_date,
            slot,
            value
        );

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const result = await pool.query(
            `INSERT INTO readings
             (user_id, reading_date, slot, value)
             VALUES ($1, $2, $3, $4)
             RETURNING
                 id,
                 user_id,
                 TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                 slot,
                 value,
                 created_at`,
            [
                req.user.id,
                validation.reading_date,
                slot,
                validation.value
            ]
        );

        return res.status(201).json({
            message: "Reading added successfully",
            reading: result.rows[0]
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this slot and date"
            });
        }

        console.error("Create reading error:", error);

        return res.status(500).json({
            message: "Failed to add reading"
        });
    }
});

// GET ALL READINGS
router.get("/", authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                id,
                user_id,
                TO_CHAR(reading_date, 'YYYY-MM-DD') AS reading_date,
                slot,
                value,
                created_at
             FROM readings
             WHERE user_id = $1
             ORDER BY reading_date DESC, created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            count: result.rows.length,
            readings: result.rows
        });

    } catch (error) {
        console.error("Get readings error:", error);

        return res.status(500).json({
            message: "Failed to fetch readings"
        });
    }
});

// UPDATE READING
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { reading_date, slot, value } = req.body;

        const validation = validateReading(
            reading_date,
            slot,
            value
        );

        if (validation.error) {
            return res.status(400).json({
                message: validation.error
            });
        }

        const result = await pool.query(
            `UPDATE readings
             SET reading_date = $1,
                 slot = $2,
                 value = $3
             WHERE id = $4 AND user_id = $5
             RETURNING
                 id,
                 user_id,
                 slot,
                 value,
                 created_at`,
            [
                validation.reading_date,
                slot,
                validation.value,
                id,
                req.user.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found"
            });
        }

        // Use the validated date string in the response
        const updatedReading = {
            ...result.rows[0],
            reading_date: validation.reading_date
        };

        return res.status(200).json({
            message: "Reading updated successfully",
            reading: updatedReading
        });

    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "A reading already exists for this slot and date"
            });
        }

        console.error("Update reading error:", error);

        return res.status(500).json({
            message: "Failed to update reading"
        });
    }
});

// DELETE READING
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM readings
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Reading not found"
            });
        }

        return res.status(200).json({
            message: "Reading deleted successfully"
        });

    } catch (error) {
        console.error("Delete reading error:", error);

        return res.status(500).json({
            message: "Failed to delete reading"
        });
    }
});

module.exports = router;
