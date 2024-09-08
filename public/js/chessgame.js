const socket = io(); // most important line to set for frontend from the same domain 
const chess=new Chess();
const boardElement=document.querySelector(".chessboard")

let draggedPiece=null;
let sourceSquare=null;
let playerRole=null;

const renderBoard=()=>{
    const board= chess.board();
    boardElement.innerHTML="";
};

const handlemove=()=>{};

const getPieceUnicode=()=>{};