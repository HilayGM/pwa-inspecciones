/**
 * Configuración compartida de Content Security Policy (CSP) y cabeceras HTTP de seguridad.
 * Módulo ESM nativo (.mjs) para ser consumido directamente tanto por next.config.mjs como por src/lib/security/headers.ts.
 */

export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": ["'self'", "'unsafe-inline'"],
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
};

export function buildContentSecurityPolicy() {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");
}

export const SECURITY_HEADERS = {
  "Content-Security-Policy": buildContentSecurityPolicy(),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(self), geolocation=(self), microphone=(), payment=(), usb=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-XSS-Protection": "0",
};

export function getSecurityHeaders() {
  return { ...SECURITY_HEADERS };
}

export function getNextSecurityHeadersConfig() {
  const headersList = Object.entries(SECURITY_HEADERS).map(
    ([key, value]) => ({ key, value })
  );

  return [
    {
      source: "/:path*",
      headers: headersList,
    },
  ];
}

