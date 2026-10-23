export type CameraFailureReason =
  | "unsupported"
  | "permission-denied"
  | "unavailable"
  | "invalid-state"
  | "unknown";

export type CameraRequestResult =
  | { ok: true; stream: MediaStream }
  | {
      ok: false;
      reason: CameraFailureReason;
      message: string;
    };

export const DEFAULT_CAMERA_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: { ideal: "environment" },
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

function getMediaDevices(): MediaDevices | undefined {
  if (typeof navigator === "undefined") {
    return undefined;
  }

  return navigator.mediaDevices;
}

function getCameraFailure(error: unknown): Omit<Extract<CameraRequestResult, { ok: false }>, "ok"> {
  const name = error instanceof Error ? error.name : "";

  if (name === "NotAllowedError" || name === "SecurityError") {
    return {
      reason: "permission-denied",
      message:
        "No se concedió permiso para usar la cámara. Puedes continuar sin adjuntar una foto.",
    };
  }

  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return {
      reason: "unavailable",
      message:
        "No hay una cámara compatible disponible. Puedes continuar sin adjuntar una foto.",
    };
  }

  if (name === "InvalidStateError") {
    return {
      reason: "invalid-state",
      message:
        "La cámara no puede iniciarse en el estado actual. Inténtalo nuevamente o continúa sin adjuntar una foto.",
    };
  }

  return {
    reason: "unknown",
    message:
      "No fue posible abrir la cámara. Puedes continuar sin adjuntar una foto.",
  };
}

/**
 * Comprueba soporte sin solicitar permiso ni activar hardware.
 */
export function isCameraSupported(): boolean {
  return typeof getMediaDevices()?.getUserMedia === "function";
}

/**
 * Solicita únicamente video cuando la persona usuaria inicia una acción de
 * adjuntar evidencia. Nunca solicita audio y no persiste el stream.
 */
export async function requestCameraStream(
  constraints: MediaStreamConstraints = DEFAULT_CAMERA_CONSTRAINTS,
): Promise<CameraRequestResult> {
  const mediaDevices = getMediaDevices();

  if (!mediaDevices?.getUserMedia) {
    return {
      ok: false,
      reason: "unsupported",
      message:
        "Este navegador no permite usar la cámara. Puedes continuar sin adjuntar una foto.",
    };
  }

  try {
    const stream = await mediaDevices.getUserMedia({
      ...constraints,
      audio: false,
    });

    return { ok: true, stream };
  } catch (error) {
    return { ok: false, ...getCameraFailure(error) };
  }
}

/**
 * Libera el hardware al cerrar el selector o después de capturar evidencia.
 */
export function stopCameraStream(stream: MediaStream | null | undefined): void {
  let tracks: MediaStreamTrack[];
  try {
    tracks = stream?.getTracks() ?? [];
  } catch {
    return;
  }

  for (const track of tracks) {
    try {
      track.stop();
    } catch {
      // Se continúa para intentar liberar todos los tracks.
    }
  }
}

/** Compatibility contract retained for the Week 06 component and consumers. */
export type CameraResult =
  | { status: "concedido"; stream: MediaStream }
  | { status: "no soportado" }
  | { status: "denegado" }
  | { status: "error"; error: unknown };

export async function openCamera(): Promise<CameraResult> {
  const result = await requestCameraStream({ audio: false, video: true });
  if (result.ok) return { status: "concedido", stream: result.stream };
  if (result.reason === "unsupported") return { status: "no soportado" };
  if (result.reason === "permission-denied") return { status: "denegado" };
  return { status: "error", error: result.reason };
}

export function closeCameraStream(stream: MediaStream): void {
  stopCameraStream(stream);
}
