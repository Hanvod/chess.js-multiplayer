import { Server, Socket } from "socket.io";
import GameServer from "./gameServer";
import GamePermissions from "./userPermissions";

const server = new Server()

server.listen(3000)

globalThis.GameServer = new GameServer(server, (socket: Socket) => GamePermissions.Admin)
