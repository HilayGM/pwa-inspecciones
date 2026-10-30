---
name: pwa-evaluacion
description: Implementa, integra y revisa una PWA de código para cumplir una evaluación técnica basada en instalación/build, entregables, pruebas automatizadas y evidencia de ingeniería.
---

# PWA para evaluación técnica

Usa esta habilidad cuando debas crear, completar o auditar una PWA que será calificada con una rúbrica técnica. Conserva los requisitos explícitos de la asignación por encima de cualquier convención de este documento. No declares un criterio como aprobado sin evidencia verificable en el repositorio o en la salida de los comandos.

## Objetivo de entrega

Entrega una PWA instalable y construible desde cero, con los artefactos solicitados, una implementación coherente del comportamiento crítico, pruebas automatizadas que lo cubran y un reporte de ingeniería breve. Trabaja primero sobre el requisito funcional y luego refuerza integración, calidad y evidencia.

## Interpretar la asignación

- Extrae primero los entregables, criterios de aceptación (`AC-*`) y checks de la semana vigente desde `agents/activity.md`, `ASSIGNMENT.md`, `evaluation.json` y `public-tests/check.sh`.
- Extrae los requisitos como una lista comprobable: comportamiento, pantallas, datos, persistencia, PWA/offline, seguridad/privacidad, integraciones, artefactos y formato de entrega.
- Distingue entre lo obligatorio, lo opcional y lo que falta precisar. No inventes funcionalidades para compensar una consigna ambigua.
- Define el comportamiento crítico: la ruta de usuario, control transversal o regla de negocio cuyo fallo haría que el producto no cumpla su finalidad en la semana evaluada. Úsalo para priorizar implementación y pruebas.
- Aplica el principio **«artefacto implementado ≠ control aplicado»**: no basta con que un módulo o configuración exista y tenga pruebas unitarias aisladas; debe estar conectado al flujo real de la aplicación (`next.config.mjs`, rutas API, páginas o proceso de verificación) y contar con evidencia de integración.
- Mantén una matriz requisito → archivo/artefacto → conexión en runtime → prueba/evidencia. Actualízala mientras trabajas.

## Implementación e integración

- Respeta la arquitectura y herramientas ya presentes. Agrega dependencias solo cuando reduzcan complejidad o sean necesarias para cumplir la consigna (y respeta las reglas de bloqueo como no alterar `package-lock.json` o `.github/workflows/` si el proyecto lo prohíbe).
- Separa componentes de interfaz, lógica de dominio, acceso a datos, controles de seguridad y adaptadores externos. La lógica crítica debe poder probarse sin navegador, red ni almacenamiento real cuando sea posible, además de verificarse integrada.
- Trata estados de carga, error, vacío y éxito de los flujos visibles. Valida entradas en las fronteras del sistema (rutas dinámicas, handlers de API, formularios) y evita que fallas de red o datos inválidos dejen la interfaz bloqueada.
- Para base PWA (cuando la asignación lo requiera o como verificación de no regresión), comprueba `manifest`, iconos/rutas válidas, registro del service worker y la estrategia de caché acorde al producto. No prometas funcionamiento offline ni controles de seguridad que no estén conectados y probados.
- Conserva compatibilidad con la configuración de build existente. No expongas secretos ni PII (como matrículas completas sin enmascarar) en código cliente, archivos de ejemplo, evidencias ni reportes.
- Antes de integrar cambios, revisa nombres, límites de responsabilidad, manejo de errores, accesibilidad básica (etiquetas, foco, contraste razonable) y ausencia de código muerto o duplicado relevante.

## Verificaciones específicas por dominio de semana (según aplique)

- **Seguridad y privacidad:** verifica que las cabeceras HTTP/CSP estén conectadas en `next.config.mjs` y/o respuestas de API; que la validación y saneamiento se invoquen en rutas y páginas reales; que `robots.txt` cubra tanto rutas con barra como sin barra; que se evalúe el comportamiento frente a `public-tests/check.sh`; y que los datos sean 100% sintéticos y sin PII expuesta.
- **Sincronización, persistencia e idempotencia:** verifica claves de idempotencia conservadas entre reintentos, resolución determinista de conflictos, manejo de respuestas perdidas post-commit y limpieza de estados.
- **Capacidades de dispositivo y offline:** verifica solicitud de permisos solo bajo interacción explícita, liberación de recursos (como tracks de cámara), minimización de precisión geográfica y exclusión de `/api/` en caché del Service Worker.

## Rúbrica de 8 puntos

### 1. Instalación limpia y build — 2 puntos

