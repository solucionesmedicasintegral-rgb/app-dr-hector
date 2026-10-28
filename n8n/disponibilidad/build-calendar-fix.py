import json,copy,pathlib,uuid
p=pathlib.Path(__file__).resolve().parent;original=json.loads((p/'core-oct28-private.json').read_text());f=copy.deepcopy(original)
def named(name):return next(n for n in f['nodes'] if n['name']==name)
def link(a,b,index=0):f['connections'][a]={'main':[[{'node':b,'type':'main','index':index}]]}
def code(name,source,pos):return {'id':str(uuid.uuid4()),'name':name,'type':'n8n-nodes-base.code','typeVersion':2,'position':pos,'parameters':{'jsCode':source}}
weeks=code('Semanas de agenda Nimbo',"const today=$now.setZone('America/Mexico_City').startOf('day');const limit=today.plus({days:180});const rows=[];for(let d=today.startOf('week');d<=limit;d=d.plus({weeks:1})){rows.push({json:{start_from:d.toISODate(),end_from:d.plus({days:6}).toISODate()}});}return rows;",[-500,-200])
n=copy.deepcopy(named('Nimbo Listar Citas'));n['id']=str(uuid.uuid4());n['name']='Nimbo Agenda Disponibilidad';n['position']=[-250,-200]
for h in n['parameters']['headerParameters']['parameters']:
 if h['name']=='Authorization':h['value']="=Bearer {{ $('Nimbo Auth Disponibilidad').first().json.access_token }}"
f['nodes'] += [weeks,n];link('Nimbo Auth Disponibilidad',weeks['name']);link(weeks['name'],n['name']);link(n['name'],'Merge Nimbo + GCal')
processor=named('Procesar Disponibilidad APP');source=processor['parameters']['jsCode'];source=source.replace('    for (const s of ss) {',"    for (const s of ss) {\n      if(s.deleted_at||s.canceled===true||/cancel|deleted/i.test(String(s.status||'')))continue;")
source=source.replace('  // Google Calendar - evento de todo el día',"  if(j.status==='cancelled')continue;\n\n  // Google Calendar - evento de todo el día")
processor['parameters']['jsCode']=source;(p/'process-availability-oct28.js').write_text(source)
# Check both authoritative schedules and calendar again immediately before a write.
common="""function active(s){return !s.deleted_at&&s.canceled!==true&&!/cancel|deleted/i.test(String(s.status||''));}
function overlap(a,b,x,y){return a<y&&b>x;}
"""
for label,prepare,target,auth in [('crear','Preparar Cita Nimbo','Crear Cita Nimbo','Nimbo Auth Crear Cita'),('reagendar','Preparar Reagendación','Nimbo Reagendar Cita','Nimbo Auth Reagendar')]:
 check=copy.deepcopy(named('Nimbo Listar Citas'));check['id']=str(uuid.uuid4());check['name']='Nimbo comprobar horario '+label;check['position']=[0,300 if label=='crear' else 600]
 for h in check['parameters']['headerParameters']['parameters']:
  if h['name']=='Authorization':h['value']="=Bearer {{ $('"+auth+"').first().json.access_token }}"
 for q in check['parameters']['queryParameters']['parameters']:
  if q['name'] in ['start_from','end_from']:q['value']="={{ $('"+prepare+"').first().json.consultation_schedule.starts_at.slice(0,10) }}"
 cal=copy.deepcopy(named('GCal Eventos Doctor'));cal['id']=str(uuid.uuid4());cal['name']='GCal comprobar horario '+label;cal['position']=[250,300 if label=='crear' else 600];cal['alwaysOutputData']=True
 cal['parameters']['options']['timeMin']="={{ $('"+prepare+"').first().json.consultation_schedule.starts_at }}"
 cal['parameters']['options']['timeMax']="={{ $('"+prepare+"').first().json.consultation_schedule.ends_at }}"
 guard=common+"const payload=$('"+prepare+"').first().json;const c=payload.consultation_schedule;const a=Date.parse(c?.starts_at),b=Date.parse(c?.ends_at);if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw Error('Horario inválido');const r=$('"+check['name']+"').first().json;if(!Array.isArray(r.consultation_schedules))throw Error('No se pudo validar la agenda de Nimbo');for(const s of r.consultation_schedules){if(c.id&&String(s.id)===String(c.id))continue;if(active(s)&&overlap(a,b,Date.parse(s.starts_at),Date.parse(s.ends_at)))throw Error('Horario ocupado o bloqueado en Nimbo');}for(const item of $input.all()){const e=item.json;if(e.status==='cancelled')continue;const start=e.start?.dateTime||(e.start?.date?e.start.date+'T00:00:00-06:00':null),end=e.end?.dateTime||(e.end?.date?e.end.date+'T00:00:00-06:00':null);if(start&&end&&overlap(a,b,Date.parse(start),Date.parse(end)))throw Error('Horario ocupado o bloqueado en Calendar');}return [{json:payload}];"
 # For rebooking the existing calendar event can overlap a nearby new time. Ignore only its exact calendar id if present.
 if label=='reagendar':guard=guard.replace("if(e.status==='cancelled')continue;", "if(e.status==='cancelled'||(c.metadata?.google_calendar_id&&e.id===c.metadata.google_calendar_id))continue;")
 gate=code('Validar horario antes de '+label,guard,[500,300 if label=='crear' else 600]);f['nodes'] += [check,cal,gate];link(prepare,check['name']);link(check['name'],cal['name']);link(cal['name'],gate['name']);link(gate['name'],target)
 (p/('guard-'+label+'-oct28.js')).write_text(guard)
f.pop('pinData',None);(p/'core-calendar-fix-private.json').write_text(json.dumps(f,ensure_ascii=False,indent=2));
# Restrict public source to safe standalone code; full Core contains inline auth data.
print('Prepared',len(f['nodes']),'nodes; original nodes preserved:',all(next(n for n in f['nodes'] if n['id']==o['id'])==o for o in original['nodes'] if o['name']!='Procesar Disponibilidad APP'))
