# Evidencia individual

## Martin Moreno Libreros — Seguridad y Privacidad: Lead de Lógica de Seguridad y Configuración

- **Estudiante:** Martin Moreno Libreros (Matrícula: 3523110349)
- **Commit SHA evaluado:** `PENDING_COMMIT_SHA`
- **Rol y alcance asignado:** Lead de Lógica de Seguridad y Configuración. Responsable de la arquitectura y diseño de los módulos de sanitización y validación estricta (`src/lib/security/validation.ts`), Content Security Policy y cabeceras HTTP de protección (`src/lib/security/headers.ts`), detección y salvaguarda de secretos (`src/lib/security/secrets.ts`), barrel de exportación (`src/lib/security/index.ts`), directivas de privacidad para rastreadores (`public/robots.txt`) y suite de pruebas automatizadas de seguridad (`tests/security.spec.ts`).
- **Decisión técnica que puedo explicar:**
  1. *Sanitización en múltiples capas sin dependencias externas:* Implementé funciones puras de saneamiento de texto (`sanitizeText`, `escapeHtml`) que eliminan etiquetas HTML maliciosas, scripts incrustados, estilos e iframes con todo su contenido interior, controladores de eventos en línea (`onerror`, `onload`, `onclick`) y esquemas peligrosos (`javascript:`, `vbscript:`, `data:` no gráfico). Esta arquitectura de funciones puras garantiza cero dependencias adicionales en `package-lock.json` y tiempos de ejecución sub-segundo tanto en Node.js como en navegadores.
  2. *Validación canónica y defensiva:* Implementé `validateAndSanitizeInspection` y `validateInspectionId`, bloqueando ataques de Path Traversal (`..`, `/`, `\`), garantizando formato estricto `inspection-[a-zA-Z0-9_-]{1,64}`, fechas ISO 8601 con calendario real (validando años bisiestos y días máximos por mes) y rangos acotados de hallazgos para prevenir desbordamientos o manipulación de estado.
  3. *Content Security Policy (CSP) restrictiva y cabeceras HTTP:* Definí directivas estrictas (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`) junto con cabeceras `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy: camera=(self), geolocation=(self), microphone=()`, mitigando Clickjacking, MIME-sniffing e inyección de plugins.
  4. *Prevención de fuga de secretos y saneamiento de registros:* Implementé `detectExposedSecrets` y `assertNoClientSecrets` para escanear y bloquear variables públicas `NEXT_PUBLIC_*` que contengan nombres de secretos o claves privadas PEM, además de `sanitizeLogData` que ofusca recursivamente campos críticos (`password`, `token`, `secret`, `credential`, `apiKey`) y expresiones de tokens JWT y Bearer.
  5. *Políticas de rastreo en robots.txt:* Configuré `public/robots.txt` para desautorizar a los motores de búsqueda el rastreo de `/api/` e `/inspecciones/`, impidiendo la indexación inadvertida de registros y datos internos de laboratorio.
- **Pruebas que ejecuté y resultado:**
  - `npm run test:security`: Ejecutó 27 pruebas automatizadas en 5 suites (mitigación de XSS, validación estricta de registros, CSP y cabeceras de protección, detección de secretos y robots.txt). Resultado: 27 aprobadas, 0 fallidas, 0 canceladas o ignoradas en 295 ms.
  - `npm test`: Ejecutó la pirámide completa de pruebas (starter, manifiesto, unitarias, integración, capacidades, seguridad, Service Worker, rendering y E2E Playwright) con código de salida 0.
  - `npm run build`: Compilación de producción en Next.js completada con éxito (`exit code 0`), generando todas las páginas y rutas estáticas y dinámicas sin errores de tipos ni advertencias de linting.
  - `npm run verify`: Ejecutó la verificación estructural con código de salida 0 generando `reports/verification.json`.
