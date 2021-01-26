import { io } from "socket.io-client"
import NetworkChessboard from "./gameClient/index.js"

globalThis.io = io

globalThis.board = NetworkChessboard.connectToGameServer("http://localhost:3000", {})

setInterval(()=>{}, 0)