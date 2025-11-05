const game = new Chess();
let board = null;
let mode = '';
let playerSide = 'white';
let aiConfig = { pvb: {}, white: {}, black: {} };

// DÙNG MERIDA SVG LOCAL
const PIECE_THEME = piece => `assets/pieces/${piece}.svg`;

function setMode(m) {
  mode = m;
  $('.mode').addClass('hidden');
  $(`#${m}`).removeClass('hidden');
  resetGame();
  initBoard(m === 'pvb' ? playerSide : 'white');
}

function initBoard(orientation = 'white') {
  if (board) board.destroy();
  board = Chessboard('board', {
    draggable: true,
    position: 'start',
    orientation: orientation,
    pieceTheme: PIECE_THEME,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  });
  updateStatus();
}

function onDragStart(source, piece) {
  if (game.game_over()) return false;
  if (mode === 'pvp') {
    return (game.turn() === 'w' && piece.search(/^b/) === -1) ||
           (game.turn() === 'b' && piece.search(/^w/) === -1);
  }
  if (mode === 'pvb') {
    const isPlayerTurn = (playerSide === 'white' && game.turn() === 'w') ||
                         (playerSide === 'black' && game.turn() === 'b');
    return isPlayerTurn && 
           ((game.turn() === 'w' && piece.search(/^b/) === -1) ||
            (game.turn() === 'b' && piece.search(/^w/) === -1));
  }
  return false;
}

function onDrop(source, target) {
  const move = game.move({ from: source, to: target, promotion: 'q' });
  if (!move) return 'snapback';
  board.position(game.fen());
  updateStatus();

  if (!game.game_over()) {
    if (mode === 'pvb' && isBotTurn()) {
      setTimeout(botMove, 800);
    } else if (mode === 'bvb') {
      setTimeout(botVsBotMove, 1000);
    }
  }
}

function onSnapEnd() { board.position(game.fen()); }

function updateStatus() {
  let status = '';
  if (game.in_checkmate()) {
    status = `Chiếu hết! ${(game.turn() === 'w' ? 'Đen' : 'Trắng')} thắng!`;
  } else if (game.in_draw()) {
    status = 'Hòa!';
  } else if (game.in_check()) {
    status = `Chiếu! Lượt: ${(game.turn() === 'w' ? 'Trắng' : 'Đen')}`;
  } else {
    status = `Lượt: ${(game.turn() === 'w' ? 'Trắng' : 'Đen')}`;
  }
  $('#status').text(status);
}

function resetGame() {
  game.reset();
  if (board) board.position('start');
  updateStatus();
}

// === AI Logic ===
function toggleApi(side) {
  const ai = $(`#${side}-ai`).val();
  $(`#${side}-api`).toggleClass('hidden', !ai);
}

function lockApi(side) {
  const ai = $(`#${side}-ai`).val();
  const key = $(`#${side}-key`).val().trim();
  if (!ai || !key) return alert('Vui lòng chọn AI và nhập key!');
  aiConfig[side] = { ai, key };
  $(`#${side}-api`).addClass('hidden');
  $(`#${side}-key, #${side}-ai`).prop('disabled', true);
  $(`#${side}-locked`).removeClass('hidden');
  if (mode === 'bvb' && aiConfig.white.ai && aiConfig.black.ai) {
    $('#start-bvb').removeClass('hidden');
  }
}

function setPlayerSide(side) {
  playerSide = side;
  $('.btn-side').removeClass('active');
  $(`.btn-side[data-side="${side}"]`).addClass('active');
  initBoard(side);
}

function isBotTurn() {
  return (playerSide === 'white' && game.turn() === 'b') ||
         (playerSide === 'black' && game.turn() === 'w');
}

async function getMoveFromAI(fen, aiType, apiKey) {
  const prompt = `Bạn là kỳ thủ cờ vua. Hãy trả về nước đi tốt nhất theo định dạng SAN (ví dụ: e4, Nf3, O-O). Chỉ trả về 1 nước đi. FEN: ${fen}`;
  try {
    let url, body, headers = { 'Content-Type': 'application/json' };
    if (aiType === 'openai') {
      url = 'https://api.openai.com/v1/chat/completions';
      body = JSON.stringify({ model: 'gpt-3.5-turbo', messages: [{ role: 'user', content: prompt }], max_tokens: 10 });
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (aiType === 'grok') {
      url = 'https://api.x.ai/v1/chat/completions';
      body = JSON.stringify({ model: 'grok-beta', messages: [{ role: 'user', content: prompt }] });
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (aiType === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      body = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
    }

    const res = await fetch(url, { method: 'POST', headers, body });
    const data = await res.json();
    let text = '';
    if (aiType === 'openai') text = data.choices[0].message.content;
    else if (aiType === 'grok') text = data.choices[0].message.content;
    else if (aiType === 'gemini') text = data.candidates[0].content.parts[0].text;

    const san = text.trim().split('\n')[0].replace(/[^a-zA-Z0-9+#=]/g, '');
    const move = game.move(san, { sloppy: true });
    return move;
  } catch (err) {
    console.error(err);
    alert('Lỗi gọi AI. Kiểm tra key và mạng!');
    return null;
  }
}

async function botMove() {
  if (game.game_over()) return;
  const move = await getMoveFromAI(game.fen(), aiConfig.pvb.ai, aiConfig.pvb.key);
  if (move) {
    game.move(move);
    board.position(game.fen());
    updateStatus();
  }
}

function startBvB() {
  resetGame();
  botVsBotMove();
}

async function botVsBotMove() {
  if (game.game_over()) return;
  const turn = game.turn();
  const config = turn === 'w' ? aiConfig.white : aiConfig.black;
  const move = await getMoveFromAI(game.fen(), config.ai, config.key);
  if (move) {
    game.move(move);
    board.position(game.fen());
    updateStatus();
    setTimeout(botVsBotMove, 1200);
  }
}
