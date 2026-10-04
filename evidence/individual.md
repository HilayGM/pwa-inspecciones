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
  - `npm.cmd run build`: la ejecución inicial no terminó dentro del límite del
    entorno de asistencia. La versión integrada fue validada posteriormente en
    GitHub Actions: build, prueba contractual y navegación offline terminaron
    correctamente en la corrida verde documentada abajo.

- Limitación o riesgo identificado:
  La primera visita requiere conexión para instalar el worker y guardar el app
  shell. El registro y las pruebas de navegador ya están integrados; la estrategia
  de esta semana cubre la pantalla inicial y no pretende almacenar respuestas de
  API ni demostrar por sí sola la sincronización incorporada en semanas posteriores.

- Uso declarado de IA:
  Utilicé OpenAI Codex para analizar el estado del repositorio, proponer la estrategia de caché, implementar el service worker y redactar la documentación de la decisión. Influyó en `public/sw.js`, `next.config.mjs`, `docs/cache-strategy.md` y este bloque de evidencia. Revisé manualmente la estrategia, confirmé las pruebas y salidas declaradas, y dejé explícitas las validaciones que siguen pendientes.

### Incremento: listado CSR de inspecciones

- **Commit de mi contribución:** `79a3ddea3e520bad848c9d464eb52905e8cc8a01` en la rama `feat/csr-inspecciones-listado`.
- **SHA de la actualización posterior de evidencia:** `f6bfdf7be27827791ff0b0864a118979a17cc96f`.
- **Contribución concreta:** Implementé la ruta cliente `/inspecciones`, la ruta local con datos sintéticos `/api/inspecciones`, el componente reutilizable `LoadingState` y los estilos para carga, error y reintento. El listado genera enlaces hacia el detalle SSR ya integrado en `/inspecciones/[id]`.
- **Decisión técnica que puedo explicar:** Elegí CSR para el listado porque permite mostrar de forma explícita el estado de carga, recuperar una consulta fallida con un reintento y mantener la interacción en el navegador. La ruta consulta una API local que entrega únicamente los registros sintéticos ya existentes.
- **Pruebas ejecutadas y resultado:** `npm test`, `npm run build` y `npm run verify` terminaron con código 0. `npm run test:rendering` aprobó los 13 contratos (13 passed, 0 failed). El build reconoció `/inspecciones` y `/api/inspecciones` como rutas válidas.
- **Limitación o riesgo:** El listado CSR requiere JavaScript y la disponibilidad de `/api/inspecciones`; el service worker no almacena esa API. Si la consulta falla, muestra un error y permite reintentar, pero no hay persistencia ni edición de inspecciones.
- **Uso de IA:** Utilicé OpenAI Codex para analizar la estructura existente, proponer el flujo CSR, implementar los archivos del listado y revisar la compilación. La IA influyó en `src/app/inspecciones/page.tsx`, `src/app/api/inspecciones/route.ts`, `src/components/loading-state.tsx`, los estilos asociados y este bloque. Revisé manualmente la lógica y ejecuté las verificaciones declaradas.

### Incremento: almacenamiento offline y cola de sincronización

- **Commit de implementación:** `0ecce9b40f6c7a016eaecd8dc7f9587e11cc729c` en la rama `dev-hilay`.
- **Contribución concreta:** Implementé `src/lib/storage/schema.ts` y
  `src/lib/sync/queue.ts`. El esquema crea almacenes IndexedDB para inspecciones,
  operaciones pendientes y recibos procesados. La cola guarda cambios de forma
  atómica, identifica duplicados, conserva tombstones para eliminaciones,
  selecciona operaciones vencidas y procesa éxitos o fallos con reintentos.
- **Decisión técnica que puedo explicar:** Usé una clave de idempotencia formada
  por inspección, operación e identificador de mutación del cliente. Un índice
  único evita duplicados pendientes y los recibos evitan repetir una operación
  ya confirmada. Los fallos usan backoff exponencial de 1, 2, 4, 8 y 16 segundos,
  con máximo configurable de cinco intentos y tope general de 60 segundos.
- **Pruebas ejecutadas y resultado:** `npx tsc --noEmit --incremental false`,
  `npm test`, `npm run test:rendering`, `npm run verify` y `npm run build`
  terminaron con código 0. La prueba de renderizado conservó sus 13 contratos
  aprobados y la verificación generó `reports/verification.json`.
