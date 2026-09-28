"""Generate the isolated, unpublished n8n workflow for patient indications."""
import json
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "n8n" / "indicaciones-paciente-draft.json"
ACCESS_ID = "QKdTzTdm0u25iLaW"
PUBLIC_ID = "L3G23hkQ9xuRvPG8"
PROJECT = "YFzT1sCVRuwyWi9e"
nodes = []
connections = {}


def node(name, kind, params, x, y, version=1, **extra):
    nodes.append({"id": str(uuid.uuid4()), "name": name, "type": f"n8n-nodes-base.{kind}",
                  "typeVersion": version, "position": [x, y], "parameters": params, **extra})
    return name


def link(*names):
    for current, following in zip(names, names[1:]):
        connections[current] = {"main": [[{"node": following, "type": "main", "index": 0}]]}


def code(name, source, x, y):
    return node(name, "code", {"mode": "runOnceForAllItems", "jsCode": source.strip()}, x, y, 2)


def webhook(name, path, y):
    return node(name, "webhook", {"httpMethod": "POST", "path": path,
                "responseMode": "lastNode", "responseData": "firstEntryJson",
                "options": {"allowedOrigins": "https://solucionesmedicasintegral-rgb.github.io"}},
                0, y, 2.1, webhookId=str(uuid.uuid4()))


def table(name, operation, table_id, table_name, filters, x, y, columns=None, **extra):
    p = {"resource": "row", "operation": operation,
         "dataTableId": {"__rl": True, "value": table_id, "mode": "list",
                         "cachedResultName": table_name,
                         "cachedResultUrl": f"/projects/{PROJECT}/datatables/{table_id}"},
         "matchType": "allConditions",
         "filters": {"conditions": [{"keyName": key, "keyValue": value}
                                    for key, value in filters.items()]}}
    if columns is not None:
        p["columns"] = {"mappingMode": "defineBelow", "value": columns}
    else:
        p.update({"returnAll": operation == "get" and table_id == PUBLIC_ID,
                  "limit": 1})
    return node(name, "dataTable", p, x, y, 1, **extra)


def crypto(name, action, field, x, y, **kwargs):
    if action == "generate":
        params = {"action": "generate", "dataPropertyName": field,
                  "encodingType": "hex", "stringLength": kwargs["length"]}
    else:
        params = {"action": "hash", "dataPropertyName": field,
                  "type": kwargs["type"], "value": kwargs["value"]}
    return node(name, "crypto", params, x, y)


webhook("Pedir código", "hector-indicaciones-solicitar", 0)
code("Validar petición", """
const b=$('Pedir código').first().json.body||{};
const paciente_id=String(b.paciente_id||'').trim();
const telefono=String(b.telefono||'').replace(/\\D/g,'').slice(-10);
if(!/^\\d{1,15}$/.test(paciente_id)||!/^[0-9]{10}$/.test(telefono)) throw new Error('Solicitud inválida');
return [{json:{paciente_id,telefono}}];
""", 220, 0)
table("Consultar frecuencia", "get", ACCESS_ID, "accesos_indicaciones_hector",
      {"paciente_id": "={{ $('Validar petición').first().json.paciente_id }}"}, 440, 0,
      alwaysOutputData=True)
