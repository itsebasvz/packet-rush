import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import { rankPlayers, scoreAward } from "../lib/rules.mjs";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY)
  throw Error("Configura SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local.");
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false } },
);
const questions = JSON.parse(
  readFileSync(new URL("../content/questions.json", import.meta.url)),
);
const companions = JSON.parse(
  readFileSync(new URL("../content/companions.json", import.meta.url)),
);
const avatarIds = Object.keys(companions.avatars);
const colorIds = Object.keys(companions.colors);
const codes = [];
async function cmd(action, payload, session = "", host = false) {
  const { data, error } = await db.rpc("rush_command", {
    p_action: action,
    p_payload: payload,
    p_session: session,
    p_host: host,
  });
  if (error) throw Error(error.message);
  return data;
}
async function newRoom() {
  const code = randomBytes(3).toString("hex").toUpperCase();
  codes.push(code);
  return await cmd("create", { code, questions }, "", true);
}
try {
  const { room } = await newRoom();
  const code = room.code;
  const sessions = Array.from(
    { length: 40 },
    (_, i) => `integration-${code}-${i}`,
  );
  const joined = await Promise.all(
    sessions.map((session, i) =>
      cmd(
        "join",
        {
          code,
          name: `Player ${i}`,
          avatar: avatarIds[i % avatarIds.length],
          avatarColor:
            colorIds[Math.floor(i / avatarIds.length) % colorIds.length],
        },
        session,
      ),
    ),
  );
  for (const [index, snapshot] of joined.entries()) {
    const player = snapshot.players.find(
      (player) => player.id === snapshot.me.id,
    );
    assert.equal(player.avatar, avatarIds[index % avatarIds.length]);
    assert.equal(
      player.avatarColor,
      colorIds[Math.floor(index / avatarIds.length) % colorIds.length],
    );
  }
  assert.equal((await cmd("state", { code }, "", true)).players.length, 40);
  await assert.rejects(
    cmd("join", { code, name: "Extra", avatar: "packet" }, "extra"),
    /ROOM_FULL/,
  );
  await assert.rejects(cmd("state", { code }, "stranger"), /PLAYER_REQUIRED/);
  await assert.rejects(cmd("start", { code }, sessions[0]), /HOST_REQUIRED/);
  await cmd("start", { code }, "", true);
  await assert.rejects(
    cmd("join", { code, name: "Late", avatar: "packet" }, "late"),
    /JOIN_CLOSED/,
  );
  const first = await cmd("state", { code }, sessions[0]);
  assert.equal(first.me.question.correctOption, undefined);
  assert.equal(first.me.question.explanation, undefined);
  assert(!JSON.stringify(first).includes("session_hash"));
  const replies = await Promise.all(
    Array.from({ length: 8 }, () =>
      cmd(
        "answer",
        { code, index: 0, choice: questions[0].correctOption },
        sessions[0],
      ),
    ),
  );
  assert(
    replies.every(
      (s) =>
        s.players.find((p) => p.id === first.me.id).points ===
        replies[0].me.answer.points,
    ),
  );
  assert.deepEqual(
    replies.map((s) => s.me.answer),
    replies.map(() => replies[0].me.answer),
  );
  assert.equal(
    replies[0].me.answer.points,
    scoreAward(true, replies[0].me.answer.elapsedMs).points,
  );
  const { count } = await db
    .from("rush_answers")
    .select("*", { count: "exact", head: true })
    .eq("player_id", first.me.id)
    .eq("question_index", 0);
  assert.equal(count, 1);
  await Promise.all([
    cmd("next", { code, index: 0 }, sessions[0]),
    cmd("next", { code, index: 0 }, sessions[0]),
  ]);
  assert.equal((await cmd("state", { code }, sessions[0])).me.index, 1);
  const { error: timeoutSetup } = await db
    .from("rush_players")
    .update({ question_started_at: new Date(Date.now() - 46000).toISOString() })
    .eq("id", first.me.id);
  assert.ifError(timeoutSetup);
  const timed = await cmd("state", { code }, sessions[0]);
  assert.equal(timed.me.answer.correct, false);
  assert.equal(timed.me.answer.elapsedMs, 45000);
  assert.equal(timed.me.answer.points, 0);
  assert.equal(timed.players.find((p) => p.id === first.me.id).streak, 0);
  assert.equal(
    timed.players.find((p) => p.id === first.me.id).finishTimeMs,
    null,
  );
  const resumed = await cmd("state", { code }, sessions[0]);
  assert.deepEqual(resumed.me.answer, timed.me.answer);
  assert.equal(
    resumed.players.find((player) => player.id === resumed.me.id).avatarColor,
    colorIds[0],
  );
  await cmd("finish", { code }, "", true);
  const closed = await cmd("state", { code }, sessions[0]);
  assert.equal(closed.room.status, "finished");
  await assert.rejects(
    cmd("answer", { code, index: 0, choice: "a" }, sessions[1]),
    /NOT_RUNNING/,
  );
  assert.equal(
    closed.players.find((p) => p.id === first.me.id).timeMs,
    closed.me.answer.elapsedMs + replies[0].me.answer.elapsedMs + 10 * 45000,
  );
  const oracle = rankPlayers(
    closed.players.map((p) => ({
      ...p,
      elapsedMs: p.timeMs - (12 - p.answered) * 45000,
    })),
  );
  assert.deepEqual(
    closed.players.map((p) => [p.id, p.rank, p.points]),
    oracle.map((p) => [p.id, p.rank, p.points]),
  );
  // Last-player completion must close the room without a host action.
  const second = await newRoom();
  const c = second.room.code;
  await cmd("join", { code: c, name: "Finisher", avatar: "robot" }, "finisher");
  await cmd("start", { code: c }, "", true);
  let expectedPoints = 0,
    expectedBonus = 0;
  for (let index = 0; index < 12; index++) {
    const reply = await cmd(
      "answer",
      { code: c, index, choice: questions[index].correctOption },
      "finisher",
    );
    const award = scoreAward(true, reply.me.answer.elapsedMs, index);
    expectedPoints += award.points;
    expectedBonus += award.speedBonus + award.streakBonus;
    for (const key of Object.keys(award))
      assert.equal(reply.me.answer[key], award[key]);
    await cmd("next", { code: c, index }, "finisher");
  }
  const complete = await cmd("state", { code: c }, "finisher");
  assert.equal(complete.players[0].avatarColor, "blue");
  assert.equal(complete.room.status, "finished");
  assert.equal(complete.players[0].points, expectedPoints);
  assert.equal(complete.players[0].bonusPoints, expectedBonus);
  assert.equal(complete.players[0].bestStreak, 12);
  assert.equal(complete.players[0].streak, 12);
  assert(complete.players[0].finishTimeMs >= 0);
  const { data: finishAnswers, error: finishError } = await db
    .from("rush_answers")
    .select("answered_at")
    .eq("player_id", complete.me.id)
    .order("answered_at", { ascending: false })
    .limit(1);
  assert.ifError(finishError);
  const { data: finishRoom, error: roomError } = await db
    .from("rush_rooms")
    .select("started_at")
    .eq("code", c)
    .single();
  assert.ifError(roomError);
  assert(
    Math.abs(
      complete.players[0].finishTimeMs -
        (Date.parse(finishAnswers[0].answered_at) -
          Date.parse(finishRoom.started_at)),
    ) <= 2,
  );
  assert.equal(
    (await cmd("state", { code: c }, "finisher")).players[0].finishTimeMs,
    complete.players[0].finishTimeMs,
  );
  // SQL/JS parity at speed boundaries and after streak resets, with spoofed scores ignored.
  const scoring = await newRoom();
  const scoringCode = scoring.room.code;
  const joinedScorer = await cmd(
    "join",
    { code: scoringCode, name: "Bonos", avatar: "rocket" },
    "scorer",
  );
  await cmd("start", { code: scoringCode }, "", true);
  const sequence = [
    [true, 5000],
    [true, 5001],
    [true, 10000],
    [true, 10001],
    [true, 20000],
    [true, 20001],
    [false, 1000],
    [true, 1000],
    [true, 1000],
    [true, 1000],
    [true, 45000],
    [true, 25000],
  ];
  let previousStreak = 0;
  for (const [index, [correct, elapsedMs]] of sequence.entries()) {
    const expected = scoreAward(correct, elapsedMs, previousStreak);
    const { data: row, error: insertError } = await db
      .from("rush_answers")
      .insert({
        player_id: joinedScorer.me.id,
        question_index: index,
        correct,
        elapsed_ms: elapsedMs,
        base_points: 100,
        speed_bonus: 30,
        streak_bonus: 20,
        streak: 12,
      })
      .select()
      .single();
    assert.ifError(insertError);
    assert.deepEqual(
      [row.base_points, row.speed_bonus, row.streak_bonus, row.streak],
      [
        expected.basePoints,
        expected.speedBonus,
        expected.streakBonus,
        expected.streak,
      ],
    );
    previousStreak = expected.streak;
  }
  // The migration deliberately keeps existing rooms on the original scoring version.
  const legacy = await newRoom();
  const { error: legacyError } = await db
    .from("rush_rooms")
    .update({ scoring_version: 1 })
    .eq("code", legacy.room.code);
  assert.ifError(legacyError);
  await cmd(
    "join",
    { code: legacy.room.code, name: "Original", avatar: "robot" },
    "legacy",
  );
  await cmd("start", { code: legacy.room.code }, "", true);
  for (let index = 0; index < 3; index++) {
    const legacyReply = await cmd(
      "answer",
      { code: legacy.room.code, index, choice: questions[index].correctOption },
      "legacy",
    );
    assert.equal(legacyReply.me.answer.points, 100);
    assert.equal(legacyReply.me.answer.speedBonus, 0);
    assert.equal(legacyReply.me.answer.streakBonus, 0);
    await cmd("next", { code: legacy.room.code, index }, "legacy");
  }
  // An unprivileged JWT cannot call privileged functions or read private tables.
  if (process.env.SUPABASE_ANON_KEY) {
    const anon = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { auth: { persistSession: false } },
    );
    assert(
      (
        await anon.rpc("rush_command", {
          p_action: "state",
          p_payload: { code },
          p_session: sessions[0],
          p_host: true,
        })
      ).error,
    );
    const exposed = await anon.from("rush_rooms").select("*");
    assert(exposed.error || exposed.data.length === 0);
  }
  console.log(
    "DB OK: 40 jugadores, capacidad, permisos, idempotencia, bonos, rachas, límites de rapidez, salas anteriores, tiempos de llegada y cierre automático.",
  );
} finally {
  // Only delete this run's explicitly generated rooms, never reset the database.
  if (codes.length) {
    const { error } = await db.from("rush_rooms").delete().in("code", codes);
    if (error)
      console.error("No se pudieron limpiar las salas de prueba:", error.code);
  }
}
