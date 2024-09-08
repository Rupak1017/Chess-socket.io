const express = require('express');
const {Server} = require('socket.io')
const {Server: httpServer} = require('http');
const {Chess} = require('chess.js');
const path = require('path');

const PORT = 5000;
const app = express();
const server = new httpServer(app)
 

// create 
const io = new Server(server)
let chess = new Chess();

let players = {};
let currentPlayer = "W";

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index');
})

io.on('connection', function(uniqueConnection){
    console.log('connected')
    
    // uniqueConnection.on('userJoin',function(){
    //     console.log('New User Joined from Frontend');
    // });
    
    // uniqueConnection.emit('user2Join');

    // uniqueConnection.on('disconnect', ()=> {
    //     console.log('connection are discount successfully...');
    // })

    // assign user role
    if(!players.white){
        players.white = uniqueConnection.id;
        uniqueConnection.emit("playerRole", "w");
    } else if(!players.black){
        players.black = uniqueConnection.id;
        uniqueConnection.emit("playerRole", "b")
    } else {
        uniqueConnection.emit("SpectatorRole");
    }

    //  disconnection
    uniqueConnection.on("disconnection", ()=> {
        if(uniqueConnection.id === players.white){
            delete players.white
        } else if(uniqueConnection.id === players.black){
            delete players.black
        }
    });

    // handle the chess move
    uniqueConnection.on('move', (move)=> {

        try {
            if(chess.turn() == 'w' && uniqueConnection.id !== players.white) return;
            if(chess.turn() == 'b' && uniqueConnection.id !== players.black) return;
            let result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit("move", move);
                io.emit("boardState", chess.fen())
            } else {
                console.log("Invalid Move: ", move);
                uniqueConnection.emit("invalid Move", move);
            }
        } catch (err){
            console.log("Invalid Move: ", move);
            uniqueConnection.emit("Error: ", err);
        }
    })


})
server.listen(PORT, ()=> {
    console.log(`Server listening on this url:http://localhost:${PORT}`);
})