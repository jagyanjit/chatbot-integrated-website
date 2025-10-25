// Force Node.js runtime
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // ===== ONLY CHECK FOR THE NEW VARIABLE =====
  const apiKey = process.env.TEST_KEY;

  console.log("=== FINAL DIAGNOSTIC ===");
  console.log("1. TEST_KEY exists:", !!apiKey);
  console.log("2. TEST_KEY length:", apiKey?.length || 0);
  console.log("========================");

  if (!apiKey) {
    console.error("❌ CRITICAL: TEST_KEY was not found in the environment!");
    return res.status(200).json({ 
      reply: "CONFIG ERROR: The TEST_KEY variable is missing!"
    });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free",
        messages: [{ role: "user", content: message }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      return res.status(200).json({ 
        reply: "API returned an error. Check logs."
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";
    return res.status(200).json({ reply });

  } catch (error) {
    console.error("❌ Catch Error:", error.message);
    return res.status(200).json({ 
      reply: "A server-side error occurred." 
    });
  }
}
