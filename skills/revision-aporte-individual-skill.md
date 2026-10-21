---
name: revision-aporte-individual
description: Evalúa la parte de una asignación implementada por un integrante de equipo, usando su matrícula, alcance asignado y evidencia del repositorio para explicar si está limpia, ordenada, integrable y completa.
---

# Revisión individual de actividades

Usa esta habilidad cuando una persona quiera comprobar que su parte de una actividad de equipo está bien implementada antes de entregarla. Está pensada para un equipo de tres integrantes y para el integrante número 2, pero puede adaptarse si la asignación define otros roles. Evalúa solo el alcance proporcionado; no atribuyas fallas ajenas a la persona revisada sin evidencia.

## Datos requeridos

Solicita los siguientes datos antes de evaluar. Si alguno falta, pide únicamente el dato faltante.

```text
Matrícula del integrante: [escribe tu matrícula]
Integrante: 1 de 3

Parte asignada (pega aquí la consigna, historia de usuario, módulos, archivos o criterios de aceptación):
[pega aquí tu asignación]

Evidencia disponible (opcional, pero recomendada):
- Ruta o enlace del repositorio:
- Archivos que modificaste:
- Comandos de prueba/build ejecutados y resultado:
- Capturas, PR o commits relacionados:
```

No expongas la matrícula en registros públicos, capturas ni archivos de código. Úsala solo para identificar la revisión individual y muéstrala parcialmente en el resultado cuando sea necesario, por ejemplo `A01***89`.

## Método de revisión

1. Convierte la parte asignada en criterios comprobables. Separa comportamiento, archivos/artefactos, pruebas, integración y documentación.
2. Inspecciona los archivos y cambios relevantes. Relaciona cada hallazgo con el criterio que cumple o incumple.
3. Ejecuta verificaciones existentes que afecten ese alcance, como lint, typecheck, pruebas y build. No modifiques el código salvo que la persona pida una corrección.
4. Distingue con claridad entre evidencia observada, inferencias y aspectos que no pudieron verificarse.
5. Prioriza problemas por impacto: bloqueante, importante, mejora recomendada o observación.

## Criterios de calidad

Evalúa según la asignación y aplica estos criterios solo cuando correspondan:

- **Completitud:** cubre todos los criterios de aceptación y artefactos asignados; no depende de pasos manuales ocultos.
- **Claridad y orden:** nombres comprensibles, archivos en lugares previsibles, responsabilidades separadas y cambios acotados al alcance.
- **Mantenibilidad:** evita duplicación significativa, valores mágicos injustificados, componentes demasiado grandes y acoplamiento innecesario.
- **Integración:** respeta contratos, tipos, rutas, configuración y convenciones del proyecto; no rompe flujos de otros integrantes.
- **Robustez:** valida entradas relevantes y trata estados de error, carga, vacío o límites que afecten el comportamiento asignado.
- **Pruebas:** existen pruebas automatizadas del comportamiento crítico de su parte, se ejecutan correctamente y prueban resultados visibles.
- **Documentación y entrega:** las instrucciones, variables, decisiones o artefactos requeridos están actualizados y permiten a otra persona continuar el trabajo.

No penalices decisiones de estilo que ya sean consistentes con el proyecto, ni exijas cobertura universal si no forma parte de la asignación. No asumas que la ausencia de un test significa que la funcionalidad falla: indícalo como falta de evidencia.

## Formato de resultado

Devuelve un informe breve y accionable con este formato:

```markdown
# Revisión individual — Integrante 2 de 3

Matrícula: [enmascarada]
Estado general: Aprobado / Aprobado con ajustes / Pendiente

## Resumen
[Dos o tres frases sobre el grado de cumplimiento.] 

## Matriz de la asignación
| Criterio asignado | Evidencia revisada | Estado | Motivo |
|---|---|---|---|
| ... | archivo, prueba o comando | Cumple / Parcial / No verificable / No cumple | explicación concreta |

## Hallazgos
- **Bloqueante / Importante / Mejora / Observación:** [qué ocurre, dónde aparece, por qué importa y cambio mínimo recomendado].

## Verificaciones ejecutadas
- `[comando]` — correcto / falló / no disponible; [resultado relevante].

## Siguiente paso recomendado
[La acción más pequeña que aumente la confianza en la entrega.]
```

Incluye rutas y resultados concretos cuando existan. Para cada estado “Parcial” o “No cumple”, explica por qué con evidencia y propone una corrección delimitada. Para “No verificable”, di exactamente qué archivo, acceso, comando o dato sería necesario para confirmarlo.

## Condición de cierre

Considera la parte individual lista solo cuando cada criterio obligatorio de la asignación tenga evidencia de cumplimiento, las verificaciones relevantes hayan pasado y no queden hallazgos bloqueantes. Si no se puede confirmar una condición, informa el estado como “Pendiente” o “No verificable”; no simules certeza.
