export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    // Replace with any HF model that works with Router API
    const HF_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
    const HF_URL = `https://router.huggingface.co/hf-inference/${HF_MODEL}`;

    const response = await fetch(HF_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: message })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(502).json({ error: "Error from HF provider", details: errText });
    }

    const data = await response.json();
    const reply = data.generated_text || "Sorry, I couldn't generate a reply.";

    res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
