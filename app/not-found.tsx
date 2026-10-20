import Link from "next/link";
import { Mascot } from "@/components/mascot";
export default function NotFound() {
  return (
    <main id="main" className="player-layout center">
      <Mascot />
      <h1>Este paquete tomó otro camino.</h1>
      <p>La página que buscas no existe.</p>
      <Link className="btn primary" href="/">
        VOLVER AL INICIO
      </Link>
    </main>
  );
}
