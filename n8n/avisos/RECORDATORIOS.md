# Recordatorio de cita — preparado, no activado

Consulta la agenda de mañana una vez al día, a las 10:00 de America/Mexico_City. Es un aviso el día anterior; no garantiza exactamente 24 horas de anticipación. Usa citas reales, omite canceladas y valida fecha, ID y teléfono. El correo se vuelve a consultar en el expediente antes de enviar; no se toma de la solicitud.

Para activar: actualizar los nodos Validar aviso y Preparar correo del subflujo existente con workflow.json, preservando su credencial Gmail. Publicar ese subflujo. Importar recordatorios-workflow.json como workflow nuevo y publicarlo. No reemplazar el Core ni importar workflow.json como un segundo servicio de avisos.

El registro de aviso usa tipo, ID de cita y fecha de inicio para permitir un nuevo aviso si la cita cambia de horario. La tabla compartida evita reintentos secuenciales, pero no ofrece exclusión atómica de llamadas simultáneas. Una reserva preparando con error requiere revisión manual; no reintentar sin revisar Gmail.

Una cita agendada después de las 10:00 del día anterior no queda cubierta por esa consulta. Las citas sin teléfono válido o expediente con correo inválido no se envían. El flujo no crea citas, no confirma pagos y no manda mensajes por WhatsApp. La activación y la prueba en n8n siguen pendientes; las pruebas locales no demuestran envío real.
