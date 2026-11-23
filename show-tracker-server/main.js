import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);
const app = express();
const port = 3001;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://show-tracker-pinecone.vercel.app",
    ],
  }),
);
app.use(express.json());

app.get("/api/shows", async (req, res) => {
  const result = await sql`SELECT * FROM shows`;
  res.json(result);
});

app.post("/api/shows", async (req, res) => {
  const { title, status, current_episode } = req.body;
  const result =
    await sql`INSERT INTO shows (title, status, current_episode) VALUES (${title}, ${status}, ${current_episode}) RETURNING *`;
  res.status(201).json(result[0]);
});

app.put("/api/shows/:id", async (req, res) => {
  const { id } = req.params;
  const { title, status, current_episode } = req.body;

  const result = await sql`UPDATE shows
       SET title = ${title},
           status = ${status},
           current_episode = ${current_episode},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ${id}
       RETURNING *`;

  res.json(result[0]);
});

app.patch("/api/shows/:id/episode", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (action !== "increment" && action !== "decrement") {
      return res.status(400).json({ message: "Invalid action" });
    }

    const delta = action === "increment" ? 1 : -1;

    const rows = await sql`
      UPDATE shows
      SET current_episode = current_episode + ${delta}
      WHERE id = ${id}
        AND current_episode + ${delta} >= 0
      RETURNING *
    `;

    if (rows.length === 0) {
      // Either the show doesn't exist, or the decrement would go below 0
      const exists = await sql`SELECT 1 FROM shows WHERE id = ${id}`;
      if (exists.length === 0) {
        return res.status(404).json({ message: "Show not found" });
      }
      return res.status(400).json({ message: "Episode cannot be less than 0" });
    }

    res.json({ show: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update episode" });
  }
});

app.delete("/api/shows/:id", async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM shows WHERE id=${id}`;
  res.json({ message: "Deleted successfully", id });
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
