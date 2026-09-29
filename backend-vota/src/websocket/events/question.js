import crypto from "crypto";

export function handleCreate(wss, payload, questions, broadcast) {
  const question = {
    id: crypto.randomUUID(),
    title: payload.title,
    body: payload.body || "",
    options: payload.options || [],
    votes: {},
    replies: [],
    createdAt: Date.now(),
  };

  if (payload.options?.length > 0) {
    payload.options.forEach((opt) => {
      question.votes[opt] = 0;
    });
  }

  questions.push(question);

  broadcast(wss, {
    type: "question:new",
    payload: question,
  });
}