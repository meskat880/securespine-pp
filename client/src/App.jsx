import { useEffect, useState } from "react";
import { GitCommit, Hammer, Clock, Shield, Video, Terminal, CheckCircle2 } from "lucide-react";
import RecoveryLock from "./components/RecoveryLock";

const API_URL = "http://localhost:4000/api";

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [focusSeconds, setFocusSeconds] = useState(() => loadLocal("securespine_focus_seconds", 0));
  const [meetingMode, setMeetingMode] = useState(false);
  const [lockReason, setLockReason] = useState(null);
  const [stats, setStats] = useState(() => loadLocal("securespine_stats", { totalBreaks: 0, totalSeconds: 0 }));
  const [logs, setLogs] = useState(() => loadLocal("securespine_logs", []));
  const [commitMsg, setCommitMsg] = useState("feat: add local pose verification");

  const saveStats = (updater) => {
    setStats((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("securespine_stats", JSON.stringify(next));
      return next;
    });
  };

  const saveLogs = (updater) => {
    setLogs((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("securespine_logs", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    fetch(`${API_URL}/stats`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.todayStats?.totalBreaks > 0) saveStats(data.todayStats);
        if (data.recentEvents?.length > 0) saveLogs(data.recentEvents);
      })
      .catch(() => {});

    let sse;
    try {
      sse = new EventSource(`${API_URL}/stream`);
      sse.onmessage = (e) => {
        const payload = JSON.parse(e.data);
        if (payload.action === "TRIGGER_BREAK") {
          saveLogs((prev) => [payload.event, ...prev.slice(0, 7)]);
          setMeetingMode((isMeeting) => {
            if (!isMeeting) setLockReason(payload.event.reason);
            return isMeeting;
          });
        }
      };
    } catch {}

    return () => sse && sse.close();
  }, []);

  useEffect(() => {
    if (lockReason || meetingMode) return;
    const interval = setInterval(() => {
      setFocusSeconds((prev) => {
        const next = prev + 1;
        if (next >= 3000) {
          triggerBackendMilestone("SPRINT_CAP", "50-Minute Uninterrupted Coding Cap");
          localStorage.setItem("securespine_focus_seconds", "0");
          return 0;
        }
        localStorage.setItem("securespine_focus_seconds", JSON.stringify(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockReason, meetingMode]);

  const triggerBackendMilestone = async (type, reason) => {
    try {
      const res = await fetch(`${API_URL}/trigger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, reason }),
      });
      if (!res.ok) throw new Error();
    } catch {
      const localEvent = { id: Date.now(), type, reason };
      saveLogs((prev) => [localEvent, ...prev.slice(0, 7)]);
      if (!meetingMode) setLockReason(reason);
    }
  };

  const handleUnlock = async () => {
    const completedReason = lockReason;
    setLockReason(null);
    setFocusSeconds(0);
    localStorage.setItem("securespine_focus_seconds", "0");

    try {
      const res = await fetch(`${API_URL}/recoveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: completedReason, durationSeconds: 300 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.stats) {
        saveStats(data.stats.todayStats);
        saveLogs(data.stats.recentEvents);
      }
    } catch {
      saveStats((s) => ({ totalBreaks: s.totalBreaks + 1, totalSeconds: s.totalSeconds + 300 }));
      saveLogs((prev) => [
        { id: Date.now(), type: "RECOVERY_VERIFIED", reason: `5m Spine Reset (${completedReason})` },
        ...prev.slice(0, 7),
      ]);
    }
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", background: "#090d16", color: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "28px 36px" }}>
      {lockReason && <RecoveryLock reason={lockReason} onUnlock={handleUnlock} />}

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: 18, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>
            SecureSpine<span style={{ color: "#38bdf8" }}>++</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: "#94a3b8", fontSize: 13 }}>Full-Stack Local Ergonomic & Deep-Focus Co-Pilot</p>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, background: "#052e16", border: "1px solid #166534", color: "#4ade80", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
            <Shield size={14} /> On-Device WASM • 0 Cloud Uploads
          </span>
          <button
            onClick={() => setMeetingMode(!meetingMode)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "1px solid #334155", cursor: "pointer",
              background: meetingMode ? "#7c2d12" : "#1e293b", color: "#f8fafc", fontSize: 12, fontWeight: 600
            }}
          >
            <Video size={14} /> {meetingMode ? "Meeting Auto-Pause: ON" : "Meeting Auto-Pause: OFF"}
          </button>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#38bdf8", fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
            <Terminal size={16} /> Live Terminal & Milestone Bridge
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
            Trigger a coding milestone below (or via local Git hook) to initiate an away-from-desk recovery break:
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (commitMsg.trim()) triggerBackendMilestone("GIT_COMMIT", `Git Commit: ${commitMsg}`);
            }}
            style={{ display: "flex", gap: 8, marginBottom: 14 }}
          >
            <input
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              style={{ flex: 1, background: "#090d16", border: "1px solid #334155", borderRadius: 8, padding: "10px 12px", color: "#f8fafc", fontSize: 13 }}
            />
            <button type="submit" style={{ display: "flex", alignItems: "center", gap: 6, background: "#0284c7", color: "white", border: "none", borderRadius: 8, padding: "0 16px", fontWeight: 600, cursor: "pointer" }}>
              <GitCommit size={16} /> Commit
            </button>
          </form>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <button onClick={() => triggerBackendMilestone("BUILD", "Production Build Completed")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
              <Hammer size={15} /> Trigger Build Milestone
            </button>
            <button onClick={() => triggerBackendMilestone("SPRINT_CAP", "50-Minute Continuous Sitting Cap")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#1e293b", border: "1px solid #334155", color: "#fbbf24", padding: "10px", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
              <Clock size={15} /> Trigger 50m Cap
            </button>
          </div>

          <div style={{ background: "#090d16", border: "1px solid #1e293b", borderRadius: 10, padding: 14, fontFamily: "monospace", fontSize: 12 }}>
            <div style={{ color: "#64748b", marginBottom: 8 }}>// Persisted Milestone & Recovery Log</div>
            {logs.length === 0 ? (
              <div style={{ color: "#64748b" }}>Waiting for Git commits or coding milestones...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} style={{ color: log.type === "RECOVERY_VERIFIED" ? "#4ade80" : "#38bdf8", marginBottom: 4 }}>
                  [{log.type}] {log.reason}
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 22 }}>
            <span style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Current Deep-Focus Sprint</span>
            <div style={{ fontSize: 42, fontWeight: 800, fontFamily: "monospace", margin: "8px 0", color: meetingMode ? "#f59e0b" : "#f8fafc" }}>
              {fmtTime(focusSeconds)} <span style={{ fontSize: 16, color: "#64748b" }}>/ 50:00</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: meetingMode ? "#fbbf24" : "#4ade80" }}>
              {meetingMode ? "Paused during active meeting/presentation" : "Deep flow protected — zero pop-up interruptions"}
            </p>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1e293b", borderRadius: 14, padding: 22 }}>
            <span style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Today's Verified Spine Resets</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <CheckCircle2 size={32} color="#22c55e" />
              <div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.totalBreaks} Breaks</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{Math.round(stats.totalSeconds / 60)} mins of verified spinal decompression</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}