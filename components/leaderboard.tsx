import type { GameState } from "@/lib/types";
import { Mascot } from "./mascot";
import { RacePodium } from "./race-podium";
import { formatRaceTime } from "@/lib/rules.mjs";
import { ClockIcon, FlameIcon } from "./game-icons";

export function Leaderboard({
  state,
  mine,
  final = false,
}: {
  state: GameState;
  mine?: string;
  final?: boolean;
}) {
  const waiting = state.room.status === "waiting";
  return (
    <section
      className={`card leaderboard ${waiting ? "is-waiting" : ""}`}
      aria-label={
        final
          ? "Resultados finales"
          : waiting
            ? "Participantes de la sala"
            : "Posiciones de la carrera"
      }
    >
      <header className="leaderboard-heading">
        <div>
          <span className="eyebrow">
            {final
              ? "EL PODIO DEL GRUPO"
              : waiting
                ? "LISTA DE PARTICIPANTES"
                : "EN VIVO"}
          </span>
          <h2>
            {final
              ? "Resultados de la carrera"
              : waiting
                ? "Tu grupo está llegando"
                : "Así va la carrera"}
          </h2>
          <p className="muted">
            {final
              ? "Cada acierto fue un salto hacia adelante."
              : waiting
                ? "Revisa que todos estén aquí antes de dar la salida."
                : "Sigue sus paquetes y celebra cada acierto."}
          </p>
        </div>
        <span className="pill">
          {state.players.length}{" "}
          {state.players.length === 1 ? "participante" : "participantes"}
        </span>
      </header>
      {final && state.players.length > 0 && (
        <RacePodium players={state.players} final celebrating />
      )}
      {!state.players.length ? (
        <div className="roster-empty">
          <Mascot avatar="packet" size={88} />
          <h3>El primer paquete está por llegar.</h3>
          <p className="muted">
            Comparte el QR o el enlace de la sala.
            <br />
            Los participantes aparecerán aquí.
          </p>
        </div>
      ) : waiting ? (
        <ul className="waiting-roster">
          {state.players.map((player) => (
            <li key={player.id}>
              <span className="roster-avatar">
                <Mascot
                  avatar={player.avatar}
                  color={player.avatarColor}
                  size={42}
                />
              </span>
              <strong>{player.name}</strong>
              <span className="roster-joined">En la sala</span>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="race-columns" aria-hidden="true">
            <span>POS.</span>
            <span>PARTICIPANTE Y RECORRIDO</span>
            <span>PUNTOS</span>
          </div>
          <ol className="racers">
            {state.players.map((player) => (
              <li
                key={player.id}
                className={`racer ${mine === player.id ? "mine" : ""} ${final && player.rank === 1 ? "racer-winner" : ""}`}
              >
                <span className="rank" aria-label={`Posición ${player.rank}`}>
                  {player.rank}
                </span>
                <div className="racer-details">
                  <div className="racer-heading">
                    <strong>
                      {player.name}
                      {mine === player.id && <span className="you"> tú</span>}
                    </strong>
                    {player.streak >= 3 && (
                      <span className="streak-tag is-hot">
                        <FlameIcon size={13} /> {player.streak}
                      </span>
                    )}
                    {player.finishTimeMs != null && (
                      <span className="racer-complete">
                        <ClockIcon size={12} />{" "}
                        {formatRaceTime(player.finishTimeMs)}{" "}
                        <span aria-label="En meta">✓</span>
                      </span>
                    )}
                  </div>
                  <div className="race-lane">
                    <div
                      className="track"
                      role="progressbar"
                      aria-label={`Preguntas respondidas por ${player.name}`}
                      aria-valuemin={0}
                      aria-valuemax={12}
                      aria-valuenow={player.answered}
                    >
                      <span
                        style={{ width: `${(player.answered / 12) * 100}%` }}
                      />
                    </div>
                    <span
                      className="packet-marker"
                      aria-hidden="true"
                      style={{
                        left: `clamp(0px, calc(${(player.answered / 12) * 100}% - 16px), calc(100% - 32px))`,
                      }}
                    >
                      <Mascot
                        avatar={player.avatar}
                        color={player.avatarColor}
                        size={32}
                      />
                    </span>
                  </div>
                  <div className="racer-meta">
                    <span>
                      <strong>{player.correct}</strong> aciertos
                    </span>
                    <span>
                      {player.bonusPoints > 0
                        ? `+${player.bonusPoints} en bonos · `
                        : ""}
                      {player.answered}/12 respondidas
                    </span>
                  </div>
                </div>
                <strong className="points">
                  {player.points}
                  <small>PTS</small>
                </strong>
              </li>
            ))}
          </ol>
        </>
      )}
      {!waiting && (
        <p className="leaderboard-note">
          {state.room.scoringVersion === 1
            ? "Cada acierto suma 100 puntos. El tiempo de respuesta desempata."
            : "Gana el total de puntos: aciertos, rapidez y rachas. El tiempo de respuesta desempata."}{" "}
          El tiempo de llegada incluye las pausas para leer y se muestra como
          referencia.
        </p>
      )}
    </section>
  );
}
