# PWA Inspecciones de Laboratorio — Universidad Tecnológica de Tehuacán

Aplicación Web Progresiva (PWA) offline-first para el registro, consulta y control de inspecciones físicas y técnicas en los laboratorios de la Universidad Tecnológica de Tehuacán.

## Semana 09: Modelo de Amenazas, Privacidad y Controles de Seguridad

En esta etapa se implementaron esquemas de seguridad técnica, minimización y confidencialidad en apego a los lineamientos para sujetos obligados mexicanos (LGPDPPSO):
- **Saneamiento estricto contra XSS:** Neutralización de inyecciones de código HTML, `<script>`, `<style>`, `<iframe>`, eventos en línea y protocolos `javascript:`.
- **Validación defensiva de datos:** Control estricto de identificadores (mitigación de Path Traversal), fechas de calendario reales y estados canónicos.
- **Content Security Policy (CSP):** Restricción de fuentes permitidas (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`) y cabeceras anti-clickjacking y anti-sniffing.
- **Salvaguarda de secretos:** Detección automática para evitar fuga de claves privadas o credenciales al frontend.
- **Políticas de rastreo (Robots.txt):** Bloqueo a motores de búsqueda sobre `/api/` e `/inspecciones/` para garantizar la privacidad institucional.

---

## Estructura de Artefactos de Seguridad

- `docs/threat-model.md`: Modelo de amenazas formal bajo metodología STRIDE.
- `docs/privacy-data-inventory.md`: Inventario de datos tratados bajo el marco jurídico de la LGPDPPSO para sujeto obligado.
- `src/lib/security/`: Módulo de funciones puras de seguridad (validación, cabeceras CSP, detector de secretos).
- `public/robots.txt`: Directivas de rastreo restrictivas.
- `tests/security.spec.ts`: Suite de pruebas automatizadas de seguridad.
- `evidence/individual.md`: Registro de evidencia técnica individual.

---

## Instalación y Configuración

Requisitos: Node.js 20+ o 22, npm.

```bash
# Instalación limpia reproducible
npm ci

# Compilación de producción
npm run build

# Iniciar servidor local
npm run start
```

---

## Verificación y Ejecución de Pruebas

```bash
# Pruebas automatizadas de controles de seguridad (Semana 09)
npm run test:security

# Suite completa de pruebas acumuladas
npm test

# Verificación de starter y artefactos
npm run verify
```

Ejecuta `bash public-tests/check.sh` desde el repositorio de entrega y conserva el commit SHA junto con el reporte de CI.
