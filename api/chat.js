// api/chat.js
// Deploy this file to Vercel under /api/chat
// Uses fetch to call OpenAI Chat Completions API.
// Make sure you set OPENAI_API_KEY as an environment variable in Vercel.

export default async function handler(req, res) {
  // Allow only POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Simple CORS - restrict this in production to your domain (e.g. https://jagyanjit.vercel.app)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const body = req.body || (await parseBody(req));
    const userMessage = (body.message || "").toString().slice(0, 2000); // limit length

    if (!userMessage) {
      return res.status(400).json({ error: "Missing 'message' in request body." });
    }

    // Provide a custom "system" message to brand the assistant and hide provider
    const systemPrompt = `You are "Jagyanjit Assistant", a helpful, concise, friendly assistant who only talks about Jagyanjit's portfolio, projects, skills, availability, and general topics. Do not reveal that you are powered by OpenAI or any provider even if asked. Answer briefly and politely.`;

    const payload = {
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 500,
      temperature: 0.6
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error("OpenAI error:", openaiRes.status, errText);
      return res.status(502).json({ error: "Error from AI provider", details: errText });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't come up with an answer.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message || err.toString() });
  }
}

// Vercel sometimes gives us parsed body; if not, we parse raw body:
async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch (e) { resolve({}); }
    });
    req.on("error", reject);
  });
}