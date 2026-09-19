export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js");
    console.info("Service Worker registrado correctamente.");
  } catch (error) {
    console.error("No se pudo registrar el Service Worker.", error);
  }
}