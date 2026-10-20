import test from "node:test";
import assert from "node:assert/strict";
import { raceEvents, raceLayout } from "../lib/race-display.mjs";

const snapshot = (answered = [0, 0], status = "running", code = "ABC234") => ({
  room: { code, status, questionCount: 12 },
  players: answered.map((n, i) => ({ id: String(i), answered: n })),
});
test("40 racers fit one large projection or balanced smaller pages", () => {
  const large = raceLayout(1800, 740, 40);
  assert.equal(large.pageCount, 1);
  assert.equal(large.columns, 5);
  assert.equal(large.rows, 8);
  const small = raceLayout(1200, 400, 40);
  assert.equal(small.pageCount, 3);
  assert.equal(small.pageSize, 14);
  assert(small.rows * 76 + (small.rows - 1) * 8 <= 400);
});
test("narrow layouts keep racers on readable pages", () => {
  const layout = raceLayout(335, 300, 40);
  assert.equal(layout.columns, 1);
  assert.equal(layout.pageSize, 3);
  assert.equal(layout.pageCount, 14);
});
test("rachas se anuncian solo al cruzar hitos nuevos, sin repetir por sondeo", () => {
  const state = snapshot([2, 2]);
  state.players[0].streak = 2;
  state.players[1].streak = 2;
  const initial = raceEvents(null, state);
  const next = structuredClone(state);
  next.players[0].streak = 3;
  const event = raceEvents(initial.tracker, next);
  assert.deepEqual(
    event.hot.map((p) => p.id),
    ["0"],
  );
  assert.equal(raceEvents(event.tracker, next).hot.length, 0);
  next.players[0].streak = 0;
  const reset = raceEvents(event.tracker, next);
  next.players[0].streak = 3;
  assert.equal(raceEvents(reset.tracker, next).hot.length, 1);
  next.players[0].streak = 8;
  assert.equal(raceEvents(event.tracker, next).hot.length, 1);
  next.room.status = "finished";
  assert.equal(raceEvents(event.tracker, next).hot.length, 0);
});
test("existing finishers are a baseline; subsequent arrivals fire once", () => {
  const initial = raceEvents(null, snapshot([12, 0]));
  assert.equal(initial.arrivals.length, 0);
  const next = raceEvents(initial.tracker, snapshot([12, 12]));
  assert.deepEqual(
    next.arrivals.map((p) => p.id),
    ["1"],
  );
  assert.equal(raceEvents(next.tracker, snapshot([12, 12])).arrivals.length, 0);
});
test("the final podium fires once and supersedes simultaneous arrivals", () => {
  const initial = raceEvents(null, snapshot());
  const final = raceEvents(initial.tracker, snapshot([12, 12], "finished"));
  assert(final.finale);
  assert.equal(final.arrivals.length, 0);
  assert(!raceEvents(final.tracker, snapshot([12, 12], "finished")).finale);
});
test("switching rooms resets events and early closing never invents finishers", () => {
  const closed = raceEvents(null, snapshot([3, 5], "finished"));
  assert(closed.finale);
  assert.equal(closed.tracker.arrivedIds.length, 0);
  const other = raceEvents(
    closed.tracker,
    snapshot([12, 0], "running", "DEF567"),
  );
  assert(!other.finale);
  assert.equal(other.arrivals.length, 0);
  assert.deepEqual(other.tracker.arrivedIds, ["0"]);
});
