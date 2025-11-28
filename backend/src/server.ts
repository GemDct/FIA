import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MYSQL CONNECTION POOL ---
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

// --- TEST ROUTE ---
app.get("/health", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT 1");
    res.json({ status: "OK", db: "connected", rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "ERROR",
      error: (error as Error).message
    });
  }
});

// --- START SERVER ---
const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
