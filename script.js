let gamePVP, boardPVP, gameAI, boardAI;
let darkMode = false;

document.addEventListener("DOMContentLoaded", () => {
  // Chế độ hiển thị
  const pvpBtn = document.getElementById("pvpBtn");
  const botBtn = document.getElementById("botBtn");
  const pvpSection = document.getElementById("pvpSection");
  const botSection = document.getElementById("botSection");

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
  const themeToggle = document.getElementById("themeToggle");
  themeToggle.onclick = () => {
    darkMode = !darkMode;
    document.body.classList.toggle("dark", darkMode);
    themeToggle.textContent = darkMode ? "🌙" : "🌞";
  };

  // Bàn cờ người vs người
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
  });

  // Bàn cờ AI
  gameAI = new Chess();
  boardAI = Chessboard("boardAI", {
    draggable: false,
    position: "start",
  });

  document.getElementById("startAI").onclick = runAIMatch;
});

// === Logic Bot đấu Bot (demo random) ===
async function runAIMatch() {
  gameAI.reset();
  boardAI.start();
  alert("Trận AI vs AI bắt đầu!");

  async function makeMove() {
    if (gameAI.game_over()) {
      alert("Trận đấu kết thúc!");
      return;
    }

    // Nước đi ngẫu nhiên
    const moves = gameAI.moves();
    const move = moves[Math.floor(Math.random() * moves.length)];
    gameAI.move(move);
    boardAI.position(gameAI.fen());

    setTimeout(makeMove, 800);
  }
  makeMove();
}
