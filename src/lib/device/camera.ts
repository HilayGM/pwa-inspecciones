/** Resultado explícito de abrir la cámara bajo una acción del usuario. */
export type CameraResult =
  | { status: "concedido"; stream: MediaStream }
  | { status: "no soportado" }
  | { status: "denegado" }
  | { status: "error"; error: unknown };

/** Comprueba soporte sin solicitar permisos ni producir efectos al importar. */
export function isCameraSupported(): boolean {
  try {
    return typeof navigator !== "undefined"
      && typeof navigator.mediaDevices?.getUserMedia === "function";
  } catch {
    return false;
  }
}

/** Abre video sin audio. Invocar solo como respuesta a una acción del usuario. */
export async function openCamera(): Promise<CameraResult> {
  if (!isCameraSupported()) return { status: "no soportado" };

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
    });
    return { status: "concedido", stream };
  } catch (error) {
    const name = typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
    if (name === "NotAllowedError" || name === "SecurityError") {
      return { status: "denegado" };
    }
    return { status: "error", error };
  }
}

/** Detiene cada track; un fallo individual no impide liberar los demás. */
export function closeCameraStream(stream: MediaStream): void {
  let tracks: MediaStreamTrack[];
  try {
    tracks = stream.getTracks();
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
