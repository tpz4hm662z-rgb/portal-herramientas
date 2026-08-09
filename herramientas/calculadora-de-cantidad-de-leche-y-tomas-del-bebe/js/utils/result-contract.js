/** Contrato único, normalizado y validable entre motores y presentación. */
const BASE=Object.freeze({
  validacion:{valido:true,errores:[]},edad:{valor:null,unidad:null,dias:null},alimentacion:{tipo:null,complementaria:false,inicioComplementariaMeses:null},
  interpretacion:{estado:null,tipo:null,nivel:null,claveContenido:null,clavesExplicacion:[],clavesLimitacion:[],requiereAviso:false,requiereTimeline:false,requiereAlertas:false,contextoComplementaria:false},
  alertas:{nivel:"sin_alertas",categorias:[]},timeline:{etapa:null}
});
export function crearResultadoVacio(datos={}){
  return {
    validacion:{...BASE.validacion,...(datos.validacion??{})},tipo:datos.tipo??null,edad:{...BASE.edad,...(datos.edad??{})},peso:datos.peso??null,prematuro:datos.prematuro??null,
    alimentacion:{...BASE.alimentacion,...(datos.alimentacion??{})},numeroTomas:datos.numeroTomas??null,rangoDiario:datos.rangoDiario??null,rangoPorToma:datos.rangoPorToma??null,
    interpretacion:{...BASE.interpretacion,...(datos.interpretacion??{})},alertas:{...BASE.alertas,...(datos.alertas??{})},timeline:{...BASE.timeline,...(datos.timeline??{})},
    recomendaciones:Array.isArray(datos.recomendaciones)?datos.recomendaciones:[],senales:Array.isArray(datos.senales)?datos.senales:[],fuentes:Array.isArray(datos.fuentes)?datos.fuentes:[],faq:Array.isArray(datos.faq)?datos.faq:[],herramientasRelacionadas:Array.isArray(datos.herramientasRelacionadas)?datos.herramientasRelacionadas:[]
  };
}
export function completarResultado(resultado={},cambios={}){return crearResultadoVacio({...resultado,...cambios});}
function rangoValido(rango){return rango===null||(rango&&Number.isFinite(rango.minimo)&&Number.isFinite(rango.maximo)&&rango.minimo<=rango.maximo);}
function tomasValidas(tomas){return tomas===null||Number.isFinite(tomas)||rangoValido(tomas);}
export function esResultadoValido(r){
  return Boolean(r&&typeof r==="object"&&r.validacion&&typeof r.validacion.valido==="boolean"&&Array.isArray(r.validacion.errores)&&r.edad&&("valor" in r.edad)&&("unidad" in r.edad)&&("dias" in r.edad)&&r.alimentacion&&("tipo" in r.alimentacion)&&typeof r.alimentacion.complementaria==="boolean"&&(r.prematuro===null||typeof r.prematuro==="boolean")&&tomasValidas(r.numeroTomas)&&rangoValido(r.rangoDiario)&&rangoValido(r.rangoPorToma)&&r.interpretacion&&Array.isArray(r.interpretacion.clavesExplicacion)&&Array.isArray(r.interpretacion.clavesLimitacion)&&r.alertas&&Array.isArray(r.alertas.categorias)&&r.timeline&&("etapa" in r.timeline)&&Array.isArray(r.recomendaciones)&&Array.isArray(r.senales)&&Array.isArray(r.fuentes)&&Array.isArray(r.faq)&&Array.isArray(r.herramientasRelacionadas));
}
