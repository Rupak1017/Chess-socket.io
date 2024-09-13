const socket = io();
const chess = new Chess();
const boardElement = document.querySelector('.chessboard');
const playerRoleElement = document.getElementById('playerRole');
const resetButton = document.getElementById('resetButton');

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

    playerRoleElement.textContent = playerRole ? `${playerRole === 'w' ? "Player 1 (White)" : "Player 2 (Black)"} - ${currentTurn === playerRole ? "Your turn" : "Opponent's turn"}` : "Waiting for role...";
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

resetButton.addEventListener('click', () => {
    socket.emit('resetGame');
    chess.reset();
    currentTurn = 'w'; // Reset turn to white
    renderBoard();
});

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    currentTurn = chess.turn(); // Update turn
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    currentTurn = chess.turn(); // Update turn
    renderBoard();
});

socket.on("invalidMove", (move) => {
    alert(`Invalid move: ${JSON.stringify(move)}`);
});

socket.on("error", (err) => {
    alert(`Error: ${err}`);
});

socket.on('disconnectAll', () => {
    alert('The game has been reset and all users have been disconnected.');
    window.location.reload(); // Reload the page
});

