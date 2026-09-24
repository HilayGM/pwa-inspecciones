# Evidencia individual — entrega de equipo

## Martin Moreno Libreros

- Repositorio y commit de mi contribución:
  https://github.com/HilayGM/pwa-inspecciones
  SHA: `feae1ab3e9425d9753fef686cf08b92b8da6b2c3`

- Mi contribución concreta:
  Implementé el service worker manual en `public/sw.js`, configuré la aplicación para evitar que el worker generado por `next-pwa` lo sobrescriba durante el build, retiré los artefactos Workbox ya no utilizados y documenté la estrategia en `docs/cache-strategy.md`.

- Decisión técnica que puedo explicar:
  Elegí *network first* con respaldo de caché para la navegación y *cache first* para los recursos estáticos de Next.js. Así, con Internet la aplicación intenta obtener una pantalla actualizada; si la conexión falla, muestra la última pantalla inicial disponible. Las solicitudes `POST`, recursos externos y futuras rutas `/api/` quedan excluidos para no guardar datos dinámicos o sensibles como si fueran recursos estáticos.

- Comandos o pruebas ejecutadas y resultado:
  - `node --check public/sw.js`: terminó con código 0; la sintaxis del service worker es válida.
  - `npm.cmd test`: terminó con código 0; `starter.spec.mjs: PASS` y `manifest.spec.ts: PASS`.
  - `git diff --check`: terminó sin errores de espacios.
  - `npm.cmd run build`: se inició correctamente, pero no terminó dentro del límite de 120 segundos del entorno de asistencia. La compilación, la prueba real en navegador sin conexión y GitHub Actions deben ejecutarse por el equipo antes de fusionar a `main`.

- Limitación o riesgo identificado:
  La primera visita requiere conexión para instalar el worker y guardar el app shell. El funcionamiento offline completo depende de que se integre el registro del service worker y se agreguen las pruebas de navegador. Esta versión no guarda ni sincroniza nuevas inspecciones.

- Uso declarado de IA:
  Utilicé OpenAI Codex para analizar el estado del repositorio, proponer la estrategia de caché, implementar el service worker y redactar la documentación de la decisión. Influyó en `public/sw.js`, `next.config.mjs`, `docs/cache-strategy.md` y este bloque de evidencia. Revisé manualmente la estrategia, confirmé las pruebas y salidas declaradas, y dejé explícitas las validaciones que siguen pendientes.

### Incremento: listado CSR de inspecciones

- **Commit de mi contribución:** `79a3ddea3e520bad848c9d464eb52905e8cc8a01` en la rama `feat/csr-inspecciones-listado`.
- **Contribución concreta:** Implementé la ruta cliente `/inspecciones`, la ruta local con datos sintéticos `/api/inspecciones`, el componente reutilizable `LoadingState` y los estilos para carga, error y reintento. El listado genera enlaces hacia `/inspecciones/[id]` para su integración posterior con el detalle SSR.
- **Decisión técnica que puedo explicar:** Elegí CSR para el listado porque permite mostrar de forma explícita el estado de carga, recuperar una consulta fallida con un reintento y mantener la interacción en el navegador. La ruta consulta una API local que entrega únicamente los registros sintéticos ya existentes.
- **Pruebas ejecutadas y resultado:** `npm test`, `npm run build` y `npm run verify` terminaron con código 0. El build reconoció `/inspecciones` y `/api/inspecciones` como rutas válidas.
- **Limitación o riesgo:** El detalle SSR todavía no existe en esta rama y corresponde a otro integrante. Si la consulta falla, el listado muestra un error y permite reintentar, pero no hay persistencia ni edición de inspecciones.
- **Uso de IA:** Utilicé OpenAI Codex para analizar la estructura existente, proponer el flujo CSR, implementar los archivos del listado y revisar la compilación. La IA influyó en `src/app/inspecciones/page.tsx`, `src/app/api/inspecciones/route.ts`, `src/components/loading-state.tsx`, los estilos asociados y este bloque. Revisé manualmente la lógica y ejecuté las verificaciones declaradas.

