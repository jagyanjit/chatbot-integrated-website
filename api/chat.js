export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.error("❌ No API key");
    return res.status(200).json({ 
      reply: "Configuration error - no API key!"
    });
  }

  console.log("✅ API Key exists");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://yourdomain.vercel.app",
        "X-Title": "Apprentice Chatbot"
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free", // FREE model
        messages: [
          {
            role: "system",
            content: "You are Apprentice, a helpful AI assistant. Keep responses concise and friendly."
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 150
      })
    });

    console.log("📡 Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error:", errorText);
      return res.status(200).json({ 
        reply: "I'm having trouble connecting. Try again! 🔄"
      });
    }

    const data = await response.json();
    console.log("✅ Response:", data);

    const reply = data?.choices?.[0]?.message?.content || "No response generated.";

    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    console.error("❌ Error:", error.message);
    return res.status(200).json({ 
      reply: "Something went wrong. Try again! 😅"
    });
  }
}
