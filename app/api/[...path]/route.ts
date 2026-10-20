import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { csvCell, validateName } from "@/lib/rules.mjs";
import {
  command,
  configured,
  cookieOptions,
  database,
  equals,
  hash,
  HOST_COOKIE,
  hostToken,
  isHost,
  messages,
  PLAYER_COOKIE,
  playerHash,
  questionBank,
  token,
} from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
function code(value: unknown) {
  if (typeof value !== "string" || !/^[A-Z0-9]{6}$/.test(value))
    throw new Error("ROOM_NOT_FOUND");
  return value;
}
function fail(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const known = messages[message];
  if (known) return json({ error: known[1] }, known[0]);
  console.error("Request failed", {
    kind: error instanceof Error ? error.name : "Unknown",
  });
  return json(
    { error: "No se pudo completar la acción. Intenta de nuevo." },
    500,
  );
}
export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname;
  try {
    if (path === "/api/health") return json({ configured: configured() });
    if (path === "/api/host")
      return json({ authenticated: isHost(request), configured: configured() });
    if (path !== "/api/state" && path !== "/api/export")
      return json({ error: "No encontrado." }, 404);
    const host = isHost(request);
    if (path === "/api/export" && !host) throw new Error("HOST_REQUIRED");
    const state = await command(
      "state",
      { code: code(request.nextUrl.searchParams.get("code")) },
      playerHash(request),
      host,
    );
    if (path === "/api/state") return json(state);
    const rows: unknown[][] = [
      [
        "Posición",
        "Apodo",
        "Aciertos",
        "Respondidas",
        "Puntos",
        "Tiempo de desempate (ms)",
      ],
      ...state.players.map((p) => [
        p.rank,
        p.name,
        p.correct,
        p.answered,
        p.points,
        p.timeMs,
      ]),
    ];
    return new NextResponse(
      "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="packet-rush-${state.room.code}.csv"`,
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return fail(error);
  }
}
export async function POST(request: NextRequest) {
  try {
    // Browser mutations are same-origin. CLI tests explicitly send Origin too.
    const origin = request.headers.get("origin");
    let sameOrigin = false;
    try {
      const parsed = new URL(origin ?? "");
      sameOrigin =
        ["http:", "https:"].includes(parsed.protocol) &&
        parsed.host === request.headers.get("host");
    } catch {}
    if (!sameOrigin) return json({ error: "Origen no permitido." }, 403);
    if (Number(request.headers.get("content-length") ?? 0) > 4096)
      return json({ error: "Solicitud demasiado grande." }, 413);
    const text = await request.text();
    if (text.length > 4096)
      return json({ error: "Solicitud demasiado grande." }, 413);
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(text || "{}");
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new Error();
    } catch {
      return json({ error: "Solicitud inválida." }, 400);
    }
    const path = request.nextUrl.pathname;
    if (path === "/api/session") {
      const response = json({ ready: true });
      if (!playerHash(request))
        response.cookies.set(PLAYER_COOKIE, token(), cookieOptions);
      return response;
    }
    if (path === "/api/host") {
      if (body.logout) {
        const response = json({ authenticated: false });
        response.cookies.set(HOST_COOKIE, "", { ...cookieOptions, maxAge: 0 });
        return response;
      }
      if (!configured()) throw new Error("NOT_CONFIGURED");
      const good =
        typeof body.password === "string" &&
        equals(body.password, process.env.HOST_PASSWORD!);
      const ip =
        request.headers.get("x-vercel-forwarded-for") ??
        request.headers.get("x-forwarded-for")?.split(",")[0] ??
        "local";
      const { data: allowed, error } = await database().rpc("rush_login", {
        p_identity: hash(ip),
        p_success: good,
      });
      if (error) throw new Error("DATABASE_UNAVAILABLE");
      if (!allowed)
        return json(
          {
            error:
              "Demasiados intentos. Espera 15 minutos antes de volver a entrar.",
          },
          429,
        );
      if (!good) return json({ error: "La contraseña no coincide." }, 401);
      const response = json({ authenticated: true });
      response.cookies.set(HOST_COOKIE, hostToken(), cookieOptions);
      return response;
    }
    if (path !== "/api/game") return json({ error: "No encontrado." }, 404);
    const action = body.action;
    if (
      typeof action !== "string" ||
      !["create", "join", "start", "finish", "answer", "next"].includes(action)
    )
      throw new Error("INVALID_ACTION");
    const host = isHost(request);
    const session = playerHash(request);
    if (["create", "start", "finish"].includes(action) && !host)
      throw new Error("HOST_REQUIRED");
    if (["join", "answer", "next"].includes(action) && !session)
      throw new Error("PLAYER_REQUIRED");
    if (action === "create") {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      for (let i = 0; i < 5; i++) {
        const roomCode = Array.from(
          { length: 6 },
          () => alphabet[randomInt(alphabet.length)],
        ).join("");
        try {
          return json(
            await command(
              "create",
              { code: roomCode, questions: questionBank() },
              session,
              true,
            ),
          );
        } catch (error) {
          if (!(error instanceof Error) || error.message !== "CODE_COLLISION")
            throw error;
        }
      }
      throw new Error("DATABASE_UNAVAILABLE");
    }
    const payload: Record<string, unknown> = { code: code(body.code) };
    if (action === "join") {
      try {
        payload.name = validateName(body.name);
      } catch (error) {
        return json({ error: (error as Error).message }, 400);
      }
      if (
        !["packet", "robot", "rocket", "computer"].includes(String(body.avatar))
      )
        return json({ error: "Elige un avatar." }, 400);
      payload.avatar = body.avatar;
    }
    if (action === "answer" || action === "next") {
      if (
        typeof body.index !== "number" ||
        !Number.isInteger(body.index) ||
        body.index < 0 ||
        body.index > 11
      )
        throw new Error("STALE_QUESTION");
      payload.index = body.index;
      if (action === "answer") {
        if (
          body.choice !== null &&
          (typeof body.choice !== "string" || !/^[a-d]$/.test(body.choice))
        )
          throw new Error("INVALID_CHOICE");
        payload.choice = body.choice;
      }
    }
    return json(await command(action, payload, session, host));
  } catch (error) {
    return fail(error);
  }
}
