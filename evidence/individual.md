# Evidencia individual

## Martin Moreno Libreros — Semana 09: Lead de Lógica de Seguridad y Configuración

- **Estudiante:** Martin Moreno Libreros (Matrícula: `352***349`, enmascarada)
- **Commit SHA evaluado:** `c91a49c66ff9cb57b2cb18ec131b78297b47b2c5`
- **Decisión técnica que puedo explicar:** Diseñé, implementé y conecté en el runtime de la aplicación la arquitectura de seguridad defensiva en `src/lib/security/` y los controles de privacidad del sistema. Decidí estructurar las funciones de saneamiento (`sanitizeText`, `escapeHtml`, `isSafeUri`) y validación (`validateAndSanitizeInspection`, `validateInspectionId`) como funciones puras sin dependencias externas para garantizar cero modificaciones a `package-lock.json` y ejecuciones deterministas en milisegundos. Conecté `validateInspectionId` y `validateAndSanitizeInspection` directamente en `src/app/inspecciones/[id]/page.tsx` y en `src/app/api/inspecciones/route.ts` para rechazar intentos de *Path Traversal* o IDs malformados con HTTP `400` / `404`. Además, extraje la configuración de cabeceras a `src/lib/security/headers-config.mjs` (con tipos en `headers.ts`) para conectarla en `next.config.mjs` mediante `async headers()` y en las respuestas de la API, eliminando `'unsafe-eval'` de la CSP. Finalmente, integré la verificación de artefactos de Semana 09 y de variables públicas sensibles en `scripts/verify.mjs` y bloqueé `/api/`, `/inspecciones` e `/inspecciones/` en `public/robots.txt`.
- **Prueba que ejecuté y resultado:**
  - `npm run test:security`: Ejecutó 30 pruebas automatizadas en 5 suites (saneamiento XSS y URIs peligrosas, validación estricta de registros, cabeceras HTTP/CSP conectadas en `next.config.mjs` y rechazo de IDs maliciosos en API y página SSR, detección de secretos y `robots.txt`). Resultado: 30 aprobadas, 0 fallidas.
  - `npm test`: Ejecutó toda la pirámide de pruebas (unitarias, integración, capacidades, seguridad, Service Worker, rendering y E2E Playwright) con código de salida 0.
  - `npm run build`: Compilación de producción en Next.js 14.2.35 completada con éxito (`exit code 0`), incluyendo las cabeceras configuradas en `next.config.mjs`.
  - `npm run verify` (equivalente a `make verify`): Verificación estructural y de entorno aprobada (`exit code 0`), generando `reports/verification.json`.
- **Limitación o fallo diagnosticado:**
  - *Fallo diagnosticado y corregido:* Se diagnosticó que inicialmente los módulos de `src/lib/security/` solo se invocaban desde las pruebas unitarias sin estar conectados a `next.config.mjs`, la API ni la página de detalle, que la expresión regular `\bon\w+\s*=` podía recortar texto legítimo como `online=`, y que `robots.txt` no bloqueaba `/inspecciones` sin barra final. Se conectaron todos los controles al runtime, se acotó la regex a eventos reales del DOM y se reforzaron `robots.txt` y sus aserciones.
  - *Limitación:* La CSP mantiene `'unsafe-inline'` para no romper los scripts de hidratación estática y el soporte offline del Service Worker; en un despliegue con backend multiusuario real debe complementarse con autenticación institucional y autorización RBAC en servidor.
- **Cambio que podría defender o modificar en vivo:** Puedo ajustar las directivas CSP en `src/lib/security/headers-config.mjs`, modificar las reglas de validación de `src/lib/security/validation.ts` o cambiar el comportamiento de rechazo en `src/app/api/inspecciones/route.ts` y demostrar de inmediato con `npm run test:security` cómo las pruebas de integración detectan cualquier regresión.
- **Uso declarado de IA (herramienta, propósito, validación):**
  - *Herramienta:* Asistente de IA en Antigravity IDE.
  - *Propósito:* Asistencia en la estructuración de los módulos de seguridad, pruebas de integración de cabeceras y rutas en `tests/security.spec.ts` y documentación técnica en `docs/reporte-ingenieria.md`.
  - *Validación humana:* Ejecución manual de todas las suites de prueba y del build de producción en consola local, revisión línea a línea de la integración en `next.config.mjs`, `route.ts` y `page.tsx`, y comprobación de que `package-lock.json` y `.github/workflows/` permanecen intactos.

