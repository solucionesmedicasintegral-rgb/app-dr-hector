# Avisos por correo del Dr. Héctor

Estado al 30 de septiembre de 2026: flujo creado y guardado en n8n como **BORRADOR**, ID `euohdVVLQiwNYJm6`. Aún no está conectado a las operaciones de la app. No se realizaron envíos ni ejecuciones de prueba en n8n.

El flujo recibe una llamada interna, valida la cita, consulta el registro de avisos, obtiene el correo actual del expediente mediante el Core y comprueba el ID del paciente antes de preparar el mensaje. La credencial Gmail existente fue seleccionada desde n8n; el archivo exportable no contiene credenciales.

Eventos admitidos: `cita_agendada` y `pago_confirmado`. El pago confirmado requiere un monto positivo. Entrada: `tipo`, `paciente_id`, `cita_id`, `telefono`, `starts_at` (ISO con zona horaria), `modalidad` y `monto` cuando corresponda. Los mensajes muestran fecha y hora de México, modalidad y monto confirmado; no contienen recetas ni información clínica.

Registro: tabla `avisos_correo_hector`, ID `uDJQotRBLCPJVZnB`. La clave lógica es `tipo:cita_id`. Se registra `preparando` antes del envío y `enviado` después. Una ejecución posterior con esa clave se detiene. Si Gmail falla, la reserva requiere revisión manual antes de reintentar; una reserva no significa que el correo haya sido enviado. La tabla no establece una restricción única ni un bloqueo atómico, por lo que este control no garantiza exclusión de llamadas simultáneas.

La interfaz de n8n confirmó los campos de la reserva y la condición Equals. Se configuró el flujo para no guardar datos de ejecuciones exitosas, fallidas ni manuales. Solo puede ser llamado por flujos del mismo propietario.

## Para terminar la integración

- Añadir el teléfono del paciente al payload de creación de cita de la app; hoy el payload no lo incluye.
- Llamar al flujo después de que Nimbo confirme la creación y devuelva el ID real y `starts_at` de la cita. No enviar desde el intento previo.
- Llamarlo para `pago_confirmado` solo después de persistir `estado_pago=pagado`, con cita, paciente, teléfono, fecha y monto verificados. Los estados de liga o transferencia pendiente no equivalen a pago confirmado.
- Evitar que un fallo de aviso cambie la respuesta de una cita o pago ya guardados. No reejecutar la operación original para reintentar un correo.
- Hacer una única prueba acordada con el expediente del propietario, verificar remitente y registro, y habilitar la integración.

Pendientes distintos: recordatorio de cita 24 horas antes, aviso de pago pendiente, enlace de consulta virtual y seguimiento anual de ginecología. Este flujo no implementa esos recordatorios.

La validación local con datos sintéticos comprobó destinatario e ID coincidentes, fecha y hora de México, rechazo de paciente diferente, monto de pago inválido y fecha sin zona horaria. No comprueba la entrega real de Gmail ni sustituye la prueba de integración pendiente.
