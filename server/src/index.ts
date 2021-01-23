import { Server, Socket } from "socket.io";
import GameServer from "./gameServer";
import GamePermissions from "./userPermissions";

const server = new Server()

server.listen(3000)

server.on("connection", ()=>{
    console.log("connection blyad!!!!")
})

globalThis.GameServer = new GameServer(server, (socket: Socket) => GamePermissions.Admin)