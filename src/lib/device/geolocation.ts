export type GeolocationResult =
  | { status: "concedido"; latitude: number; longitude: number }
  | { status: "no soportado" | "denegado" | "tiempo agotado" | "no disponible" }
  | { status: "error" };

export const COORDINATE_DECIMAL_PLACES = 3;
const GEOLOCATION_TIMEOUT_MS = 10_000;

/** Comprueba soporte sin solicitar ubicación al importar el módulo. */
export function isGeolocationSupported(): boolean {
  try {
    return typeof navigator !== "undefined"
      && typeof navigator.geolocation?.getCurrentPosition === "function";
  } catch {
    return false;
  }
}

function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

/** Obtiene una lectura puntual; no observa ni persiste la ubicación. */
export function getCurrentLocation(): Promise<GeolocationResult> {
  if (!isGeolocationSupported()) return Promise.resolve({ status: "no soportado" });

  return new Promise((resolve) => {
    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const latitude = position?.coords?.latitude;
            const longitude = position?.coords?.longitude;
            if (typeof latitude !== "number" || typeof longitude !== "number"
              || !Number.isFinite(latitude) || !Number.isFinite(longitude)
              || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
              resolve({ status: "error" });
              return;
            }

            resolve({
              status: "concedido",
              latitude: roundCoordinate(latitude),
              longitude: roundCoordinate(longitude),
            });
          } catch {
            resolve({ status: "error" });
          }
        },
        (error) => {
          try {
            if (error?.code === 1) resolve({ status: "denegado" });
            else if (error?.code === 3) resolve({ status: "tiempo agotado" });
            else if (error?.code === 2) resolve({ status: "no disponible" });
            else resolve({ status: "error" });
          } catch {
            resolve({ status: "error" });
          }
        },
        { enableHighAccuracy: false, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
      );
    } catch {
      resolve({ status: "error" });
    }
  });
}
