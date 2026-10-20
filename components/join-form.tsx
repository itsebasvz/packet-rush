"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";
import {
  avatars,
  avatarColors,
  isAvatar,
  isAvatarColor,
} from "@/lib/appearance";
import { validateName } from "@/lib/rules.mjs";
import { Mascot } from "./mascot";
import type { Avatar, AvatarColor, GameState } from "@/lib/types";

export function JoinForm({ initialCode = "" }: { initialCode?: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [roomCode, setCode] = useState(initialCode);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<Avatar>("packet");
  const [avatarColor, setAvatarColor] = useState<AvatarColor>("blue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  useEffect(() => {
    let live = true;
    try {
      const saved = JSON.parse(
        localStorage.getItem("rush-appearance") ?? "null",
      );
      if (isAvatar(saved?.avatar)) setAvatar(saved.avatar);
      if (isAvatarColor(saved?.color)) setAvatarColor(saved.color);
    } catch {}
    api("session", {})
      .then(() => {
        if (live) setReady(true);
      })
      .catch(() => {
        if (live) setSessionError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  function choose(nextAvatar: Avatar, nextColor: AvatarColor) {
    setAvatar(nextAvatar);
    setAvatarColor(nextColor);
    try {
      localStorage.setItem(
        "rush-appearance",
        JSON.stringify({ avatar: nextAvatar, color: nextColor }),
      );
    } catch {}
  }
  function changeStep(next: 1 | 2) {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur();
    setError("");
    setStep(next);
    requestAnimationFrame(() => {
      headingRef.current?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    let nickname: string;
    try {
      nickname = validateName(name);
      if (!/^[A-Z0-9]{6}$/.test(roomCode))
        throw new Error("Revisa el código: debe tener seis letras o números.");
    } catch (event) {
      setError((event as Error).message);
      return;
    }
    setName(nickname);
    if (step === 1) {
      changeStep(2);
      return;
    }
    if (!ready) {
      setSessionError(true);
      return;
    }
    setBusy(true);
    try {
      const state = await api<GameState>("game", {
        action: "join",
        code: roomCode,
        name: nickname,
        avatar,
        avatarColor,
      });
      router.push(`/play/${state.room.code}`);
      router.refresh();
    } catch (event) {
      setError((event as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      className={`join-form card join-step-${step}`}
      aria-labelledby="join-heading"
      aria-busy={busy}
    >
      <ol className="join-steps" aria-label="Pasos para entrar">
        <li
          aria-current={step === 1 ? "step" : undefined}
          className={step === 1 ? "current" : "done"}
        >
          <span aria-hidden="true">{step === 1 ? "1" : "✓"}</span>Tu entrada
        </li>
        <li
          aria-current={step === 2 ? "step" : undefined}
          className={step === 2 ? "current" : ""}
        >
          <span aria-hidden="true">2</span>Tu compañero
        </li>
      </ol>
      <header className="join-heading">
        <h2 id="join-heading" ref={headingRef} tabIndex={-1}>
          {step === 1
            ? "Tu próxima aventura empieza aquí."
            : "Dale tu estilo a la carrera."}
        </h2>
        <p className="muted">
          {step === 1
            ? "Entra con el código de tu grupo y el apodo que todos verán."
            : "Ocho compañeros. Cinco colores. Una combinación muy tuya."}
        </p>
      </header>
      {step === 1 ? (
        <div className="join-fields">
          <div className="form-field">
            <label htmlFor="room-code">Código de la sala</label>
            <input
              id="room-code"
              name="code"
              value={roomCode}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 6),
                )
              }
              placeholder="ABC234"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={6}
              minLength={6}
              required
              className="code-input"
              aria-describedby="code-hint"
            />
            <small id="code-hint">
              Son los seis caracteres que comparte tu anfitrión.
            </small>
          </div>
          <div className="form-field">
            <label htmlFor="nickname">Tu apodo</label>
            <input
              id="nickname"
              name="nickname"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Así te verá tu grupo"
              autoComplete="nickname"
              autoCorrect="off"
              minLength={2}
              maxLength={20}
              required
              aria-describedby="nickname-hint"
            />
            <small id="nickname-hint">
              De 2 a 20 caracteres. ¡Hazlo reconocible!
            </small>
          </div>
          <div className="join-next-preview">
            <span className="join-preview-icon" aria-hidden="true">
              <Mascot avatar={avatar} color={avatarColor} size={48} />
            </span>
            <div>
              <strong>Después viene lo divertido.</strong>
              <p>Elige tu compañero y dale color.</p>
            </div>
            <span aria-hidden="true">→</span>
          </div>
        </div>
      ) : (
        <div className="join-customization">
          <div className="join-identity">
            <div>
              <strong>{name}</strong>
              <span>SALA {roomCode}</span>
            </div>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => changeStep(1)}
            >
              Editar datos
            </button>
          </div>
          <div className="companion-preview">
            <div className="companion-preview-art" aria-hidden="true">
              <Mascot avatar={avatar} color={avatarColor} size={104} />
            </div>
            <div className="companion-preview-copy">
              <span className="eyebrow">TU COMPAÑERO</span>
              <h3 aria-live="polite">
                {avatars[avatar].name}{" "}
                <span>· {avatarColors[avatarColor].name}</span>
              </h3>
              <p>{avatars[avatar].description}</p>
            </div>
          </div>
          <fieldset className="companion-fieldset" disabled={busy}>
            <legend>¿Quién te acompaña?</legend>
            <div className="avatar-picker">
              {(Object.keys(avatars) as Avatar[]).map((id) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={id === avatar}
                  aria-label={avatars[id].name}
                  className={`avatar-option ${id === avatar ? "selected" : ""}`}
                  onClick={() => choose(id, avatarColor)}
                >
                  <span aria-hidden="true">
                    <Mascot avatar={id} color={avatarColor} size={48} />
                  </span>
                  <span className="avatar-name">{avatars[id].name}</span>
                  {id === avatar && (
                    <span className="avatar-check" aria-hidden="true">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="companion-fieldset" disabled={busy}>
            <legend>
              Elige su color <span>{avatarColors[avatarColor].name}</span>
            </legend>
            <div className="color-picker">
              {(Object.keys(avatarColors) as AvatarColor[]).map((id) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={id === avatarColor}
                  aria-label={`Color ${avatarColors[id].name}`}
                  className={`color-option ${id === avatarColor ? "selected" : ""}`}
                  onClick={() => choose(avatar, id)}
                >
                  <span
                    className="color-swatch"
                    style={{
                      backgroundColor: avatarColors[id].body,
                      color: avatarColors[id].eyes,
                    }}
                    aria-hidden="true"
                  >
                    {id === avatarColor ? "✓" : ""}
                  </span>
                  <span>{avatarColors[id].name}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {sessionError && !ready && (
        <div className="notice" role="alert">
          <p>No pudimos preparar tu conexión. Tus elecciones siguen aquí.</p>
          <button
            type="button"
            className="text-link"
            onClick={async () => {
              try {
                await api("session", {});
                setReady(true);
                setSessionError(false);
              } catch {
                setSessionError(true);
              }
            }}
          >
            REINTENTAR CONEXIÓN
          </button>
        </div>
      )}
      <div className="join-actions">
        <button
          className="btn primary full"
          disabled={busy || (step === 2 && !ready)}
        >
          {busy
            ? "CONECTANDO…"
            : step === 1
              ? "PERSONALIZAR COMPAÑERO"
              : "ENTRAR A LA SALA"}
          <span aria-hidden="true">→</span>
        </button>
        <p className="small muted center">
          {step === 1
            ? "Tu apodo identifica tu paquete durante la partida."
            : "Sin cuentas ni descargas. Tu anfitrión dará la salida."}
        </p>
      </div>
    </form>
  );
}
