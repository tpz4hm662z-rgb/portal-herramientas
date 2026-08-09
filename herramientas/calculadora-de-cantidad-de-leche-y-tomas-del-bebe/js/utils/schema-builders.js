/** Constructores JSON-LD puros. FAQ visible y schema comparten la misma entrada. */
export function crearFaqSchema(faq){return {"@context":"https://schema.org","@type":"FAQPage",mainEntity:faq.map((item)=>({"@type":"Question",name:item.pregunta,acceptedAnswer:{"@type":"Answer",text:item.respuesta}}))};}
export function serializarSchema(schema){return JSON.stringify(schema).replace(/</g,"\\u003c");}
