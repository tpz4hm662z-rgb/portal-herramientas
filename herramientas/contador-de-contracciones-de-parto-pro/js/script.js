"use strict";

const estado = { registros: [], inicioActivo: null, temporizador: null, ultimaPulsacion: 0, wakeLock: null, vibracion: true, registroAtipico: null };
const dom = {};

document.addEventListener("DOMContentLoaded", iniciarHerramienta);

function iniciarHerramienta() {
  ["botonPrincipal","cronometro","minutos","segundos","estadoContador","ayudaContador","anuncios","avisoGuardado","textoAviso","accionAviso","cuerpoHistorial","historialVacio","borrarTodo","ultimaVacia","ultimaDatos","ultimaDuracion","ultimoIntervalo","ultimaHora","statTotal","statDurMedia","statDurRango","statIntMedia","statIntRango","statTiempoTotal","statUltima","mensajeInterpretacion","grafico","graficoContenido","graficoDescripcion","graficoVacio","exportarCSV","exportarPDF","imprimir","dialogoEditar","formEditar","editarId","editarInicio","editarDuracion","grupoEditarIntervalo","editarIntervalo","errorEdicion","cerrarDialogo","cancelarEdicion","vibracion","controlVibracion","dialogoAtipico","corregirAtipico","conservarAtipico","fechaInforme"].forEach(id => dom[id] = document.getElementById(id));
  restaurarEstado();
  dom.botonPrincipal.addEventListener("click", alternarContraccion);
  dom.cuerpoHistorial.addEventListener("click", gestionarAccionHistorial);
  dom.borrarTodo.addEventListener("click", borrarHistorial);
  dom.exportarCSV.addEventListener("click", exportarCSV);
  dom.exportarPDF.addEventListener("click", () => imprimirInforme("PDF"));
  dom.imprimir.addEventListener("click", () => imprimirInforme("impresión"));
  dom.formEditar.addEventListener("submit", guardarEdicion);
  dom.cerrarDialogo.addEventListener("click", cerrarEdicion);
  dom.cancelarEdicion.addEventListener("click", cerrarEdicion);
  dom.editarIntervalo.addEventListener("input", actualizarInicioDesdeIntervalo);
  dom.vibracion.addEventListener("change", cambiarVibracion);
  dom.corregirAtipico.addEventListener("click", corregirRegistroAtipico);
  dom.conservarAtipico.addEventListener("click", conservarRegistroAtipico);
  dom.dialogoEditar.addEventListener("click", e => { if (e.target === dom.dialogoEditar) cerrarEdicion(); });
  document.addEventListener("visibilitychange", () => { if (estado.inicioActivo) { reiniciarBucleReloj(); if (!document.hidden) solicitarWakeLock(); } });
  window.addEventListener("beforeprint", prepararInforme);
  window.addEventListener("storage", sincronizarPestanas);
  renderCompleto();
  configurarVibracion();
  if (estado.inicioActivo) activarInterfaz(true, true);
  else if (estado.registros.length) mostrarAviso(`Sesión recuperada · ${estado.registros.length} contracciones`, 4000);
  registrarServiceWorker();
}

function alternarContraccion() {
  const ahora = Date.now();
  if (ahora - estado.ultimaPulsacion < CONFIG.limites.doblePulsacionMs) return;
  estado.ultimaPulsacion = ahora;
  estado.inicioActivo ? finalizarContraccion(ahora) : iniciarContraccion(ahora);
}

function iniciarContraccion(instante) {
  estado.inicioActivo = instante;
  if (!guardarEstado()) mostrarAviso("La contracción continúa, pero el navegador no permite guardarla.", 5000);
  activarInterfaz(true);
  vibrar(35);
  solicitarWakeLock();
  anunciar("Contracción iniciada. El cronómetro está en marcha.");
}

