/**
 * Validación y saneamiento de entradas para PWA de Inspecciones de Laboratorio.
 * Funciones puras con defensas contra XSS, inyección de scripts y datos maliciosos.
 */

import type { Inspection, InspectionStatus } from "../data/inspections";

export interface ValidationResult<T> {
  valid: boolean;
  errors: string[];
  data?: T;
}

/**
 * Expresiones regulares para control de formato y sanitización.
 */
const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_INJECTION_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const STYLE_INJECTION_REGEX = /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi;
const IFRAME_INJECTION_REGEX = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /javascript\s*:/gi;
const EVENT_HANDLER_REGEX = /\bon\w+\s*=/gi;
const DANGEROUS_URI_REGEX = /^(?:data:(?!image\/(?:png|jpe?g|webp|gif);base64,)|vbscript:|file:)/i;
const INSPECTION_ID_REGEX = /^inspection-[a-zA-Z0-9_-]{1,64}$/;
const DATE_ISO_REGEX = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/**
 * Elimina etiquetas HTML, controladores de eventos en línea y protocolos javascript:.
 * Devuelve texto plano seguro contra Cross-Site Scripting (XSS).
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .replace(SCRIPT_INJECTION_REGEX, "")
    .replace(STYLE_INJECTION_REGEX, "")
    .replace(IFRAME_INJECTION_REGEX, "")
    .replace(EVENT_HANDLER_REGEX, "")
    .replace(JAVASCRIPT_PROTOCOL_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // Caracteres de control ASCII
    .trim();
}

/**
 * Escapa caracteres HTML especiales para renderizado seguro en contextos web.
 */
export function escapeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Valida que un identificador de inspección cumpla con el formato canónico
 * y no contenga caracteres de escape o path traversal.
 */
export function validateInspectionId(id: unknown): { valid: boolean; error?: string } {
  if (typeof id !== "string" || !id.trim()) {
    return { valid: false, error: "El ID de inspección es obligatorio y debe ser una cadena de texto." };
  }

  const cleanId = id.trim();

  if (cleanId.includes("..") || cleanId.includes("/") || cleanId.includes("\\")) {
    return { valid: false, error: "El ID contiene secuencias de navegación o path traversal no permitidas." };
  }

  if (!INSPECTION_ID_REGEX.test(cleanId)) {
    return {
      valid: false,
      error: "El ID debe iniciar con 'inspection-' seguido de 1 a 64 caracteres alfanuméricos, guiones o guiones bajos."
    };
  }

  return { valid: true };
}

/**
 * Valida el estado de la inspección según la unión canónica ("ok" | "attention").
 */
export function validateStatus(status: unknown): status is InspectionStatus {
  return status === "ok" || status === "attention";
}

/**
 * Valida fechas en formato estricto ISO YYYY-MM-DD y verifica existencia real del día en calendario.
 */
export function validateIsoDate(dateStr: unknown): boolean {
  if (typeof dateStr !== "string" || !DATE_ISO_REGEX.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (year < 2000 || year > 2100) return false;

  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return (
    dateObj.getUTCFullYear() === year &&
    dateObj.getUTCMonth() === month - 1 &&
    dateObj.getUTCDate() === day
  );
}

/**
 * Valida la cantidad numérica de hallazgos.
 */
export function validateFindingsCount(findings: unknown): { valid: boolean; error?: string } {
  if (typeof findings !== "number" || !Number.isInteger(findings) || findings < 0) {
    return { valid: false, error: "Los hallazgos deben ser un número entero mayor o igual a 0." };
  }

  if (findings > 1000) {
    return { valid: false, error: "El número de hallazgos excede el límite operativo (máximo 1000)." };
  }

  return { valid: true };
}

/**
 * Valida y sanea el nombre de un laboratorio.
 */
export function validateLocation(location: unknown): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(location);

  if (!sanitized || sanitized.length < 3) {
    return { valid: false, sanitized, error: "La ubicación del laboratorio debe tener al menos 3 caracteres." };
  }

  if (sanitized.length > 120) {
    return { valid: false, sanitized, error: "La ubicación del laboratorio no puede exceder 120 caracteres." };
  }

  return { valid: true, sanitized };
}

