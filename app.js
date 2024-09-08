const express = require("express");
const socket=require("socket.io");
const http =require("http");
const {Chess}=require("chess.js");
const path=require("path");



const app=express();

const server = http.createServer(app);
const io = socket(server) //these two lines are Initializing Socket.io on HTTP server

const chess = new Chess(); //we required chess.js and destructured Chess within it , and stored it into chess variable (now capable of every func and logic of chess)

let players = {}
let currentPlayer="W";


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req,res)=>{
    res.render("index",{title:"Chess Game"});
})

io.on("connection", function (uniquesocket){
    console.log("connected");
   
//Role main logic 
    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit=("playerRole", "w")
    }
else if(!players.black){
    players.black=uniquesocket.id;
    uniquesocket.emit=("playerRole", "b")
}
else{
    uniquesocket.emit("spectatorRole");
}

uniquesocket.on("disconnect", function(){
    if( uniquesocket.on === players.white){
        delete players.white;
    } else{
        delete players.black;
    }
})


//this is checking correct person is moving thier turn or now
uniquesocket.on("move",(move)=>{
    try{
 if(chess.turn()==='w' && uniquesocket.id !== players.white) return 
 if(chess.turn()==='b' && uniquesocket.id !== players.black) return//turn is a method of chess


 //this is move logic
const result = chess.move(move);
if (result) {
    currentPlayer = chess.turn();
    io.emit("move", move)
    io.emit("boardState", chess.fen())
}else{
    console.log("invalid move", move);
    uniquesocket.emit("invalidMove :",move)
    
}
    }
    catch(err){
        console.log(err);
        uniquesocket.emit("Invalid move :", move);
        

    }
})

});

server.listen(3000,function(){
    console.log("listening on port 3000");
})