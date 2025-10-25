export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // ✅ CORRECT MODEL NAME - Copy this EXACTLY
  const HF_MODEL = "TinyLlama/TinyLlama-1.1B-Chat-v1.0";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  try {
    console.log("🚀 Requesting:", HF_URL);
    
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

    // ✅ FIX: Check content type before parsing JSON
    const contentType = response.headers.get("content-type");
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", response.status, errorText);
      return res.status(200).json({ 
        reply: "I'm waking up! Please try again in 5 seconds. 🔄"
      });
    }

    // ✅ FIX: Only parse JSON if it's actually JSON
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", text);
      return res.status(200).json({ 
        reply: "Model is loading... try again in a moment! ⏳"
      });
    }

    const data = await response.json();
    console.log("✅ Response:", JSON.stringify(data, null, 2));

    let reply;
    
    if (Array.isArray(data) && data.length > 0) {
      reply = data[0]?.generated_text || "No response generated.";
    } else if (data?.generated_text) {
      reply = data.generated_text;
    } else {
      console.error("❌ Unexpected format:", data);
      reply = "I couldn't generate a response. Try again?";
    }

    reply = reply.trim();
    
    return res.status(200).json({ reply });
    
  } catch (err) {
    console.error("❌ Catch Error:", err.message);
    return res.status(200).json({ 
      reply: "Oops! Something went wrong. Try again! 😅"
    });
  }
}
