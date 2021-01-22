import GameClient from "./gameClient";

const chessClient = new GameClient("http://localhost:3000")

globalThis.client = chessClient



