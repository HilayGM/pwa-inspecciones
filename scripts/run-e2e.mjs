import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();

// 1. Comprobar si el navegador Chromium de Playwright está disponible en el entorno
let hasChromium = false;
try {
  const executable = chromium.executablePath();
  hasChromium = Boolean(executable && existsSync(executable));
} catch {
  hasChromium = false;
}

if (!hasChromium) {
  console.log("ℹ️ [E2E] Playwright Chromium no está instalado en este entorno.");
  console.log("ℹ️ [E2E] Omitiendo pruebas E2E en este paso.");
  process.exit(0);
}

// 2. Comprobar si existe un build de producción; si no existe, compilar para que el webServer pueda iniciar
const buildId = resolve(root, ".next/BUILD_ID");
if (!existsSync(buildId)) {
  console.log("ℹ️ [E2E] No se detectó build de producción (.next). Compilando con 'npm run build'...");
  const build = spawnSync("npm", ["run", "build"], { stdio: "inherit", shell: true });
  if (build.status !== 0) {
    console.error("❌ [E2E] Falló 'npm run build' necesario para iniciar el servidor de Playwright.");
    process.exit(build.status ?? 1);
  }
}

// 3. Ejecutar las pruebas E2E con Playwright
const args = process.argv.slice(2);
const defaultArgs = ["tests/e2e/", "tests/offline.spec.ts"];
const targetArgs = args.length > 0 ? args : defaultArgs;

console.log(`🚀 [E2E] Ejecutando: npx playwright test ${targetArgs.join(" ")}`);
const testRun = spawnSync("npx", ["playwright", "test", ...targetArgs], {
  stdio: "inherit",
  shell: true,
});

process.exit(testRun.status ?? 0);
