# Modelo de Amenazas — PWA Inspecciones de Laboratorio

## 1. Contexto y Objetivos del Sistema
La Progressive Web App (PWA) de Inspecciones de Laboratorio para la Universidad Tecnológica de Tehuacán permite a los técnicos registrar, consultar y sincronizar el estado físico, eléctrico y de infraestructura de los laboratorios universitarios. Opera bajo un modelo *offline-first* con datos sintéticos, minimizando la retención y exposición de datos.

## 2. Metodología de Modelado
Se adopta la metodología **STRIDE** (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) para evaluar componentes, flujos de datos y superficies de ataque.

---

## 3. Identificación de Activos
1. **Registros de inspección:** Identificador, laboratorio, fecha, estatus, hallazgos y resumen.
2. **Almacenamiento local (IndexedDB):** Cache de inspecciones y cola de mutaciones fuera de línea.
3. **Endpoint de sincronización (/api/inspecciones):** Canal de transporte de datos hacia el servidor.
4. **Metadatos y Shell PWA:** Service Worker (`sw.js`), manifiesto web y recursos estáticos.

---

## 4. Matriz de Amenazas y Controles STRIDE

| Categoría STRIDE | Amenaza Identificada | Impacto | Controles y Mitigaciones Implementados |
|---|---|---|---|
| **Spoofing (Suplantación)** | Suplantación de identidad de técnicos o reportes falsos. | Medio | Validación de formato estricto de identificadores (`validateInspectionId`), descarte de identificadores adulterados o con path traversal. |
| **Tampering (Manipulación)** | Inyección de código malicioso (Stored/DOM XSS) en campos de resumen o laboratorio; manipulación de datos en tránsito. | Alto | Saneamiento riguroso de entradas (`sanitizeText`, `escapeHtml`) que elimina scripts, estilos, iframes y handlers de eventos; transporte exclusivo por HTTPS; inmutabilidad en almacenamiento. |
| **Repudiation (Repudio)** | Modificación de registros sin trazabilidad ni historial de versión. | Bajo/Medio | Control de concurrencia optimista con versiones de servidor/local (`localVersion`, `serverVersion`) y recibos idempotentes en la cola de sincronización. |
| **Information Disclosure (Fuga de Información)** | Indexación pública de inspecciones o APIs por rastreadores web; filtración de claves privadas en frontend. | Alto | Directivas restrictivas en `public/robots.txt` (`Disallow: /api/`, `Disallow: /inspecciones/`); verificación y salvaguarda contra variables `NEXT_PUBLIC_*` sospechosas (`assertNoClientSecrets`). |
| **Denial of Service (Denegación de Servicio)** | Saturación de la cola de almacenamiento local o payloads desmesurados en formularios. | Medio | Validación de límites de caracteres (ubicación ≤ 120, resumen ≤ 1000, hallazgos ≤ 1000) y retroceso exponencial con tope máximo (60 s). |
| **Elevation of Privilege (Elevación de Privilegios)** | Clickjacking o inclusión maliciosa en iframes de terceros; inyección de scripts externos. | Alto | Cabeceras HTTP estrictas: `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`. |

---

## 5. Política de Content Security Policy (CSP)
La aplicación implementa una directiva CSP restrictiva definida en `src/lib/security/headers.ts`:
- `default-src 'self'`: Solo permite recursos del mismo origen.
- `object-src 'none'`: Deshabilita plugins Flash/Java.
- `frame-ancestors 'none'`: Impide que la PWA sea embebida en marcos externos.
- `base-uri 'self'`: Previene manipulación de la etiqueta base HTML.
- `Permissions-Policy`: Restringe el acceso a cámara y geolocalización exclusivamente al origen local bajo consentimiento explícito, inhabilitando micrófono y pagos.
