"use client";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { raceEvents, raceLayout } from "@/lib/race-display.mjs";
import type { GameState, Racer } from "@/lib/types";
import { Mascot } from "./mascot";
import { Fireworks } from "./fireworks";
import { RacePodium } from "./race-podium";

type Tracker = { code: string; arrivedIds: string[]; finalSeen: boolean };
type Celebration = { id: number; kind: "arrival" | "final"; players: Racer[] };

export function RaceDashboard({
  state,
  error,
  onControls,
  onRefresh,
}: {
  state: GameState;
  error: string;
  onControls: () => void;
  onRefresh: () => void;
}) {
  const fieldRef = useRef<HTMLElement>(null);
  const tracker = useRef<Tracker | null>(null);
  const sequence = useRef(0);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [bounds, setBounds] = useState({ width: 1200, height: 500 });
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [screenMessage, setScreenMessage] = useState("");
  const final = state.room.status === "finished";
  const participants = state.players.length;
  const arrived = state.players.filter(
    (player) => player.answered >= state.room.questionCount,
  ).length;
  const answered = state.players.reduce(
    (total, player) => total + player.answered,
    0,
  );
  const progress = participants
    ? Math.round((answered / (participants * state.room.questionCount)) * 100)
    : 0;
  const layout = raceLayout(bounds.width, bounds.height, participants);
  const safePage = Math.min(page, layout.pageCount - 1);
  const visible = state.players.slice(
    safePage * layout.pageSize,
    (safePage + 1) * layout.pageSize,
  );

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const observer = new ResizeObserver(([entry]) =>
      setBounds({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }),
    );
    observer.observe(field);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setCanFullscreen(!!document.fullscreenEnabled);
    const update = () => setFullscreen(!!document.fullscreenElement);
    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  useEffect(() => {
    let previous = tracker.current;
    if (!previous || previous.code !== state.room.code) {
      previous = null;
      try {
        const saved = JSON.parse(
          sessionStorage.getItem(`rush-projection-${state.room.code}`) ??
            "null",
        );
        if (
          saved?.code === state.room.code &&
          Array.isArray(saved.arrivedIds) &&
          saved.arrivedIds.every((id: unknown) => typeof id === "string") &&
          typeof saved.finalSeen === "boolean"
        )
          previous = saved;
      } catch {}
    }
    const events = raceEvents(previous, state);
    tracker.current = events.tracker;
    try {
      sessionStorage.setItem(
        `rush-projection-${state.room.code}`,
        JSON.stringify(events.tracker),
      );
    } catch {}
    if (events.finale) {
      setCelebration({
        id: ++sequence.current,
        kind: "final",
        players: state.players.filter((player) => player.rank === 1),
      });
    } else if (events.arrivals.length) {
      const id = ++sequence.current;
      setCelebration((current) => {
        if (current?.kind === "final") return current;
        const group = new Map<string, Racer>();
        current?.players.forEach((player) => group.set(player.id, player));
        events.arrivals.forEach((player: Racer) =>
          group.set(player.id, player),
        );
        return { id, kind: "arrival", players: [...group.values()] };
      });
    }
  }, [state]);
  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(
      () => setCelebration(null),
      celebration.kind === "final" ? 8500 : 6000,
    );
    return () => clearTimeout(timer);
  }, [celebration]);
  useEffect(() => {
    setPage((current) => Math.min(current, layout.pageCount - 1));
    if (layout.pageCount <= 1 || paused || celebration) return;
    const timer = setInterval(() => {
      if (!document.hidden)
        setPage((current) => (current + 1) % layout.pageCount);
    }, 10000);
    return () => clearInterval(timer);
  }, [layout.pageCount, paused, celebration]);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setScreenMessage(
        "Puedes ampliar esta ventana con la opción de pantalla completa de tu navegador.",
      );
    }
  }
  async function controls() {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
    }
    onControls();
  }
  const arrivalsName =
    celebration?.players.length === 1
      ? celebration.players[0].name
      : `${celebration?.players.length ?? 0} paquetes`;
  return (
    <main
      id="main"
      className={`race-screen race-screen-${layout.density} ${final ? "race-screen-final" : ""}`}
    >
      <header className="race-screen-header">
        <div className="race-screen-brand">
          <span className="brand-mark" aria-hidden="true">
            ↗
          </span>
          <span>
            packet<span>rush</span>
          </span>
          <span className="race-screen-room">
            SALA <strong>{state.room.code}</strong>
          </span>
        </div>
        <div className="race-screen-actions">
          {error && (
            <button
              className="race-reconnect"
              onClick={onRefresh}
              title={error}
            >
              Reconectando · reintentar
            </button>
          )}
          {canFullscreen && (
            <button
              className="btn outline"
              onClick={() => void toggleFullscreen()}
            >
              <span aria-hidden="true">⛶</span>
              {fullscreen ? "REDUCIR" : "PANTALLA COMPLETA"}
            </button>
          )}
          <button className="btn outline" onClick={() => void controls()}>
            CONTROLES <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>
      <section
        className={`race-screen-stage ${celebration ? "is-celebrating" : ""}`}
        aria-label="Resumen y podio"
      >
        <div className="race-screen-announcement">
          <span className={`pill ${final ? "reward" : ""}`}>
            {final ? "CARRERA FINALIZADA" : "EN VIVO · REDES 1"}
          </span>
          <div role="status" aria-live="polite" aria-atomic="true">
            <h1>
              {celebration?.kind === "arrival"
                ? `¡${arrivalsName} ${celebration.players.length === 1 ? "llegó" : "llegaron"} a la meta!`
                : final
                  ? "¡Tenemos podio!"
                  : "La red está en movimiento."}
            </h1>
            <p>
              {celebration?.kind === "arrival"
                ? "¡Recorrido completo! Celebramos cada llegada."
                : final
                  ? "Cada acierto cuenta. ¡Gran carrera, equipo!"
                  : "Sigue a tu compañero. Cada respuesta es un salto."}
            </p>
          </div>
          {celebration?.kind === "arrival" && (
            <div
              className="arrival-companions"
              aria-label={celebration.players
                .map((player) => player.name)
                .join(", ")}
            >
              {celebration.players.slice(0, 4).map((player) => (
                <Mascot
                  key={player.id}
                  avatar={player.avatar}
                  color={player.avatarColor}
                  size={40}
                />
              ))}
              {celebration.players.length > 4 && (
                <span>+{celebration.players.length - 4}</span>
              )}
            </div>
          )}
        </div>
        <RacePodium
          key={celebration?.id ?? 0}
          players={state.players}
          final={final}
          celebrating={!!celebration}
        />
        <div className="race-screen-metrics">
          <div className="race-metric-values">
            <div>
              <strong>{participants}</strong>
              <span>paquetes</span>
            </div>
            <div>
              <strong>
                {arrived}
                <small>/{participants}</small>
              </strong>
              <span>en la meta</span>
            </div>
            <div>
              <strong>
                {progress}
                <small>%</small>
              </strong>
              <span>del recorrido</span>
            </div>
          </div>
          <div
            className="track"
            role="progressbar"
            aria-label="Avance del grupo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>
      <section
        ref={fieldRef}
        className="race-screen-field"
        aria-label="Carrera de todos los participantes"
      >
        <h2 className="sr-only">
          {final ? "Clasificación final" : "Clasificación y recorrido en vivo"}
        </h2>
        {!participants ? (
          <div className="race-no-players">
            <Mascot size={112} />
            <h2>La pista está lista.</h2>
            <p>El grupo aparecerá aquí al entrar a la sala.</p>
          </div>
        ) : (
          <ol
            className="arena-lanes"
            style={
              {
                "--race-columns": layout.columns,
                "--race-rows": layout.rows,
              } as CSSProperties
            }
          >
            {visible.map((player) => {
              const inGoal = player.answered >= state.room.questionCount;
              const distance = Math.min(
                100,
                (player.answered / state.room.questionCount) * 100,
              );
              return (
                <li
                  className={`arena-lane ${inGoal ? "in-goal" : ""} ${final && player.rank === 1 ? "arena-winner" : ""}`}
                  key={player.id}
                >
                  <div className="arena-lane-header">
                    <span
                      className="arena-position"
                      aria-label={`Posición ${player.rank}`}
                    >
                      {player.rank}
                    </span>
                    <strong className="arena-name" title={player.name}>
                      {player.name}
                    </strong>
                    <span className="arena-inline-progress">
                      {player.answered}/{state.room.questionCount}
                    </span>
                    <span className="arena-lane-score">
                      <strong>{player.points}</strong>
                      <small>PTS</small>
                    </span>
                  </div>
                  <div className="arena-route">
                    <div className="arena-route-track">
                      <span style={{ width: `${distance}%` }} />
                    </div>
                    <span
                      className="arena-route-runner"
                      style={{
                        left: `clamp(0px, calc(${distance}% - var(--runner-size) / 2), calc(100% - var(--runner-size)))`,
                      }}
                    >
                      <Mascot
                        avatar={player.avatar}
                        color={player.avatarColor}
                        size={64}
                      />
                    </span>
                    <span className="arena-finish" aria-label="Meta">
                      ⚑
                    </span>
                  </div>
                  <div className="arena-lane-caption">
                    <span>
                      {player.correct}{" "}
                      {player.correct === 1 ? "acierto" : "aciertos"}
                    </span>
                    <span>
                      {inGoal
                        ? "EN META ✓"
                        : `${player.answered}/${state.room.questionCount} respondidas`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
      <footer className="race-screen-footer">
        <p>
          El recorrido avanza al responder. Los aciertos deciden la posición.
        </p>
        <div className="race-pages">
          {layout.pageCount > 1 ? (
            <>
              <button
                onClick={() =>
                  setPage(
                    (current) =>
                      (current - 1 + layout.pageCount) % layout.pageCount,
                  )
                }
                aria-label="Página anterior de participantes"
              >
                ←
              </button>
              <span>
                {safePage + 1}/{layout.pageCount}
                <small>{paused ? "Pausado" : "Cambio cada 10 s"}</small>
              </span>
              <button
                onClick={() => setPaused((value) => !value)}
                aria-label={
                  paused
                    ? "Reanudar cambio automático"
                    : "Pausar cambio automático"
                }
              >
                {paused ? "▶" : "Ⅱ"}
              </button>
              <button
                onClick={() =>
                  setPage((current) => (current + 1) % layout.pageCount)
                }
                aria-label="Página siguiente de participantes"
              >
                →
              </button>
            </>
          ) : (
            <span>
              {participants}{" "}
              {participants === 1 ? "participante" : "participantes"} en
              pantalla
            </span>
          )}
        </div>
      </footer>
      {screenMessage && (
        <div className="race-screen-message" role="status">
          {screenMessage}
          <button
            onClick={() => setScreenMessage("")}
            aria-label="Cerrar aviso"
          >
            ×
          </button>
        </div>
      )}
      {celebration && <Fireworks eventId={celebration.id} />}
    </main>
  );
}
