# Modelo de amenazas — PWA de inspecciones

## 1. Alcance y objetivo

Este análisis cubre la PWA de inspecciones de laboratorio, su almacenamiento local, el Service Worker, la ruta de lectura de inspecciones y las capacidades de cámara y geolocalización. Se utiliza STRIDE para identificar amenazas y documentar controles observables en el repositorio. La aplicación de demostración utiliza registros sintéticos; eso reduce el impacto de una filtración, pero no sustituye controles de acceso ni protege la integridad del sistema.

**Fuera de alcance/no demostrado:** infraestructura de despliegue, configuración efectiva de HTTPS, identidad y autorización de usuarios, persistencia de un backend remoto, monitoreo y retención operativa. No se debe inferir que están implementados por la existencia de código cliente o de una política configurada.

## 2. Componentes, activos y límites de confianza

| Componente/activo | Datos o función | Límite de confianza y exposición |
|---|---|---|
| Registros de inspección | ID, laboratorio, fecha, etiqueta sintética de inspector, estado, hallazgos y resumen | Fixture en memoria y respuesta de `GET /api/inspecciones`; puede guardarse localmente para uso sin conexión. |
| IndexedDB (`pwa-inspecciones-sync`) | Inspecciones, cola de sincronización, recibos idempotentes, versiones y estado | Almacenamiento persistente bajo el origen del navegador; accesible a código del mismo origen. No se observa cifrado en reposo ni retención con vencimiento. |
| Service Worker y Cache Storage | Shell de la aplicación y recursos estáticos | Persiste contenido del origen en el navegador. El Service Worker excluye solicitudes `/api/`, solicitudes que no sean `GET` y solicitudes de otros orígenes. |
| Ruta `/api/inspecciones` | Devuelve fixtures de inspección | `GET` responde con `Cache-Control: no-store`; el código observado no implementa autenticación, escritura ni almacenamiento remoto. |
| Cámara | Stream de video solicitado por acción explícita | El navegador y el dispositivo son límites externos; el stream se conecta a una vista `<video>` en la sesión de la página. |
| Geolocalización | Una posición aproximada | El permiso del navegador y el dispositivo son límites externos; la lectura es puntual y se muestra en la vista actual. |
| Código del mismo origen y configuración de seguridad | Validación, CSP, permisos y detección de secretos | Una XSS ejecutada con éxito podría actuar con los privilegios del origen, incluyendo acceso a datos locales disponibles a la aplicación. |

### Flujos principales

1. La interfaz lee registros de demostración de la API y permite guardar cambios/operaciones localmente para reintento sin conexión.
2. La cola persiste registros y metadatos de sincronización en IndexedDB; las versiones y claves idempotentes apoyan la conciliación y evitan duplicados.
3. El Service Worker ofrece navegación con estrategia *network-first* y fallback al shell, y recursos estáticos con estrategia *cache-first*. No almacena la respuesta de la API en su caché.
4. Bajo interacción de la persona usuaria, el navegador puede entregar un stream de cámara o una lectura puntual de ubicación. El componente presenta el video directamente y muestra las coordenadas redondeadas.

## 3. Evaluación STRIDE

| STRIDE | Amenaza y activo afectado | Impacto | Controles observados | Riesgo residual |
|---|---|---|---|---|
| **Suplantación (Spoofing)** | Un cliente manipulado puede presentar inspecciones o etiquetas de inspector falsas. | Atribución incorrecta de acciones o información operativa engañosa. | Los IDs y campos tienen validaciones de formato; los nombres de inspector de los fixtures son etiquetas sintéticas. | Validar formato no autentica a una persona. No se observa autenticación ni autorización en la ruta API. |
| **Manipulación (Tampering)** | XSS en campos de inspección, modificación directa de IndexedDB o respuestas/caché manipuladas. | Ejecución de código del mismo origen o alteración de datos y cola offline. | `sanitizeText`, escape HTML disponible, validación de campos y longitudes; cola con claves idempotentes y versiones local/servidor para resolución de conflictos; el Service Worker limita lo que cachea. | El saneamiento por expresiones regulares no reemplaza codificación contextual y defensa en profundidad. IndexedDB no es a prueba de manipulación. Versiones e idempotencia no son firmas ni protección criptográfica. La CSP definida incluye `'unsafe-inline'` y `'unsafe-eval'`, lo que reduce su protección frente a XSS. |
| **Repudio (Repudiation)** | Una persona puede negar haber creado o cambiado una inspección offline. | Disputa de autoría o secuencia de cambios. | La cola conserva fechas, intentos, estado y recibos idempotentes; hay versiones para conflictos. | Las fechas son datos de aplicación y no una bitácora firmada e inmutable; no prueban identidad ni no repudio. |
| **Divulgación de información (Information Disclosure)** | XSS, código comprometido del origen o acceso al perfil del navegador puede leer IndexedDB; stream, ubicación o fixture pueden ser expuestos. | Pérdida de confidencialidad. | La información de ejemplo es sintética; cámara y ubicación solo se solicitan con interacción; se desactiva audio; ubicación se redondea a tres decimales; el Service Worker no cachea `/api/`; API marca `no-store`; hay directivas `robots.txt` y un detector de secretos. | Datos sintéticos no son un control de acceso. `robots.txt` es una solicitud voluntaria a rastreadores. El detector de secretos es una utilidad, no evidencia por sí sola de un análisis completo del bundle. No se observa cifrado local. |
| **Denegación de servicio (Denial of Service)** | Entradas grandes, repetición de operaciones offline o agotamiento del almacenamiento/cuota del navegador. | Degradación de la interfaz, bloqueo de sincronización o pérdida de operaciones locales. | Validación acota ubicación (120), inspector (80), resumen (1000) y hallazgos (1000); el reintento tiene límite y backoff. | No se observan cuotas, límite de tamaño agregado de cola ni política de caducidad; la cuota y el borrado del almacenamiento dependen del navegador. |
| **Elevación de privilegios (Elevation of Privilege)** | Una página embebida, script inyectado o abuso de permisos intenta actuar con capacidades de la aplicación. | Acceso no autorizado a cámara, geolocalización o datos del origen. | Se definen `frame-ancestors 'none'`, `X-Frame-Options: DENY` y `Permissions-Policy` de cámara/geolocalización para el mismo origen; el componente solicita capacidades bajo demanda y sin audio. | `src/lib/security/headers.ts` contiene generadores de cabeceras, pero no se encontró su conexión desde `next.config.mjs`; por ello, no se verificó que estas cabeceras lleguen a respuestas servidas. No se demuestra control de acceso por rol en API. |

