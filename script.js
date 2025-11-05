// ========================
//  AI CHESS - script.js
// ========================

// Biến toàn cục
let gamePVP, boardPVP, gameAI, boardAI;
let darkMode = false;

document.addEventListener("DOMContentLoaded", () => {
  // Nút chế độ
  const pvpBtn = document.getElementById("pvpBtn");
  const botBtn = document.getElementById("botBtn");
  const pvpSection = document.getElementById("pvpSection");
  const botSection = document.getElementById("botSection");
  const themeToggle = document.getElementById("themeToggle");

  // Chuyển chế độ hiển thị
  pvpBtn.onclick = () => {
    pvpSection.style.display = "block";
    botSection.style.display = "none";
    pvpBtn.classList.add("active");
    botBtn.classList.remove("active");
  };
  botBtn.onclick = () => {
    pvpSection.style.display = "none";
    botSection.style.display = "block";
    botBtn.classList.add("active");
    pvpBtn.classList.remove("active");
  };

  // Dark / Light mode
  themeToggle.onclick = () => {
    darkMode = !darkMode;
    document.body.classList.toggle("dark", darkMode);
    themeToggle.textContent = darkMode ? "🌙" : "🌞";
  };

  // === BÀN CỜ NGƯỜI VS NGƯỜI ===
  gamePVP = new Chess();
  boardPVP = Chessboard("boardPVP", {
    draggable: true,
    position: "start",
    onDrop: (source, target) => {
      const move = gamePVP.move({ from: source, to: target, promotion: "q" });
      if (move === null) return "snapback";
    },
    onSnapEnd: () => {
      boardPVP.position(gamePVP.fen());
    },
    showNotation: true, // hiển thị ký hiệu hàng, cột
  });

  // === BÀN CỜ AI VS AI ===
  gameAI = new Chess();
  boardAI = Chessboard("boardAI", {
    draggable: false, // người không được chạm vào bàn AI
    position: "start",
    showNotation: true,
    pieceTheme: "https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png" // ảnh quân cờ
  });

  document.getElementById("startAI").onclick = runAIMatch;
});

// ===================================
//          LOGIC BOT VS BOT
// ===================================
async function runAIMatch() {
  const whiteModel = document.getElementById("whiteModel").value;
  const blackModel = document.getElementById("blackModel").value;
  const whiteKey = document.getElementById("whiteKey").value.trim();
  const blackKey = document.getElementById("blackKey").value.trim();

  if (!whiteKey || !blackKey) {
    alert("⚠️ Vui lòng nhập đủ API key cho cả hai bot!");
    return;
  }

  gameAI.reset();
  boardAI.start();
  alert("🤖 Trận đấu giữa hai AI bắt đầu!");

  // Bắt đầu lượt đi
  async function nextTurn() {
    if (gameAI.game_over()) {
      alert("🏁 Trận đấu kết thúc!");
      return;
    }

    const currentTurn = gameAI.turn();
    const currentModel = currentTurn === "w" ? whiteModel : blackModel;
    const currentKey = currentTurn === "w" ? whiteKey : blackKey;

    const move = await getAIMove(currentModel, currentKey, gameAI.fen());
    try {
      gameAI.move(move);
      boardAI.position(gameAI.fen());
    } catch (err) {
      console.error("Nước đi lỗi:", move, err);
    }

    setTimeout(nextTurn, 2000);
  }

  nextTurn();
}

// ===================================
//        HÀM GỌI API CHATGPT
// ===================================
async function getAIMove(model, apiKey, fen) {
  const prompt = `Bạn là một AI chơi cờ vua. Trạng thái bàn hiện tại (FEN): ${fen}.
Hãy chọn và trả về DUY NHẤT một nước đi hợp lệ theo dạng UCI (ví dụ: e2e4). 
Không giải thích, chỉ trả về nước đi.`;

  try {
    let url, body;

    // Nếu là ChatGPT hoặc Grok (dùng OpenAI API)
    if (model === "gpt-4o-mini" || model === "grok") {
      url = "https://api.openai.com/v1/chat/completions";
      body = {
        model: model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      const move = data.choices[0].message.content.trim();
      console.log(`[${model}] move:`, move);
      return move;
    }

    // Nếu là Gemini (mock hoặc backend riêng)
    if (model === "gemini") {
      // Hiện tại Gemini không xử lý FEN chuẩn, tạm thời random move
      return randomMove();
    }
  } catch (err) {
    console.error("Lỗi API:", err);
    return randomMove();
  }
}

// ===================================
//    BACKUP NẾU API TRẢ VỀ LỖI
// ===================================
function randomMove() {
  const moves = gameAI.moves();
  return moves[Math.floor(Math.random() * moves.length)];
}