function finalizarContraccion(instante) {
  if (!estado.inicioActivo || instante <= estado.inicioActivo) return;
  const registro = { id: crearId(), inicio: estado.inicioActivo, fin: instante, editado: false };
  estado.registros.push(registro);
  estado.registros.sort((a,b) => a.inicio - b.inicio);
  if (estado.registros.length > CONFIG.limites.maxRegistros) estado.registros.shift();
  estado.inicioActivo = null;
  detenerBucleReloj();
  liberarWakeLock();
  vibrar([25, 35, 25]);
  guardarEstado();
  activarInterfaz(false);
  renderCompleto();
  const duracion = instante - registro.inicio;
  anunciar(`Contracción finalizada. Duración ${formatearDuracionHablada(duracion)}. Registro guardado.`);
  mostrarAviso("Contracción registrada", 7000, "DESHACER", () => deshacerRegistro(registro.id));
  if (duracion > CONFIG.limites.duracionAtipicaMs) revisarDuracionAtipica(registro.id);
}

function activarInterfaz(activa, recuperada = false) {
  const panel = dom.botonPrincipal.closest(".contador-panel");
  dom.botonPrincipal.classList.toggle("activo", activa);
  panel.classList.toggle("activo", activa);
  dom.botonPrincipal.setAttribute("aria-pressed", String(activa));
  dom.botonPrincipal.innerHTML = activa ? '<span class="boton-icono" aria-hidden="true">■</span><span>FINALIZAR CONTRACCIÓN</span>' : '<span class="boton-icono" aria-hidden="true">▶</span><span>EMPEZAR CONTRACCIÓN</span>';
  dom.estadoContador.lastElementChild.textContent = activa ? "Contracción en curso" : "Preparada para empezar";
  dom.ayudaContador.textContent = activa ? "Pulsa cuando termine la contracción." : "La primera pulsación inicia el tiempo inmediatamente.";
  document.querySelectorAll("[data-accion], #borrarTodo").forEach(control => control.disabled = activa);
  actualizarExportaciones();
  if (activa) {
    actualizarReloj();
    reiniciarBucleReloj();
    if (recuperada) anunciar("Contracción en curso recuperada automáticamente.");
    if (recuperada) mostrarAviso("Sesión recuperada. La contracción sigue en curso.", 4500);
    if (recuperada) solicitarWakeLock();
  } else {
    pintarReloj(0);
  }
}

function reiniciarBucleReloj() {
  detenerBucleReloj();
  const iterar = () => {
    if (!estado.inicioActivo) return;
    actualizarReloj();
    estado.temporizador = window.setTimeout(iterar, document.hidden ? 1000 : 250);
  };
  iterar();
}
function detenerBucleReloj() { if (estado.temporizador) clearTimeout(estado.temporizador); estado.temporizador = null; }
function actualizarReloj() { pintarReloj(Math.max(0, Date.now() - estado.inicioActivo)); }
function pintarReloj(ms) { const total = Math.floor(ms/1000); dom.minutos.textContent = String(Math.floor(total/60)).padStart(2,"0"); dom.segundos.textContent = String(total%60).padStart(2,"0"); }

function renderCompleto() { renderHistorial(); renderUltima(); renderEstadisticas(); renderInterpretacion(); renderGrafico(); actualizarExportaciones(); }

