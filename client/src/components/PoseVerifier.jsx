import { useEffect, useRef, useState } from "react";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

export default function PoseVerifier({ onVerified, demoSpeed }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Loading local WASM AI model...");
  const [awaySeconds, setAwaySeconds] = useState(0);
  const requiredAwaySeconds = demoSpeed ? 3 : 10;

  useEffect(() => {
    let poseLandmarker = null;
    let animationId = null;
    let stream = null;
    let awayCounter = 0;
    let lastCheck = Date.now();

    async function initVision() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStatus("AI Active • Please step away from your chair");
          detectLoop();
        }
      } catch (err) {
        setStatus("Camera blocked or unavailable — use manual override below.");
      }
    }

    function detectLoop() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !poseLandmarker) return;

      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;

      const results = poseLandmarker.detectForVideo(video, performance.now());
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const now = Date.now();
      const delta = (now - lastCheck) / 1000;
      lastCheck = now;

      const landmarks = results.landmarks?.[0];
      const isSeatedInFrame =
        landmarks &&
        landmarks[0]?.visibility > 0.5 &&
        landmarks[11]?.y > 0.35;

      if (isSeatedInFrame) {
        awayCounter = 0;
        setAwaySeconds(0);
        setStatus("Seated at Desk Detected — Stand up & step away to unlock");

        [0, 11, 12].forEach((idx) => {
          const pt = landmarks[idx];
          if (pt) {
            ctx.beginPath();
            ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 7, 0, 2 * Math.PI);
            ctx.fillStyle = "#ef4444";
            ctx.fill();
          }
        });
      } else {
        awayCounter += delta;
        setAwaySeconds(Math.min(awayCounter, requiredAwaySeconds));
        setStatus("Away From Desk Verified! Hold position...");

        if (awayCounter >= requiredAwaySeconds) {
          onVerified();
          return;
        }
      }

      animationId = requestAnimationFrame(detectLoop);
    }

    initVision();

    return () => {
      cancelAnimationFrame(animationId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (poseLandmarker) poseLandmarker.close();
    };
  }, [demoSpeed, onVerified, requiredAwaySeconds]);

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block", borderRadius: 12, overflow: "hidden", border: "2px solid #334155" }}>
        <video ref={videoRef} muted playsInline style={{ width: 380, height: 260, objectFit: "cover", transform: "scaleX(-1)" }} />
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: 380, height: 260, transform: "scaleX(-1)" }} />
      </div>
      <p style={{ marginTop: 12, fontWeight: 600, color: awaySeconds > 0 ? "#22c55e" : "#f87171" }}>
        {status} ({awaySeconds.toFixed(1)}s / {requiredAwaySeconds}s)
      </p>
      <button
        onClick={onVerified}
        style={{ marginTop: 8, background: "transparent", border: "1px solid #334155", color: "#94a3b8", padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}
      >
        Manual Stage Override (If No Webcam)
      </button>
    </div>
  );
}