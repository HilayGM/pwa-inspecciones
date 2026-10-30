# Modelo de amenazas — PWA de inspecciones

## 1. Alcance y objetivo

Este análisis cubre la PWA de inspecciones de laboratorio, su almacenamiento local, el Service Worker, la ruta de lectura de inspecciones y las capacidades de cámara y geolocalización. Se utiliza STRIDE para identificar amenazas y documentar controles observables en el repositorio. La aplicación de demostración utiliza registros sintéticos; eso reduce el impacto de una filtración, pero no sustituye controles de acceso ni protege la integridad del sistema.

**Fuera de alcance/no demostrado:** infraestructura de despliegue, configuración efectiva de HTTPS en el proveedor de hosting, identidad y autorización de usuarios, persistencia de un backend remoto, monitoreo y retención operativa. No se debe inferir que están implementados por la existencia de código cliente o de una política configurada.

## 2. Componentes, activos y límites de confianza

| Componente/activo | Datos o función | Límite de confianza y exposición |
|---|---|---|
| Registros de inspección | ID, laboratorio, fecha, etiqueta sintética de inspector, estado, hallazgos y resumen | Fixture en memoria y respuesta de `GET /api/inspecciones`; puede guardarse localmente para uso sin conexión. |
| IndexedDB (`pwa-inspecciones-sync`) | Inspecciones, cola de sincronización, recibos idempotentes, versiones y estado | Almacenamiento persistente bajo el origen del navegador; accesible a código del mismo origen. No se observa cifrado en reposo ni retención con vencimiento. |
| Service Worker y Cache Storage | Shell de la aplicación y recursos estáticos | Persiste contenido del origen en el navegador. El Service Worker excluye solicitudes `/api/`, solicitudes que no sean `GET` y solicitudes de otros orígenes. |
| Ruta `/api/inspecciones` | Devuelve fixtures de inspección validados y saneados | `GET` responde con `Cache-Control: no-store` y cabeceras de seguridad (`getSecurityHeaders()`); rechaza parámetros `id` maliciosos con HTTP `400`. No implementa autenticación ni almacenamiento remoto. |
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
| **Suplantación (Spoofing)** | Un cliente manipulado puede presentar inspecciones o etiquetas de inspector falsas. | Atribución incorrecta de acciones o información operativa engañosa. | Los IDs y campos se validan en `src/app/inspecciones/[id]/page.tsx` y `src/app/api/inspecciones/route.ts` mediante `validateInspectionId`; los nombres de inspector de los fixtures son etiquetas sintéticas. | Validar formato no autentica a una persona. No se observa autenticación ni autorización en la ruta API. |
| **Manipulación (Tampering)** | XSS en campos de inspección, modificación directa de IndexedDB o respuestas/caché manipuladas. | Ejecución de código del mismo origen o alteración de datos y cola offline. | `sanitizeText`, `escapeHtml`, `isSafeUri`, validación de campos y longitudes; cola con claves idempotentes y versiones local/servidor para resolución de conflictos; el Service Worker limita lo que cachea; CSP sin `'unsafe-eval'`. | El saneamiento por expresiones regulares no reemplaza codificación contextual y defensa en profundidad. IndexedDB no es a prueba de manipulación. Versiones e idempotencia no son firmas ni protección criptográfica. La CSP mantiene `'unsafe-inline'` para hidratación de Next.js. |
| **Repudio (Repudiation)** | Una persona puede negar haber creado o cambiado una inspección offline. | Disputa de autoría o secuencia de cambios. | La cola conserva fechas, intentos, estado y recibos idempotentes; hay versiones para conflictos. | Las fechas son datos de aplicación y no una bitácora firmada e inmutable; no prueban identidad ni no repudio. |
| **Divulgación de información (Information Disclosure)** | XSS, código comprometido del origen o acceso al perfil del navegador puede leer IndexedDB; stream, ubicación o fixture pueden ser expuestos. | Pérdida de confidencialidad. | La información de ejemplo es sintética; cámara y ubicación solo se solicitan con interacción; se desactiva audio; ubicación se redondea a tres decimales; el Service Worker no cachea `/api/`; API marca `no-store`; `robots.txt` desautoriza `/api/`, `/inspecciones` e `/inspecciones/`; `scripts/verify.mjs` verifica ausencia de secretos `NEXT_PUBLIC_*`. | Datos sintéticos no son un control de acceso. `robots.txt` es una directiva voluntaria para rastreadores cooperativos. No se observa cifrado local en IndexedDB. |
| **Denegación de servicio (Denial of Service)** | Entradas grandes, repetición de operaciones offline o agotamiento del almacenamiento/cuota del navegador. | Degradación de la interfaz, bloqueo de sincronización o pérdida de operaciones locales. | Validación acota ubicación (120), inspector (80), resumen (1000) y hallazgos (1000); el reintento tiene límite y backoff. | No se observan cuotas, límite de tamaño agregado de cola ni política de caducidad; la cuota y el borrado del almacenamiento dependen del navegador. |
| **Elevación de privilegios (Elevación de Privilegios)** | Una página embebida, script inyectado o abuso de permisos intenta actuar con capacidades de la aplicación. | Acceso no autorizado a cámara, geolocalización o datos del origen. | Se definen y conectan en `next.config.mjs` (`async headers()`) y en `GET /api/inspecciones`: `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Permissions-Policy` de cámara/geolocalización para el mismo origen. | No se demuestra control de acceso por rol (RBAC) en API para un entorno multiusuario real. |

