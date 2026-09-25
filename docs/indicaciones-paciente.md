# Mis indicaciones médicas: contrato para Core

Estado: interfaz preparada en `feat/documentos-paciente`. **No publicar ni fusionar** antes de que Core implemente las acciones siguientes y se pruebe la autorización.

## Datos que puede mostrar la app

Solo órdenes de laboratorio e imágenes, procedimientos y medicamentos que el consultorio haya terminado y autorizado para compartir. Excluir borradores, diagnósticos, notas clínicas completas y resultados aún sin revisión. En cada consulta, identificar por fecha y mostrar las indicaciones del médico sin reinterpretarlas.

La documentación pública de Nimbo incluye `GET /consultations?page=1&per_page=3&person_id=...` y `GET /consultations/{consultation_id}/consultation_prescription_drugs`. Su documentación organiza órdenes de laboratorio y procedimientos dentro de Consultations. Confirmar los endpoints y los campos concretos de esas dos categorías con una cuenta de pruebas antes de conectarlos.

## Acceso

El acceso actual de la app localiza un expediente con solo un teléfono. **No utilizar esa búsqueda como autorización para mostrar documentos clínicos**. El código debe enviarse exclusivamente al correo registrado y verificado en el expediente de Nimbo; el navegador no puede elegir el destino. El backend debe limitar frecuencia y reintentos, caducar el código, almacenar únicamente un hash y emitir un token temporal ligado al ID del paciente. No registrar códigos, tokens ni contenidos clínicos en logs o ejecuciones de n8n. Cuando el correo no exista o no pueda verificarse, derivar al consultorio sin revelar documentos.

El token no se guarda en `localStorage` ni en la URL; se pierde al cerrar o recargar la pestaña. Cada solicitud de documentos debe validar su firma, vencimiento y paciente asociado. El frontend no envía un ID de paciente en la consulta documental para evitar que pueda seleccionarse otro expediente.

## Acciones de Core propuestas

| Acción | Solicitud | Respuesta mínima |
| --- | --- | --- |
| `solicitar_acceso_indicaciones` | `{paciente_id}` | `{ok:true}` tras enviar un código de 6 dígitos al correo del expediente |
| `verificar_acceso_indicaciones` | `{paciente_id,codigo}` | `{ok:true,token:"...",expires_in:900}` (segundos) |
| `mis_indicaciones` | `{token}` | `{ok:true,consultas:[...]}`; el servidor deduce el paciente del token |

Forma normalizada de cada consulta:

```json
{
  "id": "id de la consulta de Nimbo",
  "fecha": "25 de septiembre de 2026",
  "estudios": [{"nombre":"Estudio solicitado","indicaciones":"Indicaciones del médico"}],
  "procedimientos": [{"nombre":"Procedimiento indicado","indicaciones":"Indicaciones del médico"}],
  "medicamentos": [{"nombre":"Medicamento indicado","indicaciones":"Dosis, frecuencia y duración indicadas por el médico"}]
}
```

El backend debe comprobar que cada consulta pertenece al paciente autenticado. Las tres listas pueden estar vacías. No incluir datos de otros pacientes, datos administrativos o URLs de documentos sin autorización. Si en Nimbo no existe una señal confiable de que una indicación está finalizada y compartida, almacenar en Core una autorización explícita del consultorio por consulta/elemento antes de devolverla.

## Verificación antes de publicar

1. Código válido recupera solo las indicaciones compartidas del expediente correspondiente.
2. Teléfono o ID de otra persona, código incorrecto, repetido o vencido, y token de otro expediente no devuelven documentos.
3. Una consulta sin indicaciones compartidas muestra el estado vacío sin mostrar notas del expediente.
4. Comprobar en Nimbo los campos reales para órdenes y procedimientos, y el mecanismo de publicación del consultorio.
