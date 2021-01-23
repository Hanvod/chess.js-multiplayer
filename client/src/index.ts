import { io } from "socket.io-client";
import GameClient from "./gameClient";
/*
const chessClient = new GameClient("http://localhost:3000", 0)

// Player input mockup

const sleep = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time))
}

const white_player = () => {
    const make_move = async (chess: GameClient) => {
            await sleep(600 + Math.random()*1000);
            
            console.log("Hell yeah, I'm white player and I'm making a move!")

            const moves = chess.moves()
            const move = moves[Math.floor(Math.random() * moves.length)]
        
            chess.move(move)
        }
    
    chessClient.on("white_turn", make_move)

    if(chessClient.turn() === "w") {
        make_move(chessClient)
    }
}

const black_player = () => {
    const make_move = async (chess: GameClient) => {
            await sleep(600 + Math.random()*1000);
            
            console.log("Hell yeah, I'm black player and I'm making a move!")

            const moves = chess.moves()
            const move = moves[Math.floor(Math.random() * moves.length)]
        
            chess.move(move)
        }
    
    chessClient.on("black_turn", make_move)

    if(chessClient.turn() === "b") {
        make_move(chessClient)
    }
}

const spectator = () => {
    chessClient.on("board_update", (chess: GameClient) => {
        console.log(chess.ascii())
    })
}

globalThis.black_player = black_player
globalThis.white_player = white_player
globalThis.spectator = spectator

globalThis.client = chessClient
*/

globalThis.io = io

globalThis.GameClient = new GameClient("http://localhost:3000", 0)

