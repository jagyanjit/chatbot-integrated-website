// Force Node.js runtime for server-side environment variables
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // This prefix guarantees the variable is available in the Vercel function
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  // Crucial check to see if the key was loaded
  if (!apiKey) {
    console.error("❌ CRITICAL: NEXT_PUBLIC_OPENROUTER_API_KEY is missing from Vercel Environment Variables!");
    return res.status(200).json({ 
      reply: "CONFIG ERROR: The public API key variable is missing! Please check the Vercel settings."
    });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-2-9b-it:free", // Using a reliable free model
        messages: [{ role: "user", content: message }],
      }),
    });

    // Handle non-successful API responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error from OpenRouter:", response.status, errorText);
      return res.status(200).json({ reply: "The AI service returned an error. Please try again later." });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    
    console.log("✅ Success! Sending reply from AI.");
    return res.status(200).json({ reply: reply.trim() });

  } catch (error) {
    console.error("❌ Server-side catch block error:", error.message);
    return res.status(200).json({ reply: "A server-side error occurred. Please check the Vercel logs." });
  }
}
