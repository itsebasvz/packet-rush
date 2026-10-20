"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import { Mascot, avatarNames } from "./mascot";
import type { Avatar, GameState } from "@/lib/types";
export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const [roomCode, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>("packet");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    api("session", {})
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live)
          setError(
            "No pudimos preparar tu sesión. Recarga para volver a intentar.",
          );
      });
    return () => {
      live = false;
    };
  }, []);
  async function join(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const state = await api<GameState>("game", {
        action: "join",
        code: roomCode.trim().toUpperCase(),
        name,
        avatar,
      });
      router.push(`/play/${state.room.code}`);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={join} className="join-form card">
      <div className="section-title">
        <h2>Sube a la carrera</h2>
        <span className="live-dot" aria-hidden="true" />
      </div>
      <p className="muted">Tu paquete, tu apodo y muchas ganas de llegar.</p>
      <label htmlFor="room-code">Código de la sala</label>
      <input
        id="room-code"
        name="code"
        value={roomCode}
        onChange={(e) =>
          setCode(
            e.target.value
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .slice(0, 6),
          )
        }
        placeholder="ABC234"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={6}
        minLength={6}
        required
        className="code-input"
      />
      <label htmlFor="nickname">Tu apodo</label>
      <input
        id="nickname"
        name="nickname"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="¿Cómo te llamamos?"
        autoComplete="nickname"
        minLength={2}
        maxLength={20}
        required
      />
      <fieldset>
        <legend>Elige a tu compañero</legend>
        <div className="avatar-picker">
          {(Object.keys(avatarNames) as Avatar[]).map((key) => (
            <button
              type="button"
              key={key}
              aria-pressed={key === avatar}
              aria-label={avatarNames[key]}
              className={`avatar-option ${key === avatar ? "selected" : ""}`}
              onClick={() => setAvatar(key)}
            >
              <Mascot avatar={key} size={54} />
            </button>
          ))}
        </div>
      </fieldset>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary full" disabled={busy || !ready}>
        {busy ? "CONECTANDO…" : "ENTRAR A LA SALA"}{" "}
        <span aria-hidden="true">→</span>
      </button>
      <p className="small muted center">
        Sin cuentas. Sin descargas. Listo para jugar.
      </p>
    </form>
  );
}