## Oscar Martinez Martinez

- Estudiante: Oscar Martinez Martinez
- Commit SHA evaluado: https://github.com/HilayGM/pwa-inspecciones
 SHA:25755e692732e83862c33eec30045fd9e6082d53

- Mi contribución concreta:
  Implementé las pruebas correspondientes a la Semana 03 para validar el Service Worker y el funcionamiento offline de la PWA. Creé `tests/service-worker.spec.ts` para comprobar los contratos principales de `public/sw.js` y `tests/offline.spec.ts` para realizar la prueba E2E con Chromium mediante Playwright.

  También configuré `playwright.config.ts`, agregué `@playwright/test`, incorporé los scripts `test:service-worker` y `test:offline` en `package.json`, y creé el workflow `.github/workflows/week-03-w03-service-worker-offline.yml` para automatizar la instalación de dependencias, instalación de Chromium, compilación y ejecución de pruebas.

  Además, actualicé `README.md` con los comandos necesarios para ejecutar las pruebas, instalar Chromium, probar el comportamiento offline y limpiar el Service Worker y las cachés.

- Decisión técnica que puedo explicar:

  Decidí separar la validación del Service Worker en dos tipos de pruebas. La primera es una prueba contractual rápida en `tests/service-worker.spec.ts`, que revisa directamente la estructura de `public/sw.js` y comprueba elementos como la caché versionada, los eventos `install`, `activate` y `fetch`, la estrategia de navegación, el manejo de `/_next/static/` y la exclusión de `/api/` y solicitudes diferentes de `GET`.

  La segunda es una prueba E2E en `tests/offline.spec.ts` ejecutada con Playwright y Chromium. Esta prueba busca comprobar el comportamiento real de la aplicación al cargarla con conexión, esperar la activación del Service Worker, recargarla, desactivar la conexión y verificar que las tres inspecciones sintéticas continúan disponibles.

  Separar ambas pruebas permite detectar tanto regresiones en la implementación del Service Worker como problemas reales de funcionamiento offline.

- Prueba que ejecuté y resultado:
  Ejecuté `npm test`.
  Resultado:
  `PASS`

  Ejecuté `npm run test:service-worker`.
  Resultado:
  `service-worker.spec.ts: PASS`

  Ejecuté `npm run build`.
  Resultado:
  `PASS`

  El build generó correctamente los artefactos de producción de Next.js.
  También instalé Chromium mediante Playwright.
  Versión observada:
  `Chromium 140`
  Ejecuté `npm run test:offline`.
  Resultado:
  La prueba fue iniciada, pero la ejecución no emitió un resultado final `PASS` o `FAIL` verificable antes del cierre de la sesión.
- Limitación o fallo diagnosticado:

  La prueba E2E offline quedó implementada y preparada para ejecutarse con Chromium, pero la ejecución local no produjo un resultado final `PASS` o `FAIL` verificable antes de terminar la sesión.

  La prueba valida principalmente la disponibilidad offline de la pantalla inicial y de las tres inspecciones sintéticas: `Laboratorio de Redes`, `Laboratorio de Electrónica` y `Laboratorio de Software`. No valida sincronización de información, escritura offline ni funcionamiento offline de APIs.

- Cambio que podría defender o modificar en vivo:

  Puedo explicar y modificar la prueba contractual del Service Worker, incluyendo las validaciones de caché, eventos y exclusiones de solicitudes. También puedo explicar el flujo de la prueba E2E con Playwright, desde la carga inicial con conexión hasta el cambio a modo offline y la validación de las tres inspecciones.

  Asimismo, puedo explicar la configuración de `playwright.config.ts` y el workflow `.github/workflows/week-03-w03-service-worker-offline.yml`, incluyendo la instalación de Chromium, ejecución de pruebas, build y publicación de resultados.