function renderHistorial() {
  dom.cuerpoHistorial.textContent = "";
  estado.registros.forEach((r, indice) => {
    const anterior = indice ? estado.registros[indice-1] : null;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${indice+1}${r.editado?' <span title="Registro editado">*</span>':''}</td><td>${formatearHora(r.inicio)}</td><td>${formatearHora(r.fin)}</td><td>${formatearTiempo(r.fin-r.inicio)}</td><td>${anterior?formatearTiempo(r.inicio-anterior.inicio):"—"}</td><td><div class="acciones-fila"><button class="accion-tabla" type="button" data-accion="editar" data-id="${r.id}" aria-label="Editar contracción ${indice+1}">Editar</button><button class="accion-tabla eliminar" type="button" data-accion="eliminar" data-id="${r.id}" aria-label="Eliminar contracción ${indice+1}">Eliminar</button></div></td>`;
    dom.cuerpoHistorial.appendChild(tr);
  });
  dom.historialVacio.hidden = estado.registros.length > 0;
  dom.borrarTodo.hidden = estado.registros.length === 0;
}

function renderUltima() {
  const ultima = estado.registros.at(-1);
  dom.ultimaVacia.hidden = Boolean(ultima); dom.ultimaDatos.hidden = !ultima;
  if (!ultima) return;
  const indice = estado.registros.length-1, anterior = estado.registros[indice-1];
  dom.ultimaDuracion.textContent = formatearTiempo(ultima.fin-ultima.inicio);
  dom.ultimoIntervalo.textContent = anterior ? formatearTiempo(ultima.inicio-anterior.inicio) : "—";
  dom.ultimaHora.textContent = formatearHora(ultima.inicio);
}

function renderEstadisticas() {
  const rs = estado.registros, duraciones = rs.map(r=>r.fin-r.inicio), intervalos = rs.slice(1).map((r,i)=>r.inicio-rs[i].inicio).filter(n=>n>0);
  dom.statTotal.textContent = String(rs.length);
  dom.statDurMedia.textContent = duraciones.length ? formatearTiempo(media(duraciones)) : "—";
  dom.statDurRango.textContent = duraciones.length ? `${formatearTiempo(Math.min(...duraciones))} / ${formatearTiempo(Math.max(...duraciones))}` : "—";
  dom.statIntMedia.textContent = intervalos.length ? formatearTiempo(media(intervalos)) : "—";
  dom.statIntRango.textContent = intervalos.length ? `${formatearTiempo(Math.min(...intervalos))} / ${formatearTiempo(Math.max(...intervalos))}` : "—";
  dom.statTiempoTotal.textContent = rs.length ? formatearTiempo(rs.at(-1).fin-rs[0].inicio) : "—";
  dom.statUltima.textContent = rs.length ? formatearFechaHora(rs.at(-1).inicio) : "—";
}

function renderInterpretacion() {
  const rs = estado.registros;
  if (rs.length < 3) { dom.mensajeInterpretacion.textContent = "Registra al menos tres contracciones para observar una posible tendencia."; return; }
  const ints = rs.slice(1).map((r,i)=>r.inicio-rs[i].inicio), recientes = ints.slice(-4);
  const variacion = recientes.length > 1 ? recientes.at(-1)-recientes[0] : 0;
  const dispersion = Math.max(...recientes)-Math.min(...recientes), promedio = media(recientes);
  if (dispersiónRelativa(dispersion,promedio) > .35) dom.mensajeInterpretacion.textContent = "Las contracciones todavía parecen irregulares.";
  else if (variacion < -30000) dom.mensajeInterpretacion.textContent = "Se observa una disminución del intervalo: las contracciones parecen hacerse más frecuentes.";
  else if (variacion > 30000) dom.mensajeInterpretacion.textContent = "Los intervalos recientes parecen aumentar.";
  else dom.mensajeInterpretacion.textContent = "Los intervalos recientes se mantienen relativamente estables.";
  const cobertura = rs.at(-1).inicio-rs[0].inicio;
  const enVentana = rs.filter(r=>r.inicio >= rs.at(-1).inicio-60*60*1000);
  if (cobertura >= 55*60*1000 && enVentana.length >= 10) {
    const intervalosVentana = enVentana.slice(1).map((r,i)=>r.inicio-enVentana[i].inicio);
    const proporcionInt = intervalosVentana.filter(x=>x<=5.5*60*1000).length/intervalosVentana.length;
    const proporcionDur = enVentana.filter(r=>r.fin-r.inicio>=55*1000).length/enVentana.length;
    if (proporcionInt>=.8 && proporcionDur>=.8) dom.mensajeInterpretacion.textContent += " El registro se aproxima al patrón orientativo 5-1-1. Contacta con tu matrona o equipo sanitario y sigue sus indicaciones.";
  }
}
function dispersiónRelativa(rango,promedio){return promedio?rango/promedio:0}

function renderGrafico() {
  const rs=estado.registros; dom.graficoContenido.textContent=""; dom.graficoVacio.hidden=rs.length>=2; dom.grafico.hidden=rs.length<2;
  if(rs.length<2){dom.graficoDescripcion.textContent="No hay suficientes datos para mostrar el gráfico.";return}
  const valores=rs.flatMap((r,i)=>[r.fin-r.inicio,i?(r.inicio-rs[i-1].inicio):0]).map(v=>v/1000), max=Math.max(60,...valores), w=720/(rs.length-1), puntosD=[], puntosI=[];
  const svgNS="http://www.w3.org/2000/svg", g=dom.graficoContenido;
  for(let n=0;n<=4;n++){const y=260-n*55,line=document.createElementNS(svgNS,"line");line.setAttribute("x1","55");line.setAttribute("x2","775");line.setAttribute("y1",y);line.setAttribute("y2",y);line.setAttribute("stroke","#dce3ed");g.appendChild(line);const t=document.createElementNS(svgNS,"text");t.setAttribute("x","48");t.setAttribute("y",y+4);t.setAttribute("text-anchor","end");t.setAttribute("font-size","12");t.setAttribute("fill","#5c667a");t.textContent=Math.round(max*n/4);g.appendChild(t)}
  rs.forEach((r,i)=>{const x=55+i*w,d=(r.fin-r.inicio)/1000,yD=260-(d/max)*220;puntosD.push(`${x},${yD}`);if(i){const inter=(r.inicio-rs[i-1].inicio)/1000;puntosI.push(`${x},${260-(inter/max)*220}`)}const label=document.createElementNS(svgNS,"text");label.setAttribute("x",x);label.setAttribute("y","284");label.setAttribute("text-anchor","middle");label.setAttribute("font-size","12");label.textContent=String(i+1);g.appendChild(label)});
  [[puntosD,"#2563eb"],[puntosI,"#e18700"]].forEach(([puntos,color])=>{const p=document.createElementNS(svgNS,"polyline");p.setAttribute("points",puntos.join(" "));p.setAttribute("fill","none");p.setAttribute("stroke",color);p.setAttribute("stroke-width","4");p.setAttribute("stroke-linejoin","round");p.setAttribute("stroke-linecap","round");g.appendChild(p)});
  dom.graficoDescripcion.textContent=`Gráfico de ${rs.length} contracciones. Duración media ${formatearTiempo(media(rs.map(r=>r.fin-r.inicio)))}.`;
}

function gestionarAccionHistorial(e) { const b=e.target.closest("button[data-accion]"); if(!b)return; b.dataset.accion==="editar"?abrirEdicion(b.dataset.id):eliminarRegistro(b.dataset.id); }
function abrirEdicion(id) {
  const indice=estado.registros.findIndex(x=>x.id===id),r=estado.registros[indice];if(!r)return;
  dom.editarId.value=id;dom.editarInicio.value=aFechaLocalInput(r.inicio);dom.editarDuracion.value=Math.round((r.fin-r.inicio)/1000);
  const anterior=estado.registros[indice-1];dom.grupoEditarIntervalo.hidden=!anterior;dom.editarIntervalo.value=anterior?Math.round((r.inicio-anterior.inicio)/1000):"";
  dom.errorEdicion.textContent="";dom.dialogoEditar.showModal();dom.editarInicio.focus();
}
function cerrarEdicion(){dom.dialogoEditar.close();dom.errorEdicion.textContent=""}
function actualizarInicioDesdeIntervalo(){const indice=estado.registros.findIndex(r=>r.id===dom.editarId.value),anterior=estado.registros[indice-1],segundos=Number(dom.editarIntervalo.value);if(anterior&&segundos>0)dom.editarInicio.value=aFechaLocalInput(anterior.inicio+segundos*1000)}
function guardarEdicion(e){e.preventDefault();const inicio=new Date(dom.editarInicio.value).getTime(),duracion=Number(dom.editarDuracion.value)*1000,fin=inicio+duracion,id=dom.editarId.value;if(!Number.isFinite(inicio)||!Number.isFinite(duracion)||duracion<1000){dom.errorEdicion.textContent="Introduce una hora y una duración válida superior a cero.";dom.editarDuracion.focus();return}const solapa=estado.registros.some(r=>r.id!==id&&inicio<r.fin&&fin>r.inicio);if(solapa){dom.errorEdicion.textContent="Este horario se solapa con otra contracción. Revisa los datos.";return}const r=estado.registros.find(x=>x.id===id);r.inicio=inicio;r.fin=fin;r.editado=true;estado.registros.sort((a,b)=>a.inicio-b.inicio);guardarEstado();cerrarEdicion();renderCompleto();mostrarAviso("Registro actualizado",3000);anunciar("Contracción actualizada y estadísticas recalculadas.")}
function eliminarRegistro(id){const i=estado.registros.findIndex(r=>r.id===id);if(i<0)return;if(!confirm(`¿Eliminar la contracción ${i+1}? Esta acción no se puede deshacer.`))return;estado.registros.splice(i,1);guardarEstado();renderCompleto();mostrarAviso("Registro eliminado",3000);anunciar("Contracción eliminada y estadísticas recalculadas.")}
function borrarHistorial(){if(estado.inicioActivo){mostrarAviso("Finaliza la contracción activa antes de iniciar otra sesión.");return}if(confirm("¿Quieres exportar un CSV antes de iniciar la nueva sesión?"))exportarCSV();if(!confirm(`¿Iniciar una nueva sesión y borrar las ${estado.registros.length} contracciones actuales? Esta acción no se puede deshacer.`))return;estado.registros=[];guardarEstado();renderCompleto();mostrarAviso("Nueva sesión preparada",3500);anunciar("Historial borrado. Nueva sesión preparada.")}

function deshacerRegistro(id){const indice=estado.registros.findIndex(r=>r.id===id);if(indice<0)return;estado.registros.splice(indice,1);guardarEstado();renderCompleto();ocultarAviso();mostrarAviso("Registro deshecho",3000);anunciar("Se ha deshecho la última contracción registrada.")}
function revisarDuracionAtipica(id){estado.registroAtipico=id;dom.dialogoAtipico.showModal();dom.conservarAtipico.focus()}
function conservarRegistroAtipico(){estado.registroAtipico=null;dom.dialogoAtipico.close();mostrarAviso("Registro conservado",3000)}
function corregirRegistroAtipico(){const id=estado.registroAtipico;estado.registroAtipico=null;dom.dialogoAtipico.close();abrirEdicion(id)}

function guardarEstado(){try{localStorage.setItem(CONFIG.almacenamiento.clave,JSON.stringify({version:CONFIG.almacenamiento.version,inicioActivo:estado.inicioActivo,registros:estado.registros,vibracion:estado.vibracion,actualizado:Date.now()}));return true}catch(e){return false}}
function restaurarEstado(){try{const bruto=localStorage.getItem(CONFIG.almacenamiento.clave);if(!bruto)return;const datos=JSON.parse(bruto);if(datos.version!==CONFIG.almacenamiento.version||!Array.isArray(datos.registros))return;estado.registros=datos.registros.filter(esRegistroValido).sort((a,b)=>a.inicio-b.inicio);estado.inicioActivo=Number.isFinite(datos.inicioActivo)&&datos.inicioActivo<=Date.now()?datos.inicioActivo:null;estado.vibracion=datos.vibracion!==false}catch(e){mostrarAviso("No se pudo recuperar el historial guardado.",5000)}}
function sincronizarPestanas(e){if(e.key!==CONFIG.almacenamiento.clave)return;restaurarEstado();renderCompleto();activarInterfaz(Boolean(estado.inicioActivo));mostrarAviso("Datos sincronizados desde otra pestaña.")}
function esRegistroValido(r){return r&&typeof r.id==="string"&&Number.isFinite(r.inicio)&&Number.isFinite(r.fin)&&r.fin>r.inicio}

function exportarCSV(){
  if(!estado.registros.length)return;
  const duraciones=estado.registros.map(r=>r.fin-r.inicio),intervalos=estado.registros.slice(1).map((r,i)=>r.inicio-estado.registros[i].inicio);
  const filas=[["Informe de contracciones","Imoancy"],["Fecha de exportacion",new Date().toISOString()],["Numero de contracciones",estado.registros.length],["Duracion media segundos",Math.round(media(duraciones)/1000)],["Duracion minima segundos",Math.round(Math.min(...duraciones)/1000)],["Duracion maxima segundos",Math.round(Math.max(...duraciones)/1000)],["Intervalo medio segundos",intervalos.length?Math.round(media(intervalos)/1000):""],["Intervalo minimo segundos",intervalos.length?Math.round(Math.min(...intervalos)/1000):""],["Intervalo maximo segundos",intervalos.length?Math.round(Math.max(...intervalos)/1000):""],[],["Numero","Inicio","Final","Duracion_segundos","Intervalo_segundos","Editado"]];
  estado.registros.forEach((r,i)=>filas.push([i+1,new Date(r.inicio).toISOString(),new Date(r.fin).toISOString(),Math.round((r.fin-r.inicio)/1000),i?Math.round((r.inicio-estado.registros[i-1].inicio)/1000):"",r.editado?"Sí":"No"]));
  const csv="\ufeff"+filas.map(f=>f.map(escaparCSV).join(";")).join("\r\n"),url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"})),a=document.createElement("a");
  a.href=url;a.download=`contracciones-${new Date().toISOString().slice(0,10)}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);mostrarAviso("Archivo CSV exportado",3000);anunciar("Archivo CSV exportado.")
}
function escaparCSV(v){return `"${String(v).replaceAll('"','""')}"`}
function prepararInforme(){dom.fechaInforme.textContent=new Date().toLocaleString("es-ES",{dateStyle:"long",timeStyle:"short"})}
function imprimirInforme(tipo){if(!estado.registros.length)return;prepararInforme();window.print();mostrarAviso(`Informe preparado para ${tipo}`,3000);anunciar(`Informe preparado para ${tipo}.`) }
function actualizarExportaciones(){const disabled=!estado.registros.length||Boolean(estado.inicioActivo);[dom.exportarCSV,dom.exportarPDF,dom.imprimir].forEach(b=>b.disabled=disabled)}

function formatearTiempo(ms){if(!Number.isFinite(ms)||ms<0)return"—";const s=Math.round(ms/1000);return s<60?`${s} s`:`${Math.floor(s/60)} min ${String(s%60).padStart(2,"0")} s`}
function formatearDuracionHablada(ms){const s=Math.round(ms/1000),m=Math.floor(s/60);return m?`${m} minutos y ${s%60} segundos`:`${s} segundos`}
function formatearHora(ts){return new Date(ts).toLocaleTimeString(CONFIG.formato.locale,{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
function formatearFechaHora(ts){return new Date(ts).toLocaleString(CONFIG.formato.locale,{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}
function aFechaLocalInput(ts){const d=new Date(ts-diferenciaZona(ts));return d.toISOString().slice(0,19)}
function diferenciaZona(ts){return new Date(ts).getTimezoneOffset()*60000}
function media(v){return v.reduce((a,b)=>a+b,0)/v.length}
function crearId(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}
function anunciar(m){dom.anuncios.textContent="";requestAnimationFrame(()=>dom.anuncios.textContent=m)}
function mostrarAviso(m,ms=3500,etiquetaAccion="",accion=null){dom.textoAviso.textContent=m;dom.accionAviso.hidden=!accion;dom.accionAviso.textContent=etiquetaAccion;dom.accionAviso.onclick=accion;dom.avisoGuardado.hidden=false;clearTimeout(mostrarAviso.id);mostrarAviso.id=setTimeout(ocultarAviso,ms)}
function ocultarAviso(){dom.avisoGuardado.hidden=true;dom.accionAviso.onclick=null}
function configurarVibracion(){const compatible="vibrate" in navigator;dom.controlVibracion.hidden=!compatible;dom.vibracion.checked=estado.vibracion}
function cambiarVibracion(){estado.vibracion=dom.vibracion.checked;guardarEstado();mostrarAviso(estado.vibracion?"Vibración activada":"Vibración desactivada",2500)}
function vibrar(patron){if(estado.vibracion&&"vibrate" in navigator)navigator.vibrate(patron)}
async function solicitarWakeLock(){if(!estado.inicioActivo||estado.wakeLock||!("wakeLock" in navigator)||document.hidden)return;try{estado.wakeLock=await navigator.wakeLock.request("screen");estado.wakeLock.addEventListener("release",()=>{estado.wakeLock=null},{once:true})}catch(e){estado.wakeLock=null}}
async function liberarWakeLock(){if(!estado.wakeLock)return;try{await estado.wakeLock.release()}catch(e){}estado.wakeLock=null}
function registrarServiceWorker(){if("serviceWorker" in navigator&&location.hostname==="imoancy.com")navigator.serviceWorker.register("sw.js").catch(()=>{})}
