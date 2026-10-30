# Inventario y matriz de privacidad — PWA de inspecciones

## 1. Alcance y principios

Este inventario describe los datos observados en la PWA de inspecciones y sus flujos locales. La actividad se refiere al contexto de un sujeto obligado mexicano y a la LGPDPPSO; esta documentación técnica no constituye dictamen jurídico ni acredita por sí sola el cumplimiento legal.

Se aplica minimización: recolectar solo datos operativos necesarios, solicitar cámara y ubicación mediante una acción explícita, no guardar fotos ni coordenadas en registros, limitar campos de texto y utilizar fixtures sintéticos. Los datos pueden seguir expuestos a código malicioso del mismo origen o a otra persona con acceso al perfil del navegador.

## 2. Matriz de datos

| Dato/activo | Finalidad | Origen | Clasificación | Persistencia y destinatarios | Minimización y controles |
|---|---|---|---|---|---|
| ID de inspección | Identificar y actualizar un registro de mantenimiento | Fixture o entrada de la aplicación | Identificador operativo, no personal por sí solo | Memoria, IndexedDB y contenido de operaciones offline; `GET /api/inspecciones` sirve fixtures | Formato `inspection-` con caracteres permitidos; rechaza separadores y secuencias de navegación. |
| Laboratorio/ubicación textual | Identificar el espacio revisado | Fixture o formulario | Dato operativo institucional | Puede permanecer en IndexedDB y en la cola; la ruta GET entrega fixtures con `Cache-Control: no-store` | Texto saneado y límite de 120 caracteres; no se observa geocodificación externa. |
| Fecha, estado, etiqueta y hallazgos | Registrar cuándo se revisó el laboratorio y el resultado | Fixture o formulario | Datos operativos | Memoria, IndexedDB y cola offline, según la operación | Fecha ISO validada; estado limitado a valores canónicos; hallazgos enteros y limitados a 1000. |
| Inspector | Etiquetar el rol sintético responsable del registro | Fixture o formulario | Seudónimo en los fixtures; podría ser dato personal si se introduce un nombre real | Puede guardarse junto al registro en IndexedDB y en la cola | Los fixtures observados usan “Técnica A/B/C”; texto limitado a 80 caracteres. No introducir nombres, matrículas, teléfonos ni identificadores reales. |
| Resumen | Describir observaciones de mantenimiento | Fixture o formulario | Texto operativo que podría revelar datos personales si se redacta con información real | Puede guardarse en IndexedDB/cola; sin persistencia remota demostrada por la API observada | Texto saneado y limitado a 1000 caracteres. Evitar nombres y detalles identificables. |
| Versión local/servidor, estado, fechas de cola, intentos, error y clave idempotente | Reintentar, ordenar y resolver conflictos de sincronización | Lógica de almacenamiento/sincronización | Metadatos operativos | Persisten en IndexedDB junto con las operaciones; los recibos se conservan hasta que el navegador elimine los datos o la aplicación los gestione | No incluir credenciales en mensajes de error. No hay TTL, cifrado en reposo ni política documentada de purga automática observados. |
| Coordenadas de geolocalización | Demostración de ubicación aproximada | API `navigator.geolocation`, solo al pulsar el botón | Dato de ubicación potencialmente sensible | Se conserva en estado de la vista para mostrarla; el esquema de inspección y la cola no incluyen coordenadas. No se observa envío ni persistencia | Lectura puntual, `enableHighAccuracy: false`, latitud/longitud redondeadas a 3 decimales (precisión espacial aproximada del orden de 100 m en latitud; variable en longitud), sin seguimiento continuo. La persona puede continuar sin conceder permiso. |
| Stream de cámara | Vista previa local para demostrar capacidad de cámara | `navigator.mediaDevices.getUserMedia`, solo al pulsar el botón | Video potencialmente biométrico si contiene una persona | `MediaStream` conectado a `<video>` en memoria; no se observa captura de fotogramas, archivo de foto, persistencia en IndexedDB ni subida a la API | Solicita `audio: false`; la interfaz informa que no graba ni almacena imágenes; los tracks se detienen al cerrar la vista o desmontar el componente. La persona puede continuar sin permiso. |
| Recursos PWA en caché | Habilitar shell y recursos estáticos sin conexión | Respuestas del mismo origen | Recursos de la aplicación | Cache Storage del navegador; `/api/`, métodos distintos de GET y otros orígenes no se almacenan por el Service Worker | Caché versionada, eliminación de cachés antiguas en activación; el código no añade respuestas API a esta caché. Los datos locales en IndexedDB son independientes de esta política. |
| Secretos/credenciales | No son necesarios para los fixtures o la demo | Configuración del entorno | Secreto de alto impacto si existiera | No se deben incluir en cliente, repositorio, registros ni fixtures | `secrets.ts` provee un escáner de ciertos nombres `NEXT_PUBLIC_*` y formatos de clave privada; su ejecución automática no fue verificada. No se deben cargar credenciales reales en el cliente. |