---

## Martin Moreno Libreros — Semana 08: Lead de Pruebas Unitarias y Estrategia

- **Estudiante:** Martin Moreno Libreros (Matrícula: `352***349`, enmascarada)
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

---

## Evidencia de Implementación - Felipe Mora López
- **SHA Completo del commit:** c8969c743f350dde5e2531ce28c3f195581b1a1d
- **Decisión técnica:** Implementación de notificaciones locales con Service Workers, fallback a API estándar y manejo estricto de estados en bloques try/catch para evitar bloqueos.
- **Prueba:** Validación del prompt de permisos solo bajo interacción y recepción de mensajes sintéticos.
- **Limitación:** Sin push remoto; las notificaciones operan solo con la PWA activa o el Service Worker en segundo plano.
- **Uso de IA:** Generación de código y documentación mediante IA en el IDE con instrucciones estrictas de no alterar código ajeno, bloquear PII y usar fallbacks seguros.
- **Validación humana:** Revisión manual para asegurar la ausencia de datos sensibles y verificar que no haya llamadas automáticas al montar la app.

---

## Felipe Mora López — Semana 08: Lead de Pruebas de Integración y Adaptadores/API
- **Estudiante:** Felipe Mora López (Matrícula: `3523***443`, enmascarada)
- **Commit SHA evaluado:** 9562d78e96ade5fba0846bdff948ff35023ea509
- **Decisión técnica:** Añadí pruebas de integración para IndexedDB y la cola de mutaciones usando `fake-indexeddb`, para el endpoint sintético de inspecciones y para el cliente de notificaciones con APIs de navegador simuladas.
- **Pruebas ejecutadas y resultado:** Integración ejecutada sin fallos.

## Felipe Mora López — Semana 09: Lead de Modelado de Amenazas y Privacidad

- **Estudiante:** Felipe Mora López (Matrícula: `352***443`, enmascarada).
- **Commit SHA de esta evidencia:** f0b6079d9bbd536cadbaf49eae2acb1effeb689f
- **Alcance del aporte:** Elaboración y actualización de `docs/threat-model.md` y `docs/privacy-data-inventory.md`, y registro de la evidencia individual en este archivo.
- **Decisión técnica que puedo explicar:** Organicé el análisis con STRIDE y diferencié los controles presentes en código de los que requieren validación en despliegue. Documenté IndexedDB, Service Worker, cámara y GPS como activos; los riesgos de XSS, manipulación offline y exposición de datos sintéticos; y el ciclo de vida de inspecciones, cola y recibos. Para minimizar datos, registré la lectura puntual de GPS redondeada a tres decimales y el stream de video sin audio, fotos persistidas ni subida observada. Declaré como sintéticos los fixtures revisados y dejé explícitos los riesgos residuales, incluido el acceso al almacenamiento por código del mismo origen.

### Matriz del aporte

| Criterio asignado | Evidencia revisada | Estado | Motivo |
|---|---|---|---|
| Modelo formal con activos, vectores y mitigaciones | `docs/threat-model.md`; controles contrastados con `src/lib/security/`, `src/lib/storage/schema.ts`, `public/sw.js` y adaptadores de dispositivo | Cumple | Incluye límites de confianza, flujos, matriz STRIDE, controles observados y riesgos residuales. |
| Inventario de privacidad, minimización y declaración sintética | `docs/privacy-data-inventory.md`; `src/lib/data/inspections.ts`, `src/lib/device/geolocation.ts`, `src/lib/device/camera.ts` | Cumple | Documenta finalidad, origen, persistencia, ciclo de vida, GPS aproximado, stream en memoria y uso de fixtures sintéticos. |
| Evidencia individual, pruebas y límites | Esta sección; comandos indicados abajo | Cumple | El cotejo documental y las pruebas listadas se completaron. |

- **Verificaciones ejecutadas:**
  - `npm run test:security` — correcto; 30 pruebas aprobadas, 0 fallidas.
  - `npm run test:unit` — correcto; 28 pruebas aprobadas, 0 fallidas, incluidas las de redondeo GPS y adaptadores.
  - `npm run test:service-worker` — correcto; `service-worker.spec.ts: PASS`.
