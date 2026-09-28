"""Static and behavioral checks for the isolated clinical workflow."""
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
workflow = json.loads((root / "n8n/indicaciones-paciente-draft.json").read_text())
nodes = {node["name"]: node for node in workflow["nodes"]}
assert len(nodes) == 31
assert workflow["active"] is False
assert workflow["settings"]["saveDataSuccessExecution"] == "none"
assert workflow["settings"]["saveDataErrorExecution"] == "none"
assert {n["parameters"]["path"] for n in nodes.values() if n["type"].endswith(".webhook")} == {
    "hector-indicaciones-solicitar", "hector-indicaciones-verificar", "hector-indicaciones-listar"
}
for name in ("Aleatorio OTP", "Aleatorio salt", "Crear sesión"):
    assert nodes[name]["parameters"]["encodingType"] == "hex"
assert nodes["Crear sesión"]["parameters"]["stringLength"] == 64
assert "session_hash" in nodes["Buscar sesión"]["parameters"]["filters"]["conditions"][0]["keyName"]

script = r'''
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const p=JSON.parse(fs.readFileSync(process.argv[1]));
const byName=Object.fromEntries(p.nodes.map(n=>[n.name,n]));
function run(name, input, refs){
  const context={$input:{first:()=>({json:input[0]||{}}),all:()=>input.map(json=>({json}))},
    $:(key)=>({first:()=>({json:refs[key]||{}})}),Date,JSON,String,Array,Number,Error};
  return vm.runInNewContext(`(function(){${byName[name].parameters.jsCode}})()`,context);
}
const valid='a'.repeat(64);
assert.throws(()=>run('Validar token',[],{'Mis indicaciones':{body:{token:'bad'}}}),/vencido/);
assert.equal(run('Validar token',[],{'Mis indicaciones':{body:{token:valid}}})[0].json.token,valid);
assert.throws(()=>run('Validar sesión',[{paciente_id:'4',session_expires:'2020-01-01'}]),/vencido/);
assert.throws(()=>run('Verificar expediente',[{ok:true,encontrado:true,paciente:{id:'12',email:'x@example.com'}}],
  {'Validar petición':{paciente_id:'13'}}),/Expediente/);
const rows=[
 {paciente_id:'12',consulta_id:'a',fecha:'hoy',estudios:'[{"nombre":"A"}]',procedimientos:'[]',medicamentos:'[]'},
 {paciente_id:'13',consulta_id:'b',fecha:'hoy',estudios:'[{"nombre":"PRIVADO"}]'},
 {paciente_id:'12',consulta_id:'c',estudios:'malformed',procedimientos:'[]',medicamentos:'[]'}
];
const out=run('Preparar documentos',rows,{'Validar sesión':{paciente_id:'12'}})[0].json;
assert.equal(out.consultas.length,1);
assert.equal(out.consultas[0].id,'a');
assert(!JSON.stringify(out).includes('PRIVADO'));
console.log('patient isolation, expiry, invalid input, and release filtering passed');
'''
subprocess.run(["node", "-e", script, str(root / "n8n/indicaciones-paciente-draft.json")], check=True)
print("workflow structure passed")
