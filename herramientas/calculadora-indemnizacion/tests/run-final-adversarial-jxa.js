ObjC.import("Foundation");
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
function run(argv) {
    const base = argv[0];
    eval(read(base + "/js/normativa-2026.js"));
    eval(read(base + "/js/core.js"));
    eval(read(base + "/tests/final-adversarial.test.js"));
    const r = globalThis.ImoancyFinalAdversarialResult;
    r.failures.forEach(function (x) { console.log("FAIL " + x); });
    console.log("Auditoría final nueva: " + r.passed + " PASS, " + r.failed + " FAIL");
    return r.failed ? 1 : 0;
}