## 4. Controles técnicos y estado de integración

- **Validación y XSS:** `src/lib/security/validation.ts` valida IDs canónicos (`inspection-...`), fechas, estado, campos de texto, esquemas URI (`isSafeUri`) y límites de longitud; se invoca directamente en `src/app/inspecciones/[id]/page.tsx` y `src/app/api/inspecciones/route.ts`.
- **Almacenamiento y operación offline:** `src/lib/storage/schema.ts` define IndexedDB y almacenes separados para inspecciones, cola y recibos. La cola mantiene versiones, intentos y claves idempotentes. No cifra datos ni evita que código del mismo origen con privilegios pueda alterarlos.
- **Caché:** `public/sw.js` cachea el shell y recursos estáticos; usa red primero para navegación y caché primero para recursos estáticos. Excluye `/api/`, métodos distintos de `GET` y orígenes externos.
- **Cámara/ubicación:** `src/lib/device/camera.ts` fuerza `audio: false`; `src/components/device-capabilities.tsx` muestra el stream en memoria y detiene los tracks al cerrar/desmontar. `src/lib/device/geolocation.ts` solicita una posición, fuerza `enableHighAccuracy: false` y redondea latitud/longitud a tres decimales; no persiste coordenadas en el esquema de inspección.
- **Cabeceras y CSP:** se definen en `src/lib/security/headers-config.mjs` y `src/lib/security/headers.ts`, y están conectadas en `next.config.mjs` mediante `async headers()` y en las respuestas de `src/app/api/inspecciones/route.ts`. Se eliminó `'unsafe-eval'` de `script-src`; se conserva `'unsafe-inline'` por compatibilidad con los scripts de hidratación de Next.js 14.
- **Secretos:** `src/lib/security/secrets.ts` provee detección de variables `NEXT_PUBLIC_*` con nombres sensibles y patrones de claves privadas PEM, además de verificación activa en `scripts/verify.mjs`.
- **Robots:** `public/robots.txt` excluye `/api/`, `/inspecciones` e `/inspecciones/` de rastreadores cooperativos. No controla acceso ni impide solicitudes directas.
- **Transporte:** se espera HTTPS en despliegue junto con `Strict-Transport-Security`.

## 5. Prioridades de tratamiento para evolución a producción

1. Incorporar *nonces* dinámicos por petición en middleware para retirar `'unsafe-inline'` de `script-src` y `style-src`.
2. Implementar autenticación institucional y control de acceso basado en roles (RBAC) en el backend antes de operar con datos reales.
3. Establecer retención con TTL y limpieza programada en IndexedDB para inspecciones y recibos en dispositivos compartidos.
4. Mantener el principio de minimización y cero PII en fixtures y pruebas automatizadas.

## 6. Evidencia y límites de esta revisión

Se inspeccionaron los adaptadores de dispositivo, esquema y cola de IndexedDB, Service Worker, ruta API, página de detalle SSR, configuración de Next.js y controles de seguridad. Durante la verificación se ejecutaron `npm run test:security` (30 aprobadas, 0 fallidas), `npm run test:unit` (28 aprobadas, 0 fallidas), `npm run test:service-worker` (PASS) y `npm run verify` (PASS). Estas pruebas verifican los contratos de código e integración local, no un despliegue HTTPS externo ni controles de acceso multiusuario.
