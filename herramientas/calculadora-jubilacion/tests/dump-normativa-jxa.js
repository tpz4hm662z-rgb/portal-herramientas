ObjC.import("Foundation");
function read(p){return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(p,$.NSUTF8StringEncoding,null));}
function run(argv){eval(read(argv[0]+"/js/normativa-2026.js"));console.log(JSON.stringify({voluntary:globalThis.ImoancyJubilacionNormativa2026.voluntaryEarly.table,involuntary:globalThis.ImoancyJubilacionNormativa2026.involuntaryEarly.table}));return 0;}
