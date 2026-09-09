(function () {
  'use strict';
  const $ = id => document.getElementById(id), core = window.SolarWindow;
  if (!core) { $('load-state').textContent = 'El observatorio no se pudo cargar. Recarga la página o consulta la guía y las fuentes más abajo.'; return; }
  const CANONICAL = 'https://imoancy.com/herramientas/simulador-sol-ventana/';
  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DIRECTIONS = ['Norte','Nordeste','Este','Sudeste','Sur','Sudoeste','Oeste','Noroeste'];
  const FIELDS = ['roomWidth','roomDepth','windowWidth','sill','windowHeight'];
  const SERIAL = { c:'city',m:'month',t:'minute',a:'bearingA',b:'bearingB',w:'roomWidth',d:'roomDepth',n:'windowWidth',s:'sill',h:'windowHeight',o:'obstruction' };
  const CONSENT = 'imoancy_solar_analytics', GA = 'G-QH8MJ6LVHN';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = {...core.DEFAULTS}, results, cacheKey = '', annualA, annualB, timer = null;
  let allowed = false, gaLoaded = false, viewed = false, started = false, lastAction = '', completed = false, valid = true;
  let announcementTimer;
  const number = (n, digits = 0) => new Intl.NumberFormat('es-ES',{maximumFractionDigits:digits}).format(n);
  const clock = minute => String(Math.floor(minute / 60)).padStart(2,'0') + ':' + String(minute % 60).padStart(2,'0');
  const duration = minutes => Math.floor(minutes / 60) + ' h' + (minutes % 60 ? ' ' + minutes % 60 + ' min' : '');
  const direction = angle => DIRECTIONS[Math.round(angle / 45) % 8];
  const intervalText = intervals => intervals.length ? intervals.map(x => clock(x.start) + '–' + clock(x.end)).join(' · ') : 'Sin sol directo';
  const text = (tag, value, className) => { const e=document.createElement(tag);e.textContent=value;if(className)e.className=className;return e; };
  const esc = str => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function track(name, details = {}) {
    if (!allowed || typeof window.gtag !== 'function') return;
    const permitted = {
      page_view:['page_title'],solar_view:[],solar_start:[],solar_explore:['action'],
      solar_result:[],solar_repeat:[],solar_share:['method'],solar_related_click:['destination']
    };
    if (!permitted[name]) return;
    const params = {tool_id:'solar_window',page_location:CANONICAL,page_referrer:''};
    for (const key of permitted[name]) if (details[key] !== undefined) params[key]=details[key];
    window.gtag('event',name,params);
  }
  function consent(value, persist) {
    allowed=value;window['ga-disable-'+GA]=!value;
    if(persist)try{localStorage.setItem(CONSENT,value?'granted':'denied');}catch(_){/* The choice also works for this visit. */}
    if(value && !gaLoaded){
      window.dataLayer=window.dataLayer||[];
      window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
      window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      window.gtag('js',new Date());
      window.gtag('config',GA,{send_page_view:false,page_location:CANONICAL,page_referrer:'',page_title:document.title,allow_google_signals:false,allow_ad_personalization_signals:false});
      const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+GA;document.head.append(s);gaLoaded=true;
    }else if(gaLoaded)window.gtag('consent','update',{analytics_storage:value?'granted':'denied'});
    if(value&&!viewed){track('page_view',{page_title:document.title});track('solar_view');viewed=true;}
    $('analytics-allow').setAttribute('aria-pressed',String(value));$('analytics-deny').setAttribute('aria-pressed',String(!value));
    $('analytics-deny').textContent=value?'Desactivar medición':'Mantener desactivada';
    $('analytics-status').textContent=value?'Medición activada. Puedes desactivarla aquí.':'Medición desactivada.';
  }
  $('analytics-allow').addEventListener('click',()=>consent(true,true));
  $('analytics-deny').addEventListener('click',()=>consent(false,true));
  let savedConsent=false;try{savedConsent=localStorage.getItem(CONSENT)==='granted';}catch(_){}
  consent(savedConsent,false);
  function interaction(action) {
    if(!allowed)return;
    if(!started){track('solar_start');started=true;}
    // At most one explore event per consecutive control family, not every slider tick.
    if(action!==lastAction){track('solar_explore',{action});lastAction=action;}
    if(!completed){track('solar_result');completed=true;}
  }
  function announce(message) {clearTimeout(announcementTimer);announcementTimer=setTimeout(()=>{$('announcement').textContent=message;},180);}

  function readLink() {
    if(!location.hash.includes('='))return;
    try{
      if(location.hash.length>700)throw Error('long');
      const params=new URLSearchParams(location.hash.slice(1));
      if(params.get('v')!=='1')throw Error('version');
      const draft={...core.DEFAULTS},seen=new Set();
      for(const [key,value] of params){
        if(seen.has(key))throw Error('duplicate');seen.add(key);
        if(key==='v')continue;
        if(!Object.prototype.hasOwnProperty.call(SERIAL,key)||!value.trim())throw Error('field');
        if(key!=='c'&&!/^(?:\d+)(?:\.\d+)?$/.test(value))throw Error('number');
        draft[SERIAL[key]]=key==='c'?value:Number(value);
      }
      const checked=core.validateState(draft);if(!checked.valid)throw Error('state');state={...checked.state};
      $('share-status').textContent='Ejemplo compartido cargado. Puedes cambiar todos sus ajustes.';
    }catch(_){$('share-status').textContent='El enlace contiene ajustes no válidos. Mostramos el ejemplo inicial.';}
  }
  function shareURL() {
    const params=new URLSearchParams({v:'1'});
    for(const [key,value] of Object.entries(SERIAL))params.set(key,String(state[value]));
    const local=['localhost','127.0.0.1'].includes(location.hostname);
    return (local?location.origin+location.pathname:CANONICAL)+'#'+params.toString();
  }
  function populate() {
    for(const c of core.CITIES){const o=text('option',c.name);o.value=c.id;$('city').append(o);}
    for(let i=0;i<12;i++){const o=text('option',MONTHS[i]);o.value=String(i+1);$('month').append(o);}
    for(const id of ['bearingA','bearingB'])for(let i=0;i<8;i++){const o=text('option',DIRECTIONS[i]);o.value=String(i*45);$(id).append(o);}
  }
  function syncInputs() {
    $('city').value=state.city;$('month').value=String(state.month);$('minute').value=String(state.minute);
    for(const key of FIELDS)$(key).value=state[key];
    for(const side of ['A','B']){
      const select=$('bearing'+side),bearing=state['bearing'+side];
      for(const o of select.querySelectorAll('[data-custom]'))o.remove();
      if(bearing%45!==0){const o=text('option',direction(bearing)+' · '+number(bearing,1)+'°');o.value=String(bearing);o.dataset.custom='true';select.append(o);}
      select.value=String(bearing);$('angle'+side).value=bearing;
    }
    $('obstruction').value=state.obstruction;
    $('obstruction-value').textContent=number(state.obstruction)+'°';
  }

  // An orthographic axonometric view: every visible polygon uses the same metre-to-pixel transform.
  function roomSVG(key, geometry, projection, sun, bearing) {
    const W=geometry.roomWidth,D=geometry.roomDepth,s=Math.min(48,355/(W+D));
    const ox=280-(W-D)*s*.433,oy=150;
    const p=(x,y,z=0)=>[ox+((x+W/2)-y)*s*.866,oy+((x+W/2)+y)*s*.5-z*s];
    const pt=values=>values.map(v=>p(...v).map(n=>n.toFixed(2)).join(',')).join(' ');
    const floor=[[-W/2,0],[W/2,0],[W/2,D],[-W/2,D]];
    const wall=[[-W/2,0,0],[W/2,0,0],[W/2,0,3],[-W/2,0,3]];
    const x=geometry.windowWidth/2,z=geometry.sill,top=z+geometry.windowHeight;
    const win=[[-x,0,z],[x,0,z],[x,0,top],[-x,0,top]];
    const lit=projection.status==='floor'||projection.status==='wall',night=projection.status==='night';
    const color=key==='a'?'#266956':'#4863a0';
    // Project geographic north through the same camera as the room (local y points indoors).
    const bearingRad=bearing*Math.PI/180;
    const northRotation=Math.atan2(.866*(Math.cos(bearingRad)-Math.sin(bearingRad)),.5*(Math.sin(bearingRad)+Math.cos(bearingRad)))*180/Math.PI;
    let grid='';
    for(let i=1;i<W;i++)grid+=`<polyline points="${pt([[-W/2+i,0],[-W/2+i,D]])}"/>`;
    for(let i=1;i<D;i++)grid+=`<polyline points="${pt([[-W/2,i],[W/2,i]])}"/>`;
    const patch=projection.lit?`<polygon points="${pt(projection.polygon)}" fill="#edb65e" stroke="#b97b26" stroke-width="1"/>`:'';
    const dim1=p(-W/2,D+.25),dim2=p(W/2,D+.25),dm=[(dim1[0]+dim2[0])/2,(dim1[1]+dim2[1])/2];
    const description=projection.lit?'Sol directo en una parte del suelo.':({night:'El Sol está bajo el horizonte.',behind:'El Sol está al otro lado de la fachada.',obstructed:'El horizonte de ejemplo bloquea el Sol.',wall:'El Sol llega a la ventana; la proyección no toca el suelo.'}[projection.status]);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="70 0 435 365" role="img" aria-labelledby="svg-title-${key} svg-desc-${key}"><title id="svg-title-${key}">Ventana ${key.toUpperCase()}, orientación ${esc(direction(bearing))}</title><desc id="svg-desc-${key}">${esc(description)} Habitación de ${W} por ${D} metros. Geometría ideal sin muebles.</desc>
      <ellipse cx="280" cy="344" rx="174" ry="17" fill="#1d423b" opacity=".055"/>
      <polygon points="${pt(floor)}" fill="${night?'#bbc9c7':'#f8f5e9'}" stroke="#81978e" stroke-width="1.4"/>
      <g fill="none" stroke="#c8ccbb" stroke-width=".65">${grid}</g>
      ${patch}
      <polygon points="${pt(wall)}" fill="${night?'#6f8c90':'#d2ded8'}" stroke="#81978e" stroke-width="1.3"/>
      <polyline points="${pt([[-W/2,0,3],[W/2,0,3]])}" fill="none" stroke="#f7faf5" stroke-width="5"/>
      <polygon points="${pt(win)}" fill="${lit?'#ffe1a2':night?'#355566':'#b2cfda'}" stroke="#fffdf2" stroke-width="7" stroke-linejoin="miter"/>
      <polyline points="${pt([[-W/2,0,0],[-W/2,D,0],[W/2,D,0],[W/2,0,0]])}" fill="none" stroke="#8e9e91" stroke-width="2"/>
      <line x1="${dim1[0]}" y1="${dim1[1]}" x2="${dim2[0]}" y2="${dim2[1]}" stroke="#8e9e91" stroke-width=".7"/>
      <text x="${dm[0]}" y="${dm[1]+17}" text-anchor="middle" fill="#51675e" font-family="sans-serif" font-size="11">${number(W,1)} m</text>
      <g transform="translate(475 75)"><circle r="23" fill="none" stroke="#b4c5bd" stroke-width="1"/><path d="M0 15 V-14 M-5 -8 L0 -15 L5 -8" fill="none" stroke="${color}" stroke-width="2" transform="rotate(${northRotation})"/><text x="0" y="-31" text-anchor="middle" font-size="10" font-family="sans-serif" fill="#51675e">N</text></g>
    </svg>`;
  }
  function statusText(projected) {
    switch(projected.status){
      case 'night':return ['El Sol está bajo el horizonte','La simulación no añade luz artificial.'];
      case 'behind':return ['Sin sol directo a esta hora','El Sol está al otro lado de la fachada.'];
      case 'obstructed':return ['El obstáculo de ejemplo tapa el Sol','Prueba a bajar el ángulo de cielo tapado.'];
      case 'wall':return ['Sol en la ventana, no en el suelo','La proyección alcanzaría antes una pared.'];
      default:return ['El sol alcanza el suelo','Avanza hasta '+number(projected.depth,1)+' m desde la pared, en este modelo.'];
    }
  }
  function renderMoment() {
    const city=core.CITIES.find(c=>c.id===state.city);
    const sun=core.solarPosition(city.lat,city.lon,core.localDate(city,state.month,state.minute));
    const a=core.projectWindow(sun,state.bearingA,state,state.obstruction),b=core.projectWindow(sun,state.bearingB,state,state.obstruction);
    $('scene-a').innerHTML=roomSVG('a',state,a,sun,state.bearingA);$('scene-b').innerHTML=roomSVG('b',state,b,sun,state.bearingB);
    for(const [key,p] of [['a',a],['b',b]]){const [heading,body]=statusText(p);$(('status-'+key)).replaceChildren(text('strong',heading),document.createTextNode(body));}
    $('clock').textContent=clock(state.minute);$('minute').setAttribute('aria-valuetext',clock(state.minute)+' hora local');
    $('date-label').textContent='21 de '+MONTHS[state.month-1].toLowerCase()+' de '+core.YEAR;
    $('timezone-note').textContent='Hora local de '+city.name+' · '+(state.month>=4&&state.month<=10?'horario de verano':'horario de invierno');
    return {sun,a,b};
  }
  function renderAnnual() {
    const buttons=[],rows=[];
    annualA.forEach((a,index)=>{
      const b=annualB[index],button=text('button','','month-row');button.type='button';button.dataset.month=a.month;
      button.setAttribute('aria-label',MONTHS[index]+': ventana A '+duration(a.facadeMinutes)+', ventana B '+duration(b.facadeMinutes)+'. Explorar este mes.');
      button.setAttribute('aria-pressed',String(state.month===a.month));
      button.append(text('span',MONTHS[index].slice(0,3),'month-name'));
      const bars=text('span','','month-bars');bars.setAttribute('aria-hidden','true');
      for(const [side,row] of [['a',a],['b',b]]){const band=text('span','','band '+side);for(const part of row.intervals){const i=document.createElement('i');i.style.left=part.start/1440*100+'%';i.style.width=(part.end-part.start)/1440*100+'%';band.append(i);}bars.append(band);}
      const total=text('span','','month-total');total.setAttribute('aria-hidden','true');total.append(text('span',duration(a.facadeMinutes)),text('span',duration(b.facadeMinutes)));button.append(bars,total);buttons.push(button);
      const tr=document.createElement('tr');tr.append(text('th',MONTHS[index]),...([a.facadeMinutes,a.floorMinutes,b.facadeMinutes,b.floorMinutes].map(n=>text('td',duration(n)))));tr.firstChild.scope='row';rows.push(tr);
    });
    $('annual-chart').replaceChildren(...buttons);$('annual-data').replaceChildren(...rows);
  }
  function render(full = true) {
    const key=JSON.stringify([state.city,state.bearingA,state.bearingB,...FIELDS.map(f=>state[f]),state.obstruction]);
    if(key!==cacheKey){annualA=core.profileAnnual(state,state.bearingA);annualB=core.profileAnnual(state,state.bearingB);cacheKey=key;renderAnnual();}
    const moment=renderMoment();results={...moment,a:{...moment.a,...annualA[state.month-1]},b:{...moment.b,...annualB[state.month-1]}};
    if(full){
      $('city-note').textContent='Referencia: '+number(core.CITIES.find(c=>c.id===state.city).lat,2)+'° N. No es una dirección.';
      for(const key of ['a','b']){
        const angle=state['bearing'+key.toUpperCase()],result=results[key];
        $('heading-'+key).textContent=direction(angle);$('degrees-'+key).textContent=number(angle,1)+'°';$('table-'+key).textContent=key.toUpperCase()+' · '+direction(angle);
        $('hours-'+key).textContent=duration(result.facadeMinutes);$('floor-'+key).textContent=duration(result.floorMinutes);$('intervals-'+key).textContent=intervalText(result.intervals);
      }
      const delta=results.a.facadeMinutes-results.b.facadeMinutes;
      $('comparison-note').textContent=state.bearingA===state.bearingB?'Las dos ventanas miran al mismo rumbo: sus resultados coinciden. Cambia una para comparar.':delta===0?'Tienen la misma duración total de sol posible, pero mira los tramos: puede llegar a horas distintas.':(delta>0?'A':'B')+' tendría '+duration(Math.abs(delta))+' más de exposición directa este día. Más horas no significa una orientación mejor para todo el mundo.';
      document.querySelectorAll('[data-month]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.month)===state.month)));
    }
  }
  function setInvalid(errors) {
    valid=!errors.length;$('studio').classList.toggle('is-invalid',!valid);$('input-error').hidden=valid;$('input-error').textContent=errors.join(' ');
    if(valid)FIELDS.concat(['angleA','angleB']).forEach(k=>$(k).removeAttribute('aria-invalid'));
    for(const selector of ['.theatre','.reading','.year-section']){const el=document.querySelector(selector);el.inert=!valid;el.setAttribute('aria-hidden',String(!valid));}
    $('save-image').disabled=!valid;$('copy-link').disabled=!valid;
    if(!valid){stop();announce('Corrige las medidas antes de seguir. '+errors.join(' '));}
  }
  function change(patch,action,full=true) {
    const checked=core.validateState({...state,...patch});
    state={...checked.state};
    if(!checked.valid){setInvalid(checked.errors);return false;}
    setInvalid([]);render(full);interaction(action);
    if(action!=='time')announce('Comparación actualizada. A: '+duration(results.a.facadeMinutes)+'. B: '+duration(results.b.facadeMinutes)+'.');
    return true;
  }
  function stop(){if(timer)clearInterval(timer);timer=null;$('play').setAttribute('aria-pressed','false');$('play').setAttribute('aria-label','Recorrer el día');$('play').innerHTML='<span aria-hidden="true">▶</span>';}
  function reset(){stop();state={...core.DEFAULTS};setInvalid([]);FIELDS.concat(['angleA','angleB']).forEach(k=>$(k).removeAttribute('aria-invalid'));syncInputs();render();$('share-status').textContent='Ejemplo inicial: Madrid, sur y oeste, 21 de junio de 2026.';$('link-fallback').hidden=true;track('solar_repeat');started=false;completed=false;lastAction='';announce('Ejemplo inicial recuperado.');}
  populate();readLink();syncInputs();
  try{render();$('studio').hidden=false;$('load-state').hidden=true;}catch(_){$('load-state').textContent='No se pudo iniciar el modelo en este navegador. La guía y las fuentes siguen disponibles.';return;}
  window.addEventListener('hashchange',()=>{if(!location.hash.includes('='))return;stop();state={...core.DEFAULTS};readLink();setInvalid([]);syncInputs();render();announce($('share-status').textContent);});
  $('city').addEventListener('change',e=>change({city:e.target.value},'city'));
  for(const side of ['A','B'])$('bearing'+side).addEventListener('change',e=>{if(change({['bearing'+side]:Number(e.target.value)},'bearing'))syncInputs();});
  $('month').addEventListener('change',e=>change({month:Number(e.target.value)},'month'));
  document.addEventListener('click',e=>{const button=e.target.closest('button[data-month]');if(button){change({month:Number(button.dataset.month)},'month');$('month').value=state.month;}});
  $('minute').addEventListener('input',e=>{stop();change({minute:Number(e.target.value)},'time',false);});
  for(const id of FIELDS.concat(['angleA','angleB']))$(id).addEventListener('input',()=>{
    stop();const patch={};for(const f of FIELDS)patch[f]=$(f).value.trim()===''?NaN:Number($(f).value);
    patch.bearingA=$('angleA').value.trim()===''?NaN:Number($('angleA').value);patch.bearingB=$('angleB').value.trim()===''?NaN:Number($('angleB').value);
    const ok=change(patch,id.startsWith('angle')?'bearing':'geometry');
    $(id).setAttribute('aria-invalid',String(!ok));if(ok){FIELDS.concat(['angleA','angleB']).forEach(k=>$(k).removeAttribute('aria-invalid'));for(const side of ['A','B']){const select=$('bearing'+side),bearing=state['bearing'+side];for(const o of select.querySelectorAll('[data-custom]'))o.remove();if(bearing%45){const o=text('option',direction(bearing)+' · '+number(bearing,1)+'°');o.dataset.custom='true';o.value=bearing;select.append(o);}select.value=bearing;}}
  });
  $('obstruction').addEventListener('input',e=>{change({obstruction:Number(e.target.value)},'obstruction');$('obstruction-value').textContent=number(Number(e.target.value))+'°';});
  $('play').addEventListener('click',()=>{
    if(timer){stop();return;}interaction('time');$('play').innerHTML='<span aria-hidden="true">Ⅱ</span>';$('play').setAttribute('aria-label','Pausar el recorrido');$('play').setAttribute('aria-pressed','true');
    if(state.minute>=1425){state.minute=0;render(false);$('minute').value=state.minute;}
    timer=setInterval(()=>{state.minute=Math.min(state.minute+15,1425);render(false);$('minute').value=state.minute;if(state.minute===1425)stop();},reduced.matches?1100:160);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);reduced.addEventListener('change',stop);
  $('reset').addEventListener('click',reset);
  document.querySelectorAll('[data-related]').forEach(a=>a.addEventListener('click',()=>track('solar_related_click',{destination:a.dataset.related})));
  $('copy-link').addEventListener('click',async()=>{
    const url=shareURL();
    try{if(!navigator.clipboard)throw Error('clipboard');await navigator.clipboard.writeText(url);$('share-status').textContent='Enlace copiado. Incluye los ajustes de este ejemplo, sin dirección.';}
    catch(_){$('link-fallback').value=url;$('link-fallback').hidden=false;$('link-fallback').focus();$('link-fallback').select();$('share-status').textContent='Copia el enlace del campo seleccionado.';}
    track('solar_share',{method:'link'});
  });
  async function imageFromSVG(source){const blob=new Blob([source],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);try{const img=new Image();img.src=url;await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});return img;}finally{URL.revokeObjectURL(url);}}
  async function saveImage(){
    stop();$('save-image').disabled=true;$('share-status').textContent='Preparando tu lámina…';
    // Snapshot all fields before the first await, so edits during export cannot mix two scenarios.
    const snapshot={...state},r={a:{...results.a},b:{...results.b}},sources=[$('scene-a').innerHTML,$('scene-b').innerHTML];
    try{
      const images=await Promise.all(sources.map(imageFromSVG));const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=940;const c=canvas.getContext('2d');
      c.fillStyle='#f5f3ec';c.fillRect(0,0,1200,940);c.fillStyle='#19373d';c.font='bold 18px sans-serif';c.fillText('IMOANCY  /  ATLAS DE SOL',55,58);
      c.font='48px Georgia';c.fillText('Dos ventanas. Un mismo día.',55,128);
      const city=core.CITIES.find(x=>x.id===snapshot.city);c.font='20px sans-serif';c.fillStyle='#526967';c.fillText(city.name+' · 21 de '+MONTHS[snapshot.month-1].toLowerCase()+' de '+core.YEAR+' · '+clock(snapshot.minute)+' hora local',55,174);
      for(let i=0;i<2;i++){
        const x=55+i*570,side=i?'b':'a',bearing=snapshot[i?'bearingB':'bearingA'];c.fillStyle=i?'#4863a0':'#266956';c.font='bold 22px sans-serif';c.fillText(side.toUpperCase()+' · '+direction(bearing)+' · '+number(bearing,1)+'°',x,226);
        c.drawImage(images[i],x+40,237,383*435/365,383);c.fillStyle='#19373d';c.font='38px Georgia';c.fillText(duration(r[side].facadeMinutes),x,674);c.font='17px sans-serif';c.fillText('de sol posible en la ventana',x,707);c.font='15px sans-serif';c.fillStyle='#526967';c.fillText(intervalText(r[side].intervals),x,738);
      }
      c.fillStyle='#19373d';c.fillRect(55,778,1090,1);c.font='16px sans-serif';c.fillText('Cielo despejado hipotético · Muestras de 15 min · Ciudad aproximada',55,815);c.fillStyle='#526967';c.font='15px sans-serif';c.fillText('Habitación '+number(snapshot.roomWidth,1)+' × '+number(snapshot.roomDepth,1)+' m · Ventana '+number(snapshot.windowWidth,1)+' × '+number(snapshot.windowHeight,1)+' m · Alféizar '+number(snapshot.sill,1)+' m · Cielo tapado < '+snapshot.obstruction+'°',55,845);c.fillText('No predice nubes, luminosidad, temperatura ni ahorro. Geometría ideal.',55,872);c.fillText('imoancy.com/herramientas/simulador-sol-ventana/',55,907);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('blob');
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='atlas-de-sol-imoancy.png';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      $('share-status').textContent='Lámina preparada: incluye fecha, medidas y límites del modelo.';track('solar_share',{method:'image'});
    }catch(_){$('share-status').textContent='No se pudo guardar la imagen. Puedes copiar el enlace a este ejemplo.';}
    finally{$('save-image').disabled=!valid;}
  }
  $('save-image').addEventListener('click',saveImage);
})();
