export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  // ✅ Using GPT-2 - most stable option
  const url = "https://api-inference.huggingface.co/models/gpt2";
  const apiKey = process.env.HF_API_KEY;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: message,
        parameters: {
          max_new_tokens: 50,
          return_full_text: false,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("API Error:", error);
      return res.status(200).json({ 
        reply: "The AI is thinking... try again in a moment! 🤔"
      });
    }

    const data = await response.json();
    const reply = data?.[0]?.generated_text || "Could not generate response.";
    
    return res.status(200).json({ reply: reply.trim() });
    
  } catch (error) {
    console.error("Error:", error);
    return res.status(200).json({ 
      reply: "Something went wrong. Please try again! 😅"
    });
  }
}
