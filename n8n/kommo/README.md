# Citas nuevas de la app → Kommo

Estado publicado el 27 de octubre de 2026.

- Cuenta: solucionesmedicasintegral.kommo.com.
- Pipeline Héctor: Embudo de ventas Carrick, 8678943.
- Destino al agendar: Confirmacion de cita y PREPAGO, 68204659.
- Campo de fecha y hora: Próxima cita, 1989801 (date_time, Unix seconds).
- FECHA DE CITA, 68313487, conserva su operación existente de un día antes; este flujo no adelanta las citas a esa etapa.

## Flujo activo

El Core sRNzQ0Ic9pxnOWeh ya llama al servicio de avisos euohdVVLQiwNYJm6 después de responder a una creación de cita confirmada en Nimbo. En el servicio de avisos, Buscar expediente ahora bifurca primero hacia Preparar cita app para Kommo → Sincronizar cita app en Kommo (asíncrono, 9wVU33pS2dcqovc6), y mantiene su rama de correos. La integración de CRM no depende de tener un email válido. La identidad se obtiene del expediente que corresponde al paciente_id, nunca de un nombre arbitrario enviado por el navegador.

El subflujo solo procesa cita_agendada. No vuelve a crear un lead al confirmar un pago. Los correos de cita, pago, solicitud de liga y transferencia mantienen sus destinatarios y credencial Gmail. La solicitud de liga sigue en smedicahrfacturacion@gmail.com.

## Contactos y duplicados

Se compara el teléfono exacto (últimos 10 dígitos). Si hay varios contactos, se requiere una coincidencia única por nombre; de lo contrario se detiene para revisión manual. No se renombra un contacto existente. Si una madre y una hija comparten teléfono, no se reasigna el lead de otra persona.

Cada cita se identifica en el nombre del lead por [APPHC<ID_NIMBO>]. Se busca ese marcador antes de crear. Si existe, se actualiza el mismo lead sin retroceder su etapa. Un lead ganado o perdido no se reabre. Cuando no hay vínculo de cita previo, se puede reutilizar un único lead abierto de Héctor del contacto correcto, siempre que no tenga ya otra cita futura. Varias coincidencias requieren revisión manual. El campo Próxima cita recibe la fecha real de Nimbo.

La búsqueda y creación no constituyen una transacción atómica entre dos sistemas. Las llamadas simultáneas o los errores de red durante una creación requieren revisar Kommo antes de repetir manualmente. No reejecutar la creación de Nimbo para reintentar CRM.

## Bot y pago

Se conserva el bot existente de la etapa. No se llama a /bots/run, no se crea otro bot y no se cambia el temporizador de 72 horas que indicó el usuario. Así se evita un segundo lanzamiento deliberado en paralelo a la automatización del pipeline. Los bots de Héctor activos se consultaron mediante la API; se encontró H.C. Confirmaciones 2.0 (65693), entre otros. El disparador interno de la etapa y la entrega de un mensaje real no se verificaron desde la interfaz de Kommo.

No hay cancelaciones de Nimbo, liberación de horarios, cobros automáticos ni recordatorios de cancelación nuevos. La paciente mantiene el aviso de pago pendiente en la app y el consultorio valida los pagos desde el admin. El usuario pidió conservar los espacios mientras evalúa la respuesta al seguimiento.

## Validación y límites

La prueba manual del subflujo recorrió la consulta real de contactos y la rama dry_run, con datos ficticios. Resultado: ok=true, escrituras_kommo=0, envios_bot=0, pipeline_id=8678943, status_id=68204659. Las comprobaciones locales cubren coincidencia de teléfono, reutilización de lead, repetición del mismo evento, conservación de etapas avanzadas/cerradas, teléfonos familiares, coincidencias ambiguas, IDs devueltos y mapeo de expediente.

No se crearon citas, contactos ni leads reales de prueba. Falta observar la primera cita nueva de la app para comprobar la escritura real y el disparo del bot configurado. No se hace carga retroactiva de citas anteriores. La actualización de Kommo por una reagendación posterior no forma parte de este enlace inicial.

## Restauración

sync-citas-app.json contiene el subflujo importable sin credenciales y logic.cjs la lógica de validación. Seleccionar la credencial OAuth2 de Kommo ya existente en los nodos HTTP antes de publicar. El flujo canónico de avisos, con el adaptador, está en ../avisos/workflow.json; seleccionar su credencial Gmail existente al restaurarlo y conservar los IDs de tablas y destinos de los subflujos. No importar el servicio de avisos como un segundo emisor de correos.

La prueba dry_run es una rama manual aislada; nunca crea contactos, leads ni lanza bots. No publicar o añadir una URL pública para activar esa prueba. El flujo solo admite llamadas de workflows del mismo propietario. No incluir los respaldos privados de trabajo en el repositorio.

## Ampliación: presupuesto y motivo

Publicada el 27 de octubre de 2026. El Core envía el motivo y encounter_type_id que devolvió Nimbo al crear la cita. Validar aviso y el adaptador conservan ambos valores. El subflujo lee services.js vigente, lo interpreta como JSON sin ejecutar JavaScript y exige coincidencia única por motivo y encounter_type_id. El presupuesto nativo price recibe promo ?? regular. No se usa el precio cero que Nimbo devuelve por defecto ni un monto arbitrario del navegador. Un servicio no reconocido se detiene para revisión y no inventa un precio.

Campos del lead: Motivo de consulta 1992485 (texto), Fecha de cita app 1992487 (date_time visible), Próxima cita 1989801 (API). Todos reciben el motivo y horario guardados en Nimbo. El dato visible permite revisar la cita desde la tarjeta.

Se verificó en la interfaz que H.C. Confirmaciones 2.0 se ejecuta al entrar a la etapa y evalúa Contacto: Tipo de consulta; sus plantillas leen Contacto: Fecha de cita. El subflujo prepara los campos de contacto 724110 y 1988336 ANTES de mover el lead. Solo actualiza un contacto existente si su nombre coincide con el del expediente; en teléfonos familiares de otro nombre conserva sus campos. Para contactos nuevos incluye los campos al crearlos. Se vuelve a leer el contacto para conservar correctamente sus vínculos de leads después de un PATCH.

Las consultas básicas/Plus, embarazo y balance se mapean a los valores que ya reconoce el bot. La consulta virtual conserva su nombre real; no se inventa una categoría del bot. No se modificaron los pasos, plantillas, pausas ni canales del Salesbot. La interfaz mostró que el bot de un día antes depende de Contacto: Fecha de cita. La pausa interna de 72 horas y las ramas no visibles del bot no se verificaron completamente; no se garantiza la entrega de un mensaje hasta observar una ejecución real. Los contactos familiares cuyo nombre no coincide requieren revisión manual del recordatorio.

Validación: una ejecución dry_run con catálogo real devolvió presupuesto 900 y motivo consulta virtual subsecuente, sin escrituras ni envíos. Comprobaciones locales cubrieron los cinco precios vigentes (900/1200/900/1199/1800), motivo, fecha visible, campos del contacto, protección de teléfonos compartidos y cuerpo PATCH. No se envió ningún mensaje real de prueba ni se disparó un bot manualmente.
