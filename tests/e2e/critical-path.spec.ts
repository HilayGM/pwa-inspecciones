import { expect, test } from "@playwright/test";

test("dashboard muestra el encabezado y las inspecciones sintÃ©ticas", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Laboratorio de Redes", level: 3 })).toBeVisible();
  await expect(page.getByText("inspection-001")).toBeVisible();
});

test("el listado carga las inspecciones y permite abrir su detalle", async ({ page }) => {
  await page.goto("/inspecciones");
  await expect(page.getByRole("heading", { name: "Listado de inspecciones", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Laboratorio de Redes", level: 3 })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page.getByRole("link", { name: "Ver detalle" }).first().click();
  await expect(page).toHaveURL(/\/inspecciones\/inspection-001$/);
  await expect(page.getByRole("heading", { name: "Laboratorio de Redes", level: 1 })).toBeVisible();
  await expect(page.getByText("Registro inspection-001")).toBeVisible();
  await expect(page.getByText("2026-08-28")).toBeVisible();
});

test("el Service Worker sirve el shell del dashboard al quedar offline", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio", level: 1 })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker?.controller))).toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Inspecciones de laboratorio", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Laboratorio de Redes", level: 3 })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
