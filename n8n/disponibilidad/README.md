# Bloqueos de agenda de la app Héctor

Corrección publicada el 28 de octubre de 2026 en Core sRNzQ0Ic9pxnOWeh.

Causa comprobada: la disponibilidad combinaba un token de autenticación Nimbo con eventos de Google Calendar, sin consultar consultation_schedules de Nimbo. Para el 3 de noviembre, Nimbo devolvió un registro schedule_type=blocked entre 17:00 y 20:00; Google tenía una copia de 17:00 a 18:00. Por ello la API anterior ofrecía 18:00 y 19:00.

Cambios: Semanas de agenda Nimbo genera las semanas que cubren el horizonte de 180 días. Nimbo Agenda Disponibilidad consulta account_id 1356 con la autenticación existente y combina las agendas semanales con Google. Se conservan los horarios y duraciones existentes y se excluyen registros eliminados/cancelados. No se usan nombres de eventos para determinar ocupación: se comparan sus intervalos reales.

Antes de crear o reagendar se vuelve a consultar la semana de Nimbo y el intervalo de Google. Una superposición detiene el flujo antes del POST/PATCH; un error al leer una agenda también detiene la escritura. Al reagendar se omite la cita original y su evento de Google cuando su ID está disponible. El control no constituye un bloqueo transaccional entre dos reservas simultáneas.

Verificación: comprobaciones locales de intervalo completo y de rechazo de creación/reagendación, sin llamadas de escritura. Consulta real consultar_disponibilidad, presencial 60 min: ok=true, total_ocupados_detectados=396, total_disponibles=90 y horarios del 3 de noviembre=[], en 9.3 s. No se crearon citas, ni se enviaron correos ni mensajes de prueba. La consulta incluye las semanas dentro del horizonte; el volumen puede aumentar la latencia de disponibilidad. No se ejecutó una creación/reagendación real para probar el rechazo.

La exclusión temporal codificada solo en el cliente se retiró tras verificar Core. La agenda central vuelve a ser la fuente de ocupación; una paciente con una pantalla antigua también pasa por la nueva comprobación del servidor al guardar.

Restauración: los scripts process-availability.js y guard-crear.js/guard-reagendar.js son fuentes seguras. build-calendar-fix.py aplica la transformación a un export privado vigente nombrado core-oct28-private.json en su directorio de trabajo; revisar la ruta local antes de usar. El archivo completo de Core no se publica en el repositorio porque contiene configuración privada. Se preservaron todos los nodos originales salvo el código del procesador de disponibilidad, y se agregaron ocho nodos. Las conexiones se actualizaron para incluir las lecturas y comprobaciones. Mantener las credenciales actuales de Nimbo y Google.

Pendiente separado: la etapa exclusiva de citas app, bot de seguimiento a 48 horas, confirmación de pago desde admin y plantilla Meta aún no se completaron. Se priorizó este incidente de bloqueos por solicitud del usuario. Admisión envía el recordatorio de asistencia; no añadir cancelación automática ni liberación de horarios.
