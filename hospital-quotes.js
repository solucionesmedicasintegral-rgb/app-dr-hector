const HECTOR_HOSPITAL_DEFAULTS=[
 ['Hospital Ángeles Andares',35000,40000],
 ['Hospital Ángeles del Carmen',33000,39000],
 ['Hospital San Javier',32000,38000],
 ['Hospital Real San José',30000,36000],
 ['Hospital Country 2000',28000,34000],
 ['Hospital Santa María Chapalita',25000,30000],
 ['Lomas Providencia',24000,29000],
 ['Hospital Versalles',22000,27000]
];
function ensureHospitalQuoteState(){
 if(!Array.isArray(state.quoteHospitals))state.quoteHospitals=HECTOR_HOSPITAL_DEFAULTS.map(([nombre,minimo,maximo])=>({nombre,minimo,maximo,selected:false}));
}
function resetHospitalQuote(){state.quoteHospitalsEnabled=false;state.quoteHospitals=null;}
function toggleHospitalQuote(enabled){ensureHospitalQuoteState();state.quoteHospitalsEnabled=Boolean(enabled);state.quoteResult=null;render();}
function editHospitalQuote(i,key,value){
 ensureHospitalQuoteState();const h=state.quoteHospitals[i];if(!h)return;
 if(key==='selected')h.selected=Boolean(value);
 else if(key==='nombre')h.nombre=String(value).slice(0,120);
 else if(key==='minimo'||key==='maximo')h[key]=Number(value);
 state.quoteResult=null;
 if(key==='selected')render();else refreshHospitalQuotePreview();
}
function addHospitalQuote(){ensureHospitalQuoteState();if(state.quoteHospitals.length>=12)return toast('Puedes agregar hasta 12 hospitales');state.quoteHospitals.push({nombre:'',minimo:0,maximo:0,selected:false});state.quoteResult=null;render();}
function selectedQuoteHospitals(){
 ensureHospitalQuoteState();if(!state.quoteHospitalsEnabled)return [];
 const rows=state.quoteHospitals.filter(h=>h.selected);
 if(!rows.length)throw new Error('Selecciona al menos un hospital');
 return rows.map(h=>{
  const nombre=String(h.nombre||'').replace(/[\r\n\t]/g,' ').trim();
  const minimo=Number(h.minimo),maximo=Number(h.maximo);
  if(!nombre||!Number.isFinite(minimo)||!Number.isFinite(maximo)||minimo<=0||maximo<minimo)throw new Error('Revisa el nombre y los montos mínimo y máximo del hospital');
  return {nombre,minimo,maximo,moneda:'MXN',estado:'estimado',fuente:'Referencia del consultorio; pendiente de confirmación por el hospital'};
 });
}
function hospitalQuoteRange(min,max){return min===max?money(min):`${money(min)} a ${money(max)}`;}
function hospitalQuotePreview(){
 let rows;try{rows=selectedQuoteHospitals();}catch(e){return `<p class="text-sm text-slate-500">${escapeCatalogText(e.message)}</p>`;}
 if(!rows.length)return '';
 const base=quoteTotal();
 return `<div class="space-y-2"><p class="text-sm font-semibold">Alternativas de presupuesto total</p>${rows.map(h=>`<div class="rounded-xl bg-white border p-3 text-sm"><b>${escapeCatalogText(h.nombre)}</b><div class="text-slate-500 mt-1">Hospital estimado: ${hospitalQuoteRange(h.minimo,h.maximo)}</div><div class="mt-1">Conceptos + hospital: <b>${hospitalQuoteRange(base+h.minimo,base+h.maximo)}</b></div></div>`).join('')}<p class="text-xs text-slate-500">Se cotiza una alternativa de hospital; estos montos no se suman entre sí ni se agregan al total de conceptos.</p></div>`;
}
function refreshHospitalQuotePreview(){const el=document.querySelector('#hospitalQuotePreview');if(el)el.innerHTML=hospitalQuotePreview();}
function hospitalQuoteOptions(){
 ensureHospitalQuoteState();
 return `<div class="border rounded-2xl mt-4 p-4"><label class="flex items-start gap-3 text-sm font-semibold"><input type="checkbox" class="mt-1" ${state.quoteHospitalsEnabled?'checked':''} onchange="toggleHospitalQuote(this.checked)"><span>Anexar opciones de hospital para cirugía</span></label><p class="text-xs text-slate-500 mt-2">Úsalo cuando los conceptos cotizados no incluyen el gasto hospitalario. Los rangos son referencias del consultorio, no tarifas oficiales verificadas.</p>${state.quoteHospitalsEnabled?`<div class="grid gap-3 mt-4">${state.quoteHospitals.map((h,i)=>`<div class="rounded-xl border bg-slate-50 p-3"><div class="flex gap-2 items-center"><input aria-label="Incluir hospital ${i+1}" type="checkbox" ${h.selected?'checked':''} onchange="editHospitalQuote(${i},'selected',this.checked)"><input aria-label="Nombre del hospital ${i+1}" class="input min-w-0 flex-1" placeholder="Nombre del hospital" value="${escapeCatalogText(h.nombre)}" oninput="editHospitalQuote(${i},'nombre',this.value)"></div><div class="grid grid-cols-2 gap-2 mt-2"><label class="text-xs text-slate-500">Mínimo (MXN)<input aria-label="Mínimo hospital ${i+1}" type="number" min="1" step="0.01" class="input mt-1" value="${h.minimo}" oninput="editHospitalQuote(${i},'minimo',this.value)"></label><label class="text-xs text-slate-500">Máximo (MXN)<input aria-label="Máximo hospital ${i+1}" type="number" min="1" step="0.01" class="input mt-1" value="${h.maximo}" oninput="editHospitalQuote(${i},'maximo',this.value)"></label></div></div>`).join('')}</div><button type="button" onclick="addHospitalQuote()" class="border rounded-xl px-4 py-2 text-sm mt-3">+ Agregar hospital</button><p class="text-xs text-slate-500 mt-3">Puedes editar nombres y rangos; para una sola cifra, captura el mismo importe en ambos campos. La cifra definitiva debe confirmarse para el procedimiento y hospital elegidos.</p><div id="hospitalQuotePreview" class="mt-4">${hospitalQuotePreview()}</div>`:''}</div>`;
}
