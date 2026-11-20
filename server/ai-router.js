// server/ai-router.js
export async function generateErgonomicCoaching({
  provider = "auto",
  triggerReason = "50m Sitting Cap",
  focusMinutes = 50,
  breaksToday = 0,
}) {
  const prompt = `You are a developer ergonomics specialist. A software engineer just completed ${focusMinutes}m of coding (trigger: ${triggerReason}, breaks today: ${breaksToday}). Return ONLY valid JSON: {"providerUsed":"<name>","summary":"<1-sentence fatigue insight>","stretches":["<stretch 1>","<stretch 2>","<stretch 3>"]}`;

  // 1. Gemini (Google AI Studio Free Tier)
  if ((provider === "gemini" || provider === "auto") && process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return { ...JSON.parse(text), providerUsed: "Gemini 2.5 Flash (Free Tier)" };
      }
    } catch {}
  }

  // 2. Mistral (Mistral Studio Free Tier)
  if ((provider === "mistral" || provider === "auto") && process.env.MISTRAL_API_KEY) {
    try {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistral-small-latest",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...JSON.parse(data.choices[0].message.content), providerUsed: "Mistral Small (Free Tier)" };
      }
    } catch {}
  }

  // 3. Llama (Groq Free Tier — Ultra-Low Latency)
  if ((provider === "llama" || provider === "auto") && process.env.GROQ_API_KEY) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...JSON.parse(data.choices[0].message.content), providerUsed: "Llama 3.3 70B (Groq Free)" };
      }
    } catch {}
  }

  // 4. Qwen & 5. DeepSeek (OpenRouter :free Tier)
  if ((provider === "qwen" || provider === "deepseek" || provider === "auto") && process.env.OPENROUTER_API_KEY) {
    const isDeepSeek = provider === "deepseek";
    const modelId = isDeepSeek ? "deepseek/deepseek-r1:free" : "qwen/qwen-2.5-72b-instruct:free";
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.replace(/```json|```/g, "").trim();
        if (raw) {
          return {
            ...JSON.parse(raw),
            providerUsed: isDeepSeek ? "DeepSeek R1 (OpenRouter Free)" : "Qwen 2.5 72B (OpenRouter Free)",
          };
        }
      }
    } catch {}
  }

  // 6. Zero-Cost Deterministic Fallback (Always works offline & on Vercel)
  return {
    providerUsed: "Local Deterministic Engine ($0)",
    summary: `After ${focusMinutes}m of deep focus (${triggerReason}), decompress lumbar discs and reset shoulder posture.`,
    stretches: [
      "Standing Thoracic Extension: Clasp hands behind head, gently arch upper back for 30s.",
      "Hip Flexor Lunge Stretch: Step one foot back, tuck pelvis, hold 45s per side.",
      "Chin Tucks & Neck Release: Pull chin straight back for 10 reps to undo monitor forward-head posture.",
    ],
  };
}