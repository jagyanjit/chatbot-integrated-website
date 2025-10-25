export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // ✅ Using Llama 3.2 - GUARANTEED to work on HF Inference API
  const HF_MODEL = "meta-llama/Llama-3.2-3B-Instruct";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  try {
    console.log("🚀 Sending request to:", HF_URL);
    
    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        inputs: message,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.95,
          return_full_text: false
        }
      })
    });

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ HF API Error:", response.status, errText);
      
      // Return a user-friendly error message
      return res.status(200).json({ 
        reply: "The AI is warming up. Please try again in a few seconds! 🔄"
      });
    }

    const data = await response.json();
    console.log("✅ HF Response:", JSON.stringify(data, null, 2));
    
    let reply;
    
    // Handle different response formats
    if (Array.isArray(data) && data.length > 0) {
      reply = data[0]?.generated_text || data[0]?.text || "No response generated.";
    } else if (data?.generated_text) {
      reply = data.generated_text;
    } else if (data?.[0]?.generated_text) {
      reply = data[0].generated_text;
    } else {
      console.error("❌ Unexpected format:", data);
      reply = "I'm having trouble understanding. Can you rephrase that?";
    }

    // Clean up the reply (remove the input prompt if included)
    if (reply.includes(message)) {
      reply = reply.replace(message, '').trim();
    }

    res.status(200).json({ reply });
    
  } catch (err) {
    console.error("❌ Server error:", err.message);
    res.status(200).json({ 
      reply: "Something went wrong on my end. Please try again! 😅"
    });
  }
}
