# Inventario de Datos y Privacidad — Sujeto Obligado Mexicano

## 1. Marco Jurídico y Principios de Tratamiento
Como institución educativa pública dependiente del Estado (Sujeto Obligado en términos de la **Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados - LGPDPPSO**), el desarrollo de la PWA de Inspecciones de Laboratorio se rige bajo los principios de:
1. **Licitud:** El tratamiento responde exclusivamente al mantenimiento operativo de laboratorios institucionales.
2. **Finalidad:** Los datos recopilados sirven únicamente para registrar el estado de infraestructura física y tecnológica.
3. **Lealtad y Transparencia:** No se recopila información en segundo plano ni mediante mecanismos engañosos.
4. **Minimización de Datos (Mínimo Privilegio):** No se recaban datos personales sensibles ni información identificable de usuarios finales.

---

## 2. Inventario de Datos Tratados en la Aplicación

| Activo de Datos | Clasificación | Propósito / Finalidad | Almacenamiento y Ciclo de Vida | Control de Seguridad Aplicado |
|---|---|---|---|---|
| **ID de Inspección** | Dato Operativo Interno | Llave primaria para el seguimiento del reporte. | IndexedDB local / Memoria runtime. Formato `inspection-XXX`. | Validación por regex alfanumérica; rechazo de secuencias de path traversal. |
| **Ubicación del Laboratorio** | Dato Público Institucional | Identificar el espacio universitario físico inspeccionado. | Almacenado localmente y transmitido al endpoint `/api/inspecciones`. | Sanitización de texto plano (máx. 120 caracteres); sin geocodificación externa. |
| **Identificador del Inspector** | Dato Seudónimo / Sintético | Trazabilidad del rol técnico que realizó la comprobación. | Datos sintéticos fijados (e.g., "Técnica A", "Técnico B"). | Sin nombres reales ni cédulas personales; saneamiento contra inyecciones XSS. |
| **Fecha de Inspección** | Registro Temporal | Temporalidad de la revisión. | Formato ISO 8601 (YYYY-MM-DD). | Validación estricta de días calendario reales y rangos temporales lógicos. |
| **Resumen y Hallazgos** | Diagnóstico Técnico | Describir el estado de cableado, ventilación y cómputo. | Persistencia local en caché; sincronización idempotente. | Saneamiento HTML estricto que elimina scripts, iframes y etiquetas de estilo. |
| **Coordenadas Geográficas (Demostración)** | Dato Sensible Potencial | Verificación de proximidad en inspecciones en sitio. | **No persistido.** Se conserva únicamente en memoria volátil de la pantalla. | Precisión baja forzada (`enableHighAccuracy: false`), redondeo a tres decimales (~110 metros) y solicitud explícita no continua. |
| **Flujo de Video de Cámara (Demostración)** | Dato Biométrico Potencial | Inspección visual de equipos de cómputo y cableado. | **No persistido.** Se presenta en un elemento `<video>` local sin captura de fotogramas ni subida a red. | Solo video (`audio: false`), liberación inmediata de todos los tracks al cerrar vista o desmontar componente. |

---

## 3. Políticas de Exposición y Rastreabilidad
- **Bloqueo a Motores de Búsqueda:** El archivo `public/robots.txt` desautoriza la indexación de las rutas `/api/` y `/inspecciones/`, evitando la recopilación masiva por motores de búsqueda públicos.
- **Ausencia de PII (Personally Identifiable Information):** El proyecto opera exclusivamente con datasets sintéticos autorizados.
- **Cero Secretos en Cliente:** No se almacenan contraseñas, claves privadas ni credenciales de servicio en el código de producción ni en variables `NEXT_PUBLIC_*`.