/**
 * Valida y sanea el nombre del inspector asignado.
 */
export function validateInspector(inspector: unknown): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(inspector);

  if (!sanitized || sanitized.length < 2) {
    return { valid: false, sanitized, error: "El nombre del inspector debe tener al menos 2 caracteres." };
  }

  if (sanitized.length > 80) {
    return { valid: false, sanitized, error: "El nombre del inspector no puede exceder 80 caracteres." };
  }

  return { valid: true, sanitized };
}

/**
 * Valida y sanea el resumen o notas de la inspección.
 */
export function validateSummary(summary: unknown): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeText(summary);

  if (!sanitized) {
    return { valid: false, sanitized, error: "El resumen de la inspección es obligatorio." };
  }

  if (sanitized.length > 1000) {
    return { valid: false, sanitized, error: "El resumen no puede exceder 1000 caracteres." };
  }

  return { valid: true, sanitized };
}

/**
 * Valida y sanea un objeto completo de inspección de laboratorio.
 * Garantiza inmutabilidad, sanitización contra XSS y coherencia de campos.
 */
export function validateAndSanitizeInspection(raw: unknown): ValidationResult<Inspection> {
  const errors: string[] = [];

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { valid: false, errors: ["El registro debe ser un objeto JSON válido."] };
  }

  const candidate = raw as Record<string, unknown>;

  // 1. ID
  const idCheck = validateInspectionId(candidate.id);
  if (!idCheck.valid && idCheck.error) {
    errors.push(idCheck.error);
  }

  // 2. Ubicación / Laboratorio
  const locationCheck = validateLocation(candidate.location);
  if (!locationCheck.valid && locationCheck.error) {
    errors.push(locationCheck.error);
  }

  // 3. Fecha ISO
  if (!validateIsoDate(candidate.date)) {
    errors.push("La fecha debe tener un formato ISO válido YYYY-MM-DD y existir en el calendario.");
  }

  // 4. Inspector
  const inspectorCheck = validateInspector(candidate.inspector);
  if (!inspectorCheck.valid && inspectorCheck.error) {
    errors.push(inspectorCheck.error);
  }

  // 5. Estado
  if (!validateStatus(candidate.status)) {
    errors.push("El estado debe ser 'ok' o 'attention'.");
  }

  // 6. Etiqueta de estado
  const statusLabel = sanitizeText(candidate.statusLabel);
  if (!statusLabel) {
    errors.push("La etiqueta de estado (statusLabel) es obligatoria.");
  }

  // 7. Hallazgos
  const findingsCheck = validateFindingsCount(candidate.findings);
  if (!findingsCheck.valid && findingsCheck.error) {
    errors.push(findingsCheck.error);
  }

  // 8. Resumen
  const summaryCheck = validateSummary(candidate.summary);
  if (!summaryCheck.valid && summaryCheck.error) {
    errors.push(summaryCheck.error);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitizedData: Inspection = {
    id: candidate.id as string,
    location: locationCheck.sanitized,
    date: candidate.date as string,
    inspector: inspectorCheck.sanitized,
    status: candidate.status as InspectionStatus,
    statusLabel: statusLabel,
    findings: candidate.findings as number,
    summary: summaryCheck.sanitized,
  };

  return {
    valid: true,
    errors: [],
    data: sanitizedData,
  };
}

/**
 * Valida un parámetro de búsqueda o filtro para prevenir inyecciones.
 */
export function validateSearchQuery(query: unknown): { valid: boolean; sanitized: string } {
  if (typeof query !== "string") {
    return { valid: true, sanitized: "" };
  }

  const sanitized = sanitizeText(query).slice(0, 80);
  return { valid: true, sanitized };
}
