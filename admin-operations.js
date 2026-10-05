// Operación del consultorio: consultas bajo demanda, sin refresco automático.
function normalizeAdminOrders(rows){
 return rows.map(o=>({...o,items:Array.isArray(o.items)?o.items:(()=>{try{return JSON.parse(o.items||'[]')}catch{return []}})()}));
}
function dashboardMetrics(){
 const orders=state.orders.filter(o=>!['cancelado','cancelada'].includes(o.estado_pedido));
 return {orders:orders.length,delivery:orders.filter(o=>o.estado_pedido!=='entregado').length,
  unpaid:orders.filter(o=>o.estado_pago!=='pagado').length,
  paid:orders.filter(o=>o.estado_pago==='pagado').reduce((sum,o)=>sum+(Number.isFinite(Number(o.total))?Number(o.total):0),0),
  appointments:(state.tomorrowAppointments||[]).filter(c=>isTomorrowMX(c.starts_at)).length};
}
async function loadDashboard(){
 if(state.loading)return;
 setLoading(true,'Actualizando el dashboard…');
 const results=await Promise.allSettled([
  core({action:'listar_pedidos',pin:state.pin}),core({action:'listar_citas_manana'})
 ]);
 state.dashboardErrors=[];
 const orders=results[0],appointments=results[1];
 if(orders.status==='fulfilled'&&orders.value?.ok===true&&Array.isArray(orders.value.pedidos)){
  state.orders=normalizeAdminOrders(orders.value.pedidos);state.ordersLoaded=true;
  state.ordersUpdatedAt=new Date().toISOString();
 }else state.dashboardErrors.push('No se pudieron actualizar los pedidos.');
 if(appointments.status==='fulfilled'&&appointments.value?.ok!==false&&Array.isArray(appointments.value?.citas)){
  state.tomorrowAppointments=appointments.value.citas.filter(c=>isTomorrowMX(c.starts_at));state.tomorrowLoaded=true;
  state.tomorrowUpdatedAt=new Date().toISOString();
 }else state.dashboardErrors.push('No se pudieron actualizar las citas de mañana.');
 state.loading=false;render();
}
function resumen(){
 const esc=escapeCatalogText,m=dashboardMetrics();
 const metrics=[['Pedidos registrados',state.ordersLoaded?m.orders:'—','pedidos'],['Por entregar',state.ordersLoaded?m.delivery:'—','pedidos'],['Pedidos por cobrar',state.ordersLoaded?m.unpaid:'—','pedidos'],['Citas de mañana',state.tomorrowLoaded?m.appointments:'—','citas']];
 const orders=[...state.orders].sort((a,b)=>String(b.createdAt||b.created_at||b.pedido_id||'').localeCompare(String(a.createdAt||a.created_at||a.pedido_id||''))).slice(0,8);
 return `<div class="space-y-4"><section class="flex flex-wrap justify-between gap-3 items-center"><div><h2 class="text-2xl font-semibold">Dashboard del consultorio</h2><p class="text-sm text-slate-500 mt-1">Pedidos, cobros, entregas y agenda de mañana.</p></div><button onclick="loadDashboard()" class="btn rounded-xl px-5 py-3">Actualizar dashboard</button></section>
 ${state.dashboardErrors?.length?`<div role="alert" class="border border-amber-200 bg-amber-50 rounded-2xl p-4 text-sm">${state.dashboardErrors.map(esc).join('<br>')} Se conserva la última información disponible.</div>`:''}
 <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${metrics.map(([label,value,view])=>`<button onclick="go('${view}')" class="card rounded-3xl p-5 text-left"><div class="text-sm text-slate-500">${label}</div><div class="text-3xl font-semibold mt-2">${value}</div></button>`).join('')}</div>
 <div class="grid sm:grid-cols-3 gap-3"><button onclick="go('citas')" class="btn rounded-2xl p-4 font-semibold">Agendar a una paciente</button><button onclick="go('pedidos')" class="card rounded-2xl p-4 font-semibold">Gestionar pedidos</button><button onclick="go('cotizaciones')" class="card rounded-2xl p-4 font-semibold">Nueva cotización</button></div>
 <section class="card rounded-3xl p-5"><div class="flex flex-wrap justify-between gap-2"><h3 class="font-semibold text-lg">Últimos pedidos</h3><span class="text-sm text-slate-500">Cobrado en pedidos: ${state.ordersLoaded?money(m.paid):'—'}</span></div><p class="text-xs text-slate-500 mt-1">${state.ordersUpdatedAt?'Pedidos actualizados: '+esc(formatDateTimeMX(state.ordersUpdatedAt).fecha)+' · '+esc(formatDateTimeMX(state.ordersUpdatedAt).hora):'Pulsa Actualizar dashboard para consultar los registros.'}</p>
 ${!state.ordersLoaded?'':!orders.length?'<p class="text-sm text-slate-500 mt-4">Todavía no hay pedidos registrados.</p>':`<div class="overflow-x-auto mt-4"><table class="w-full text-sm text-left"><thead><tr class="text-slate-500 border-b"><th class="p-3">Pedido / paciente</th><th class="p-3">Entrega</th><th class="p-3">Pago</th><th class="p-3 text-right">Total</th></tr></thead><tbody>${orders.map(o=>`<tr class="border-b"><td class="p-3"><b>${esc(o.pedido_id||'Pedido')}</b><div class="text-xs text-slate-500">${esc(o.paciente_nombre||'Paciente')}</div></td><td class="p-3">${esc(ORDER_LABELS[o.estado_pedido]||o.estado_pedido||'Por revisar')}</td><td class="p-3"><span class="badge ${o.estado_pago==='pagado'?'green':'goldbg'}">${o.estado_pago==='pagado'?'Pagado':'Pendiente'}</span></td><td class="p-3 text-right whitespace-nowrap">${money(o.total)}</td></tr>`).join('')}</tbody></table></div>`}</section>
 <section class="card rounded-3xl p-5"><div class="flex flex-wrap justify-between items-center gap-3"><div><h3 class="font-semibold text-lg">Agenda y confirmaciones de mañana</h3><p class="text-sm text-slate-500 mt-1">Citas registradas en Nimbo. Confirma asistencia por WhatsApp.</p></div><button onclick="loadTomorrowAppointments()" class="border rounded-xl px-4 py-2 text-sm">Actualizar agenda</button></div><div class="mt-4">${tomorrowCards()}</div></section></div>`;
}
function bankDetailsCard(){
 const b=C.bankTransfer||{},esc=escapeCatalogText;
 return `<section class="card rounded-3xl p-5"><h3 class="font-semibold text-lg">Datos para transferencia</h3><p class="text-sm text-slate-500 mt-1">Estos son los datos que ve la paciente al elegir transferencia.</p><dl class="grid sm:grid-cols-2 gap-4 mt-4"><div><dt class="text-xs text-slate-500">Banco y beneficiario</dt><dd class="font-medium">${esc(b.bank||'Por configurar')} · ${esc(b.holder||'')}</dd></div><div><dt class="text-xs text-slate-500">Cuenta</dt><dd>${esc(b.account||'—')}</dd></div><div><dt class="text-xs text-slate-500">CLABE</dt><dd class="break-all">${esc(b.clabe||'—')}</dd></div></dl><p class="text-xs text-slate-500 mt-4">Confirma la recepción del depósito antes de registrar el pago.</p></section>`;
}
function config(){
 return `<div class="space-y-4"><h2 class="text-2xl font-semibold">Consultorio</h2>${bankDetailsCard()}<section class="card rounded-3xl p-5"><h3 class="font-semibold text-lg">Avisos y atención</h3><p class="text-sm mt-3">Solicitudes de liga y elección de transferencia: <b>smedicahr@gmail.com</b>.</p><p class="text-sm mt-2">Citas de mañana: consulta y confirma asistencia desde el dashboard.</p><p class="text-sm mt-2">Recordatorio automático: pendiente de activación.</p></section></div>`;
}
function resetAdminBooking(){state.newBookingService='';state.newBookingSlots=[];state.newBookingDate='';state.newBookingSlot=-1;state.newBookingResult=null;}
async function loadAdminBookingSlots(code){
 resetAdminBooking();state.newBookingService=code;
 const service=S.find(s=>s.code===code&&s.bookable===true);
 if(!service){render();return;}
 const patientId=String(state.patient?.id||'');
 if(!patientId)return toast('Selecciona primero a la paciente');
 setLoading(true,'Consultando horarios disponibles…');
 try{
  const r=await core({action:'consultar_disponibilidad',modalidad:service.mode,duracion:service.duration});
  if(r?.ok===false||!Array.isArray(r?.horarios))throw Error('Disponibilidad inválida');
  if(patientId!==String(state.patient?.id||'')||state.newBookingService!==code)return;
  state.newBookingSlots=r.horarios.filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s.fecha||'')&&/^\d{2}:\d{2}$/.test(s.hora||''));
  state.newBookingDate=state.newBookingSlots[0]?.fecha||'';
  if(!state.newBookingSlots.length)toast('No hay horarios disponibles para este servicio');
 }catch{toast('No pude consultar disponibilidad');}
 finally{state.loading=false;render();}
}
function adminBookingPanel(){
 if(!state.patient?.id)return '';
 const esc=escapeCatalogText,s=S.find(s=>s.code===state.newBookingService);
 const dates=[...new Set((state.newBookingSlots||[]).map(x=>x.fecha))].sort();
 return `<section class="card rounded-3xl p-5"><h3 class="font-semibold text-lg">Agendar nueva cita</h3><p class="text-sm text-slate-500 mt-1">Se guardará en el expediente seleccionado de Nimbo y la paciente podrá consultarla en Mis citas.</p>
 ${state.newBookingResult?`<div role="status" class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-4"><b>Cita registrada en Nimbo</b><p class="text-sm mt-1">${esc(state.newBookingResult.service)} · ${esc(state.newBookingResult.fecha)} · ${esc(state.newBookingResult.hora)}</p><p class="text-xs mt-2">La paciente puede abrir Mis citas y actualizar. El pago queda pendiente de validación.</p></div>`:''}
 <label for="adminBookingService" class="block text-sm font-medium mt-4">Servicio</label><select id="adminBookingService" class="input mt-2" onchange="loadAdminBookingSlots(this.value)"><option value="">Selecciona el servicio</option>${S.filter(s=>s.bookable===true).map(s=>`<option value="${esc(s.code)}" ${s.code===state.newBookingService?'selected':''}>${esc(s.name)} · ${money(s.promo??s.regular)} · ${esc(s.mode)}</option>`).join('')}</select>
 ${s&&dates.length?`<div class="grid sm:grid-cols-2 gap-4 mt-4"><div><label for="adminBookingDate" class="text-sm font-medium">Fecha disponible</label><select id="adminBookingDate" class="input mt-2" onchange="state.newBookingDate=this.value;state.newBookingSlot=-1;render()">${dates.map(d=>`<option value="${d}" ${d===state.newBookingDate?'selected':''}>${d.split('-').reverse().join('/')}</option>`).join('')}</select></div><div><p class="text-sm font-medium">Horario disponible</p><div class="flex flex-wrap gap-2 mt-2">${state.newBookingSlots.map((x,i)=>x.fecha===state.newBookingDate?`<button onclick="state.newBookingSlot=${i};render()" aria-pressed="${state.newBookingSlot===i}" class="border rounded-xl px-4 py-3 ${state.newBookingSlot===i?'btn':''}">${esc(x.hora)}</button>`:'').join('')}</div></div></div><button onclick="createAdminAppointment()" ${state.newBookingSlot<0?'disabled':''} class="btn rounded-xl px-5 py-3 mt-4 font-semibold">Confirmar nueva cita</button>`:s?'<p class="text-sm text-slate-500 mt-4">No hay horarios disponibles por ahora.</p>':''}</section>`;
}
async function createAdminAppointment(){
 if(state.loading)return;
 const p=state.patient,s=S.find(s=>s.code===state.newBookingService&&s.bookable===true),slot=state.newBookingSlots[state.newBookingSlot];
 if(!p?.id||!s||!slot)return toast('Selecciona paciente, servicio y horario');
 const telefono=String(p.telefono||p.telephone2||p.telephone||'').replace(/\D/g,'').slice(-10);
 if(telefono.length!==10)return toast('El expediente necesita un teléfono de 10 dígitos para identificar a la paciente y enviar avisos');
 if(!confirm(`¿Agendar a ${p.nombre||p.first_name||'esta paciente'} el ${slot.fecha} a las ${slot.hora} para ${s.name}?`))return;
 setLoading(true,'Registrando la cita en Nimbo…');
 try{
  const r=await core({action:'crear_cita',pin:state.pin,paciente_id:String(p.id),telefono,fecha:slot.fecha,hora:slot.hora,duracion:s.duration,motivo_consulta:s.cause,encounter_type_id:s.encounterTypeId,modalidad:s.mode});
  if(r?.ok!==true||r?.creada!==true||!r.cita?.id)throw Error('No se confirmó la creación');
  state.newBookingResult={id:String(r.cita.id),service:s.name,fecha:slot.fecha,hora:slot.hora};
  state.appointmentsLoaded=false;state.newBookingSlots=[];state.newBookingSlot=-1;state.newBookingService='';
  state.loading=false;render();toast('Cita registrada. Ya está disponible en el expediente de la paciente');
  await loadAppointments();
 }catch{state.loading=false;render();toast('No pude confirmar la creación. Actualiza las citas antes de intentar nuevamente');}
}
