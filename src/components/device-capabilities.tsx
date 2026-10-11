"use client";

import { useEffect, useRef, useState } from "react";
import {
  requestCameraStream,
  stopCameraStream,
  type CameraRequestResult,
} from "../lib/device/camera";
import {
  requestCoarseLocation,
  type GeolocationRequestResult,
} from "../lib/device/geolocation";
import {
  requestNotificationPermission,
  sendLocalNotification,
  type NotificationStatus,
} from "../lib/notifications/client";

export function DeviceCapabilities() {
  const [camera, setCamera] = useState<CameraRequestResult | null>(null);
  const [cameraOpening, setCameraOpening] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [location, setLocation] = useState<GeolocationRequestResult | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraAttempt = useRef(0);

  useEffect(() => () => { cameraAttempt.current += 1; }, []);

  useEffect(() => {
    if (!camera?.ok) return;
    const video = videoRef.current;
    if (video) video.srcObject = camera.stream;
    return () => {
      if (video) video.srcObject = null;
      stopCameraStream(camera.stream);
    };
  }, [camera]);

  async function requestCamera() {
    const attempt = ++cameraAttempt.current;
    setCameraMessage(null);
    setCameraOpening(true);
    const result = await requestCameraStream();
    if (attempt !== cameraAttempt.current) {
      if (result.ok) stopCameraStream(result.stream);
      return;
    }
    setCameraOpening(false);
    setCamera(result);
  }

  function cancelCameraRequest() {
    cameraAttempt.current += 1;
    setCameraOpening(false);
    setCameraMessage("Respuesta descartada. El navegador puede mantener abierto su diálogo; cualquier stream tardío se liberará.");
  }

  async function requestLocation() {
    setLocation(await requestCoarseLocation());
  }

  async function requestNotifications() {
    const permission = await requestNotificationPermission();
    setNotificationStatus(permission);
    if (permission === "concedido") setNotificationStatus(await sendLocalNotification());
  }

  return (
    <section className="content-section" aria-labelledby="capabilities-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Permisos bajo demanda</p>
          <h2 id="capabilities-heading">Capacidades del dispositivo</h2>
        </div>
      </div>
      <p>Estas demostraciones solo comienzan al pulsar el botón correspondiente.</p>
      <div className="inspection-grid">
        <div className="inspection-card" aria-labelledby="camera-heading">
          <h3 id="camera-heading">Cámara</h3>
          <p>Vista previa local de video. No se graba ni se almacena una imagen.</p>
          {camera?.ok ? (
            <>
              <video ref={videoRef} autoPlay muted playsInline aria-label="Vista previa local de cámara" style={{ maxWidth: "100%" }} />
              <button className="retry-button" type="button" onClick={() => setCamera(null)}>Cerrar cámara</button>
            </>
          ) : cameraOpening ? (
            <button className="retry-button" type="button" onClick={cancelCameraRequest}>Cancelar solicitud</button>
          ) : (
            <button className="retry-button" type="button" onClick={() => void requestCamera()}>Abrir cámara</button>
          )}
          {camera && !camera.ok && <p role="status">Estado: {camera.message}</p>}
          {cameraMessage && <p role="status">{cameraMessage}</p>}
        </div>

        <div className="inspection-card" aria-labelledby="location-heading">
          <h3 id="location-heading">Ubicación aproximada</h3>
          <p>Se solicita una lectura puntual y se redondea a tres decimales.</p>
          <button className="retry-button" type="button" onClick={() => void requestLocation()}>Leer ubicación</button>
          {location?.ok ? (
            <p role="status">Latitud {location.location.latitude}; longitud {location.location.longitude} (solo en esta vista).</p>
          ) : location && <p role="status">Estado: {location.message}</p>}
        </div>

        <div className="inspection-card" aria-labelledby="notification-heading">
          <h3 id="notification-heading">Notificación local</h3>
          <p>Solicita permiso y muestra un mensaje de demostración sintético.</p>
          <button className="retry-button" type="button" onClick={() => void requestNotifications()}>Solicitar permiso y enviar</button>
          {notificationStatus && <p role="status">Estado: {notificationStatus}</p>}
        </div>
      </div>
    </section>
  );
}