- **Hallazgos y limitaciones:** Las cabeceras de `src/lib/security/headers.ts` están conectadas en `next.config.mjs` y en la ruta API; la CSP mantiene `'unsafe-inline'` para hidratación de Next.js. Tampoco se verificaron autenticación/autorización remota, despliegue HTTPS externo, cifrado local ni una política de retención con vencimiento.
- **Uso declarado de IA:** Asistente de desarrollo con Copilot SDK en VS Code; apoyo para redactar y estructurar los documentos a partir de la inspección de los archivos del repositorio. La validación técnica realizada en esta tarea consistió en contrastar las afirmaciones con las fuentes mencionadas y ejecutar las pruebas listadas.

---

## Inyección de fallas, idempotencia y decisión de ingeniería — Oscar Martínez Martínez - semana 09

- **Estudiante:** Oscar Martínez Martínez (Matrícula: `352***806`, enmascarada).
- **Responsabilidad:** Diseñar y ejecutar pruebas de inyección de fallas ante una respuesta perdida post-commit, verificar el reintento con la misma clave de idempotencia y documentar la decisión de ingeniería para la Semana 09.
- **Commit SHA evaluado:** `0b74a831be11c9faa7f9dd64fec373a5af3b4f4e` — `test(week-09): implementa inyeccion de fallas post-commit y documenta estrategia de idempotencia` (`dev-oscar`).
- **Trabajo realizado:** Modifiqué `tests/sync.spec.ts` para incorporar el escenario de respuesta perdida después de aplicar una operación sintética. Añadí `reports/week-09/fault-injection.json` con la secuencia de intentos, comandos, resultados y contadores observados, y `evidence/week-09/engineering.json` con la decisión técnica, las alternativas descartadas, los trade-offs y la verificación de los criterios AC-01 a AC-05.
- **Decisión técnica que puedo explicar:** Reutilicé `enqueueInspection` y `syncDueEntries`, junto con `fake-indexeddb`, para probar el comportamiento de la cola local. El doble de servidor en memoria registra la primera aplicación antes de simular un timeout. En el reintento reconoce la misma clave de idempotencia y devuelve el resultado anterior sin volver a registrar los efectos simulados. Se conserva la entrada y se aplica la política de reintentos existente ante errores transitorios; se evita generar una nueva clave y se contempla el estado `exhausted` cuando se agotan los intentos o el error no es recuperable. No añadí un endpoint ficticio, un backend remoto ni una base de datos remota.
- **Prueba que ejecuté y resultado:**
  - `npm run test:sync`: código de salida 0; 17 pruebas aprobadas y 0 fallidas. La suite incluye el escenario `12: una respuesta perdida post-commit se reintenta con la misma clave sin duplicar efectos`.
  - `npm run build`: completado correctamente con Next.js 14.2.35; validación de tipos aprobada y seis páginas estáticas generadas.
  - Validación JSON: los archivos `reports/week-09/fault-injection.json`, `evidence/week-09/engineering.json` y `evidence/week-09/individual.json` fueron validados mediante `JSON.parse`.
- **Limitación o fallo diagnosticado:** El repositorio no contiene un endpoint real de resolución o cierre remoto, persistencia remota ni modelos de eventos, evidencias asociadas o notificaciones remotas. Por ello, los resultados demuestran el comportamiento de la cola local y del doble simulado, pero no certifican la idempotencia de un servidor de producción.
- **Cambio que podría defender o modificar en vivo:** Puedo modificar el escenario de pérdida de respuesta post-commit en `tests/sync.spec.ts` o los umbrales de reintento e idempotencia y ejecutar `npm run test:sync` para demostrar que los contadores de efectos permanecen en 1.
- **Uso declarado de IA (herramienta, propósito, validación):**
  - *Herramienta:* OpenAI Codex.
  - *Propósito:* Apoyo para implementar el escenario de prueba y actualizar los artefactos de evidencia y documentación técnica.
  - *Validación humana:* Ejecuté manualmente `npm run test:sync`, `npm run build` y la validación de los archivos JSON, y revisé sus resultados.

---

## Oscar Martinez Martinez — Semana 08: Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa
- **Estudiante:** Oscar Martinez Martinez (Matrícula: `352***806`, enmascarada)
- **Commit SHA de entrega:** `5364a2edf0f7ae1221900902cb1f750fce42c54d`
- **Rol y alcance:** Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa.
