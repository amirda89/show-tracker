import express from "express";
import cors from "cors";
import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { clerkMiddleware, getAuth } from "@clerk/express";

const sql = neon(process.env.DATABASE_URL);
const app = express();
const port = process.env.PORT || 3001;

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

//MIDDLEWARE
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
  try {
    const result = await sql`
      SELECT
        shows.id,
        shows.title,
        shows.media_type,
        shows.status,
        shows.current_episode,
        shows.total_episodes,
        shows.profileid,
        profiles.name AS profilename
      FROM shows
      LEFT JOIN profiles
        ON shows.profileid = profiles.id AND profiles.userid = ${req.userId}
      WHERE shows.userid = ${req.userId}
      ORDER BY shows.id DESC
    `;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch shows" });
  }
});

app.post("/api/shows", requireAuthUser, async (req, res) => {
  try {
    const {
      title,
      media_type = "series",
      status = "Watching",
      current_episode = 0,
      total_episodes = null,
      profile_id = null,
    } = req.body;

    if (!["series", "movie"].includes(media_type)) {
      return res.status(400).json({ error: "Invalid media_type" });
    }

    if (profile_id) {
      const ownedProfile =
        await sql`SELECT id FROM profiles WHERE id=${profile_id} AND userid=${req.userId}`;
      if (ownedProfile.length === 0) {
        return res.status(403).json({ error: "Invalid profile for this user" });
      }
    }

    const isMovie = media_type === "movie";
    const normalizedEpisode = isMovie
      ? status === "Completed"
        ? 1
        : 0
      : Math.max(0, Number(current_episode) || 0);
    const normalizedTotal = isMovie
      ? 1
      : total_episodes
        ? Math.max(1, Number(total_episodes))
        : null;

    const result = await sql`
      INSERT INTO shows (title, media_type, status, current_episode, total_episodes, profileid, userid)
      VALUES (${title}, ${media_type}, ${status}, ${normalizedEpisode}, ${normalizedTotal}, ${profile_id}, ${req.userId})
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create show" });
  }
});

app.put("/api/shows/:id", requireAuthUser, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      media_type = "series",
      status,
      current_episode,
      total_episodes = null,
      profile_id = null,
    } = req.body;

    if (!["series", "movie"].includes(media_type)) {
      return res.status(400).json({ error: "Invalid media_type" });
    }

    const isMovie = media_type === "movie";
    const normalizedEpisode = isMovie
      ? status === "Completed"
        ? 1
        : 0
      : Math.max(0, Number(current_episode) || 0);
    const normalizedTotal = isMovie
      ? 1
      : total_episodes
        ? Math.max(1, Number(total_episodes))
        : null;

    const result = await sql`
      UPDATE shows
      SET
        title = ${title},
        media_type = ${media_type},
        status = ${status},
        current_episode = ${normalizedEpisode},
        total_episodes = ${normalizedTotal},
        profileid = ${profile_id},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND userid = ${req.userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }

    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update show" });
  }
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
      SET
        current_episode = current_episode + ${delta},
        status = CASE
          WHEN total_episodes IS NOT NULL AND current_episode + ${delta} >= total_episodes THEN 'Completed'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
        AND userid = ${req.userId}
        AND media_type = 'series'
        AND current_episode + ${delta} >= 0
        AND (total_episodes IS NULL OR current_episode + ${delta} <= total_episodes)
      RETURNING *
    `;

    if (rows.length === 0) {
      const exists =
        await sql`SELECT current_episode FROM shows WHERE id = ${id} AND userid = ${req.userId}`;
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
  try {
    const { id } = req.params;
    const deleted =
      await sql`DELETE FROM shows WHERE id=${id} AND userid = ${req.userId} RETURNING id`;
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Show not found" });
    }
    res.json({ message: "Deleted successfully", id: deleted[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete show" });
  }
});

// PROFILES
app.get("/api/profiles", requireAuthUser, async (req, res) => {
  try {
    const result =
      await sql`SELECT * FROM profiles WHERE userid = ${req.userId}`;
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

app.post("/api/profiles", requireAuthUser, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create profile" });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
