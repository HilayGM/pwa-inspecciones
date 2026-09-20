# Evidencia individual — entrega de equipo

## Martin Moreno Libreros

- Repositorio y commit de mi contribución:
  https://github.com/HilayGM/pwa-inspecciones
  SHA: `feae1ab3e9425d9753fef686cf08b92b8da6b2c3`

- Mi contribución concreta:
  Implementé el service worker manual en `public/sw.js`, configuré la aplicación para evitar que el worker generado por `next-pwa` lo sobrescriba durante el build, retiré los artefactos Workbox ya no utilizados y documenté la estrategia en `docs/cache-strategy.md`.

- Decisión técnica que puedo explicar:
  Elegí *network first* con respaldo de caché para la navegación y *cache first* para los recursos estáticos de Next.js. Así, con Internet la aplicación intenta obtener una pantalla actualizada; si la conexión falla, muestra la última pantalla inicial disponible. Las solicitudes `POST`, recursos externos y futuras rutas `/api/` quedan excluidos para no guardar datos dinámicos o sensibles como si fueran recursos estáticos.

- Comandos o pruebas ejecutadas y resultado:
  - `node --check public/sw.js`: terminó con código 0; la sintaxis del service worker es válida.
  - `npm.cmd test`: terminó con código 0; `starter.spec.mjs: PASS` y `manifest.spec.ts: PASS`.
  - `git diff --check`: terminó sin errores de espacios.
  - `npm.cmd run build`: se inició correctamente, pero no terminó dentro del límite de 120 segundos del entorno de asistencia. La compilación, la prueba real en navegador sin conexión y GitHub Actions deben ejecutarse por el equipo antes de fusionar a `main`.

- Limitación o riesgo identificado:
  La primera visita requiere conexión para instalar el worker y guardar el app shell. El funcionamiento offline completo depende de que se integre el registro del service worker y se agreguen las pruebas de navegador. Esta versión no guarda ni sincroniza nuevas inspecciones.

- Uso declarado de IA:
  Utilicé OpenAI Codex para analizar el estado del repositorio, proponer la estrategia de caché, implementar el service worker y redactar la documentación de la decisión. Influyó en `public/sw.js`, `next.config.mjs`, `docs/cache-strategy.md` y este bloque de evidencia. Revisé manualmente la estrategia, confirmé las pruebas y salidas declaradas, y dejé explícitas las validaciones que siguen pendientes.

## Oscar Martinez Martinez

- Estudiante: Oscar Martinez Martinez
- Commit SHA evaluado: https://github.com/HilayGM/pwa-inspecciones
 SHA:291bd66bc94d54b96fada542ef9f740d6d9d3568

- Mi contribución concreta:
  Implementé `src/app/page.tsx` con el contenido de demostración de inspecciones y actualicé `README.md` con instalación, ejecución, verificación, arquitectura, limitaciones y evidencia de la Semana 02.

- Decisión técnica que puedo explicar:
  La estrategia PWA es adecuada para el proyecto de inspecciones porque permite mantener una sola base de código, distribuir la aplicación mediante una URL y agregar progresivamente capacidades para trabajar con conectividad intermitente. En la Semana 1 todavía no se implementan el funcionamiento offline ni la sincronización, ya que corresponden a etapas posteriores del proyecto.

- Prueba que ejecuté y resultado:

  Ejecuté `npm test`.
  Resultado:
  `starter.spec.mjs: PASS`

  Ejecuté `npm run verify`.
  Resultado:
  `Starter verificable: PASS`

  Se generó el reporte:
  `reports/verification.json`
  El reporte indicó:
  `"status": "pass"` y `"missing": []`.

  Ejecuté `npm run build`.
  Resultado:
  `Compiled successfully`

  También se completaron correctamente:
  `Linting and checking validity of types`
  `Collecting page data`
  `Generating static pages (4/4)`
  `Collecting build traces`
  `Finalizing page optimization`

- Limitación o fallo diagnosticado:
  La operación offline y la sincronización todavía no están implementadas. Cuando se agreguen será necesario manejar correctamente los reintentos, los registros pendientes, posibles duplicados y conflictos cuando se recupere la conexión.

