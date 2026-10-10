export type NotificationStatus =
  | "no soportado"
  | "concedido"
  | "denegado"
  | "error";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationStatus> {
  if (!isNotificationSupported()) {
    return "no soportado";
  }

  try {
    // Solo debe llamarse tras una acción explícita del usuario.
    const permission = await Notification.requestPermission();
    return permission === "granted" ? "concedido" : "denegado";
  } catch {
    return "error";
  }
}

export async function sendLocalNotification(): Promise<NotificationStatus> {
  try {
    if (!isNotificationSupported()) {
      return "no soportado";
    }

    if (Notification.permission !== "granted") {
      return "denegado";
    }

    const title = "Recordatorio de demostración";
    const options: NotificationOptions = {
      body: "Este es un mensaje sintético de la PWA.",
    };

    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        try {
          await registration.showNotification(title, options);
          return "concedido";
        } catch {
          new Notification(title, options);
          return "concedido";
        }
      }
    }

    new Notification(title, options);
    return "concedido";
  } catch {
    return "error";
  }
}
