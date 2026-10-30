/**
 * Detección, salvaguarda y saneamiento de secretos y credenciales para la PWA.
 * Garantiza que ninguna clave privada, token sensible o contraseña se filtre al bundle de cliente.
 */

export interface SecretLeakScanResult {
  hasLeaks: boolean;
  leakedKeys: string[];
  recommendations: string[];
}

/**
 * Patrones y nombres de variables prohibidos en contextos públicos / frontend.
 */
const FORBIDDEN_CLIENT_KEYWORDS = [
  "SECRET",
  "PRIVATE_KEY",
  "API_SECRET",
  "DATABASE_URL",
  "DB_PASSWORD",
  "SERVICE_ROLE",
  "SIGNING_KEY",
  "MASTER_KEY",
  "ACCESS_TOKEN_SECRET",
  "JWT_SECRET",
];

const PRIVATE_KEY_PATTERN = /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/i;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/;
const BEARER_PATTERN = /Bearer\s+[a-zA-Z0-9._~+/-]{16,}/i;

/**
 * Escanea variables de entorno públicas (prefijo NEXT_PUBLIC_) en busca de fugas de secretos accidentales.
 */
export function detectExposedSecrets(
  env: Record<string, string | undefined> = process.env
): SecretLeakScanResult {
  const leakedKeys: string[] = [];
  const recommendations: string[] = [];

  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;

    // Detectar si una variable expuesta como NEXT_PUBLIC contiene nombres de secretos de backend
    if (key.startsWith("NEXT_PUBLIC_")) {
      const upperKey = key.toUpperCase();
      for (const keyword of FORBIDDEN_CLIENT_KEYWORDS) {
        if (upperKey.includes(keyword)) {
          leakedKeys.push(key);
          recommendations.push(
            `La variable '${key}' está expuesta públicamente en el frontend pero contiene '${keyword}'. Muévela a una variable de servidor sin prefijo NEXT_PUBLIC_.`
          );
          break;
        }
      }
    }

    // Detectar si el valor contiene un patrón de clave privada PEM
    if (PRIVATE_KEY_PATTERN.test(value)) {
      leakedKeys.push(key);
      recommendations.push(
        `La variable '${key}' contiene una clave privada PEM estructurada. No debe almacenarse en el bundle ni en el repositorio.`
      );
    }
  }

  return {
    hasLeaks: leakedKeys.length > 0,
    leakedKeys,
    recommendations,
  };
}

/**
 * Lanza una excepción controlada si se detectan secretos filtrados en el entorno cliente.
 */
export function assertNoClientSecrets(
  env: Record<string, string | undefined> = process.env
): void {
  const scan = detectExposedSecrets(env);
  if (scan.hasLeaks) {
    throw new Error(
      `[SECURITY ERROR] Violación de secretos en bundle cliente: ${scan.leakedKeys.join(
        ", "
      )}. ${scan.recommendations.join(" ")}`
    );
  }
}

/**
 * Redacta tokens, JWTs o credenciales de cadenas de texto antes de imprimirlas en logs o errores.
 */
export function redactSensitiveString(input: string): string {
  if (!input) return "";

  return input
    .replace(PRIVATE_KEY_PATTERN, "[REDACTED_PRIVATE_KEY]")
    .replace(JWT_PATTERN, "[REDACTED_JWT_TOKEN]")
    .replace(BEARER_PATTERN, "Bearer [REDACTED_TOKEN]");
}

/**
 * Claves de objetos que deben ser ofuscadas en registros de auditoría o telemetría.
 */
const SENSITIVE_OBJECT_KEYS = new Set([
  "password",
  "secret",
  "token",
  "authorization",
  "apikey",
  "api_key",
  "credential",
  "cookie",
  "creditcard",
]);

/**
 * Sanea recursivamente un objeto para registro seguro, ofuscando campos sensibles.
 */
export function sanitizeLogData<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_OBJECT_KEYS.has(lowerKey)) {
      result[key] = "[REDACTED]";
    } else if (typeof val === "string") {
      result[key] = redactSensitiveString(val);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = sanitizeLogData(val as Record<string, unknown>);
    } else {
      result[key] = val;
    }
  }

  return result;
}
