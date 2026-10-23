# Capacidades del dispositivo

## Capacidades disponibles actualmente

- **Notificaciones locales:** se pueden solicitar bajo demanda y enviar con
  mensajes sintéticos. Se usa el Service Worker registrado cuando está disponible
  y, si no hay un registro disponible, se recurre a la API estándar del navegador.

## Permisos

- **Notificaciones:** el permiso se solicita únicamente cuando una acción
  explícita del usuario invoca la función correspondiente. No se solicita al
  cargar ni al montar la aplicación.
- **Cámara y ubicación:** cualquier solicitud de estos permisos debe originarse
  también en una acción explícita del usuario; no se solicitan automáticamente.

## Estrategias de fallback

- **Cámara:** si la API no está disponible o el permiso no se concede, se puede
  continuar sin captura y utilizar la alternativa manual de la aplicación.
- **Ubicación:** si la API no está disponible o el permiso no se concede, se
  puede continuar sin ubicación y utilizar la alternativa manual de la aplicación.
- **Notificaciones:** si no hay soporte, el permiso no está concedido o el envío
  falla, se devuelve un estado explícito. El envío intenta el Service Worker y
  recurre a la API estándar cuando no hay un registro disponible o cuando
  `showNotification` falla. Si la consulta del registro del Service Worker
  rechaza, devuelve `error` para no ocultar ese fallo.

## Datos mínimos utilizados

Las notificaciones usan únicamente el título genérico “Recordatorio de
demostración” y el mensaje sintético “Este es un mensaje sintético de la PWA.”.
No incluyen datos personales, ubicación exacta, tokens ni suscripciones push
remotas.

## Límites

- No se implementa push remoto.
- No se realiza seguimiento continuo de ubicación.
- No se almacena información de ubicación.
- La notificación depende del soporte del navegador, del permiso concedido y de
  las capacidades disponibles en el dispositivo.

## Riesgos y compatibilidad

Las APIs de notificaciones y Service Workers varían entre navegadores y suelen
requerir un contexto seguro. El usuario puede denegar o revocar el permiso, y
el sistema operativo o el navegador pueden limitar la presentación de avisos.
Por ello, la aplicación maneja explícitamente la falta de soporte, el rechazo
del permiso y los errores de envío para evitar bloquear su uso.
