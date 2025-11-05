// 🔥 Hàm chính: gọi AI tương ứng để lấy nước đi
async function getAIMove(model, apiKey, fen) {
  // Prompt gửi cho AI
  const prompt = `FEN: ${fen}\nTrả về duy nhất 1 nước đi hợp lệ dạng UCI (ví dụ: e2e4).`;

  // Tùy chọn model tương ứng
  switch (model.toLowerCase()) {

    // 🧠 OpenAI ChatGPT
    case "chatgpt":
    case "gpt-4o":
    case "gpt-4o-mini":
      return await callOpenAI(apiKey, prompt);

    // 🤖 Grok (x.ai)
    case "grok":
      return await callGrok(apiKey, prompt);

    // 🌟 Gemini (Google)
    case "gemini":
      return await callGemini(apiKey, prompt);

    default:
      console.error("❌ Model không được hỗ trợ:", model);
      return null;
  }
}

/* ========================
      CALLBACK CỤ THỂ
   ======================== */

// 🧠 ChatGPT (OpenAI)
async function callOpenAI(apiKey, prompt) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Bạn là AI chơi cờ vua chuyên nghiệp." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        stream: false
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("Lỗi OpenAI:", err);
    return null;
  }
}

// 🤖 Grok (x.ai)
async function callGrok(apiKey, prompt) {
  try {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4-latest",
        messages: [
          { role: "system", content: "Bạn là AI chơi cờ vua chuyên nghiệp." },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        stream: false
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("Lỗi Grok:", err);
    return null;
  }
}

// 🌟 Gemini (Google)
async function callGemini(apiKey, prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.error("Lỗi Gemini:", err);
    return null;
  }
}
