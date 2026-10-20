"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/client";
import type { GameState } from "@/lib/types";
import { useGame } from "./use-game";
import { Mascot } from "./mascot";
import { Leaderboard } from "./leaderboard";
export function HostPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [localBusy, setLocalBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [url, setUrl] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);
  const [copied, setCopied] = useState(false);
  const { state, error, busy, act, refresh } = useGame(
    authenticated ? code : "",
  );
  useEffect(() => {
    api<{ authenticated: boolean; configured: boolean }>("host")
      .then((data) => {
        setAuthenticated(data.authenticated);
        if (!data.configured)
          setLocalError(
            "La configuración del juego está pendiente. Sigue la preparación indicada en el README.",
          );
      })
      .catch((e) => setLocalError(e.message))
      .finally(() => setLoaded(true));
    try {
      setCode(localStorage.getItem("rush-host-room") ?? "");
    } catch {}
  }, []);
  useEffect(() => {
    if (!code) return;
    const target = `${window.location.origin}/?code=${code}`;
    setUrl(target);
    let live = true;
    QRCode.toDataURL(target, {
      width: 240,
      margin: 2,
      color: { dark: "#1F1F1F", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((value) => {
        if (live) setQr(value);
      })
      .catch(() => {
        if (live) setQr("");
      });
    return () => {
      live = false;
    };
  }, [code]);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLocalBusy(true);
    setLocalError("");
    try {
      await api("host", { password });
      setAuthenticated(true);
      setPassword("");
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setLocalBusy(false);
    }
  }
  async function create() {
    setLocalBusy(true);
    setLocalError("");
    setConfirmClose(false);
    try {
      const data = await api<GameState>("game", { action: "create" });
      setCode(data.room.code);
      try {
        localStorage.setItem("rush-host-room", data.room.code);
      } catch {}
    } catch (e) {
      setLocalError((e as Error).message);
    } finally {
      setLocalBusy(false);
    }
  }
  if (!loaded)
    return (
      <main id="main" className="player-layout">
        <p role="status">Conectando con el panel…</p>
      </main>
    );
  if (!authenticated)
    return (
      <main id="main" className="player-layout">
        <section className="card">
          <Mascot avatar="robot" />
          <span className="eyebrow">CENTRO DE CONTROL</span>
          <h1>Hola, anfitrión.</h1>
          <p className="muted">Prepara la sala y da la salida a tu grupo.</p>
          <form onSubmit={login}>
            <label htmlFor="password">Contraseña del anfitrión</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {localError && (
              <p className="notice" role="alert">
                {localError}
              </p>
            )}
            <button className="btn primary full" disabled={localBusy}>
              {localBusy ? "ENTRANDO…" : "ENTRAR AL PANEL"}
            </button>
          </form>
        </section>
      </main>
    );
  return (
    <main id="main" className="host-layout">
      <div className="host-title">
        <div>
          <span className="eyebrow">CENTRO DE CONTROL</span>
          <h1>La red está en tus manos.</h1>
          <p className="muted">
            Una sala, todo tu grupo y una carrera por aprender.
          </p>
        </div>
        <button
          className="btn outline"
          onClick={async () => {
            try {
              await api("host", { logout: true });
              setAuthenticated(false);
            } catch (e) {
              setLocalError((e as Error).message);
            }
          }}
        >
          SALIR
        </button>
      </div>
      {(localError || error) && (
        <div className="notice" role="alert">
          <p>{localError || error}</p>
          {code && (
            <button className="text-link" onClick={() => void refresh()}>
              REINTENTAR
            </button>
          )}
        </div>
      )}
      {!code ? (
        <section className="card center empty-host">
          <Mascot avatar="robot" size={128} />
          <h2>Tu próxima carrera empieza aquí.</h2>
          <p className="muted">Crea una sala y comparte el QR con tu grupo.</p>
          <button
            className="btn primary"
            disabled={localBusy}
            onClick={() => void create()}
          >
            {localBusy ? "CREANDO…" : "CREAR SALA"}
          </button>
        </section>
      ) : (
        <div className="host-grid">
          <aside className="card room-card center">
            <span className="eyebrow">CÓDIGO DE LA SALA</span>
            <h2 className="room-code">{code}</h2>
            {qr && (
              <img
                src={qr}
                alt={`QR para entrar a la sala ${code}`}
                width={240}
                height={240}
                className="qr"
              />
            )}
            <p className="muted small">Escanea el QR o entra al enlace:</p>
            <a className="room-url" href={url}>
              {url}
            </a>
            <button
              className="btn outline full"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  setLocalError(
                    "No pudimos copiar el enlace. Puedes seleccionarlo y copiarlo manualmente.",
                  );
                }
              }}
            >
              {copied ? "¡ENLACE COPIADO!" : "COPIAR ENLACE"}
            </button>
            <span className="pill">
              {state?.players.length ?? 0}/40 participantes
            </span>
            {state?.room.status === "waiting" && (
              <button
                className="btn primary full"
                disabled={busy || !state.players.length}
                onClick={() => void act("start")}
              >
                DAR LA SALIDA →
              </button>
            )}
            {state?.room.status === "running" && (
              <>
                <div className="waiting-status">
                  <span className="live-dot" /> Carrera en curso
                </div>
                {confirmClose ? (
                  <div className="notice">
                    <p>
                      ¿Cerrar ahora? Las preguntas pendientes contarán como
                      incorrectas.
                    </p>
                    <button
                      className="btn primary full"
                      disabled={busy}
                      onClick={async () => {
                        await act("finish");
                        setConfirmClose(false);
                      }}
                    >
                      SÍ, TERMINAR CARRERA
                    </button>
                    <button
                      className="text-link"
                      onClick={() => setConfirmClose(false)}
                    >
                      Seguir jugando
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn outline full"
                    onClick={() => setConfirmClose(true)}
                  >
                    TERMINAR CARRERA
                  </button>
                )}
              </>
            )}
            {state?.room.status === "finished" && (
              <>
                <span className="pill reward">¡Carrera terminada!</span>
                <a
                  href={`/api/export?code=${code}`}
                  className="btn outline full"
                >
                  DESCARGAR RESULTADOS CSV
                </a>
                <button
                  className="btn primary full"
                  disabled={localBusy}
                  onClick={() => void create()}
                >
                  CREAR OTRA CARRERA
                </button>
              </>
            )}
            {!state && error && (
              <button
                className="btn outline full"
                disabled={localBusy}
                onClick={() => void create()}
              >
                CREAR NUEVA SALA
              </button>
            )}
            <p className="small muted">
              12 preguntas · 45 s por pregunta.
              <br />
              Los aciertos mandan; el tiempo desempata.
              <br />
              La sala vence después de 24 horas.
            </p>
          </aside>
          <section>
            {state ? (
              <Leaderboard
                state={state}
                final={state.room.status === "finished"}
              />
            ) : (
              <section className="card">
                <p role="status">Cargando sala…</p>
              </section>
            )}
            {state?.room.status === "waiting" && (
              <section className="card host-tips">
                <h2>Antes de dar la salida</h2>
                <p>
                  Asegúrate de que todos aparezcan en la lista. Cada persona
                  verá las preguntas en su celular y avanzará a su ritmo. Puedes
                  proyectar este panel para seguir la carrera.
                </p>
                <p className="muted">
                  Pídeles que mantengan la misma pestaña abierta. Si recargan,
                  recuperarán su paquete.
                </p>
              </section>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
