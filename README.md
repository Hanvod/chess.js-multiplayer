# Warning

This package is never property tested and still in WIP state.

# chess.js-socket.io
Chess multiplayer library based on chess.js

# Example usage
## Server
```javascript
const server = new Server().listen(3000)
const board = new NetworkChessboard()

server.on("connection", socket => {
  if(socket.handshake.query === "white_player") {
    board.addUser(socket, GamePermissions.WhitePlayer)
  }
  else if(socket.handshake.query === "black_player") {
    board.addUser(socket, GamePermissions.BlackPlayer)
  }
  else {
    board.addUser(socket, GamePermissions.Spectator)
  }
})
```

## Client
This example connects to board and plays randomly as white
```javascript
const socket = io({ query: "white_player" })

const board = new NetworkChessboard(socket)

board.on("board_connection", (board) => {
  console.log("Connected to remote board")
})

board.on("board_update", (board) => {
  console.log(`New position: \n {board.ascii()}`)
});

board.on("white_turn", (board) => {
    const moves = board.moves()
    const move = moves[Math.floor(Math.random() * moves.length)]
    board.move(move)
})

```
