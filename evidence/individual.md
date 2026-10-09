# Evidencia individual

## Martin Moreno Libreros — Semana 06

- **Commit SHA evaluado:** `ebd3d50c3c6a24ad769017fcfa4a329e74c5336c`
  en la rama `dev-martin`.
- **Contribución concreta:** Implementé `src/lib/device/camera.ts` y
  `src/lib/device/geolocation.ts` como adaptadores de navegador sin efectos al
  importarse. Solo solicitan una capacidad cuando la interfaz invoca su función,
  regresan un resultado explícito para éxito o fallback y no guardan datos.
- **Decisión técnica que puedo explicar:** La cámara solicita únicamente video,
  nunca audio. La geolocalización obtiene una sola posición, desactiva alta
  precisión y redondea coordenadas a tres decimales; no usa observación continua
  ni conserva fecha o ubicación. Esto reduce permisos, datos recolectados y
  exposición de privacidad.
- **Prueba ejecutada y resultado:** `npx tsc --noEmit --incremental false`,
  `npm test`, `npm run test:sync`, `npm run verify` y `npm run build`
  terminaron con código 0.
  La suite específica `npm run test:capabilities` corresponde a Oscar y deberá
  ejecutarse antes de fusionar el PR final del equipo.
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
