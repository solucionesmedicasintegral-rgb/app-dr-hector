# Estado de reagendación en la app del paciente

Publicado el 27 de octubre de 2026. La app consulta `validar_reagendacion` sin `nueva_fecha` ni `nueva_hora`, usando paciente_id, cita_id y starts_at de la cita listada. El Core revisa reagendaciones_hector y devuelve reagendacion_usada. La rama sin nueva fecha responde sin modificar Nimbo ni escribir registros. Se comprobó con una consulta sintética de solo lectura.

Mis citas muestra 1 de 1 y retira el botón de reagendar cuando el servidor indica que se utilizó el cambio. Con estado false muestra 0 de 1 y conserva la regla de 48 horas. Si falla la consulta no supone que esté disponible. La validación del servidor sigue siendo la autoridad al confirmar un cambio. Se evita repetir consultas en la misma sesión: un estado usado permanece en caché, uno no usado dura 30 segundos. No se almacena el historial en el dispositivo entre sesiones.

## Pago: estado revisado

La cita se crea en Nimbo antes de elegir una forma de pago. Elegir transferencia o solicitar liga deja el pago pendiente. El administrador valida el pago recibido. Se aclararon estos estados en el texto de la app. El Core revisado no contiene un paso de cancelación automática ni liberación de horario por vencimiento del pago. No se activó ninguna nueva política de vencimiento ni se canceló o movió ninguna cita real en esta revisión. Los recordatorios de asistencia siguen manuales, según RECORDATORIOS.md.
