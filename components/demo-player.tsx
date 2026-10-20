"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import bank from "@/content/questions.json";
import { scoreAward } from "@/lib/rules.mjs";
import type { GameState } from "@/lib/types";
import { PlayerExperience } from "./player-game";

function createState(): GameState {
  return {
    serverNow: new Date().toISOString(),
    room: {
      code: `P${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
      status: "running",
      questionCount: 12,
      capacity: 40,
      scoringVersion: 2,
    },
    players: [
      {
        id: "demo-player",
        name: "Tu paquete",
        avatar: "rocket",
        avatarColor: "indigo",
        correct: 0,
        answered: 0,
        points: 0,
        timeMs: 540000,
        rank: 1,
        complete: false,
        streak: 0,
        bestStreak: 0,
        bonusPoints: 0,
        finishTimeMs: null,
      },
    ],
    me: {
      id: "demo-player",
      index: 0,
      deadlineAt: new Date(Date.now() + 45000).toISOString(),
      question: bank[0],
      answer: null,
      complete: false,
    },
  };
}

export function DemoPlayer() {
  const ref = useRef<GameState | null>(null);
  const started = useRef(0);
  const [state, setState] = useState<GameState | null>(null);
  const [busy, setBusy] = useState(false);
  const [tools, setTools] = useState(false);
  const commit = useCallback((value: GameState) => {
    ref.current = value;
    setState(value);
  }, []);
  const restart = useCallback(() => {
    started.current = Date.now();
    commit(createState());
  }, [commit]);
  useEffect(() => restart(), [restart]);

  const act = useCallback(
    async (action: string, payload: Record<string, unknown> = {}) => {
      const current = ref.current;
      if (!current?.me || current.room.status !== "running")
        return current ?? undefined;
      const value = structuredClone(current);
      const me = value.me!;
      const racer = value.players[0];
      if (action === "answer" && !me.answer) {
        const elapsed =
          typeof payload.demoElapsed === "number"
            ? payload.demoElapsed
            : Math.min(
                45000,
                Math.max(0, 45000 - (Date.parse(me.deadlineAt!) - Date.now())),
              );
        const question = bank[me.index];
        const selected = elapsed < 45000 ? String(payload.choice) : null;
        const correct = elapsed < 45000 && selected === question.correctOption;
        const award = scoreAward(correct, elapsed, racer.streak);
        me.answer = {
          correct,
          selected,
          elapsedMs: elapsed,
          correctOption: question.correctOption,
          explanation: question.explanation,
          ...award,
        };
        racer.answered++;
        racer.correct += correct ? 1 : 0;
        racer.points += award.points;
        racer.bonusPoints += award.speedBonus + award.streakBonus;
        racer.streak = award.streak;
        racer.bestStreak = Math.max(racer.bestStreak, racer.streak);
        racer.timeMs += elapsed - 45000;
        if (racer.answered === 12)
          racer.finishTimeMs = Date.now() - started.current;
      } else if (action === "next" && me.answer) {
        me.index++;
        me.answer = null;
        me.complete = me.index === 12;
        me.question = bank[me.index] ?? null;
        me.deadlineAt = me.complete
          ? null
          : new Date(Date.now() + 45000).toISOString();
        racer.complete = me.complete;
        if (me.complete) value.room.status = "finished";
      } else return current;
      value.serverNow = new Date().toISOString();
      commit(value);
      return value;
    },
    [commit],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const current = ref.current;
      if (
        current?.room.status === "running" &&
        current.me?.deadlineAt &&
        !current.me.answer &&
        Date.parse(current.me.deadlineAt) <= Date.now()
      )
        void act("answer", { choice: null, demoElapsed: 45000 });
    }, 300);
    return () => clearInterval(timer);
  }, [act]);

  async function preview(kind: "fast" | "slow" | "wrong") {
    const current = ref.current;
    if (!current?.me || current.me.answer) return;
    setBusy(true);
    const question = bank[current.me.index];
    const choice =
      kind === "wrong"
        ? question.options.find(
            (option) => option.id !== question.correctOption,
          )!.id
        : question.correctOption;
    await act("answer", {
      choice,
      demoElapsed: kind === "slow" ? 14000 : 3000,
    });
    setBusy(false);
    setTools(false);
  }

  return (
    <>
      <PlayerExperience
        key={state?.room.code ?? "loading"}
        code={state?.room.code ?? "DEMO00"}
        state={state}
        error=""
        busy={busy}
        offset={0}
        act={act}
        refresh={async () => {}}
      />
      <button
        className="demo-badge"
        onClick={() => setTools((value) => !value)}
      >
        DEMO JUGADOR · {tools ? "CERRAR ×" : "OPCIONES ↗"}
      </button>
      {tools && (
        <section
          className="demo-player-tools card"
          aria-label="Herramientas para probar el feedback"
        >
          <strong>Prueba los estados</strong>
          <p className="muted small">
            Acierta tres veces seguidas para activar la racha. Pulsa «Siguiente
            pregunta» después de cada respuesta.
          </p>
          <button
            className="btn primary full"
            disabled={!!state?.me?.answer || state?.room.status === "finished"}
            onClick={() => void preview("fast")}
          >
            ACIERTO EN 3 SEGUNDOS
          </button>
          <button
            className="btn outline full"
            disabled={!!state?.me?.answer || state?.room.status === "finished"}
            onClick={() => void preview("slow")}
          >
            ACIERTO EN 14 SEGUNDOS
          </button>
          <button
            className="btn outline full"
            disabled={!!state?.me?.answer || state?.room.status === "finished"}
            onClick={() => void preview("wrong")}
          >
            PROBAR UN ERROR
          </button>
          <button
            className="text-link"
            onClick={() => {
              restart();
              setTools(false);
            }}
          >
            REINICIAR MI CARRERA
          </button>
          <a className="text-link" href="/demo">
            VER CARRERA EN VIVO ↗
          </a>
        </section>
      )}
    </>
  );
}
