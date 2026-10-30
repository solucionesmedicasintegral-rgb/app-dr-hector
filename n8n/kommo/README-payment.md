# Seguimiento de pagos de citas app

Publicado el 30 de octubre de 2026. Pipeline 8678943.

- Nuevas citas: etapa 113484504, Citas app · Pago pendiente.
- Pago confirmado desde admin: etapa 113484604, Citas app · Pago validado. Nunca se valida por respuesta de WhatsApp.
- Salesbot H.C. App · Seguimiento de pago 48 h: cuando se crea o mueve a pendiente, después de 48 horas. Sin aplicación retroactiva a todos los leads.
- Plantilla Meta aprobada hc_app_seguimiento_pago_48h, template_id 67621, cuenta Héctor 527774480424269.
- Botones Ya pagué, Quiero la cuenta, Quiero liga crean tareas inmediatas al responsable para revisión o envío manual.
- Kommo requiere un contacto con canal de chat disponible; un teléfono sin conversación/canal vinculado no garantiza envío.
- Sin cancelación automática ni liberación de espacios. Admisión gestiona recordatorios de asistencia.
- Se conservan presupuesto, fecha y motivo de consulta. Pago se enlaza por marcador exacto APPHC y no crea leads ni retrocede etapas avanzadas.

Verificación: lógica local y ejecución de solo lectura sin escrituras en CRM; configuración del bot leída tras guardar y disparador confirmado después de recargar; ambos workflows n8n muestran Published. No se enviaron pruebas a pacientes ni se ha observado aún la entrega real tras 48 horas.
