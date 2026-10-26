/**
 * Definición y generadores de cabeceras de seguridad HTTP y Content Security Policy (CSP).
 * Protege contra Clickjacking, MIME-sniffing, XSS y filtración de referencias.
 */

export interface HeaderDefinition {
  key: string;
  value: string;
}

export interface SecurityHeadersConfig {
  source: string;
  headers: HeaderDefinition[];
}

/**
 * Directivas de Content Security Policy (CSP) adaptadas a Next.js y PWA estricta.
 */
export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'"],
  "media-src": ["'self'", "blob:"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "upgrade-insecure-requests": [],
} as const;

/**
 * Construye la cadena canónica de Content-Security-Policy a partir de las directivas.
 */
export function buildContentSecurityPolicy(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Mapeo de cabeceras de seguridad esenciales para la PWA de inspecciones.
 */
export const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": buildContentSecurityPolicy(),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-XSS-Protection": "0", // Recomendación moderna W3C: deshabilitar el filtro legacy del navegador a favor de CSP
};

/**
 * Devuelve un diccionario inmutable de cabeceras de seguridad.
 */
export function getSecurityHeaders(): Record<string, string> {
  return { ...SECURITY_HEADERS };
}

/**
 * Devuelve la lista de cabeceras en formato compatible con Next.js (next.config.mjs).
 */
export function getNextSecurityHeadersConfig(): SecurityHeadersConfig[] {
  const headersList: HeaderDefinition[] = Object.entries(SECURITY_HEADERS).map(
    ([key, value]) => ({ key, value })
  );

  return [
    {
      source: "/:path*",
      headers: headersList,
    },
  ];
}

/**
 * Valida si un conjunto de cabeceras recibidas cumple con los estándares mínimos de seguridad.
 */
export function validateResponseSecurityHeaders(headers: Headers | Record<string, string>): {
  compliant: boolean;
  missing: string[];
} {
  const required = [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
  ];

  const missing: string[] = [];

  for (const headerName of required) {
    const value =
      headers instanceof Headers
        ? headers.get(headerName)
        : headers[headerName] || headers[headerName.toLowerCase()];

    if (!value) {
      missing.push(headerName);
    }
  }

  return {
    compliant: missing.length === 0,
    missing,
  };
}
