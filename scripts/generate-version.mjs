import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_ROOT = resolve(import.meta.dirname, "..");

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const SHA_PATTERN = /^[0-9a-f]{7,40}$/i;
const FULL_SHA_PATTERN = /^[0-9a-f]{40}$/i;

export function isValidSemVer(version) {
  return typeof version === "string" && SEMVER_PATTERN.test(version);
}

export function parseSourceDateEpoch(value) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new Error("SOURCE_DATE_EPOCH debe ser un número entero de segundos.");
  }

  const seconds = Number(value);
  if (!Number.isSafeInteger(seconds)) {
    throw new Error("SOURCE_DATE_EPOCH está fuera del rango seguro.");
  }

  const date = new Date(seconds * 1000);
  if (Number.isNaN(date.getTime())) {
    throw new Error("SOURCE_DATE_EPOCH no representa una fecha válida.");
  }

  return date.toISOString();
}

function validateConfiguredSha(name, value) {
  if (!SHA_PATTERN.test(value)) {
    throw new Error(`${name} no contiene un SHA hexadecimal válido de 7 a 40 caracteres.`);
  }
  return value;
}

export function resolveSha({
  env = process.env,
  execGit = (args, options) => execFileSync("git", args, options),
} = {}) {
  if (env.GIT_COMMIT_SHA !== undefined) {
    return {
      sha: validateConfiguredSha("GIT_COMMIT_SHA", env.GIT_COMMIT_SHA),
      shaSource: "GIT_COMMIT_SHA",
    };
  }

  if (env.VERSION_SHA !== undefined) {
    return {
      sha: validateConfiguredSha("VERSION_SHA", env.VERSION_SHA),
      shaSource: "VERSION_SHA",
    };
  }

  try {
    const sha = execGit(["rev-parse", "HEAD"], {
      cwd: env.VERSION_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (!FULL_SHA_PATTERN.test(sha)) {
      throw new Error("Git devolvió un SHA con formato inválido.");
    }

    return { sha, shaSource: "git" };
  } catch (error) {
    if (env.REQUIRE_GIT_SHA === "true") {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`No fue posible obtener el SHA de Git: ${reason}`);
    }

    return { sha: "unavailable", shaSource: "unavailable" };
  }
}

export function resolveGenerationDate({
  env = process.env,
  now = Date.now(),
} = {}) {
  if (env.SOURCE_DATE_EPOCH !== undefined) {
    return {
      date: parseSourceDateEpoch(env.SOURCE_DATE_EPOCH),
      dateSource: "SOURCE_DATE_EPOCH",
    };
  }

  const date = new Date(now);
  if (Number.isNaN(date.getTime())) {
    throw new Error("La fecha actual no es válida.");
  }

  return { date: date.toISOString(), dateSource: "clock" };
}

export function generateVersion({
  root = DEFAULT_ROOT,
  outputPath = resolve(root, "public/version.json"),
  env = process.env,
  now = Date.now(),
  execGit,
} = {}) {
  const packagePath = resolve(root, "package.json");
  const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  const { version } = packageJson;

  if (!isValidSemVer(version)) {
    throw new Error(`La versión del proyecto no cumple SemVer: ${version ?? ""}`);
  }

  const effectiveEnv = { ...env, VERSION_ROOT: root };
  const { sha, shaSource } = resolveSha({ env: effectiveEnv, execGit });
  const { date } = resolveGenerationDate({ env: effectiveEnv, now });
  const payload = { version, sha, date, shaSource };

  if (!payload.version || !payload.sha || !payload.date) {
    throw new Error("No se pudo construir un artefacto de versión completo.");
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}

const isCli = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isCli) {
  const payload = generateVersion();
  console.log(`Versión generada: ${resolve(DEFAULT_ROOT, "public/version.json")}`);
  console.log(JSON.stringify(payload));
}
