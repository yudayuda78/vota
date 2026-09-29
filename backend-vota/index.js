import express from "express";
import cors from "cors";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/websocket/handler.js";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello");
});

setupWebSocket(wss);

server.listen(3000, () => {
  console.log("Server is running on port 3000 (HTTP + WebSocket)");
});
