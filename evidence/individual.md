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

## Evidencia de Implementación - Felipe Mora López
- **SHA Completo del commit:** c8969c743f350dde5e2531ce28c3f195581b1a1d
- **Decisión técnica:** Implementación de notificaciones locales con Service Workers, fallback a API estándar y manejo estricto de estados en bloques try/catch para evitar bloqueos.
- **Prueba:** Validación del prompt de permisos solo bajo interacción y recepción de mensajes sintéticos.
- **Limitación:** Sin push remoto; las notificaciones operan solo con la PWA activa o el Service Worker en segundo plano.
- **Uso de IA:** Generación de código y documentación mediante IA en el IDE con instrucciones estrictas de no alterar código ajeno, bloquear PII y usar fallbacks seguros.
- **Validación humana:** Revisión manual para asegurar la ausencia de datos sensibles y verificar que no haya llamadas automáticas al montar la app.

## Oscar — Semana 06: pruebas, documentación y CI

- **Responsabilidad:** Pruebas deterministas de capacidades, guía operativa del proyecto e integración de CI para la Semana 06.
- **Commit SHA evaluado:** `1176578398135b61e6147cb8b21637ac4b1b1308` — `Implementa pruebas y capacidades de dispositivos semana 06` (`dev-oscar`).
- **Trabajo realizado:** Añadí adaptadores de cámara y geolocalización, la suite `tests/capabilities.spec.ts`, el script `test:capabilities`, documentación de instalación, desarrollo, pruebas y límites, y el workflow de Semana 06. Integré un panel de demostración con acciones explícitas para invocar las capacidades.
- **Decisión técnica:** Usé `node:test` y mocks para probar sin hardware ni permisos reales. La cámara solicita únicamente video (`audio: false`) y libera todos los tracks al cerrar la vista. La geolocalización hace una sola lectura con `enableHighAccuracy: false`, redondea a tres decimales y conserva el resultado solo en memoria. Las notificaciones usan mensajes sintéticos. El workflow fija Node 22, instala con `npm ci` y ejecuta explícitamente `npm run test:capabilities`. Conservé sin cambios el módulo de notificaciones de Felipe.
- **Pruebas ejecutadas y resultados:**
  - `npm ci`: completado; agregó 416 paquetes y auditó 417. npm informó 15 vulnerabilidades (4 moderadas, 10 altas y 1 crítica) y paquetes obsoletos (`inflight`, `glob@7.2.3` y `sourcemap-codec`). No ejecuté `npm audit fix` ni `npm audit fix --force`.
  - `npm run test:capabilities`: 15 pruebas en 3 suites; 15 aprobadas, 0 fallidas, canceladas u omitidas. Se probaron soporte ausente, permisos, limpieza de tracks, restricciones y resultados de APIs simuladas, errores geográficos y fallbacks/error de notificaciones. No se usaron dispositivos ni permisos reales. Node mostró `MODULE_TYPELESS_PACKAGE_JSON`; no impidió el resultado.
  - `npm test`: `starter.spec.mjs: PASS` y `manifest.spec.ts: PASS`. También mostró `MODULE_TYPELESS_PACKAGE_JSON`, sin impedir la ejecución.
  - `npm run build`: completó correctamente compilación de producción, lint y tipos, recopilación de datos, generación de seis páginas estáticas, trazas y optimización, sin errores.
  - `git diff --check`: código de salida 0; mostró avisos de conversión LF/CRLF en Windows, sin errores de whitespace.
- **Limitaciones y seguimiento:** No hay un resultado exitoso confirmado para `npm run verify`. El check público `bash public-tests/check.sh` no pudo ejecutarse porque Windows no permitió acceder a `bash.exe`; la búsqueda de lectura encontró coincidencias textuales que pueden causar falsos positivos. Tampoco se ha confirmado una ejecución remota de GitHub Actions. npm reportó las vulnerabilidades indicadas y persiste la advertencia de detección de módulos. En el módulo existente de notificaciones, si `navigator.serviceWorker.getRegistration()` rechaza, se devuelve `"error"` sin intentar `new Notification(...)`; la diferencia con el fallback descrito en documentación queda pendiente de coordinación con Felipe y no se considera un fallo de estas pruebas.
- **Uso de IA:** Utilicé Codex como apoyo para implementar los adaptadores, generar las pruebas, actualizar el README y configurar el workflow.
- **Validación humana:** Ejecuté manualmente los comandos anteriores en PowerShell y revisé sus salidas. Esta evidencia no afirma una revisión línea por línea ni una ejecución exitosa de GitHub Actions.
