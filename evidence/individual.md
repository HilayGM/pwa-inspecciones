# Evidencia individual

## Martin Moreno Libreros — Semana 10: Lead de Contenedores y Automatización de Build

- **Estudiante:** Martin Moreno Libreros (Matrícula: `352***349`, enmascarada)
- **Commit SHA evaluado:** `7463fa84b9da1dcd8bd7cb49fd92510a4f74c451`
- **Decisión técnica que puedo explicar:** Diseñé un `Dockerfile` multi-etapa (`base`, `deps`, `build`, `runner`) basado en `node:20-alpine` para garantizar reproducibilidad determinista, aislamiento de dependencias de desarrollo y un runtime mínimo sin privilegios. En la etapa `deps`, ejecuté `npm ci` con `libc6-compat`. En `build`, aislé la compilación de Next.js (`npm run build`). En `runner`, configuré las variables `NODE_ENV=production`, `PORT=3000` y `HOSTNAME="0.0.0.0"`, creando un usuario y grupo de sistema sin privilegios (`nextjs:nodejs`, UID 1001) para ejecutar `next start` mediante `npm start` y no exponer la raíz del contenedor. Incluí metadatos OCI (`org.opencontainers.image.version`) parametrizados mediante `ARG VERSION` y `HEALTHCHECK` activo con `wget` en `http://127.0.0.1:3000/`. Añadí `.dockerignore` para excluir `node_modules`, `.next`, `.git`, `evidence`, `reports` y `.env*`, y extendí el `Makefile` con los objetivos `docker-build`, `docker-run` y `release` extrayendo dinámicamente la versión de `package.json` y el SHA corto de git sin alterar los objetivos preexistentes.
- **Prueba que ejecuté y resultado:**
  - `npm ci`: Completado limpiamente sin errores (418 paquetes agregados).
  - `npm run build`: Compilación exitosa en Next.js 14.2.35 generando las 6 rutas estáticas y dinámicas con tipado estricto.
  - `make verify`: Verificación de starter y políticas ejecutada exitosamente con salida `Starter verificable: PASS`.
  - `npm test`: Suite completa de pruebas ejecutada sin fallos (starter, manifest, unit, integration, capabilities, security, service-worker, rendering).
- **Limitación o fallo diagnosticado:** En entornos de compilación de desarrollo local sin Docker daemon activo o sin privilegios de socket Docker, la verificación en tiempo de desarrollo depende de la compatibilidad de Node.js del host, mientras que la prueba completa de imagen de contenedor requiere Docker Engine instalado. El service worker de producción (`public/sw.js`) opera de forma explícita sin reemplazar el runtime de Next.js.
- **Cambio que podría defender o modificar en vivo:** Puedo modificar o ajustar las etapas del `Dockerfile` (como ajustar los argumentos de versión, el usuario de sistema `nextjs` o la frecuencia del `HEALTHCHECK`) o las directivas de exclusión en `.dockerignore` y las recetas de empaquetado en el `Makefile`, demostrando que el build de Next.js y el arranque con `next start` continúan funcionando limpiamente.
- **Uso declarado de IA (herramienta, propósito, validación):**
  - *Herramienta:* Antigravity (Gemini).
  - *Propósito:* Asistencia en la estructuración multi-etapa del Dockerfile para Next.js, reglas de `.dockerignore` y objetivos del `Makefile`.
  - *Validación humana:* Ejecución y comprobación manual de `npm ci`, `npm run build`, `make verify` y `npm test`, validación de sintaxis de Dockerfile y verificación de permisos de usuario.

## Felipe Mora Lopez — Semana 10: Smoke test y Verificación E2E

- **Estudiante:** Felipe Mora Lopez (Matrícula: `3523110443`)
- **Rama:** `dev-felipe`
- **Decisión técnica que puedo explicar:** Implementé `tests/smoke.spec.ts` con `fetch` nativo para comprobar los endpoints críticos, usando `SMOKE_URL` configurable y `http://localhost:3000` como valor predeterminado. Añadí `public/version.json` para exponer la versión `1.0.0`, incorporé `test:smoke` a `package.json` y conecté el smoke test al final de `npm test`, sin añadir dependencias. Documenté ambos comandos y sus validaciones en el README.
- **Pruebas que ejecuté y resultado:**
  - `npm run build`: Compilación de producción exitosa.
  - `npm run test:smoke`: Aprobado; verificó `/`, `/manifest.webmanifest`, `/sw.js`, `/inspecciones` y `/version.json`.
  - `npm run test:e2e`: Aprobado, 4 pruebas y 0 fallos.
  - `npm test`: Suite aprobada; en esa ejecución Playwright omitió E2E porque Chromium no estaba instalado. Posteriormente, ejecuté E2E por separado con Chromium disponible.
