ObjC.import("Foundation");
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
function run(argv) {
    const base = argv[0];
    eval(read(base + "/js/science-config.js"));
    eval(read(base + "/js/science-engine.js"));
    eval(read(base + "/js/tracking-schema.js"));
    eval(read(base + "/js/history-store.js"));
    eval(read(base + "/js/change-interpreter.js"));
    globalThis.ImoancyBodyFatTestBase = base;
    globalThis.ImoancyReadTestFile = read;
    globalThis.ImoancyBodyFatPhase2Suites = [];
    eval(read(base + "/tests/adversarial.test.js"));
    eval(read(base + "/tests/ui-adversarial.test.js"));
    const result = globalThis.ImoancyBodyFatPhase2Suites.reduce((total, suite) => ({
        passed: total.passed + suite.passed,
        failed: total.failed + suite.failed,
        failures: total.failures.concat(suite.failures)
    }), { passed: 0, failed: 0, failures: [] });
    result.failures.forEach(item => console.log("FAIL " + item));
    console.log("Adversarial tests: " + result.passed + " PASS, " + result.failed + " FAIL");
    return result.failed ? 1 : 0;
}
