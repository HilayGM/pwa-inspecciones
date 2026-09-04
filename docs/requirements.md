# Requisitos del producto — completar en Semana 1

> Conserva estos encabezados y reemplaza las instrucciones por tu análisis. No uses datos reales.

## 1. Problema y contexto
La Universidad Tecnológica de Tehuacán necesita mejorar el registro de inspecciones de mantenimiento de sus laboratorios. Actualmente, la información puede quedar dispersa o depender de procesos manuales, lo que dificulta consultar hallazgos y dar seguimiento a las necesidades de mantenimiento.

La aplicación será utilizada principalmente desde dispositivos móviles. La conexión a Internet puede ser intermitente dentro de algunos laboratorios, por lo que el producto deberá contemplar posteriormente el almacenamiento local y la sincronización cuando se recupere la conexión.

Durante la Semana 1, el alcance consiste en documentar el producto, justificar la estrategia técnica y conservar el starter Next.js ejecutable con datos sintéticos.

Quedan fuera del alcance de esta semana la autenticación, el manifest, el service worker, las notificaciones, la sincronización real, una base de datos y el despliegue de producción.


## 2. Usuarios y escenarios
- Técnico inspector: consulta y registra inspecciones de mantenimiento.
- Coordinador de mantenimiento: revisa hallazgos y determina cuáles necesitan seguimiento.
- Administrador técnico: mantiene y despliega la aplicación.


### Escenario 1: consulta con conexion
El técnico abre la aplicación desde un dispositivo móvil con conexión. La pantalla presenta las inspecciones recientes con laboratorio, fecha, responsable, estado, número de hallazgos y resumen. El técnico puede identificar cuáles requieren atención.

Resultado observable: aparecen tres inspecciones sintéticas y cada registro muestra sus datos principales.

### Escenario 2: conectividad intermitente

En una versión futura, el técnico comienza una inspección y la conexión se interrumpe. La aplicación conserva localmente la información como pendiente. Cuando se recupera la conexión, el usuario puede sincronizar el registro y conocer su estado.

Resultado observable futuro: la información capturada no se pierde y cambia de pendiente a sincronizada después de recuperar la conexión.

## 3. Requisitos funcionales
### RF-01 — Consultar inspecciones

El sistema mostrará una lista de inspecciones recientes.

Aceptación: dado que existen tres registros sintéticos, cuando el usuario abre la pantalla principal, entonces aparecen los tres registros con laboratorio, fecha, estado y hallazgos.

### RF-02 — Identificar inspecciones que requieren atención

El sistema distinguirá visual y textualmente las inspecciones sin incidencias de aquellas que requieren atención.

Aceptación: cuando una inspección tiene estado de atención, entonces se muestra la etiqueta “Requiere atención”; en caso contrario, se muestra “Sin incidencias”.

### RF-03 — Registrar una inspección

En una versión futura, el técnico podrá registrar el laboratorio, la fecha, el responsable, el estado, el número de hallazgos y un resumen.

Aceptación: cuando se proporcionan todos los campos obligatorios y se confirma el registro, entonces la inspección queda almacenada y aparece en la lista.

### RF-04 — Validar datos obligatorios

El sistema impedirá guardar una inspección cuando falten campos obligatorios o el número de hallazgos sea inválido.

Aceptación: cuando el usuario intenta guardar información incompleta, entonces el sistema identifica los campos que deben corregirse y no crea el registro.

### RF-05 — Conservar información sin conexión

En una versión futura, el sistema conservará localmente una inspección cuando no exista conexión.

Aceptación: si la conexión se interrumpe antes de enviar la inspección, entonces el registro permanece disponible después de recargar la aplicación y se muestra como pendiente.

### RF-06 — Sincronizar registros pendientes

En una versión futura, el sistema permitirá sincronizar las inspecciones pendientes cuando regrese la conexión.

Aceptación: dado un registro pendiente, cuando se recupera la conexión y la sincronización termina correctamente, entonces el registro se marca como sincronizado sin duplicarse.


## 4. Requisitos no funcionales
### RNF-01 — Reproducibilidad

En un entorno limpio con Node.js 20 LTS o una versión compatible, `npm ci`, `npm test`, `npm run build` y `npm run verify` deberán terminar con código 0 sin configuraciones privadas.

### RNF-02 — Accesibilidad

La interfaz deberá poder recorrerse utilizando teclado, conservar una estructura semántica de encabezados y alcanzar al menos 90 puntos en la categoría de accesibilidad de Lighthouse.

### RNF-03 — Seguridad

El repositorio no deberá contener credenciales, archivos de configuración privada ni información sensible. El check público deberá comprobar esta condición antes de la entrega.

### RNF-04 — Privacidad

El 100 % de los registros utilizados durante la actividad deberán ser sintéticos. No se utilizarán nombres reales, matrículas, correos, teléfonos ni información institucional privada.

### RNF-05 — Rendimiento

La pantalla principal deberá alcanzar un Largest Contentful Paint menor o igual a 2.5 segundos en una medición de Lighthouse con configuración móvil.

### RNF-06 — Operación offline futura

Cuando se implemente la operación offline, el 100 % de los registros pendientes deberán permanecer disponibles después de recargar la aplicación y deberán poder sincronizarse al recuperar la conexión.

## 5. Datos sintéticos y límites
Se utilizarán exclusivamente datos ficticios. Cada inspección puede contener:

- Identificador sintético.
- Nombre genérico del laboratorio.
- Fecha de demostración.
- Responsable genérico, como “Técnica A”.
- Estado de la inspección.
- Número de hallazgos.
- Resumen ficticio.


## 6. Criterios de aceptación de la Semana 1

- CA-01: `docs/requirements.md` conserva sus secciones y contiene requisitos funcionales y no funcionales verificables.
- CA-02: `docs/decision-record.md` compara las cuatro alternativas y justifica la decisión.
- CA-03: `evidence/individual.md` identifica la contribución, prueba, limitación y uso de IA.
- CA-04: `npm ci` instala las dependencias utilizando el lockfile.
- CA-05: `npm test` termina con código 0.
- CA-06: `npm run build` termina con código 0.
- CA-07: `npm run verify` termina con código 0 y genera `reports/verification.json`.
- CA-08: GitHub Actions termina en verde para el mismo SHA entregado en Classroom.