- **Limitación o riesgo:** IndexedDB solo está disponible en navegador y puede
  ser borrado por el usuario o por políticas de almacenamiento. La cola expone
  un `SyncSender`, pero la conexión con una API real y la resolución de
  conflictos corresponden a la integración del equipo. Los recibos todavía no
  tienen una política de limpieza y todos los datos usados deben seguir siendo
  sintéticos.
- **Uso declarado de IA:** Utilicé OpenAI Codex para revisar la arquitectura,
  implementar el esquema y la cola, detectar riesgos de duplicación y validar
  tipos, pruebas y build. La IA influyó en `src/lib/storage/schema.ts`,
  `src/lib/sync/queue.ts` y esta sección. Revisé los contratos, confirmé que no
  se añadieran datos reales y ejecuté personalmente los comandos declarados.

## Oscar Martinez Martinez

### Semana 03 — evidencia histórica

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
  `PASS` en la validación integrada de GitHub Actions con Chromium.
- Limitación o fallo diagnosticado:

  La prueba E2E pasó en Chromium dentro de GitHub Actions para el commit integrado
  `2ab0a8644d00d2a9843eedcdc8585ecbe20941c2`.

  La prueba valida principalmente la disponibilidad offline de la pantalla inicial y de las tres inspecciones sintéticas: `Laboratorio de Redes`, `Laboratorio de Electrónica` y `Laboratorio de Software`. No valida sincronización de información, escritura offline ni funcionamiento offline de APIs.

- Cambio que podría defender o modificar en vivo:

  Puedo explicar y modificar la prueba contractual del Service Worker, incluyendo las validaciones de caché, eventos y exclusiones de solicitudes. También puedo explicar el flujo de la prueba E2E con Playwright, desde la carga inicial con conexión hasta el cambio a modo offline y la validación de las tres inspecciones.

  Asimismo, puedo explicar la configuración de `playwright.config.ts` y el workflow `.github/workflows/week-03-w03-service-worker-offline.yml`, incluyendo la instalación de Chromium, ejecución de pruebas, build y publicación de resultados.

