# Estrategia de caché — Semana 3

## Objetivo

Mantener disponible la pantalla inicial de inspecciones sintéticas cuando la
conectividad sea intermitente. La aplicación actual es de consulta: no captura,
edita, sincroniza ni consulta una API de inspecciones.

## Decisión

El service worker `public/sw.js` usa una caché con versión
`pwa-inspections-v1` y aplica dos políticas:

| Recurso | Política | Comportamiento |
| --- | --- | --- |
| Navegación HTML | Network first con respaldo de caché | Intenta la red para obtener una versión actual. Si falla, entrega la última copia de la pantalla inicial. |
| Recursos de Next.js bajo `/_next/static/` | Cache first | Entrega primero una copia local. Si no existe, la descarga una vez y la conserva. |

La pantalla inicial contiene los tres registros sintéticos dentro del paquete de
la aplicación; por tanto, una copia válida del HTML y sus recursos estáticos
permite consultar esa demostración sin red.

## Ciclo de vida y actualización

Durante `install`, el worker almacena `/` como app shell. Durante `activate`,
elimina únicamente cachés cuyos nombres inician con `pwa-inspections-` y cuya
versión no coincide con la activa. Esto evita borrar cachés ajenas al proyecto.

Al realizar un cambio incompatible en recursos o reglas, el equipo incrementará
la versión, por ejemplo de `pwa-inspections-v1` a `pwa-inspections-v2`.
El worker usa `skipWaiting()` y `clients.claim()` porque la aplicación no tiene
operaciones de escritura que puedan interrumpirse al activar una actualización.

## Exclusiones de seguridad y coherencia

El worker no intercepta ni almacena:

- solicitudes distintas de `GET`;
- recursos de otro origen;
- rutas bajo `/api/`.

Estas exclusiones evitan tratar envíos, autenticación o futuras respuestas
dinámicas como archivos estáticos. El proyecto usa únicamente datos sintéticos;
no se deben agregar credenciales ni datos personales a la caché.

## Límites conocidos

- La primera visita requiere conexión para instalar el worker y poblar la caché.
- Tras registrarse el worker, se necesita una recarga con conexión para que sus
  reglas de recursos estáticos controlen la página.
- La caché puede mostrar una versión anterior hasta que la red entregue una
  actualización.
- El navegador puede eliminar el almacenamiento del sitio.
- Esta actividad no conserva, reintenta ni sincroniza inspecciones nuevas.

## Validación manual

1. Ejecutar la aplicación compilada con `npm run build` y `npm run start`.
2. Abrir `http://localhost:3000` con conexión.
3. Confirmar en DevTools > Application > Service Workers que `/sw.js` está
   activo.
4. Recargar la página una vez con conexión.
5. En DevTools > Network, seleccionar **Offline**.
6. Recargar `/` y comprobar que se muestran las tres inspecciones sintéticas.
7. En Cache Storage, confirmar la caché `pwa-inspections-v1` y sus recursos.

La automatización de estos casos corresponde a `tests/service-worker.spec.ts` y
`tests/offline.spec.ts`, entregables del integrante responsable de pruebas.
