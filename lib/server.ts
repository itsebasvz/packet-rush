import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import questions from "@/content/questions.json";
import { validateQuestions } from "./rules.mjs";
import type { GameState } from "./types";

export const PLAYER_COOKIE = "rush_player";
export const HOST_COOKIE = "rush_host";
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 86400,
};
export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("base64url");
export function configured() {
  return !!(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY &&
    process.env.HOST_PASSWORD &&
    process.env.HOST_SESSION_SECRET
  );
}
export function database() {
  if (!configured()) throw new Error("NOT_CONFIGURED");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export function playerHash(request: NextRequest) {
  const value = request.cookies.get(PLAYER_COOKIE)?.value;
  return value && /^[A-Za-z0-9_-]{43}$/.test(value) ? hash(value) : "";
}
function signature(value: string) {
  return createHmac("sha256", process.env.HOST_SESSION_SECRET ?? "")
    .update(value)
    .digest("hex");
}
export function equals(a: string, b: string) {
  return timingSafeEqual(Buffer.from(hash(a)), Buffer.from(hash(b)));
}
export function hostToken() {
  const value = `${Date.now()}.${token()}`;
  return `${value}.${signature(value)}`;
}
export function isHost(request: NextRequest) {
  if (!process.env.HOST_SESSION_SECRET) return false;
  const value = request.cookies.get(HOST_COOKIE)?.value ?? "";
  const [date, nonce, mac, extra] = value.split(".");
  const age = Date.now() - Number(date);
  return (
    !extra &&
    !!nonce &&
    !!mac &&
    Number.isFinite(age) &&
    age >= 0 &&
    age < 86400000 &&
    equals(signature(`${date}.${nonce}`), mac)
  );
}
export async function command(
  action: string,
  payload: Record<string, unknown>,
  session: string,
  host: boolean,
): Promise<GameState> {
  const { data, error } = await database().rpc("rush_command", {
    p_action: action,
    p_payload: payload,
    p_session: session,
    p_host: host,
  });
  if (error) {
    if (error.code === "23505")
      throw new Error(action === "join" ? "NAME_TAKEN" : "CODE_COLLISION");
    const known = Object.keys(messages).find((key) =>
      error.message.includes(key),
    );
    if (known) throw new Error(known);
    console.error("Database operation failed", { action, code: error.code });
    throw new Error("DATABASE_UNAVAILABLE");
  }
  return data as GameState;
}
export function questionBank() {
  return validateQuestions(questions);
}
export const messages: Record<string, [number, string]> = {
  NOT_CONFIGURED: [
    503,
    "La carrera todavía no está configurada. Avisa al anfitrión.",
  ],
  DATABASE_UNAVAILABLE: [
    503,
    "No pudimos conectar con la carrera. Reintenta en unos segundos.",
  ],
  ROOM_NOT_FOUND: [404, "No encontramos esa sala. Revisa el código."],
  ROOM_EXPIRED: [410, "Esta sala venció. Pide al anfitrión una nueva."],
  ROOM_FULL: [409, "La sala ya tiene 40 participantes."],
  ROOM_EMPTY: [409, "Espera a que entre al menos una persona."],
  JOIN_CLOSED: [409, "La carrera ya comenzó. Espera una nueva partida."],
  NAME_TAKEN: [409, "Ese apodo ya está en la sala. Prueba con otro."],
  HOST_REQUIRED: [401, "Entra como anfitrión para hacer esto."],
  PLAYER_REQUIRED: [
    401,
    "Entra a la sala desde este navegador para recuperar tu paquete.",
  ],
  NOT_RUNNING: [409, "La carrera todavía no comienza o ya terminó."],
  STALE_QUESTION: [
    409,
    "La pregunta cambió. Actualiza el estado de la carrera.",
  ],
  ANSWER_FIRST: [409, "Primero responde o espera a que termine el tiempo."],
  INVALID_CHOICE: [400, "Selecciona una de las opciones disponibles."],
  INVALID_ACTION: [400, "La acción no es válida."],
};
