# Inspecciones de laboratorio

Proyecto académico de Aplicaciones Web Progresivas para consultar inspecciones de mantenimiento de laboratorios. Semana 02 incorpora contenido de demostración al AppShell y documenta el manifest y la verificación disponible.

## Objetivo

Construir progresivamente una PWA para inspecciones de mantenimiento de laboratorios. Esta actividad utiliza exclusivamente datos sintéticos y presenta una pantalla de consulta; no incorpora captura, edición ni servicios reales.

Se conserva la base de Semana 01: arranque reproducible, documentación del problema en `docs/requirements.md`, decisiones en `docs/decision-record.md` y verificación estructural. El mismo repositorio se utiliza durante las semanas 1–13.

## Tecnologías

- Next.js 14.2.35 con App Router.
- React y React DOM 18.3.1.
- TypeScript (rango declarado `^5.4.5`) y tipos para Node.js y React.
- `@ducanh2912/next-pwa` (rango declarado `^10.2.9`), configurado en `next.config.mjs`.
- CSS global en `src/app/globals.css`; no hay Tailwind declarado ni configurado.
- Pruebas con las aserciones nativas de Node.js, npm, Make y GitHub Actions.

Los rangos anteriores proceden de `package.json`; `package-lock.json` fija las dependencias de instalación.

## Requisitos previos

- Node.js 22.6 o superior compatible: la prueba del manifest usa `--experimental-strip-types`.
- npm 10 o superior, conforme al entorno indicado por el starter.
- Git y una cuenta de GitHub para el flujo de entrega.
- Make para `make verify`; Bash y ripgrep (`rg`) para el check público. Ejecutar desde la raíz del proyecto.

## Setup / instalación

```bash
npm ci
```

Instala las dependencias respetando `package-lock.json` para reproducir el entorno. No aplicar actualizaciones forzadas de dependencias como parte de esta actividad.

## Ejecución

```bash
npm run dev
```

