ObjC.import("Foundation");
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
function run(argv) {
    const base = argv[0];
    eval(read(base + "/js/science-config.js"));
    eval(read(base + "/js/science-engine.js"));
    eval(read(base + "/js/tracking-schema.js"));
    eval(read(base + "/js/history-store.js"));
    eval(read(base + "/js/change-interpreter.js"));
    eval(read(base + "/tests/science-engine.jxa.test.js"));
    eval(read(base + "/tests/schema.test.js"));
    eval(read(base + "/tests/storage.test.js"));
    eval(read(base + "/tests/comparability.test.js"));
    eval(read(base + "/tests/interpretation.test.js"));
    globalThis.ImoancyBodyFatTestBase = base;
    globalThis.ImoancyReadTestFile = read;
    eval(read(base + "/tests/ui-integration.test.js"));
    eval(read(base + "/tests/adversarial.test.js"));
    eval(read(base + "/tests/ui-adversarial.test.js"));
    eval(read(base + "/tests/phase3-seo.test.js"));
    const suites = [globalThis.ImoancyBodyFatTestResult].concat(globalThis.ImoancyBodyFatPhase2Suites || []);
    const result = suites.reduce((total, suite) => ({
        passed: total.passed + suite.passed,
        failed: total.failed + suite.failed,
        failures: total.failures.concat(suite.failures)
    }), { passed: 0, failed: 0, failures: [] });
    result.failures.forEach(x => console.log("FAIL " + x));
    console.log("Tests: " + result.passed + " PASS, " + result.failed + " FAIL");
    return result.failed ? 1 : 0;
}
