# PWA Inspecciones de laboratorio

Aplicación académica para consultar inspecciones de mantenimiento con datos sintéticos y probar capacidades opcionales del navegador. Continúa el repositorio de semanas anteriores; no es un starter nuevo. Las capacidades solo solicitan acceso después de que la persona pulsa el botón correspondiente.

## Requisitos

- Node.js 22, alineado con los workflows de GitHub Actions de las semanas 3 a 5.
- npm incluido con Node.js.
- Para las pruebas E2E offline: Chromium de Playwright instalado.

## Instalación y desarrollo

Desde la raíz del repositorio:

```sh
npm ci
npm run dev
```

Abre `http://localhost:3000`. En Windows puede usarse PowerShell o la terminal integrada de VS Code. `npm ci` instala exactamente las dependencias del lockfile.

Para compilar y ejecutar la versión de producción:

```sh
npm run build
npm run start
```

La verificación general existente es:

```sh
npm run verify
# Equivalente: make verify
```

El script `verify` valida los artefactos del starter y genera `reports/verification.json`.

## Pruebas automatizadas

```sh
npm test
npm run test:capabilities
npm run test:service-worker
npm run test:rendering
npm run test:sync
```

- `npm test`: orquesta las pruebas estructurales, unitarias, de integracion, capacidades, sincronizacion, rendering, Service Worker y E2E.
- `npm run test:capabilities`: mocks deterministas de camara, geolocalizacion y notificaciones, ejecutados con tsx y node:test; no requieren dispositivos ni permisos reales.
- `npm run test:service-worker`: contrato estático del Service Worker.
- `npm run test:rendering`: contratos de rutas y estados CSR/SSR.
- `npm run test:sync`: persistencia y sincronización con IndexedDB sintética (`fake-indexeddb`).
- `npm run test:offline`: prueba E2E Playwright de navegación offline. Requiere primero un build y Chromium instalado (`npx playwright install chromium`); Playwright inicia `npm run start` según `playwright.config.ts`.

El workflow de Semana 06 instala con `npm ci`, ejecuta estas validaciones y conserva los artefactos de evaluación disponibles. Los tests de capacidades son independientes de permisos del sistema; la prueba manual de permisos sí requiere interacción en el navegador.

El kit también solicita ejecutar `bash public-tests/check.sh` desde Bash. Su búsqueda de palabras sensibles es textual y el estado actual contiene coincidencias en documentación, el lockfile y nombres como `SyntaxKind.*Token`; por ello puede reportar falsos positivos. El workflow de Semana 06 conserva sus checks de artefactos y no ejecuta este check público hasta que ese filtro se ajuste por la persona responsable del kit.

## Semana 08: ejecucion de la piramide de pruebas

Requisitos: Node.js 22, npm y Chromium instalado para las pruebas E2E. Despues de clonar, ejecuta `npm ci` desde la raiz. Instala el navegador localmente con `npx playwright install chromium` (en Linux CI se instalan tambien las dependencias del sistema).

Ejecuta cada nivel con:

```sh
npm run test:unit
npm run test:integration
npm run test:e2e
npm test
```

`test:unit` ejecuta las pruebas de `tests/unit/`. `test:integration` combina la sincronizacion con IndexedDB sintetica y el contrato de la API de inspecciones. `test:e2e` ejecuta el recorrido critico con Playwright y la prueba existente del Service Worker. Las pruebas E2E usan el servidor de produccion: ejecuta `npm run build` antes de `npm run test:e2e`. `npm test` orquesta todos los niveles y conserva las comprobaciones de semanas anteriores.

Compila y verifica artefactos localmente:

```sh
npm run build
npm run verify
make verify
```

`npm run verify` y `make verify` son equivalentes y escriben `reports/verification.json`. Playwright escribe el reporte HTML en `playwright-report/` y resultados, trazas y adjuntos en `test-results/`. Abre el reporte con `npx playwright show-report playwright-report`.

El workflow `.github/workflows/academic-evaluation.yml` corre en GitHub Actions para pushes y pull requests. En GitHub abre **Actions**, selecciona **Academic Evaluation** y revisa cada gate; descarga `academic-evidence-w08-testing-ci` para consultar los reportes incluso si fallan las pruebas.
El workflow ejecuta los Quality Gates de CI y `npm run verify`. El script shell `public-tests/check.sh` se mantiene como comprobacion manual; no se ejecuta en el workflow porque su busqueda textual actual marca palabras de documentacion y dependencias como falsos positivos.

El check publico se ejecuta con `bash public-tests/check.sh`. En Windows usa Git Bash o WSL desde la raiz; PowerShell no ejecuta directamente este script. Su escaneo textual puede reportar coincidencias en dependencias o documentacion; revisa el contexto de cada hallazgo.

