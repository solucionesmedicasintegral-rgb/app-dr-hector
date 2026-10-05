# Avisos por correo del Dr. Héctor

## Solicitud de liga y elección de transferencia — 2 de octubre de 2026

Destino autorizado para ambos avisos: `smedicahr@gmail.com`. La solicitud de liga avisa al consultorio para que envíe la liga. La elección de transferencia avisa que la paciente eligió ese método y que el pago sigue pendiente. Ninguno acredita un pago ni incluye datos clínicos.

**Estado de liga y transferencia:** el usuario publicó los cambios en n8n y confirmó el 2 de octubre que recibió un aviso. La captura mostró la conexión `Responder Elección Pago Paciente` → `Preparar aviso elección pago` → `Avisar elección pago a SMI`. No se repite el envío. La confirmación de recepción no especificó cuál de los dos métodos probó.

**Nuevo cambio preparado el 5 de octubre:** `recordatorio_cita` y `recordatorios-workflow.json`, pendientes de activar en n8n. Ver RECORDATORIOS.md. Los archivos de código contienen esa ampliación; no demuestran que el recordatorio esté publicado.

Para restaurar la integración de liga y transferencia: actualizar `Validar aviso` y `Preparar correo` del subflujo existente con el código de `workflow.json`, publicar el subflujo, importar los dos nodos de `liga-core-nodos.json` en el Core y conectar `Responder Elección Pago Paciente` a `Preparar aviso elección pago`. Publicar el Core. Los adaptadores requieren que la fila guardada coincida con cita y estado solicitado (`pendiente_liga` o `pendiente_transferencia`); no notifican un pago confirmado. Usan claves separadas `liga_solicitada:cita_id` y `transferencia_elegida:cita_id`. No importar nuevamente los otros cuatro nodos que ya están publicados.

La revisión local con datos sintéticos comprueba ambos destinatarios fijos, ausencia de correo de paciente, estado pendiente, escape HTML, coincidencia de expediente y conservación de los avisos de cita/pago. La revisión local no demuestra publicación ni entrega de correo.

Estado al 30 de septiembre de 2026: flujo **PUBLICADO**, ID `euohdVVLQiwNYJm6`, conectado al Core `sRNzQ0Ic9pxnOWeh` después de `Responder Crear Cita` y `Responder Estado Pago`. El Core también fue publicado. La app incluye teléfono al agendar y el admin incluye modalidad al confirmar el pago.

La prueba manual controlada `K1ftpLBMJCijyODe` ejecutó los dos tipos de aviso con el expediente autorizado del propietario y datos ficticios. Ambos correos fueron marcados `[PRUEBA]`; Gmail aceptó los envíos y la tabla registró ambos como `enviado`. Un segundo intento con las mismas claves terminó sin nuevos envíos. No se creó una cita ni se registró un pago real. Esto comprueba el envío mediante el subflujo; no verifica la llegada a la bandeja del destinatario ni constituye una reserva o transacción completa de prueba desde la app.

El flujo recibe una llamada interna, valida la cita, consulta el registro de avisos, obtiene el correo actual del expediente mediante el Core y comprueba el ID del paciente antes de preparar el mensaje. La credencial Gmail existente fue seleccionada desde n8n; el archivo exportable no contiene credenciales.

Eventos admitidos: `cita_agendada` y `pago_confirmado`. El pago confirmado requiere un monto positivo. Entrada: `tipo`, `paciente_id`, `cita_id`, `telefono`, `starts_at` (ISO con zona horaria), `modalidad` y `monto` cuando corresponda. Los mensajes muestran fecha y hora de México, modalidad y monto confirmado; no contienen recetas ni información clínica.

Registro: tabla `avisos_correo_hector`, ID `uDJQotRBLCPJVZnB`. La clave lógica es `tipo:cita_id`. Se registra `preparando` antes del envío y `enviado` después. Una ejecución posterior con esa clave se detiene. Si Gmail falla, la reserva requiere revisión manual antes de reintentar; una reserva no significa que el correo haya sido enviado. La tabla no establece una restricción única ni un bloqueo atómico, por lo que este control no garantiza exclusión de llamadas simultáneas.

La interfaz de n8n confirmó los campos de la reserva y la condición Equals. Se configuró el flujo para no guardar datos de ejecuciones exitosas, fallidas ni manuales. Solo puede ser llamado por flujos del mismo propietario.

## Integración publicada

`integracion-core-nodos.json` contiene los cuatro nodos publicados y los dos nuevos nodos pendientes de conectar. Conectar `Responder Crear Cita` a `Preparar aviso cita` y `Responder Estado Pago` a `Preparar aviso pago`. Los adaptadores usan los resultados confirmados y la petición original. El pago requiere que la fila guardada coincida con cita y estado `pagado`, además de monto positivo y fecha válida. Los avisos se lanzan sin esperar al subflujo y con continuación ante error, después de responder a la app.

No reejecutar la creación de cita ni la confirmación de pago para reintentar un correo. Revisar manualmente las reservas que queden en `preparando`. El control de duplicados evita el reintento secuencial comprobado; no es un bloqueo atómico para llamadas simultáneas.

El archivo importable omite credenciales y está inactivo por defecto. Para restaurarlo, seleccionar la credencial Gmail del Dr. Héctor desde n8n y comprobar los IDs de tabla y subflujo antes de publicar. La marca `prueba` solo llega por llamadas internas y cambia asunto y contenido para no aparentar una cita o cobro reales.

Pendientes distintos: recordatorio de cita 24 horas antes, aviso de pago pendiente, enlace de consulta virtual y seguimiento anual de ginecología. Este flujo no implementa esos recordatorios.

La validación local con datos sintéticos comprobó destinatario e ID coincidentes, fecha y hora de México, rechazo de paciente diferente, monto de pago inválido y fecha sin zona horaria. La prueba manual de n8n comprobó además la aceptación de dos envíos por Gmail y el bloqueo del reintento secuencial.
