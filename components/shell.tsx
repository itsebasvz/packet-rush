import Link from "next/link";
export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Packet Rush, inicio">
        <span className="brand-mark" aria-hidden="true">
          ↗
        </span>
        <span>
          packet<span className="brand-accent">rush</span>
          <small>UNA CARRERA POR LA RED</small>
        </span>
      </Link>
      <Link href="/host" className="header-link">
        Anfitrión <span aria-hidden="true">↗</span>
      </Link>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      Sebastián Vázquez <span aria-hidden="true">✦</span> Redes de Computadoras
      1
    </footer>
  );
}
