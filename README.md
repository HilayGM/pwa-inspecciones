# PWA Inspecciones de Laboratorio — Universidad Tecnológica de Tehuacán

Aplicación Web Progresiva (PWA) *offline-first* para el registro, consulta y sincronización de inspecciones físicas y técnicas en los laboratorios de la Universidad Tecnológica de Tehuacán, operando exclusivamente con datos sintéticos.

## Semana 09: Modelo de Amenazas, Privacidad y Controles de Seguridad Aplicados

En esta entrega se modela la seguridad mediante **STRIDE**, se documenta el inventario de privacidad bajo los principios de minimización de un sujeto obligado mexicano (**LGPDPPSO**) y se conectan los controles técnicos directamente en el runtime de la aplicación:

- **Saneamiento y validación en rutas reales:** `src/lib/security/validation.ts` elimina etiquetas `<script>`, `<style>`, `<iframe>`, atributos de eventos DOM en línea y esquemas peligrosos (`javascript:`, `vbscript:`, `file:`, `data:` no gráficos). Se invoca directamente en la vista de detalle SSR (`src/app/inspecciones/[id]/page.tsx`) y en el endpoint `GET /api/inspecciones` (`src/app/api/inspecciones/route.ts`), rechazando identificadores maliciosos o intentos de *path traversal* con HTTP `400` / `404`.
- **Content Security Policy (CSP) y cabeceras HTTP conectadas:** Definidas en `src/lib/security/headers-config.mjs` y `src/lib/security/headers.ts` y conectadas tanto en `next.config.mjs` (`async headers()`) como en las respuestas de `GET /api/inspecciones`. Incluye `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy: camera=(self), geolocation=(self), microphone=()`, sin `'unsafe-eval'`.
- **Salvaguarda de secretos:** `src/lib/security/secrets.ts` y `scripts/verify.mjs` verifican la ausencia de claves privadas PEM o variables públicas `NEXT_PUBLIC_*` con nombres sensibles, además de redactar tokens y credenciales en registros (`sanitizeLogData`).
- **Política de rastreo (`public/robots.txt`):** Desautoriza el rastreo e indexación tanto de `/api/` como de `/inspecciones` e `/inspecciones/`.

---

## Estructura de Artefactos Obligatorios

- [`docs/threat-model.md`](docs/threat-model.md): Modelo de amenazas bajo metodología STRIDE, activos, límites de confianza y riesgos residuales.
- [`docs/privacy-data-inventory.md`](docs/privacy-data-inventory.md): Inventario y ciclo de vida de datos bajo principios de minimización (LGPDPPSO) y declaración de datos 100% sintéticos.
- [`docs/reporte-ingenieria.md`](docs/reporte-ingenieria.md): Reporte de ingeniería detallado con arquitectura, tabla de *trade-offs*, resultados de pruebas, limitaciones y trabajo individual.
- [`src/lib/security/`](src/lib/security/): Módulos de validación (`validation.ts`), cabeceras y CSP (`headers-config.mjs`, `headers.ts`), resguardo de secretos (`secrets.ts`) y barril de exportación (`index.ts`).
- [`tests/security.spec.ts`](tests/security.spec.ts): Suite de 30 pruebas automatizadas unitarias y de integración sobre saneamiento, validación, cabeceras en runtime, rechazo de IDs maliciosos, secretos y `robots.txt`.
- [`public/robots.txt`](public/robots.txt): Directivas de exclusión para motores de búsqueda en rutas internas y API.
- [`evidence/individual.md`](evidence/individual.md): Evidencia técnica individual de cada integrante con matrículas parcialmente enmascaradas.

---

## Instalación, Compilación y Ejecución

**Entorno probado:** Node.js v22.x (CI Ubuntu) y v21.7.3 (Windows local), Next.js 14.2.35, npm.

```bash
# 1. Instalación limpia reproducible usando package-lock.json
npm ci

# 2. Compilación de producción
npm run build

# 3. Iniciar servidor de producción local
npm run start
```

---

## Verificación y Ejecución de Pruebas (`make verify` ↔ `npm run verify`)

El repositorio incluye un `Makefile` en la raíz donde el objetivo `make verify` invoca exactamente `npm run verify` (`node scripts/verify.mjs`), el cual comprueba todos los artefactos obligatorios (incluidos los de la Semana 09), verifica que no existan variables `NEXT_PUBLIC_*` sensibles y escribe `reports/verification.json`.

```bash
# En Linux / macOS / Git Bash con GNU Make:
make verify

# Equivalente exacto en Windows (PowerShell / CMD) o cualquier entorno Node:
npm run verify

# Suite de seguridad de la Semana 09 (30 pruebas en 5 suites)
npm run test:security

# Suite completa acumulada (starter, manifest, unit, integration, capabilities, security, service-worker, rendering, e2e)
npm test
```

### Resultado de las suites verificadas
- `npm run test:security`: **30 aprobadas, 0 fallidas** (5 suites).
- `npm run test:unit`: **28 aprobadas, 0 fallidas** (6 suites).
- `npm run test:integration`: **18 aprobadas, 0 fallidas** (incluye inyección de fallas post-commit e idempotencia).
- `npm run test:capabilities`: **15 aprobadas, 0 fallidas** (3 suites).
- `npm run test:rendering`: **13 aprobadas, 0 fallidas**.
- `npm run test:service-worker`: **PASS**.
- `npm run test:e2e`: **4 aprobadas, 0 fallidas** (Playwright Chromium).
- `npm run build` y `npm run verify`: **PASS (`exit code 0`)**.

---

## Resumen de Trade-offs y Limitaciones

1. **Funciones puras sin dependencias adicionales:** Se implementó el saneamiento y validación en TypeScript puro para cumplir la restricción de no alterar `package-lock.json` y mantener tiempos de prueba sub-segundo.
2. **CSP compatible con App Shell Offline:** Se eliminó `'unsafe-eval'`, pero se mantiene `'unsafe-inline'` en `script-src` y `style-src` porque los nonces dinámicos por petición obligarían a renderizado dinámico e inhabilitarían el caché offline estático del Service Worker.
3. **Nota sobre `public-tests/check.sh`:** Ejecuta `bash public-tests/check.sh` desde un entorno Bash con `ripgrep` (`rg`). Su búsqueda textual `rg -n -i '(api[_-]?key|secret|password|token)'` inspecciona todos los archivos del repositorio y reporta coincidencias léxicas en la propia documentación del curso (`ASSIGNMENT.md`, `evaluation.json`), el lockfile (`js-tokens`) y los identificadores del detector de secretos, sin que exista ninguna credencial real ni archivo `.env` versionado.
