const baseUrl = process.env.SMOKE_URL ?? "http://localhost:3000";

async function fetchOk(path: string): Promise<Response> {
  const url = new URL(path, baseUrl);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} respondió HTTP ${response.status}`);
  }

  return response;
}

async function runSmokeTest(): Promise<void> {
  await fetchOk("/");
  console.log("Smoke test: / respondió HTTP 200");

  const manifestResponse = await fetchOk("/manifest.webmanifest");
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

  const serviceWorkerResponse = await fetchOk("/sw.js");
  if (!(await serviceWorkerResponse.text()).trim()) {
    throw new Error("/sw.js está vacío");
  }
  console.log("Smoke test: service worker disponible");

  await fetchOk("/inspecciones");
  console.log("Smoke test: /inspecciones respondió HTTP 200");

  const versionResponse = await fetchOk("/version.json");
  const version = (await versionResponse.json()) as { version?: unknown };
  if (typeof version.version !== "string" || !version.version) {
    throw new Error("/version.json no expone una versión válida");
  }
  console.log(`Smoke test: versión ${version.version} expuesta`);
}

runSmokeTest().catch((error: unknown) => {
  console.error("Smoke test fallido:", error);
  process.exit(1);
});
