import type { Racer, Answer } from "@/lib/types";
import { formatRaceTime } from "@/lib/rules.mjs";
import { Mascot } from "./mascot";
import { BoltIcon, ClockIcon, FlameIcon } from "./game-icons";

export function PlayerScore({
  racer,
  legacy = false,
}: {
  racer?: Racer;
  legacy?: boolean;
}) {
  if (!racer) return null;
  const hot = racer.streak >= 3;
  return (
    <section
      className={`player-score ${hot && !legacy ? "player-score-hot" : ""}`}
      aria-label="Tus puntos y racha"
    >
      <div className="player-score-total">
        <span className="player-score-avatar">
          <Mascot avatar={racer.avatar} color={racer.avatarColor} size={44} />
        </span>
        <div>
          <span className="score-label">TUS PUNTOS</span>
          <strong key={racer.points} className="score-pop">
            {racer.points}
            <small>PTS</small>
          </strong>
        </div>
        <div className="score-earned-bonus">
          {legacy ? (
            `${racer.correct} aciertos`
          ) : (
            <>
              <BoltIcon size={14} />
              <span>+{racer.bonusPoints} en bonos</span>
            </>
          )}
        </div>
      </div>
      {!legacy && (
        <div className="player-streak-row">
          <div
            className={`streak-tag ${hot ? "is-hot" : ""}`}
            key={racer.streak}
          >
            <FlameIcon />
            <strong>
              {hot
                ? `Racha de ${racer.streak}`
                : `${racer.streak}/3 para la racha`}
            </strong>
          </div>
          <div className="streak-dots" aria-hidden="true">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={racer.streak > i ? "filled" : ""} />
            ))}
          </div>
          <span className="streak-next">
            {racer.streak >= 5
              ? "+20 por acierto"
              : racer.streak >= 3
                ? `Próximo: +${racer.streak === 3 ? 15 : 20}`
                : "¡Encadena aciertos!"}
          </span>
        </div>
      )}
    </section>
  );
}

export function AnswerReward({ answer }: { answer: Answer }) {
  return (
    <div
      className={`answer-reward ${answer.streak >= 3 ? "reward-hot" : ""}`}
      key={`${answer.streak}-${answer.points}`}
    >
      <div className="answer-reward-heading">
        <span className="score-label">ESTE SALTO SUMÓ</span>
        <span>
          <ClockIcon />
          {(answer.elapsedMs / 1000).toFixed(1)} s
        </span>
      </div>
      <div className="answer-reward-total">
        <strong>+{answer.points ?? 100}</strong>
        <span>puntos</span>
        {answer.streak >= 3 && (
          <span className="streak-tag is-hot">
            <FlameIcon />
            RACHA {answer.streak}
          </span>
        )}
      </div>
      <div className="answer-reward-parts">
        <div>
          <span>Acierto</span>
          <strong>+{answer.basePoints ?? 100}</strong>
        </div>
        <div className={answer.speedBonus ? "earned" : ""}>
          <span>
            <BoltIcon size={14} />
            Rapidez
          </span>
          <strong>+{answer.speedBonus ?? 0}</strong>
        </div>
        <div className={answer.streakBonus ? "earned" : ""}>
          <span>
            <FlameIcon size={14} />
            Racha
          </span>
          <strong>+{answer.streakBonus ?? 0}</strong>
        </div>
      </div>
    </div>
  );
}

export function FinishDetails({ racer }: { racer?: Racer }) {
  if (!racer) return null;
  return (
    <div className="finish-details">
      <div>
        <ClockIcon size={20} />
        <strong>{formatRaceTime(racer.finishTimeMs)}</strong>
        <span>
          {racer.finishTimeMs == null
            ? "Recorrido sin completar"
            : "Tiempo de llegada"}
        </span>
      </div>
      <div>
        <FlameIcon size={20} />
        <strong>{racer.bestStreak ?? 0}</strong>
        <span>Mejor racha</span>
      </div>
      <div>
        <BoltIcon size={20} />
        <strong>+{racer.bonusPoints ?? 0}</strong>
        <span>Puntos en bonos</span>
      </div>
    </div>
  );
}
