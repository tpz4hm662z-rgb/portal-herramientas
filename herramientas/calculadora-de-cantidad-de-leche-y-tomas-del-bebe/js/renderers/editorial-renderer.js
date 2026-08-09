import { crearElemento, vaciar } from "../utils/render-helpers.js";
function renderLista(contenido,destino){vaciar(destino);const lista=crearElemento("ul","","lista-editorial");contenido.puntos.forEach((p)=>lista.append(crearElemento("li",p)));destino.append(lista);}
export function renderTransparency(contenido,destino){renderLista(contenido,destino);}
export function renderTrust(contenido,destino){renderLista(contenido,destino);const p=crearElemento("p","","revision-cientifica");const fecha=crearElemento("time",contenido.revision.fecha);fecha.setAttribute("datetime",contenido.revision.fechaISO);p.append(crearElemento("strong","Última revisión científica: "),fecha);destino.append(p);}
