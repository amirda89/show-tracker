import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { clerkMiddleware, getAuth } from "@clerk/express";

const sql = neon(process.env.DATABASE_URL);
const app = express();
const port = process.env.PORT;

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://show-tracker-pinecone.vercel.app",
    ],
  }),
);
app.use(express.json());
app.use(clerkMiddleware());

function requireAuthUser(req, res, next) {
  const { isAuthenticated, userId } = getAuth(req);
  if (!isAuthenticated || !userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.userId = userId;
  next();
}

// SHOWS
app.get("/api/shows", requireAuthUser, async (req, res) => {
  const result = await sql`SELECT 
    shows.id, 
    title, 
    status, 
    current_episode, 
    name AS profilename 
    FROM shows 
    LEFT JOIN profiles 
    ON shows.profileid = profiles.id 
    WHERE shows.userid = ${req.userId}`;
  res.json(result);
});

app.post("/api/shows", requireAuthUser, async (req, res) => {
  const { title, status, current_episode, profile_id } = req.body;

  if (profile_id) {
    const ownedProfile =
      await sql`SELECT id FROM profiles WHERE id=${profile_id} AND userid=${req.userId}`;
    if (ownedProfile.length === 0) {
      return res.status(403).json({ error: "Invalid profile for this user" });
    }
  }
  const result =
    await sql`INSERT INTO shows (title, status, current_episode, profileid, userid) 
    VALUES (${title}, ${status}, ${current_episode}, ${profile_id}, ${req.userId}) 
    RETURNING *`;
  res.status(201).json(result[0]);
});

app.put("/api/shows/:id", requireAuthUser, async (req, res) => {
  const { id } = req.params;
  const { title, status, current_episode, profile_id } = req.body;

  const result = await sql`
      UPDATE shows
      SET title = ${title},
           status = ${status},
           current_episode = ${current_episode},
           profileid = ${profile_id}
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ${id} AND userid = ${req.userId}
       RETURNING *`;

  if (result.length === 0) {
    return res.status(404).json({ error: "Show not found" });
  }

  res.json(result[0]);
});

app.patch("/api/shows/:id/episode", requireAuthUser, async (req, res) => {
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
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
        AND current_episode + ${delta} >= 0
      RETURNING *
    `;

    if (rows.length === 0) {
      const exists =
        await sql`SELECT current_episode FROM shows WHERE id = ${id} AND userId = ${req.userId}`;
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

app.delete("/api/shows/:id", requireAuthUser, async (req, res) => {
  const { id } = req.params;
  const deleted =
    await sql`DELETE FROM shows WHERE id=${id} AND userid = ${req.userId} RETURNING id`;
  if (deleted.length === 0)
    return res.status(404).json({ error: "Show not found" });
  res.json({ message: "Deleted successfully", id: deleted[0].id });
});

//PROFILES
app.get("/api/profiles", requireAuthUser, async (req, res) => {
  const result = await sql`SELECT * FROM profiles WHERE userid = ${req.userId}`;
  res.json(result);
});

app.post("/api/profiles", requireAuthUser, async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Profile name is required" });
  }

  const result = await sql`
      INSERT INTO profiles (name, userid)
      VALUES (${name.trim()}, ${req.userId})
      RETURNING *
    `;
  res.status(201).json(result[0]);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
