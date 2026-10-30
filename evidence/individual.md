# Evidencia individual

## Martin Moreno Libreros — Semana 09: Lead de Lógica de Seguridad y Configuración

- **Estudiante:** Martin Moreno Libreros (Matrícula: 3523110349)
- **Commit SHA evaluado:** `c91a49c66ff9cb57b2cb18ec131b78297b47b2c5`
- **Decisión técnica que puedo explicar:** Diseñé e implementé la arquitectura de seguridad defensiva en `src/lib/security/` y los controles de privacidad del sistema. Decidí estructurar las funciones de saneamiento (`sanitizeText`, `escapeHtml`) y validación (`validateAndSanitizeInspection`, `validateInspectionId`) como funciones puras sin dependencias externas para garantizar cero modificaciones a `package-lock.json` y ejecuciones deterministas en sub-milisegundos. Eliminé activamente scripts incrustados, estilos, iframes, controladores de eventos en línea y protocolos maliciosos (`javascript:`), y bloqueé ataques de Path Traversal en identificadores de inspección. Además, configuré cabeceras HTTP de protección y Content Security Policy (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `nosniff`, `DENY`), salvaguardas de detección de secretos en variables cliente (`assertNoClientSecrets`) y directivas de privacidad en `public/robots.txt` para desautorizar la indexación de `/api/` e `/inspecciones/`.
- **Prueba que ejecuté y resultado:**
  - `npm run test:security`: Ejecutó 27 pruebas automatizadas en 5 suites (XSS y saneamiento, validación estricta de registros, cabeceras HTTP y CSP, detección de secretos y robots.txt). Resultado: 27 aprobadas, 0 fallidas en 295 ms.
  - `npm test`: Ejecutó toda la pirámide de pruebas con código de salida 0.
  - `npm run build`: Compilación de producción en Next.js completada con éxito (`exit code 0`).
  - `npm run verify`: Verificación estructural aprobada (`exit code 0`).
- **Limitación o fallo diagnosticado:**
  - *Fallo diagnosticado y corregido:* Se diagnosticó que etiquetas anidadas con bloques internos (`<style>`, `<iframe>`) dejaban reglas CSS o URLs si únicamente se eliminaban las etiquetas delimitadoras; se diseñaron expresiones regulares especializadas para extirpar el bloque y su contenido interior íntegramente.
  - *Limitación:* La validación y saneamiento en el cliente previenen vulnerabilidades en la interfaz y en el servidor Node.js, pero en despliegues con backends distribuidos deben complementarse con control de acceso basado en roles (RBAC) y filtrado a nivel de API Gateway.
- **Cambio que podría defender o modificar en vivo:** Puedo ajustar las directivas CSP en `src/lib/security/headers.ts`, incorporar reglas de saneamiento adicionales en `src/lib/security/validation.ts` o agregar filtros al escaneo de secretos y demostrar de forma inmediata mediante `npm run test:security` cómo las pruebas validan el nuevo comportamiento.
- **Uso declarado de IA (herramienta, propósito, validación):**
  - *Herramienta:* Gemini 3.8 Flash en Antigravity IDE.
  - *Propósito:* Asistencia en el diseño de expresiones regulares defensivas para sanitización XSS, estructuración de directivas CSP y generación exhaustiva de casos de prueba en `tests/security.spec.ts`.
  - *Validación humana:* Ejecución manual de las suites de prueba en consola local, auditoría estricta de regex para evitar vulnerabilidades de ReDoS (Regular Expression Denial of Service), verificación de ausencia de dependencias externas que alteren `package-lock.json` y confirmación de build limpio.

---

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

- **Estudiante:** Felipe Mora López (Matrícula: `3523110443`, enmascarada).
- **Commit SHA de esta evidencia:**f0b6079d9bbd536cadbaf49eae2acb1effeb689f 
- **Alcance del aporte:** Elaboración y actualización de `docs/threat-model.md` y `docs/privacy-data-inventory.md`, y registro de la evidencia individual en este archivo. No se modificaron fuentes de la aplicación ni otros archivos.
- **Decisión técnica que puedo explicar:** Organicé el análisis con STRIDE y diferencié los controles presentes en código de los que no están integrados o no pudieron verificarse. Documenté IndexedDB, Service Worker, cámara y GPS como activos; los riesgos de XSS, manipulación offline y exposición de datos sintéticos; y el ciclo de vida de inspecciones, cola y recibos. Para minimizar datos, registré la lectura puntual de GPS redondeada a tres decimales y el stream de video sin audio, fotos persistidas ni subida observada. Declaré como sintéticos los fixtures revisados y dejé explícitos los riesgos residuales, incluido el acceso al almacenamiento por código del mismo origen.

### Matriz del aporte

| Criterio asignado | Evidencia revisada | Estado | Motivo |
|---|---|---|---|
| Modelo formal con activos, vectores y mitigaciones | `docs/threat-model.md`; controles contrastados con `src/lib/security/`, `src/lib/storage/schema.ts`, `public/sw.js` y adaptadores de dispositivo | Cumple | Incluye límites de confianza, flujos, matriz STRIDE, controles observados y riesgos residuales. |
| Inventario de privacidad, minimización y declaración sintética | `docs/privacy-data-inventory.md`; `src/lib/data/inspections.ts`, `src/lib/device/geolocation.ts`, `src/lib/device/camera.ts` | Cumple | Documenta finalidad, origen, persistencia, ciclo de vida, GPS aproximado, stream en memoria y uso de fixtures sintéticos. |
| Evidencia individual, pruebas y límites | Esta sección; comandos indicados abajo | Parcial | El cotejo documental y las pruebas listadas se completaron. Falta asignar SHA de commit y verificar las cabeceras en una respuesta de despliegue; no se realizó build en esta tarea documental. |

- **Verificaciones ejecutadas:**
  - `npm run test:security` — correcto; 27 pruebas aprobadas, 0 fallidas.
  - `npm run test:unit` — correcto; 28 pruebas aprobadas, 0 fallidas, incluidas las de redondeo GPS y adaptadores.
  - `npm run test:service-worker` — correcto; `service-worker.spec.ts: PASS`.
- **Hallazgos y limitaciones:** La configuración de cabeceras se define en `src/lib/security/headers.ts`, pero no se encontró su conexión en `next.config.mjs`; por tanto, su aplicación efectiva no está verificada. La CSP incluye `'unsafe-inline'` y `'unsafe-eval'`. Tampoco se verificaron autenticación/autorización, despliegue HTTPS, cifrado local ni una política de retención con vencimiento. Se documentaron estos puntos como riesgos; no se modificó código porque el alcance solicitado se limita a tres archivos de documentación/evidencia.
- **Uso declarado de IA:** Asistente de desarrollo con Copilot SDK en VS Code; apoyo para redactar y estructurar los documentos a partir de la inspección de los archivos del repositorio. La validación técnica realizada en esta tarea consistió en contrastar las afirmaciones con las fuentes mencionadas y ejecutar las pruebas listadas. La persona responsable debe revisar el contenido, poder defender las decisiones y añadir el SHA del commit de entrega.
- **Siguiente paso recomendado:** Revisar y aprobar personalmente el contenido, confirmar las cabeceras en un entorno servido y completar el SHA antes de entregar.

---

## Oscar Martinez Martinez — Semana 08: Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa
- **Estudiante:** Oscar Martinez Martinez (Matrícula: 3523110806)
- **Commit SHA de entrega:** `5364a2edf0f7ae1221900902cb1f750fce42c54d`
- **Rol y alcance:** Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa.
