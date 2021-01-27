# Warning

This package was never properly tested and still in early WIP state.

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
### With default events
```javascript
const socket = io({ query: "white_player" })
const board = new NetworkChessboard(socket)

board.on("white_turn", (board) => {
    const moves = board.moves()
    const move = moves[Math.floor(Math.random() * moves.length)]
    board.move(move)
})

```

### With async events

```javascript
const socket = io({ query: "white_player" })
const board = new NetworkChessboard(socket);

(async () => {
    await board.events.waitForConnection()

    while(!board.game_over()) {
        await board.events.waitForTurn("white")
        const moves = board.moves()
        const move = moves[Math.floor(Math.random() * moves.length)]
        await board.move(move)
    }
})()
```
