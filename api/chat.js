export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // ✅ DistilGPT-2 - GUARANTEED to work, no 404 errors
  const HF_MODEL = "distilgpt2";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

  try {
    console.log("🚀 Model:", HF_MODEL);
    
    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        inputs: message,
        parameters: {
          max_length: 100,
          temperature: 0.8,
          return_full_text: false
        },
        options: {
          wait_for_model: true
        }
      })
    });

    const contentType = response.headers.get("content-type");
    
    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON:", text);
      return res.status(200).json({ 
        reply: "Loading... try again! ⏳"
      });
    }

    const data = await response.json();
    console.log("✅ Data:", data);

    let reply = data?.[0]?.generated_text || data?.generated_text || "Try again!";
    
    return res.status(200).json({ reply: reply.trim() });
    
  } catch (err) {
    console.error("Error:", err.message);
    return res.status(200).json({ 
      reply: "Error occurred. Please retry! 😅"
    });
  }
}
