/* Mínimo ET, revisión 2026-09-07. Fundamentos y límites: ../REVISION.md.
 * Motor puro: ninguna respuesta se almacena ni se envía a servicios externos. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PermisosFamiliares = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const convenio = 'Mínimo legal general para personas sujetas al Estatuto de los Trabajadores. Tu convenio colectivo, contrato o acuerdo aplicable puede mejorar las condiciones. No conocemos cuál te corresponde.';
  const groups = {
    pareja: 'Mi cónyuge o pareja', directa: 'Mi familia: madre, hijo, hermano…',
    afinidad: 'Familia por matrimonio: suegra, cuñado…',
    pareja_familia: 'Familia de mi pareja de hecho', otra: 'Otra relación o persona conviviente'
  };
  // [nombre cotidiano, grupo UI, cobertura: ambos/cuidados/fuera/duda, explicación].
  // ET 37.3; CC 108, 915–919; tabla institucional Canarias (solo parentescos).
  const relations = {
    conyuge: ['Cónyuge (marido o mujer)', 'pareja', 'ambos', 'El cónyuge está mencionado expresamente en ambos permisos.'],
    pareja_hecho: ['Pareja de hecho', 'pareja', 'ambos', 'La pareja de hecho está mencionada expresamente. Comprueba cómo acreditar ese vínculo; la herramienta no verifica su reconocimiento jurídico.'],
    pareja_sin_acreditar: ['Mi pareja, pero no sé si se acredita como pareja de hecho', 'pareja', 'duda', 'Una relación de pareja no acredita por sí sola la condición jurídica de pareja de hecho.'],
    madre_padre: ['Madre o padre', 'directa', 'ambos', 'Tú → madre/padre: primer grado.'],
    hijo: ['Hijo o hija', 'directa', 'ambos', 'Tú → hijo/a: primer grado. La filiación adoptiva tiene los mismos efectos legales.'],
    hermano: ['Hermano o hermana', 'directa', 'ambos', 'Tú → progenitor común → hermano/a: segundo grado. Incluye hermanos de un solo progenitor.'],
    abuelo: ['Abuelo o abuela', 'directa', 'ambos', 'Tú → madre/padre → abuelo/a: segundo grado.'],
    nieto: ['Nieto o nieta', 'directa', 'ambos', 'Tú → hijo/a → nieto/a: segundo grado.'],
    sobrino: ['Sobrino o sobrina', 'directa', 'fuera', 'Tú → progenitor → hermano/a → sobrino/a: tercer grado, fuera del límite de segundo grado.'],
    tio: ['Tío o tía', 'directa', 'fuera', 'Tú → progenitor → abuelo/a → tío/a: tercer grado.'],
    primo: ['Primo o prima', 'directa', 'fuera', 'Tú → progenitor → abuelo/a común → tío/a → primo/a: cuarto grado.'],
    suegro: ['Suegro o suegra (progenitor de mi cónyuge)', 'afinidad', 'ambos', 'Progenitor de tu cónyuge: primer grado por afinidad.'],
    hermano_conyuge: ['Cuñado/a: hermano/a de mi cónyuge', 'afinidad', 'ambos', 'Hermano/a de tu cónyuge: segundo grado por afinidad.'],
    conyuge_hermano: ['Cuñado/a: cónyuge de mi hermano/a', 'afinidad', 'ambos', 'Cónyuge de tu hermano/a: segundo grado por afinidad.'],
    yerno: ['Yerno o nuera (cónyuge de mi hijo/a)', 'afinidad', 'ambos', 'Cónyuge de tu hijo/a: primer grado por afinidad.'],
    abuelo_conyuge: ['Abuelo/a de mi cónyuge', 'afinidad', 'ambos', 'Abuelo/a de tu cónyuge: segundo grado por afinidad.'],
    nieto_conyuge: ['Nieto/a de mi cónyuge', 'afinidad', 'ambos', 'Nieto/a de tu cónyuge: segundo grado por afinidad.'],
    conyuge_nieto: ['Cónyuge de mi nieto/a', 'afinidad', 'ambos', 'Cónyuge de tu nieto/a: segundo grado por afinidad.'],
    hijo_conyuge: ['Hijo/a de mi cónyuge (hijastro/a)', 'afinidad', 'ambos', 'Hijo/a de tu cónyuge: primer grado por afinidad.'],
    conyuge_progenitor: ['Cónyuge de mi madre/padre (padrastro/madrastra)', 'afinidad', 'ambos', 'Cónyuge de tu progenitor: primer grado por afinidad.'],
    padre_pareja: ['Madre o padre de mi pareja de hecho', 'pareja_familia', 'cuidados', 'Familiar consanguíneo de primer grado de tu pareja de hecho: incluido expresamente para cuidados, no equiparado automáticamente a afinidad para fallecimiento.'],
    hijo_pareja: ['Hijo/a de mi pareja de hecho', 'pareja_familia', 'cuidados', 'Familiar consanguíneo de primer grado de tu pareja de hecho: incluido para cuidados.'],
    hermano_pareja: ['Hermano/a de mi pareja de hecho', 'pareja_familia', 'cuidados', 'Familiar consanguíneo de segundo grado de tu pareja de hecho: incluido para cuidados.'],
    abuelo_pareja: ['Abuelo/a de mi pareja de hecho', 'pareja_familia', 'cuidados', 'Familiar consanguíneo de segundo grado de tu pareja de hecho: incluido para cuidados.'],
    nieto_pareja: ['Nieto/a de mi pareja de hecho', 'pareja_familia', 'cuidados', 'Familiar consanguíneo de segundo grado de tu pareja de hecho: incluido para cuidados.'],
    otro_pareja: ['Otro familiar de mi pareja de hecho', 'pareja_familia', 'duda', 'Falta precisar el vínculo y el grado respecto de tu pareja de hecho. No se extiende automáticamente a toda su familia.'],
    conviviente: ['Persona sin parentesco familiar', 'otra', 'fuera', 'No hace falta parentesco para la vía de convivencia y cuidado efectivo del artículo 37.3.b; esa vía no figura en el permiso por fallecimiento.'],
    otra: ['Otra relación / no encuentro la mía', 'otra', 'duda', 'No hemos identificado con precisión este vínculo. Puede requerir comprobar matrimonio, filiación o grado de parentesco.']
  };
  const yn = [['si', 'Sí'], ['no', 'No'], ['duda', 'No lo sé']];
  const q = (key, title, options, help = '') => ({ key, title, options, help });
  function covered(s) {
    const r = relations[s.relacion];
    return r && (r[2] === 'ambos' || (s.motivo !== 'fallecimiento' && r[2] === 'cuidados'));
  }
  function next(s) {
    if (!s.motivo) return q('motivo', '¿Qué ha ocurrido?', [['hospitalizacion','Hospitalización'],['grave','Accidente o enfermedad grave'],['operacion','Operación sin hospitalización'],['fallecimiento','Fallecimiento']], 'La hospitalización supone ingreso, no una mera visita a urgencias. Si hubo operación con ingreso, elige hospitalización.');
    if (s.motivo === 'operacion' && !s.reposo) return q('reposo','¿La operación requiere reposo domiciliario prescrito?',yn,'No necesitamos saber el diagnóstico. Comprueba el justificante de la intervención y la indicación de reposo.');
    if (s.reposo === 'no') return null;
    if (!s.grupo) return q('grupo','¿Qué relación tienes con esa persona?',Object.entries(groups),'Elige por el vínculo, sin calcular grados. Si usas «suegra» o «cuñado» sin matrimonio, entra en familia de tu pareja de hecho u otra relación.');
    if (!s.relacion) return q('relacion','Elige la relación',Object.entries(relations).filter(([,r])=>r[1]===s.grupo).map(([id,r])=>[id,r[0]]));
    if (!covered(s)) {
      if (s.motivo === 'fallecimiento') return null;
      if (!s.convive) return q('convive','¿Vive contigo en el mismo domicilio?',yn,'Para personas fuera de los vínculos expresamente incluidos, convivencia y cuidado efectivo son requisitos de esta vía.');
      if (s.convive !== 'si') return null;
      if (!s.cuidado) return q('cuidado','¿Necesita tu cuidado efectivo?',yn,'Puede ser una persona sin parentesco o un familiar fuera del segundo grado.');
      if (s.cuidado !== 'si') return null;
    }
    if (s.motivo === 'fallecimiento' && !s.desplazamiento) return q('desplazamiento','¿Necesitas desplazarte por el fallecimiento?',yn,'El ET no fija un umbral universal de kilómetros. Si dudas sobre si tu desplazamiento justifica la ampliación, elige «No lo sé».');
    if (s.motivo === 'hospitalizacion') {
      if (!s.ingreso) return q('ingreso','¿En qué situación está el ingreso?', [['actual','Sigue ingresada'],['alta','Ya ha recibido el alta hospitalaria'],['duda','No lo sé']]);
      if (s.ingreso === 'alta') {
        if (!s.continuidad) return q('continuidad','¿Qué consta después del alta?', [['reposo','Reposo domiciliario prescrito, sin alta médica'],['cuidados','Continúan los cuidados, pero no consta lo anterior'],['recuperada','Alta médica y recuperación, sin cuidados pendientes'],['duda','No lo sé']], 'Alta del hospital y alta médica no son lo mismo. No introduzcas documentos ni datos médicos aquí.');
        if (s.continuidad === 'reposo' && !s.iniciado) return q('iniciado','¿Ya habías comenzado este permiso antes del alta hospitalaria?',yn);
      }
    }
    if (['grave','operacion'].includes(s.motivo) && s.reposo !== 'duda' && !s.vigente) return q('vigente','¿Persiste la situación que motiva el permiso?',yn, s.motivo === 'grave' ? 'La gravedad debe poder justificarse; esta herramienta no la diagnostica.' : 'Se refiere a la necesidad de reposo derivada de la intervención.');
    return null;
  }
  // Replay strictly validates the path. Stale, unknown and impossible combinations never produce a legal answer.
  function inspect(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { error:'Entradas no válidas.' };
    const state = {}, path = [];
    for (let i=0;i<14;i++) {
      const question=next(state);
      if (!question) {
        if (Object.keys(input).some(k=>!Object.hasOwn(state,k))) return {error:'Hay respuestas incompatibles con este recorrido.'};
        return {state,path,question:null};
      }
      if (!Object.hasOwn(input,question.key)) {
        if (Object.keys(input).some(k=>!Object.hasOwn(state,k))) return {error:'Faltan respuestas anteriores o hay datos ajenos al recorrido.'};
        return {state,path,question};
      }
      if (!question.options.some(([v])=>v===input[question.key])) return {error:'Una respuesta no pertenece a las opciones admitidas.'};
      state[question.key]=input[question.key]; path.push(question);
    }
    return {error:'Recorrido no válido.'};
  }
  function evaluate(input) {
    const check=inspect(input);
    if (check.error) return {kind:'invalid',message:check.error};
    if (check.question) return {kind:'incomplete',question:check.question};
    const s=check.state, death=s.motivo==='fallecimiento', r=relations[s.relacion];
    const result={kind:'result',status:'determinable',days:death?2:5,referenceDays:death?2:5,
      title:'El supuesto está incluido en el mínimo legal general',
      explanation:death?'El motivo y la relación están contemplados en el artículo 37.3.b bis).':'El motivo y la relación están contemplados en el artículo 37.3.b).',
      relationship:r?r[3]:'',convenio,notes:[],checklist:['Avisa a la empresa y justifica el hecho causante y el vínculo, sin aportar información clínica innecesaria.','Consulta el convenio aplicable y tu calendario de días de trabajo.'],sources:['et','dias']};
    function conditional(text, items=[]) {result.status='condicionada';result.days=null;result.title='Necesita comprobación en tu caso';result.explanation=text;result.checklist.push(...items);}
    function outside(text) {result.status='fuera';result.days=null;result.referenceDays=null;result.title='Fuera del mínimo legal general analizado';result.explanation=text+' Esto no significa necesariamente que no tengas derecho: tu convenio colectivo puede ampliarlo.';}
    if (s.reposo==='no') {
      outside('La intervención sin hospitalización requiere reposo domiciliario para esta vía del artículo 37.3.b).');
      result.notes.push('Si también hubo accidente o enfermedad grave, comprueba ese motivo por separado. Una urgencia familiar que exija presencia inmediata puede requerir valorar el artículo 37.9, un permiso distinto.');
      return result;
    }
    if (!covered(s)) {
      if (!death && s.convive==='si' && s.cuidado==='si') result.explanation='El supuesto encaja por convivencia en el mismo domicilio y necesidad de tu cuidado efectivo, aunque no esté acreditado un parentesco incluido.';
      else if (r[2]==='duda' || s.convive==='duda' || s.cuidado==='duda') {
        conditional('No podemos confirmar el vínculo o los requisitos de convivencia y cuidado con estas respuestas.', ['Comprueba el vínculo exacto; para la vía de convivencia, el mismo domicilio y la necesidad de tu cuidado efectivo.']); return result;
      } else {
        outside(death?'Esta relación no está incluida en el permiso por fallecimiento analizado. La convivencia no amplía por sí sola este permiso.':'No se cumple la vía de parentesco incluida ni la de convivencia con cuidado efectivo con las respuestas indicadas.'); return result;
      }
    }
    if (!covered(s) && !death) result.checklist.push('Comprueba cómo justificar el domicilio compartido y la necesidad de tu cuidado efectivo.');
    if (death) {
      result.notes.push('El desplazamiento necesario amplía de dos a cuatro días. No aplicamos un número fijo de kilómetros. El inicio no se trata como una bolsa de días de libre elección; comprueba el hecho causante y tu primer día de trabajo.');
      if(s.desplazamiento==='si') result.days=result.referenceDays=4;
      if(s.desplazamiento==='duda') conditional('El motivo y la relación están incluidos: dos días con carácter general, cuatro si procede la ampliación por desplazamiento.', ['Comprueba la necesidad del desplazamiento y su acreditación.']);
    } else {
      result.notes.push('Los cinco días son la duración legal de referencia por el hecho causante; no son cinco días nuevos cada semana ni una bolsa anual. No calculamos días pendientes ya consumidos.','El desplazamiento no añade días al mínimo de cinco de esta vía. Las mejoras del convenio deben leerse en su conjunto, sin sumarlas automáticamente.');
      result.checklist.push('Revisa el justificante de ingreso, gravedad o intervención y reposo, según el motivo.');
      if(s.reposo==='duda') conditional('La relación o vía de convivencia encaja, pero falta confirmar el reposo domiciliario requerido para una operación sin hospitalización.', ['Comprueba si está prescrito el reposo domiciliario.']);
      else if(s.ingreso==='duda' || s.vigente==='duda' || s.vigente==='no') conditional('La relación y el motivo indicado encajan en el permiso de cinco días, pero no podemos confirmar el disfrute actual sin verificar si persiste la situación que lo justifica.', ['Comprueba las fechas, la persistencia de la causa y los días ya disfrutados.']);
      else if(s.ingreso==='alta') {
        result.sources.push('continuidad','inicio','an32');
        if(s.continuidad==='reposo' && s.iniciado==='si') {
          result.title='El alta hospitalaria no corta por sí sola el permiso';
          result.explanation='Con el permiso ya iniciado, reposo domiciliario prescrito y sin alta médica, la jurisprudencia respalda continuar hasta completar los cinco días; no son cinco días adicionales.';
          result.notes.push('Interpretación jurisprudencial: STS 443/2026, que reitera la STS 140/2026. No calculamos cuántos de esos días te quedan.');
        } else conditional('La relación y el motivo inicial encajan en el permiso de cinco días. No podemos determinar automáticamente si puedes iniciarlo ahora o continuar con días pendientes.', ['Comprueba las fechas de ingreso y alta, el reposo prescrito, si existe alta médica, la necesidad asistencial y cuándo empezaste el permiso.','Revisa el convenio y contrasta este caso con representación sindical o asesoramiento laboral antes de decidir los días de ausencia.']);
        result.notes.push('Alta hospitalaria no equivale a alta médica. La STS 126/2026 no autoriza automáticamente cualquier inicio posterior al alta. Si ya hay recuperación y han cesado los cuidados, no debe darse por garantizado el disfrute pendiente.');
      }
      if(s.motivo==='grave') result.notes.push('La calificación de gravedad necesita justificación; no la determina este comprobador.');
    }
    result.notes.push('Días laborables según tu calendario: un sábado o domingo cuenta si te correspondía trabajar. La distribución e inicio concretos pueden necesitar comprobación.');
    return result;
  }
  function answer(input,key,value) {
    const c=inspect(input);
    if(c.error || !c.question || c.question.key!==key) throw new Error('Pregunta fuera de secuencia');
    const out={...input,[key]:value};
    if(inspect(out).error) throw new Error('Respuesta no válida');
    return out;
  }
  function rewind(input,key) {
    const c=inspect(input); if(c.error) return {};
    const out={};for(const step of c.path){if(step.key===key)break;out[step.key]=input[step.key];}return out;
  }
  return {relations,groups,inspect,evaluate,answer,rewind,reset:()=>({})};
});
