import NetworkChessboard from "./NetworkChessboard/index"
import { BoardEvent, BoardEventHandler, PermissionsResolver, IChessboardClient } from "./interfaces"
import { Server } from "socket.io"
import GamePermissions from "./NetworkChessboard/userPermissions"

export { NetworkChessboard, BoardEvent, BoardEventHandler, PermissionsResolver, IChessboardClient }

const server = new Server().listen(3000)
const board = NetworkChessboard.create()

globalThis.board = board
globalThis.server = server

globalThis.GamePermissions = GamePermissions

server.on("connection", socket => {
    console.log("Клиент подключен!")

    board.addUser(socket, socket => GamePermissions.Admin)
})

