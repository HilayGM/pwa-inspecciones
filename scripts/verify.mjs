import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "package.json",
  "package-lock.json",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/globals.css",
  "src/lib/data/inspections.ts",
  "docs/requirements.md",
  "docs/decision-record.md",
  "docs/threat-model.md",
  "docs/privacy-data-inventory.md",
  "src/lib/security/index.ts",
  "src/lib/security/validation.ts",
  "src/lib/security/headers.ts",
  "src/lib/security/headers-config.mjs",
  "src/lib/security/secrets.ts",
  "tests/starter.spec.mjs",
  "tests/security.spec.ts",
  "public/robots.txt",
  "evidence/individual.md"
];

const missing = required.filter((file) => !existsSync(resolve(root, file)));

const forbiddenClientPrefix = "NEXT_PUBLIC_";
const suspiciousEnvNames = ["SECRET", "PRIVATE_KEY", "DATABASE_URL", "DB_PASSWORD", "SERVICE_ROLE", "SIGNING_KEY", "MASTER_KEY"];
const leakedEnvKeys = Object.keys(process.env).filter((key) => {
  if (!key.startsWith(forbiddenClientPrefix) || !process.env[key]) return false;
  const upper = key.toUpperCase();
  return suspiciousEnvNames.some((kw) => upper.includes(kw));
});

const result = {
  schemaVersion: 1,
  checkedAt: new Date().toISOString(),
  status: missing.length === 0 && leakedEnvKeys.length === 0 ? "pass" : "fail",
  missing,
  leakedEnvKeys
};

const report = resolve(root, "reports/verification.json");
mkdirSync(dirname(report), { recursive: true });
writeFileSync(report, `${JSON.stringify(result, null, 2)}\n`);

if (missing.length > 0) {
  console.error(`Faltan ${missing.length} artefactos: ${missing.join(", ")}`);
  process.exit(1);
}

if (leakedEnvKeys.length > 0) {
  console.error(`Variables NEXT_PUBLIC_ no permitidas detectadas: ${leakedEnvKeys.join(", ")}`);
  process.exit(1);
}

console.log("Starter verificable: PASS");
console.log(`Reporte: ${report}`);
