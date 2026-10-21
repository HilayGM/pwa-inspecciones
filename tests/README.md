# Contrato de pruebas

Este directorio contiene las suites de pruebas automatizadas organizadas bajo la pirámide de pruebas:

- `tests/unit/`: Pruebas unitarias de funciones puras, algoritmos de retroceso exponencial, resolución de conflictos y adaptadores de hardware sintéticos con mocks (`sync-logic.spec.ts` y `device-adapters.spec.ts`). Ejecutable con `npm run test:unit`.
- `tests/integration/`: Pruebas de integración entre la cola de sincronización, almacenamiento IndexedDB y endpoints API (asignado a Felipe).
- `tests/e2e/`: Pruebas de extremo a extremo del flujo crítico del inspector PWA (asignado a Oscar).

Todas las pruebas son deterministas, utilizan datos 100% sintéticos y no dependen de periféricos físicos ni servicios externos.

