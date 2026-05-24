require("dotenv").config();
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
console.log("✅ INDEX.JS LOGIN VERSION LOADED");

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

const dbPath = "./database.sqlite";
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error(err);
  else console.log("Connected to SQLite database.");
});

function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

function requirePageAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }

  next();
}

db.run(`
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT,
  category TEXT,
  cover_image TEXT,
  start_date TEXT,
  end_date TEXT,
  rating REAL,
  summary TEXT,
  content TEXT,
  gallery TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS website_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_name TEXT,
  hero_title TEXT,
  hero_description TEXT,
  hero_image TEXT,
  about_name TEXT,
  about_description TEXT,
  about_quote TEXT,
  about_image TEXT,
  donation_link TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

const adminEmail = process.env.ADMIN_EMAIL || "miizternat@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD || "#Natsu3699";

db.get(
  "SELECT * FROM users WHERE username = ?",
  [adminEmail],
  async (err, row) => {
    if (err) {
      console.error(err);
      return;
    }

    if (!row) {
      const hash = await bcrypt.hash(adminPassword, 8);

      db.run(
        `
        INSERT INTO users (username, password_hash)
        VALUES (?, ?)
        `,
        [adminEmail, hash],
      );

      console.log(`Default admin created: ${adminEmail}`);
    }
  },
);

db.get("SELECT * FROM website_settings WHERE id = 1", [], (err, row) => {
  if (err) console.error(err);

  if (!row) {
    db.run(
      `
      INSERT INTO website_settings (
        id,
        site_name,
        hero_title,
        hero_description,
        hero_image,
        about_name,
        about_description,
        about_quote,
        about_image,
        donation_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        1,
        "Miizternat Journey",
        "บันทึกการเดินทางของมิสเตอร์นัต",
        "สะพายเป้ กางเต็นท์ เดินป่า และปีนเขา",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80",
        "นัตสึ",
        "นัตสึ คือคนที่ชอบออกเดินทางเพื่อเก็บความทรงจำผ่านธรรมชาติ ทั้งภูเขา น้ำตก ทะเลหมอก และเส้นทางระหว่างทางที่เต็มไปด้วยความเงียบสงบ",
        "การเดินทางที่ดีที่สุด ไม่ใช่การไปให้ไกลที่สุด แต่คือการได้กลับมารู้สึกดีกับตัวเองอีกครั้ง",
        "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80",
        "https://ezdn.app/MiizterNAT",
      ],
    );
  }
});

/* AUTH API */
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!user) {
        return res.status(401).json({
          error: "Invalid username or password",
        });
      }

      const match = await bcrypt.compare(password, user.password_hash);

      if (!match) {
        return res.status(401).json({
          error: "Invalid username or password",
        });
      }

      req.session.user = {
        id: user.id,
        username: user.username,
      };

      res.json({
        message: "Login success",
        user: req.session.user,
      });
    },
  );
});

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  res.json({
    authenticated: true,
    user: req.session.user,
  });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      message: "Logout success",
    });
  });
});

/* PUBLIC API */
app.get("/api/trips", (req, res) => {
  db.all("SELECT * FROM trips ORDER BY start_date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

app.get("/api/trips/:slug", (req, res) => {
  db.get(
    "SELECT * FROM trips WHERE slug = ?",
    [req.params.slug],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ data: row });
    },
  );
});

app.get("/api/settings", (req, res) => {
  db.get("SELECT * FROM website_settings WHERE id = 1", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: row });
  });
});

/* PROTECTED ADMIN API */
app.post("/api/trips", requireAuth, (req, res) => {
  const {
    slug,
    title,
    category,
    cover_image,
    start_date,
    end_date,
    rating,
    summary,
    content,
    gallery,
  } = req.body;

  db.run(
    `
    INSERT INTO trips (
      slug,
      title,
      category,
      cover_image,
      start_date,
      end_date,
      rating,
      summary,
      content,
      gallery
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      slug,
      title,
      category,
      cover_image,
      start_date,
      end_date,
      rating,
      summary,
      content,
      gallery,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Success", id: this.lastID });
    },
  );
});

app.put("/api/trips/:slug", requireAuth, (req, res) => {
  const {
    title,
    category,
    cover_image,
    start_date,
    end_date,
    rating,
    summary,
    content,
    gallery,
  } = req.body;

  db.run(
    `
    UPDATE trips
    SET
      title = ?,
      category = ?,
      cover_image = ?,
      start_date = ?,
      end_date = ?,
      rating = ?,
      summary = ?,
      content = ?,
      gallery = ?
    WHERE slug = ?
    `,
    [
      title,
      category,
      cover_image,
      start_date,
      end_date,
      rating,
      summary,
      content,
      gallery,
      req.params.slug,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Updated" });
    },
  );
});

app.delete("/api/trips/:slug", requireAuth, (req, res) => {
  db.run("DELETE FROM trips WHERE slug = ?", [req.params.slug], (err) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ message: "Deleted" });
  });
});

app.put("/api/settings", requireAuth, (req, res) => {
  const {
    site_name,
    hero_title,
    hero_description,
    hero_image,
    about_name,
    about_description,
    about_quote,
    about_image,
    donation_link,
  } = req.body;

  db.run(
    `
    UPDATE website_settings
    SET
      site_name = ?,
      hero_title = ?,
      hero_description = ?,
      hero_image = ?,
      about_name = ?,
      about_description = ?,
      about_quote = ?,
      about_image = ?,
      donation_link = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    `,
    [
      site_name,
      hero_title,
      hero_description,
      hero_image,
      about_name,
      about_description,
      about_quote,
      about_image,
      donation_link,
    ],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: "Settings updated" });
    },
  );
});

/* PROTECTED ADMIN PAGES */
app.get("/admin.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/admin-list.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-list.html"));
});

app.get("/admin-dashboard.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.get("/admin-settings.html", requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-settings.html"));
});

/* PUBLIC STATIC FILES */
app.use(express.static(path.join(__dirname, "public")));

console.log("LOGIN ROUTE VERSION LOADED");
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log("Connected to SQLite database.");
});
