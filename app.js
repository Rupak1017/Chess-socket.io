const express = require("express");
const socket=require("socket.io");
const http =require("http");
const {Chess}=require("chess.js");

const app=express();

const server = http.createServer(app);
const io = socket(server) //these two lines are Initializing Socket.io on HTTP server

const chess = new Chess(); //we required chess.js and destructured Chess within it , and stored it into chess variable (now capable of every func and logic of chess)

let players = {}
let currentPlayer="W";


app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));