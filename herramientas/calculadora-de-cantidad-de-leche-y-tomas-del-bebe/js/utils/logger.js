/** Logger técnico sin datos de usuario ni trazas expuestas en interfaz. */
export function crearLogger({debug=false,sink=console}={}){
  const texto=(mensaje)=>`[Imoancy] ${String(mensaje)}`;
  return Object.freeze({debug(m){if(debug)sink.debug(texto(m));},info(m){if(debug)sink.info(texto(m));},warn(m){if(debug)sink.warn(texto(m));},error(m){sink.error(texto(m));}});
}
export const logger=crearLogger({debug:false});