Todas las pruebas usan datos sinteticos y no requieren servicios privados ni perifericos. El Service Worker recupera desde cache el shell del dashboard `/`. El listado `/inspecciones` depende de `/api/inspecciones`, que no se cachea; no se garantiza el listado ni el detalle completos offline.
## Prueba manual de capacidades

En la página principal está el panel **Capacidades del dispositivo**. Usa un entorno de prueba y no introduzcas información personal.

1. **Cámara:** pulsa **Abrir cámara** y concede el permiso en el navegador. Se muestra una vista previa local; pulsa **Cerrar cámara** y confirma que desaparece la vista y se apaga el indicador de cámara. Para comprobar denegación, bloquea el permiso del sitio y vuelve a pulsar. El botón **Cancelar solicitud** descarta una respuesta pendiente y libera un stream tardío; el navegador puede mantener abierto su propio diálogo de permiso.
2. **Ubicación:** para concederla, usa la simulación de ubicación del panel Sensors de DevTools (si está disponible) con coordenadas ficticias, pulsa **Leer ubicación** y verifica que el resultado se muestra redondeado a tres decimales. Para denegar, bloquea el permiso del sitio y repite. La aplicación no usa seguimiento continuo ni guarda el resultado.
3. **Notificaciones:** pulsa **Solicitar permiso y enviar** y responde al prompt. Con permiso concedido se intenta mostrar un mensaje local sintético. Repite tras denegar el permiso para observar el estado de fallback. La ausencia de API y los errores de `showNotification` o del navegador se verifican mediante mocks automatizados; el navegador no ofrece una forma uniforme de forzarlos manualmente.

Las APIs pueden requerir un contexto seguro; `localhost` se considera seguro en navegadores habituales, mientras que otros orígenes pueden requerir HTTPS. El soporte y los nombres de los controles varían según navegador y sistema operativo.

### Revocar permisos

Abre la información/permisos del sitio desde el icono junto a la dirección o desde la configuración de privacidad del navegador. Cambia Cámara, Ubicación o Notificaciones a **Bloquear** o **Preguntar** y recarga el sitio si el navegador lo solicita. Los nombres y la ubicación de estos controles cambian entre versiones. DevTools puede ofrecer simulación de ubicación en su panel de Sensors, pero los permisos se revocan desde los controles del sitio/navegador. No se necesita borrar datos ni conceder permisos persistentes para las pruebas automatizadas.

## Privacidad, compatibilidad y límites

- Pruebas y ejemplos utilizan únicamente mensajes, inspecciones y coordenadas sintéticas. No uses nombres reales, PII, tokens ni ubicaciones personales.
- La cámara solicita solo video (`audio: false`), presenta el stream localmente y detiene todos sus tracks al cerrar la vista o desmontar el componente. No captura ni persiste imágenes.
- La ubicación se solicita con una única lectura (`getCurrentPosition`), `enableHighAccuracy: false`, timeout de 10 segundos y redondeo a tres decimales. No se usa `watchPosition` ni almacenamiento persistente; el resultado vive solo en el estado de la pantalla.
- Las notificaciones son locales, usan texto sintético y requieren permiso. No hay push remoto ni suscripciones push.
- La implementación de notificaciones recurre a `new Notification(...)` si `showNotification` falla o no hay registro. Si `getRegistration()` rechaza, devuelve `"error"` sin intentar ese fallback; coordinar cualquier cambio de ese contrato con la persona responsable de notificaciones.
- Permisos denegados, restricciones del navegador, falta de hardware, políticas del sistema y origen no seguro pueden impedir una capacidad. Los fallbacks permiten mostrar el estado sin solicitar permisos al cargar la aplicación.
- No se adjunta evidencia fotográfica ni se registra una inspección desde este panel; es una demostración de APIs opcionales.

## Actividad Semana 06 y GitHub Actions

El workflow es [`.github/workflows/week-06-w06-device-push.yml`](.github/workflows/week-06-w06-device-push.yml). Para consultar una ejecución, abre el repositorio en GitHub, ve a **Actions** y selecciona **Academic Evaluation Feedback** o el workflow de Semana 06. No se publica aquí un enlace de ejecución porque depende del repositorio y del commit que se envíe.

Antes de entregar, conserva el SHA completo del commit evaluado, el reporte de CI y `evidence/individual.md`. La entrega se realiza mediante el Pull Request indicado por el curso; los resultados deben corresponder al commit evaluado.

El check público se puede ejecutar desde Bash en la raíz:

```sh
bash public-tests/check.sh
```
