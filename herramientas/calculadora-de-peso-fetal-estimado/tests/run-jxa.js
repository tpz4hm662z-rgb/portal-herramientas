ObjC.import("Foundation");

function read(path) {
    var text = ObjC.unwrap(
        $.NSString.stringWithContentsOfFileEncodingError(
            path,
            $.NSUTF8StringEncoding,
            null
        )
    );

    if (text === null || text === undefined) {
        throw new Error("Unable to read test dependency: " + path);
    }

    return String(text);
}

function discoverTestFiles(base) {
    var directory = base + "/tests";
    var fileManager = $.NSFileManager.defaultManager;
    var error = Ref();
    var entries = fileManager.contentsOfDirectoryAtPathError(directory, error);
    var files = [];
    var index;

    if (ObjC.unwrap(entries) === undefined) {
        throw new Error("Unable to inspect test directory: " + directory);
    }

    for (index = 0; index < entries.count; index += 1) {
        var name = String(ObjC.unwrap(entries.objectAtIndex(index)));
        var isDirectory = Ref();
        var fullPath;

        if (!/\.test\.js$/.test(name)) {
            continue;
        }

        fullPath = directory + "/" + name;
        if (fileManager.fileExistsAtPathIsDirectory(fullPath, isDirectory) && !isDirectory[0]) {
            files.push("tests/" + name);
        }
    }

    if (files.length === 0) {
        throw new Error("No *.test.js files found in: " + directory);
    }

    /* The accumulated-volume guard must run after every other discovered test. */
    files.sort(function deterministicTestOrder(left, right) {
        var guard = "tests/anti-regression.test.js";

        if (left === guard && right !== guard) {
            return 1;
        }
        if (right === guard && left !== guard) {
            return -1;
        }
        return left < right ? -1 : (left > right ? 1 : 0);
    });

    return files;
}

function run(argv) {
    var base = argv[0];
    var files;
    var dependencies = [
        "js/science-config.js",
        "js/science-engine.js",
        "js/safety-screening.js",
        "js/fetal-records.js",
        "tests/test-harness.js"
    ];
    var result;

    if (!base) {
        throw new Error("Pass the fetal-weight tool directory as the first argument.");
    }

    globalThis.ImoancyFetalWeightTestBase = base;
    globalThis.ImoancyFetalWeightTestRead = read;
    files = dependencies.concat(discoverTestFiles(base));

    files.forEach(function evaluateFile(relativePath) {
        var source = read(base + "/" + relativePath);

        try {
            eval(source);
        } catch (error) {
            throw new Error(
                "Failed while evaluating " + relativePath + ": " +
                (error && error.message ? error.message : String(error))
            );
        }
    });

    result = globalThis.ImoancyFetalWeightTestHarness.result();

    result.failures.forEach(function printFailure(failure) {
        console.log("FAIL " + failure);
    });

    console.log("Tests: " + result.passed + " PASS, " + result.failed + " FAIL");

    if (result.failed > 0) {
        throw new Error(String(result.failed) + " Peso Fetal PRO tests failed.");
    }

    return 0;
}
