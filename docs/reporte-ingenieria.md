# Reporte de Ingeniería — Semana 09: Modelo de Amenazas, Seguridad y Privacidad Aplicada

## 1. Alcance implementado y cómo ejecutar el proyecto

Esta iteración endurece la PWA de Inspecciones de Laboratorio para la Universidad Tecnológica de Tehuacán bajo los lineamientos de un sujeto obligado mexicano (LGPDPPSO), conectando los controles de validación, saneamiento XSS, Content Security Policy (CSP), cabeceras HTTP de protección, higiene de secretos y políticas de rastreo directamente en el flujo de ejecución de la aplicación.

### Comandos de instalación, compilación y verificación

Probado localmente sobre **Node.js v22.x / v21.7.3** y **Next.js 14.2.35** (en CI bajo Ubuntu con **Node.js 22**):

```bash
# 1. Instalación limpia y determinista desde package-lock.json
npm ci

# 2. Compilación de producción (Next.js build, chequeo de tipos y generación estática/SSR)
npm run build

# 3. Verificación estructural y de higiene de entorno
make verify
# Equivalente exacto en entornos Windows sin GNU Make:
npm run verify

# 4. Ejecución de pruebas automatizadas de seguridad (30 pruebas en 5 suites)
npm run test:security

# 5. Suite completa de pruebas (starter, manifest, unit, integration, capabilities, security, sw, rendering, e2e)
npm test
```

---

## 2. Arquitectura de seguridad y decisiones técnicas

1. **Configuración compartida ESM + TypeScript para Cabeceras y CSP (`src/lib/security/headers-config.mjs` y `src/lib/security/headers.ts`):**
   - `next.config.mjs` es cargado por Node.js antes del compilador TypeScript de Next.js. Para conectar las cabeceras en `next.config.mjs` sin duplicar código ni romper `tsconfig.json` (`allowJs: false`), se extrajo la definición canónica a `headers-config.mjs` con su declaración tipada `headers-config.d.ts`, consumida tanto por `next.config.mjs` (`async headers()`) como por `src/app/api/inspecciones/route.ts`.
   - Se eliminó `'unsafe-eval'` de `script-src` en la CSP, conservando únicamente `'self'` y `'unsafe-inline'` (requerido por los scripts de hidratación de Next.js 14 sin middleware de nonces).