La aplicación queda disponible normalmente en [http://localhost:3000](http://localhost:3000). Consultar la salida de Next.js si el puerto está ocupado. Detener el servidor con Ctrl+C al terminar.

## Build

```bash
npm run build
```

Genera la compilación de producción. El service worker de esta actividad es el archivo fuente `public/sw.js`; la generación automática de `next-pwa` está desactivada para evitar que el build lo sobrescriba. Para probar el comportamiento offline, inicia después el servidor de producción.

## Verificación

```bash
npm run test -- --run
make verify
bash public-tests/check.sh
```

- `npm run test -- --run` ejecuta las pruebas de starter y manifest mediante Node. El argumento adicional llega al script del manifest y no se interpreta: no es un ejecutor Vitest. La prueba del starter comprueba el comando de build y dos textos de la página.
- `make verify` llama a `npm run verify` y genera `reports/verification.json`. Comprueba la existencia de artefactos del starter; no valida toda la PWA. Sin Make puede ejecutarse `npm run verify`.
- El check público verifica archivos mínimos y busca patrones de posibles credenciales con `rg`. Requiere que ripgrep esté disponible en Bash; su búsqueda textual puede producir falsos positivos y no sustituye una auditoría.

`npm test` ejecuta `tests/starter.spec.mjs` y `tests/manifest.spec.ts`. La prueba del manifest valida los campos PWA esenciales, la configuración de `next-pwa` y que los iconos PNG declarados existan con las dimensiones correctas. También puede ejecutarse directamente con Node.js 22.6 o superior:

```bash
node --experimental-strip-types tests/manifest.spec.ts
```

Comprueba nombre, inicio, modo `standalone`, colores, los dos iconos requeridos y referencias a `next-pwa` y `dest: public` en la configuración. La prueba confirma que los archivos PNG existen, son válidos y sus dimensiones coinciden con el manifest; no sustituye una comprobación de instalación en navegador.

Los iconos de instalación se encuentran en `public/icons/`. Si se requiere regenerarlos, ejecutar en PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-pwa-icons.ps1
```

## Registro del Service Worker

El componente global registra `/sw.js` cuando la aplicación se monta en un
navegador compatible. El registro no se ejecuta durante el renderizado del
servidor; si el navegador no soporta Service Workers o el registro falla, la
interfaz continúa disponible sin interrumpirse.

### Prueba en producción y modo offline

```bash
npm run build
npm run start
```

Abre `http://localhost:3000` con conexión y confirma en **DevTools >
Application > Service Workers** que `/sw.js` está activo. Recarga una vez con
conexión, activa **Offline** en **DevTools > Network** y vuelve a recargar la
ruta inicial. La primera visita requiere red para instalar el worker y poblar
la caché.

### Limpiar caché y desregistrar

En **DevTools > Application > Storage**, selecciona **Clear site data**. Para
retirar una versión previa del worker, abre **Service Workers**, pulsa
**Unregister** y recarga. También se pueden eliminar entradas puntuales desde
**Cache Storage** durante el diagnóstico.

### Límites del registro

- El registro no implementa sincronización en segundo plano ni persistencia de
  inspecciones nuevas.
- La cobertura offline depende de la estrategia definida en `public/sw.js`.
- No se garantiza que rutas futuras o peticiones dinámicas funcionen sin red.

## Arquitectura Semana 02

| Archivo | Responsabilidad actual |
| --- | --- |
| `public/manifest.webmanifest` | Describe nombre, inicio, presentación `standalone`, colores e iconos para la identidad e instalación. |
| `src/app/layout.tsx` | Configura HTML en español de México, estilos globales, metadata, enlace al manifest y color del viewport; envuelve la página con AppShell. |
| `src/lib/pwa/register-service-worker.ts` | Registra `/sw.js` únicamente en navegadores compatibles y maneja fallos sin interrumpir la interfaz. |
| `src/components/service-worker-registration.tsx` | Componente cliente sin interfaz visible que inicia el registro una sola vez al montarse. |
| `src/components/app-shell.tsx` | Proporciona header, enlaces a inicio, navegación, un único landmark `main` y footer. |
| `src/app/page.tsx` | Presenta propósito y tarjetas de inspecciones sintéticas dentro del shell, sin repetir navegación ni landmarks globales. |
| `tests/manifest.spec.ts` | Verifica propiedades críticas del manifest, configuración PWA e iconos PNG existentes con las dimensiones declaradas. |

`src/lib/data/inspections.ts` conserva los registros sintéticos compartidos. `scripts/verify.mjs` y `tests/starter.spec.mjs` mantienen la verificación de Semana 01. El workflow `.github/workflows/week-01-starter-feedback.yml` instala, verifica estructura, ejecuta `npm test` (starter y manifest), compila y ejecuta el check público.

## Datos sintéticos

Todos los datos de inspecciones son ficticios y se usan únicamente con fines académicos. Se reutilizan tres registros: Redes (2026-08-28, sin incidencias), Electrónica (2026-08-27, requiere atención, dos hallazgos) y Software (2026-08-26, sin incidencias). Las observaciones describen revisiones de cableado, ventilación, equipo y señalización. Las fechas son fijas, no la fecha actual.

La pantalla muestra identificadores de demostración en lugar de responsables. No presenta información personal ni consulta datos reales.

## Responsive y accesibilidad

Se reutilizan las clases del CSS global: contenedor con ancho máximo y márgenes automáticos, tamaños de encabezado fluidos y cuadrícula de tres columnas que pasa a una columna hasta 760 px. En móvil también se reduce el relleno y se apilan el título y el contador. Estado y fecha pueden saltar de línea; el contenido permite partir textos largos sin imponer anchos fijos.

La página utiliza secciones etiquetadas, artículos identificados por sus títulos, jerarquía `h1`–`h2`–`h3`, listas descriptivas y fechas con `time` y `dateTime`. Los estados se expresan con texto además de color. AppShell conserva los landmarks globales y sus enlaces nativos pueden recibir foco con el teclado; la página no añade controles interactivos. No hay estilos de foco personalizados ni una auditoría de contraste documentada. La revisión visual en móvil y escritorio queda pendiente hasta disponer de evidencia de navegador.

## Verificación realizada

### Resultados históricos comunicados por el integrante

Estos resultados corresponden al desarrollo previo, no certifican por sí solos la versión actual:

- `npm ci`: instalación completada correctamente. npm reportó advertencias de dependencias y vulnerabilidades; no se aplicaron actualizaciones forzadas para evitar cambios de dependencias fuera del alcance.
- `npm run dev`: Next.js inició correctamente y `GET /` respondió HTTP 200.
- `npm run build`: compilación de producción, lint y validación de tipos completados correctamente.
- `make verify`: resultado observado `Starter verificable: PASS`.

### Revisión actual

Validación del 13 de septiembre de 2026 con Node.js 22.23.2 instalado localmente. Se ajustó el `PATH` únicamente en los procesos de validación, sin cambiar la configuración del sistema ni las dependencias.

- `npm run build`: código 0; compilación, etapa de lint/tipos y generación estática completadas. Se ejecutó en una copia temporal del árbol versionado con los cambios actuales y las dependencias existentes, para no sobrescribir service worker ni Workbox del repositorio. Webpack emitió advertencias de caché (`Unable to snapshot resolve dependencies`), sin impedir el build.
- `npm run test -- --run`: código 0, `starter.spec.mjs: PASS`, ejecutado en el repositorio.
- `make verify`: el primer intento falló porque Make encontró el ejecutable intermediario de npm sin Node activo. Al excluir ese directorio del `PATH` del proceso, terminó con código 0 y `Starter verificable: PASS`. Se ejecutó en la copia temporal para que el reporte generado tampoco alterara otros archivos del repositorio.
- `bash public-tests/check.sh`: ejecutado con Bash de Git para Windows; código 0 y `PUBLIC_OK`, aunque imprimió coincidencias en documentación y dependencias existentes. El uso de una búsqueda negada con `set -e` permite continuar tras esas coincidencias: no interpretar ese éxito como certificación de ausencia de credenciales.
- `node --experimental-strip-types tests/manifest.spec.ts`: código 0, `manifest.spec.ts: PASS`. Node emitió `MODULE_TYPELESS_PACKAGE_JSON` al interpretar el archivo como módulo; no se modificó `package.json`.
- `git diff --check`: sin errores de espacios; Git avisó de futura conversión de LF a CRLF. Solo `README.md` y `src/app/page.tsx` figuran modificados.

No se repitieron `npm ci` ni `npm run dev`, ni se realizaron pruebas visuales, de instalación o Lighthouse durante esta contribución. El build temporal produjo HTML estático, pero no sustituye esas comprobaciones de navegador.

Los archivos `public/icons/icon-192x192.png` y
`public/icons/icon-512x512.png` existen y coinciden con las referencias del
manifest. La prueba automatizada valida su formato y dimensiones; la instalación
visual de la PWA sigue siendo una comprobación manual de navegador.

## Supuestos

- La pantalla inicial es una consulta estática de tres ejemplos ordenados del más reciente al más antiguo.
- El AppShell compartido sigue siendo responsable de estructura global y navegación.
- La instalación se debe comprobar en navegador una vez que el equipo complete los recursos del manifest.

## Limitaciones conocidas

- Los iconos de 192 y 512 px están presentes y se validan automáticamente. Esto
  no sustituye la comprobación manual de instalación en un navegador compatible.
- `src/components/app-shell.tsx` utiliza clases de utilidad que no están definidas en `globals.css`, sin Tailwind instalado. Corresponde al responsable del shell resolver sus estilos; las clases CSS de la página sí existen.
- El shell actual no implementa estados de carga, error ni vacío. El responsable del shell debe completar y acordar esas demostraciones para la actividad de equipo.
- `tests/manifest.spec.ts` forma parte de `npm test` y los workflows que invocan ese comando también la ejecutan.
- `public-tests/check.sh` puede imprimir coincidencias y aun finalizar con `PUBLIC_OK`; el responsable de verificación debe corregir el control del resultado de la búsqueda y revisar sus falsos positivos.
- No hay base de datos, APIs reales, autenticación, captura ni edición. Esta contribución no implementa almacenamiento offline, sincronización ni notificaciones. Existe configuración PWA y archivos generados de service worker del proyecto; su comportamiento offline no se ha verificado aquí.

## Evidencia

Conservar salida o capturas de ejecución local, build, pruebas, `make verify` y su `reports/verification.json`, además del enlace al resultado de GitHub Actions. Generar capturas de la PWA funcionando en móvil y escritorio antes de la entrega final.

Lighthouse no se ha ejecutado en esta revisión: generar y conservar su reporte/captura antes de la entrega final, sin atribuir puntajes todavía. Completar posteriormente `evidence/individual.md` con la contribución, una prueba y una limitación. Para la entrega del curso conservar URL del repositorio, SHA exacto evaluado y enlace a Actions; este trabajo no crea commit ni publica cambios.

## Uso de IA

Se utilizó una herramienta de IA como apoyo para el análisis de estructura, la
revisión de documentación y la asistencia en implementación. Los resultados
históricos y las comprobaciones actuales se distinguen en «Verificación
realizada». Las pruebas automatizadas y GitHub Actions están documentadas con
sus resultados reales; no se atribuyen a la IA comprobaciones visuales ni
mediciones de Lighthouse que no se realizaron.

## Semana 03 — Service Worker, pruebas offline y CI

### Requisitos

- Node.js 22 para el entorno de pruebas utilizado.
- npm.
- Playwright.
- Chromium para Playwright.

### Instalación

```bash
npm ci
```

### Instalar Chromium

```bash
npx playwright install chromium
```

### Pruebas existentes

```bash
npm test
```

Resultado observado: `PASS`.

### Prueba contractual del Service Worker

```bash
npm run test:service-worker
```

Resultado observado: `PASS`.

La prueba lee `public/sw.js` y comprueba la caché versionada, los eventos
`install`, `activate` y `fetch`, la navegación, `/_next/static/`, la exclusión
de `/api/`, los métodos distintos de `GET` y la limpieza de cachés antiguas.

### Build

```bash
npm run build
```

Resultado observado: `PASS`. Se generaron correctamente los artefactos de
producción.

### Prueba offline

```bash
npm run build
npm run test:offline
```

La prueba abre la aplicación con red, limpia registros previos del Service
Worker y cachés al inicio, espera el Service Worker, verifica las tres
inspecciones, recarga con red, desactiva la conexión, recarga offline y
verifica nuevamente:

- Laboratorio de Redes
- Laboratorio de Electrónica
- Laboratorio de Software

Estado de validación: `PASS` en GitHub Actions con Chromium para el commit
`2ab0a8644d00d2a9843eedcdc8585ecbe20941c2`. La corrida instaló dependencias y
Chromium, verificó la estructura, ejecutó las pruebas existentes y del Service
Worker, compiló la aplicación, reprodujo la navegación offline y ejecutó el
check público: [Semana 03 — corrida verde](https://github.com/HilayGM/pwa-inspecciones/actions/runs/37236555541).

### Producción manual

```bash
npm run build
npm run start
```

### Limpiar Service Worker y caché

En Chrome DevTools: **Application > Service Workers > Unregister**.

Después, en **Application > Storage > Clear site data**.

### Limitaciones

- La prueba cubre la disponibilidad offline de la pantalla inicial.
- No valida sincronización offline.
- No valida escritura offline.
- No valida APIs offline.
- Utiliza datos exclusivamente sintéticos.
- La prueba E2E offline pasó en GitHub Actions; su alcance sigue limitado a la
  pantalla inicial y no demuestra escritura ni sincronización de APIs offline.

## Semana 04 - CSR y SSR

### Rutas

| Ruta | Contrato y estado |
| --- | --- |
| `/inspecciones` | Listado CSR implementado por Martín. |
| `/api/inspecciones` | API local con los registros sintéticos del proyecto. |
| `/inspecciones/[id]` | Detalle SSR / Server Component de Felipe, implementado con búsqueda por ID, `notFound()` y límite de error de ruta. |

Oscar aporta decisión técnica, pruebas contractuales, scripts, CI, documentación
y evidencia. La comparación completa está en
[`docs/rendering-decision.md`](docs/rendering-decision.md).

### CSR

El listado declara `"use client"` y ejecuta `fetch` hacia `/api/inspecciones`
desde el navegador. Utiliza `LoadingState` para mostrar carga y error; el botón
**Reintentar** vuelve a consultar. Cada tarjeta genera un enlace al detalle
mediante su ID.

### SSR

El detalle es un Server Component sin `"use client"`: recibe el ID desde la
URL, lee los registros de `src/lib/data/inspections.ts` y utiliza `notFound()`
si no encuentra el registro. Ser Server Component no demuestra por sí solo
renderizado dinámico por petición; no se atribuye una ventaja de rendimiento sin
una medición reproducible.

### Cómo probar

Con Node.js 22.6 o superior compatible, desde la raíz:

```bash
npm ci
npm run dev
```

Antes de validar producción, detener el servidor de desarrollo con Ctrl+C para
que no comparta los artefactos de `.next` con el build. Después, ejecutar:

```bash
npm run test
npm run test -- --run
npm run test:rendering
npm run test:service-worker
npm run build
make verify
bash public-tests/check.sh
```

Ejecutar cada comprobación y conservar su salida. En la integración actual,
`npm run test:rendering` aprueba los 13 contratos (13 passed, 0 failed). Node
puede advertir `MODULE_TYPELESS_PACKAGE_JSON`; es una advertencia de rendimiento
al interpretar la prueba como módulo y no cambia el resultado. `npm test`
conserva las pruebas anteriores y no incluye el contrato nuevo; el workflow de
Semana 04 lo ejecuta por separado.

Sin Make, `npm run verify` genera el mismo reporte estructural. Después de que
`npm run build` termine correctamente, utilizar `npm run start` si se quiere
probar el build de producción. La prueba `npm run test:offline` sigue disponible
para Semana 03 y requiere build y Chromium; no verifica el detalle de Semana 04.

### Cómo probar CSR

Visitar `http://localhost:3000/inspecciones` y verificar los tres laboratorios.
Para observar carga, activar una conexión lenta en DevTools y recargar. Para
error, bloquear la petición `/api/inspecciones` mediante Network request blocking
y recargar; debe aparecer una alerta con **Reintentar**. Desbloquear la petición
y pulsar el botón para recuperar los registros. Restaurar la configuración de
red al terminar. Estos pasos son un procedimiento, no resultados ya obtenidos.

### Cómo probar SSR

Visitar directamente:

- `http://localhost:3000/inspecciones/inspection-001`
- `http://localhost:3000/inspecciones/inspection-002`
- `http://localhost:3000/inspecciones/inspection-003`

Comprobar que cada ruta presenta los datos del registro correcto y que el
contenido del detalle está en la respuesta del servidor, sin depender de una
consulta cliente. Repetir con JavaScript deshabilitado para revisar la lectura
del contenido básico; esta última es una comprobación manual pendiente.

### Error

`/inspecciones/no-existe` activa `notFound()`. Verificar la pantalla de recurso
inexistente y el estado HTTP 404 en una navegación directa; revisar cualquier
efecto de streaming con el responsable. La prueba contractual verifica que la
llamada esté en la rama de ausencia, pero no sustituye esta comprobación HTTP.

### Límites conocidos

- Datos sintéticos, sin base de datos, persistencia ni autenticación.
- CSR depende de JavaScript y de la API; el worker no almacena `/api/`.
- El detalle SSR usa datos locales estáticos: no hay base de datos, caché de
  producción ni garantía de SSR dinámico por petición.
- Las pruebas contractuales leen código, no ejecutan React ni certifican HTTP.
- No se agregó una E2E específica de Semana 04. Playwright conserva su
  configuración offline; una E2E futura deberá tener un patrón explícito y no
  debe descubrir las pruebas de Node.
- Los resultados reales deben comprobarse mediante pruebas y CI. Los resultados
  históricos de secciones anteriores no certifican esta entrega.

### Evidencia

Conservar las salidas de `npm run test:rendering`, `npm run test`,
`npm run test:service-worker`, build y check público, junto con el enlace a la
ejecución de `.github/workflows/week-04-w04-csr-ssr.yml`. El workflow genera y
publica `reports/verification.json` mediante `npm run verify`; ese reporte solo
comprueba la estructura del starter. La ejecución documentada de
`npm run test:rendering` aprobó sus 13 contratos.

La métrica reproducible de carga de la API, sus cinco repeticiones y la mediana
están definidas en `docs/rendering-decision.md`. Su medición está pendiente; no
se atribuyen cifras. Conservar resultados, condiciones y capturas, junto con el
SHA final y el resultado real de Actions. No se generan cobertura ni resultados
de evaluación ficticios.

## Semana 05 — persistencia local y sincronización idempotente

Oscar aporta `tests/sync.spec.ts`, el script `test:sync`, el workflow
`.github/workflows/week-05-sync.yml` y esta documentación. Las 16 pruebas
consumen las APIs existentes de almacenamiento y cola de Martín y la política
de conflictos de Felipe. Utilizan únicamente datos sintéticos, sin red, API
real ni autenticación real.

### Instalación y ejecución

Con Node.js 22 compatible, desde la raíz del repositorio:

```bash
npm ci
npm run test:sync
```

`fake-indexeddb` proporciona IndexedDB en Node. `tsx` ejecuta los tests
TypeScript con `node:test` y permite consumir los módulos existentes con sus
imports actuales. Las aserciones verifican comportamiento y registros
persistidos; no dependen de búsquedas textuales del código fuente.

### Aislamiento y reintentos reproducibles

Antes y después de cada prueba se cierran las conexiones de los helpers y se
elimina completamente `pwa-inspecciones-sync`, esperando el resultado de
`deleteDatabase`. La suite desactiva la concurrencia para evitar compartir la
base entre pruebas. Cada caso prepara sus propios datos.

Las fechas son constantes explícitas y se inyectan como `Date` en las APIs.
Para los reintentos se avanza el reloj manualmente, sin `setTimeout` ni esperas
de segundos reales. Se comprueban los retrasos de 1, 2, 4, 8 y 16 segundos;
el escenario de 16 segundos usa explícitamente `maxAttempts: 6`.

El máximo predeterminado es de cinco intentos: los cuatro primeros fallos
programan 1, 2, 4 y 8 segundos; el quinto deja la entrada en `exhausted`, sin
programar una espera de 16 segundos. Las entradas agotadas quedan fuera de
`getDueQueueEntries` y no se envían automáticamente. `calculateRetryDelay`
tiene un tope predeterminado de 60000 ms por retraso; no es un límite de tiempo
acumulado y el helper permite configurar otro `maximumDelayMs`.

### Cobertura y límites

Las pruebas verifican las stores `inspections`, `syncQueue` y `syncReceipts`,
sus keyPaths e índices de cola, el guardado offline y las operaciones pendientes.
La idempotencia se comprueba tanto con una mutación pendiente como después de
confirmarla: los recibos permiten detectar una repetición sin crear otra
operación. Un envío sintético exitoso elimina el pendiente, deja recibo y marca
la inspección como `synced`.

Una eliminación conserva un tombstone (`deleted: true`) físicamente en
IndexedDB y lo oculta del listado offline. Después de confirmar el delete,
desaparecen el tombstone y el pendiente y permanece el recibo.

Las pruebas de `resolveSyncConflict` comprueban que versiones iguales aceptan
el cambio local y que una versión servidor más reciente gana, incluso frente a
una eliminación local. La política devuelve una decisión y no está conectada
automáticamente a la persistencia: estas pruebas no acreditan restauración de
datos servidor en IndexedDB. Tampoco hay API ni autenticación reales; el sender
usado en las pruebas es sintético. IndexedDB simulado no sustituye una prueba
de integración en navegador ni demuestra idempotencia de un servidor real.

### Verificación de Semana 05

Ejecutar en este orden y conservar los resultados reales:

```bash
npm ci
npm test
npm run test:rendering
npm run test:service-worker
npm run test:sync
npm run build
npm run verify
bash public-tests/check.sh
```

El workflow utiliza Ubuntu y Node 22 y ejecuta la misma secuencia. No instala
Chromium porque no ejecuta `test:offline`. Publica `reports/verification.json`
cuando está disponible; ese reporte solo valida la estructura del starter.
Los comandos build y verify generan artefactos locales. El check público
requiere Bash y ripgrep. No se atribuyen resultados remotos de Actions hasta
verificar una ejecución real.
