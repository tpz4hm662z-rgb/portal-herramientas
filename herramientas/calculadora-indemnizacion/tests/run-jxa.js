ObjC.import("Foundation");

function read(path) {
    const text = $.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null);
    if (!text) throw new Error("No se pudo leer " + path);
    return ObjC.unwrap(text);
}

function run(argv) {
    const base = argv[0];
    eval(read(base + "/js/normativa-2026.js"));
    eval(read(base + "/js/core.js"));
    eval(read(base + "/tests/core.test.js"));
    const result = globalThis.ImoancyIndemnizacionTestResult;
    result.failures.forEach(function (failure) { console.log("FAIL " + failure); });
    console.log("Tests: " + result.passed + " PASS, " + result.failed + " FAIL");
    if (argv[1] === "freeze") {
        eval(read(base + "/tests/freeze-audit.test.js"));
        const audit = globalThis.ImoancyIndemnizacionFreezeAuditResult;
        audit.failures.forEach(function (failure) { console.log("AUDIT FAIL " + failure); });
        console.log("Auditoría adicional: " + audit.passed + " PASS, " + audit.failed + " FAIL");
        return result.failed || audit.failed ? 1 : 0;
    }
    return result.failed ? 1 : 0;
}
