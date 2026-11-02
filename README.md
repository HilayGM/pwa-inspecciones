# PWA Inspecciones de Laboratorio — Universidad Tecnológica de Tehuacán

Aplicación Web Progresiva (PWA) *offline-first* para el registro, consulta y sincronización de inspecciones físicas y técnicas en los laboratorios de la Universidad Tecnológica de Tehuacán, operando exclusivamente con datos sintéticos.

## Semana 10: Release reproducible, smoke test y rollback

Esta entrega implementa la automatización del empaquetado, despliegue reproducible y resiliencia operativa:

- **Contenedor reproducible multi-etapa (`Dockerfile`):** Imagen de producción optimizada basada en `node:20-alpine`. Se estructura en etapas (`base`, `deps`, `build` y `runner`), aislando dependencias de desarrollo, ejecutando `next start` bajo un usuario sin privilegios (`nextjs:nodejs`, UID 1001), integrando `HEALTHCHECK` activo y metadatos OCI (`org.opencontainers.image.version`) sincronizados con `package.json`.
- **Exclusiones de empaquetado (`.dockerignore`):** Omite estrictamente dependencias locales (`node_modules`), artefactos de compilación (`.next`), historial git (`.git`), carpetas de evidencias y variables de entorno locales (`.env*`).
- **Automatización operativa (`Makefile`):** Objetivos estandarizados para construcción (`make docker-build`), ejecución en contenedor (`make docker-run`) y publicación identificable con versión y SHA corto (`make release`).
- **Smoke test y verificación previa:** Verificación de salud y endpoints críticos antes de promover una versión estable.
- **Runbook y procedimiento de rollback:** Estrategia documentada ante fallos para restaurar versiones estables anteriores e invalidar cachés del Service Worker.

---

## Estructura de Artefactos Obligatorios

- [`Dockerfile`](Dockerfile): Definición multi-etapa para empaquetado reproducible en contenedor con usuario sin privilegios y health check.
- [`.dockerignore`](.dockerignore): Filtro de exclusión de artefactos, cachés y secretos para el contexto de Docker.
- [`Makefile`](Makefile): Automatización de comandos `verify`, `test`, `build`, `docker-build`, `docker-run` y `release`.
- [`docs/release-process.md`](docs/release-process.md): Proceso de liberación, etiquetado y validación de versiones.
- [`docs/runbook.md`](docs/runbook.md): Manual operativo de recuperación ante incidentes y procedimiento de rollback.
- [`tests/smoke.spec.ts`](tests/smoke.spec.ts): Pruebas de humo para validación rápida en despliegue.
- [`.github/workflows/academic-evaluation.yml`](.github/workflows/academic-evaluation.yml): Pipeline de integración continua y feedback formativo.
- [`evidence/individual.md`](evidence/individual.md): Evidencias individuales de ingeniería, decisiones técnicas y uso declarado de IA.

---

## Setup (Requisitos e Instalación)

### Requisitos previos
- **Node.js:** Versión 20 LTS o superior.
- **npm:** Versión 10 o superior (compatible con `package-lock.json`).
- **Docker:** Versión 24.x o superior (opcional para ejecución nativa en host, requerido para contenedor).
- **GNU Make:** Para la ejecución de recetas del `Makefile`.

### Instalación limpia
Para garantizar reproducibilidad determinista sin alterar el árbol de dependencias:

```bash
# Instalación estricta y limpia basada en package-lock.json
npm ci
```

---

## Ejecución

### 1. Ejecución Local (Host)

#### Modo Desarrollo:
```bash
npm run dev
# La aplicación estará disponible en http://localhost:3000
```

#### Modo Producción:
```bash
# Compilar la aplicación Next.js
npm run build

# Iniciar el servidor Next.js en producción
npm run start
# Disponible en http://localhost:3000
```

---

### 2. Ejecución con Docker y Contenedores

La construcción y ejecución se gestionan mediante las recetas del `Makefile` o comandos nativos de Docker:

#### Construcción de la imagen:
```bash
# Construye la imagen etiquetando latest, la versión de package.json y el commit SHA
make docker-build

# O comando equivalente para release:
make release
```

#### Ejecución del contenedor:
```bash
# Levanta el contenedor en el puerto 3000 ejecutando como usuario sin privilegios
make docker-run
```

#### Comandos Docker manuales equivalentes:
```bash
# Construir manualmente pasando la versión
docker build --build-arg VERSION=$(node -p "require('./package.json').version") -t pwa-inspecciones:latest .

# Ejecutar el contenedor en segundo plano con límite de privilegios
docker run -d --name pwa-inspecciones-app -p 3000:3000 pwa-inspecciones:latest

# Inspeccionar el estado de salud (HEALTHCHECK)
docker inspect --format='{{json .State.Health}}' pwa-inspecciones-app

# Detener y remover contenedor
docker stop pwa-inspecciones-app && docker rm pwa-inspecciones-app
```

---

## Verificación

```bash
# Verificación de integridad de artefactos y políticas del starter
make verify

# Ejecución de la suite completa de pruebas
npm test
```

---

## Evidencia

Consulte [`evidence/individual.md`](evidence/individual.md) para el detalle de decisiones técnicas, comandos ejecutados y compromisos individuales del equipo.
