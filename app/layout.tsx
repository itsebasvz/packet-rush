import type { Metadata } from "next";
import "./fonts.css";
import "./globals.css";
import { Header, Footer } from "@/components/shell";
export const metadata: Metadata = {
  title: "Packet Rush · Una carrera por la red",
  description:
    "Compite con tu clase mientras aprendes OSI, dispositivos y topologías. Doce preguntas, un paquete y toda una red por recorrer.",
  icons: { icon: "/icon.svg" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <a href="#main" className="skip-link">
          Saltar al contenido
        </a>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
