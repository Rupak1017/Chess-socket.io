const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
const playerRoleElement = document.getElementById('playerRole'); // Added
const resetButton = document.getElementById('resetButton'); // Reset button element

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;
let currentTurn = 'w'; // Track the current turn ('w' for white, 'b' for black)

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement('div');
            squareElement.classList.add('square',
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;
            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add("piece", (square.color === "w" ? "white" : "black"));
                pieceElement.innerHTML = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color && currentTurn === square.color;

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };

                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }

    // Update player role display
    playerRoleElement.textContent = playerRole === 'w' ? "Player 1 (White)" : playerRole === 'b' ? "Player 2 (Black)" : "Waiting for role...";

    // Update whose turn it is
    if (playerRole) {
        playerRoleElement.textContent += ` - ${currentTurn === playerRole ? "Your turn" : `Opponent's turn`}`;
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };

    socket.emit('move', move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♙",
        r: "♖",
        n: "♘",
        b: "♝",
        q: "♕",
        k: "♔",
        P: "♟",
        R: "♜",
        N: "♞",
        B: "♝",
        Q: "♛",
        K: "♚",
    };

    return unicodePieces[piece.color === "w" ? piece.type.toLowerCase() : piece.type.toUpperCase()] || "";
};

// Reset game when reset button is clicked
resetButton.addEventListener('click', () => {
    socket.emit('resetGame');
    chess.reset();
    currentTurn = 'w'; // Reset turn to white
    renderBoard();
});

// Handle player role
socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

// Handle board state update
socket.on("boardState", (fen) => {
    chess.load(fen);
    currentTurn = chess.turn(); // Update turn
    renderBoard();
});

// Handle moves
socket.on("move", (move) => {
    chess.move(move);
    currentTurn = chess.turn(); // Update turn
    renderBoard();
});

// Handle invalid move
socket.on("invalidMove", (move) => {
    alert(`Invalid move: ${JSON.stringify(move)}`);
});

// Handle errors
socket.on("error", (err) => {
    alert(`Error: ${err}`);
});
