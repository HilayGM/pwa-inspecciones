export type GeolocationFailureReason =
  | "unsupported"
  | "permission-denied"
  | "unavailable"
  | "timeout"
  | "unknown";

export type CoarseLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

export type GeolocationRequestResult =
  | { ok: true; location: CoarseLocation }
  | {
      ok: false;
      reason: GeolocationFailureReason;
      message: string;
    };

export const DEFAULT_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 60_000,
};

const COORDINATE_DECIMALS = 3;
const PERMISSION_DENIED = 1;
const POSITION_UNAVAILABLE = 2;
const TIMEOUT = 3;

function roundCoordinate(value: number): number {
  const multiplier = 10 ** COORDINATE_DECIMALS;
  return Math.round(value * multiplier) / multiplier;
}

function getGeolocation(): Geolocation | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return navigator.geolocation;
}

function getGeolocationFailure(
  error: GeolocationPositionError,
): Omit<Extract<GeolocationRequestResult, { ok: false }>, "ok"> {
  if (error.code === PERMISSION_DENIED) {
    return {
      reason: "permission-denied",
      message:
        "No se concedió permiso de ubicación. Puedes continuar sin agregar ubicación.",
    };
  }

  if (error.code === TIMEOUT) {
    return {
      reason: "timeout",
      message:
        "La ubicación tardó demasiado. Puedes intentarlo nuevamente o continuar sin agregar ubicación.",
    };
  }

  if (error.code === POSITION_UNAVAILABLE) {
    return {
      reason: "unavailable",
      message:
        "La ubicación no está disponible. Puedes continuar sin agregar ubicación.",
    };
  }

  return {
    reason: "unknown",
    message:
      "No fue posible obtener la ubicación. Puedes continuar sin agregar ubicación.",
  };
}

/**
 * Comprueba soporte sin consultar ni observar la ubicación.
 */
export function isGeolocationSupported(): boolean {
  return typeof getGeolocation()?.getCurrentPosition === "function";
}

/**
 * Obtiene una sola posición bajo una acción de la persona usuaria. Devuelve
 * coordenadas redondeadas a tres decimales y no persiste ubicación ni tiempo.
 */
export function requestCoarseLocation(
  options: PositionOptions = DEFAULT_GEOLOCATION_OPTIONS,
): Promise<GeolocationRequestResult> {
  const geolocation = getGeolocation();

  if (!geolocation?.getCurrentPosition) {
    return Promise.resolve({
      ok: false,
      reason: "unsupported",
      message:
        "Este navegador no permite obtener ubicación. Puedes continuar sin agregar ubicación.",
    });
  }

  return new Promise((resolve) => {
    try {
      geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
            || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
            || !Number.isFinite(accuracy) || accuracy < 0) {
            resolve({ ok: false, reason: "unknown", message: "No fue posible obtener la ubicación. Puedes continuar sin agregar ubicación." });
            return;
          }
          resolve({
            ok: true,
            location: {
              latitude: roundCoordinate(latitude),
              longitude: roundCoordinate(longitude),
              accuracyMeters: Math.round(accuracy),
            },
          });
        },
        (error) => resolve({ ok: false, ...getGeolocationFailure(error) }),
        {
          ...DEFAULT_GEOLOCATION_OPTIONS,
          ...options,
          enableHighAccuracy: false,
        },
      );
    } catch {
      resolve({
        ok: false,
        reason: "unknown",
        message: "No fue posible obtener la ubicación. Puedes continuar sin agregar ubicación.",
      });
    }
  });
}

/** Compatibility result retained for the Week 06 UI and consumers. */
export type GeolocationResult =
  | { status: "concedido"; latitude: number; longitude: number }
  | { status: "no soportado" | "denegado" | "tiempo agotado" | "no disponible" }
  | { status: "error" };

export const COORDINATE_DECIMAL_PLACES = COORDINATE_DECIMALS;

export async function getCurrentLocation(): Promise<GeolocationResult> {
  const result = await requestCoarseLocation({ maximumAge: 0 });
  if (result.ok) return { status: "concedido", latitude: result.location.latitude, longitude: result.location.longitude };
  const statusByReason = {
    unsupported: "no soportado",
    "permission-denied": "denegado",
    unavailable: "no disponible",
    timeout: "tiempo agotado",
    unknown: "error",
  } as const;
  const status = statusByReason[result.reason];
  return status === "error" ? { status } : { status };
}
