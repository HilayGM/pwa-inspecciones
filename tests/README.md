# Contrato de pruebas

Las pruebas se organizan por nivel y usan exclusivamente datos sinteticos:

- `tests/unit/`: logica pura y adaptadores de dispositivos con APIs de navegador simuladas. Ejecutar con `npm run test:unit`.
- `tests/integration/`: contrato del handler API de inspecciones. `npm run test:integration` tambien incluye `tests/sync.spec.ts`, que valida la integracion entre la cola y IndexedDB sintetica.
- `tests/e2e/critical-path.spec.ts`: dashboard, listado, detalle sintetico y shell offline del dashboard con Playwright. La suite tambien conserva `tests/offline.spec.ts`.

El listado CSR necesita `/api/inspecciones`; el Service Worker no cachea esa API. La prueba offline verifica unicamente el comportamiento garantizado: el shell del dashboard despues de una primera visita online.
