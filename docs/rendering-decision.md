# Decisión de renderizado — Semana 04

## Problema

Consultar las inspecciones sintéticas del proyecto mediante un listado y un
detalle por identificador, con estados de carga y error verificables y una
decisión técnica que pueda comprobarse sin servicios privados.

## Decisión

- **Listado `/inspecciones`: CSR**, responsabilidad funcional de Martín. Ya
  declara `"use client"`, consulta `/api/inspecciones` desde el navegador y usa
  `LoadingState` para carga, error y reintento. Genera enlaces por ID.
- **Detalle `/inspecciones/[id]`: SSR / Server Component**, responsabilidad
  funcional de Felipe. Debe recibir el ID de la URL, consultar los datos
  sintéticos compartidos y llamar `notFound()` cuando no exista el registro,
  sin declarar `"use client"`.
- **Estado de integración:** `src/app/inspecciones/[id]/page.tsx` todavía no
  existe en el árbol revisado. Esta decisión describe su contrato esperado;
  no acredita una ruta SSR implementada. Oscar prepara pruebas, documentación,
  scripts, CI y evidencia, sin implementar el detalle.

Un Server Component no demuestra por sí solo SSR dinámico en cada petición:
puede intervenir prerenderizado o caché. Al integrar el detalle habrá que
contrastar su código, la salida del build y el HTML recibido. Esta entrega no
impone una configuración funcional de renderizado al responsable del detalle.

## Comparación CSR vs SSR

| Aspecto | Listado CSR actual | Detalle SSR / Server Component previsto |
| --- | --- | --- |
| Dónde se obtiene la información | El navegador hace `fetch` a `/api/inspecciones`; la API entrega datos sintéticos locales. | El servidor lee los datos sintéticos compartidos según el ID de ruta. |
| Dónde se renderiza | Las tarjetas se completan en el navegador después de la consulta; puede existir HTML inicial del shell y de carga. | El contenido del registro se prepara en servidor; la política efectiva de prerenderizado/caché queda por verificar. |
| Cuándo aparece el contenido | Después de ejecutar JavaScript y resolver la API. | Se espera contenido del detalle en la respuesta inicial, sin esperar una consulta cliente del registro. |
| Dependencia de JavaScript | Necesario para consultar y mostrar los registros y reintentar. | El contenido básico del registro debe ser legible sin JavaScript; la navegación mejorada y otros componentes cliente pueden usarlo. |
| Carga | Estado inicial explícito con `LoadingState`, `role=status` y `aria-busy`. | Espera de navegación/respuesta del servidor; no se presupone una pantalla de carga aún inexistente. |
| Error | Respuesta HTTP fallida o consulta inválida muestra alerta y reintento. | Un ID inexistente debe pasar por `notFound()`; otros fallos requieren una decisión del responsable. |
| Ventajas | Interacción y reintento local sin recargar toda la página. | Lectura directa por URL y contenido inicial preparado en servidor. |
| Costos | JavaScript, hidratación, petición adicional y coordinación de estados. | Trabajo en servidor y espera de respuesta; despliegue y caché deben ser coherentes. |
| Accesibilidad | Estados anunciados y botón nativo; requieren revisión de teclado y lector de pantalla. | HTML semántico disponible inicialmente; estructura, navegación y estado inexistente deben verificarse al integrarse. |
| Rendimiento | La disponibilidad de datos depende del arranque cliente y de la API. | Puede reducir la espera cliente por datos, pero depende del servidor y de la caché; no se afirma que sea más rápido sin medir. |
| Complejidad | Efectos, cancelación de solicitudes, estado y recuperación en cliente. | Parámetros de ruta, búsqueda del registro, manejo de inexistentes y política de renderizado. |

## Supuestos

- Todos los datos son sintéticos.
- No existe base de datos real ni autenticación.
- Solo existen las inspecciones definidas en `src/lib/data/inspections.ts`:
  `inspection-001`, `inspection-002` e `inspection-003`.
- La API entrega `{ inspections }`; las pruebas no necesitan servicios privados.
- El entorno de pruebas contractuales utiliza Node.js 22.6 o superior compatible
  con `--experimental-strip-types`; CI configura Node.js 22 explícitamente.

## Límites

- CSR depende de JavaScript y de `/api/inspecciones`.
- SSR todavía no usa una fuente de datos dinámica real: su integración está
  pendiente y el contrato previsto utiliza el arreglo sintético local.
