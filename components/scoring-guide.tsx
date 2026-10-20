import { BoltIcon, FlameIcon } from "./game-icons";

export function ScoringGuide({ legacy = false }: { legacy?: boolean }) {
  return (
    <details className="scoring-guide">
      <summary>
        Cómo sumar puntos <span aria-hidden="true">＋</span>
      </summary>
      <div className="scoring-guide-body">
        <p>
          <strong>100 puntos</strong> por respuesta correcta. Un error o el
          tiempo agotado suman cero.
        </p>
        {!legacy && (
          <>
            <div className="scoring-rule">
              <BoltIcon />
              <div>
                <strong>Rapidez, solo si aciertas</strong>
                <p>Hasta 5 s: +30 · hasta 10 s: +20 · hasta 20 s: +10.</p>
              </div>
            </div>
            <div className="scoring-rule">
              <FlameIcon />
              <div>
                <strong>Aciertos seguidos, más puntos</strong>
                <p>
                  Racha de 3: +10 · de 4: +15 · de 5 o más: +20 por acierto.
                </p>
              </div>
            </div>
            <p>
              Un error reinicia la racha. Tus puntos acumulados se conservan.
            </p>
          </>
        )}
        <p>
          El total de puntos decide la posición. El tiempo dedicado a responder
          desempata. Lee las explicaciones con calma: ese tiempo no afecta los
          bonos ni el desempate.
        </p>
      </div>
    </details>
  );
}
