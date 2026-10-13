# Plan de tratamiento en Mis indicaciones médicas

Integración del 13 de octubre de 2026. Fuente documentada por Nimbo: GET /api/v1/medical_notes?consultation_id=ID&note_type=treatment_plan&page=1&per_page=3.

Se comprobó una lectura del expediente propio de prueba: medical_notes devuelve person_id, consultation_id, account_id, note_type, comment, created_at y deleted_at; la muestra pertenece al paciente y al Dr. Héctor (1356), tiene tipo treatment_plan y texto guardado. No se copiaron datos clínicos a GitHub.

El lector ObsGiUirsdoFgktP conserva las recetas finalizadas y agrega planes guardados no eliminados, filtrados por paciente, consulta y médico. El dato fijado de prueba se retiró antes de publicar. La respuesta pública c65pPMsqXI3pscXz conserva la validación de sesión por OTP y agrega el campo planes a su lista de campos permitidos. La app escapa el texto y lo muestra en una sección propia; las etiquetas de formato del plan se convierten a texto conservando saltos de línea.

Lectura bajo demanda al abrir o actualizar indicaciones, sin programación periódica. El recurso actual lee la primera página de hasta tres planes por cada consulta recuperada por el lector existente; no representa una exportación completa del historial. Si se requieren más planes por consulta, implementar paginación validada.

Verificación: una lectura Nimbo del expediente de prueba; pruebas locales de aislamiento por paciente/médico/tipo, registros eliminados, duplicados y escape del texto en el frontend. Falta la comprobación visual del paciente con OTP en su celular.
