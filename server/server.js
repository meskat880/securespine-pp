import express from "express";
import cors from "cors";
import { repo } from "./db.js";
import { generateErgonomicCoaching } from "./ai-router.js";


const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.post("/api/coach", async (req, res) => {
  const result = await generateErgonomicCoaching(req.body || {});
  res.json(result);
});
let clients = [];

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((res) => res.write(data));
}

// 1. Real-time push stream for React frontend
app.get("/api/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
  });
});

// 2. Get persisted stats and recent logs
app.get("/api/stats", (req, res) => {
  res.json(repo.getDashboardData());
});

// 3. Trigger a break (called by Git hooks, build scripts, or UI buttons)
app.post("/api/trigger", (req, res) => {
  const { type = "MILESTONE", reason = "Git Commit Milestone" } = req.body;
  const event = repo.logEvent(type, reason);

  broadcast({ action: "TRIGGER_BREAK", event });
  res.status(201).json({ ok: true, event });
});

// 4. Save a completed 5-minute away-from-desk recovery
app.post("/api/recoveries", (req, res) => {
  const { reason = "Workflow Milestone", durationSeconds = 300 } = req.body;
  const recovery = repo.logRecovery(reason, durationSeconds);
  const event = repo.logEvent("RECOVERY_VERIFIED", `5m Spine Reset (${reason})`);

  broadcast({ action: "RECOVERY_LOGGED", recovery, event });
  res.status(201).json({ ok: true, recovery, stats: repo.getDashboardData() });
});

app.listen(PORT, () => {
  console.log(`SecureSpine++ Local Backend running on http://localhost:${PORT}`);
});