import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);
const app = express();
const port = 3001;

app.use(cors());
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

app.delete("/api/shows/:id", async (req, res) => {
  const { id } = req.params;
  await sql`DELETE FROM shows WHERE id=${id}`;
  res.json({ message: "Deleted successfully", id });
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
