import type { Racer } from "@/lib/types";
import { Mascot } from "./mascot";

export function RacePodium({
  players,
  final = false,
  celebrating = false,
}: {
  players: Racer[];
  final?: boolean;
  celebrating?: boolean;
}) {
  const started = final || players.some((player) => player.answered > 0);
  return (
    <section
      className={`race-podium ${celebrating ? "podium-celebrating" : ""}`}
      aria-label={final ? "Podio final" : "Podio provisional"}
    >
      <span className="podium-caption">
        {final ? "EL PODIO FINAL" : "PODIO PROVISIONAL"}
      </span>
      <div className="podium-platforms">
        {[2, 1, 3].map((rank) => {
          const group = started
            ? players.filter((player) => player.rank === rank)
            : [];
          const leader = group[0];
          const names = group.map((player) => player.name).join(", ");
          return (
            <div
              className={`podium-slot podium-slot-${rank} ${leader ? "occupied" : ""}`}
              key={rank}
            >
              <div className="podium-person">
                {leader ? (
                  <>
                    <Mascot
                      avatar={leader.avatar}
                      color={leader.avatarColor}
                      size={56}
                    />
                    <strong title={names}>
                      {group.length > 1
                        ? `${leader.name} +${group.length - 1}`
                        : leader.name}
                    </strong>
                    <span>
                      {leader.points} pts{group.length > 1 ? " · empate" : ""}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="podium-placeholder" aria-hidden="true">
                      ?
                    </span>
                    <strong>{started ? "—" : "Por descubrir"}</strong>
                  </>
                )}
              </div>
              <div className="podium-step">
                <span>{rank === 1 ? "★" : rank}</span>
                <span className="sr-only">
                  Puesto {rank}
                  {group.length ? `: ${names}` : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
