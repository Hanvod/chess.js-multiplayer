import { Server, Socket } from "socket.io";
import GameServer from "./gameServer";
import GamePermissions from "./userPermissions";

const chessServer = new GameServer()

globalThis.server = chessServer

const server = new Server()

server.listen(3000)

server.on("connection", (socket: Socket) => {
    console.log("Клиент подключен!")
    
    socket.on("connect", () => {
        console.log("connect is here")
    })
})

