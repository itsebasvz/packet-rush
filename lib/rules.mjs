export const QUESTION_MS = 45_000;
export const MAX_PLAYERS = 40;
export function validateQuestions(questions) {
  if (!Array.isArray(questions) || questions.length !== 12)
    throw new Error("Se requieren exactamente 12 preguntas.");
  const ids = new Set();
  const topics = new Map();
  for (const q of questions) {
    if (
      !q.id ||
      ids.has(q.id) ||
      !q.prompt?.trim() ||
      !q.explanation?.trim() ||
      !q.topic?.trim()
    )
      throw new Error("Pregunta incompleta o ID duplicado.");
    ids.add(q.id);
    topics.set(q.topic, (topics.get(q.topic) ?? 0) + 1);
    if (
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      new Set(q.options.map((o) => o.id)).size !== 4 ||
      q.options.some((o) => !o.id || !o.text?.trim()) ||
      !q.options.some((o) => o.id === q.correctOption)
    )
      throw new Error(`Opciones inválidas: ${q.id}`);
  }
  if (
    ["Modelo OSI", "Dispositivos", "Topologías"].some(
      (t) => topics.get(t) !== 4,
    )
  )
    throw new Error("Se requieren cuatro preguntas por tema.");
  return questions;
}
export function validateName(value) {
  if (typeof value !== "string") throw new Error("Escribe tu apodo.");
  const name = value.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!/^[\p{L}\p{N} ._-]{2,20}$/u.test(name))
    throw new Error(
      "Usa un apodo de 2 a 20 caracteres: letras, números, espacios, punto, guion o guion bajo.",
    );
  return name;
}
export function scoreAnswer(correctOption, choice, startedAt, answeredAt) {
  const elapsedMs = Math.max(0, Math.min(QUESTION_MS, answeredAt - startedAt));
  return {
    correct: elapsedMs < QUESTION_MS && choice === correctOption,
    elapsedMs,
  };
}
export function rankPlayers(players, questionCount = 12) {
  const rows = players.map((p) => ({
    ...p,
    points: p.correct * 100,
    timeMs: p.elapsedMs + Math.max(0, questionCount - p.answered) * QUESTION_MS,
  }));
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      a.timeMs - b.timeMs ||
      a.name.localeCompare(b.name, "es"),
  );
  let rank = 0;
  return rows.map((p, i) => {
    if (
      !i ||
      p.points !== rows[i - 1].points ||
      p.timeMs !== rows[i - 1].timeMs
    )
      rank = i + 1;
    return { ...p, rank };
  });
}
export function csvCell(value) {
  const safe = String(value ?? "").replace(/^[=+@\-\t\r]/, "'$&");
  return `"${safe.replaceAll('"', '""')}"`;
}
