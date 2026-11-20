import { useEffect, useState } from "react";
import { ShieldCheck, Footprints } from "lucide-react";
import PoseVerifier from "./PoseVerifier";

export default function RecoveryLock({ reason, onUnlock }) {
  const [demoSpeed, setDemoSpeed] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [awayVerified, setAwayVerified] = useState(false);

  useEffect(() => {
    setSecondsLeft(demoSpeed ? 5 : 300);
  }, [demoSpeed]);

  useEffect(() => {
    if (!awayVerified) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onUnlock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [awayVerified, onUnlock]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(9, 13, 22, 0.94)", backdropFilter: "blur(14px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      color: "#f8fafc", padding: 24
    }}>
      <div style={{ maxWidth: 520, width: "100%", background: "#111827", border: "1px solid #1e293b", borderRadius: 16, padding: 28, textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#1e293b", padding: "6px 14px", borderRadius: 99, fontSize: 13, color: "#38bdf8", marginBottom: 12 }}>
          <Footprints size={16} /> Triggered by: {reason}
        </div>

        <h2 style={{ fontSize: 26, margin: "8px 0" }}>5-Minute Spine Decompression Break</h2>
        <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>
          Step away from your chair, walk around, and let your lower back decompress. Workspace unlocks automatically after verification.
        </p>

        <div style={{ fontSize: 44, fontWeight: 800, fontFamily: "monospace", color: awayVerified ? "#22c55e" : "#facc15", marginBottom: 16 }}>
          {mins}:{secs}
        </div>

        {!awayVerified ? (
          <PoseVerifier demoSpeed={demoSpeed} onVerified={() => setAwayVerified(true)} />
        ) : (
          <div style={{ padding: 20, background: "#052e16", border: "1px solid #166534", borderRadius: 12, color: "#4ade80" }}>
            <ShieldCheck size={32} style={{ margin: "0 auto 8px" }} />
            <strong>Away-From-Desk Verified!</strong>
            <p style={{ fontSize: 13, marginTop: 4 }}>Enjoy your reset. Unlocking workspace when timer finishes...</p>
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#64748b" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={demoSpeed} onChange={(e) => setDemoSpeed(e.target.checked)} />
            Hackathon Stage Speed (5s Timer)
          </label>
          <span>100% Local WASM • 0 Frames Uploaded</span>
        </div>
      </div>
    </div>
  );
}