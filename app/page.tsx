import { JoinForm } from "@/components/join-form";
import { Mascot } from "@/components/mascot";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  return (
    <main id="main" className={`home-layout ${code ? "joining" : ""}`}>
      <section className="hero">
        <span className="eyebrow">
          <span className="live-dot" /> REDES DE COMPUTADORAS 1
        </span>
        <h1>
          Pequeño paquete.
          <br />
          <span>Gran carrera.</span>
        </h1>
        <p className="hero-description">
          Recorre la red, pon a prueba lo que sabes y lleva tu paquete hasta lo
          más alto del podio.
        </p>
        <div className="hero-art" aria-hidden="true">
          <span className="orbit-node node-one">01</span>
          <span className="orbit-node node-two">10</span>
          <span className="orbit-node node-three">11</span>
          <div className="art-halo" />
          <Mascot size={188} />
          <span className="floating-label">¡Próxima parada: el servidor!</span>
          <span className="art-star star-one">✦</span>
          <span className="art-star star-two">✦</span>
        </div>
        <div className="hero-facts">
          <span>
            <strong>12</strong> preguntas
          </span>
          <span>
            <strong>45 s</strong> por pregunta
          </span>
          <span>
            <strong>40</strong> jugadores
          </span>
        </div>
      </section>
      <JoinForm
        initialCode={
          typeof code === "string" ? code.toUpperCase().slice(0, 6) : ""
        }
      />
      <section className="how-to">
        <div>
          <span className="step-number">1</span>
          <h3>Conéctate</h3>
          <p>Escanea el QR o usa el código de tu anfitrión.</p>
        </div>
        <div>
          <span className="step-number">2</span>
          <h3>Responde y avanza</h3>
          <p>OSI, dispositivos y topologías. Cada acierto cuenta.</p>
        </div>
        <div>
          <span className="step-number">3</span>
          <h3>Encuentra tu lugar</h3>
          <p>Aciertos, rapidez y rachas. ¡Cada salto suma!</p>
        </div>
      </section>
    </main>
  );
}
