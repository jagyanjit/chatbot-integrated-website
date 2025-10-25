// Force Node runtime (not Edge) so env vars are available at runtime
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Basic CORS for safety (same-origin calls will still work)
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-openrouter-key");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, apiKey: apiKeyFromBody } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Try all possible sources for the key (env first, then header/body for debugging)
    let apiKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ||
      req.headers["x-openrouter-key"] ||
      apiKeyFromBody;

    // Normalize (trim) but do not log the value
    apiKey = typeof apiKey === "string" ? apiKey.trim() : apiKey;

    const keySource = apiKey
      ? (process.env.OPENROUTER_API_KEY ? "env:OPENROUTER_API_KEY"
        : process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? "env:NEXT_PUBLIC_OPENROUTER_API_KEY"
        : req.headers["x-openrouter-key"] ? "header:x-openrouter-key"
        : apiKeyFromBody ? "body.apiKey"
        : "none")
      : "none";

    console.log("OpenRouter key source:", keySource);
    console.log("Runtime:", process.env.VERCEL ? "Vercel" : "Local", "| VERCEL_ENV:", process.env.VERCEL_ENV || "unknown");

    if (!apiKey) {
      console.error("No API key available at runtime.");
      return res.status(200).json({
        reply: "Server has no API key. For a quick test, send it in header 'x-openrouter-key' (temporary).",
      });
    }

    const referer =
      (req.headers.origin && String(req.headers.origin)) ||
      process.env.SITE_URL ||
      "https://chatbot-integrated-website.vercel.app";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "Apprentice Chatbot",
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free",
        messages: [
          { role: "system", content: "You are Apprentice, a helpful, concise AI assistant." },
          { role: "user", content: message },
        ],
        max_tokens: 180,
      }),
    });

    const text = await response.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response
    }

    if (!response.ok) {
      console.error("OpenRouter API error:", response.status, text?.slice(0, 300));
      return res.status(200).json({
        reply: "I'm having trouble connecting to the AI right now. Please try again in a moment. 🔄",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate a response. Please try again.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(200).json({
      reply: "Oops, something went wrong on the server. Please try again. 😅",
    });
  }
}
