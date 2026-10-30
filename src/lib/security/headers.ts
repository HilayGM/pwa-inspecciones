/**
 * Definición y generadores de cabeceras de seguridad HTTP y Content Security Policy (CSP).
 * Protege contra Clickjacking, MIME-sniffing, XSS y filtración de referencias.
 */

import {
  CSP_DIRECTIVES as RAW_CSP_DIRECTIVES,
  buildContentSecurityPolicy as rawBuildCsp,
  SECURITY_HEADERS as RAW_SECURITY_HEADERS,
  getSecurityHeaders as rawGetSecurityHeaders,
  getNextSecurityHeadersConfig as rawGetNextSecurityHeadersConfig,
} from "./headers-config.mjs";

export interface HeaderDefinition {
  key: string;
  value: string;
}

export interface SecurityHeadersConfig {
  source: string;
  headers: HeaderDefinition[];
}

export const CSP_DIRECTIVES: Record<string, readonly string[]> = RAW_CSP_DIRECTIVES;

/**
 * Construye la cadena canónica de Content-Security-Policy a partir de las directivas.
 */
export function buildContentSecurityPolicy(): string {
  return rawBuildCsp();
}

/**
 * Mapeo de cabeceras de seguridad esenciales para la PWA de inspecciones.
 */
export const SECURITY_HEADERS: Record<string, string> = RAW_SECURITY_HEADERS;

/**
 * Devuelve un diccionario inmutable de cabeceras de seguridad.
 */
export function getSecurityHeaders(): Record<string, string> {
  return rawGetSecurityHeaders();
}

/**
 * Devuelve la lista de cabeceras en formato compatible con Next.js (next.config.mjs).
 */
export function getNextSecurityHeadersConfig(): SecurityHeadersConfig[] {
  return rawGetNextSecurityHeadersConfig();
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
