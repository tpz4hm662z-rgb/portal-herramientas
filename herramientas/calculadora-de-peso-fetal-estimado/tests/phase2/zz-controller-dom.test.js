(function testPhase21ControllerDom(root) {
    "use strict";

    var h = root.ImoancyFetalWeightTestHarness;
    var ui = root.ImoancyFetalWeightUI;
    var base = root.ImoancyFetalWeightTestBase;
    var html = root.ImoancyFetalWeightTestRead(base + "/index.html");
    var elements = {};
    var documentStub;
    var storageAdapter;

    function FakeElement(id) {
        this.id = id;
        this.tagName = "DIV";
        this.type = "";
        this.name = "";
        this.value = "";
        this.checked = false;
        this.disabled = false;
        this.hidden = true;
        this.innerHTML = "";
        this.textContent = "";
        this.selectedIndex = 0;
        this.style = {};
        this.validity = { valid: true };
        this.attributes = {};
        this.listeners = {};
        this.open = false;
    }

    FakeElement.prototype.addEventListener = function addEventListener(type, listener) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(listener);
    };

    FakeElement.prototype.dispatch = function dispatch(type, properties) {
        var event = properties || {};
        event.type = type;
        event.target = event.target || this;
        event.defaultPrevented = false;
        event.preventDefault = function preventDefault() { event.defaultPrevented = true; };
        event.propagationStopped = false;
        event.immediatePropagationStopped = false;
        event.stopPropagation = function stopPropagation() { event.propagationStopped = true; };
        event.stopImmediatePropagation = function stopImmediatePropagation() {
            event.immediatePropagationStopped = true;
            event.propagationStopped = true;
        };
        (this.listeners[type] || []).forEach(function notify(listener) { listener(event); });
        return event;
    };

    FakeElement.prototype.setAttribute = function setAttribute(name, value) {
        this.attributes[name] = String(value);
    };

    FakeElement.prototype.getAttribute = function getAttribute(name) {
        return Object.prototype.hasOwnProperty.call(this.attributes, name)
            ? this.attributes[name] : null;
    };

    FakeElement.prototype.removeAttribute = function removeAttribute(name) {
        delete this.attributes[name];
    };

    FakeElement.prototype.focus = function focus() {
        documentStub.activeElement = this;
    };

    FakeElement.prototype.scrollIntoView = function scrollIntoView() {};
    FakeElement.prototype.closest = function closest() { return null; };
    FakeElement.prototype.contains = function contains(target) { return target === this; };

    Object.defineProperty(FakeElement.prototype, "valueAsNumber", {
        get: function getValueAsNumber() {
            return this.value === "" ? NaN : Number(this.value);
        }
    });

    function input(id, type, name, value) {
        var element = elements[id];
        element.tagName = "INPUT";
        element.type = type || "number";
        element.name = name || "";
        if (value !== undefined) element.value = value;
        return element;
    }

    function select(id) {
        elements[id].tagName = "SELECT";
        return elements[id];
    }

    function button(id) {
        elements[id].tagName = "BUTTON";
        elements[id].type = "button";
        return elements[id];
    }

    function selected(name, id) {
        Object.keys(elements).forEach(function uncheck(key) {
            if (elements[key].name === name) elements[key].checked = false;
        });
        elements[id].checked = true;
    }

    function formControls(selector) {
        var values = Object.keys(elements).map(function value(key) { return elements[key]; });
        if (selector === "input") return values.filter(function isInput(value) { return value.tagName === "INPUT"; });
        if (selector === "select") return values.filter(function isSelect(value) { return value.tagName === "SELECT"; });
        if (selector === ".field-error") {
            return values.filter(function isError(value) { return /-error$/.test(value.id); });
        }
        if (selector === '[aria-invalid="true"]') {
            return values.filter(function invalid(value) { return value.getAttribute("aria-invalid") === "true"; });
        }
        return [];
    }

    function installDocument() {
        var idPattern = /\bid="([^"]+)"/g;
        var match;
        while ((match = idPattern.exec(html)) !== null) {
            elements[match[1]] = new FakeElement(match[1]);
        }

        input("input-mode-biometrics", "radio", "input-mode", "biometrics");
        input("input-mode-report", "radio", "input-mode", "report_entered");
        input("population-singleton", "radio", "pregnancy-population", "singleton_confirmed");
        input("population-multiple", "radio", "pregnancy-population", "multiple");
        input("population-unknown", "radio", "pregnancy-population", "unknown");
        input("gestational-source-established", "radio", "gestational-age-source", "established");
        input("gestational-source-not-established", "radio", "gestational-age-source", "not_established");
        input("gestational-source-unknown", "radio", "gestational-age-source", "unknown");
        ["gestational-weeks", "gestational-days", "hc-mm", "ac-mm", "fl-mm", "report-efw"]
            .forEach(function numeric(id) { input(id, "number"); });
        input("scan-date", "date");
        ["biometric-unit", "report-method", "compare-a", "compare-b"].forEach(select);
        ["calculate-observation", "reset-tool", "save-observation", "compare-records",
            "clear-passport", "recover-valid-records", "discard-corrupt-storage",
            "confirmation-accept", "confirmation-cancel"].forEach(button);

        documentStub = {
            activeElement: null,
            readyState: "complete",
            listeners: {},
            getElementById: function getElementById(id) { return elements[id] || null; },
            querySelector: function querySelector(selector) {
                var radio = /^input\[name="([^"]+)"\]:checked$/.exec(selector);
                var key;
                if (!radio) return null;
                for (key in elements) {
                    if (Object.prototype.hasOwnProperty.call(elements, key) &&
                        elements[key].name === radio[1] && elements[key].checked) return elements[key];
                }
                return null;
            },
            addEventListener: function addEventListener(type, listener) {
                if (!this.listeners[type]) this.listeners[type] = [];
                this.listeners[type].push(listener);
            },
            dispatch: function dispatch(type, properties) {
                var event = properties || {};
                event.type = type;
                event.target = event.target || this;
                event.defaultPrevented = false;
                event.propagationStopped = false;
                event.immediatePropagationStopped = false;
                event.preventDefault = function preventDefault() { event.defaultPrevented = true; };
                event.stopPropagation = function stopPropagation() { event.propagationStopped = true; };
                event.stopImmediatePropagation = function stopImmediatePropagation() {
                    event.immediatePropagationStopped = true;
                    event.propagationStopped = true;
                };
                (this.listeners[type] || []).forEach(function notify(listener) { listener(event); });
                return event;
            }
        };

        elements["fetal-form"].querySelectorAll = formControls;
        elements["storage-problem"].querySelector = function querySelector() {
            return elements["storage-problem-copy"] ||
                (elements["storage-problem-copy"] = new FakeElement("storage-problem-copy"));
        };
        elements["confirmation-panel"].querySelectorAll = function querySelectorAll() {
            return [elements["confirmation-accept"], elements["confirmation-cancel"]];
        };
        elements["confirmation-panel"].querySelector = function querySelector() { return null; };
        elements["confirmation-panel"].contains = function contains(target) {
            return target === this || target === elements["confirmation-accept"] ||
                target === elements["confirmation-cancel"] ||
                target === elements["confirmation-title"] || target === elements["confirmation-text"];
        };
        elements["confirmation-panel"].showModal = function showModal() {
            this.open = true;
            this.hidden = false;
            this.setAttribute("open", "");
        };
        elements["confirmation-panel"].close = function close() {
            this.open = false;
            this.removeAttribute("open");
        };

        storageAdapter = {
            raw: null,
            failRead: false,
            failWrite: false,
            getItem: function getItem() {
                if (this.failRead) throw new Error("blocked read");
                return this.raw;
            },
            setItem: function setItem(key, value) {
                if (this.failWrite) throw new Error("quota");
                this.raw = value;
            },
            removeItem: function removeItem() {
                if (this.failWrite) throw new Error("blocked");
                this.raw = null;
            }
        };
        root.document = documentStub;
        root.localStorage = storageAdapter;
    }

    function configureBiometrics() {
        selected("input-mode", "input-mode-biometrics");
        selected("pregnancy-population", "population-singleton");
        selected("gestational-age-source", "gestational-source-established");
        elements["gestational-weeks"].value = "32";
        elements["gestational-days"].value = "0";
        elements["biometric-unit"].value = "mm";
        elements["hc-mm"].value = "300";
        elements["ac-mm"].value = "280";
        elements["fl-mm"].value = "55";
        elements["scan-date"].value = "";
    }

    function configureReport() {
        selected("input-mode", "input-mode-report");
        selected("pregnancy-population", "population-singleton");
        selected("gestational-age-source", "gestational-source-established");
        elements["gestational-weeks"].value = "32";
        elements["gestational-days"].value = "0";
        elements["report-efw"].value = "1800";
        elements["report-method"].value = "unknown";
        elements["scan-date"].value = "";
    }

    function calculate() {
        elements["calculate-observation"].dispatch("click");
        h.ok(!elements.resultados.hidden, "calculation should expose a result");
        h.ok(!elements["save-observation"].disabled, "fresh result should be saveable");
    }

    function mutate(controlId, value, type) {
        var control = elements[controlId];
        if (value !== undefined) control.value = value;
        elements["fetal-form"].dispatch(type || "input", { target: control });
    }

    function assertInvalidated() {
        h.ok(elements.resultados.hidden, "edited result should be hidden");
        h.ok(elements["save-observation"].disabled, "edited result should not be saveable");
        storageAdapter.raw = null;
        elements["save-observation"].dispatch("click");
        h.equal(storageAdapter.raw, null, "stale snapshot must never reach storage");
    }

    installDocument();

    h.test("controller initializes against an executable document approximation", function () {
        ui.initialize();
        h.ok((elements["calculate-observation"].listeners.click || []).length === 1);
        h.ok((elements["fetal-form"].listeners.input || []).length === 1);
    });

    h.test("Enter calculates through the controller without native submission or navigation", function () {
        var event;
        configureBiometrics();
        event = elements["fetal-form"].dispatch("keydown", {
            key: "Enter",
            target: elements["hc-mm"]
        });
        h.ok(event.defaultPrevented);
        h.ok(!elements.resultados.hidden);
        h.equal(storageAdapter.raw, null);
    });

    ["hc-mm", "ac-mm", "fl-mm", "gestational-weeks", "gestational-days"].forEach(function biometricMutation(id) {
        h.test("live controller invalidates and blocks stale save after " + id, function () {
            configureBiometrics();
            calculate();
            mutate(id, String(Number(elements[id].value) + 1));
            assertInvalidated();
        });
    });

    h.test("live controller invalidates and blocks stale save after PFE", function () {
        configureReport();
        calculate();
        mutate("report-efw", "1900");
        assertInvalidated();
    });

    h.test("live controller invalidates after population changes", function () {
        configureBiometrics();
        calculate();
        selected("pregnancy-population", "population-multiple");
        mutate("population-multiple", undefined, "change");
        assertInvalidated();
    });

    h.test("live controller invalidates after clinical dating source changes", function () {
        configureBiometrics();
        calculate();
        selected("gestational-age-source", "gestational-source-unknown");
        mutate("gestational-source-unknown", undefined, "change");
        assertInvalidated();
    });

    h.test("unknown clinical dating blocks calculation visibly", function () {
        configureBiometrics();
        selected("gestational-age-source", "gestational-source-unknown");
        elements["calculate-observation"].dispatch("click");
        h.ok(elements.resultados.hidden);
        h.ok(!elements["screening-message"].hidden);
        h.ok(elements["screening-message"].innerHTML.indexOf("datación clínica") !== -1);
    });

    h.test("live controller invalidates after report method changes", function () {
        configureReport();
        calculate();
        mutate("report-method", "hadlock", "change");
        assertInvalidated();
    });

    h.test("live controller invalidates after input mode changes", function () {
        configureBiometrics();
        calculate();
        selected("input-mode", "input-mode-report");
        mutate("input-mode-report", undefined, "change");
        assertInvalidated();
    });

    h.test("live controller invalidates after biometric unit changes", function () {
        configureBiometrics();
        calculate();
        mutate("biometric-unit", "cm", "change");
        assertInvalidated();
        h.equal(elements["hc-input-unit"].textContent, "cm");
    });

    h.test("live invalidation clears stale error, Safety, save and comparison states", function () {
        configureBiometrics();
        calculate();
        elements["form-error-summary"].hidden = false;
        elements["form-error-summary"].innerHTML = "anterior";
        elements["screening-message"].hidden = false;
        elements["save-status"].textContent = "guardado anterior";
        elements["comparison-result"].hidden = false;
        elements["comparison-result"].innerHTML = "comparación anterior";
        mutate("hc-mm", "301");
        h.ok(elements["form-error-summary"].hidden);
        h.equal(elements["form-error-summary"].innerHTML, "");
        h.ok(elements["screening-message"].hidden);
        h.equal(elements["save-status"].textContent, "");
        h.ok(elements["comparison-result"].hidden);
        h.equal(elements["comparison-result"].innerHTML, "");
    });

    h.test("live field edit removes residual aria-invalid and only its error description", function () {
        var control = elements["hc-mm"];
        control.setAttribute("aria-invalid", "true");
        control.setAttribute("aria-describedby", "hc-help hc-mm-error");
        elements["hc-mm-error"].hidden = false;
        elements["hc-mm-error"].textContent = "error anterior";
        mutate("hc-mm", "300");
        h.equal(control.getAttribute("aria-invalid"), null);
        h.equal(control.getAttribute("aria-describedby"), "hc-help");
        h.ok(elements["hc-mm-error"].hidden);
        h.equal(elements["hc-mm-error"].textContent, "");
    });

    h.test("custom confirmation traps focus, closes with Escape and restores trigger", function () {
        var trigger = elements["clear-passport"];
        var panel = elements["confirmation-panel"];
        var event;
        trigger.dispatch("click");
        h.ok(!panel.hidden);
        h.equal(documentStub.activeElement, elements["confirmation-cancel"]);
        event = panel.dispatch("keydown", { key: "Tab" });
        h.ok(event.defaultPrevented);
        h.equal(documentStub.activeElement, elements["confirmation-accept"]);
        event = panel.dispatch("keydown", { key: "Tab", shiftKey: true });
        h.ok(event.defaultPrevented);
        h.equal(documentStub.activeElement, elements["confirmation-cancel"]);
        event = panel.dispatch("keydown", { key: "Escape" });
        h.ok(event.defaultPrevented);
        h.ok(panel.hidden);
        h.equal(documentStub.activeElement, trigger);
    });

    h.test("modal prevents exterior focus and clicks and handles document Escape", function () {
        var trigger = elements["clear-passport"];
        var panel = elements["confirmation-panel"];
        var outside = elements["calculate-observation"];
        var event;
        trigger.dispatch("click");
        h.ok(panel.open);
        outside.focus();
        documentStub.dispatch("focusin", { target: outside });
        h.equal(documentStub.activeElement, elements["confirmation-cancel"]);
        event = documentStub.dispatch("click", { target: outside });
        h.ok(event.defaultPrevented);
        h.ok(event.propagationStopped);
        h.ok(event.immediatePropagationStopped);
        h.equal(documentStub.activeElement, elements["confirmation-cancel"]);
        event = documentStub.dispatch("keydown", { key: "Escape", target: outside });
        h.ok(event.defaultPrevented);
        h.ok(panel.hidden);
        h.ok(!panel.open);
        h.equal(documentStub.activeElement, trigger);
    });

    h.test("Storage to UI keeps the existing Passport visible after a later read failure", function () {
        var firstSnapshot;
        configureBiometrics();
        calculate();
        elements["save-observation"].dispatch("click");
        firstSnapshot = storageAdapter.raw;
        h.ok(typeof firstSnapshot === "string");
        h.ok(elements["passport-list"].innerHTML.indexOf("Ecografía 1") !== -1);
        h.ok(elements["passport-empty"].hidden);

        storageAdapter.failRead = true;
        configureBiometrics();
        elements["hc-mm"].value = "310";
        calculate();
        elements["save-observation"].dispatch("click");

        h.equal(storageAdapter.raw, firstSnapshot);
        h.ok(elements["passport-list"].innerHTML.indexOf("Ecografía 1") !== -1);
        h.ok(elements["passport-empty"].hidden);
        h.ok(!elements["passport-content"].hidden);
        h.ok(elements["save-status"].textContent.indexOf("No se ha escrito ningún dato") !== -1);
    });
}(globalThis));
