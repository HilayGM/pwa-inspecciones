import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { Inspection } from "../src/lib/data/inspections";
import {
  SYNC_DATABASE_NAME, SYNC_DATABASE_VERSION, SYNC_STORES, SYNC_QUEUE_INDEXES,
  openSyncDatabase, requestToPromise, transactionToPromise,
  type StoredInspection, type SyncQueueEntry, type SyncReceipt,
} from "../src/lib/storage/schema";
import {
  calculateRetryDelay, enqueueInspection, listOfflineInspections,
  getDueQueueEntries, markSyncSuccess, markSyncFailure, syncDueEntries,
  type QueueMutationInput,
} from "../src/lib/sync/queue";
import { resolveSyncConflict } from "../src/lib/sync/conflict-policy";

const START = "2026-10-01T12:00:00.000Z";
const CONFIRMED = "2026-10-01T12:01:00.000Z";
const FUTURE = "2026-10-02T12:00:00.000Z";
const connections = new Set<IDBDatabase>();
type StoreName = (typeof SYNC_STORES)[keyof typeof SYNC_STORES];

function inspection(): Inspection {
  return {
    id: "synthetic-inspection-05", location: "Laboratorio sintético",
    date: "2026-10-01", inspector: "Identificador sintético 05",
    status: "ok", statusLabel: "Sin incidencias", findings: 0,
    summary: "Revisión ficticia para pruebas de sincronización.",
  };
}

function mutation(overrides: Partial<QueueMutationInput> = {}): QueueMutationInput {
  return { operation: "create", inspection: inspection(), clientMutationId: "synthetic-mutation-05", ...overrides };
}

async function withDatabase<T>(read: (database: IDBDatabase) => Promise<T>): Promise<T> {
  const database = await openSyncDatabase();
  connections.add(database);
  try {
    return await read(database);
  } finally {
    database.close();
    connections.delete(database);
  }
}

async function readStore<T>(name: StoreName, request: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return withDatabase(async (database) => {
    const transaction = database.transaction(name, "readonly");
    const completed = transactionToPromise(transaction);
    const [result] = await Promise.all([
      requestToPromise(request(transaction.objectStore(name))), completed,
    ]);
    return result;
  });
}

function readRecord<T>(name: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return readStore(name, (store) => store.get(key) as IDBRequest<T | undefined>);
}

function readAll<T>(name: StoreName): Promise<T[]> {
  return readStore(name, (store) => store.getAll() as IDBRequest<T[]>);
}

function countRecords(name: StoreName): Promise<number> {
  return readStore(name, (store) => store.count());
}

async function resetDatabase(): Promise<void> {
  for (const connection of connections) connection.close();
  connections.clear();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(SYNC_DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("No se pudo eliminar la base de pruebas."));
    request.onblocked = () => reject(new Error("Una conexión abierta bloquea la limpieza de IndexedDB."));
  });
}

async function enqueue(input = mutation()) {
  const result = await enqueueInspection(input, new Date(START));
  assert.equal(result.status, "queued");
  assert.ok(result.entry);
  return result.entry;
}

