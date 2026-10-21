import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  isCameraSupported,
  requestCameraStream,
  stopCameraStream,
  DEFAULT_CAMERA_CONSTRAINTS,
} from "../../src/lib/device/camera";
import {
  isGeolocationSupported,
  requestCoarseLocation,
  DEFAULT_GEOLOCATION_OPTIONS,
} from "../../src/lib/device/geolocation";

const globalKeys = ["window", "navigator"] as const;
let originalGlobals: Map<string, PropertyDescriptor | undefined>;

function setGlobal(name: string, value: unknown): void {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

function installBrowserGlobals(options: { window?: object; navigator?: object } = {}): void {
  setGlobal("window", options.window ?? {});
  setGlobal("navigator", options.navigator ?? {});
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
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  }
});

describe("Pruebas Unitarias: Adaptadores de Dispositivo Sintéticos", { concurrency: false }, () => {
  describe("Adaptador de Geolocalización (geolocation.ts)", () => {
    it("informa soporte ausente si navigator.geolocation no está disponible", () => {
      installBrowserGlobals({ navigator: {} });
      assert.equal(isGeolocationSupported(), false);
    });

    it("retorna 'unsupported' al solicitar ubicación si la API no existe en el entorno", async () => {
      installBrowserGlobals({ navigator: {} });
      const result = await requestCoarseLocation();
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unsupported");
        assert.match(result.message, /Este navegador no permite obtener ubicación/);
      }
    });

    it("redondea coordenadas a exactamente 3 decimales para salvaguardar la privacidad", async () => {
      let passedOptions: PositionOptions | undefined;
      let watchPositionCalled = false;

      const mockGeolocation = {
        getCurrentPosition(
          success: (pos: GeolocationPosition) => void,
          _error: unknown,
          options?: PositionOptions,
        ) {
          passedOptions = options;
          const fakePosition = {
            coords: {
              latitude: 18.463829148,   // debe redondear a 18.464
              longitude: -97.392817291, // debe redondear a -97.393
              accuracy: 14.82,          // debe redondear a 15 metros
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as unknown as GeolocationPosition;
          success(fakePosition);
        },
        watchPosition() {
          watchPositionCalled = true;
          return 1;
        },
      };

      installBrowserGlobals({ navigator: { geolocation: mockGeolocation } });

      assert.equal(isGeolocationSupported(), true);
      const result = await requestCoarseLocation();

      assert.equal(watchPositionCalled, false, "Nunca debe invocar watchPosition (rastreo continuo prohibido)");
      assert.equal(result.ok, true);

      if (result.ok) {
        // Validación estricta de 3 decimales
        assert.equal(result.location.latitude, 18.464);
        assert.equal(result.location.longitude, -97.393);
        assert.equal(result.location.accuracyMeters, 15);
      }

      // Valida que siempre imponga enableHighAccuracy: false
      assert.equal(passedOptions?.enableHighAccuracy, false, "enableHighAccuracy debe forzarse a false");
    });

    it("mapea correctamente el código de error 1 (PERMISSION_DENIED)", async () => {
      const mockGeolocation = {
        getCurrentPosition(
          _success: unknown,
          error: (err: GeolocationPositionError) => void,
        ) {
          const fakeErr = {
            code: 1, // PERMISSION_DENIED
            message: "User denied Geolocation",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError;
          error(fakeErr);
        },
      };

      installBrowserGlobals({ navigator: { geolocation: mockGeolocation } });
      const result = await requestCoarseLocation();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "permission-denied");
        assert.match(result.message, /No se concedió permiso de ubicación/);
      }
    });

    it("mapea correctamente el código de error 2 (POSITION_UNAVAILABLE)", async () => {
      const mockGeolocation = {
        getCurrentPosition(
          _success: unknown,
          error: (err: GeolocationPositionError) => void,
        ) {
          error({
            code: 2, // POSITION_UNAVAILABLE
            message: "Position unavailable",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        },
      };

      installBrowserGlobals({ navigator: { geolocation: mockGeolocation } });
      const result = await requestCoarseLocation();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unavailable");
        assert.match(result.message, /La ubicación no está disponible/);
      }
    });

    it("mapea correctamente el código de error 3 (TIMEOUT)", async () => {
      const mockGeolocation = {
        getCurrentPosition(
          _success: unknown,
          error: (err: GeolocationPositionError) => void,
        ) {
          error({
            code: 3, // TIMEOUT
            message: "Timeout expired",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        },
      };

      installBrowserGlobals({ navigator: { geolocation: mockGeolocation } });
      const result = await requestCoarseLocation();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "timeout");
        assert.match(result.message, /La ubicación tardó demasiado/);
      }
    });

    it("maneja excepciones síncronas sin romper la promesa retornando 'unknown'", async () => {
      const mockGeolocation = {
        getCurrentPosition() {
          throw new Error("Falla inesperada en subsistema de ubicación");
        },
      };

      installBrowserGlobals({ navigator: { geolocation: mockGeolocation } });
      const result = await requestCoarseLocation();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unknown");
        assert.match(result.message, /No fue posible obtener la ubicación/);
      }
    });
  });

  describe("Adaptador de Cámara (camera.ts)", () => {
    it("informa soporte ausente si navigator.mediaDevices no existe", () => {
      installBrowserGlobals({ navigator: {} });
      assert.equal(isCameraSupported(), false);
    });

    it("retorna 'unsupported' al solicitar stream si no hay getUserMedia", async () => {
      installBrowserGlobals({ navigator: { mediaDevices: {} } });
      const result = await requestCameraStream();
      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unsupported");
        assert.match(result.message, /Este navegador no permite usar la cámara/);
      }
    });

    it("solicita estrictamente solo video (audio: false) y permite detener todos los tracks", async () => {
      let capturedConstraints: MediaStreamConstraints | undefined;
      const stoppedTracks: string[] = [];

      const mockTracks = [
        {
          id: "video-track-1",
          kind: "video",
          stop() {
            stoppedTracks.push("video-track-1");
          },
        },
        {
          id: "video-track-2",
          kind: "video",
          stop() {
            stoppedTracks.push("video-track-2");
          },
        },
      ];

      const mockStream = {
        getTracks: () => mockTracks,
      } as unknown as MediaStream;

      const mockMediaDevices = {
        getUserMedia: async (constraints: MediaStreamConstraints) => {
          capturedConstraints = constraints;
          return mockStream;
        },
      };

      installBrowserGlobals({ navigator: { mediaDevices: mockMediaDevices } });

      assert.equal(isCameraSupported(), true);
      const result = await requestCameraStream();

      assert.equal(result.ok, true);
      assert.equal(capturedConstraints?.audio, false, "El constrain de audio debe ser forzado a false");

      if (result.ok) {
        // Probar detención segura de los tracks al desmontar la vista
        stopCameraStream(result.stream);
        assert.deepEqual(stoppedTracks, ["video-track-1", "video-track-2"]);
      }
    });

    it("continúa liberando tracks restantes si uno de ellos arroja error al cerrarse", () => {
      const stoppedTracks: string[] = [];

      const mockTracks = [
        {
          id: "failing-track",
          stop() {
            throw new Error("Hardware release failure");
          },
        },
        {
          id: "healthy-track",
          stop() {
            stoppedTracks.push("healthy-track");
          },
        },
      ];

      const mockStream = {
        getTracks: () => mockTracks,
      } as unknown as MediaStream;

      // No debe lanzar excepción
      assert.doesNotThrow(() => {
        stopCameraStream(mockStream);
      });

      assert.deepEqual(stoppedTracks, ["healthy-track"]);
    });

    it("maneja de forma segura invocaciones con stream nulo o indefinido", () => {
      assert.doesNotThrow(() => stopCameraStream(null));
      assert.doesNotThrow(() => stopCameraStream(undefined));
    });

    it("mapea errores NotAllowedError y SecurityError como 'permission-denied'", async () => {
      const mockMediaDevices = {
        getUserMedia: async () => {
          const err = new Error("Permission denied");
          err.name = "NotAllowedError";
          throw err;
        },
      };

      installBrowserGlobals({ navigator: { mediaDevices: mockMediaDevices } });
      const result = await requestCameraStream();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "permission-denied");
        assert.match(result.message, /No se concedió permiso para usar la cámara/);
      }
    });

    it("mapea errores NotFoundError como 'unavailable'", async () => {
      const mockMediaDevices = {
        getUserMedia: async () => {
          const err = new Error("Requested device not found");
          err.name = "NotFoundError";
          throw err;
        },
      };

      installBrowserGlobals({ navigator: { mediaDevices: mockMediaDevices } });
      const result = await requestCameraStream();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "unavailable");
        assert.match(result.message, /No hay una cámara compatible disponible/);
      }
    });

    it("mapea errores InvalidStateError como 'invalid-state'", async () => {
      const mockMediaDevices = {
        getUserMedia: async () => {
          const err = new Error("State is invalid");
          err.name = "InvalidStateError";
          throw err;
        },
      };

      installBrowserGlobals({ navigator: { mediaDevices: mockMediaDevices } });
      const result = await requestCameraStream();

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.reason, "invalid-state");
        assert.match(result.message, /La cámara no puede iniciarse en el estado actual/);
      }
    });
  });
});
