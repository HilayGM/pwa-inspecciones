import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Inspection } from "../../src/lib/data/inspections";
import {
  SYNC_DATABASE_NAME,
  SYNC_STORES,
  openSyncDatabase,
  requestToPromise,
  transactionToPromise,
  type StoredInspection,
  type SyncQueueEntry,
  type SyncReceipt,
} from "../../src/lib/storage/schema";
import {
  enqueueInspection,
  listOfflineInspections,
  markSyncFailure,
  markSyncSuccess,
} from "../../src/lib/sync/queue";

const ENQUEUED_AT = new Date("2026-10-21T08:00:00.000Z");
const SYNCED_AT = new Date("2026-10-21T08:01:00.000Z");

function createInspection(id: string): Inspection {
  return {
    id,
    location: "Laboratorio sintético",
    date: "2026-10-21",
    inspector: "Inspector sintético",
    status: "ok",
    statusLabel: "Sin incidencias",
    findings: 0,
    summary: "Inspección ficticia para integración de almacenamiento.",
  };
}

async function resetDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(SYNC_DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => {
      reject(request.error ?? new Error("No se pudo limpiar la base sintética."));
    };
    request.onblocked = () => {
      reject(new Error("Una conexión bloquea la limpieza de la base sintética."));
    };
  });
}

async function readRecord<T>(
  storeName: (typeof SYNC_STORES)[keyof typeof SYNC_STORES],
  key: IDBValidKey,
): Promise<T | undefined> {
  const database = await openSyncDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const completed = transactionToPromise(transaction);

  try {
    const record = await requestToPromise(
      transaction.objectStore(storeName).get(key) as IDBRequest<T | undefined>,
    );
    await completed;
    return record;
  } finally {
    database.close();
  }
}

async function readQueue(): Promise<SyncQueueEntry[]> {
  const database = await openSyncDatabase();
  const transaction = database.transaction(SYNC_STORES.queue, "readonly");
  const completed = transactionToPromise(transaction);

  try {
    const entries = await requestToPromise(
      transaction.objectStore(SYNC_STORES.queue).getAll() as IDBRequest<
        SyncQueueEntry[]
      >,
    );
    await completed;
    return entries;
  } finally {
    database.close();
  }
}

describe("Integración de IndexedDB y cola de sincronización", { concurrency: false }, () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  test("encola y lista una inspección creada mientras está offline", async () => {
    const inspection = createInspection("synthetic-offline-inspection");
    const result = await enqueueInspection(
      {
        operation: "create",
        inspection,
        clientMutationId: "synthetic-offline-mutation",
      },
      ENQUEUED_AT,
    );

    assert.equal(result.status, "queued");
    if (result.status !== "queued") {
      throw new Error("La inspección sintética no quedó encolada.");
    }
    assert.equal(result.entry.state, "pending");
    assert.deepEqual(await listOfflineInspections(), [
      {
        ...inspection,
        localVersion: 1,
        serverVersion: null,
        updatedAt: ENQUEUED_AT.toISOString(),
        deleted: false,
        syncState: "pending",
      } satisfies StoredInspection,
    ]);
    assert.deepEqual(await readQueue(), [result.entry]);
  });

  test("marca como exitosa la sincronización y elimina el pendiente", async () => {
    const inspection = createInspection("synthetic-success-inspection");
    const result = await enqueueInspection(
      {
        operation: "create",
        inspection,
        clientMutationId: "synthetic-success-mutation",
      },
      ENQUEUED_AT,
    );
    assert.equal(result.status, "queued");
    if (result.status !== "queued") {
      throw new Error("La inspección sintética no quedó encolada.");
    }

    await markSyncSuccess(result.entry.id, { serverVersion: 4 }, SYNCED_AT);

    assert.deepEqual(await readQueue(), []);
    assert.deepEqual(
      await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection.id),
      {
        ...inspection,
        localVersion: 1,
        serverVersion: 4,
        updatedAt: SYNCED_AT.toISOString(),
        deleted: false,
        syncState: "synced",
      },
    );
    assert.deepEqual(
      await readRecord<SyncReceipt>(
        SYNC_STORES.receipts,
        result.entry.idempotencyKey,
      ),
      {
        idempotencyKey: result.entry.idempotencyKey,
        inspectionId: inspection.id,
        processedAt: SYNCED_AT.toISOString(),
      },
    );
  });

  test("persiste un fallo como reintento con mensaje y demora", async () => {
    const inspection = createInspection("synthetic-retry-inspection");
    const result = await enqueueInspection(
      {
        operation: "create",
        inspection,
        clientMutationId: "synthetic-retry-mutation",
      },
      ENQUEUED_AT,
    );
    assert.equal(result.status, "queued");
    if (result.status !== "queued") {
      throw new Error("La inspección sintética no quedó encolada.");
    }

    const failed = await markSyncFailure(
      result.entry.id,
      new Error("Fallo de red sintético"),
      ENQUEUED_AT,
    );

    assert.ok(failed);
    assert.equal(failed.state, "retrying");
    assert.equal(failed.attempts, 1);
    assert.equal(failed.lastError, "Fallo de red sintético");
    assert.equal(failed.nextAttemptAt, "2026-10-21T08:00:01.000Z");
    assert.deepEqual(await readQueue(), [failed]);
  });
});
