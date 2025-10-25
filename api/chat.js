export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // ✅ TinyLlama - Fast, free, no gating, great for chat
  const HF_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  try {
    console.log("🚀 Sending to:", HF_URL);
    
    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        inputs: message,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        },
        options: {
          wait_for_model: true
        }
      })
    });

    console.log("📡 Status:", response.status);
    
    const data = await response.json();
    console.log("✅ Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("❌ Error:", data);
      return res.status(200).json({ 
        reply: "I'm warming up... try again in a moment! 🔄"
      });
    }

    let reply;
    
    if (Array.isArray(data) && data.length > 0) {
      reply = data[0]?.generated_text || "No response generated.";
    } else if (data?.generated_text) {
      reply = data.generated_text;
    } else {
      reply = "I couldn't generate a response. Try rephrasing?";
    }

    // Clean up response
    reply = reply.trim();

    return res.status(200).json({ reply });
    
  } catch (err) {
    console.error("❌ Error:", err);
    return res.status(200).json({ 
      reply: "Oops! Something went wrong. Try again! 😅"
    });
  }
}