- Uso declarado de IA (herramienta, propósito, fragmentos influenciados y validación humana):

  Utilicé ChatGPT y OpenAI Codex como apoyo para interpretar los requisitos de la Semana 03, analizar la estructura existente del proyecto, desarrollar las pruebas automatizadas, configurar Playwright, preparar el workflow de GitHub Actions y organizar la documentación técnica.

  La IA influyó principalmente en `tests/service-worker.spec.ts`, `tests/offline.spec.ts`, `playwright.config.ts`, `.github/workflows/week-03-w03-service-worker-offline.yml` y en la documentación relacionada con las pruebas.

  Validé personalmente la información contra los archivos del proyecto y comprobé
  localmente `npm test`, `npm run test:service-worker` y `npm run build`. La
  validación integrada de `npm run test:offline` quedó registrada en la
  [corrida verde de Semana 03](https://github.com/HilayGM/pwa-inspecciones/actions/runs/37236555541),
  que también ejecutó build y check público.

### Semana 04 — CSR y SSR

- **Estudiante:** Oscar Martinez Martinez.
- **Commit SHA evaluado:**
  `6b8fb3f7fbae1cd54d4faf28c0ee81e07d504641` (implementación) y
  `98ad89d9d813c7ac79c805b6c488b23a205bfb94` (actualización de evidencia).
- **Contribución realizada:** Preparé `docs/rendering-decision.md`, la prueba
  contractual `tests/rendering.spec.ts` y el workflow
  `.github/workflows/week-04-w04-csr-ssr.yml`. Agregué `test:rendering` a
  `package.json`, amplié el README y registré este incremento. No implementé
  componentes ni rutas funcionales de Martín o Felipe.
- **Decisión técnica que puedo explicar:** El listado usa CSR para consultar la
  API y gestionar carga, error y reintento. El detalle acordado es SSR / Server
  Component con ID de URL y `notFound()`, ya integrado por Felipe. Separé los
  contratos de código fuente de las pruebas de navegador; una prueba de Node
  no acredita el comportamiento HTTP ni el rendimiento real.
- **Pruebas preparadas:** Trece contratos deterministas ejecutables mediante
  `npm run test:rendering`, sin servicios privados ni red. Conservé los scripts
  anteriores y la invocación `npm run test -- --run`. El CI nuevo ejecuta pruebas
  existentes, renderizado, Service Worker, build y check público, y conserva
  los fallos aunque continúe las verificaciones restantes.
- **Pruebas y resultados de esta contribución:**
  - `npm ci`: PASS.
  - `npm run test`: PASS.
  - `npm run test:rendering`: PASS; ejecutó los 13 contratos, con 13 aprobados,
    0 fallidos, 0 cancelados y 0 omitidos. Node emitió la advertencia
    `MODULE_TYPELESS_PACKAGE_JSON`, que no modifica el resultado de la prueba.
  - `npm run build`: PASS, de acuerdo con la evidencia de integración de Felipe.
  - La medición de carga, la prueba manual de navegador y la validación remota
    de GitHub Actions se deben conservar como evidencia final del equipo. No se
    declara una E2E de Semana 04 que no se haya ejecutado.
- **Limitación conocida:** La prueba contractual confirma el contrato de las
  rutas, pero no sustituye una prueba E2E del flujo listado-detalle-404 ni una
  medición de rendimiento CSR/SSR. Playwright conserva la prueba offline de la
  semana anterior y una E2E de Semana 04 requerirá un patrón propio.
- **Cambio que puedo defender o modificar en vivo:** Explicar cada contrato,
  demostrar que un incumplimiento falla, ajustar un patrón a una construcción
  equivalente sin debilitar la validación y explicar los pasos del workflow y
  el procedimiento de medición sin atribuir resultados no observados.
- **Uso declarado de IA:**
  - **Herramienta:** Codex / ChatGPT.
  - **Propósito:** análisis, diseño de pruebas, documentación y revisión.
  - **Fragmentos influenciados:** `docs/rendering-decision.md`,
    `tests/rendering.spec.ts`, `README.md`, `package.json`,
    `.github/workflows/week-04-w04-csr-ssr.yml` y exclusivamente este incremento
    de Oscar en `evidence/individual.md`.
  - **Validación humana:** revisé que `npm run test:rendering` terminara con 13
    contratos aprobados. La corrida verde de GitHub Actions debe verificarse y
    enlazarse en la entrega final; las ejecuciones asistidas no la sustituyen.

### Semana 05 — Persistencia local y sincronización idempotente

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

- **Commit de mi contribución:** `ebf07ee8c4b27dd7652ae534f62440a3cb97241f` en la rama `felipe`.
- **Contribución concreta:** Implementé el registro seguro de `/sw.js` en el navegador mediante `src/lib/pwa/register-service-worker.ts`, un componente cliente sin interfaz visible en `src/components/service-worker-registration.tsx` y su integración en el layout global. También documenté la instalación, la prueba offline, la limpieza de caché y los límites conocidos.
- **Decisión técnica que puedo explicar:** Separé el registro en un módulo que comprueba el entorno del navegador y la disponibilidad de `navigator.serviceWorker`. El componente usa `useEffect` con dependencias vacías para iniciar el registro una sola vez al montarse, captura errores sin interrumpir la aplicación y no renderiza contenido visible.
- **Pruebas realizadas y resultado:** `npm run build`, `npm test` y
  `npm run verify` fueron exitosos en su rama. En la integración final, GitHub
  Actions también aprobó el contrato del Service Worker y la prueba E2E offline
  con Chromium. La comprobación manual en DevTools sigue siendo evidencia
  complementaria y no se atribuye como realizada si no existe captura.
- **Límites de la función:** El registro no implementa sincronización en segundo plano, persistencia de datos ni garantiza que todas las rutas funcionen sin conexión. La cobertura offline depende de la estrategia de caché de `public/sw.js` y de un navegador compatible.
- **Uso de IA:** Utilicé GitHub Copilot para interpretar la consigna, proponer la estructura del registro del Service Worker y revisar la documentación. La IA influyó en `src/lib/pwa/register-service-worker.ts`, `src/components/service-worker-registration.tsx`, `src/app/layout.tsx`, `README.md` y esta sección de evidencia. Revisé y adapté el código al proyecto.

## Asignación: Detalle SSR y estados de error (Felipe)

**SHA del commit de implementación:** `3f57b05f632fe8aa4725a89a23b1331aae837b6f`

**SHA de la actualización posterior de evidencia:** `e7a7b6fa810344dd691eb679e4f769b777d08243`

**Decisión Técnica (SSR):** 
Elegí Server-Side Rendering (SSR) para la página de detalles (`page.tsx`) porque permite que la información de la inspección se genere directamente en el servidor. Esto significa que la página no depende de que el navegador descargue JavaScript para hacer fetch de los datos (CSR), lo que mejora el rendimiento inicial y asegura que el contenido esté disponible inmediatamente al cargar la ruta. Por esta razón, omití el uso de `"use client"`.

**Límites de la implementación:**
Los datos provienen de un archivo estático (`src/lib/data/inspections.ts`). No existe una base de datos real conectada ni se permite la edición o persistencia de nuevos registros en esta fase.

**Pruebas manuales realizadas:**
- [x] Navegación a `/inspecciones/inspection-001` muestra correctamente los detalles (ej. Redes).
- [x] Navegación a `/inspecciones/inspection-002` muestra el estado "Requiere atención".
- [x] Navegación a una ruta inválida `/inspecciones/no-existe` intercepta correctamente y muestra la pantalla 404 (`not-found.tsx`).
- [x] La navegación cuenta con un enlace funcional para regresar al listado.
- [x] Las pruebas de build (`npm run build`) pasan sin errores.
- [x] `npm run test:rendering` aprobó los 13 contratos (13 passed, 0 failed).
  La advertencia `MODULE_TYPELESS_PACKAGE_JSON` de Node no cambió el resultado.

**Uso de IA:**
Se utilizó la IA de Claude como asistente de programación restrictivo para generar únicamente la estructura de los componentes `page.tsx`, `not-found.tsx` y `error.tsx`, asegurando el cumplimiento de las reglas de Next.js App Router.

### Incremento: política de conflictos de sincronización

- **Contribución concreta:** Creé `src/lib/sync/conflict-policy.ts` con una
  función pura para decidir entre aceptar el cambio local, conservar el registro
  del servidor o indicar que no hay una resolución automática. También redacté
  `docs/sync-policy.md` para documentar el flujo offline-first, almacenamiento,
  idempotencia, reintentos, conflictos, supuestos y riesgos.
- **Decisión técnica que puedo explicar:** La resolución recibe todas las
  versiones explícitamente, no consulta IndexedDB ni la red y devuelve la razón
  junto con una copia del registro local para diagnóstico. Ante una versión
  más reciente del servidor, conserva ese registro para evitar sobrescribir
  información confirmada.


- Estudiante: Oscar Martinez Martinez
- Commit SHA evaluado: https://github.com/HilayGM/pwa-inspecciones
 SHA:08bd75ffeafe5c6395f6498ad2aa1d5b827f5b47

- **Contribución realizada:** Implementé 16 pruebas reproducibles en
  `tests/sync.spec.ts` para validar persistencia local con IndexedDB, cola de
  sincronización, idempotencia, recibos, reintentos exponenciales, agotamiento
  de intentos, tombstones y política de resolución de conflictos. También
  preparé la automatización de CI y la documentación de Semana 05.

- **Archivos creados o modificados:** `tests/sync.spec.ts`, `README.md`,
  `package.json`, `package-lock.json` y `.github/workflows/week-05-sync.yml`.
  Consumí las APIs de `src/lib/storage/schema.ts`, `src/lib/sync/queue.ts` y
  `src/lib/sync/conflict-policy.ts`, y consulté `docs/sync-policy.md`, sin
  modificar esos archivos de Martín y Felipe.

- **Decisión técnica que puedo explicar:** Utilicé `fake-indexeddb` para
  simular IndexedDB en Node y `tsx` para ejecutar los tests TypeScript con
  `node:test`. Las pruebas usan fechas explícitas y deterministas, eliminan
  completamente la base IndexedDB antes de cada caso y esperan que termine
  la eliminación. Los helpers cierran sus conexiones y la suite evita la
  ejecución concurrente. Utilicé únicamente datos sintéticos, sin red, API
  ni autenticación reales. Esta estrategia permite probar el comportamiento
  de sincronización sin depender de un navegador real ni esperar físicamente
  los tiempos de reintento.

- **Pruebas preparadas:** Los 16 casos comprueban:
  1. Creación de las stores `inspections`, `syncQueue` y `syncReceipts`, sus
     keyPaths e índices de cola.
  2. Guardado offline de una inspección pendiente.
  3. Persistencia de una operación en la cola.
  4. Prevención de duplicados pendientes con la misma clave de idempotencia.
  5. Creación de un recibo al confirmar una operación.
  6. Detección de una mutación ya confirmada sin volver a encolarla.
  7. Programación del primer reintento exactamente un segundo después.
  8. Secuencia de reintentos de 1, 2, 4, 8 y 16 segundos con `maxAttempts: 6`.
  9. Tope predeterminado de 60000 ms de `calculateRetryDelay`.
  10. Estado `exhausted` al alcanzar el máximo de intentos y exclusión de
      futuros envíos automáticos.
  11. Eliminación del pendiente, recibo e inspección `synced` tras un envío
      sintético exitoso.
  12. Tombstone físico para delete, oculto del listado offline.
  13. Eliminación física del tombstone y del pendiente después de sincronizar,
      conservando el recibo.
  14. Decisión `accept-local` cuando las versiones coinciden.
  15. Decisión `accept-server` cuando la versión del servidor es más reciente.
  16. Decisión `accept-server` ante una eliminación local conflictiva, sin
      autorizar el borrado silencioso de información más reciente.

- **Matiz de los reintentos:** `DEFAULT_MAX_SYNC_ATTEMPTS = 5`. Con ese máximo,
  los fallos 1, 2, 3 y 4 programan respectivamente 1, 2, 4 y 8 segundos; el
  quinto fallo deja la entrada en `exhausted`. No se programa una espera de
  16 segundos con los cinco intentos predeterminados. Para comprobar ese
  retraso utilicé explícitamente `maxAttempts: 6` y avancé las fechas
  manualmente, sin temporizadores reales. El tope de 60 segundos corresponde
  al cálculo predeterminado por retraso, no al tiempo acumulado; el helper
  permite configurar otro máximo.

- **Pruebas y resultados de esta contribución:**
  - `npm test`: PASS — starter y manifest.
  - `npm run test:rendering`: PASS — 13/13.
  - `npm run test:service-worker`: PASS.
  - `npm run test:sync`: PASS — 16/16.
  - `npm run build`: PASS.
  - `npm run verify`: PASS.
  - `bash public-tests/check.sh`: PASS — código 0 y `PUBLIC_OK`.
  - Validación de tipos de `tests/sync.spec.ts`: PASS.
  - `git diff --check`: PASS.

- **Automatización de CI:** Creé `.github/workflows/week-05-sync.yml` con
  Node 22 y ejecución, en este orden, de `npm ci`, `npm test`,
  `npm run test:rendering`, `npm run test:service-worker`, `npm run test:sync`,
  `npm run build`, `npm run verify` y `bash public-tests/check.sh`. El workflow
  todavía no ha sido validado en GitHub Actions al momento de esta evidencia
  local; su ejecución remota queda pendiente.

- **Limitaciones conocidas:** `fake-indexeddb` no sustituye pruebas reales en
  navegador y las pruebas no demuestran idempotencia de un servidor real.
  La política de Felipe se valida como función pura, pero no está integrada
  automáticamente con la persistencia. No existe API ni autenticación reales.
  La secuencia que incluye 16 segundos requiere `maxAttempts: 6`. GitHub
  Actions todavía debe ejecutarse remotamente. npm reportó vulnerabilidades
  en dependencias durante la instalación; no ejecuté correcciones automáticas
  porque estaban fuera del alcance. El check público imprimió coincidencias
  textuales aunque terminó con `PUBLIC_OK`; ese resultado no certifica por
  sí solo ausencia de credenciales.

- **Cambio que puedo defender o modificar en vivo:** Explicar la limpieza de
  IndexedDB, verificar registros persistidos y recibos, avanzar el reloj de
  los reintentos sin esperas y distinguir una decisión de conflictos de su
  aplicación real sobre los datos. También puedo explicar el orden del CI y
  sus límites sin atribuir resultados remotos no observados.
- **Uso declarado de IA:**
  - **Herramienta:** ChatGPT / Codex.
  - **Propósito:** análisis del repositorio, diseño de casos de prueba, apoyo
    para implementar tests, configuración de CI y documentación técnica.
  - **Fragmentos influenciados:** `tests/sync.spec.ts`, `README.md`,
    `package.json`, `package-lock.json`, `.github/workflows/week-05-sync.yml`
    y exclusivamente este incremento de Oscar en `evidence/individual.md`.
    
  - **Validación humana:** revisé los cambios, ejecuté las pruebas localmente
    y verifiqué manualmente los resultados antes del commit. La IA se utilizó
    como apoyo; la revisión y validación de la contribución fueron realizadas
    por mí. La ejecución remota de GitHub Actions todavía debe comprobarse.
