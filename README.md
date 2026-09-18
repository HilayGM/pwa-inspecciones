# PWA de inspecciones de laboratorio — proyecto base

Starter oficial para la materia **Aplicaciones Web Progresivas**.

Este repositorio es el punto de partida común para las actividades de las semanas 1–13. En la Semana 1 no debes construir todavía toda la PWA: debes poner en marcha este proyecto, documentar el problema y dejar una primera versión reproducible. Cada semana conservarás el mismo repositorio y agregarás la capacidad indicada por la actividad.

## Requisitos locales

- Node.js 20 LTS o superior compatible con Next.js.
- npm 10 o superior.
- Git y una cuenta de GitHub.

## Arranque verificable

```bash
npm ci
npm run dev
```

Abre <http://localhost:3000>. Debes ver la pantalla inicial de inspecciones con datos sintéticos.

Antes de entregar ejecuta:

```bash
make verify
bash public-tests/check.sh
```

`make verify` genera `reports/verification.json`; ese archivo y la corrida verde de GitHub Actions son la evidencia técnica del arranque.

## Registro del Service Worker

El componente global registra `public/sw.js` en el navegador cuando se monta la aplicación. El registro no se ejecuta durante el renderizado del servidor y los navegadores sin soporte de Service Workers continúan funcionando sin interrumpir la interfaz.

### Instalación y ejecución de producción

```bash
npm ci
npm run build
npm run start
```

Abre <http://localhost:3000> y revisa en DevTools, en **Application > Service Workers**, que `/sw.js` aparezca registrado. El modo offline debe probarse con una compilación de producción y el servidor iniciado; la ejecución de desarrollo no representa el comportamiento final del Service Worker.

### Prueba offline

1. Con la aplicación cargada, abre DevTools y entra en **Application > Service Workers**.
2. Activa **Offline** en la sección de red de DevTools o desconecta la red.
3. Recarga la aplicación y verifica el comportamiento de los recursos que el Service Worker haya almacenado en caché.

### Limpiar caché y desregistrar

En **Application > Storage**, selecciona **Clear site data** para limpiar el almacenamiento del sitio. Después, en **Application > Service Workers**, pulsa **Unregister** y recarga la página. También puedes borrar manualmente las entradas de **Cache Storage** si necesitas una limpieza completa.

### Alcances y límites conocidos

- El registro solo instala `/sw.js`; no implementa sincronización en segundo plano ni persistencia de inspecciones.
- El comportamiento offline depende de las rutas y recursos que el Service Worker actual coloque en caché.
- El registro no garantiza que todas las pantallas o llamadas de red funcionen sin conexión.
- Los cambios futuros de `sw.js` pueden requerir actualizar, desregistrar o limpiar manualmente el Service Worker durante las pruebas.

## Flujo de trabajo del curso

1. Conserva este repositorio como tu proyecto personal y crea un repositorio privado en GitHub.
2. Completa únicamente los entregables de la actividad de la semana.
3. Haz cambios pequeños y descriptivos; no borres lo que ya funciona.
4. Ejecuta la verificación local y espera que GitHub Actions termine en verde.
5. Entrega en Classroom la URL del repositorio, el SHA exacto evaluado, el enlace a Actions y `evidence/individual.md`.

No uses datos reales de personas, laboratorios o estudiantes. Todo dato del starter es sintético.

## Estructura inicial

- `src/app/`: aplicación Next.js con App Router.
- `src/lib/data/`: datos sintéticos de inspecciones.
- `docs/`: plantillas de documentación de la Semana 1.
- `scripts/verify.mjs`: verificación reproducible local.
- `tests/`: prueba mínima del starter.

Las decisiones de arquitectura y las nuevas carpetas se incorporan en las actividades correspondientes; no es necesario adelantarlas.

