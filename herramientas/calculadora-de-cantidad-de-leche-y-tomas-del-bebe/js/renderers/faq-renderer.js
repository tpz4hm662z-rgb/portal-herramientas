/** Renderiza FAQ desde la misma colección usada por FAQPage. */
import { crearElemento, vaciar } from "../utils/render-helpers.js";
export function renderFaq(faq, destino) {
  vaciar(destino);
  const fragmento = document.createDocumentFragment();
  faq.forEach((item) => { const details=crearElemento("details"); const summary=crearElemento("summary",item.pregunta); details.append(summary,crearElemento("p",item.respuesta)); fragmento.append(details); });
  destino.append(fragmento);
  return faq.length;
}
