"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="player-layout card">
      <h1>Hagamos otro intento.</h1>
      <p>
        La página no terminó de cargar. Tu partida se guarda en el servidor.
      </p>
      <button className="btn primary" onClick={reset}>
        REINTENTAR
      </button>
    </main>
  );
}
