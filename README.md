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

- Node.js 20.11 o superior compatible: los scripts del starter utilizan `import.meta.dirname`.
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

Genera la compilación de producción. La configuración existente de `next-pwa` escribe el service worker y sus recursos en `public/`; revisar los archivos generados antes de preparar una entrega. Para validar una contribución restringida a contenido y documentación, usar una copia temporal del proyecto evita alterar esos recursos del equipo.

## Verificación

```bash
npm run test -- --run
make verify
bash public-tests/check.sh
```

- `npm run test -- --run` ejecuta `node tests/starter.spec.mjs`. El argumento adicional se acepta pero el script no lo interpreta: no es un ejecutor Vitest. Comprueba el comando de build y dos textos de la página.
- `make verify` llama a `npm run verify` y genera `reports/verification.json`. Comprueba la existencia de artefactos del starter; no valida toda la PWA. Sin Make puede ejecutarse `npm run verify`.
- El check público verifica archivos mínimos y busca patrones de posibles credenciales con `rg`. Requiere que ripgrep esté disponible en Bash; su búsqueda textual puede producir falsos positivos y no sustituye una auditoría.

`tests/manifest.spec.ts` existe, pero **no está conectado al script `test` ni a otro script de npm**. Con Node.js 22.6 o superior que admita esta opción puede ejecutarse directamente:

```bash
node --experimental-strip-types tests/manifest.spec.ts
```

Comprueba nombre, modo `standalone`, una lista no vacía de iconos y referencias a `next-pwa` y `dest: public` en la configuración. No comprueba que los archivos de iconos existan ni que la instalación funcione. El mínimo de Node.js del starter no garantiza la ejecución directa de esta prueba TypeScript.

## Arquitectura Semana 02

| Archivo | Responsabilidad actual |
| --- | --- |
| `public/manifest.webmanifest` | Describe nombre, inicio, presentación `standalone`, colores e iconos para la identidad e instalación. |
| `src/app/layout.tsx` | Configura HTML en español de México, estilos globales, metadata, enlace al manifest y color del viewport; envuelve la página con AppShell. |
| `src/components/app-shell.tsx` | Proporciona header, enlaces a inicio, navegación, un único landmark `main` y footer. |
| `src/app/page.tsx` | Presenta propósito y tarjetas de inspecciones sintéticas dentro del shell, sin repetir navegación ni landmarks globales. |
| `tests/manifest.spec.ts` | Verifica propiedades críticas básicas del manifest y configuración PWA, con las limitaciones descritas arriba. |

`src/lib/data/inspections.ts` conserva los registros sintéticos compartidos. `scripts/verify.mjs` y `tests/starter.spec.mjs` mantienen la verificación de Semana 01. El workflow `.github/workflows/week-01-starter-feedback.yml` instala, verifica estructura, ejecuta la prueba del starter, compila y ejecuta el check público; no ejecuta actualmente la prueba del manifest.

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

La referencia `/icons/icon-192x192.png` sigue presente y su archivo no existe en `public/`. También falta el icono de 512 px. Esto confirma que la causa del 404 histórico sigue sin resolverse en el árbol actual; no se ha repetido una solicitud HTTP en esta revisión.

## Supuestos

- La pantalla inicial es una consulta estática de tres ejemplos ordenados del más reciente al más antiguo.
- El AppShell compartido sigue siendo responsable de estructura global y navegación.
- La instalación se debe comprobar en navegador una vez que el equipo complete los recursos del manifest.

## Limitaciones conocidas

- Faltan `public/icons/icon-192x192.png` y `public/icons/icon-512x512.png`: el integrante responsable del manifest debe aportar los recursos y verificar instalación. Un manifest presente no demuestra que la PWA sea instalable.
- `src/components/app-shell.tsx` utiliza clases de utilidad que no están definidas en `globals.css`, sin Tailwind instalado. Corresponde al responsable del shell resolver sus estilos; las clases CSS de la página sí existen.
- El shell actual no implementa estados de carga, error ni vacío. El responsable del shell debe completar y acordar esas demostraciones para la actividad de equipo.
- `tests/manifest.spec.ts` no forma parte de `npm test` ni del workflow. El responsable de pruebas/configuración debe integrar su ejecución y comprobar la existencia de iconos.
- `public-tests/check.sh` puede imprimir coincidencias y aun finalizar con `PUBLIC_OK`; el responsable de verificación debe corregir el control del resultado de la búsqueda y revisar sus falsos positivos.
- No hay base de datos, APIs reales, autenticación, captura ni edición. Esta contribución no implementa almacenamiento offline, sincronización ni notificaciones. Existe configuración PWA y archivos generados de service worker del proyecto; su comportamiento offline no se ha verificado aquí.

## Evidencia

Conservar salida o capturas de ejecución local, build, pruebas, `make verify` y su `reports/verification.json`, además del enlace al resultado de GitHub Actions. Generar capturas de la PWA funcionando en móvil y escritorio antes de la entrega final.

Lighthouse no se ha ejecutado en esta revisión: generar y conservar su reporte/captura antes de la entrega final, sin atribuir puntajes todavía. Completar posteriormente `evidence/individual.md` con la contribución, una prueba y una limitación. Para la entrega del curso conservar URL del repositorio, SHA exacto evaluado y enlace a Actions; este trabajo no crea commit ni publica cambios.

## Uso de IA

Se utilizó una herramienta de IA como apoyo para el análisis de estructura, la revisión de documentación y la asistencia en implementación. Los resultados históricos de ejecución, build y verificación fueron proporcionados por el integrante; las comprobaciones ejecutadas durante esta contribución se distinguen en «Verificación realizada». La revisión manual final por el integrante, incluida la comprobación visual y la validación de resultados de ejecución, build y pruebas, queda pendiente antes de la entrega. No se atribuyen a la IA pruebas de navegador ni mediciones de Lighthouse que no se realizaron.
