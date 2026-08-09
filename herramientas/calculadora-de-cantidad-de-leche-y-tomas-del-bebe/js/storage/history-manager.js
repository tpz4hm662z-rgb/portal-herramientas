/** Historial local mínimo, versionado y limitado a 50 informes. */
const VERSION=1; const MAXIMO=50;
const ALIMENTACIONES=new Set(["formula","materna","mixta","extraida"]);const UNIDADES=new Set(["dias","semanas","meses"]);
function registroValido(r){return r&&typeof r==="object"&&!Number.isNaN(Date.parse(r.fecha))&&r.edad&&Number.isFinite(r.edad.valor)&&Number.isFinite(r.edad.dias)&&UNIDADES.has(r.edad.unidad)&&Number.isFinite(r.peso)&&r.peso>0&&r.peso<=20&&ALIMENTACIONES.has(r.alimentacion)&&typeof r.prematuro==="boolean"&&typeof r.complementaria==="boolean"&&typeof r.resumen==="string"&&r.resumen.length<=300&&typeof r.estado==="string"&&r.estado.length<=120;}
function huella(r){return JSON.stringify([r.edad,r.peso,r.alimentacion,r.prematuro,r.complementaria,r.resumen,r.estado]);}
export function crearHistoryManager(storageManager,{clave="historial-leche",maximo=MAXIMO}={}){
  function leerRegistros(){const datos=storageManager.leer(clave,{version:VERSION,registros:[]});if(datos?.version!==VERSION||!Array.isArray(datos.registros))return [];return datos.registros.filter(registroValido).slice(0,maximo);}
  function persistir(registros){return storageManager.guardar(clave,{version:VERSION,registros:registros.slice(0,maximo)});}
  return Object.freeze({
    listar(){return leerRegistros();},
    agregar(registro){if(!registroValido(registro))return {guardado:false,registros:leerRegistros()};const actuales=leerRegistros();if(actuales[0]&&huella(actuales[0])===huella(registro))return {guardado:false,duplicado:true,registros:actuales};const registros=[Object.freeze({...registro}),...actuales].slice(0,maximo);const guardado=persistir(registros);return {guardado,registros:guardado?registros:actuales};},
    eliminar(fecha){const actuales=leerRegistros();const registros=actuales.filter((r)=>r.fecha!==fecha);const eliminado=registros.length!==actuales.length&&persistir(registros);return {eliminado,registros:eliminado?registros:actuales};},
    limpiar(){const actuales=leerRegistros();const eliminado=storageManager.eliminar(clave);return {eliminado,registros:eliminado?[]:actuales};},
    disponible(){return storageManager.disponible();}
  });
}