- No hay persistencia, autenticación, captura, edición ni sincronización.
- El worker excluye `/api/`; la prueba offline de la página inicial no demuestra
  que el listado CSR funcione sin conexión.
- Los enlaces al detalle están presentes, pero el flujo completo no puede
  acreditarse mientras falte la página de Felipe.
- Las pruebas contractuales inspeccionan código fuente mediante patrones y
  descartan comentarios. No son análisis semántico completo: una refactorización
  equivalente puede requerir adaptar patrones manteniendo los contratos. No
  prueban tiempos, comportamiento de React, contenido HTML ni estado HTTP real.
- Las mediciones locales con tres registros no representan producción real.

## Métrica repetible

**Métrica:** duración de carga de `/api/inspecciones` en milisegundos, calculada
como `responseEnd - startTime` mediante Resource Timing del navegador. Mide la
solicitud que abastece al listado CSR, no el tiempo hasta que las tarjetas se
pintan ni una comparación completa CSR/SSR.

**Estado:** pendiente de medición; no se atribuyen resultados numéricos.

Procedimiento reproducible:

1. Ejecutar `npm run build` y después `npm run start`. Usar siempre
   `http://localhost:3000/inspecciones`, el mismo equipo y la misma versión de
   Chrome/Chromium; registrar las versiones de Node y navegador.
2. En DevTools, activar **Network > Disable cache** y **No throttling**; mantener
   DevTools abierto. En **Application > Service Workers**, activar **Bypass for
   network** para que el worker no altere la navegación de esta medición.
3. Realizar una recarga de calentamiento, que no se registra.
4. Recargar normalmente cinco veces, esperando en cada repetición a ver las
   tres inspecciones. Después de cada recarga ejecutar en Console:

   ```js
   const requests = performance.getEntriesByType("resource").filter(
     (entry) => new URL(entry.name).pathname === "/api/inspecciones"
       && entry.initiatorType === "fetch"
   );
   console.table(requests.map((entry) => ({
     url: entry.name,
     inicioMs: entry.startTime,
     finMs: entry.responseEnd,
     duracionMs: entry.responseEnd - entry.startTime,
   })));
   ```

5. Registrar el valor de la petición de cada recarga y comprobar en Network que
   respondió correctamente. Si no hay una única petición exitosa por recarga,
   registrar la incidencia y repetir el procedimiento completo tras diagnosticarla;
   no seleccionar silenciosamente la petición más rápida.
6. Conservar los cinco valores y su mediana (el tercer valor al ordenarlos),
   fecha, revisión evaluada, versiones, condiciones y captura/exportación de
   Network. Registrar después esta evidencia en el incremento de Oscar.

No establecer un umbral de aprobación sin una línea base. El detalle podrá
medirse posteriormente con un procedimiento específico cuando esté integrado;
no atribuirle ahora mediciones ni resultados.

## Validación

- `tests/rendering.spec.ts`, ejecutado con `npm run test:rendering`, comprueba
  13 contratos: archivos, directiva cliente, consulta API, uso de LoadingState,
  enlaces por ID, detalle servidor, parámetros, `notFound()` y estados/reintento.
  La ausencia del detalle es un fallo real, sin omisiones ni éxito artificial.
- `npm run test` conserva starter y manifest; `npm run test -- --run` sigue
  siendo compatible. `npm run test:service-worker` mantiene el contrato previo.
- `npm run build` comprueba la compilación de las rutas que existen; por sí solo
  puede pasar aunque falte el detalle. No sustituye `test:rendering`.
- `make verify` genera `reports/verification.json` sobre la estructura del
  starter; no certifica los contratos de Semana 04.
- `.github/workflows/week-04-w04-csr-ssr.yml` ejecuta estas verificaciones y el
  check público, publica el reporte estructural y conserva cualquier fallo.
  Las salidas de pruebas/build quedan en los logs de Actions.
- **E2E de Semana 04 no implementada:** falta el detalle de Felipe. La E2E futura
  deberá visitar el listado, esperar los tres registros, abrir `inspection-001`,
  verificar sus datos y comprobar el estado HTTP y la pantalla de
  `/inspecciones/no-existe`. La implementación de `notFound()` y su respuesta
  efectiva deberán contrastarse en navegador, incluida la posible transmisión
  progresiva de la respuesta.
- Se conserva Playwright para la E2E offline de Semana 03. Al agregar una E2E
  real de Semana 04 se incorporará un archivo y patrón explícitos, sin descubrir
  las pruebas contractuales de Node como pruebas Playwright. No existe todavía
  un script `test:rendering:e2e`.
