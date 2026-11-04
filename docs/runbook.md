# Runbook de release y rollback

## Propósito

Recuperar una versión defectuosa sin eliminar indiscriminadamente los datos
locales ni la cola de sincronización offline.

## Detección

Considerar defectuosa una release cuando ocurra uno de estos eventos:

- El build o una prueba crítica falla.
- El healthcheck del contenedor falla tres veces.
- El smoke test no puede abrir `/`, la API, el manifest o `version.json`.
- El Service Worker entrega una aplicación incompatible.
- La navegación offline deja de mostrar el shell esperado.
- Se observan errores de ejecución después de publicar.

Antes de actuar, recopilar versión, SHA, fecha, etiqueta o imagen Docker,
logs, resultado del healthcheck y resultado del smoke test.

El SHA debe interpretarse según `shaSource`: `GIT_COMMIT_SHA`, `VERSION_SHA`,
`git` o `unavailable`. Un incidente de release debe abrirse si aparece
`unavailable` o si el SHA no coincide con la etiqueta desplegada. Para repetir
una generación de forma determinista, conservar también `SOURCE_DATE_EPOCH`.

## Rollback de despliegue

El rollback de despliegue recupera una imagen que ya fue construida y validada;
no cambia el historial Git.

1. Confirmar la versión defectuosa y registrar su SHA.
2. Aislar la publicación defectuosa o detener su contenedor.
3. Identificar la última imagen estable por su etiqueta exacta, no por
   `latest`.
4. Ejecutar el contenedor anterior, por ejemplo:

   ```bash
   docker stop pwa-inspecciones-app
   docker rm pwa-inspecciones-app
   docker run -d --name pwa-inspecciones-app -p 3000:3000 pwa-inspecciones:0.9.0
   ```

5. Comprobar `docker inspect --format='{{json .State.Health}}'`.
6. Comprobar `/`, `/api/inspecciones` y `public/version.json`.
7. Ejecutar el smoke test disponible y conservar sus resultados.

Si se reconstruye la imagen, proporcionar explícitamente `GIT_COMMIT_SHA` o
`VERSION_SHA` y `SOURCE_DATE_EPOCH`. El Dockerfile actual no declara esos
argumentos, así que la persona responsable de Docker debe integrar la
transmisión antes de considerar válida una imagen con trazabilidad completa.

Los nombres anteriores son un ejemplo basado en el `Makefile`; deben
adaptarse a la etiqueta y nombre reales de la imagen estable.

## Reversión de código y referencias Git

Estos mecanismos no son equivalentes:

- **Rollback de despliegue:** vuelve a ejecutar una imagen anterior.
- **`git revert`:** crea un nuevo commit que revierte cambios; es apropiado
  cuando la rama debe corregirse y volver a pasar CI.
- **Etiqueta o commit anterior:** identifica el código de una versión histórica;
  no modifica por sí solo un servidor ya desplegado.

No se deben crear commits, etiquetas ni hacer push automáticamente durante la
respuesta a un incidente.

## Service Worker y datos offline

Después del rollback:

1. Confirmar que el navegador detecta el `sw.js` recuperado.
2. Esperar la instalación y activación del worker anterior.
3. Recargar la aplicación después de confirmar el worker activo.
4. Inspeccionar Cache Storage y eliminar únicamente cachés identificadas como
   incompatibles con la versión recuperada.
5. No borrar IndexedDB como procedimiento normal.
6. Verificar que las inspecciones y entradas `syncQueue` sigan presentes.
7. Verificar que la aplicación no sobrescriba operaciones pendientes.

El worker actual limpia cachés con prefijo `pwa-inspections-`, pero usa el
nombre fijo `pwa-inspections-v1` y no ofrece un flujo de rollback controlado.
La recuperación del caché debe tratarse como una operación coordinada con el
responsable de PWA.

## Verificación posterior

- Aplicación accesible.
- Healthcheck correcto.
- Versión y SHA esperados.
- Service Worker recuperado y activo.
- Navegación normal y offline funcional.
- API disponible y sin caché indebida.
- IndexedDB conservada.
- Cola de sincronización conservada.
- Smoke test satisfactorio.
- Evidencia guardada con fecha, imagen, versión y SHA.

## Simulacro local

El simulacro previsto usa dos etiquetas locales: una imagen estable y una
imagen defectuosa identificada por SHA. Se ejecuta en Docker, se provoca un
fallo observable mediante una imagen o configuración de prueba aislada, se
detecta con healthcheck o smoke test y se vuelve a iniciar la etiqueta estable.

Este simulacro queda `not_run` hasta comprobar la disponibilidad de Docker y
ejecutarlo realmente. No debe declararse exitoso a partir de documentación.

## Escalamiento

Contactar al responsable de infraestructura o al responsable de PWA según la
naturaleza del incidente. Enviar únicamente información técnica necesaria:
versión, SHA, imagen, timestamps, logs, resultado de healthcheck, smoke test y
estado de IndexedDB/cola. No incluir datos personales ni inspecciones reales.
