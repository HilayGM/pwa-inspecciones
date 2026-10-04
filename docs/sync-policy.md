# Política de sincronización

## Flujo de sincronización

1. Al guardar una inspección sin conexión, `enqueueInspection` escribe el
   registro local y una entrada pendiente en IndexedDB dentro de una transacción.
   La entrada conserva la operación, el contenido enviado y la `baseVersion`.
2. Cuando la aplicación puede sincronizar, `syncDueEntries` obtiene las entradas
   vencidas y las entrega al `SyncSender`. La cola no implementa por sí misma
   transporte HTTP ni decide cuándo se recupera la conectividad; el emisor debe
   confirmar que el servidor aceptó cada operación.
3. Tras una respuesta exitosa, `markSyncSuccess` actualiza la versión del
   registro local (si se recibió una versión), guarda un recibo de sincronización
   y elimina la entrada pendiente. Si falla el envío, la entrada se conserva y
   se programa un reintento.

## Almacenamiento

La base IndexedDB `pwa-inspecciones-sync` contiene tres almacenes:

| Almacén | Propósito |
| --- | --- |
| `inspections` | Registros locales, con versiones local y del servidor, estado de sincronización y marca de eliminación. |
| `syncQueue` | Operaciones pendientes, payload, versión base, clave de idempotencia, contador de intentos y próxima fecha de envío. |
| `syncReceipts` | Confirmaciones ya procesadas, indexadas por clave de idempotencia para reconocer operaciones repetidas. |

## Idempotencia

La cola construye `idempotencyKey` con el ID de inspección, la operación y el
`clientMutationId`. El índice único evita encolar dos veces la misma mutación,
y los recibos permiten reconocer una operación que ya fue confirmada. Esto
reduce duplicados cuando una respuesta se pierde y el cliente vuelve a enviar
la misma operación.

## Reintentos

Los fallos transitorios usan backoff exponencial de 1, 2, 4, 8 y 16 segundos
(base de 1 segundo) y un máximo predeterminado de 5 intentos. Después del
quinto fallo, la entrada queda en estado `exhausted` y deja de ser elegible para
sincronización automática. La cola permite configurar otro máximo por entrada;
el retraso también tiene un tope general de 60 segundos.

## Política de conflictos

`resolveSyncConflict` en `src/lib/sync/conflict-policy.ts` es una función pura:
recibe el cambio local, el registro y versión del servidor, `baseVersion` y la
operación; devuelve una decisión (`accept-local`, `accept-server` o
`no-conflict`), una razón y una copia del registro local para diagnóstico. No
accede a IndexedDB, red ni reloj.

- Si el servidor no tiene el registro y la operación es `create`, se devuelve
  `accept-local`.
- Si el servidor no tiene el registro y la operación es `delete`, se devuelve
  `no-conflict`, porque la eliminación ya está satisfecha. Para `update` se
  devuelve `no-conflict`; una actualización no se transforma implícitamente en
  creación.
- Si `baseVersion` coincide con la versión actual del servidor, se devuelve
  `accept-local` para `create`, `update` o `delete`.
- Si el servidor tiene una versión mayor que `baseVersion`, se devuelve
  `accept-server` y se conserva el registro del servidor. Esto también cubre
  una eliminación local que compite con una actualización más reciente del
  servidor.
- Si las versiones difieren, pero la versión del servidor no es mayor que la
  base, se devuelve `no-conflict`; la función no inventa una regla de
  sobrescritura para ese caso.

Conservar el servidor ante una versión más reciente evita perder cambios
confirmados por otro cliente, a costa de descartar el cambio local automático
y requerir una reconciliación posterior.

## Supuestos, riesgos y trade-offs

Los registros actuales son sintéticos. El proyecto no dispone de una API de
sincronización real ni de autenticación real; `SyncSender` es el límite de
integración, no una implementación de servidor. Por tanto, la confirmación,
autorización y control de versiones del servidor quedan pendientes de esa
integración.

IndexedDB pertenece al almacenamiento del navegador y el usuario, el navegador
o el sistema pueden borrarlo; perderlo puede eliminar registros locales,
operaciones pendientes y recibos aún no sincronizados. La cola programa
reintentos usando fechas del dispositivo, por lo que un reloj incorrecto puede
adelantar o retrasar los envíos. Finalmente, ante una versión distinta más
reciente, se prioriza conservar el servidor sobre la disponibilidad inmediata
del cambio local: reduce sobrescrituras, pero puede perder una modificación
local hasta que se reconcilie explícitamente.