## 3. Ciclo de vida y flujos

1. **Creación/lectura:** la aplicación muestra registros sintéticos. La ruta `GET /api/inspecciones` devuelve el array de fixtures y define `Cache-Control: no-store`; el código revisado no contiene una escritura de backend para esta ruta.
2. **Uso offline:** las operaciones y registros necesarios se guardan en IndexedDB (`inspections`, `syncQueue`, `syncReceipts`). El Service Worker mantiene el shell y recursos estáticos, pero excluye explícitamente la ruta `/api/`. La persistencia local sobrevive al cierre de la pestaña y puede permanecer hasta su eliminación o limpieza por el navegador.
3. **Sincronización/reintento:** la cola registra intentos, tiempos, estado y claves idempotentes; el código contempla versiones y recibos. La retención definitiva de registros y recibos no está limitada por un plazo documentado.
4. **Cámara/ubicación:** cada capacidad se solicita por acción de usuario. El video permanece como stream en memoria y la ubicación redondeada en el estado de la vista; no se incorporan al tipo de inspección ni a la cola. Cerrar la vista detiene los tracks de cámara. No se usa seguimiento continuo.
5. **Eliminación:** el código de sincronización elimina una inspección local al procesar una operación de borrado y elimina la entrada de cola al completar una sincronización; un recibo puede permanecer en IndexedDB. No se encontró una política global de retención/limpieza ni una interfaz que garantice borrado seguro. La persona puede borrar los datos del sitio desde el navegador, sujeto a sus mecanismos.

## 4. Minimización y declaración de datos sintéticos

- **Declaración:** los registros incluidos en `src/lib/data/inspections.ts` y los datos sintéticos usados en las pruebas revisadas son 100% sintéticos y no contienen PII intencionalmente. No deben sustituirse por registros reales de estudiantes, personal o usuarios.
- No solicitar ni persistir fotos: la demostración usa stream en vivo en memoria, sin captura o envío de imagen.
- No persistir ni enviar coordenadas: toma puntual, sin alta precisión y redondeada a tres decimales; el diseño de datos de inspección no contiene campos GPS.
- No guardar nombres reales: las etiquetas de inspector de los fixtures son roles sintéticos. Limitar texto y evitar agregar datos identificables en resúmenes.
- No asumir que “sintético” equivale a “sin riesgo”: una alteración, extracción o indisponibilidad de IndexedDB aún puede afectar la demostración y el funcionamiento offline.

## 5. Controles de privacidad y límites

- `public/sw.js` no cachea solicitudes `/api/`; `src/app/api/inspecciones/route.ts` devuelve `Cache-Control: no-store`. Estos controles reducen almacenamiento accidental de respuestas API, no sustituyen autorización.
- `public/robots.txt` desautoriza rastreo de `/api/` e `/inspecciones/`, pero no impide que alguien solicite esas rutas.
- `src/lib/security/headers.ts` define CSP, Permissions-Policy y otras cabeceras, pero no se encontró su conexión en `next.config.mjs`; la aplicación efectiva en respuestas queda por verificar. La CSP incluye `'unsafe-inline'` y `'unsafe-eval'`, por lo que su nivel de restricción frente a XSS es limitado.
- No se observó autenticación/autorización para datos personales, cifrado de IndexedDB, control de retención con TTL, ni evidencia de que HTTPS esté activo en un despliegue. Antes de usar datos reales se requiere diseñar y verificar esos controles, además de atender los requisitos legales y organizacionales aplicables.

## 6. Verificación relacionada

Durante esta tarea se ejecutaron `npm run test:security` (27 aprobadas, 0 fallidas), `npm run test:unit` (28 aprobadas, 0 fallidas; incluye la prueba de redondeo a tres decimales y lectura sin seguimiento) y `npm run test:service-worker` (PASS). Estas pruebas corroboran comportamientos unitarios y contratos del Service Worker; no prueban una política real de retención, despliegue HTTPS, permisos de un dispositivo físico ni ausencia absoluta de PII en datos futuros.
