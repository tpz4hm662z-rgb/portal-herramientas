ObjC.import("Foundation");
function read(p){return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null));}
function run(argv){const b=argv[0];eval(read(b+"/js/normativa-2026.js"));eval(read(b+"/js/core.js"));eval(read(b+"/tests/deferred.test.js"));const r=globalThis.ImoancyJubilacionDeferredTestResult;r.failures.forEach(function(x){console.log("FAIL "+x);});console.log("Deferred tests: "+r.passed+" PASS, "+r.failed+" FAIL");return r.failed?1:0;}
