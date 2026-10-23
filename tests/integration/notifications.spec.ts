import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendLocalNotification,
} from "../../src/lib/notifications/client";

const globalKeys = ["window", "navigator", "Notification"] as const;
let originalGlobals: Map<string, PropertyDescriptor | undefined>;

function setGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

function installBrowserGlobals(options: {
  window?: object;
  navigator?: object;
  notification?: unknown;
} = {}): void {
  setGlobal("window", options.window ?? {});
  setGlobal("navigator", options.navigator ?? {});
  if (options.notification === undefined) {
    Reflect.deleteProperty(globalThis, "Notification");
  } else {
    setGlobal("Notification", options.notification);
  }
}

beforeEach(() => {
  originalGlobals = new Map();
  for (const key of globalKeys) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }
  installBrowserGlobals();
});

afterEach(() => {
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

describe("Integración del cliente de notificaciones", { concurrency: false }, () => {
  test("solicita permiso explícitamente y refleja la respuesta concedida", async () => {
    let permissionRequests = 0;
    class FakeNotification {
      static permission: NotificationPermission = "default";
      static async requestPermission(): Promise<NotificationPermission> {
        permissionRequests += 1;
        return "granted";
      }
    }
    installBrowserGlobals({
      window: { Notification: FakeNotification },
      notification: FakeNotification,
    });

    assert.equal(await requestNotificationPermission(), "concedido");
    assert.equal(permissionRequests, 1);
    assert.equal(FakeNotification.permission, "default");
  });

  test("emite una notificación con contenido sintético usando el Service Worker", async () => {
    const shown: Array<{ title: string; options?: NotificationOptions }> = [];
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      static async requestPermission(): Promise<NotificationPermission> {
        return "granted";
      }
    }
    installBrowserGlobals({
      window: { Notification: FakeNotification },
      notification: FakeNotification,
      navigator: {
        serviceWorker: {
          getRegistration: async () => ({
            showNotification: async (
              title: string,
              options?: NotificationOptions,
            ) => {
              shown.push({ title, options });
            },
          }),
        },
      },
    });

    assert.equal(isNotificationSupported(), true);
    assert.equal(await sendLocalNotification(), "concedido");
    assert.deepEqual(shown, [
      {
        title: "Recordatorio de demostración",
        options: { body: "Este es un mensaje sintético de la PWA." },
      },
    ]);
  });

  test("usa Notification como fallback si falla showNotification", async () => {
    const constructed: Array<{ title: string; options?: NotificationOptions }> =
      [];
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      static async requestPermission(): Promise<NotificationPermission> {
        return "granted";
      }
      constructor(title: string, options?: NotificationOptions) {
        constructed.push({ title, options });
      }
    }
    installBrowserGlobals({
      window: { Notification: FakeNotification },
      notification: FakeNotification,
      navigator: {
        serviceWorker: {
          getRegistration: async () => ({
            showNotification: async () => {
              throw new Error("Fallo sintético del Service Worker");
            },
          }),
        },
      },
    });

    assert.equal(await sendLocalNotification(), "concedido");
    assert.deepEqual(constructed, [
      {
        title: "Recordatorio de demostración",
        options: { body: "Este es un mensaje sintético de la PWA." },
      },
    ]);
  });

  test("devuelve fallback seguro cuando no hay API o el permiso fue denegado", async () => {
    assert.equal(isNotificationSupported(), false);
    assert.equal(await requestNotificationPermission(), "no soportado");
    assert.equal(await sendLocalNotification(), "no soportado");

    let constructed = 0;
    class DeniedNotification {
      static permission: NotificationPermission = "denied";
      static async requestPermission(): Promise<NotificationPermission> {
        return "denied";
      }
      constructor() {
        constructed += 1;
      }
    }
    installBrowserGlobals({
      window: { Notification: DeniedNotification },
      notification: DeniedNotification,
    });

    assert.equal(await requestNotificationPermission(), "denegado");
    assert.equal(await sendLocalNotification(), "denegado");
    assert.equal(constructed, 0);
  });
});
