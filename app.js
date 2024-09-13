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
let spectators = [];
let matchPairs = {}; // Store pairs of spectators

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
});

// Route to disconnect all clients immediately
app.get('/disconnect-all', (req, res) => {
    io.emit('disconnectAll'); // Broadcast disconnect event
    io.sockets.sockets.forEach(socket => {
        socket.disconnect(true); // Forcefully disconnect each socket
    });
    res.send('All clients have been forcibly disconnected');
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
        // Handle spectators
        spectators.push(socket.id);

        // Matchmaking
        if (spectators.length % 2 === 0) {
            // Pair up spectators
            const spectator1 = spectators[spectators.length - 2];
            const spectator2 = spectators[spectators.length - 1];
            matchPairs[spectator1] = spectator2;
            matchPairs[spectator2] = spectator1;

            io.to(spectator1).emit("playerRole", "spectator");
            io.to(spectator2).emit("playerRole", "spectator");
            io.to(spectator1).emit("matchFound", { opponentId: spectator2 });
            io.to(spectator2).emit("matchFound", { opponentId: spectator1 });
        } else {
            socket.emit("playerRole", "spectator");
        }
    }

    // Send current board state to the newly connected player
    socket.emit("boardState", chess.fen());

    // Handle disconnection
    socket.on("disconnect", () => {
        console.log('disconnected');
        if (socket.id === players.white) {
            delete players.white;
        } else if (socket.id === players.black) {
            delete players.black;
        } else {
            // Remove spectator from the list
            const index = spectators.indexOf(socket.id);
            if (index !== -1) {
                spectators.splice(index, 1);
                // Handle matchmaking logic if needed
                const pairedId = matchPairs[socket.id];
                if (pairedId) {
                    io.to(pairedId).emit("opponentDisconnected");
                    delete matchPairs[pairedId];
                }
                delete matchPairs[socket.id];
            }
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

// Handle disconnecting all clients
io.on('disconnectAll', () => {
    io.sockets.sockets.forEach(socket => {
        socket.disconnect(true);
    });
});

server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
