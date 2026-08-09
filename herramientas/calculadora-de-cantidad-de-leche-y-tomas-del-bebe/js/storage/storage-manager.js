/** Persistencia JSON defensiva. Nunca asume que localStorage está disponible. */
function almacenamientoPredeterminado(){try{return globalThis.localStorage??null;}catch{return null;}}
export function crearStorageManager({storage=almacenamientoPredeterminado(),prefijo="h360"}={}){
  const claveCompleta=(clave)=>`${prefijo}:${clave}`;
  return Object.freeze({
    disponible(){if(!storage)return false;try{const k=claveCompleta("__test__");storage.setItem(k,"1");storage.removeItem(k);return true;}catch{return false;}},
    guardar(clave,valor){if(!storage)return false;try{storage.setItem(claveCompleta(clave),JSON.stringify(valor));return true;}catch{return false;}},
    leer(clave,alternativa=null){if(!storage)return alternativa;try{const bruto=storage.getItem(claveCompleta(clave));return bruto===null?alternativa:JSON.parse(bruto);}catch{try{storage.removeItem(claveCompleta(clave));}catch{}return alternativa;}},
    eliminar(clave){if(!storage)return false;try{storage.removeItem(claveCompleta(clave));return true;}catch{return false;}},
    limpiar(){if(!storage)return false;try{const claves=[];for(let i=0;i<storage.length;i+=1){const k=storage.key(i);if(k?.startsWith(`${prefijo}:`))claves.push(k);}claves.forEach((k)=>storage.removeItem(k));return true;}catch{return false;}}
  });
}
const gestor=crearStorageManager();
export function guardar(clave,valor){return gestor.guardar(clave,valor);}
export function leer(clave,alternativa=null){return gestor.leer(clave,alternativa);}
export function eliminar(clave){return gestor.eliminar(clave);}
export function limpiar(){return gestor.limpiar();}
