import GameClient from "./gameClient";

const client = new GameClient("http://localhost:3000", 0);

globalThis.GameClient = client;

client.on("board_connection", (client: GameClient) => {
    console.log("Клиент подключен к серверу с номером " + client.connectedID)
})

client.move