- **Limitación o fallo diagnosticado:**
  - *Fallo diagnosticado y corregido:* Se diagnosticó que en la sanitización inicial, etiquetas compuestas con contenido como `<marquee>` o tags anidados preservaban texto si no se normalizaba el flujo de tokens, y que iframes o bloques de estilo podían dejar reglas CSS no deseadas en cadenas de texto plano; se añadieron expresiones regulares específicas para depurar bloques completos de `style` e `iframe`.
  - *Limitación:* La sanitización y validación en `src/lib/security/` protegen la lógica de la aplicación y la interfaz de usuario en el cliente y servidor Node.js, pero en arquitecturas multi-inquilino o con bases de datos remotas, deben complementarse con autorización basada en roles (RBAC) y validación en el gateway de la API para endpoints de escritura.
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

## Evidencia de Implementación - Felipe Mora López
- **SHA Completo del commit:** c8969c743f350dde5e2531ce28c3f195581b1a1d
- **Decisión técnica:** Implementación de notificaciones locales con Service Workers, fallback a API estándar y manejo estricto de estados en bloques try/catch para evitar bloqueos.
- **Prueba:** Validación del prompt de permisos solo bajo interacción y recepción de mensajes sintéticos.
- **Limitación:** Sin push remoto; las notificaciones operan solo con la PWA activa o el Service Worker en segundo plano.
- **Uso de IA:** Generación de código y documentación mediante IA en el IDE con instrucciones estrictas de no alterar código ajeno, bloquear PII y usar fallbacks seguros.
- **Validación humana:** Revisión manual para asegurar la ausencia de datos sensibles y verificar que no haya llamadas automáticas al montar la app.

## Pruebas, documentación y CI - Oscar Martinez Martinez

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
- **Commit SHA evaluado:** 9562d78e96ade5fba0846bdff948ff35023ea509 - test: agregar pruebas de integración, actualizar evidencia y resolver tipos de nodo - Integrado en rama principal mediante PR #20, commit `f7c02e0`
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

- **Estudiante:** Oscar Martinez Martinez (Matrícula: 3523110806).
- **Commit SHA de entrega:** `5364a2edf0f7ae1221900902cb1f750fce42c54d`.
- **Rol y alcance:** Lead de Pruebas E2E, Pipeline de CI y Documentación Operativa. Implementé `tests/e2e/critical-path.spec.ts`, el workflow `.github/workflows/academic-evaluation.yml`, los scripts de pruebas por nivel, una prueba de integración del handler API y la documentación operativa.

- **Decisiones técnicas y trade-offs:** La suite Playwright valida el dashboard, el listado CSR, el detalle de la inspección sintética `inspection-001` y el shell `/` servido desde caché cuando se simula el modo offline. No se afirma que el listado funcione sin conexión, porque el Service Worker excluye `/api/`. La suite de integración comprueba el contrato del endpoint y utiliza pruebas relacionadas con la cola e IndexedDB sintética. Se conservaron los contratos de Semana 06 mediante adaptadores compatibles para cámara y geolocalización.

- **Pruebas ejecutadas y resultados reportados:** `npm ci` terminó correctamente e instaló 416 paquetes. `npm run build`, `npm test` y `npm run verify` terminaron con código 0. Los resultados reportados fueron: unitarias 28/28, integración 17/17, capacidades 15/15, rendering 13/13 y Playwright 4/4. El contrato estático del Service Worker reportó PASS. `npm run verify` generó `reports/verification.json`.

- **Limitaciones conocidas:** El comportamiento offline garantiza el shell del dashboard después de una visita online; el listado CSR y la API no se almacenan en caché. `bash public-tests/check.sh` quedó pendiente de ejecución porque el entorno local no pudo iniciar Bash. La versión local de Node fue 21.7.3, mientras que CI está configurado para Node 22. La primera ejecución de capacidades falló por un mock sin `accuracy`; después de ajustar el dato sintético, la suite completa reportó éxito.

- **Uso declarado de IA y validación humana:** Utilicé OpenAI Codex como apoyo para implementar, resolver los conflictos autorizados, escribir pruebas y documentación y revisar resultados. Los resultados automatizados se registran arriba. La revisión final y aprobación de entrega corresponden a Oscar.

- **Estado de integración:** Commit de entrega creado localmente. Pendiente confirmar la publicación de la rama `dev-oscar` y la ejecución de los checks remotos de GitHub Actions.