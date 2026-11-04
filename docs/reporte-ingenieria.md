# Reporte de Ingeniería — Semana 10: Release reproducible, smoke test y rollback

## 1. Alcance implementado y cómo ejecutar el proyecto

Esta iteración automatiza la entrega reproducible, empaquetado en contenedor, verificación continua mediante smoke test, versionado SemVer dinámico y procedimientos de recuperación y rollback para la PWA de Inspecciones de Laboratorio de la Universidad Tecnológica de Tehuacán.

### Comandos de instalación, compilación y verificación

Probado en **Node.js v20.x / v22.x** y **Next.js 14.2.35**:

```bash
# 1. Instalación limpia y determinista desde package-lock.json
npm ci

# 2. Compilación de producción (genera public/version.json vía prebuild y compila Next.js)
npm run build

# 3. Verificación de artefactos obligatorios e higiene de variables
make verify
# O comando equivalente exacto:
npm run verify

# 4. Smoke test automatizado (inicia servidor temporal si no está activo, o prueba contra SMOKE_URL)
npm run test:smoke

# 5. Suite completa de pruebas automatizadas (starter, manifest, unit, integration, capabilities, security, sw, rendering, e2e, smoke)
npm test

# 6. Construcción y ejecución del contenedor reproducible Docker
make docker-build
make docker-run
```

---

## 2. Arquitectura de release y decisiones técnicas

1. **Empaquetado multi-etapa reproducible (`Dockerfile` y `.dockerignore`):**
   - Estructurado en 4 etapas basadas en `node:20-alpine`: `base`, `deps` (`npm ci` con `libc6-compat`), `build` (`npm run build` con propagación de `GIT_COMMIT_SHA` y `SOURCE_DATE_EPOCH`) y `runner`.
   - El runtime opera bajo un usuario y grupo sin privilegios (`nextjs:nodejs`, UID 1001), expone el puerto 3000 con `HEALTHCHECK` activo vía `wget http://127.0.0.1:3000/` y asigna etiquetas OCI (`org.opencontainers.image.version`).
   - `.dockerignore` excluye estrictamente `.git`, `node_modules`, `.next`, `evidence`, `reports` y `.env*`.
2. **Generación determinista de identidad y versión (`scripts/generate-version.mjs` y `public/version.json`):**
   - El hook `prebuild` ejecuta `generate-version.mjs` validando SemVer (`0.10.0`).
   - Resuelve el commit SHA con prioridad estricta: `GIT_COMMIT_SHA` → `VERSION_SHA` → `git rev-parse HEAD`. Registra la procedencia en el campo `shaSource`.
   - Soporta `SOURCE_DATE_EPOCH` para convertir timestamps Unix a ISO 8601 UTC deterministas en pipelines reproducibles.
3. **Smoke test autónomo y resiliente (`tests/smoke.spec.ts`):**
   - Implementado sin dependencias externas usando `fetch` nativo.
   - Detecta si el servidor en `SMOKE_URL` (por defecto `http://localhost:3000`) ya se encuentra en ejecución (por ejemplo, en Docker o entorno de staging). Si no está disponible en un host local, inicia automáticamente una instancia de producción temporal de Next.js, ejecuta las 5 validaciones críticas (`/`, `/manifest.webmanifest`, `/sw.js`, `/inspecciones`, `/version.json`) y garantiza la detención limpia del proceso en el bloque `finally`.
4. **Runbook y procedimiento de rollback (`docs/runbook.md` y `docs/release-process.md`):**
   - Establece criterios claros de detección de fallo, recuperación de imágenes etiquetadas previamente (evitando `latest`), distinción entre rollback de contenedor y `git revert`, y protección de IndexedDB y la cola de sincronización offline durante reversiones del Service Worker.

---

## 3. Trade-offs (Alternativas consideradas, elección y coste aceptado)

| Decisión | Alternativa considerada | Elección aplicada | Coste / Trade-off aceptado |
|---|---|---|---|
| **Smoke test autónomo vs. dependencia de servidor manual externo** | Exigir que el desarrollador o CI levante `next start` en segundo plano antes de `npm test`. | Detección activa en `tests/smoke.spec.ts`: prueba servidor existente o levanta instancia temporal local con apagado garantizado. | Agrega ~1.5s a la ejecución de `npm test` cuando no hay servidor previo, a cambio de eliminar fallos espurios por `ECONNREFUSED` en cualquier entorno de CI o local. |
| **Paso de metadatos de build a Docker mediante ARG vs. inclusión de `.git`** | Copiar el directorio `.git` al contexto Docker para que `git rev-parse HEAD` funcione dentro del contenedor. | Excluir `.git` en `.dockerignore` y transmitir `GIT_COMMIT_SHA` y `SOURCE_DATE_EPOCH` vía `--build-arg` en `Makefile`. | Requiere que el comando de build externo pase los argumentos de compilación, pero mantiene la imagen ligera, segura y libre de historiales de git o credenciales. |
| **Generación de versión en archivo estático vs. endpoint dinámico en memoria** | Calcular versión y SHA al vuelo en un Route Handler `/api/version`. | Generar `public/version.json` durante el `prebuild`. | La versión queda fijada como artefacto inmutable del build, disponible tanto por fetch como directamente por el Service Worker y el cliente sin costo computacional por request. |
| **Rollback de imagen fija vs. etiqueta `latest`** | Realizar rollback re-etiquetando `latest`. | Despliegue y reversión basados en tags inmutables de versión (`pwa-inspecciones:0.9.0`) y SHA corto. | Requiere mantener un inventario de versiones previas, pero previene inconsistencias por mutabilidad de etiquetas de contenedor. |

