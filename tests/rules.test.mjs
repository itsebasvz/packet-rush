import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  csvCell,
  rankPlayers,
  scoreAnswer,
  validateName,
  validateQuestions,
  scoreAward,
  speedPoints,
  formatRaceTime,
} from "../lib/rules.mjs";
const bank = JSON.parse(
  readFileSync(new URL("../content/questions.json", import.meta.url)),
);
test("el cuestionario tiene doce preguntas completas y cuatro por tema", () => {
  assert.equal(validateQuestions(bank).length, 12);
});
test("rechaza preguntas con claves duplicadas, respuestas imposibles o temas incompletos", () => {
  for (const mutate of [
    (q) => q.pop(),
    (q) => (q[1].id = q[0].id),
    (q) => (q[0].correctOption = "z"),
    (q) => (q[0].options[0].text = ""),
    (q) => (q[0].topic = "Otro"),
  ]) {
    const copy = structuredClone(bank);
    mutate(copy);
    assert.throws(() => validateQuestions(copy));
  }
});
test("los apodos conservan acentos y se normalizan", () => {
  assert.equal(validateName("  Sebas   ñ  "), "Sebas ñ");
  assert.equal(validateName("Ｓｅｂａｓ"), "Sebas");
  for (const name of ["a", "<script>", "x".repeat(21), "=SUM(1)", null])
    assert.throws(() => validateName(name));
});
test("un vencimiento no suma puntos incluso con la opción correcta", () => {
  assert.deepEqual(scoreAnswer("b", "b", 1000, 46000), {
    correct: false,
    elapsedMs: 45000,
  });
  assert.equal(scoreAnswer("b", "b", 1000, 45999).correct, true);
  assert.equal(scoreAnswer("b", "a", 1000, 2000).correct, false);
});
test("los aciertos tienen prioridad y un empate exacto comparte posición", () => {
  const ranked = rankPlayers([
    { name: "A", correct: 10, answered: 12, elapsedMs: 50000 },
    { name: "B", correct: 9, answered: 12, elapsedMs: 1 },
    { name: "C", correct: 10, answered: 12, elapsedMs: 50000 },
  ]);
  assert.deepEqual(
    ranked.map((p) => [p.name, p.rank]),
    [
      ["A", 1],
      ["C", 1],
      ["B", 3],
    ],
  );
});
test("preguntas pendientes penalizan el tiempo de desempate", () => {
  assert.equal(
    rankPlayers([{ name: "A", correct: 1, answered: 1, elapsedMs: 1000 }])[0]
      .timeMs,
    496000,
  );
});
test("exportar CSV protege comillas y fórmulas", () => {
  assert.equal(csvCell('a"b'), '"a""b"');
  assert.equal(csvCell("=HYPERLINK()"), '"\'=HYPERLINK()"');
});
test("rapidez tiene límites precisos y nunca recompensa errores ni vencimientos", () => {
  for (const [ms, bonus] of [
    [0, 30],
    [5000, 30],
    [5001, 20],
    [10000, 20],
    [10001, 10],
    [20000, 10],
    [20001, 0],
    [44999, 0],
  ]) {
    assert.equal(speedPoints(ms), bonus);
    assert.equal(scoreAward(true, ms).points, 100 + bonus);
    assert.deepEqual(scoreAward(false, ms, 8), {
      basePoints: 0,
      speedBonus: 0,
      streakBonus: 0,
      streak: 0,
      points: 0,
    });
  }
  assert.equal(scoreAward(true, 45000, 8).points, 0);
});
test("rachas desde tres, con tope y reinicio; salas antiguas conservan sus reglas", () => {
  assert.deepEqual(
    Array.from({ length: 8 }, (_, i) => scoreAward(true, 20001, i).streakBonus),
    [0, 0, 10, 15, 20, 20, 20, 20],
  );
  assert.equal(scoreAward(false, 1000, 5).streak, 0);
  assert.equal(scoreAward(true, 1000, 0).streakBonus, 0);
  assert.equal(scoreAward(true, 1000, 8, 1).points, 100);
  assert.equal(scoreAward(true, 1000, 8).points, 150);
});
test("clasificación por puntos con bonos y empate exacto por tiempo", () => {
  const rows = rankPlayers([
    { name: "A", correct: 10, answered: 12, elapsedMs: 2000, points: 1000 },
    { name: "B", correct: 9, answered: 12, elapsedMs: 3000, points: 1200 },
    { name: "C", correct: 9, answered: 12, elapsedMs: 3000, points: 1200 },
  ]);
  assert.deepEqual(
    rows.map((p) => [p.name, p.rank]),
    [
      ["B", 1],
      ["C", 1],
      ["A", 3],
    ],
  );
});
test("tiempos de llegada legibles, incluso cero y recorridos sin completar", () => {
  assert.equal(formatRaceTime(null), "—");
  assert.equal(formatRaceTime(0), "0:00");
  assert.equal(formatRaceTime(65999), "1:05");
  assert.equal(formatRaceTime(600000), "10:00");
});