Verifica en un entorno limpio o equivalente:

1. Instalar dependencias usando el gestor y archivo de bloqueo del repositorio (`npm ci`).
2. Ejecutar el build de producción (`npm run build`).
3. Ejecutar el comando de verificación (`make verify` y documentar su equivalente exacto `npm run verify`) y el comando de arranque si aplica.
4. Corregir advertencias que revelen rutas faltantes, variables obligatorias sin documentar o fallos de registro PWA.

Documenta los comandos exactos, versiones relevantes y resultado. Si la validación no puede ser limpia de verdad, indícalo como limitación y describe qué se aisló.

### 2. Implementación y artefactos obligatorios — 3 puntos

Para cada requisito, aporta evidencia directa: archivo, componente, configuración, captura o salida de prueba. Comprueba especialmente:

- La funcionalidad o control principal está conectado a la aplicación real, completa el flujo esperado y conserva el estado necesario.
- Los artefactos pedidos existen con nombres, rutas y formatos correctos, y están incluidos en la verificación automática (`scripts/verify.mjs` si aplica).
- El manifest, service worker y recursos PWA no contienen rutas rotas.
- La interfaz o API permite realizar la tarea sin depender de datos o acciones manuales ocultas.

No sustituyas un artefacto solicitado por una descripción en el reporte. Si una parte no se logró, señálala claramente y explica el impacto.

### 3. Pruebas automatizadas del comportamiento crítico — 2 puntos

- Escribe pruebas deterministas del flujo o regla crítica, incluyendo el caso exitoso, la integración real del control (por ejemplo, cabeceras en respuestas o rechazo de entradas maliciosas en rutas) y al menos un límite o error relevante.
- Prefiere pruebas de unidad para reglas y pruebas de integración/interfaz para la experiencia de usuario y fronteras del sistema. Simula red, tiempo y almacenamiento cuando esa dependencia no sea el objeto de la prueba.
- Verifica resultados observables: datos persistidos, cabeceras devueltas, estado mostrado, navegación, llamadas a adaptadores o códigos/mensajes de error. No bases las pruebas solo en detalles internos de implementación o regex tautológicas.
- Ejecuta la suite completa y `public-tests/check.sh` (o documenta el equivalente/limitación de plataforma), registrando el comando, número de pruebas y resultado.

### 4. Reporte de ingeniería, trade-offs y evidencia individual — 1 punto

Incluye un archivo como `docs/reporte-ingenieria.md` y/o las secciones correspondientes en `README.md` y `evidence/individual.md` según el formato solicitado con:

1. Alcance implementado y cómo ejecutar y verificar el proyecto (`make verify` ↔ `npm run verify`).
2. Arquitectura breve y decisiones técnicas relevantes.
3. Trade-offs: alternativas consideradas, elección y coste aceptado.
4. Evidencia: comandos de instalación, build y tests; rutas de artefactos; capturas o resultados si aplican.
5. Trabajo individual: cambios, decisiones o módulos atribuibles a cada integrante, con matrículas enmascaradas para proteger PII.
6. Limitaciones conocidas y pasos concretos para resolverlas.

El reporte debe reflejar el estado real del repositorio, no una lista de intenciones ni controles desconectados.

## Revisión final

Antes de entregar, recorre esta lista:

- [ ] La instalación usa un lockfile coherente y no depende de archivos locales no versionados.
- [ ] El build de producción y `make verify` / `npm run verify` terminan correctamente.
- [ ] La PWA tiene manifest, service worker y recursos referenciados válidos.
- [ ] Cada artefacto obligatorio está presente, verificado y conectado en runtime cuando corresponde.
- [ ] El flujo o control crítico funciona en la aplicación real y cuenta con pruebas automatizadas unitarias y de integración ejecutadas.
- [ ] Se ejecutó o verificó `public-tests/check.sh` y se documentó su resultado.
- [ ] Los errores previsibles tienen una respuesta comprensible y segura para la persona usuaria.
- [ ] No hay código muerto, secretos, datos personales innecesarios (PII/matrículas sin enmascarar) ni dependencias sin justificación.
- [ ] El reporte y la evidencia individual contienen comandos, resultados reales, trade-offs y límites honestos.

## Forma de comunicar el resultado

Resume el estado por criterio de la rúbrica con «aprobado», «parcial» o «pendiente», enlaza la evidencia concreta y no asignes puntos finales salvo que la persona evaluadora haya definido cómo interpretar la calidad. Para estados parciales, explica con precisión qué impide el cumplimiento y el siguiente cambio mínimo.
