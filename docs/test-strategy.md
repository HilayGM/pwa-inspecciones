# Estrategia de Pruebas y Aseguramiento de Calidad (Semana 08)

## 1. Propósito y Contexto de Ingeniería

El objetivo de esta estrategia es garantizar la confiabilidad, determinismo y mantenibilidad de la Progressive Web App (PWA) de **Inspecciones de Mantenimiento de Laboratorios** en condiciones de conectividad intermitente o nula (offline-first).

Para asegurar que la entrega sea robusta y evaluable bajo criterios objetivos de integración continua (CI), se implementa una **pirámide de pruebas automatizadas**, una política estricta de **datos sintéticos** y el diagnóstico formal de un **caso de fallo corregido**.

---

## 2. Pirámide de Pruebas y Justificación de Trade-offs

La arquitectura de pruebas se distribuye conforme a la pirámide de testing clásica, equilibrando velocidad de retroalimentación, costo de mantenimiento y confianza funcional:

```
          / \
         /   \
        / E2E \       10%  (Playwright: flujo crítico del inspector, navegación offline)
       /-------\
      / Integr. \     20%  (IndexedDB + Queue, API sintética, Push/Notificaciones)
     /-----------\
    /  Unitarias  \   70%  (Funciones puras, cálculo de backoff, políticas de conflicto, mocks)
   /---------------\
```

### 2.1. Nivel Unitario (`tests/unit/`)
- **Alcance:**
  - Lógica pura de cálculo de retardo exponencial y límites máximos (`calculateRetryDelay` en `src/lib/sync/queue.ts`).
  - Matriz de resolución determinista de conflictos (`resolveSyncConflict` en `src/lib/sync/conflict-policy.ts`).
  - Adaptadores sintéticos de hardware (`camera.ts` y `geolocation.ts` en `src/lib/device/`) mediante emulación de APIs de navegador en memoria.
- **Trade-offs:**
  - *Ventaja:* Ejecución ultra-rápida (< 1 segundo), cero dependencias de I/O o red, y cobertura exhaustiva de casos de borde y entradas anómalas.
  - *Límite asumido:* No evalúa la persistencia física en disco ni la renderización visual en pantalla.

### 2.2. Nivel de Integración (`tests/integration/`)
- **Alcance:**
  - Transacciones atómicas de almacenamiento local (`inspections`, `sync_queue`, `sync_receipts`) usando el motor en memoria `fake-indexeddb`.
  - Contratos de la API REST sintética `/api/inspecciones` y validación de cabeceras (`Cache-Control: no-store`).
  - Flujo de solicitud y emisión de notificaciones con fallback ante fallas del Service Worker.
- **Trade-offs:**
  - *Ventaja:* Valida la interoperabilidad entre módulos asíncronos y almacenes de datos.
  - *Límite asumido:* Requiere estructuras de inicialización y limpieza de base de datos entre cada caso de prueba para evitar contaminación de estado.

### 2.3. Nivel E2E (`tests/e2e/`)
- **Alcance:**
  - Flujo crítico del inspector universitario: carga inicial, navegación del listado de laboratorios, filtrado de estados ("ok", "warning", "danger"), consulta del detalle y verificación de estados offline en el navegador.
- **Trade-offs:**
  - *Ventaja:* Máxima confianza en la experiencia final del usuario sobre la aplicación compilada de Next.js.
  - *Límite asumido:* Mayor costo computacional y tiempo de ejecución; se acota al critical path para no sobrecargar el pipeline de CI.

---

## 3. Declaración de Determinismo y Datos Sintéticos

Para cumplir con las políticas académicas y de seguridad:

1. **Datos 100% Sintéticos:**
   - Todas las inspecciones, identificadores de laboratorio (ej. *"Laboratorio sintético"*, *"Edificio B"*), nombres de inspectores y fechas son generados proceduralmente o declarados estáticamente en `src/lib/data/inspections.ts`.
   - Queda estrictamente prohibido el uso de nombres reales de estudiantes, docentes, identificadores de red interna o información de identificación personal (PII).