---

## 4. Evidencia de verificación y pruebas ejecutadas

| Comando ejecutado | Propósito | Resultado observado |
|---|---|---|
| `npm run test:smoke` | Smoke test de endpoints críticos, manifest, SW y versión | **PASS** — `/`, manifest, `/sw.js`, `/inspecciones` y `/version.json` verificados (HTTP 200). |
| `npm run test:unit` | Pruebas unitarias de backoff, conflictos, adaptadores y generador de versión | **PASS** — 39 pruebas aprobadas en 7 suites, 0 fallidas (incluyendo las 11 de `generate-version.spec.mjs`). |
| `npm run test:integration` | Persistencia IndexedDB, idempotencia post-commit y API | **PASS** — 18 pruebas aprobadas, 0 fallidas. |
| `npm run test:security` | Pruebas de seguridad, cabeceras, saneamiento y detección de secretos | **PASS** — 30 pruebas aprobadas, 0 fallidas. |
| `npm run test:rendering` | Contratos AST de componentes CSR/SSR | **PASS** — 13 pruebas aprobadas, 0 fallidas. |
| `npm run test:capabilities` | Permisos y limpieza de cámara, GPS y notificaciones | **PASS** — 15 pruebas aprobadas, 0 fallidas. |
| `npm run test:service-worker` | Contrato estático de `public/sw.js` | **PASS** — `service-worker.spec.ts: PASS`. |
| `npm test` | Suite completa de pruebas ejecutada de extremo a extremo | **PASS** — Todas las suites unitarias, integración, seguridad, rendering y smoke test aprobadas limpiamente. |
| `npm run build` | Compilación de producción y generación de versión estática | **PASS** — Genera `.next` optimizado y `public/version.json` (Next.js 14.2.35). |
| `npm run verify` (`make verify`) | Verificación de artefactos obligatorios de Semana 10 y ausencia de fugas de variables | **PASS** — Genera `reports/verification.json` con `status: "pass"` (24 artefactos verificados). |

---

## 5. Trabajo individual atribuible por integrante (Semana 10)

- **Martin Moreno Libreros (Matrícula: `352***349`) — Integrante 1 (Lead de Contenedores y Automatización):**
  - Creación del `Dockerfile` multi-etapa con usuario sin privilegios `nextjs:nodejs` (UID 1001), `HEALTHCHECK` activo y metadatos OCI.
  - Creación de `.dockerignore` y automatización en `Makefile` (`docker-build`, `docker-run`, `release`).
  - Documentación de Setup y Ejecución con Docker en `README.md`.
- **Felipe Mora López (Matrícula: `352***443`) — Integrante 2 (Lead de Smoke Test y Verificación E2E):**
  - Diseño e implementación de `tests/smoke.spec.ts` con verificación de `/`, `/manifest.webmanifest`, `/sw.js`, `/inspecciones` y `/version.json`.
  - Integración del script `test:smoke` y verificación de compatibilidad E2E y Service Worker.
- **Oscar Martínez Martínez (Matrícula: `352***806`) — Integrante 3 (Lead de Versionado, Release, Rollback y Documentación):**
  - Implementación del generador `scripts/generate-version.mjs` con validación SemVer (`0.10.0`), prioridad de fuentes de SHA y soporte `SOURCE_DATE_EPOCH`.
  - Creación de las 11 pruebas unitarias en `tests/unit/generate-version.spec.mjs`.
  - Elaboración de `docs/release-process.md` y `docs/runbook.md` con manual operativo de recuperación y protección de datos offline.

---

## 6. Limitaciones conocidas y pasos para resolverlas

1. **Entorno Docker local:** La construcción y ejecución directa de contenedores con `make docker-build` y `make docker-run` requiere tener instalado y activo el daemon de Docker en el host. En hosts sin Docker, la aplicación se ejecuta y verifica al 100% mediante Node.js nativo (`npm run build`, `npm start`, `npm test`).
2. **Caché fija del Service Worker en rollback:** `public/sw.js` utiliza el identificador de caché `pwa-inspections-v1`. En un procedimiento de rollback, el manual operativo especifica cómo purgar cachés incompatibles en Cache Storage sin tocar IndexedDB para salvaguardar las inspecciones locales pendientes de sincronización.

