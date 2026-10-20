"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGame } from "./use-game";
import { Mascot } from "./mascot";
import { Leaderboard } from "./leaderboard";
import type { GameState } from "@/lib/types";
import { speedPoints } from "@/lib/rules.mjs";
import { AnswerReward, FinishDetails, PlayerScore } from "./player-score";
import { ScoringGuide } from "./scoring-guide";
import { BoltIcon } from "./game-icons";
export function PlayerGame({ code }: { code: string }) {
  const game = useGame(code);
  return <PlayerExperience code={code} {...game} />;
}
export function PlayerExperience({
  code,
  state,
  error,
  busy,
  offset,
  act,
  refresh,
}: {
  code: string;
  state: GameState | null;
  error: string;
  busy: boolean;
  offset: number;
  act: (
    action: string,
    payload?: Record<string, unknown>,
  ) => Promise<GameState | undefined>;
  refresh: () => Promise<void>;
}) {
  const [now, setNow] = useState(Date.now());
  const feedbackRef = useRef<HTMLElement>(null);
  const [pending, setPending] = useState<{
    index: number;
    choice: string;
  } | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, []);
  const me = state?.me;
  useEffect(() => {
    if (!me?.answer) return;
    feedbackRef.current?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [me?.index, !!me?.answer]);
  useEffect(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(`rush-pending-${code}`) ?? "null",
      );
      if (saved?.index === me?.index && !me?.answer) setPending(saved);
      else {
        setPending(null);
        sessionStorage.removeItem(`rush-pending-${code}`);
      }
    } catch {
      setPending(null);
    }
  }, [code, me?.index, me?.answer?.correctOption]);
  async function answer(choice: string) {
    if (!me || busy) return;
    const value = { index: me.index, choice };
    setPending(value);
    try {
      sessionStorage.setItem(`rush-pending-${code}`, JSON.stringify(value));
    } catch {}
    await act("answer", value);
  }
  const racer = state?.players.find((p) => p.id === me?.id);
  const legacy = state?.room.scoringVersion === 1;
  const elapsed = me?.deadlineAt
    ? Math.max(0, 45000 - (Date.parse(me.deadlineAt) - (now + offset)))
    : 45000;
  const availableSpeed = speedPoints(elapsed);
  const seconds = Math.max(
    0,
    Math.ceil(
      ((me?.deadlineAt ? Date.parse(me.deadlineAt) : now + offset) -
        (now + offset)) /
        1000,
    ),
  );
  if (!state)
    return (
      <main id="main" className="player-layout">
        <section className="card center">
          <Mascot />
          <h1>{error ? "Vamos a reconectar" : "Buscando tu paquete…"}</h1>
          <p className="muted" role="status">
            {error || "Un momento, estamos entrando a la red."}
          </p>
          {error && (
            <>
              <button
                className="btn primary full"
                onClick={() => void refresh()}
              >
                REINTENTAR
              </button>
              <Link className="text-link" href={`/?code=${code}`}>
                Entrar con un apodo
              </Link>
            </>
          )}
        </section>
      </main>
    );
  return (
    <main id="main" className="player-layout">
      <div className="game-topline">
        <span className="pill">SALA {code}</span>
        <span className="muted small">{racer?.name}</span>
      </div>
      {error && (
        <div className="notice" role="alert">
          <p>{error}</p>
          <button className="text-link" onClick={() => void refresh()}>
            RECUPERAR ESTADO
          </button>
        </div>
      )}
      {state.room.status === "waiting" ? (
        <section className="card waiting center">
          <span className="eyebrow">PAQUETE CONECTADO</span>
          <Mascot
            avatar={racer?.avatar}
            color={racer?.avatarColor}
            size={148}
          />
          <h1>
            Todo listo,
            <br />
            <span>{racer?.name}.</span>
          </h1>
          <p className="muted">
            Tu anfitrión dará la salida. Mientras tanto, tu paquete ya está
            calentando motores.
          </p>
          <div className="waiting-status">
            <span className="live-dot" /> {state.players.length}/40 conectados
          </div>
          <div className="mini-rules">
            <strong>Antes de salir</strong>
            <p>
              12 preguntas · 45 segundos por pregunta.
              <br />
              Cada acierto suma 100 puntos
              {legacy ? "." : " + bonos por rapidez y racha."}
              <br />
              Lee las explicaciones con calma: ese tiempo no cuenta.
            </p>
          </div>
          <ScoringGuide legacy={legacy} />
        </section>
      ) : state.room.status === "finished" ? (
        <>
          <section className="finish-hero center">
            <span className="eyebrow">¡CARRERA COMPLETADA!</span>
            <Mascot
              avatar={racer?.avatar}
              color={racer?.avatarColor}
              size={132}
              celebrate
            />
            <h1>¡Bien entregado!</h1>
            <p className="muted">
              Tu paquete recorrió la red y tú aprendiste en el camino.
            </p>
            <div className="result-stats">
              <div>
                <strong>{racer?.points ?? 0}</strong>
                <span>puntos</span>
              </div>
              <div>
                <strong>{racer?.correct ?? 0}/12</strong>
                <span>aciertos</span>
              </div>
              <div>
                <strong>#{racer?.rank ?? "—"}</strong>
                <span>posición</span>
              </div>
            </div>
            <FinishDetails racer={racer} />
          </section>
          <Leaderboard state={state} mine={me?.id} final />
          <Link href="/" className="btn outline full">
            ENTRAR A OTRA CARRERA
          </Link>
        </>
      ) : me?.complete ? (
        <section className="card center">
          <Mascot
            avatar={racer?.avatar}
            color={racer?.avatarColor}
            size={128}
            celebrate
          />
          <h1>¡Terminaste tu recorrido!</h1>
          <p className="muted">
            Tienes {racer?.correct} aciertos y {racer?.points} puntos. El resto
            del grupo sigue en carrera; el podio aparecerá al terminar.
          </p>
          <FinishDetails racer={racer} />
          <div className="waiting-status">
            <span className="live-dot" /> Esperando al grupo
          </div>
        </section>
      ) : me?.question ? (
        <>
          <PlayerScore racer={racer} legacy={legacy} />
          <div className="question-topline">
            <span className="eyebrow">SALTO {me.index + 1} DE 12</span>
            <span
              className={`timer ${seconds <= 10 && !me.answer ? "urgent" : ""}`}
              aria-label={`${seconds} segundos restantes`}
            >
              {me.answer ? "✓ Registrada" : `${seconds} s`}
            </span>
          </div>
          <div className="track question-progress">
            <span style={{ width: `${(me.index / 12) * 100}%` }} />
          </div>
          {!me.answer && !legacy && (
            <div className="speed-opportunity">
              <BoltIcon size={16} />
              <strong>
                {availableSpeed
                  ? `Rapidez: +${availableSpeed} disponibles`
                  : "Acierto: 100 puntos + tu racha"}
              </strong>
              <span>Solo si aciertas</span>
            </div>
          )}
          <section className="card question-card">
            <span className="topic">{me.question.topic}</span>
            <h1>{me.question.prompt}</h1>
            <div className="answers">
              {me.question.options.map((option, i) => {
                const correct = me.answer?.correctOption === option.id;
                const selected =
                  (me.answer?.selected ?? pending?.choice) === option.id;
                return (
                  <button
                    key={option.id}
                    className={`answer-option ${correct ? "correct" : ""} ${selected ? "chosen" : ""} ${selected && me.answer && !me.answer.correct ? "incorrect" : ""}`}
                    disabled={busy || !!me.answer || !!pending || seconds === 0}
                    onClick={() => void answer(option.id)}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span>{option.text}</span>
                    {correct && <span aria-label="Respuesta correcta">✓</span>}
                  </button>
                );
              })}
            </div>
          </section>
          {me.answer ? (
            <section
              ref={feedbackRef}
              className={`feedback ${me.answer.correct ? "success" : ""}`}
              aria-live="polite"
            >
              <h2>
                {me.answer.correct
                  ? me.answer.streak >= 3
                    ? "¡Estás en racha!"
                    : "¡Buen salto por la red!"
                  : me.answer.selected === null
                    ? "Se acabó el tiempo. Vamos a aprenderlo."
                    : "Un salto para aprender."}
              </h2>
              {me.answer.correct ? (
                <AnswerReward answer={me.answer} />
              ) : (
                <p className="feedback-reassurance">
                  Tus puntos siguen contigo. El próximo acierto abre una nueva
                  racha.
                </p>
              )}
              <p>{me.answer.explanation}</p>
              <button
                className="btn primary full"
                disabled={busy}
                onClick={() => void act("next", { index: me.index })}
              >
                {busy
                  ? "CONECTANDO…"
                  : me.index === 11
                    ? "TERMINAR MI CARRERA"
                    : "SIGUIENTE PREGUNTA"}{" "}
                <span aria-hidden="true">→</span>
              </button>
              <small className="muted">
                El reloj está en pausa mientras lees esta explicación.
              </small>
            </section>
          ) : pending ? (
            <div className="notice" role="status">
              <p>
                {busy
                  ? "Guardando tu respuesta…"
                  : "Tu respuesta está pendiente de confirmación."}
              </p>
              {!busy && (
                <button
                  className="btn outline full"
                  onClick={() => void answer(pending.choice)}
                >
                  REINTENTAR RESPUESTA
                </button>
              )}
            </div>
          ) : seconds === 0 ? (
            <p className="notice" role="status">
              Confirmando el tiempo con el servidor…
            </p>
          ) : (
            <p className="small muted center">
              Elige una respuesta. Cada salto es una oportunidad de aprender.
            </p>
          )}
          <ScoringGuide legacy={legacy} />
        </>
      ) : (
        <section className="card">
          <p>No encontramos un participante en este navegador.</p>
          <Link href={`/?code=${code}`} className="btn primary">
            ENTRAR A LA SALA
          </Link>
        </section>
      )}
    </main>
  );
}