- Cambio que podría defender o modificar en vivo:
  Puedo explicar los criterios de aceptación de los requisitos de la Semana 1 y justificar la selección de una PWA frente a una aplicación web tradicional, una aplicación nativa y una solución multiplataforma.

- Uso declarado de IA (herramienta, propósito, fragmentos influenciados y validación humana):
  Utilicé ChatGPT y OpenAI Codex como apoyo para interpretar la consigna, analizar la estructura del proyecto, revisar los requisitos de la actividad y organizar mi evidencia individual. La IA influyó en la organización y revisión de esta evidencia. Validé personalmente la información contra los archivos del proyecto y ejecuté personalmente `npm ci`, `npm run dev`, `npm test`, `npm run verify` y `npm run build` antes de registrar los resultados.

## Felipe Mora Lopez

- Estudiante: Felipe Mora Lopez
- Commit SHA evaluado: https://github.com/HilayGM/pwa-inspecciones
 SHA:5fe55626cafc56c06a6408c420131f465f3ec290


* **Contribución y enlace:**
  Implementé `src/components/app-shell.tsx` y actualicé `src/app/layout.tsx` para integrar la estructura compartida de la PWA: encabezado, navegación, contenido principal y pie de página.

* **Decisión que explica:** 
  Decidí delimitar estrictamente el alcance del problema para excluir características no solicitadas en esta etapa. Estructuré los escenarios de usuario asegurando que el caso de conectividad intermitente sea realista frente a las restricciones del sistema.

* **Comando o prueba ejecutada y resultado real:** 
  Ejecuté `npm run verify`. El resultado técnico fue exitoso (`pass`) y compiló correctamente, generando el archivo `reports/verification.json`.

* **Qué comprueba y qué no:** 
  El comando comprueba la estructura básica de los archivos, ejecuta la prueba proporcionada y valida que el proyecto compile. No comprueba la calidad, coherencia ni el análisis de los documentos redactados, ni certifica la ausencia de secretos o credenciales en el código.

* **Limitación:** 
  Una limitación de esta verificación es que un *build* verde no garantiza que los escenarios planteados resuelvan el problema real de los usuarios; la calidad de esa lógica depende de nuestra revisión manual.

* **Uso de IA:** 
  Se utilizó inteligencia artificial (Claude) como asistente de redacción para dar formato y revisar la claridad de la documentación, verificando humanamente que el contenido se ajuste íntegramente a los lineamientos y rúbrica de la actividad.

### Incremento: registro del Service Worker

- **Commit de mi contribución:** `ebf07ee` en la rama `felipe`.
- **Contribución concreta:** Implementé el registro seguro de `/sw.js` en el navegador mediante `src/lib/pwa/register-service-worker.ts`, un componente cliente sin interfaz visible en `src/components/service-worker-registration.tsx` y su integración en el layout global. También documenté la instalación, la prueba offline, la limpieza de caché y los límites conocidos.
- **Decisión técnica que puedo explicar:** Separé el registro en un módulo que comprueba el entorno del navegador y la disponibilidad de `navigator.serviceWorker`. El componente usa `useEffect` con dependencias vacías para iniciar el registro una sola vez al montarse, captura errores sin interrumpir la aplicación y no renderiza contenido visible.
- **Pruebas realizadas y resultado:** `npm run build`, `npm test` y `npm run verify` fueron reportados por Felipe como exitosos en su rama. La comprobación manual en DevTools y la prueba offline deben validarse nuevamente en el commit de integración antes de fusionar a `main`.
- **Límites de la función:** El registro no implementa sincronización en segundo plano, persistencia de datos ni garantiza que todas las rutas funcionen sin conexión. La cobertura offline depende de la estrategia de caché de `public/sw.js` y de un navegador compatible.
- **Uso de IA:** Utilicé GitHub Copilot para interpretar la consigna, proponer la estructura del registro del Service Worker y revisar la documentación. La IA influyó en `src/lib/pwa/register-service-worker.ts`, `src/components/service-worker-registration.tsx`, `src/app/layout.tsx`, `README.md` y esta sección de evidencia. Revisé y adapté el código al proyecto.

