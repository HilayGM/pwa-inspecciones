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

---

## Felipe Mora López — Semana 08: Lead de Pruebas de Integración y Adaptadores/API
- **Estudiante:** Felipe Mora López (Matrícula: 3523110443)
- **Commit SHA evaluado:** Pendiente de commit de esta contribución.
- **Decisión técnica:** Añadí pruebas de integración para IndexedDB y la cola de mutaciones usando `fake-indexeddb`, para el endpoint sintético de inspecciones y para el cliente de notificaciones con APIs de navegador simuladas. No modifiqué los módulos de producción.
- **Pruebas ejecutadas y resultado:**
  - `npx tsx --test tests\integration\storage-queue.spec.ts`: 3 aprobadas, 0 fallidas.
  - `npx tsx --test tests\integration\api-inspecciones.spec.ts`: 3 aprobadas, 0 fallidas.
  - `npx tsx --test tests\integration\notifications.spec.ts`: 4 aprobadas, 0 fallidas.
  - `npm run test:sync`: 16 aprobadas, 0 fallidas.
  - `npm run test:capabilities`: 15 aprobadas, 0 fallidas.
  - Chequeo de tipos enfocado para los tres archivos de integración completado sin errores.
- **Limitación técnica:** `fake-indexeddb` simula IndexedDB en memoria bajo Node, pero no cubre todas las diferencias de un navegador real, como persistencia en disco, cuotas, restricciones de origen o coordinación entre pestañas. Los permisos y el Service Worker también se simulan.
- **Uso de IA:** Utilicé IA en el IDE como apoyo para elaborar y validar las pruebas y esta evidencia; revisé los resultados ejecutando las suites y el chequeo de tipos.
- **Validación adicional:** `git diff --check` no reportó errores de whitespace.

---

## Oscar Martinez Martinez — Semana 08: Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa
- **Estudiante:** Oscar Martinez Martinez (Matrícula: 3523110806)
- **Commit SHA evaluado:** [Pendiente de integración en dev-oscar]
- **Decisión técnica:** [Pendiente]
- **Prueba:** [Pendiente]
- **Limitación:** [Pendiente]
- **Uso de IA:** [Pendiente]
