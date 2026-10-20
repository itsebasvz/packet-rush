import { test, expect } from "@playwright/test";
import bank from "../../content/questions.json";
test("la entrada funciona en móvil y conserva la sesión al recargar", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Pequeño paquete/ }),
  ).toBeVisible();
  await expect(page.getByLabel("Código de la sala")).toBeVisible();
  await page.getByLabel("Código de la sala").fill("ABC234");
  await page.getByLabel("Tu apodo").fill("Mi paquete");
  await page.getByRole("button", { name: "PERSONALIZAR COMPAÑERO" }).click();
  await expect(
    page.getByRole("button", { name: "Paquetito", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Satélite", exact: true }).click();
  await page.getByRole("button", { name: "Color Menta", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Satélite", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Color Menta", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const horizontal = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  expect(horizontal).toBe(false);
  await expect(
    page.getByRole("button", { name: /ENTRAR A LA SALA/ }),
  ).toBeEnabled();
});
test("las mutaciones de otro origen y las exportaciones anónimas se rechazan", async ({
  request,
}) => {
  const cross = await request.post("/api/game", {
    data: { action: "create" },
    headers: { Origin: "https://example.invalid" },
  });
  expect(cross.status()).toBe(403);
  const exported = await request.get("/api/export?code=ABC234");
  expect(exported.status()).toBe(401);
});
test("dos participantes completan una carrera con QR, reloj, explicaciones y podio", async ({
  browser,
  baseURL,
}) => {
  test.skip(
    !process.env.HOST_PASSWORD,
    "Necesita HOST_PASSWORD y Supabase configurado.",
  );
  const host = await browser.newContext({ baseURL });
  const a = await browser.newContext({
    baseURL,
    viewport: { width: 375, height: 812 },
  });
  const b = await browser.newContext({
    baseURL,
    viewport: { width: 390, height: 844 },
  });
  try {
    const hp = await host.newPage();
    await hp.goto("/host");
    await hp
      .getByLabel("Contraseña del anfitrión")
      .fill(process.env.HOST_PASSWORD!);
    await hp.getByRole("button", { name: "ENTRAR AL PANEL" }).click();
    await hp.getByRole("button", { name: "CREAR SALA", exact: true }).click();
    const code = (await hp.locator(".room-code").innerText()).trim();
    await expect(
      hp.getByAltText(`QR para entrar a la sala ${code}`),
    ).toBeVisible();
    const players = await Promise.all(
      [a, b].map(async (c, i) => {
        const p = await c.newPage();
        await p.goto(`/?code=${code}`);
        await p.getByLabel("Tu apodo").fill(`Navegador ${i + 1}`);
        await p.getByRole("button", { name: "PERSONALIZAR COMPAÑERO" }).click();
        await p.getByRole("button", { name: /ENTRAR A LA SALA/ }).click();
        await expect(
          p.getByRole("heading", { name: /Todo listo/ }),
        ).toBeVisible();
        return p;
      }),
    );
    await hp.getByRole("button", { name: /DAR LA SALIDA/ }).click();
    await Promise.all(
      players.map(async (p, playerIndex) => {
        let dropped = false;
        if (playerIndex === 0)
          await p.route("**/api/game", async (route) => {
            const body = route.request().postDataJSON();
            if (!dropped && body.action === "answer") {
              dropped = true;
              await route.fetch();
              await route.abort("connectionfailed");
            } else await route.continue();
          });
        for (let i = 0; i < 12; i++) {
          await expect(
            p.getByRole("heading", { name: bank[i].prompt, exact: true }),
          ).toBeVisible();
          if (i === 0) {
            await p.reload();
            await expect(
              p.getByRole("heading", { name: bank[i].prompt, exact: true }),
            ).toBeVisible();
          }
          const correct = bank[i].options.find(
            (o) => o.id === bank[i].correctOption,
          )!;
          await p
            .locator(".answer-option")
            .filter({ hasText: correct.text })
            .click();
          await expect(
            p.getByText(bank[i].explanation, { exact: true }),
          ).toBeVisible();
          if (i === 0) {
            await p.reload();
            await expect(
              p.getByText(bank[i].explanation, { exact: true }),
            ).toBeVisible();
          }
          await p
            .getByRole("button", {
              name: i === 11 ? "TERMINAR MI CARRERA" : /SIGUIENTE PREGUNTA/,
            })
            .click();
        }
        await expect(
          p.getByRole("heading", { name: "¡Bien entregado!" }),
        ).toBeVisible({ timeout: 15000 });
        await expect(
          p.getByText("1200", { exact: true }).first(),
        ).toBeVisible();
      }),
    );
    await expect(
      hp.getByRole("link", { name: "DESCARGAR RESULTADOS CSV" }),
    ).toBeVisible({ timeout: 10000 });
  } finally {
    await host.close();
    await a.close();
    await b.close();
  }
});
