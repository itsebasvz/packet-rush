import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = (process.env.TEST_BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);
if (!process.env.HOST_PASSWORD) throw Error("Falta HOST_PASSWORD.");
const bank = JSON.parse(
  readFileSync(new URL("../content/questions.json", import.meta.url)),
);
class Browser {
  cookie = "";
  async request(path, body) {
    const start = performance.now();
    const response = await fetch(base + "/api/" + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        Cookie: this.cookie,
        Origin: new URL(base).origin,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) {
      const jar = new Map(
        this.cookie
          .split("; ")
          .filter(Boolean)
          .map((s) => s.split("=")),
      );
      for (const c of cookies) {
        const [k, v] = c.split(";")[0].split("=");
        jar.set(k, v);
      }
      this.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
    }
    const data = await response.json();
    if (!response.ok) throw Error(`${response.status}: ${data.error}`);
    durations.push(performance.now() - start);
    return data;
  }
}
const durations = [];
const host = new Browser();
await host.request("host", { password: process.env.HOST_PASSWORD });
const created = await host.request("game", { action: "create" });
const code = created.room.code;
console.log(`Sala de prueba ${code}: 40 jugadores.`);
try {
  const players = Array.from({ length: 40 }, () => new Browser());
  await Promise.all(
    players.map(async (p, i) => {
      await p.request("session", {});
      await p.request("game", {
        action: "join",
        code,
        name: `Carga ${i + 1}`,
        avatar: "packet",
      });
    }),
  );
  await host.request("game", { action: "start", code });
  for (let index = 0; index < 12; index++) {
    await Promise.all(
      players.map(async (p, i) => {
        const state = await p.request(`state?code=${code}`);
        assert.equal(state.me.index, index);
        const choice = i % 5 === 0 ? "not-used" : bank[index].correctOption;
        const actual =
          choice === "not-used"
            ? bank[index].options.find(
                (o) => o.id !== bank[index].correctOption,
              ).id
            : choice;
        const answer = { action: "answer", code, index, choice: actual };
        await p.request("game", answer);
        if (index === 0) await p.request("game", answer);
        await p.request("game", { action: "next", code, index });
      }),
    );
  }
  const state = await host.request(`state?code=${code}`);
  assert.equal(state.room.status, "finished");
  assert.equal(state.players.length, 40);
  assert(state.players.every((p) => p.answered === 12 && p.complete));
  assert.equal(state.players.filter((p) => p.points === 1200).length, 32);
  const snapshots = await Promise.all(
    players.slice(0, 5).map((p) => p.request(`state?code=${code}`)),
  );
  snapshots.forEach((s) => assert.deepEqual(s.players, state.players));
  durations.sort((a, b) => a - b);
  console.log(
    `HTTP OK: ${durations.length} solicitudes; p95 ${Math.round(durations[Math.floor(durations.length * 0.95)])} ms; ranking consistente.`,
  );
} finally {
  await host.request("game", { action: "finish", code });
  console.log(
    `La sala de prueba ${code} quedó cerrada; no se borraron otras partidas.`,
  );
}
