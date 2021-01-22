import { Server, Socket } from "socket.io";
import GameServer from "./gameServer";
import GamePermissions from "./userPermissions";

const chessServer = new GameServer()

globalThis.server = chessServer

const server = new Server()

server.listen(3000)

server.on("connection", (socket: Socket) => {
    chessServer.addUser(socket, GamePermissions.Admin)
})

