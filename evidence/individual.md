# Evidencia individual

## Martin Moreno Libreros — Semana 08: Lead de Pruebas Unitarias y Estrategia

- **Estudiante:** Martin Moreno Libreros (Matrícula: 3523110349)
- **Commit SHA evaluado:** `61325bf20515fb631b4861bb2c2f1862678556a3`
- **Decisión técnica que puedo explicar:** Diseñé e implementé la suite de pruebas unitarias (`tests/unit/sync-logic.spec.ts` y `tests/unit/device-adapters.spec.ts`) y la estrategia de aseguramiento de calidad (`docs/test-strategy.md`). Decidí aislar rigurosamente la lógica pura de retroceso exponencial (`calculateRetryDelay`) y la matriz de resolución determinista de conflictos (`resolveSyncConflict`) sin dependencias de I/O, red o motores de base de datos para garantizar ejecuciones sub-segundo en cualquier entorno de CI. En los adaptadores de hardware (`camera.ts` y `geolocation.ts`), emulé las interfaces W3C mediante inyección de descriptores globales en `globalThis` para validar que `enableHighAccuracy: false` y el truncamiento de coordenadas a tres decimales protejan la privacidad del usuario, y que la detención de tracks de cámara sea tolerante a excepciones individuales sin interrumpir la liberación de recursos.
- **Prueba que ejecuté y resultado:**
  - `npm run test:unit`: Ejecutó 28 pruebas en 6 suites (13 de sincronización/backoff y 15 de adaptadores con mocks). Resultado: 28 aprobadas, 0 fallidas, 0 canceladas o ignoradas en 861 ms.
  - `npm test`: Ejecutó pruebas estructurales y de manifiesto PWA con código de salida 0.
  - `npm run build`: Compilación de producción en Next.js completada con éxito (`exit code 0`), generando todas las rutas estáticas y dinámicas optimizadas.
- **Limitación o fallo diagnosticado:**
  - *Fallo diagnosticado y corregido:* Se diagnosticó que en llamadas sin validación a `calculateRetryDelay`, valores no enteros o menores a 1 podían romper el cálculo, y que valores altos de `attempts` podían exceder exponencialmente el umbral razonable; se implementaron aserciones estrictas para validar tipos enteros y garantizar el tope estricto de `DEFAULT_RETRY_MAX_MS` (60,000 ms).
  - *Limitación:* Las pruebas unitarias validan lógica aislada y contratos de datos, pero no sustituyen la verificación de transacciones concurrentes en IndexedDB real ni la interacción visual del usuario en el navegador, las cuales son cubiertas por los niveles de integración y E2E de Felipe y Oscar.
- **Cambio que podría defender o modificar en vivo:** Puedo ajustar los parámetros de backoff (`baseDelayMs`, `maximumDelayMs`), implementar reglas adicionales de conciliación de conflictos (*three-way merge*) o modificar la precisión de redondeo geográfico (`COORDINATE_DECIMALS`) y demostrar de forma inmediata cómo las pruebas unitarias capturan la regresión o validan la nueva regla.
- **Uso declarado de IA (herramienta, propósito, validación):**
  - *Herramienta:* Gemini 3.8 Flash en Antigravity IDE.
  - *Propósito:* Asistencia en la generación de casos de prueba exhaustivos para la matriz de conflictos en `tests/unit/sync-logic.spec.ts` y la redacción estructurada de `docs/test-strategy.md`.
  - *Validación humana:* Ejecución manual de los comandos de prueba en consola, revisión línea a línea de las aserciones, verificación de la inmutabilidad de objetos y comprobación de ausencia total de PII, secretos o llamadas a hardware físico.

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
---

## Felipe Mora López — Semana 08: Lead de Pruebas de Integración y Adaptadores/API
- **Estudiante:** Felipe Mora López (Matrícula: 3523110443)
- **Commit SHA evaluado:** [Pendiente de integración en dev-felipe]
- **Decisión técnica:** [Pendiente]
- **Prueba:** [Pendiente]
- **Limitación:** [Pendiente]
- **Uso de IA:** [Pendiente]

---

## Oscar Martinez Martinez — Semana 08: Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa
- **Estudiante:** Oscar Martinez Martinez (Matrícula: 3523110806)
- **Commit SHA evaluado:** [Pendiente de integración en dev-oscar]
- **Rol y alcance:** Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa. Implementé `tests/e2e/critical-path.spec.ts`, el workflow canónico `.github/workflows/academic-evaluation.yml`, los scripts por nivel, una prueba de integración del handler API y la documentación de ejecución. El SHA final queda pendiente hasta el commit de entrega.
- **Decisión técnica y trade-offs:** La suite Playwright valida el dashboard, el listado CSR, el detalle sintético `inspection-001` y el shell `/` servido desde caché cuando se simula offline. No afirma que el listado funcione sin conexión porque el Service Worker excluye `/api/`. La suite de integración combina el contrato del endpoint con las pruebas existentes de cola e IndexedDB sintética. Conservé los contratos de Semana 06 mediante adaptadores compatibles para cámara y geolocalización, mientras el componente usa los contratos actuales.
- **Pruebas ejecutadas y resultados reales:** `npm ci` terminó correctamente e instaló 416 paquetes; `npm run build` terminó con código 0; `npm test` terminó con código 0. Dentro de la suite completa: unitarias 28/28, integración 17/17, capacidades 15/15, rendering 13/13 y Playwright 4/4 (incluye la prueba de offline existente). El contrato estático del Service Worker reportó PASS. `npm run verify` terminó con código 0 y generó `reports/verification.json`.
- **Limitaciones conocidas:** Offline se garantiza para el shell del dashboard tras una visita online; el listado CSR y la API no se guardan en caché. El check `bash public-tests/check.sh` no pudo ejecutarse localmente porque el `bash.exe` disponible no tuvo acceso para iniciar; queda pendiente correrlo en Git Bash, WSL o CI. La versión local de Node fue 21.7.3; CI fija Node 22. La primera ejecución de capacidades falló porque un mock no incluía `accuracy`; ajusté el dato sintético y la suite completa posterior pasó.
- **Uso declarado de IA y validación humana:** Utilicé OpenAI Codex para apoyar la implementación, resolver los conflictos autorizados, escribir pruebas y documentación y revisar los resultados. La validación automatizada ejecutada se detalla arriba; la revisión final y aprobación de entrega corresponden a Oscar.
