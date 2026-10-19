import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Inspection } from "../../src/lib/data/inspections";
import {
  calculateRetryDelay,
  DEFAULT_RETRY_BASE_MS,
  DEFAULT_RETRY_MAX_MS,
} from "../../src/lib/sync/queue";
import {
  resolveSyncConflict,
  type ConflictResolutionInput,
} from "../../src/lib/sync/conflict-policy";

function createSyntheticInspection(overrides: Partial<Inspection> = {}): Inspection {
  return {
    id: "synthetic-insp-unit-01",
    location: "Laboratorio de Cómputo 1 - Edificio B",
    date: "2026-10-19",
    inspector: "Inspector Sintético 01",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Revisión preventiva de equipos y conexiones de red.",
    ...overrides,
  };
}

describe("Pruebas Unitarias: Lógica de Sincronización y Backoff", () => {
  describe("calculateRetryDelay()", () => {
    it("calcula el retardo exponencial para los primeros reintentos con valores base por defecto", () => {
      // attempt 1: 1000 * 2^0 = 1000 ms
      assert.equal(calculateRetryDelay(1), 1000);
      // attempt 2: 1000 * 2^1 = 2000 ms
      assert.equal(calculateRetryDelay(2), 2000);
      // attempt 3: 1000 * 2^2 = 4000 ms
      assert.equal(calculateRetryDelay(3), 4000);
      // attempt 4: 1000 * 2^3 = 8000 ms
      assert.equal(calculateRetryDelay(4), 8000);
      // attempt 5: 1000 * 2^4 = 16000 ms
      assert.equal(calculateRetryDelay(5), 16000);
      // attempt 6: 1000 * 2^5 = 32000 ms
      assert.equal(calculateRetryDelay(6), 32000);
    });

    it("respeta estrictamente el tope máximo predeterminado (60000 ms) en intentos avanzados", () => {
      // attempt 7: 1000 * 2^6 = 64000 ms -> acotado a DEFAULT_RETRY_MAX_MS (60000)
      assert.equal(calculateRetryDelay(7), DEFAULT_RETRY_MAX_MS);
      assert.equal(calculateRetryDelay(10), DEFAULT_RETRY_MAX_MS);
      assert.equal(calculateRetryDelay(50), DEFAULT_RETRY_MAX_MS);
    });

    it("soporta parámetros personalizados de retardo base y retardo máximo", () => {
      const base = 500;
      const max = 5000;
      assert.equal(calculateRetryDelay(1, base, max), 500);
      assert.equal(calculateRetryDelay(2, base, max), 1000);
      assert.equal(calculateRetryDelay(3, base, max), 2000);
      assert.equal(calculateRetryDelay(4, base, max), 4000);
      assert.equal(calculateRetryDelay(5, base, max), 5000); // 8000 excede 5000 -> 5000
    });

    it("lanza un error descriptivo si attempts no es un entero mayor o igual a 1", () => {
      assert.throws(() => calculateRetryDelay(0), /attempts debe ser un entero mayor o igual que 1/);
      assert.throws(() => calculateRetryDelay(-1), /attempts debe ser un entero mayor o igual que 1/);
      assert.throws(() => calculateRetryDelay(1.5), /attempts debe ser un entero mayor o igual que 1/);
      assert.throws(() => calculateRetryDelay(Number.NaN), /attempts debe ser un entero mayor o igual que 1/);
    });

    it("lanza un error si la configuración de reintentos es inválida", () => {
      // baseDelayMs < 1
      assert.throws(() => calculateRetryDelay(1, 0, 1000), /La configuración de reintentos no es válida/);
      // maximumDelayMs < baseDelayMs
      assert.throws(() => calculateRetryDelay(1, 2000, 1000), /La configuración de reintentos no es válida/);
    });
  });

  describe("resolveSyncConflict()", () => {
    it("acepta la mutación local para creación si el servidor no tiene registro previo", () => {
      const local = createSyntheticInspection();
      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: null,
        baseVersion: null,
        serverVersion: null,
        operation: "create",
      });

      assert.equal(resolution.decision, "accept-local");
      assert.deepEqual(resolution.localRecord, local);
      assert.match(resolution.reason, /se acepta la creación local/);
    });

    it("determina no-conflict si el servidor no tiene el registro y la operación local es delete", () => {
      const local = createSyntheticInspection();
      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: null,
        baseVersion: 1,
        serverVersion: null,
        operation: "delete",
      });

      assert.equal(resolution.decision, "no-conflict");
      assert.match(resolution.reason, /la eliminación ya está satisfecha/);
    });

    it("determina no-conflict si el servidor no tiene el registro y la operación es update (no aplica update como create)", () => {
      const local = createSyntheticInspection();
      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: null,
        baseVersion: 1,
        serverVersion: null,
        operation: "update",
      });

      assert.equal(resolution.decision, "no-conflict");
      assert.match(resolution.reason, /no se aplica una actualización como creación/);
    });

    it("acepta el cambio local si la versión base coincide con la versión actual del servidor", () => {
      const local = createSyntheticInspection({ summary: "Actualizado localmente sin desincronización" });
      const server = createSyntheticInspection({ summary: "Versión servidora concurrente" });

      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: server,
        baseVersion: 3,
        serverVersion: 3,
        operation: "update",
      });

      assert.equal(resolution.decision, "accept-local");
      assert.deepEqual(resolution.localRecord, local);
      assert.match(resolution.reason, /coincide con la versión del servidor/);
    });

    it("acepta la versión del servidor si el servidor tiene una versión posterior a la versión base (update)", () => {
      const local = createSyntheticInspection({ summary: "Edición local desactualizada" });
      const server = createSyntheticInspection({ summary: "Edición más reciente en el servidor" });

      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: server,
        baseVersion: 2,
        serverVersion: 4,
        operation: "update",
      });

      assert.equal(resolution.decision, "accept-server");
      assert.match(resolution.reason, /El servidor tiene una versión más reciente/);
    });

    it("acepta la versión del servidor si el servidor avanzó mientras se solicitaba un delete local", () => {
      const local = createSyntheticInspection();
      const server = createSyntheticInspection({ summary: "Modificado en servidor por otro inspector" });

      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: server,
        baseVersion: 1,
        serverVersion: 2,
        operation: "delete",
      });

      assert.equal(resolution.decision, "accept-server");
      assert.match(resolution.reason, /El servidor avanzó mientras se solicitaba la eliminación/);
    });

    it("marca no-conflict cuando la versión del servidor es inferior a la versión base (anomalía de versión)", () => {
      const local = createSyntheticInspection();
      const server = createSyntheticInspection();

      const resolution = resolveSyncConflict({
        localChange: local,
        serverRecord: server,
        baseVersion: 5,
        serverVersion: 3,
        operation: "update",
      });

      assert.equal(resolution.decision, "no-conflict");
      assert.match(resolution.reason, /se requiere reconciliación externa/);
    });

    it("garantiza inmutabilidad devolviendo una copia estructurada sin alterar la entrada original", () => {
      const original = createSyntheticInspection({ findings: 1 });
      const input: ConflictResolutionInput = {
        localChange: original,
        serverRecord: null,
        baseVersion: null,
        serverVersion: null,
        operation: "create",
      };

      const result = resolveSyncConflict(input);
      assert.notEqual(result.localRecord, original); // Referencia distinta (copia estructurada)
      assert.deepEqual(result.localRecord, original);

      // Mutar la copia devuelta no altera el original
      result.localRecord.findings = 99;
      assert.equal(original.findings, 1);
    });
  });
});
