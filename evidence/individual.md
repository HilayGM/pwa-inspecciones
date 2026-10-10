# Evidencia individual

## Martin Moreno Libreros — Semana 06

- **Commit SHA evaluado:** se completará después de confirmar la implementación
  de cámara y geolocalización en `dev-martin`.
- **Contribución concreta:** Implementé `src/lib/device/camera.ts` y
  `src/lib/device/geolocation.ts` como adaptadores de navegador sin efectos al
  importarse. Solo solicitan una capacidad cuando la interfaz invoca su función,
  regresan un resultado explícito para éxito o fallback y no guardan datos.
- **Decisión técnica que puedo explicar:** La cámara solicita únicamente video,
  nunca audio. La geolocalización obtiene una sola posición, desactiva alta
  precisión y redondea coordenadas a tres decimales; no usa observación continua
  ni conserva fecha o ubicación. Esto reduce permisos, datos recolectados y
  exposición de privacidad.
- **Prueba que ejecutaré y resultado:** `npm test`, `npm run build` y la suite
  de capacidades cuando Oscar la integre. El resultado real se actualizará antes
  de fusionar el PR.
- **Limitación o fallo diagnosticado:** Las APIs dependen del navegador, origen
  seguro y permiso explícito. La captura de imagen y el uso posterior de la
  ubicación deben permanecer opcionales; el fallback permite continuar sin ellas.
- **Cambio que puedo defender o modificar en vivo:** Puedo ajustar el redondeo
  de ubicación, los límites de timeout, los mensajes de fallback y el ciclo de
  vida del stream para comprobar que la cámara se libera al cerrar la interfaz.
- **Uso declarado de IA:** Utilicé OpenAI Codex para analizar los requisitos,
  proponer los contratos de fallback y revisar TypeScript. Influyó en
  `src/lib/device/camera.ts`, `src/lib/device/geolocation.ts` y esta evidencia.
  Revisé manualmente que no se solicite audio, no haya geolocalización continua
  y no se introduzcan datos reales, secretos ni PII persistida.

## Evidencia de Implementación - Felipe Mora López
- **SHA Completo del commit:** c8969c743f350dde5e2531ce28c3f195581b1a1d
- **Decisión técnica:** Implementación de notificaciones locales con Service Workers, fallback a API estándar y manejo estricto de estados en bloques try/catch para evitar bloqueos.
- **Prueba:** Validación del prompt de permisos solo bajo interacción y recepción de mensajes sintéticos.
- **Limitación:** Sin push remoto; las notificaciones operan solo con la PWA activa o el Service Worker en segundo plano.
- **Uso de IA:** Generación de código y documentación mediante IA en el IDE con instrucciones estrictas de no alterar código ajeno, bloquear PII y usar fallbacks seguros.
- **Validación humana:** Revisión manual para asegurar la ausencia de datos sensibles y verificar que no haya llamadas automáticas al montar la app.