2. **Determinismo Temporal y de Entorno:**
   - Las pruebas no utilizan llamadas a `setTimeout` arbitrarias ni `sleep` que introduzcan condiciones de carrera (*flakiness*).
   - Los retardos de reintento (`calculateRetryDelay`) se validan matemáticamente como funciones puras.
   - Las coordenadas geográficas se normalizan y truncan a 3 decimales (`roundCoordinate`), garantizando tanto la privacidad del inspector como la reproducibilidad exacta en cualquier entorno de ejecución sin GPS real.
3. **Aislamiento de Hardware:**
   - La cámara y la geolocalización utilizan dobles de prueba (*mocks*) que reproducen fielmente los contratos de la W3C (`MediaStream`, `GeolocationPosition`, `GeolocationPositionError`), sin requerir periféricos físicos ni permisos del sistema operativo.

---

## 4. Diagnóstico y Reporte de Caso de Fallo Corregido

### 4.1. Descripción de la Regresión Diagnosticada
- **Módulo Afectado:** `src/lib/sync/queue.ts` (`calculateRetryDelay`).
- **Problema:** En versiones tempranas de la implementación de sincronización offline, el cálculo de retroceso exponencial (`baseDelayMs * 2 ** (attempts - 1)`) no validaba adecuadamente si el argumento `attempts` recibía valores flotantes, números negativos o el valor `0`. Además, si se incrementaban indefinidamente los intentos, una falta de acotación estricta permitía que el retardo creciera hasta valores astronómicos (`2^50 ms`), desbordando la ventana temporal razonable del cliente PWA.

### 4.2. Hipótesis y Caso de Prueba de Reproducción
- Se formuló la hipótesis de que invocar `calculateRetryDelay(0)` o `calculateRetryDelay(7)` con los valores predeterminados debía, respectivamente, rechazar la entrada con una excepción explícita y limitar el tiempo a `DEFAULT_RETRY_MAX_MS` (60,000 ms).
- **Prueba Unitaria de Control (en `tests/unit/sync-logic.spec.ts`):**
  ```typescript
  it("respeta estrictamente el tope máximo predeterminado (60000 ms) en intentos avanzados", () => {
    assert.equal(calculateRetryDelay(7), DEFAULT_RETRY_MAX_MS);
    assert.equal(calculateRetryDelay(50), DEFAULT_RETRY_MAX_MS);
  });

  it("lanza un error descriptivo si attempts no es un entero mayor o igual a 1", () => {
    assert.throws(() => calculateRetryDelay(0), /attempts debe ser un entero mayor o igual que 1/);
  });
  ```

### 4.3. Corrección y Verificación
- **Corrección en `src/lib/sync/queue.ts`:**
  ```typescript
  export function calculateRetryDelay(
    attempts: number,
    baseDelayMs = DEFAULT_RETRY_BASE_MS,
    maximumDelayMs = DEFAULT_RETRY_MAX_MS,
  ): number {
    if (!Number.isInteger(attempts) || attempts < 1) {
      throw new Error("attempts debe ser un entero mayor o igual que 1.");
    }
    if (baseDelayMs < 1 || maximumDelayMs < baseDelayMs) {
      throw new Error("La configuración de reintentos no es válida.");
    }
    return Math.min(baseDelayMs * 2 ** (attempts - 1), maximumDelayMs);
  }
  ```
- **Resultado:** La suite `npm run test:unit` aprueba el 100% de los casos (28 de 28 pruebas unitarias), garantizando la estabilidad del algoritmo ante condiciones extremas de desincronización de red.

---

## 5. Matriz de Comandos de Verificación Local

| Nivel | Comando | Tiempo Estimado | Objetivo |
| :--- | :--- | :---: | :--- |
| **Unitarias** | `npm run test:unit` | < 1 s | Validar matemática de backoff, resolución de conflictos y adaptadores mockeados. |
| **Sincronización** | `npm run test:sync` | ~2 s | Transacciones en IndexedDB y cola de reintentos. |
| **Capacidades** | `npm run test:capabilities`| ~1 s | Contratos de hardware simulado (cámara, geo, notificaciones). |
| **Verificación Global** | `npm test` | ~1 s | Integridad estructural del starter y manifest PWA. |
| **Compilación** | `npm run build` | ~5 s | Compilación de producción en Next.js sin errores de tipos ni lint. |
| **Script Evaluador** | `npm run verify` | < 1 s | Comprobación de artefactos y generación de reporte JSON. |
