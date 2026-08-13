ObjC.import("Foundation");
function read(p){return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null));}
function run(argv){const b=argv[0];eval(read(b+"/js/normativa-2026.js"));eval(read(b+"/js/core.js"));eval(read(b+"/tests/core.test.js"));const r=globalThis.ImoancyJubilacionTestResult;r.failures.forEach(x=>console.log("FAIL "+x));console.log("Tests: "+r.passed+" PASS, "+r.failed+" FAIL");return r.failed?1:0;}
