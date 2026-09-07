# Evidencia individual — completar antes de entregar

- Nombre: Martin Moreno Libreros
- Repositorio y commit evaluado:  https://github.com/HilayGM/pwa-inspecciones-Moreno-Libreros-Martin  
commit: 78d6e89eaa6a618ee8792fa878a62f64628862e7

- Mi contribución concreta: Analicé el problema de inspecciones de mantenimiento, definí usuarios y escenarios, redacté requisitos verificables, comparé cuatro estrategias de aplicación y documenté la selección de una PWA. También comprobé la reproducibilidad del starter y preparé la evidencia de la Semana 1.

- Decisión técnica que puedo explicar: Elegí una PWA porque permite mantener una sola base de código, distribuir la aplicación mediante una URL y agregar capacidades offline progresivamente. Reconozco que tiene limitaciones de navegador y que la sincronización todavía no está implementada.

- Comando o prueba que ejecuté y resultado:
 Ejecuté `npm.cmd test` y el resultado fue: starter.spec.mjs: PASS.
  Ejecuté `npm.cmd run verify` y el resultado fue: Starter verificable: PASS.
  Ejecuté `npm.cmd run build` y el resultado fue:    Creating an optimized production build ...
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data    
 ✓ Generating static pages (4/4)
 ✓ Collecting build traces    
 ✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    138 B          87.4 kB
└ ○ /_not-found                          873 B          88.1 kB
+ First Load JS shared by all            87.2 kB
  ├ chunks/117-e5476d4bdcce692a.js       31.7 kB
  ├ chunks/fd9d1056-749e5812300142af.js  53.6 kB
  └ other shared chunks (total)          1.86 kB


○  (Static)  prerendered as static content.

- Limitación o riesgo que encontré:
La operación offline y la sincronización todavía no están implementadas. Cuando se incorporen, será necesario evitar pérdida de información, duplicados y conflictos después de recuperar la conexión.

- Uso de IA (herramienta, propósito, fragmentos influenciados y validación humana): Utilicé OpenAI Codex para interpretar la consigna, organizar los requisitos y revisar la comparación de alternativas. Influyó en la estructura y redacción inicial de `docs/requirements.md`, `docs/decision-record.md` y `evidence/individual.md`. Revisé el contenido contra la consigna, adapté las decisiones al proyecto y validaré personalmente los resultados mediante los comandos de prueba y compilación.

## Oscar Martinez Martinez

- Estudiante: Oscar Martinez Martinez
- Commit SHA evaluado:https://github.com/HilayGM/pwa-inspecciones-Moreno-Libreros-Martin
 SHA:78d6e89eaa6a618ee8792fa878a62f64628862e7

- Mi contribución concreta:
  Revisé la entrega de la Semana 1 contra la consigna y la rúbrica, comprobé la estructura del proyecto y revisé los requisitos y la decisión técnica. También comprobé personalmente la reproducibilidad del starter en Windows mediante la instalación de dependencias, ejecución de la aplicación, pruebas, verificación y compilación.

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
- Commit SHA evaluado:https://github.com/HilayGM/pwa-inspecciones-Moreno-Libreros-Martin
 SHA:78d6e89eaa6a618ee8792fa878a62f64628862e7


* **Contribución y enlace:** 
  Me enfoqué en la actualización de la definición del problema, contexto y límites del proyecto para nuestros entregables, documentándolo en `docs/requirements.md`. 

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