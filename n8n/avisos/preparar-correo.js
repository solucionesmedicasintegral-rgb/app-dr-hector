// Called only from the internal workflow after a fresh patient lookup.
function prepararCorreo(evento, result) {
  const p = result.encontrado === true ? result.paciente : null;
  const id = String(p?.id || p?.person_id || p?.patient_id || '');
  const email = String(p?.email || '').trim().toLowerCase();
  if (id !== evento.paciente_id || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('El expediente no tiene un correo verificable para este aviso');
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date = new Date(evento.starts_at);
  if (!Number.isFinite(date.getTime())) throw new Error('Fecha de cita inválida');
  const fecha = new Intl.DateTimeFormat('es-MX', {dateStyle:'full', timeZone:'America/Mexico_City'}).format(date);
  const hora = new Intl.DateTimeFormat('es-MX', {hour:'numeric',minute:'2-digit',timeZone:'America/Mexico_City'}).format(date);
  const pagado = evento.tipo === 'pago_confirmado';
  const asunto = pagado ? 'Pago confirmado · Dr. Héctor Carrillo' : 'Cita agendada · Dr. Héctor Carrillo';
  const titulo = pagado ? 'Recibimos tu pago' : 'Tu cita quedó agendada';
  const monto = pagado ? new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(evento.monto) : '';
  const texto = pagado ? `El consultorio confirmó tu pago por ${monto}.` : 'Registramos tu cita con el Dr. Héctor Carrillo. Puedes consultar el estado de tu pago en la app.';
  const html = `<div style="background:#f7f4ec;padding:24px;font-family:Arial,sans-serif;color:#272727"><div style="max-width:560px;margin:auto;background:white;border-radius:20px;overflow:hidden"><div style="background:#2d371d;color:white;padding:24px;font-size:21px;font-weight:bold">Dr. Héctor Carrillo</div><div style="padding:24px"><h1 style="font-size:24px">${titulo}</h1><p>${esc(texto)}</p><p><b>Fecha:</b> ${esc(fecha)}<br><b>Hora:</b> ${esc(hora)}<br><b>Modalidad:</b> ${evento.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}</p><a href="https://solucionesmedicasintegral-rgb.github.io/app-dr-hector/" style="display:inline-block;background:#2d371d;color:white;text-decoration:none;border-radius:12px;padding:14px 20px">Ver mi cita</a><p style="font-size:12px;color:#777;margin-top:24px">Si necesitas ayuda o algún dato no coincide, contacta al consultorio. Este correo no incluye tu receta ni información clínica.</p></div></div></div>`;
  return {...evento,email,asunto,html};
}
if (typeof module !== 'undefined') module.exports = prepararCorreo;