- **Limitación o fallo diagnosticado:** La primera ejecución E2E falló porque se estaban sirviendo artefactos de desarrollo cuyo runtime de React Refresh era bloqueado por la Content Security Policy. Reconstruí los artefactos de producción con `npm run build` y repetí E2E con las cuatro pruebas aprobadas.
- **Cambio que podría defender o modificar en vivo:** Puedo ampliar las comprobaciones del smoke test o ajustar la URL del servidor mediante `SMOKE_URL`, y demostrar tanto la validación directa como la integración del smoke test con `npm test`.
- **Uso declarado de IA (herramienta, propósito, validación):**
  - *Herramienta:* Copilot.
  - *Propósito:* Apoyo en la implementación y documentación del smoke test y el diagnóstico de las pruebas E2E.
  - *Validación humana:* Ejecución de `npm run build`, `npm run test:smoke` y `npm run test:e2e`; las cuatro pruebas E2E pasaron tras reconstruir la aplicación.

## Oscar Martínez — Semana 10: Versionado, release, rollback y documentación

- **Estudiante:** Oscar Martínez Martínez (Matrícula: `352***806`, enmascarada)
- **Integrante:** 3
- **Rama:** `dev-oscar`
- **Primer commit:** `f7db91d4c3638e1a9db44d1b9da18fd628485df1`
- **Responsabilidad:** Versionado SemVer, generación de versión, proceso de release, estrategia de rollback y documentación.
- **Decisión técnica:** Mantener la versión `0.10.0`, generar `public/version.json` mediante `scripts/generate-version.mjs` y conservar la procedencia de la fuente del SHA mediante `shaSource`.
- **Versionado:** Se valida SemVer para versiones normales, prerelease y metadata. Las etiquetas Git previstas siguen el formato `vX.Y.Z` y deben crearse manualmente.
- **Generación de versión:** El generador prioriza `GIT_COMMIT_SHA`, después `VERSION_SHA` y finalmente `git rev-parse HEAD`. También acepta `SOURCE_DATE_EPOCH` para generar una fecha ISO 8601 reproducible.
- **Archivos de mi alcance:** `package.json`, `scripts/generate-version.mjs`, `tests/unit/generate-version.spec.mjs`, `public/version.json`, `docs/release-process.md`, `docs/runbook.md` y la evidencia individual separada de Semana 10.
- **Pruebas ejecutadas:**
  - `node --test tests/unit/generate-version.spec.mjs`: 11 aprobadas, 0 fallos.
  - `npm run version`: correcto; versión `0.10.0`, SHA `f7db91d4c3638e1a9db44d1b9da18fd628485df1`, `shaSource: git`.
  - `git diff --check`: correcto.
  - `npm run build`: falló al cargar `next.config.mjs` por `EPERM` al acceder a `C:\Users\oscar` desde `node_modules/temp-dir`; el `prebuild` sí se ejecutó correctamente.
- **Release y rollback:** La documentación distingue rollback de imagen, `git revert` y recuperación de una etiqueta anterior. También protege IndexedDB y la cola de sincronización offline.
- **Limitaciones reales:** La integración Docker queda pendiente porque Dockerfile y Makefile necesitan cambios compartidos para transmitir `GIT_COMMIT_SHA` y `SOURCE_DATE_EPOCH`. `package-lock.json` conserva `0.1.0` porque `agents/rules.md` prohíbe modificarlo. El simulacro de rollback no se ejecutó.
- **Separación de responsabilidades:** La implementación de Dockerfile, Makefile, HEALTHCHECK y empaquetado pertenece a Martin y no se atribuye a este aporte.
- **Uso declarado de IA:** Codex se utilizó para estructurar el generador, las pruebas aisladas y la documentación. La validación humana consistió en ejecutar las 11 pruebas, `npm run version`, `npm run build` y `git diff --check`, registrando también el fallo real del build.
