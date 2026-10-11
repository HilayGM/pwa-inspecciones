import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import {
  isCameraSupported,
  requestCameraStream,
  stopCameraStream,
} from "../src/lib/device/camera.ts";
import {
  isGeolocationSupported,
  requestCoarseLocation,
} from "../src/lib/device/geolocation.ts";
import {
  isNotificationSupported,
  requestNotificationPermission,
  sendLocalNotification,
} from "../src/lib/notifications/client.ts";

async function openCamera() {
  const result = await requestCameraStream();
  if (result.ok) return { status: "concedido" as const, stream: result.stream };
  if (result.reason === "unsupported") return { status: "no soportado" as const };
  if (result.reason === "permission-denied") return { status: "denegado" as const };
  return { status: "error" as const, error: result.reason };
}

function closeCameraStream(stream: MediaStream): void {
  stopCameraStream(stream);
}

async function getCurrentLocation() {
  try {
    const result = await requestCoarseLocation();
    if (result.ok) {
      return {
        status: "concedido" as const,
        latitude: result.location.latitude,
        longitude: result.location.longitude,
      };
    }
    const statusByReason = {
      unsupported: "no soportado",
      "permission-denied": "denegado",
      timeout: "tiempo agotado",
      unavailable: "no disponible",
      unknown: "error",
    } as const;
    return { status: statusByReason[result.reason] };
  } catch {
    return { status: "error" as const };
  }
}

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

