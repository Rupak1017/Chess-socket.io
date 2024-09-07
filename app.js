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
   

    if(!players.white){
        players.white=uniquesocket.id;
        uniquesocket.emit=("playerRole", "w")
    }
else if(!players.black){
    players.black=uniquesocket.id;
    uniquesocket.emit=("playerRole", "b")
}

});

server.listen(3000,function(){
    console.log("listening on port 3000");
})