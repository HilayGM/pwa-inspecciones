import type { Inspection } from "../data/inspections";
import type { SyncOperation } from "../storage/schema";

export type ConflictDecision = "accept-local" | "accept-server" | "no-conflict";

export type ConflictResolutionInput = {
  localChange: Inspection;
  serverRecord: Inspection | null;
  baseVersion: number | null;
  serverVersion: number | null;
  operation: SyncOperation;
};

export type ConflictResolution = {
  decision: ConflictDecision;
  reason: string;
  localRecord: Inspection;
};

export function resolveSyncConflict({
  localChange,
  serverRecord,
  baseVersion,
  serverVersion,
  operation,
}: ConflictResolutionInput): ConflictResolution {
  const localRecord = structuredClone(localChange);

  if (!serverRecord) {
    if (operation === "create") {
      return {
        decision: "accept-local",
        reason: "El servidor no tiene el registro; se acepta la creación local.",
        localRecord,
      };
    }

    return {
      decision: "no-conflict",
      reason:
        operation === "delete"
          ? "El registro ya no existe en el servidor; la eliminación ya está satisfecha."
          : "El registro no existe en el servidor; no se aplica una actualización como creación.",
      localRecord,
    };
  }

  if (baseVersion === serverVersion) {
    return {
      decision: "accept-local",
      reason: "La versión base coincide con la versión del servidor.",
      localRecord,
    };
  }

  if (
    serverVersion !== null &&
    (baseVersion === null || serverVersion > baseVersion)
  ) {
    return {
      decision: "accept-server",
      reason:
        operation === "delete"
          ? "El servidor avanzó mientras se solicitaba la eliminación; se conserva la actualización del servidor."
          : "El servidor tiene una versión más reciente; se conserva el registro del servidor.",
      localRecord,
    };
  }

  return {
    decision: "no-conflict",
    reason:
      "La versión del servidor no es más reciente que la versión base y no coincide con ella; se requiere reconciliación externa.",
    localRecord,
  };
}