function installBrowserGlobals(options: { window?: object; navigator?: object; notification?: unknown } = {}): void {
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

describe("Cámara simulada", { concurrency: false }, () => {
  test("informa soporte ausente sin pedir permiso", async () => {
    assert.equal(isCameraSupported(), false);
    assert.deepEqual(await openCamera(), { status: "no soportado" });
  });

  test("solicita solo video y libera todos los tracks", async () => {
    let constraints: MediaStreamConstraints | undefined;
    const stopped: string[] = [];
    const tracks = ["video-a", "video-b"].map((id) => ({
      stop() { stopped.push(id); },
    }));
    const stream = {
      getTracks: () => tracks,
    } as unknown as MediaStream;
    installBrowserGlobals({
      navigator: {
        mediaDevices: {
          getUserMedia: async (value: MediaStreamConstraints) => {
            constraints = value;
            return stream;
          },
        },
      },
    });

    assert.equal(isCameraSupported(), true);
    const result = await openCamera();
    assert.deepEqual(result, { status: "concedido", stream });
    assert.equal(constraints?.audio, false);
    assert.equal(typeof constraints?.video, "object");
    assert.deepEqual(stopped, []);

    closeCameraStream(stream);
    assert.deepEqual(stopped, ["video-a", "video-b"]);
    assert.equal(JSON.stringify(result).includes("data:"), false);
  });

  test("mapea permiso denegado y no crea recursos", async () => {
    let calls = 0;
    installBrowserGlobals({
      navigator: {
        mediaDevices: {
          getUserMedia: async () => {
            calls += 1;
            const error = new Error("synthetic permission denial");
            error.name = "NotAllowedError";
            throw error;
          },
        },
      },
    });

    assert.deepEqual(await openCamera(), { status: "denegado" });
    assert.equal(calls, 1);
  });

  test("devuelve error de disponibilidad y continúa liberando si un track falla", async () => {
    installBrowserGlobals({
      navigator: {
        mediaDevices: {
          getUserMedia: async () => {
            const error = new Error("synthetic device unavailable");
            error.name = "NotFoundError";
            throw error;
          },
        },
      },
    });
    const failure = await openCamera();
    assert.equal(failure.status, "error");

    const stopped: string[] = [];
    const stream = {
      getTracks: () => [
        { stop() { stopped.push("first"); throw new Error("synthetic stop failure"); } },
        { stop() { stopped.push("second"); } },
      ],
    } as unknown as MediaStream;
    closeCameraStream(stream);
    assert.deepEqual(stopped, ["first", "second"]);
  });
});

describe("Geolocalización simulada", { concurrency: false }, () => {
  test("informa API ausente", async () => {
    assert.equal(isGeolocationSupported(), false);
    assert.deepEqual(await getCurrentLocation(), { status: "no soportado" });
  });

  test("hace una sola lectura, nunca watchPosition, con precisión baja y redondeo", async () => {
    let calls = 0;
    let options: PositionOptions | undefined;
    let watchCalls = 0;
    installBrowserGlobals({
      navigator: {
        geolocation: {
          getCurrentPosition(success: PositionCallback, _error?: PositionErrorCallback, value?: PositionOptions) {
            calls += 1;
            options = value;
            success({ coords: { latitude: 0.1234567, longitude: -0.9876543 } } as GeolocationPosition);
          },
          watchPosition() { watchCalls += 1; return 1; },
        },
      },
    });

    const result = await getCurrentLocation();
    assert.deepEqual(result, { status: "concedido", latitude: 0.123, longitude: -0.988 });
    assert.equal(calls, 1);
    assert.equal(watchCalls, 0);
    assert.equal(options?.enableHighAccuracy, false);
    assert.equal(options?.maximumAge, 60_000);
    assert.ok(typeof options?.timeout === "number" && options.timeout > 0);
  });

  for (const [code, expected] of [
    [1, "denegado"],
    [3, "tiempo agotado"],
    [2, "no disponible"],
  ] as const) {
    test(`mapea el error geográfico ${code} como ${expected}`, async () => {
      installBrowserGlobals({
        navigator: {
          geolocation: {
            getCurrentPosition(_success: PositionCallback, error?: PositionErrorCallback) {
              error?.({ code, message: "synthetic geolocation error" } as GeolocationPositionError);
            },
          },
        },
      });
      assert.deepEqual(await getCurrentLocation(), { status: expected });
    });
  }

  test("maneja excepciones síncronas", async () => {
    installBrowserGlobals({
      navigator: {
        geolocation: { getCurrentPosition() { throw new Error("synthetic API failure"); } },
      },
    });
    const rawResult = await requestCoarseLocation();
    assert.equal(rawResult.ok, false);
    if (!rawResult.ok) assert.equal(rawResult.reason, "unknown");
    assert.deepEqual(await getCurrentLocation(), { status: "error" });

  });
});

describe("Notificaciones locales simuladas", { concurrency: false }, () => {
  test("devuelve no soportado cuando falta Notification", async () => {
    assert.equal(isNotificationSupported(), false);
    assert.equal(await requestNotificationPermission(), "no soportado");
    assert.equal(await sendLocalNotification(), "no soportado");
  });

  test("mapea permiso denegado y no intenta enviar", async () => {
    let requests = 0;
    let constructions = 0;
    class FakeNotification {
      static permission: NotificationPermission = "denied";
      static async requestPermission() { requests += 1; return "denied" as NotificationPermission; }
      constructor() { constructions += 1; }
    }
    installBrowserGlobals({ window: { Notification: FakeNotification }, notification: FakeNotification });
    assert.equal(await requestNotificationPermission(), "denegado");
    assert.equal(await sendLocalNotification(), "denegado");
    assert.equal(requests, 1);
    assert.equal(constructions, 0);
  });

  test("usa el Service Worker al tener permiso y entrega solo texto sintético", async () => {
    const shown: Array<{ title: string; options?: NotificationOptions }> = [];
    let constructions = 0;
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      static async requestPermission() { return "granted" as NotificationPermission; }
      constructor() { constructions += 1; }
    }
    const registration = {
      async showNotification(title: string, options?: NotificationOptions) { shown.push({ title, options }); },
    };
    installBrowserGlobals({
      window: { Notification: FakeNotification },
      notification: FakeNotification,
      navigator: { serviceWorker: { getRegistration: async () => registration } },
    });

    assert.equal(isNotificationSupported(), true);
    assert.equal(await requestNotificationPermission(), "concedido");
    assert.equal(await sendLocalNotification(), "concedido");
    assert.equal(shown.length, 1);
    assert.equal(shown[0].title, "Recordatorio de demostración");
    assert.equal(shown[0].options?.body, "Este es un mensaje sintético de la PWA.");
    assert.equal(constructions, 0);
    assert.equal(JSON.stringify(shown).includes("@"), false);
  });

  test("usa Notification como fallback si showNotification falla", async () => {
    let constructions = 0;
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      static async requestPermission() { return "granted" as NotificationPermission; }
      constructor() { constructions += 1; }
    }
    installBrowserGlobals({
      window: { Notification: FakeNotification },
      notification: FakeNotification,
      navigator: {
        serviceWorker: {
          getRegistration: async () => ({
            showNotification: async () => { throw new Error("synthetic show failure"); },
          }),
        },
      },
    });

    assert.equal(await sendLocalNotification(), "concedido");
    assert.equal(constructions, 1);
  });

  test("devuelve error si falla getRegistration o la API Notification", async () => {
    let constructions = 0;
    class FakeNotification {
      static permission: NotificationPermission = "granted";
      static async requestPermission() { throw new Error("synthetic permission API error"); }
      constructor() { constructions += 1; throw new Error("synthetic display error"); }
    }
    installBrowserGlobals({
      window: { Notification: FakeNotification },
      notification: FakeNotification,
      navigator: { serviceWorker: { getRegistration: async () => { throw new Error("synthetic registration error"); } } },
    });
    assert.equal(await requestNotificationPermission(), "error");
    assert.equal(await sendLocalNotification(), "error");
    assert.equal(constructions, 0);

    installBrowserGlobals({ window: { Notification: FakeNotification }, notification: FakeNotification, navigator: {} });
    assert.equal(await sendLocalNotification(), "error");
    assert.equal(constructions, 1);
  });
});
