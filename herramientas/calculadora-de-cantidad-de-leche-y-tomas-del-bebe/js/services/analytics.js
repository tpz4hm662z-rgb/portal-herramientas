/** Eventos agregados sin parámetros ni datos sanitarios. */
export const EVENTOS_GA4=Object.freeze(["generate_report","reset_form","print_report","share_report","view_history","clear_history"]);
export function registrarEvento(nombre,{gtag=globalThis.gtag,dataLayer=globalThis.dataLayer}={}){if(!EVENTOS_GA4.includes(nombre))return false;try{if(typeof gtag==="function")gtag("event",nombre);else if(Array.isArray(dataLayer))dataLayer.push({event:nombre});else return false;return true;}catch{return false;}}
