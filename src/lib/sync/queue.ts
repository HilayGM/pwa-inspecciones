import type { Inspection } from "../data/inspections";
import {
  openSyncDatabase,
  requestToPromise,
  SYNC_QUEUE_INDEXES,
  SYNC_STORES,
  transactionToPromise,
  type StoredInspection,
  type SyncOperation,
  type SyncQueueEntry,
  type SyncReceipt,
} from "../storage/schema";

export const DEFAULT_MAX_SYNC_ATTEMPTS = 5;
export const DEFAULT_RETRY_BASE_MS = 1_000;
export const DEFAULT_RETRY_MAX_MS = 60_000;

export type QueueMutationInput = {
  operation: SyncOperation;
  inspection: Inspection;
  clientMutationId: string;
  baseVersion?: number | null;
  maxAttempts?: number;
};

export type EnqueueResult =
  | { status: "queued"; entry: SyncQueueEntry }
  | { status: "duplicate"; entry: SyncQueueEntry | null };

export type SyncSuccess = {
  serverVersion?: number | null;
};

export type SyncSender = (entry: SyncQueueEntry) => Promise<SyncSuccess | void>;

export type SyncAttemptResult = {
  entryId: string;
  status: "synced" | "retrying" | "exhausted";
  error?: string;
};

function assertMutationInput(input: QueueMutationInput): void {
  if (!input.inspection.id.trim()) {
    throw new Error("La inspección necesita un ID.");
  }

  if (!input.clientMutationId.trim()) {
    throw new Error("clientMutationId es obligatorio para evitar duplicados.");
  }

  if (
    input.maxAttempts !== undefined &&
    (!Number.isInteger(input.maxAttempts) || input.maxAttempts < 1)
  ) {
    throw new Error("maxAttempts debe ser mayor o igual que 1.");
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createIdempotencyKey(input: QueueMutationInput): string {
  return [
    input.inspection.id,
    input.operation,
    input.clientMutationId.trim(),
  ].join(":");
}

export function calculateRetryDelay(
  attempts: number,
  baseDelayMs = DEFAULT_RETRY_BASE_MS,
  maximumDelayMs = DEFAULT_RETRY_MAX_MS,
): number {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error("attempts debe ser un entero mayor o igual que 1.");
  }

  if (baseDelayMs < 1 || maximumDelayMs < baseDelayMs) {
    throw new Error("La configuración de reintentos no es válida.");
  }

  return Math.min(baseDelayMs * 2 ** (attempts - 1), maximumDelayMs);
}

export async function enqueueInspection(
  input: QueueMutationInput,
  now = new Date(),
): Promise<EnqueueResult> {
  assertMutationInput(input);

  const database = await openSyncDatabase();
  const transaction = database.transaction(
    [SYNC_STORES.inspections, SYNC_STORES.queue, SYNC_STORES.receipts],
    "readwrite",
  );
  const completed = transactionToPromise(transaction);
  const queueStore = transaction.objectStore(SYNC_STORES.queue);
  const receiptStore = transaction.objectStore(SYNC_STORES.receipts);
  const inspectionStore = transaction.objectStore(SYNC_STORES.inspections);
  const idempotencyKey = createIdempotencyKey(input);

  try {
    const receipt = await requestToPromise(
      receiptStore.get(idempotencyKey) as IDBRequest<SyncReceipt | undefined>,
    );

    if (receipt) {
      await completed;
      return { status: "duplicate", entry: null };
    }

    const existing = await requestToPromise(
      queueStore
        .index(SYNC_QUEUE_INDEXES.idempotencyKey)
        .get(idempotencyKey) as IDBRequest<SyncQueueEntry | undefined>,
    );

    if (existing) {
      await completed;
      return { status: "duplicate", entry: existing };
    }

    const stored = await requestToPromise(
      inspectionStore.get(input.inspection.id) as IDBRequest<
        StoredInspection | undefined
      >,
    );
    const timestamp = now.toISOString();
    const entry: SyncQueueEntry = {
      id: `queue:${idempotencyKey}`,
      idempotencyKey,
      inspectionId: input.inspection.id,
      operation: input.operation,
      payload: structuredClone(input.inspection),
      baseVersion: input.baseVersion ?? stored?.serverVersion ?? null,
      attempts: 0,
      maxAttempts: input.maxAttempts ?? DEFAULT_MAX_SYNC_ATTEMPTS,
      nextAttemptAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
      state: "pending",
      lastError: null,
    };
    const offlineInspection: StoredInspection = {
      ...structuredClone(input.inspection),
      localVersion: (stored?.localVersion ?? 0) + 1,
      serverVersion: input.baseVersion ?? stored?.serverVersion ?? null,
      updatedAt: timestamp,
      deleted: input.operation === "delete",
      syncState: "pending",
    };

    inspectionStore.put(offlineInspection);
    queueStore.add(entry);
    await completed;
    return { status: "queued", entry };
  } finally {
    database.close();
  }
}

export async function listOfflineInspections(): Promise<StoredInspection[]> {
  const database = await openSyncDatabase();
  const transaction = database.transaction(SYNC_STORES.inspections, "readonly");
  const completed = transactionToPromise(transaction);

  try {
    const records = await requestToPromise(
      transaction.objectStore(SYNC_STORES.inspections).getAll() as IDBRequest<
        StoredInspection[]
      >,
    );
    await completed;
    return records.filter((record) => !record.deleted);
  } finally {
    database.close();
  }
}

export async function getDueQueueEntries(
  now = new Date(),
): Promise<SyncQueueEntry[]> {
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
    const timestamp = now.toISOString();

    return entries
      .filter(
        (entry) =>
          entry.state !== "exhausted" && entry.nextAttemptAt <= timestamp,
      )
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  } finally {
    database.close();
  }
}

