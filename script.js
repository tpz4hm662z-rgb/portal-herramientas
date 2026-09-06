(function () {
    "use strict";

    var input = document.getElementById("buscador");
    var panel = document.getElementById("resultados-busqueda");
    var status = document.getElementById("estado-busqueda");
    if (!input || !panel || !status) return;

    function normalizar(texto) {
        return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    var seen = new Set();
    var items = Array.from(document.querySelectorAll(".solution-link, .tarjeta")).filter(function (link) {
        if (seen.has(link.href)) return false;
        seen.add(link.href);
        link.dataset.normalizedSearch = normalizar(link.textContent + " " + (link.dataset.search || ""));
        return true;
    });

    function closeResults() {
        panel.hidden = true;
        panel.replaceChildren();
    }

    function search() {
        var query = normalizar(input.value.trim());
        if (!query) {
            closeResults();
            status.textContent = "";
            return;
        }

        var matches = items.filter(function (item) {
            return item.dataset.normalizedSearch.includes(query);
        }).slice(0, 6);

        panel.replaceChildren();
        if (!matches.length) {
            var empty = document.createElement("p");
            empty.className = "search-empty";
            empty.textContent = "No encontramos una coincidencia. Prueba con otro término o explora las categorías.";
            panel.appendChild(empty);
        } else {
            matches.forEach(function (item) {
                var result = document.createElement("a");
                var heading = item.querySelector("h3");
                var tag = item.querySelector(".content-tag");
                result.className = "search-result";
                result.href = item.href;
                result.innerHTML = "<strong></strong><span></span>";
                result.querySelector("strong").textContent = heading ? heading.textContent : item.textContent.trim();
                result.querySelector("span").textContent = tag ? tag.textContent : "Herramienta";
                panel.appendChild(result);
            });
        }
        panel.hidden = false;
        status.textContent = matches.length + (matches.length === 1 ? " solución encontrada" : " soluciones encontradas");
    }

    input.addEventListener("input", search);
    input.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeResults();
            input.focus();
        } else if (event.key === "ArrowDown" && !panel.hidden) {
            var first = panel.querySelector("a");
            if (first) {
                event.preventDefault();
                first.focus();
            }
        }
    });
    panel.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeResults();
            input.focus();
        }
    });
    document.addEventListener("click", function (event) {
        if (!event.target.closest(".buscador")) closeResults();
    });
}());
