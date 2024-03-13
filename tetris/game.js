const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startButton = document.getElementById('start-button');
const gameOverMessage = document.getElementById('game-over-message');

// Game constants
const ROWS = 20;
const COLS = 12;
const BLOCK_SIZE = 20;
const LINE_CLEAR_POINTS = 100;
const FALL_SPEED = 200; // Adjust this value to control the falling speed (in milliseconds)
const FAST_FALL_SPEED = 50; // Adjust this value to control the fast falling speed when down arrow is pressed (in milliseconds)


// Game state
let board = [];
let piece = null;
let isGameOver = false;
let isPlaying = false;
let score = 0;
let lastTime = 0;
let fallInterval = null;
let fastFall = false;



// Tetromino shapes
const shapes = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0]
  ],
  [
    [1, 1],
    [1, 1]
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ]
];

// Helper functions
function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (board[row][col]) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }

  if (piece) {
    drawPiece(piece.shape, piece.x, piece.y);
  }
}

function drawPiece(shape, x, y) {
  ctx.fillStyle = 'red';
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        ctx.fillRect((x + col) * BLOCK_SIZE, (y + row) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
}

function resetBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function randomPiece() {
  const randomIndex = Math.floor(Math.random() * shapes.length);
  return {
    shape: shapes[randomIndex],
    x: 3,
    y: 0
  };
}

function movePiece(direction) {
  if (!piece) return;

  const newX = piece.x + (direction === 'left' ? -1 : direction === 'right' ? 1 : 0);
  const newY = piece.y + (direction === 'down' ? 1 : 0);

  if (canMove(piece.shape, newX, newY)) {
    piece.x = newX;
    piece.y = newY;
  } else if (direction === 'down') {
    placePiece();
    clearLines();
    if (!isGameOver) {
      piece = randomPiece();
    }
  }

  drawBoard();
}

function canMove(shape, x, y) {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const newX = x + col;
        const newY = y + row;

        if (
          newX < 0 ||
          newX + 1 > COLS || // Check if the rightmost part of the piece is out of bounds
          newY >= ROWS ||
          (newY >= 0 && board[newY][newX])
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

function placePiece() {
  if (!piece) return;

  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      if (piece.shape[row][col]) {
        board[piece.y + row][piece.x + col] = 1;
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  for (let row = ROWS - 1; row >= 0; row--) {
    let isFull = true;
    for (let col = 0; col < COLS; col++) {
      if (!board[row][col]) {
        isFull = false;
        break;
      }
    }

    if (isFull) {
      linesCleared++;
      for (let r = row; r > 0; r--) {
        for (let c = 0; c < COLS; c++) {
          board[r][c] = board[r - 1][c];
        }
      }
      for (let c = 0; c < COLS; c++) {
        board[0][c] = 0;
      }
    }
  }

  score += linesCleared * LINE_CLEAR_POINTS;
  scoreDisplay.textContent = `Score: ${score}`;
}

function rotatePiece() {
  if (!piece) return;

  const newShape = Array.from({ length: piece.shape[0].length }, () =>
    Array(piece.shape.length).fill(0)
  );

  for (let row = 0; row < piece.shape.length; row++) {
    for (let col = 0; col < piece.shape[row].length; col++) {
      newShape[col][piece.shape.length - 1 - row] = piece.shape[row][col];
    }
  }

  if (canMove(newShape, piece.x, piece.y)) {
    piece.shape = newShape;
  }

  drawBoard();
}

function isGameOverCheck() {
  for (let col = 0; col < COLS; col++) {
    if (board[0][col]) {
      isGameOver = true;
      gameOverMessage.classList.remove('hidden');
      break;
    }
  }
}

document.addEventListener('keyup', (event) => {
  if (event.code === 'ArrowDown') {
    fastFall = false;
  }
});


// Event listeners
document.addEventListener('keydown', (event) => {
  if (!isPlaying) return;

  switch (event.code) {
    case 'ArrowLeft':
      movePiece('left');
      break;
    case 'ArrowRight':
      movePiece('right');
      break;
    case 'ArrowDown':
      fastFall = true;
      break;
    case 'ArrowUp':
      rotatePiece();
      break;
  }
});

startButton.addEventListener('click', () => {
  if (isPlaying) {
    isPlaying = false;
    startButton.textContent = 'Start';
    gameOverMessage.classList.add('hidden');
    clearInterval(fallInterval);
  } else {
    isPlaying = true;
    startButton.textContent = 'Pause';
    isGameOver = false;
    score = 0;
    scoreDisplay.textContent = `Score: ${score}`;
    resetBoard();
    piece = randomPiece();
    drawBoard();
    lastTime = performance.now();
    fallInterval = setInterval(gameLoop, FALL_SPEED);
    fastFall = false;
  }
});

// Game loop
function gameLoop() {
  if (!isPlaying) return;

  const currentTime = performance.now();
  const deltaTime = currentTime - lastTime;
  const fallSpeed = fastFall ? FAST_FALL_SPEED : FALL_SPEED;

  if (deltaTime >= fallSpeed) {
    movePiece('down');
    isGameOverCheck();
    lastTime = currentTime;
  }

  if (!isGameOver) {
    requestAnimationFrame(gameLoop);
  } else {
    clearInterval(fallInterval);
  }
}


// Start the game
resetBoard();
piece = randomPiece();
drawBoard();