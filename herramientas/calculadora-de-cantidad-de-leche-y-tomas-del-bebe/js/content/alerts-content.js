/** Catálogo editorial prudente. Las categorías las decide alerts-engine. */
export const ALERTS_CONTENT = Object.freeze({
  sin_alertas:{ tipo:"Información", icono:"ⓘ", titulo:"Orientación general", texto:"Con los datos disponibles no se ha generado un aviso adicional. Continúa observando el patrón global del bebé." },
  orientacion:{ tipo:"Observación", icono:"◉", titulo:"Revisa los datos y el contexto", texto:"La orientación necesita datos válidos y debe interpretarse junto con el bienestar y la evolución del bebé." },
  consultar:{ tipo:"Consultar", icono:"⚕", titulo:"Conviene consultar", texto:"El contexto indicado merece una valoración individual con pediatría, neonatología o el profesional que realiza el seguimiento." },
  valoracion_prioritaria:{ tipo:"Atención prioritaria", icono:"!", titulo:"Solicita valoración sanitaria prioritaria", texto:"Los datos indicados aconsejan una valoración sanitaria prioritaria. Esta herramienta no puede determinar la causa ni sustituye la atención profesional." },
  urgente:{ tipo:"Atención prioritaria", icono:"!", titulo:"Busca atención sanitaria", texto:"Los datos indicados aconsejan buscar atención sanitaria. Esta herramienta no diagnostica ni sustituye los servicios asistenciales." }
});
