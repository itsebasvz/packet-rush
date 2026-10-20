"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/client";
import type { GameState } from "@/lib/types";
import { useGame } from "./use-game";
import { Mascot } from "./mascot";
import { Leaderboard } from "./leaderboard";
import { RaceDashboard } from "./race-dashboard";
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
  const [showControls, setShowControls] = useState(false);
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
    setShowControls(false);
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
  const participants = state?.players.length ?? 0;
  const finished =
    state?.players.filter(
      (player) => player.answered >= state.room.questionCount,
    ).length ?? 0;
  const answered =
    state?.players.reduce((total, player) => total + player.answered, 0) ?? 0;
  const totalQuestions = participants * (state?.room.questionCount ?? 12);
  const progress = totalQuestions
    ? Math.round((answered / totalQuestions) * 100)
    : 0;
  const status = state?.room.status;
  const statusLabel =
    status === "running"
      ? "Carrera en curso"
      : status === "finished"
        ? "Carrera finalizada"
        : "Esperando al grupo";

  const projecting =
    authenticated && !!state && status !== "waiting" && !showControls;
  useEffect(() => {
    if (!projecting) return;
    document.body.classList.add("is-projecting");
    return () => document.body.classList.remove("is-projecting");
  }, [projecting]);

  if (!loaded)
    return (
      <main id="main" className="player-layout">
        <p role="status">Conectando con el panel…</p>
      </main>
    );
  if (!authenticated)
    return (
      <main id="main" className="player-layout host-login-layout">
        <section className="card host-login-card">
          <div className="login-mascot">
            <Mascot avatar="robot" size={88} />
          </div>
          <span className="eyebrow">CENTRO DE CONTROL</span>
          <h1>Hola, anfitrión.</h1>
          <p className="muted">Prepara la sala y da la salida a tu grupo.</p>
          <form className="host-login-form" onSubmit={login}>
            <div className="form-field">
              <label htmlFor="password">Contraseña del anfitrión</label>
              <input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {localError && (
              <p className="notice" role="alert">
                {localError}
              </p>
            )}
            <button className="btn primary full" disabled={localBusy}>
              {localBusy ? "ENTRANDO…" : "ENTRAR AL PANEL"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </section>
      </main>
    );
  if (projecting && state)
    return (
      <RaceDashboard
        state={state}
        error={localError || error}
        onControls={() => setShowControls(true)}
        onRefresh={() => void refresh()}
      />
    );
  return (
    <main id="main" className="host-layout">
      <div className="host-title">
        <div>
          <span className="eyebrow">CENTRO DE CONTROL</span>
          <h1>Tu grupo. Una gran carrera.</h1>
          <p className="muted">
            Comparte la sala, da la salida y sigue cada salto.
          </p>
        </div>
        <div className="host-header-actions">
          {state && status !== "waiting" && (
            <button
              className="btn primary"
              onClick={() => setShowControls(false)}
            >
              PROYECTAR CARRERA <span aria-hidden="true">⛶</span>
            </button>
          )}
          <button
            className="btn outline"
            onClick={async () => {
              try {
                await api("host", { logout: true });
                setAuthenticated(false);
              } catch (event) {
                setLocalError((event as Error).message);
              }
            }}
          >
            SALIR
          </button>
        </div>
      </div>
      {(localError || error) && (
        <div className="notice host-notice" role="alert">
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
          <span className="eyebrow">TODO EMPIEZA CON UNA SALA</span>
          <h2>¿Listos para recorrer la red?</h2>
          <p className="muted">
            Crea una sala y comparte el QR con tu grupo.
            <br />
            Hasta 40 participantes, cada quien desde su celular.
          </p>
          <button
            className="btn primary"
            disabled={localBusy}
            onClick={() => void create()}
          >
            {localBusy ? "CREANDO…" : "CREAR SALA"}
            <span aria-hidden="true">＋</span>
          </button>
        </section>
      ) : (
        <>
          <section className="host-overview" aria-label="Resumen de la sala">
            <div className="host-stat">
              <span className="stat-label">PARTICIPANTES</span>
              <strong>
                {participants}
                <small>/40</small>
              </strong>
              <span className="stat-caption">Registrados en esta sala</span>
            </div>
            <div className="host-stat">
              <span className="stat-label">RECORRIDO COMPLETO</span>
              <strong>
                {finished}
                <small>/{participants || "—"}</small>
              </strong>
              <span className="stat-caption">Terminaron sus 12 preguntas</span>
            </div>
            <div className="host-stat">
              <span className="stat-label">AVANCE DEL GRUPO</span>
              <strong>
                {progress}
                <small>%</small>
              </strong>
              <span className="stat-caption">
                {answered} de {totalQuestions} respuestas
              </span>
              <div
                className="track"
                role="progressbar"
                aria-label="Preguntas respondidas por el grupo"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
              >
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>
          <div
            className={`host-grid ${status === "waiting" ? "awaiting-group" : ""}`}
          >
            <section
              className="card host-controls"
              aria-label="Control de la sala"
            >
              <div
                className={`room-status ${status === "finished" ? "is-finished" : ""}`}
              >
                <span className="live-dot" />
                {state ? statusLabel : "Conectando con la sala…"}
              </div>
              <h2>
                {status === "running"
                  ? "La carrera está en marcha"
                  : status === "finished"
                    ? "¡Buen recorrido, equipo!"
                    : "Prepara la salida"}
              </h2>
              <p className="muted">
                {status === "running"
                  ? "Cada participante avanza a su ritmo. Sigue sus aciertos y preguntas respondidas en el panel."
                  : status === "finished"
                    ? "El podio ya está disponible para el grupo. Guarda los resultados o prepara otra partida."
                    : "Espera a que aparezca todo tu grupo en la lista antes de comenzar."}
              </p>
              {status === "waiting" && (
                <>
                  <button
                    className="btn primary full"
                    disabled={busy || !participants}
                    onClick={() => void act("start")}
                  >
                    {busy ? "DANDO LA SALIDA…" : "DAR LA SALIDA"}
                    <span aria-hidden="true">→</span>
                  </button>
                  {!participants && (
                    <p className="control-hint">
                      La salida estará disponible cuando entre la primera
                      persona.
                    </p>
                  )}
                </>
              )}
              {status === "running" &&
                (confirmClose ? (
                  <div className="close-confirmation">
                    <strong>¿Terminar para todo el grupo?</strong>
                    <p>
                      Las preguntas pendientes quedarán sin puntos. Después
                      podrás descargar los resultados.
                    </p>
                    <button
                      className="btn primary full"
                      disabled={busy}
                      onClick={async () => {
                        const result = await act("finish");
                        if (result?.room.status === "finished")
                          setConfirmClose(false);
                      }}
                    >
                      {busy ? "CERRANDO…" : "SÍ, TERMINAR CARRERA"}
                    </button>
                    <button
                      className="btn outline full"
                      disabled={busy}
                      onClick={() => setConfirmClose(false)}
                    >
                      SEGUIR JUGANDO
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn outline full"
                    onClick={() => setConfirmClose(true)}
                  >
                    TERMINAR CARRERA
                  </button>
                ))}
              {status === "finished" && (
                <div className="host-action-stack">
                  <a
                    href={`/api/export?code=${code}`}
                    className="btn primary full"
                  >
                    DESCARGAR RESULTADOS CSV <span aria-hidden="true">↓</span>
                  </a>
                  <button
                    className="btn outline full"
                    disabled={localBusy}
                    onClick={() => void create()}
                  >
                    {localBusy ? "CREANDO…" : "CREAR OTRA CARRERA"}
                  </button>
                </div>
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
              <div className="room-settings">
                <span>
                  <strong>12</strong> preguntas
                </span>
                <span>
                  <strong>45 s</strong> por pregunta
                </span>
              </div>
            </section>
            <section className="card room-card center">
              <div className="room-invite-heading">
                <span className="eyebrow">COMPARTE LA SALA</span>
                <h2>Un código. Todo tu grupo.</h2>
              </div>
              <p
                className="room-code"
                aria-label={`Código de la sala: ${code}`}
              >
                {code}
              </p>
              {qr && (
                <img
                  src={qr}
                  alt={`QR para entrar a la sala ${code}`}
                  width={240}
                  height={240}
                  className="qr"
                />
              )}
              <p className="muted small">Escanea el QR o comparte el enlace.</p>
              <button
                className="btn outline full"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    setLocalError(
                      "No pudimos copiar el enlace. Puedes abrirlo y copiarlo desde la barra del navegador.",
                    );
                  }
                }}
              >
                {copied ? "¡ENLACE COPIADO!" : "COPIAR ENLACE"}
              </button>
              <a
                className="room-url"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                Abrir enlace de la sala <span aria-hidden="true">↗</span>
              </a>
              <p className="room-expiry">
                Esta sala estará disponible durante 24 horas.
              </p>
            </section>

            <div className="host-main">
              {state ? (
                <Leaderboard state={state} final={status === "finished"} />
              ) : (
                <section className="card">
                  <p role="status">Cargando sala…</p>
                </section>
              )}
              <section className="host-tip">
                <span className="tip-symbol" aria-hidden="true">
                  ✦
                </span>
                <div>
                  <strong>
                    {status === "waiting"
                      ? "Todo listo para empezar"
                      : status === "finished"
                        ? "Aprender también cuenta"
                        : "Una carrera para aprender"}
                  </strong>
                  <p>
                    {status === "waiting"
                      ? "Pide al grupo que conserve la misma pestaña. Si recargan, recuperarán su paquete."
                      : status === "finished"
                        ? "Comenta las preguntas que costaron más trabajo y aprovecha las explicaciones para repasar."
                        : "Las explicaciones se leen sin reloj. Los puntos deciden la posición y el tiempo de respuesta desempata."}
                  </p>
                </div>
              </section>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
