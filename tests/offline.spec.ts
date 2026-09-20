import { expect, type Page, test } from "@playwright/test";

const inspectionNames = [
  "Laboratorio de Redes",
  "Laboratorio de Electrónica",
  "Laboratorio de Software",
];

async function expectInspections(page: Page) {
  await expect(page.getByRole("article")).toHaveCount(3);

  for (const name of inspectionNames) {
    await expect(page.getByRole("heading", { name, level: 3 })).toBeVisible();
  }
}

test("mantiene las tres inspecciones disponibles sin conexión", async ({ page, context }) => {
  await page.goto("/");

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("navigator.serviceWorker is unavailable");
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  });

  await page.reload({ waitUntil: "networkidle" });

  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("navigator.serviceWorker is unavailable");
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active || registration.active.state !== "activated") {
      throw new Error("The Service Worker is not activated");
    }
  });

  await expectInspections(page);

  await page.reload({ waitUntil: "networkidle" });
  await expectInspections(page);
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expectInspections(page);
  } finally {
    await context.setOffline(false);
  }
});