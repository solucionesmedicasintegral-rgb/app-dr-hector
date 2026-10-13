const patientId=String($('Validar paciente de sesión').first().json.paciente_id);
const own='/api/v1/people/'+patientId;
const consultations=$('HTTP Request').first().json.consultations;
const metas=$('Seleccionar recetas propias recientes').all().map(x=>x.json);
const grouped=new Map(),seen=new Set();
function textPlan(value){
 return value.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|div|li)>/gi,'\n').replace(/<\/?[a-z][^>]*>/gi,'')
 .replace(/&(amp|lt|gt|quot|apos|nbsp);/g,(_,x)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[x])
 .replace(/&#(x[0-9a-f]+|\d+);/gi,(_,x)=>{const n=x[0].toLowerCase()==='x'?parseInt(x.slice(1),16):Number(x);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';}).trim();
}
for(const [i,item] of $input.all().entries()){
 const m=metas[i];if(!m)throw new Error('Recurso sin consulta');
 const c=consultations.find(c=>String(c.id)===m.consulta_id&&c.links?.person===own);
 if(!c)throw new Error('Consulta ajena');
 const plan=m.tipo==='treatment_plan';
 if(!plan&&m.tipo!=='prescriptions')continue;
 const rows=plan?item.json.medical_notes:item.json.prescriptions;
 if(!Array.isArray(rows))throw new Error('Respuesta clínica inválida');
 for(const p of rows){
  if(String(p.consultation_id)!==String(c.id)||String(p.account_id)!=='1356'||!/^\d+$/.test(String(p.id)))continue;
  const key=m.tipo+':'+p.id;if(seen.has(key))continue;
  let text,date;
  if(plan){
   if(String(p.person_id)!==patientId||p.note_type!=='treatment_plan'||p.deleted_at!=null||typeof p.comment!=='string')continue;
   text=textPlan(p.comment);date=p.created_at;
  }else{
   text=p.medical_instructions;date=p.finished_at;
   if(typeof text!=='string'||typeof date!=='string')continue;
  }
  if(typeof date!=='string'||!Number.isFinite(Date.parse(date))||!text.trim())continue;
  seen.add(key);const id=String(c.id);
  if(!grouped.has(id))grouped.set(id,{id,fecha:c.starts_at||date,estudios:[],procedimientos:[],medicamentos:[],recetas:[],planes:[]});
  grouped.get(id)[plan?'planes':'recetas'].push({nombre:plan?'Plan de tratamiento':'Receta médica',indicaciones:text});
 }
}
return [{json:{ok:true,consultas:[...grouped.values()]}}];