- Uso declarado de IA (herramienta, propósito, fragmentos influenciados y validación humana):

  Utilicé ChatGPT y OpenAI Codex como apoyo para interpretar los requisitos de la Semana 03, analizar la estructura existente del proyecto, desarrollar las pruebas automatizadas, configurar Playwright, preparar el workflow de GitHub Actions y organizar la documentación técnica.

  La IA influyó principalmente en `tests/service-worker.spec.ts`, `tests/offline.spec.ts`, `playwright.config.ts`, `.github/workflows/week-03-w03-service-worker-offline.yml` y en la documentación relacionada con las pruebas.

  Validé personalmente la información contra los archivos del proyecto y comprobé localmente `npm test`, `npm run test:service-worker` y `npm run build`. También verifiqué la instalación de Chromium y revisé la ejecución de `npm run test:offline`, dejando documentado que esta última no produjo un resultado final verificable.

## Felipe Mora Lopez

- Estudiante: Felipe Mora Lopez
- Commit SHA evaluado: https://github.com/HilayGM/pwa-inspecciones
 SHA:5fe55626cafc56c06a6408c420131f465f3ec290


* **Contribución y enlace:**
  Implementé `src/components/app-shell.tsx` y actualicé `src/app/layout.tsx` para integrar la estructura compartida de la PWA: encabezado, navegación, contenido principal y pie de página.

* **Decisión que explica:** 
  Decidí delimitar estrictamente el alcance del problema para excluir características no solicitadas en esta etapa. Estructuré los escenarios de usuario asegurando que el caso de conectividad intermitente sea realista frente a las restricciones del sistema.

* **Comando o prueba ejecutada y resultado real:** 
  Ejecuté `npm run verify`. El resultado técnico fue exitoso (`pass`) y compiló correctamente, generando el archivo `reports/verification.json`.

* **Qué comprueba y qué no:** 
  El comando comprueba la estructura básica de los archivos, ejecuta la prueba proporcionada y valida que el proyecto compile. No comprueba la calidad, coherencia ni el análisis de los documentos redactados, ni certifica la ausencia de secretos o credenciales en el código.

* **Limitación:** 
  Una limitación de esta verificación es que un *build* verde no garantiza que los escenarios planteados resuelvan el problema real de los usuarios; la calidad de esa lógica depende de nuestra revisión manual.

* **Uso de IA:** 
  Se utilizó inteligencia artificial (Claude) como asistente de redacción para dar formato y revisar la claridad de la documentación, verificando humanamente que el contenido se ajuste íntegramente a los lineamientos y rúbrica de la actividad.

### Incremento: registro del Service Worker

- **Commit de mi contribución:** `ebf07ee` en la rama `felipe`.
- **Contribución concreta:** Implementé el registro seguro de `/sw.js` en el navegador mediante `src/lib/pwa/register-service-worker.ts`, un componente cliente sin interfaz visible en `src/components/service-worker-registration.tsx` y su integración en el layout global. También documenté la instalación, la prueba offline, la limpieza de caché y los límites conocidos.
- **Decisión técnica que puedo explicar:** Separé el registro en un módulo que comprueba el entorno del navegador y la disponibilidad de `navigator.serviceWorker`. El componente usa `useEffect` con dependencias vacías para iniciar el registro una sola vez al montarse, captura errores sin interrumpir la aplicación y no renderiza contenido visible.
- **Pruebas realizadas y resultado:** `npm run build`, `npm test` y `npm run verify` fueron reportados por Felipe como exitosos en su rama. La comprobación manual en DevTools y la prueba offline deben validarse nuevamente en el commit de integración antes de fusionar a `main`.
- **Límites de la función:** El registro no implementa sincronización en segundo plano, persistencia de datos ni garantiza que todas las rutas funcionen sin conexión. La cobertura offline depende de la estrategia de caché de `public/sw.js` y de un navegador compatible.
- **Uso de IA:** Utilicé GitHub Copilot para interpretar la consigna, proponer la estructura del registro del Service Worker y revisar la documentación. La IA influyó en `src/lib/pwa/register-service-worker.ts`, `src/components/service-worker-registration.tsx`, `src/app/layout.tsx`, `README.md` y esta sección de evidencia. Revisé y adapté el código al proyecto.