code("Limitar solicitud", """
const prev=$input.first()?.json||{};
if(prev.sent_at && Date.now()-Date.parse(prev.sent_at)<5*60*1000)
  throw new Error('Espera cinco minutos antes de pedir otro código');
return [{json:$('Validar petición').first().json}];
""", 660, 0)
node("Buscar en Core", "httpRequest", {
    "method": "POST",
    "url": "https://solucionesmedicasintegral.app.n8n.cloud/webhook/hector-app-core",
    "sendBody": True, "specifyBody": "json",
    "jsonBody": "={{ JSON.stringify({action:'buscar_paciente',telefono:$json.telefono}) }}",
    "options": {"timeout": 15000}
}, 880, 0, 4.2)
code("Verificar expediente", """
const result=$input.first()?.json||{};
const p=result.ok===true&&result.encontrado===true?result.paciente:null;
const requested=$('Validar petición').first().json;
const id=String(p?.id||p?.person_id||p?.patient_id||'');
const email=String(p?.email||'').trim().toLowerCase();
if(id!==requested.paciente_id||!/^\\S+@\\S+\\.\\S+$/.test(email))
  throw new Error('Expediente sin correo verificable');
return [{json:{paciente_id:id,email}}];
""", 1100, 0)
crypto("Aleatorio OTP", "generate", "random_hex", 1320, 0, type="hex", length=16)
code("Crear código", """
const raw=String($input.first().json.random_hex||'');
if(!/^[0-9a-f]{16,}$/i.test(raw)) throw new Error('Generación de código no válida');
const otp=String(Number(BigInt('0x'+raw.slice(0,13))%1000000n)).padStart(6,'0');
return [{json:{...$('Verificar expediente').first().json,otp}}];
""", 1540, 0)
crypto("Aleatorio salt", "generate", "salt", 1760, 0, type="hex", length=32)
crypto("Hash OTP", "hash", "otp_hash", 1980, 0, type="SHA256",
       value="={{ $json.salt + $('Crear código').first().json.otp }}", encoding="hex")
table("Guardar OTP", "upsert", ACCESS_ID, "accesos_indicaciones_hector",
      {"paciente_id": "={{ $('Verificar expediente').first().json.paciente_id }}"},
      2200, 0, columns={
          "paciente_id": "={{ $('Verificar expediente').first().json.paciente_id }}",
          "otp_hash": "={{ $('Hash OTP').first().json.otp_hash }}",
          "otp_salt": "={{ $('Aleatorio salt').first().json.salt }}",
          "otp_expires": "={{ new Date(Date.now()+10*60*1000).toISOString() }}",
          "attempts": 0, "sent_at": "={{ new Date().toISOString() }}",
          "session_hash": "", "session_expires": ""
      })
node("Enviar OTP Gmail", "gmail", {
    "resource": "message", "operation": "send",
    "sendTo": "={{ $('Verificar expediente').first().json.email }}",
    "subject": "Tu código de acceso · Mi Salud",
    "message": "={{ 'Tu código de acceso es '+$('Crear código').first().json.otp+'. Vence en 10 minutos. Si no lo solicitaste, ignora este correo.' }}",
    "options": {}
}, 2420, 0, 2.1)
code("Respuesta solicitud", "return [{json:{ok:true}}];", 2640, 0)
link("Pedir código", "Validar petición", "Consultar frecuencia", "Limitar solicitud",
     "Buscar en Core", "Verificar expediente", "Aleatorio OTP", "Crear código",
     "Aleatorio salt", "Hash OTP", "Guardar OTP", "Enviar OTP Gmail", "Respuesta solicitud")

webhook("Verificar código", "hector-indicaciones-verificar", 440)
code("Validar petición OTP", """
const b=$('Verificar código').first().json.body||{};
const paciente_id=String(b.paciente_id||'').trim(),codigo=String(b.codigo||'').trim();
if(!/^\\d{1,15}$/.test(paciente_id)||!/^\\d{6}$/.test(codigo)) throw new Error('Código inválido');
return [{json:{paciente_id,codigo}}];
""", 220, 440)
table("Leer OTP", "get", ACCESS_ID, "accesos_indicaciones_hector",
      {"paciente_id": "={{ $('Validar petición OTP').first().json.paciente_id }}"},
      440, 440, alwaysOutputData=True)
code("Limitar intentos OTP", """
const row=$input.first()?.json||{};
if(!row.otp_hash||Date.now()>Date.parse(row.otp_expires)||Number(row.attempts)>=5)
  throw new Error('Código incorrecto o vencido');
return [{json:{...row,attempts:Number(row.attempts||0)+1}}];
""", 660, 440)
table("Contar intento", "update", ACCESS_ID, "accesos_indicaciones_hector",
      {"paciente_id": "={{ $('Validar petición OTP').first().json.paciente_id }}"},
      880, 440, columns={"attempts": "={{ $('Limitar intentos OTP').first().json.attempts }}"})
crypto("Hash código recibido", "hash", "candidate_hash", 1100, 440, type="SHA256",
       value="={{ $('Limitar intentos OTP').first().json.otp_salt + $('Validar petición OTP').first().json.codigo }}",
       encoding="hex")
