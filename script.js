(function () {
    "use strict";

    var input = document.getElementById("buscador");
    var panel = document.getElementById("resultados-busqueda");
    var status = document.getElementById("estado-busqueda");
    if (!input || !panel || !status) return;

    function normalizar(texto) {
        return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    var stopWords = new Set("a al algo ante como con cual cuales cuando cuanto cuantos cuanta cuantas de del desde donde el ella en es esta estoy ha han hasta hay he la las lo los me mi mis muy necesito para pero puedo que quien quiero se segun si sin son su sus te tengo tiene tienen tu tus un una uno unos unas y yo por porque hacer saber dia dias".split(" "));
    function tokens(texto) {
        return normalizar(texto).split(/[^a-z0-9]+/).filter(function (word) {
            return word.length > 1 && !stopWords.has(word);
        });
    }
    var items = (window.ImoancySearchIndex || []).map(function (item) {
        return Object.assign({}, item, {
            titleTokens: tokens(item.title),
            searchTokens: tokens(item.title + " " + item.description + " " + item.terms + " " + item.type)
        });
    });
    function matchesWord(words, query) {
        return words.some(function (word) {
            return word === query || (query.length >= 4 && word.indexOf(query) === 0);
        });
    }
    function find(query) {
        var words = Array.from(new Set(tokens(query)));
        if (!words.length) return [];
        return items.map(function (item) {
            var matched = words.filter(function (word) { return matchesWord(item.searchTokens, word); }).length;
            var titleMatches = words.filter(function (word) { return matchesWord(item.titleTokens, word); }).length;
            return { item: item, coverage: matched / words.length, score: matched * 3 + titleMatches * 2 };
        }).filter(function (result) {
            return result.coverage >= 0.6;
        }).sort(function (a, b) {
            return b.coverage - a.coverage || b.score - a.score || a.item.url.localeCompare(b.item.url);
        }).slice(0, 6).map(function (result) { return result.item; });
    }

    function closeResults() {
        panel.hidden = true;
        status.textContent = "";
        panel.replaceChildren();
    }

    function search() {
        var query = normalizar(input.value.trim());
        if (!query) {
            closeResults();
            status.textContent = "";
            return;
        }

        var matches = find(query);

        panel.replaceChildren();
        if (!matches.length) {
            var empty = document.createElement("p");
            empty.className = "search-empty";
            empty.textContent = "No encontramos una coincidencia. Prueba con otro término o explora las categorías.";
            panel.appendChild(empty);
        } else {
            matches.forEach(function (item) {
                var result = document.createElement("a");
                result.className = "search-result";
                result.href = item.url;
                result.innerHTML = "<strong></strong><span></span>";
                result.querySelector("strong").textContent = item.title;
                result.querySelector("span").textContent = item.type;
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
