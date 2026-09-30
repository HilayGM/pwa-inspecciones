import type { Inspection } from "../data/inspections";

export const SYNC_DATABASE_NAME = "pwa-inspecciones-sync";
export const SYNC_DATABASE_VERSION = 1;

export const SYNC_STORES = {
  inspections: "inspections",
  queue: "syncQueue",
  receipts: "syncReceipts",
} as const;

export const SYNC_QUEUE_INDEXES = {
  idempotencyKey: "byIdempotencyKey",
  inspectionId: "byInspectionId",
  nextAttemptAt: "byNextAttemptAt",
} as const;

export type SyncOperation = "create" | "update" | "delete";
export type SyncQueueState = "pending" | "retrying" | "exhausted";
export type InspectionSyncState = "pending" | "synced" | "conflict";

export type StoredInspection = Inspection & {
  localVersion: number;
  serverVersion: number | null;
  updatedAt: string;
  deleted: boolean;
  syncState: InspectionSyncState;
};

export type SyncQueueEntry = {
  id: string;
  idempotencyKey: string;
  inspectionId: string;
  operation: SyncOperation;
  payload: Inspection;
  baseVersion: number | null;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  createdAt: string;
  updatedAt: string;
  state: SyncQueueState;
  lastError: string | null;
};

export type SyncReceipt = {
  idempotencyKey: string;
  inspectionId: string;
  processedAt: string;
};

function createSchema(database: IDBDatabase): void {
  const inspections = database.createObjectStore(SYNC_STORES.inspections, {
    keyPath: "id",
  });
  inspections.createIndex("bySyncState", "syncState", { unique: false });

  const queue = database.createObjectStore(SYNC_STORES.queue, {
    keyPath: "id",
  });
  queue.createIndex(SYNC_QUEUE_INDEXES.idempotencyKey, "idempotencyKey", {
    unique: true,
  });
  queue.createIndex(SYNC_QUEUE_INDEXES.inspectionId, "inspectionId", {
    unique: false,
  });
  queue.createIndex(SYNC_QUEUE_INDEXES.nextAttemptAt, "nextAttemptAt", {
    unique: false,
  });

  database.createObjectStore(SYNC_STORES.receipts, {
    keyPath: "idempotencyKey",
  });
}

export function openSyncDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(
      new Error("IndexedDB no está disponible en este entorno."),
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SYNC_DATABASE_NAME, SYNC_DATABASE_VERSION);

    request.onupgradeneeded = (event) => {
      const database = request.result;

      if ((event as IDBVersionChangeEvent).oldVersion === 0) {
        createSchema(database);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("No se pudo abrir IndexedDB."));
    };
    request.onblocked = () => {
      reject(
        new Error(
          "La base de datos está bloqueada por otra pestaña con una versión anterior.",
        ),
      );
    };
  });
}

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      reject(request.error ?? new Error("Falló una operación de IndexedDB."));
    };
  });
}

export function transactionToPromise(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => {
      reject(transaction.error ?? new Error("La transacción fue cancelada."));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Falló la transacción."));
    };
  });
}
