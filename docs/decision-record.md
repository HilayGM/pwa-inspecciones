# ADR-001 — Estrategia de aplicación

> Completa esta decisión en Semana 1. Una decisión no es solo una preferencia: relaciona restricciones, alternativas, consecuencias y una forma de validación.

## Estado

Aceptada — 2026-09-04.

## Contexto y restricciones

La Universidad Tecnológica de Tehuacán necesita una aplicación para registrar y consultar inspecciones de mantenimiento de laboratorios. El personal utilizará principalmente dispositivos móviles y puede encontrar conectividad intermitente.

El proyecto se desarrollará durante una materia de 14 semanas, por lo que debe mantener un alcance razonable, una sola base de código y un proceso reproducible de instalación, prueba y despliegue.

Durante las actividades se utilizarán exclusivamente datos sintéticos. La solución debe poder verificarse en un entorno limpio mediante comandos automatizados.
so móvil, los datos sintéticos, el alcance de una materia de 14 semanas y la necesidad de despliegue reproducible.

## Alternativas consideradas

| Alternativa | Instalación y distribución | Operación offline | Costo y mantenimiento | Dispositivo | Riesgos |
|---|---|---|---|---|---|
| PWA | Se distribuye mediante una URL y puede instalarse desde un navegador compatible | Puede incorporar caché y almacenamiento local | Una base de código web reduce el esfuerzo | Acceso limitado a algunas capacidades | Soporte desigual entre navegadores y sistemas |
| Web tradicional | Se distribuye fácilmente mediante una URL | Depende principalmente de la conexión | Desarrollo inicial sencillo | Acceso limitado | Experiencia reducida cuando la red falla |
| Aplicación nativa | Requiere instalación mediante una tienda o distribución administrada | Buen soporte offline | Mayor costo si se mantienen Android e iOS | Acceso amplio | Desarrollo y mantenimiento separados |
| Multiplataforma | Genera aplicaciones para varias plataformas desde una base compartida | Buen soporte offline | Costo intermedio y herramientas adicionales | Mayor acceso que una web | Dependencia del framework y compilaciones móviles |


## Decisión

Se selecciona una PWA.
Esta alternativa satisface mejor el uso móvil, la conectividad intermitente futura, el alcance académico de 14 semanas y la necesidad de mantener una sola base de código. También permite distribuir la aplicación mediante una URL y agregar progresivamente instalación, caché y almacenamiento local.

El starter Next.js proporciona una base web reproducible que puede evolucionar durante las siguientes semanas.

Esta decisión todavía no resuelve la instalación, el funcionamiento offline, la persistencia, la sincronización, la autenticación ni las notificaciones. Estas capacidades deberán implementarse y validarse posteriormente.


## Consecuencias y riesgos

### Consecuencias positivas

- Una sola base de código para escritorio y dispositivos móviles.
- Distribución mediante navegador sin depender inicialmente de una tienda.
- Desarrollo incremental durante las semanas del curso.
- Posibilidad de agregar capacidades offline.
- Actualizaciones centralizadas mediante despliegue web.

### Costos y consecuencias negativas

- Es necesario diseñar cuidadosamente el almacenamiento local y la sincronización.
- Algunas capacidades dependen del navegador y del sistema operativo.
- La ejecución en segundo plano puede ser limitada.
- El almacenamiento local puede ser eliminado por el dispositivo.
- Pueden surgir conflictos cuando varios registros se sincronizan.

### Mitigaciones

- Utilizar detección de capacidades antes de activar funciones avanzadas.
- Mostrar claramente si un registro está pendiente o sincronizado.
- Diseñar pruebas automatizadas para pérdida de conexión y recuperación.
- Evitar duplicados mediante identificadores únicos sintéticos.
- Documentar los navegadores y dispositivos compatibles.
- Mantener los datos de prueba separados de información real.


## Validación

- `npm ci` para comprobar la instalación reproducible.
- `npm test` para ejecutar las pruebas automatizadas.
- `npm run build` para comprobar la compilación.
- GitHub Actions para verificar cada commit.
- Lighthouse para medir rendimiento, accesibilidad e instalación.
- Una prueba automatizada que simule pérdida y recuperación de conexión.
- Una prueba que confirme que un registro pendiente no se pierde ni se duplica al sincronizarse.

Si las pruebas demuestran que las capacidades requeridas no funcionan en los dispositivos objetivo, se reconsiderará una solución multiplataforma o nativa.

