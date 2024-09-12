const express = require('express');
const { Server } = require('socket.io');
const { Server: httpServer } = require('http');
const { Chess } = require('chess.js');
const path = require('path');

const PORT = 3000;
const app = express();
const server = new httpServer(app);
const io = new Server(server);
let chess = new Chess();

let players = {};

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    console.log('connected');

    // Assign user role
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("SpectatorRole");
    }

    // Send current board state to the newly connected player
    socket.emit("boardState", chess.fen());

    // Handle disconnection
    socket.on("disconnect", () => {
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        }
    });

    // Handle the chess move
    socket.on('move', (move) => {
        try {
            if (chess.turn() === 'w' && socket.id !== players.white) return;
            if (chess.turn() === 'b' && socket.id !== players.black) return;
            let result = chess.move(move);
            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid Move: ", move);
                socket.emit("invalidMove", move);
            }
        } catch (err) {
            console.log("Error: ", err);
            socket.emit("error", err);
        }
    });

    // Handle game reset
    socket.on('resetGame', () => {
        chess.reset();
        io.emit("boardState", chess.fen());
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
