// api/chat.js - Hugging Face version
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};
    const userMessage = (body.message || "").toString().slice(0, 500);

    if (!userMessage) {
      return res.status(400).json({ error: "Missing 'message' in request body." });
    }

    // Hugging Face text-generation model
    const model = "gpt2"; // small free model, good for testing

    const apiRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: userMessage, options: { wait_for_model: true } })
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error("HF API error:", text);
      return res.status(502).json({ error: "Error from HF provider" });
    }

    const data = await apiRes.json();
    const reply = data?.[0]?.generated_text || "Sorry, I couldn't come up with an answer.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
