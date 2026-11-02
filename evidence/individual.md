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
