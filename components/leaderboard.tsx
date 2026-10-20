import type { GameState } from "@/lib/types";
import { Mascot } from "./mascot";
export function Leaderboard({
  state,
  mine,
  final = false,
}: {
  state: GameState;
  mine?: string;
  final?: boolean;
}) {
  return (
    <section
      className="card leaderboard"
      aria-label={final ? "Resultados finales" : "Posiciones de la carrera"}
    >
      <div className="section-title">
        <h2>{final ? "La clasificación" : "Así va la carrera"}</h2>
        <span className="pill">{state.players.length} paquetes</span>
      </div>
      {final && state.players.length > 0 && (
        <div className="podium">
          {state.players
            .filter((p) => p.rank <= 3)
            .map((p) => (
              <div className={`podium-place place-${p.rank}`} key={p.id}>
                <span className="medal">{p.rank === 1 ? "★" : p.rank}</span>
                <Mascot avatar={p.avatar} size={64} celebrate={p.rank === 1} />
                <strong>{p.name}</strong>
                <span>{p.points} pts</span>
              </div>
            ))}
        </div>
      )}
      <ol className="racers">
        {state.players.map((p) => (
          <li key={p.id} className={mine === p.id ? "racer mine" : "racer"}>
            <span className="rank">{p.rank}</span>
            <Mascot avatar={p.avatar} size={38} />
            <div className="racer-details">
              <strong>
                {p.name}
                {mine === p.id && <span className="you"> tú</span>}
              </strong>
              <div className="race-lane">
                <div
                  className="track"
                  role="progressbar"
                  aria-label={`Aciertos de ${p.name}`}
                  aria-valuemin={0}
                  aria-valuemax={12}
                  aria-valuenow={p.correct}
                >
                  <span style={{ width: `${(p.correct / 12) * 100}%` }} />
                </div>
                <span
                  className="packet-marker"
                  aria-hidden="true"
                  style={{
                    left: `clamp(0px, calc(${(p.correct / 12) * 100}% - 12px), calc(100% - 24px))`,
                  }}
                >
                  <Mascot avatar={p.avatar} size={24} />
                </span>
              </div>
              <small>
                {p.correct}/12 aciertos · {p.answered}/12 respondidas
              </small>
            </div>
            <strong className="points">
              {p.points}
              <small>PTS</small>
            </strong>
          </li>
        ))}
      </ol>
      {final && (
        <p className="muted small">
          Gana quien tiene más aciertos. Desempate: menor tiempo al responder.
          Las preguntas pendientes cuentan como 45 s.
        </p>
      )}
    </section>
  );
}
