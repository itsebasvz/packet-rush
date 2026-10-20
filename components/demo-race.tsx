"use client";

import { useEffect, useRef, useState } from "react";
import {
  avatars,
  avatarColors,
  type Avatar,
  type AvatarColor,
} from "@/lib/appearance";
import { rankPlayers, scoreAward } from "@/lib/rules.mjs";
import type { GameState, Racer } from "@/lib/types";
import { RaceDashboard } from "./race-dashboard";

type Bot = Racer & { elapsedMs: number; nextAt: number; accuracy: number };
type Simulation = {
  code: string;
  clock: number;
  finishedAt: number | null;
  bots: Bot[];
};
const names = [
  "Luna",
  "Sebas",
  "Valuwu",
  "Goat",
  "Potato",
  "UwU",
  "Sofi",
  "Dani",
  "Alex",
  "Emi",
  "Fer",
  "Pau",
  "Diego",
  "Andy",
  "Majo",
  "Leo",
  "Regis",
  "Nico",
  "Vale",
  "Beto",
  "Sam",
  "Chris",
  "Ren",
  "Jules",
  "Mich",
  "Karla",
  "Memo",
  "Iker",
  "Isa",
  "Alan",
  "Tania",
  "Omar",
  "Max",
  "Abril",
  "Rafa",
  "Eli",
  "Lalo",
  "Lu",
  "Ari",
  "Toño",
];
const random = (min: number, max: number) => min + Math.random() * (max - min);
function answerBot(bot: Bot, clock: number) {
  const elapsed = Math.round(random(1500, 15000));
  const correct = Math.random() < bot.accuracy;
  const award = scoreAward(correct, elapsed, bot.streak);
  bot.answered++;
  bot.correct += correct ? 1 : 0;
  bot.elapsedMs += elapsed;
  bot.points += award.points;
  bot.bonusPoints += award.speedBonus + award.streakBonus;
  bot.streak = award.streak;
  bot.bestStreak = Math.max(bot.bestStreak, bot.streak);
  bot.complete = bot.answered === 12;
  if (bot.complete) bot.finishTimeMs = clock;
}

function createSimulation(count: number): Simulation {
  const code = `D${crypto.randomUUID().replaceAll("-", "").slice(0, 5).toUpperCase()}`;
  const characters = Object.keys(avatars) as Avatar[];
  const colors = Object.keys(avatarColors) as AvatarColor[];
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    code,
    clock: 90000,
    finishedAt: null,
    bots: Array.from({ length: count }, (_, i) => {
      // Begin mid-race so the first arrival is visible within a few seconds.
      const answered = i === 0 ? 10 : Math.floor(random(1, 10));
      const bot: Bot = {
        id: `${code}-${i}`,
        name: shuffled[i],
        avatar: characters[Math.floor(Math.random() * characters.length)],
        avatarColor: colors[Math.floor(Math.random() * colors.length)],
        answered: 0,
        correct: 0,
        points: 0,
        elapsedMs: 0,
        timeMs: 0,
        rank: i + 1,
        complete: false,
        streak: 0,
        bestStreak: 0,
        bonusPoints: 0,
        finishTimeMs: null,
        nextAt: 90000 + (i === 0 ? 1800 : random(1500, 8500)),
        accuracy: random(0.45, 0.95),
      };
      for (let j = 0; j < answered; j++) answerBot(bot, 90000);
      return bot;
    }),
  };
}

function snapshot(simulation: Simulation): GameState {
  return {
    serverNow: new Date().toISOString(),
    room: {
      code: simulation.code,
      status:
        simulation.finishedAt !== null &&
        simulation.clock >= simulation.finishedAt + 7000
          ? "finished"
          : "running",
      questionCount: 12,
      capacity: 40,
      scoringVersion: 2,
    },
    players: rankPlayers(simulation.bots),
    me: null,
  };
}