describe("Semana 05: persistencia y sincronización con datos sintéticos", { concurrency: false }, () => {
  beforeEach(resetDatabase);
  afterEach(resetDatabase);

  test("01: crea las tres stores con sus keyPaths e índices de cola", async () => {
    await withDatabase(async (database) => {
      assert.equal(database.name, SYNC_DATABASE_NAME);
      assert.equal(database.version, SYNC_DATABASE_VERSION);
      assert.deepEqual([...database.objectStoreNames].sort(), ["inspections", "syncQueue", "syncReceipts"].sort());
      const transaction = database.transaction(Object.values(SYNC_STORES), "readonly");
      const completed = transactionToPromise(transaction);
      assert.equal(transaction.objectStore(SYNC_STORES.inspections).keyPath, "id");
      assert.equal(transaction.objectStore(SYNC_STORES.receipts).keyPath, "idempotencyKey");
      const queue = transaction.objectStore(SYNC_STORES.queue);
      assert.equal(queue.keyPath, "id");
      assert.deepEqual([...queue.indexNames].sort(), Object.values(SYNC_QUEUE_INDEXES).sort());
      for (const [keyPath, indexName] of Object.entries(SYNC_QUEUE_INDEXES)) {
        assert.equal(queue.index(indexName).keyPath, keyPath);
        assert.equal(queue.index(indexName).unique, keyPath === "idempotencyKey");
      }
      await completed;
    });
  });

  test("02: guarda una inspección offline pendiente y la devuelve en el listado", async () => {
    await enqueue();
    const stored = await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection().id);
    assert.deepEqual(stored, { ...inspection(), localVersion: 1, serverVersion: null, updatedAt: START, deleted: false, syncState: "pending" });
    assert.deepEqual(await listOfflineInspections(), [stored]);
  });

  test("03: persiste la operación pendiente y su payload en syncQueue", async () => {
    const entry = await enqueue();
    assert.deepEqual(await readAll<SyncQueueEntry>(SYNC_STORES.queue), [entry]);
    assert.equal(entry.idempotencyKey, `${inspection().id}:create:synthetic-mutation-05`);
    assert.deepEqual(entry.payload, inspection());
    assert.equal(entry.state, "pending");
    assert.equal(entry.attempts, 0);
    assert.equal(entry.nextAttemptAt, START);
    assert.deepEqual(await getDueQueueEntries(new Date(START)), [entry]);
  });

  test("04: repetir la misma mutación pendiente no duplica la cola ni el registro local", async () => {
    const input = mutation();
    const entry = await enqueue(input);
    assert.deepEqual(await enqueueInspection(input, new Date(CONFIRMED)), { status: "duplicate", entry });
    assert.equal(await countRecords(SYNC_STORES.queue), 1);
    assert.equal((await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection().id))?.localVersion, 1);
  });

  test("05: confirmar una operación deja un recibo y elimina el pendiente", async () => {
    const entry = await enqueue();
    await markSyncSuccess(entry.id, { serverVersion: 1 }, new Date(CONFIRMED));
    assert.deepEqual(await readRecord<SyncReceipt>(SYNC_STORES.receipts, entry.idempotencyKey), {
      idempotencyKey: entry.idempotencyKey, inspectionId: inspection().id, processedAt: CONFIRMED,
    });
    assert.equal(await readRecord(SYNC_STORES.queue, entry.id), undefined);
  });

  test("06: el recibo detecta una mutación confirmada sin volver a encolarla", async () => {
    const input = mutation();
    const entry = await enqueue(input);
    await markSyncSuccess(entry.id, { serverVersion: 1 }, new Date(CONFIRMED));
    assert.deepEqual(await enqueueInspection(input, new Date(FUTURE)), { status: "duplicate", entry: null });
    assert.equal(await countRecords(SYNC_STORES.queue), 0);
    assert.equal(await countRecords(SYNC_STORES.receipts), 1);
    assert.equal((await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection().id))?.syncState, "synced");
  });

  test("07: el primer fallo persiste un reintento exactamente un segundo después", async () => {
    const entry = await enqueue();
    const failed = await markSyncFailure(entry.id, new Error("Fallo sintético"), new Date(START));
    assert.ok(failed);
    assert.equal(failed.nextAttemptAt, "2026-10-01T12:00:01.000Z");
    assert.equal(failed.attempts, 1);
    assert.equal(failed.state, "retrying");
    assert.equal(failed.lastError, "Fallo sintético");
    assert.deepEqual(await readRecord(SYNC_STORES.queue, entry.id), failed);
  });

  test("08: con seis intentos programa 1, 2, 4, 8 y 16 segundos sin esperar", async () => {
    const entry = await enqueue(mutation({ maxAttempts: 6 }));
    let now = new Date(START);
    for (const [index, delay] of [1_000, 2_000, 4_000, 8_000, 16_000].entries()) {
      const failed = await markSyncFailure(entry.id, "Fallo sintético", now);
      assert.ok(failed);
      assert.equal(failed.attempts, index + 1);
      assert.equal(failed.state, "retrying");
      assert.equal(failed.nextAttemptAt, new Date(now.getTime() + delay).toISOString());
      assert.deepEqual(await readRecord(SYNC_STORES.queue, entry.id), failed);
      assert.deepEqual(await getDueQueueEntries(new Date(now.getTime() + delay - 1)), []);
      now = new Date(now.getTime() + delay);
      assert.deepEqual(await getDueQueueEntries(now), [failed]);
    }
  });

  test("09: el cálculo predeterminado alcanza y respeta el tope de 60000 ms", () => {
    assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((attempt) => calculateRetryDelay(attempt)), [1_000, 2_000, 4_000, 8_000, 16_000, 32_000, 60_000]);
    for (const attempt of [8, 10, 100, 1_000]) assert.equal(calculateRetryDelay(attempt), 60_000);
  });

  test("10: el quinto fallo predeterminado agota la entrada y excluye futuros envíos", async () => {
    const entry = await enqueue();
    assert.equal(entry.maxAttempts, 5);
    let now = new Date(START);
    for (let attempt = 1; attempt <= 5; attempt++) {
      const failed = await markSyncFailure(entry.id, "Fallo sintético", now);
      assert.ok(failed);
      assert.equal(failed.attempts, attempt);
      assert.equal(failed.state, attempt === 5 ? "exhausted" : "retrying");
      if (attempt === 5) assert.equal(failed.nextAttemptAt, now.toISOString());
      assert.deepEqual(await readRecord(SYNC_STORES.queue, entry.id), failed);
      now = new Date(failed.nextAttemptAt);
    }
    assert.deepEqual(await getDueQueueEntries(new Date(FUTURE)), []);
    let sends = 0;
    assert.deepEqual(await syncDueEntries(async () => { sends++; return {}; }, new Date(FUTURE)), []);
    assert.equal(sends, 0);
  });

  test("11: el envío exitoso elimina el pendiente, deja recibo y marca la inspección synced", async () => {
    const entry = await enqueue();
    const sent: SyncQueueEntry[] = [];
    const results = await syncDueEntries(async (pending) => { sent.push(pending); return { serverVersion: 7 }; }, new Date(CONFIRMED));
    assert.deepEqual(sent, [entry]);
    assert.deepEqual(results, [{ entryId: entry.id, status: "synced" }]);
    assert.equal(await countRecords(SYNC_STORES.queue), 0);
    assert.ok(await readRecord<SyncReceipt>(SYNC_STORES.receipts, entry.idempotencyKey));
    const stored = await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection().id);
    assert.equal(stored?.syncState, "synced");
    assert.equal(stored?.serverVersion, 7);
    assert.equal(stored?.updatedAt, CONFIRMED);
  });

  test("12: una eliminación mantiene un tombstone físico oculto del listado offline", async () => {
    const entry = await enqueue(mutation({ operation: "delete" }));
    const stored = await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection().id);
    assert.ok(stored);
    assert.equal(stored.deleted, true);
    assert.equal(stored.syncState, "pending");
    assert.equal(entry.operation, "delete");
    assert.deepEqual(await listOfflineInspections(), []);
    assert.equal(await countRecords(SYNC_STORES.inspections), 1);
  });

  test("13: sincronizar delete elimina físicamente tombstone y pendiente y conserva recibo", async () => {
    const entry = await enqueue(mutation({ operation: "delete" }));
    assert.equal((await readRecord<StoredInspection>(SYNC_STORES.inspections, inspection().id))?.deleted, true);
    assert.deepEqual(await syncDueEntries(async (pending) => {
      assert.equal(pending.operation, "delete");
      return { serverVersion: 8 };
    }, new Date(CONFIRMED)), [{ entryId: entry.id, status: "synced" }]);
    assert.equal(await readRecord(SYNC_STORES.inspections, inspection().id), undefined);
    assert.equal(await countRecords(SYNC_STORES.queue), 0);
    assert.ok(await readRecord<SyncReceipt>(SYNC_STORES.receipts, entry.idempotencyKey));
  });

  test("14: la política acepta el cambio local cuando las versiones coinciden", () => {
    const localChange = inspection();
    const serverRecord = { ...inspection(), summary: "Versión sintética anterior" };
    const result = resolveSyncConflict({ localChange, serverRecord, baseVersion: 3, serverVersion: 3, operation: "update" });
    assert.equal(result.decision, "accept-local");
    assert.deepEqual(result.localRecord, localChange);
    assert.notEqual(result.localRecord, localChange);
  });

  test("15: la política elige servidor cuando tiene una versión más reciente", () => {
    const localChange = inspection();
    const serverRecord = { ...inspection(), findings: 2, summary: "Actualización sintética reciente" };
    const snapshot = structuredClone({ localChange, serverRecord });
    const result = resolveSyncConflict({ localChange, serverRecord, baseVersion: 3, serverVersion: 4, operation: "update" });
    assert.equal(result.decision, "accept-server");
    assert.deepEqual({ localChange, serverRecord }, snapshot);
  });

  test("16: la política no autoriza delete local contra información servidor más reciente", () => {
    const localChange = inspection();
    const serverRecord = { ...inspection(), findings: 3, summary: "Información reciente que debe conservarse" };
    const snapshot = structuredClone(serverRecord);
    const result = resolveSyncConflict({ localChange, serverRecord, baseVersion: 3, serverVersion: 5, operation: "delete" });
    assert.equal(result.decision, "accept-server");
    assert.deepEqual(serverRecord, snapshot);
    assert.deepEqual(result.localRecord, localChange);
  });
});