export async function markSyncSuccess(
  entryId: string,
  success: SyncSuccess = {},
  now = new Date(),
): Promise<void> {
  const database = await openSyncDatabase();
  const transaction = database.transaction(
    [SYNC_STORES.inspections, SYNC_STORES.queue, SYNC_STORES.receipts],
    "readwrite",
  );
  const completed = transactionToPromise(transaction);
  const queueStore = transaction.objectStore(SYNC_STORES.queue);

  try {
    const entry = await requestToPromise(
      queueStore.get(entryId) as IDBRequest<SyncQueueEntry | undefined>,
    );

    if (!entry) {
      await completed;
      return;
    }

    const inspectionStore = transaction.objectStore(SYNC_STORES.inspections);
    const receipt: SyncReceipt = {
      idempotencyKey: entry.idempotencyKey,
      inspectionId: entry.inspectionId,
      processedAt: now.toISOString(),
    };

    if (entry.operation === "delete") {
      inspectionStore.delete(entry.inspectionId);
    } else {
      const stored = await requestToPromise(
        inspectionStore.get(entry.inspectionId) as IDBRequest<
          StoredInspection | undefined
        >,
      );

      if (stored) {
        inspectionStore.put({
          ...stored,
          serverVersion: success.serverVersion ?? stored.serverVersion,
          updatedAt: now.toISOString(),
          syncState: "synced",
        } satisfies StoredInspection);
      }
    }

    transaction.objectStore(SYNC_STORES.receipts).put(receipt);
    queueStore.delete(entry.id);
    await completed;
  } finally {
    database.close();
  }
}

export async function markSyncFailure(
  entryId: string,
  error: unknown,
  now = new Date(),
): Promise<SyncQueueEntry | null> {
  const database = await openSyncDatabase();
  const transaction = database.transaction(SYNC_STORES.queue, "readwrite");
  const completed = transactionToPromise(transaction);
  const store = transaction.objectStore(SYNC_STORES.queue);

  try {
    const entry = await requestToPromise(
      store.get(entryId) as IDBRequest<SyncQueueEntry | undefined>,
    );

    if (!entry) {
      await completed;
      return null;
    }

    const attempts = entry.attempts + 1;
    const exhausted = attempts >= entry.maxAttempts;
    const updated: SyncQueueEntry = {
      ...entry,
      attempts,
      state: exhausted ? "exhausted" : "retrying",
      nextAttemptAt: exhausted
        ? entry.nextAttemptAt
        : new Date(
            now.getTime() + calculateRetryDelay(attempts),
          ).toISOString(),
      updatedAt: now.toISOString(),
      lastError: toErrorMessage(error),
    };

    store.put(updated);
    await completed;
    return updated;
  } finally {
    database.close();
  }
}

export async function syncDueEntries(
  sender: SyncSender,
  now = new Date(),
): Promise<SyncAttemptResult[]> {
  const entries = await getDueQueueEntries(now);
  const results: SyncAttemptResult[] = [];

  for (const entry of entries) {
    try {
      const success = await sender(entry);
      await markSyncSuccess(entry.id, success ?? {}, now);
      results.push({ entryId: entry.id, status: "synced" });
    } catch (error) {
      const updated = await markSyncFailure(entry.id, error, now);
      const status = updated?.state === "exhausted" ? "exhausted" : "retrying";
      results.push({
        entryId: entry.id,
        status,
        error: toErrorMessage(error),
      });
    }
  }

  return results;
}
