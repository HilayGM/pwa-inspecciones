import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { GET } from "../../src/app/api/inspecciones/route";
import {
  inspections,
  type Inspection,
} from "../../src/lib/data/inspections";

function isInspection(value: unknown): value is Inspection {
  if (typeof value !== "object" || value === null) return false;

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.location === "string" &&
    typeof record.date === "string" &&
    typeof record.inspector === "string" &&
    (record.status === "ok" || record.status === "attention") &&
    typeof record.statusLabel === "string" &&
    typeof record.findings === "number" &&
    Number.isFinite(record.findings) &&
    typeof record.summary === "string"
  );
}

function isInspectionPayload(value: unknown): value is { inspections: Inspection[] } {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    Array.isArray(record.inspections) &&
    record.inspections.every(isInspection)
  );
}

describe("Endpoint sintético de inspecciones", () => {
  test("devuelve el listado sintético con la estructura y tipos esperados", async () => {
    const response = GET();
    assert.equal(response.status, 200);

    const payload: unknown = await response.json();
    assert.ok(isInspectionPayload(payload));
    assert.deepEqual(payload.inspections, inspections);
  });

  test("incluye estrictamente Cache-Control: no-store", () => {
    const response = GET();
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  });

  test("el contrato tipado rechaza una respuesta sintética malformada", async () => {
    const payload: unknown = {
      inspections: [
        {
          id: 42,
          location: "Laboratorio sintético",
          status: "unknown",
          findings: "ninguno",
        },
      ],
    };

    assert.equal(isInspectionPayload(payload), false);
  });
});
