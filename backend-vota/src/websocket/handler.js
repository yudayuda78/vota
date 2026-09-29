import { handleCreate } from "./events/question.js";
import { handleVote, handleReply } from "./events/vote.js";

function broadcast(wss, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(data);
    }
  });
}

export function setupWebSocket(wss) {
  const questions = [];

  wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
      try {
        const { type, payload } = JSON.parse(raw.toString());

        switch (type) {
          case "question:create":
            handleCreate(wss, payload, questions, broadcast);
            break;
          case "question:vote":
            handleVote(ws, wss, payload, questions, broadcast);
            break;
          case "question:reply":
            handleReply(ws, wss, payload, questions, broadcast);
            break;
          default:
            ws.send(JSON.stringify({ type: "error", payload: { message: "Unknown event type" } }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid JSON" } }));
      }
    });
  });
}