export function DemoRace() {
  const simulation = useRef<Simulation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [count, setCount] = useState(32);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [controls, setControls] = useState(false);

  function restart(participants = count) {
    simulation.current = createSimulation(participants);
    setState(snapshot(simulation.current));
    setPaused(false);
  }

  useEffect(() => {
    restart(32);
    document.body.classList.add("is-projecting");
    return () => document.body.classList.remove("is-projecting");
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      const current = simulation.current;
      if (!current || document.hidden) return;
      if (
        current.finishedAt !== null &&
        current.clock >= current.finishedAt + 7000
      )
        return;
      current.clock += 600 * speed;
      for (const bot of current.bots) {
        if (bot.answered >= 12 || bot.nextAt > current.clock) continue;
        answerBot(bot, current.clock);
        bot.nextAt = current.clock + random(1800, 7500);
      }
      if (
        current.finishedAt === null &&
        current.bots.every((bot) => bot.complete)
      )
        current.finishedAt = current.clock;
      setState(snapshot(current));
    }, 600);
    return () => clearInterval(timer);
  }, [paused, speed]);

  useEffect(() => {
    if (controls && !dialog.current?.open) dialog.current?.showModal();
    if (!controls && dialog.current?.open) dialog.current?.close();
  }, [controls]);

  function finishOne() {
    const current = simulation.current;
    if (!current) return;
    const pending = current.bots.filter((bot) => !bot.complete);
    const bot = pending[Math.floor(Math.random() * pending.length)];
    if (!bot) return;
    while (bot.answered < 12) {
      answerBot(bot, current.clock);
    }
    bot.complete = true;
    if (current.bots.every((player) => player.complete))
      current.finishedAt ??= current.clock;
    setState(snapshot(current));
    setControls(false);
  }

  return (
    <>
      {state ? (
        <RaceDashboard
          key={state.room.code}
          state={state}
          error=""
          onControls={() => setControls(true)}
          onRefresh={() => {}}
        />
      ) : (
        <main id="main" className="player-layout">
          <p role="status">Preparando participantes ficticios…</p>
        </main>
      )}
      <button
        className="demo-badge"
        onClick={() => setControls(true)}
        aria-label="Abrir controles de la simulación"
      >
        DEMO ·{" "}
        {paused
          ? "PAUSADA"
          : state?.room.status === "finished"
            ? "REPETIR ↻"
            : "EN VIVO"}
      </button>
      <dialog
        ref={dialog}
        className="card demo-dialog"
        aria-labelledby="demo-title"
        onCancel={() => setControls(false)}
        onClose={() => setControls(false)}
      >
        <span className="eyebrow">SIMULACIÓN LOCAL</span>
        <h2 id="demo-title">Tu salón de prueba</h2>
        <p className="muted">
          Participantes ficticios con compañeros, colores, aciertos y ritmos al
          azar. Comienza a media carrera para ver llegadas pronto. No usa la
          base de datos.
        </p>
        <label htmlFor="demo-count">
          Participantes en la siguiente carrera
        </label>
        <select
          id="demo-count"
          value={count}
          onChange={(event) => setCount(Number(event.target.value))}
        >
          {[2, 8, 16, 32, 40].map((value) => (
            <option key={value} value={value}>
              {value} participantes
            </option>
          ))}
        </select>
        <label htmlFor="demo-speed">Velocidad de la simulación</label>
        <select
          id="demo-speed"
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
        >
          {[0.5, 1, 2, 4].map((value) => (
            <option key={value} value={value}>
              {value}×
            </option>
          ))}
        </select>
        <div className="demo-actions">
          <button
            className="btn primary full"
            onClick={() => {
              restart();
              setControls(false);
            }}
          >
            NUEVA CARRERA AL AZAR ↻
          </button>
          <button
            className="btn outline full"
            onClick={() => {
              setPaused((value) => !value);
              setControls(false);
            }}
          >
            {paused ? "REANUDAR" : "PAUSAR"} SIMULACIÓN
          </button>
          <button
            className="btn outline full"
            onClick={finishOne}
            disabled={!state?.players.some((player) => !player.complete)}
          >
            HACER LLEGAR A ALGUIEN 🎉
          </button>
          <button className="text-link" onClick={() => setControls(false)}>
            VOLVER A LA CARRERA
          </button>
          <a className="btn outline full" href="/demo/player">
            PROBAR VISTA DEL JUGADOR ↗
          </a>
        </div>
      </dialog>
    </>
  );
}
