export interface HeaderDefinition {
  key: string;
  value: string;
}

export interface SecurityHeadersConfig {
  source: string;
  headers: HeaderDefinition[];
}

export const CSP_DIRECTIVES: Record<string, readonly string[]>;
export function buildContentSecurityPolicy(): string;
export const SECURITY_HEADERS: Record<string, string>;
export function getSecurityHeaders(): Record<string, string>;
export function getNextSecurityHeadersConfig(): SecurityHeadersConfig[];
