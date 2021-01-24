import GameClient from "./gameClient";

const chessClient = new GameClient("http://localhost:3000")

globalThis.client = chessClient


<<<<<<< Updated upstream
=======
const client = new GameClient("http://localhost:3000", 0);

globalThis.GameClient = client;

client.on("board_connection", (client: GameClient) => {
    console.log("Клиент подключен к серверу с номером " + client.connectedID)
})

>>>>>>> Stashed changes

