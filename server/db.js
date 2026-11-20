import { DatabaseSync } from "node:sqlite";

const db = new DatabaseSync("./securespine.db");

// Create tables automatically on first run
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recoveries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reason TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    verified_by TEXT DEFAULT 'on-device-wasm',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export const repo = {
  logEvent(type, reason) {
    const stmt = db.prepare("INSERT INTO events (type, reason) VALUES (?, ?)");
    const info = stmt.run(type, reason);
    return {
      id: Number(info.lastInsertRowid),
      type,
      reason,
      created_at: new Date().toISOString(),
    };
  },

  logRecovery(reason, durationSeconds = 300) {
    const stmt = db.prepare("INSERT INTO recoveries (reason, duration_seconds) VALUES (?, ?)");
    const info = stmt.run(reason, durationSeconds);
    return {
      id: Number(info.lastInsertRowid),
      reason,
      duration_seconds: durationSeconds,
    };
  },

  getDashboardData() {
    const recentEvents = db.prepare("SELECT * FROM events ORDER BY id DESC LIMIT 8").all();
    const todayStats = db.prepare(`
      SELECT 
        COUNT(*) as totalBreaks, 
        COALESCE(SUM(duration_seconds), 0) as totalSeconds
      FROM recoveries
      WHERE date(completed_at) = date('now')
    `).get();

    return { recentEvents, todayStats };
  },
};