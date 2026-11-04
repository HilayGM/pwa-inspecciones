import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const rawBaseUrl = process.env.SMOKE_URL ?? "http://localhost:3000";
const root = process.cwd();

async function fetchOk(path: string, baseUrl: string): Promise<Response> {
  const url = new URL(path, baseUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} respondió HTTP ${response.status}`);
  }

  return response;
}

async function isServerUp(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(new URL("/", baseUrl));
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

async function ensureServerRunning(targetUrl: string): Promise<{ baseUrl: string; stop: () => Promise<void> }> {
  if (await isServerUp(targetUrl)) {
    return { baseUrl: targetUrl, stop: async () => {} };
  }

  const urlObj = new URL(targetUrl);
  const isLocal = ["localhost", "127.0.0.1", "0.0.0.0"].includes(urlObj.hostname);
  if (!isLocal) {
    throw new Error(`El servidor remoto en ${targetUrl} no está disponible.`);
  }

  const port = urlObj.port || "3000";
  const buildId = resolve(root, ".next/BUILD_ID");
  if (!existsSync(buildId)) {
    console.log("ℹ️ [Smoke] No se detectó build de producción (.next). Compilando con 'npm run build'...");
    const { spawnSync } = await import("node:child_process");
    const build = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit", shell: true });
    if (build.status !== 0) {
      throw new Error("Falló 'npm run build' previo al smoke test.");
    }
  }

  console.log(`ℹ️ [Smoke] Iniciando servidor temporal en http://127.0.0.1:${port}...`);
  const child: ChildProcess = spawn("npx", ["next", "start", "-p", port], {
    cwd: root,
    stdio: "ignore",
    shell: true,
  });

  const effectiveBaseUrl = `http://127.0.0.1:${port}`;
  const startTime = Date.now();
  const timeoutMs = 30_000;
  let ready = false;

  while (Date.now() - startTime < timeoutMs) {
    if (await isServerUp(effectiveBaseUrl)) {
      ready = true;
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  if (!ready) {
    child.kill("SIGKILL");
    throw new Error(`El servidor temporal no respondió en ${effectiveBaseUrl} tras ${timeoutMs / 1000}s.`);
  }

  const stop = async () => {
    if (child.pid) {
      child.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        process.kill(child.pid, 0);
        child.kill("SIGKILL");
      } catch {
        // proceso ya terminado
      }
    }
  };

  return { baseUrl: effectiveBaseUrl, stop };
}

async function runSmokeTest(): Promise<void> {
  const { baseUrl, stop } = await ensureServerRunning(rawBaseUrl);

  try {
    await fetchOk("/", baseUrl);
    console.log("Smoke test: / respondió HTTP 200");

    const manifestResponse = await fetchOk("/manifest.webmanifest", baseUrl);
    const manifest = (await manifestResponse.json()) as {
      name?: unknown;
      short_name?: unknown;
      start_url?: unknown;
    };
    if (
      typeof manifest.name !== "string" ||
      typeof manifest.short_name !== "string" ||
      typeof manifest.start_url !== "string"
    ) {
      throw new Error("/manifest.webmanifest no contiene los campos requeridos");
    }
    console.log("Smoke test: manifest válido");

    const serviceWorkerResponse = await fetchOk("/sw.js", baseUrl);
    if (!(await serviceWorkerResponse.text()).trim()) {
      throw new Error("/sw.js está vacío");
    }
    console.log("Smoke test: service worker disponible");

    await fetchOk("/inspecciones", baseUrl);
    console.log("Smoke test: /inspecciones respondió HTTP 200");

    const versionResponse = await fetchOk("/version.json", baseUrl);
    const version = (await versionResponse.json()) as { version?: unknown };
    if (typeof version.version !== "string" || !version.version) {
      throw new Error("/version.json no expone una versión válida");
    }
    console.log(`Smoke test: versión ${version.version} expuesta`);
  } finally {
    await stop();
  }
}

runSmokeTest().catch((error: unknown) => {
  console.error("Smoke test fallido:", error);
  process.exit(1);
});
