export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // 🔥 Using newest Qwen model
  const HF_MODEL = "Qwen/Qwen2.5-7B-Instruct";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  try {
    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        inputs: message,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("HF API Error:", errText);
      return res.status(502).json({ 
        error: "Error from HF provider", 
        details: errText 
      });
    }

    const data = await response.json();
    console.log("HF Response:", data);
    
    let reply;
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (data?.generated_text) {
      reply = data.generated_text;
    } else {
      reply = "Sorry, I couldn't generate a reply.";
    }

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ 
      error: "Server error", 
      details: err.message 
    });
  }
}
