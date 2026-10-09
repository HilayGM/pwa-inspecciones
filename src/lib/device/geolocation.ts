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
  if (error.code === error.PERMISSION_DENIED) {
    return {
      reason: "permission-denied",
      message:
        "No se concedió permiso de ubicación. Puedes continuar sin agregar ubicación.",
    };
  }

  if (error.code === error.TIMEOUT) {
    return {
      reason: "timeout",
      message:
        "La ubicación tardó demasiado. Puedes intentarlo nuevamente o continuar sin agregar ubicación.",
    };
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
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
    geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          location: {
            latitude: roundCoordinate(position.coords.latitude),
            longitude: roundCoordinate(position.coords.longitude),
            accuracyMeters: Math.round(position.coords.accuracy),
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
  });
}
