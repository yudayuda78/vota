import crypto from "crypto";

export function handleVote(ws, wss, payload, questions, broadcast) {
  const question = questions.find((q) => q.id === payload.questionId);
  if (!question) {
    return ws.send(JSON.stringify({ type: "error", payload: { message: "Question not found" } }));
  }

  if (question.votes[payload.option] === undefined) {
    return ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid option" } }));
  }

  question.votes[payload.option]++;

  broadcast(wss, {
    type: "question:updated",
    payload: {
      id: question.id,
      votes: { ...question.votes },
    },
  });
}

export function handleReply(ws, wss, payload, questions, broadcast) {
  const question = questions.find((q) => q.id === payload.questionId);
  if (!question) {
    return ws.send(JSON.stringify({ type: "error", payload: { message: "Question not found" } }));
  }

  const reply = {
    id: crypto.randomUUID(),
    body: payload.body,
    createdAt: Date.now(),
  };

  question.replies.push(reply);

  broadcast(wss, {
    type: "question:replied",
    payload: {
      id: question.id,
      reply,
    },
  });
}