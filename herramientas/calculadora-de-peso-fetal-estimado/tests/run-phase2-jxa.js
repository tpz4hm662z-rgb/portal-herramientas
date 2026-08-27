ObjC.import("Foundation");

function read(path) {
    var value = ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(
        path,
        $.NSUTF8StringEncoding,
        null
    ));
    if (value === null || value === undefined) {
        throw new Error("Unable to read Phase 2 dependency: " + path);
    }
    return String(value);
}

function discover(base) {
    var directory = base + "/tests/phase2";
    var manager = $.NSFileManager.defaultManager;
    var error = Ref();
    var entries = manager.contentsOfDirectoryAtPathError(directory, error);
    var files = [];
    var index;
    if (ObjC.unwrap(entries) === undefined) {
        throw new Error("Unable to inspect Phase 2 tests: " + directory);
    }
    for (index = 0; index < entries.count; index += 1) {
        var name = String(ObjC.unwrap(entries.objectAtIndex(index)));
        var isDirectory = Ref();
        var fullPath = directory + "/" + name;
        if (/\.test\.js$/.test(name) &&
            manager.fileExistsAtPathIsDirectory(fullPath, isDirectory) && !isDirectory[0]) {
            files.push("tests/phase2/" + name);
        }
    }
    files.sort();
    if (files.length === 0) {
        throw new Error("No Phase 2 *.test.js files found.");
    }
    return files;
}

function run(argv) {
    var base = argv[0];
    var dependencies;
    var result;
    if (!base) {
        throw new Error("Pass the fetal-weight tool directory as the first argument.");
    }
    globalThis.ImoancyFetalWeightTestBase = base;
    globalThis.ImoancyFetalWeightTestRead = read;
    dependencies = [
        "js/science-config.js",
        "js/science-engine.js",
        "js/safety-screening.js",
        "js/fetal-records.js",
        "js/fetal-records-storage.js",
        "js/script.js",
        "tests/test-harness.js"
    ].concat(discover(base));
    dependencies.forEach(function load(relativePath) {
        try {
            eval(read(base + "/" + relativePath));
        } catch (error) {
            throw new Error("Failed while evaluating " + relativePath + ": " +
                (error && error.message ? error.message : String(error)));
        }
    });
    result = globalThis.ImoancyFetalWeightTestHarness.result();
    result.failures.forEach(function report(failure) { console.log("FAIL " + failure); });
    console.log("Phase 2 tests: " + result.passed + " PASS, " + result.failed + " FAIL");
    if (result.failed > 0) {
        throw new Error(String(result.failed) + " Peso Fetal PRO Phase 2 tests failed.");
    }
    return 0;
}
