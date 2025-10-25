export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  const HF_MODEL = "meta-llama/Llama-3.2-3B-Instruct";
  const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    let lastError = null;

    // Retry logic for model loading
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`🚀 Attempt ${attempt}/${MAX_RETRIES} - Sending to:`, HF_URL);
      
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

      console.log(`📡 Response status:`, response.status);

      if (!response.ok) {
        const errText = await response.text();
        lastError = errText;
        
        console.error(`❌ Attempt ${attempt} failed:`, response.status, errText);
        
        // Check if it's a loading error
        if (errText.includes("loading") || errText.includes("currently loading") || response.status === 503) {
          if (attempt < MAX_RETRIES) {
            console.log(`⏳ Model loading... waiting ${RETRY_DELAY}ms before retry`);
            await wait(RETRY_DELAY);
            continue; // Try again
          }
        }
        
        // If it's not a loading error or we're out of retries
        return res.status(200).json({ 
          reply: "I'm having trouble connecting right now. Please try again in a moment! 🔄"
        });
      }

      // Success! Parse the response
      const data = await response.json();
      console.log("✅ HF Response:", JSON.stringify(data, null, 2));
      
      let reply;
      
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

      // Clean up the reply
      if (reply.includes(message)) {
        reply = reply.replace(message, '').trim();
      }

      return res.status(200).json({ reply });
    }

    // If we exhausted all retries
    return res.status(200).json({ 
      reply: "The AI model is starting up. Please try again in 10 seconds! ⏳"
    });
    
  } catch (err) {
    console.error("❌ Server error:", err.message);
    return res.status(200).json({ 
      reply: "Something went wrong on my end. Please try again! 😅"
    });
  }
}