## 4. Controles técnicos y estado de integración

- **Validación y XSS:** `src/lib/security/validation.ts` valida IDs canónicos (`inspection-...`), fechas, estado, campos de texto y límites de longitud; elimina etiquetas y patrones de entrada conocidos y ofrece `escapeHtml`. Estos controles reducen entradas malformadas, pero las vistas deben mantener renderizado seguro y no confiar en datos locales.
- **Almacenamiento y operación offline:** `src/lib/storage/schema.ts` define IndexedDB y almacenes separados para inspecciones, cola y recibos. La cola mantiene versiones, intentos y claves idempotentes. No cifra datos ni evita que código del mismo origen con privilegios pueda alterarlos.
- **Caché:** `public/sw.js` cachea el shell y recursos estáticos; usa red primero para navegación y caché primero para recursos estáticos. Excluye `/api/`, métodos distintos de `GET` y orígenes externos. Una respuesta del shell puede quedar disponible offline.
- **Cámara/ubicación:** `src/lib/device/camera.ts` fuerza `audio: false`; `src/components/device-capabilities.tsx` muestra el stream en memoria y detiene los tracks al cerrar/desmontar. No se observa captura de fotogramas ni persistencia de fotos. `src/lib/device/geolocation.ts` solicita una posición, fuerza `enableHighAccuracy: false` y redondea latitud/longitud a tres decimales; no persiste coordenadas en el esquema de inspección.
- **Cabeceras y CSP:** se definen CSP y cabeceras en `src/lib/security/headers.ts`, incluyendo protección contra marcos, *MIME sniffing* y restricciones de permisos. Sin integración observada en `next.config.mjs`, debe tratarse como configuración declarada pendiente de verificar en una respuesta real. La CSP además permite `'unsafe-inline'` y `'unsafe-eval'`; no debe describirse como una política estricta contra XSS.
- **Secretos:** `src/lib/security/secrets.ts` provee detección de ciertas variables `NEXT_PUBLIC_*` y patrones de claves privadas. No se encontró una llamada a `assertNoClientSecrets` en el código de la aplicación durante esta revisión; no se afirma que el escaneo se ejecute automáticamente.
- **Robots:** `public/robots.txt` excluye `/api/` e `/inspecciones/` de rastreadores cooperativos. No controla acceso ni impide solicitudes directas.
- **Transporte:** se espera HTTPS en despliegue. La configuración local revisada no demuestra por sí misma que HTTPS esté activo ni que las cabeceras estén aplicadas en producción.

## 5. Prioridades de tratamiento

1. Conectar las cabeceras de seguridad al servidor Next.js y comprobarlas mediante una respuesta HTTP real en el entorno de despliegue.
2. Reforzar CSP (eliminar `unsafe-eval` y, si el framework permite, `unsafe-inline`; usar nonces/hashes cuando corresponda) y probar el flujo de producción antes de cambiarla.
3. Definir autenticación/autorización y validación de servidor antes de usar datos reales o desplegar como sistema operativo; el endpoint observado actualmente solo sirve datos sintéticos.
4. Establecer retención/eliminación de IndexedDB y recibos, y documentar la respuesta ante pérdida o uso compartido del dispositivo.
5. Mantener el principio de no introducir PII: validar que fixtures y nuevas pruebas sigan siendo sintéticos.

## 6. Evidencia y límites de esta revisión

Se inspeccionaron los adaptadores de dispositivo, esquema y cola de IndexedDB, Service Worker, ruta API, configuración de Next.js y controles de seguridad. Durante esta tarea se ejecutaron `npm run test:security` (27 aprobadas, 0 fallidas), `npm run test:unit` (28 aprobadas, 0 fallidas) y `npm run test:service-worker` (PASS). Estas pruebas verifican contratos de código, no despliegue HTTPS, cabeceras servidas, controles de acceso ni seguridad de un navegador en producción.
