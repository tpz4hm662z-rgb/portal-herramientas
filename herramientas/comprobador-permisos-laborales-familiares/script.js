(function () {
  'use strict';
  const $ = id => document.getElementById(id), core = window.PermisosFamiliares;
  if (!core) { $('question-help').textContent = 'No se pudo cargar el comprobador. Recarga la página o consulta la guía y las fuentes más abajo.'; return; }
  let state = {}, started = false, allowed = false, loaded = false, viewed = false;
  const measurementId = 'G-QH8MJ6LVHN', consentKey = 'imoancy_permisos_analytics';
  const canonical = 'https://imoancy.com/herramientas/comprobador-permisos-laborales-familiares/';
  // Allowlisted events only. No complete state, relationship, clinical data or result classification.
  function track(event, params = {}) {
    if (!allowed || typeof window.gtag !== 'function') return;
    window.gtag('event', event, { tool_id: 'permisos_familiares', page_location: canonical, page_referrer: '', ...params });
  }
  function analytics(value, persist) {
    allowed = value;
    window['ga-disable-' + measurementId] = !value;
    if (persist) try { localStorage.setItem(consentKey, value ? 'granted' : 'denied'); } catch (_) { /* Session choice remains usable. */ }
    if (allowed && !loaded) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      window.gtag('js',new Date());
      window.gtag('config',measurementId,{send_page_view:false,page_location:canonical,page_referrer:'',page_title:document.title,allow_google_signals:false,allow_ad_personalization_signals:false});
      const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(script);loaded=true;
    } else if(loaded) window.gtag('consent','update',{analytics_storage:value?'granted':'denied'});
    if(allowed && !viewed){track('page_view',{page_title:document.title});track('permisos_view');viewed=true;}
    $('analytics-status').textContent=value?'Medición activada. Puedes desactivarla aquí.':'Medición desactivada.';
    $('analytics-allow').setAttribute('aria-pressed',String(value));$('analytics-deny').setAttribute('aria-pressed',String(!value));
    $('analytics-deny').textContent=value?'Desactivar medición':'Mantener desactivada';
  }
  $('analytics-allow').addEventListener('click',()=>analytics(true,true));
  $('analytics-deny').addEventListener('click',()=>analytics(false,true));
  let saved=false;try{saved=localStorage.getItem(consentKey)==='granted';}catch(_){}
  analytics(saved,false);
  const element=(tag,text)=>{const node=document.createElement(tag);node.textContent=text;return node;};
  const category=()=>state.motivo==='fallecimiento'?'fallecimiento':'cuidados';
  function reset(){state=core.reset();started=false;render(true);}
  function list(id,items){$(id).replaceChildren(...items.map(text=>element('li',text)));}
  function render(focus) {
    const inspection=core.inspect(state), result=core.evaluate(state), question=inspection.question;
    if (result.kind==='invalid') {state={};render(focus);return;}
    $('summary-panel').hidden=inspection.path.length===0;
    $('summary').replaceChildren(...inspection.path.map(step=>{
      const li=element('li',step.options.find(([v])=>v===state[step.key])[1]);
      const button=element('button','Cambiar');button.type='button';button.setAttribute('aria-label','Cambiar: '+step.title);
      button.addEventListener('click',()=>{state=core.rewind(state,step.key);render(true);});li.append(button);return li;
    }));
    $('question-panel').hidden=!question;$('result').hidden=Boolean(question);
    if(question){
      $('step').textContent='Pregunta '+(inspection.path.length+1);
      $('question-title').textContent=question.title;$('question-help').textContent=question.help;
      $('options').replaceChildren(...question.options.map(([value,label])=>{
        const b=element('button',label);b.type='button';b.dataset.answer=value;
        b.addEventListener('click',()=>{
          state=core.answer(state,question.key,value);
          if(!started){track('permisos_start',{motivo:category()});started=true;}
          if(core.evaluate(state).kind==='result') track('permisos_complete',{motivo:category()});
          render(true);
        });return b;
      }));
      $('back').hidden=!inspection.path.length;$('reset').hidden=!inspection.path.length;
      if(focus)$('question-title').focus();return;
    }
    $('result').dataset.status=result.status;
    $('result-status').textContent={determinable:'Resultado determinable · mínimo general',condicionada:'Resultado condicionado',fuera:'Fuera del mínimo general'}[result.status];
    $('result-title').textContent=result.title;
    $('result-days').textContent=result.days?result.days+' días laborables retribuidos de referencia':result.referenceDays?'Permiso de referencia: '+result.referenceDays+' días · disfrute concreto por comprobar':'Revisa posibles mejoras de tu convenio';
    $('result-explanation').textContent=result.explanation;$('result-relationship').textContent=result.relationship;$('result-relationship').hidden=!result.relationship;
    $('known').textContent=result.status==='determinable'?'El supuesto indicado está contemplado. La cifra es la duración de referencia, no el saldo de días que te queda.':result.status==='fuera'?'No aparece cubierto por la vía concreta analizada con estas respuestas. No hemos examinado las mejoras de tu convenio ni otros permisos.':'La ley contempla el permiso de referencia, pero falta confirmar su aplicación concreta. La explicación anterior identifica lo que sabemos y lo que falta.';
    list('notes',result.notes);$('notes-panel').hidden=!result.notes.length;list('checklist',result.checklist);$('convenio').textContent=result.convenio;
    $('result-sources').replaceChildren(...result.sources.map(id=>{
      const li=document.createElement('li'),source=$('fuente-'+id).querySelector('a'),a=element('a',source.textContent);a.href=source.href;li.append(a);return li;
    }));
    if(focus)$('result-title').focus();
  }
  $('back').addEventListener('click',()=>{const path=core.inspect(state).path;state=core.rewind(state,path[path.length-1].key);render(true);});
  $('reset').addEventListener('click',reset);$('result-reset').addEventListener('click',reset);
  document.querySelectorAll('[data-related]').forEach(a=>a.addEventListener('click',()=>track('permisos_related_click',{destination:a.dataset.related})));
  render(false);
})();