2. **Validación y saneamiento en fronteras del sistema (`src/lib/security/validation.ts`):**
   - `src/app/inspecciones/[id]/page.tsx` invoca `validateInspectionId(id)` antes de buscar en los registros, disparando `notFound()` ante cualquier intento de *path traversal* (`..`, `/`, `\`) o formato no canónico, y sanea el registro con `validateAndSanitizeInspection`.
   - `src/app/api/inspecciones/route.ts` valida parámetros de consulta (`?id=`, `?q=`), responde con HTTP `400` ante identificadores maliciosos, sanea la salida y adjunta las cabeceras de seguridad además de `Cache-Control: no-store`.
   - Se refinó `EVENT_HANDLER_REGEX` para filtrar exclusivamente eventos reales del DOM (`onerror=`, `onload=`, `onclick=`, etc.) sin alterar palabras legítimas en español/inglés como `online=`, y se conectó `DANGEROUS_URI_REGEX` / `isSafeUri` para bloquear esquemas `javascript:`, `vbscript:`, `file:` y `data:` no gráficos.
3. **Verificación activa de secretos y artefactos (`scripts/verify.mjs` y `src/lib/security/secrets.ts`):**
   - `scripts/verify.mjs` verifica la presencia de todos los entregables obligatorios de la Semana 09 y escanea `process.env` para fallar si alguna variable `NEXT_PUBLIC_*` expone nombres de secretos o claves privadas.
4. **Políticas de rastreo (`public/robots.txt`):**
   - Se bloquea tanto `/inspecciones` (listado sin barra final) como `/inspecciones/` y `/api/` para evitar la indexación de rutas operativas internas.

---

## 3. Trade-offs (Alternativas consideradas, elección y coste aceptado)

| Decisión | Alternativa considerada | Elección aplicada | Coste / Trade-off aceptado |
|---|---|---|---|
| **Saneamiento XSS sin dependencias externas** | Incorporar `dompurify` + `jsdom` en servidor. | Funciones puras en `src/lib/security/validation.ts` con expresiones regulares acotadas y escape HTML explícito. | Evita modificar `package-lock.json` (regla estricta del repositorio) y ejecuta en < 5 ms, a cambio de mantener pruebas exhaustivas sobre los patrones de filtrado. |
| **CSP estática en `next.config.mjs` vs. Nonces dinámicos en Middleware** | Generar nonces criptográficos por petición en `src/middleware.ts`. | CSP conectada en `next.config.mjs` (`async headers()`) y en la API, sin `'unsafe-eval'` pero manteniendo `'unsafe-inline'`. | Los nonces dinámicos fuerzan todas las páginas a renderizado dinámico e impiden el precacheo estático offline del App Shell en el Service Worker. Se priorizó no romper el modo offline de la PWA. |
| **Precisión geográfica y cámara en memoria** | Almacenar fotos en IndexedDB y usar GPS de alta precisión (`enableHighAccuracy: true`). | Stream `<video>` solo en memoria (`audio: false`) y lectura puntual con redondeo a 3 decimales (~110 m). | No permite adjuntar evidencia fotográfica persistente en esta fase, pero garantiza minimización de datos (LGPDPPSO) y cero retención de datos biométricos o ubicación exacta. |
| **Doble en memoria para inyección de fallas post-commit** | Levantar un backend remoto con base de datos externa. | Simulación determinista con `fake-indexeddb` y doble de servidor que falla tras el commit y deduplica por `idempotencyKey`. | Permite ejecución 100% reproducible en CI sin servicios externos, aunque no certifica el aislamiento transaccional de un motor SQL en producción. |

---

## 4. Evidencia de verificación y pruebas ejecutadas

| Comando ejecutado | Propósito | Resultado observado |
|---|---|---|
| `npm run test:security` | Suite unitaria y de integración de seguridad (`tests/security.spec.ts`) | **PASS** — 30 pruebas aprobadas en 5 suites, 0 fallidas. |
| `npm run test:unit` | Pruebas unitarias de backoff, conflictos y adaptadores (`tests/unit/`) | **PASS** — 28 pruebas aprobadas, 0 fallidas. |
| `npm run test:integration` | Persistencia IndexedDB, idempotencia post-commit y API (`tests/sync.spec.ts`, `tests/integration/`) | **PASS** — 18 pruebas aprobadas, 0 fallidas. |
| `npm run test:rendering` | Contratos AST de componentes CSR/SSR (`tests/rendering.spec.ts`) | **PASS** — 13 pruebas aprobadas, 0 fallidas. |
| `npm run test:capabilities` | Permisos y limpieza de cámara, GPS y notificaciones (`tests/capabilities.spec.ts`) | **PASS** — 15 pruebas aprobadas, 0 fallidas. |
| `npm run test:service-worker` | Contrato estático de `public/sw.js` | **PASS** — `service-worker.spec.ts: PASS`. |
| `npm run build` | Compilación de producción y validación de tipos en Next.js 14.2.35 | **PASS** — `exit code 0`, rutas estáticas y dinámicas generadas. |
| `npm run verify` (`make verify`) | Verificación de artefactos obligatorios y ausencia de fugas `NEXT_PUBLIC_*` | **PASS** — Genera `reports/verification.json` con `status: "pass"`. |

---

## 5. Trabajo individual atribuible por integrante

- **Martin Moreno Libreros (Matrícula: `352***349`) — Lead de Lógica de Seguridad y Configuración:**
  - Diseño, implementación e integración en runtime de `src/lib/security/` (`validation.ts`, `headers-config.mjs`, `headers.ts`, `secrets.ts`, `index.ts`), conexión en `next.config.mjs`, `src/app/api/inspecciones/route.ts` y `src/app/inspecciones/[id]/page.tsx`, `public/robots.txt`, `scripts/verify.mjs` y suite `tests/security.spec.ts`.
- **Felipe Mora López (Matrícula: `352***443`) — Lead de Modelado de Amenazas y Privacidad:**
  - Elaboración del modelo formal STRIDE en `docs/threat-model.md` y de la matriz de ciclo de vida y minimización bajo LGPDPPSO en `docs/privacy-data-inventory.md`.
- **Oscar Martínez Martínez (Matrícula: `352***806`) — Lead de Resiliencia, Inyección de Fallas y Documentación Operativa:**
  - Escenario de inyección de fallas post-commit e idempotencia en `tests/sync.spec.ts`, reportes estructurados en `reports/week-09/fault-injection.json` y `evidence/week-09/engineering.json`, y documentación operativa.

---

## 6. Limitaciones conocidas y pasos para resolverlas

1. **Comportamiento de `public-tests/check.sh`:** El script público contiene la instrucción `! rg -n -i '(api[_-]?key|secret|password|token)' --glob '!public-tests/check.sh' .`. Dado que busca coincidencias textuales en todo el árbol del repositorio, marca palabras legítimas en español/inglés presentes en `ASSIGNMENT.md` ("secretos", "tokens"), `evaluation.json`, `package-lock.json` (`js-tokens`) y los nombres de las propias funciones de seguridad. No existen secretos reales ni archivos `.env` en el repositorio.
2. **Autenticación y cifrado en reposo:** La aplicación opera con datos 100% sintéticos y sin backend multiusuario real. Antes de procesar datos reales en producción, se debe incorporar autenticación institucional (OAuth2/OIDC), autorización RBAC en servidor y políticas de expiración (TTL) en IndexedDB para equipos compartidos.

