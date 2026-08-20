ObjC.import("Foundation");

function read(path) {
    return ObjC.unwrap(
        $.NSString.stringWithContentsOfFileEncodingError(
            path,
            $.NSUTF8StringEncoding,
            null
        )
    );
}

function sha256(path) {
    var task = $.NSTask.alloc.init;
    var pipe = $.NSPipe.pipe;
    var data;
    var output;

    task.launchPath = "/usr/bin/shasum";
    task.arguments = ["-a", "256", path];
    task.standardOutput = pipe;
    task.launch;
    task.waitUntilExit;
    data = pipe.fileHandleForReading.readDataToEndOfFile;
    output = ObjC.unwrap($.NSString.alloc.initWithDataEncoding(data, $.NSUTF8StringEncoding));
    return output.split(/\s+/)[0];
}

function run(argv) {
    var base = argv[0];
    var files = [
        "js/science-config.js",
        "js/science-engine.js",
        "js/safety-screening.js",
        "js/passport-storage.js",
        "script.js",
        "tests/test-harness.js",
        "tests/science-engine.test.js",
        "tests/safety-screening.test.js",
        "tests/anti-regression.test.js",
        "tests/passport-storage.test.js",
        "tests/phase2-ui.test.js",
        "tests/phase2-corrections.test.js",
        "tests/phase3-seo.test.js"
    ];

    globalThis.ImoancyWaterTestBase = base;
    globalThis.ImoancyWaterTestRead = read;
    globalThis.ImoancyWaterTestSha256 = sha256;

    files.forEach(function evaluateFile(relativePath) {
        eval(read(base + "/" + relativePath));
    });

    var result = globalThis.ImoancyWaterTestHarness.result();

    result.failures.forEach(function printFailure(failure) {
        console.log("FAIL " + failure);
    });

    console.log("Tests: " + result.passed + " PASS, " + result.failed + " FAIL");

    if (result.failed > 0) {
        throw new Error(String(result.failed) + " Agua Diaria PRO tests failed.");
    }

    return 0;
}