code("Comparar OTP", """
const actual=String($input.first().json.candidate_hash||'');
const expected=String($('Limitar intentos OTP').first().json.otp_hash||'');
if(!actual||actual!==expected) throw new Error('Código incorrecto o vencido');
return [{json:{paciente_id:$('Validar petición OTP').first().json.paciente_id}}];
""", 1320, 440)
crypto("Crear sesión", "generate", "session_token", 1540, 440, type="hex", length=64)
crypto("Hash sesión", "hash", "session_hash", 1760, 440, type="SHA256",
       value="={{ $json.session_token }}", encoding="hex")
table("Activar sesión", "update", ACCESS_ID, "accesos_indicaciones_hector",
      {"paciente_id": "={{ $('Validar petición OTP').first().json.paciente_id }}"},
      1980, 440, columns={
          "otp_hash": "", "otp_salt": "",
          "session_hash": "={{ $('Hash sesión').first().json.session_hash }}",
          "session_expires": "={{ new Date(Date.now()+15*60*1000).toISOString() }}"
      })
code("Respuesta verificación", """
const token=String($('Crear sesión').first().json.session_token||'');
if(!/^[a-f0-9]{64}$/i.test(token))throw new Error('Sesión inválida');
return [{json:{ok:true,token,expires_in:900}}];
""", 2200, 440)
link("Verificar código", "Validar petición OTP", "Leer OTP", "Limitar intentos OTP",
     "Contar intento", "Hash código recibido", "Comparar OTP", "Crear sesión",
     "Hash sesión", "Activar sesión", "Respuesta verificación")

webhook("Mis indicaciones", "hector-indicaciones-listar", 880)
code("Validar token", """
const token=String($('Mis indicaciones').first().json.body?.token||'');
if(!/^[a-f0-9]{64}$/i.test(token)) throw new Error('Acceso vencido');
return [{json:{token}}];
""", 220, 880)
crypto("Hash token recibido", "hash", "session_hash", 440, 880, type="SHA256",
       value="={{ $json.token }}", encoding="hex")
table("Buscar sesión", "get", ACCESS_ID, "accesos_indicaciones_hector",
      {"session_hash": "={{ $json.session_hash }}"}, 660, 880, alwaysOutputData=True)
code("Validar sesión", """
const row=$input.first()?.json||{};
if(!row.paciente_id||!row.session_expires||Date.now()>Date.parse(row.session_expires))
  throw new Error('Acceso vencido');
return [{json:{paciente_id:String(row.paciente_id)}}];
""", 880, 880)
table("Leer publicaciones", "get", PUBLIC_ID, "indicaciones_publicadas_hector",
      {"paciente_id": "={{ $json.paciente_id }}"}, 1100, 880, alwaysOutputData=True)
code("Preparar documentos", """
const id=$('Validar sesión').first().json.paciente_id;
const parse=(s)=>{try{const x=JSON.parse(String(s||'[]'));return Array.isArray(x)?x:[]}catch{return []}};
const consultas=$input.all().map(x=>x.json).filter(r=>String(r.paciente_id)===id)
  .map(r=>({id:String(r.consulta_id||''),fecha:String(r.fecha||''),
    estudios:parse(r.estudios),procedimientos:parse(r.procedimientos),medicamentos:parse(r.medicamentos)}))
  .filter(r=>r.id&&(r.estudios.length||r.procedimientos.length||r.medicamentos.length));
return [{json:{ok:true,consultas}}];
""", 1320, 880)
link("Mis indicaciones", "Validar token", "Hash token recibido", "Buscar sesión",
     "Validar sesión", "Leer publicaciones", "Preparar documentos")

workflow = {
    "name": "HECTOR - Indicaciones Paciente - BORRADOR",
    "nodes": nodes, "connections": connections, "pinData": {},
    "settings": {"executionOrder": "v1", "saveDataSuccessExecution": "none",
                 "saveDataErrorExecution": "none", "saveManualExecutions": False},
    "active": False,
}
OUT.parent.mkdir(exist_ok=True)
OUT.write_text(json.dumps(workflow, ensure_ascii=False, indent=2) + "\n")
print(f"{OUT}: {len(nodes)} nodes, {len(connections)} connections")
