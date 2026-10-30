/**
 * Pruebas automatizadas de controles de seguridad, validación, CSP, secretos y robots.txt.
 * Ejecuta validaciones exhaustivas unitarias y de integración sobre src/lib/security, rutas y configuración.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  sanitizeText,
  escapeHtml,
  isSafeUri,
  validateInspectionId,
  validateStatus,
  validateIsoDate,
  validateFindingsCount,
  validateLocation,
  validateInspector,
  validateSummary,
  validateAndSanitizeInspection,
  validateSearchQuery,
  buildContentSecurityPolicy,
  SECURITY_HEADERS,
  getSecurityHeaders,
  getNextSecurityHeadersConfig,
  validateResponseSecurityHeaders,
  detectExposedSecrets,
  assertNoClientSecrets,
  redactSensitiveString,
  sanitizeLogData,
} from "../src/lib/security";
import { GET as getInspectionsRoute } from "../src/app/api/inspecciones/route";
import InspectionDetailPage from "../src/app/inspecciones/[id]/page";
import nextConfig from "../next.config.mjs";

test("Seguridad: Saneamiento de texto y mitigación de XSS", async (t) => {
  await t.test("Elimina scripts maliciosos y etiquetas HTML", () => {
    const malicious = "<script>alert('XSS')</script>Laboratorio de Redes";
    const cleaned = sanitizeText(malicious);
    assert.equal(cleaned, "Laboratorio de Redes");
    assert.doesNotMatch(cleaned, /<script>/i);
  });

  await t.test("Elimina controladores de eventos en línea sin mutilar palabras legítimas como online=", () => {
    const attack = "<img src='x' onerror='stealCookies()' />Equipo online=activo";
    const cleaned = sanitizeText(attack);
    assert.equal(cleaned, "Equipo online=activo");
    assert.doesNotMatch(cleaned, /onerror/i);
  });

  await t.test("Elimina protocolos peligrosos javascript:, vbscript:, file: y data: no gráficos", () => {
    assert.doesNotMatch(sanitizeText("javascript:alert(1)"), /javascript:/i);
    assert.doesNotMatch(sanitizeText("vbscript:msgbox(1)"), /vbscript:/i);
    assert.doesNotMatch(sanitizeText("file:///etc/passwd"), /file:/i);
    assert.doesNotMatch(sanitizeText("data:text/html;base64,PHNjcmlwdD4="), /data:text\/html/i);
    assert.equal(isSafeUri("https://utt.edu.mx"), true);
    assert.equal(isSafeUri("data:image/png;base64,iVBORw0KGgo="), true);
    assert.equal(isSafeUri("javascript:alert(1)"), false);
    assert.equal(isSafeUri("data:text/html;base64,PHNjcmlwdD4="), false);
  });

  await t.test("Elimina caracteres de control ASCII potencialmente peligrosos", () => {
    const controlChars = "Texto\u0000con\u0008caracteres\u001F";
    const cleaned = sanitizeText(controlChars);
    assert.equal(cleaned, "Textoconcaracteres");
  });

  await t.test("Escapa entidades HTML para renderizado seguro", () => {
    const raw = `Observación & "cita" <peligro>`;
    const escaped = escapeHtml(raw);
    assert.equal(escaped, "Observación &amp; &quot;cita&quot; &lt;peligro&gt;");
  });
});

test("Seguridad: Validación estricta de identificadores y campos de inspección", async (t) => {
  await t.test("Acepta IDs de inspección en formato canónico", () => {
    const valid = validateInspectionId("inspection-001");
    assert.equal(valid.valid, true);
    assert.equal(valid.error, undefined);
  });

  await t.test("Rechaza ataques de Path Traversal en el ID de inspección", () => {
    const traversal1 = validateInspectionId("../inspection-001");
    const traversal2 = validateInspectionId("..\\windows\\system32");
    const slash = validateInspectionId("inspection/admin");

    assert.equal(traversal1.valid, false);
    assert.equal(traversal2.valid, false);
    assert.equal(slash.valid, false);
  });

  await t.test("Rechaza IDs con inyecciones de código o longitud inválida", () => {
    const xssId = validateInspectionId("inspection-<script>");
    const emptyId = validateInspectionId("");
    const nonString = validateInspectionId(12345);

    assert.equal(xssId.valid, false);
    assert.equal(emptyId.valid, false);
    assert.equal(nonString.valid, false);
  });

  await t.test("Valida estados canónicos de inspección", () => {
    assert.equal(validateStatus("ok"), true);
    assert.equal(validateStatus("attention"), true);
    assert.equal(validateStatus("invalid"), false);
    assert.equal(validateStatus(null), false);
  });

  await t.test("Valida fechas ISO con días de calendario exactos", () => {
    assert.equal(validateIsoDate("2026-08-28"), true);
    assert.equal(validateIsoDate("2024-02-29"), true); // Bisiesto válido
    assert.equal(validateIsoDate("2023-02-29"), false); // No bisiesto
    assert.equal(validateIsoDate("2026-13-01"), false); // Mes inválido
    assert.equal(validateIsoDate("2026-04-31"), false); // Abril tiene 30 días
    assert.equal(validateIsoDate("28-08-2026"), false); // Formato no ISO
  });

  await t.test("Valida conteo de hallazgos entero y no negativo", () => {
    assert.equal(validateFindingsCount(0).valid, true);
    assert.equal(validateFindingsCount(5).valid, true);
    assert.equal(validateFindingsCount(-1).valid, false);
    assert.equal(validateFindingsCount(2.5).valid, false);
    assert.equal(validateFindingsCount(1500).valid, false); // Excede límite
  });

  await t.test("Valida y sanea objeto de inspección completo", () => {
    const rawMalicious = {
      id: "inspection-999",
      location: "<script>alert('lab')</script>Laboratorio de IA",
      date: "2026-10-26",
      inspector: "<b>Inspector X</b>",
      status: "attention",
      statusLabel: "<marquee>Aviso:</marquee> Revisión prioritaria",
      findings: 3,
      summary: "Fallo de switch <iframe src='malicious.com'></iframe>",
    };

    const result = validateAndSanitizeInspection(rawMalicious);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.data);
    assert.equal(result.data.location, "Laboratorio de IA");
    assert.equal(result.data.inspector, "Inspector X");
    assert.equal(result.data.statusLabel, "Aviso: Revisión prioritaria");
    assert.equal(result.data.summary, "Fallo de switch");
    assert.doesNotMatch(result.data.summary, /iframe/i);
  });

  await t.test("Rechaza objetos de inspección con campos faltantes o inválidos", () => {
    const incomplete = {
      id: "invalid-id",
      location: "Lab",
      date: "invalid-date",
    };

    const result = validateAndSanitizeInspection(incomplete);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length >= 3);
  });
});

test("Seguridad: Content Security Policy (CSP), cabeceras HTTP e integración en runtime", async (t) => {
  await t.test("Construye una política CSP restrictiva sin unsafe-eval y con directivas obligatorias", () => {
    const csp = buildContentSecurityPolicy();
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /base-uri 'self'/);
    assert.doesNotMatch(csp, /unsafe-eval/);
  });

  await t.test("Las cabeceras de seguridad contienen protección anti-sniffing y anti-clickjacking", () => {
    const headers = getSecurityHeaders();
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.equal(headers["X-Frame-Options"], "DENY");
    assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
    assert.ok(headers["Permissions-Policy"].includes("camera=(self)"));
    assert.ok(headers["Permissions-Policy"].includes("microphone=()"));
  });

  await t.test("Verifica conformidad de cabeceras en respuestas HTTP", () => {
    const compliantHeaders = {
      "Content-Security-Policy": "default-src 'self'",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    const check = validateResponseSecurityHeaders(compliantHeaders);
    assert.equal(check.compliant, true);
    assert.equal(check.missing.length, 0);

    const nonCompliant = { "X-Content-Type-Options": "nosniff" };
    const failedCheck = validateResponseSecurityHeaders(nonCompliant);
    assert.equal(failedCheck.compliant, false);
    assert.ok(failedCheck.missing.includes("Content-Security-Policy"));
    assert.ok(failedCheck.missing.includes("X-Frame-Options"));
  });

  await t.test("next.config.mjs conecta async headers() con getNextSecurityHeadersConfig()", async () => {
    assert.equal(typeof nextConfig.headers, "function", "next.config.mjs debe definir async headers()");
    const configured = await nextConfig.headers();
    assert.deepEqual(configured, getNextSecurityHeadersConfig());
    assert.equal(configured[0]?.source, "/:path*");
    const headerKeys = configured[0]?.headers.map((h: { key: string }) => h.key) ?? [];
    assert.ok(headerKeys.includes("Content-Security-Policy"));
    assert.ok(headerKeys.includes("X-Content-Type-Options"));
    assert.ok(headerKeys.includes("X-Frame-Options"));
  });

  await t.test("La ruta GET /api/inspecciones devuelve cabeceras de seguridad y rechaza IDs maliciosos", async () => {
    const okResponse = getInspectionsRoute();
    assert.equal(okResponse.status, 200);
    const headerValidation = validateResponseSecurityHeaders(okResponse.headers);
    assert.equal(headerValidation.compliant, true);
    assert.equal(okResponse.headers.get("X-Content-Type-Options"), "nosniff");

    const maliciousRequest = new Request("http://localhost:3000/api/inspecciones?id=../etc/passwd");
    const rejectedResponse = getInspectionsRoute(maliciousRequest);
    assert.equal(rejectedResponse.status, 400);
    const body = (await rejectedResponse.json()) as { error?: string };
    assert.ok(body.error);
  });

  await t.test("La página de detalle InspectionDetailPage rechaza un ID malicioso antes de buscar", async () => {
    await assert.rejects(
      async () => {
        await InspectionDetailPage({
          params: Promise.resolve({ id: "../inspection-001" }),
        });
      },
      (err: unknown) => {
        return err instanceof Error && /NEXT_NOT_FOUND/i.test(err.message);
      }
    );
  });
});

test("Seguridad: Detección y prevención de filtración de secretos", async (t) => {
  await t.test("Detecta nombres de secretos expuestos en variables NEXT_PUBLIC_", () => {
    const testEnv = {
      NEXT_PUBLIC_APP_NAME: "Inspecciones PWA",
      NEXT_PUBLIC_DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      NEXT_PUBLIC_API_SECRET: "super-secret-key-1234",
    };

    const result = detectExposedSecrets(testEnv);
    assert.equal(result.hasLeaks, true);
    assert.equal(result.leakedKeys.length, 2);
    assert.ok(result.leakedKeys.includes("NEXT_PUBLIC_DATABASE_URL"));
    assert.ok(result.leakedKeys.includes("NEXT_PUBLIC_API_SECRET"));
  });

  await t.test("Detecta claves privadas PEM en variables de entorno", () => {
    const testEnv = {
      APP_PRIVATE_KEY: "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEA0...",
    };

    const result = detectExposedSecrets(testEnv);
    assert.equal(result.hasLeaks, true);
    assert.ok(result.leakedKeys.includes("APP_PRIVATE_KEY"));
  });

  await t.test("assertNoClientSecrets lanza excepción cuando hay fugas", () => {
    const badEnv = {
      NEXT_PUBLIC_JWT_SECRET: "jwt-token-key",
    };

    assert.throws(
      () => assertNoClientSecrets(badEnv),
      /Violación de secretos en bundle cliente/
    );
  });

  await t.test("Redacta datos sensibles en strings y logs", () => {
    const rawLog = "Error al autenticar: Bearer abcdef1234567890xyz y token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature";
    const redacted = redactSensitiveString(rawLog);

    assert.doesNotMatch(redacted, /abcdef1234567890xyz/);
    assert.match(redacted, /Bearer \[REDACTED_TOKEN\]/);
    assert.match(redacted, /\[REDACTED_JWT_TOKEN\]/);

    const sensitiveObject = {
      user: "martin",
      password: "SuperSecretPassword123",
      token: "secret-token-value",
      apiKey: "api-key-999",
      nested: {
        credential: "db-credential",
        status: "ok",
      },
    };

    const sanitizedLog = sanitizeLogData(sensitiveObject);
    assert.equal(sanitizedLog.password, "[REDACTED]");
    assert.equal(sanitizedLog.token, "[REDACTED]");
    assert.equal(sanitizedLog.apiKey, "[REDACTED]");
    assert.equal((sanitizedLog.nested as Record<string, unknown>).credential, "[REDACTED]");
    assert.equal((sanitizedLog.nested as Record<string, unknown>).status, "ok");
    assert.equal(sanitizedLog.user, "martin");
  });
});

test("Seguridad y Privacidad: Archivo public/robots.txt", async (t) => {
  const robotsPath = resolve(process.cwd(), "public/robots.txt");

  await t.test("El archivo public/robots.txt existe", () => {
    assert.equal(existsSync(robotsPath), true, "public/robots.txt debe existir en la raíz pública");
  });

  await t.test("Bloquea rastreadores de indexar APIs y rutas privadas de inspecciones (con y sin barra)", () => {
    const content = readFileSync(robotsPath, "utf-8");
    assert.match(content, /^User-agent:\s*\*\s*$/m);
    assert.match(content, /^Allow:\s*\/(?:\$)?\s*$/m);
    assert.match(content, /^Disallow:\s*\/api\/\s*$/m);
    assert.match(content, /^Disallow:\s*\/inspecciones\s*$/m);
    assert.match(content, /^Disallow:\s*\/inspecciones\/\s*$/m);
  });
});
