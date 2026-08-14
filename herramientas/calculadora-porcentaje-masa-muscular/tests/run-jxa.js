ObjC.import("Foundation");
function read(path) { return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(path, $.NSUTF8StringEncoding, null)); }
function run(argv) {
    const basePath = argv[0];
    const source = ["scientific-config.js", "reference-data.js", "scientific-core.js"]
        .map((name) => read(basePath + "/js/" + name)).join("\n");
    const audit = `(function(){
        let passed=0, failures=[];
        function test(name, fn){try{fn();passed++;}catch(e){failures.push(name+": "+e.message)}}
        function ok(v){if(!v)throw Error("assertion failed")}
        function eq(a,b){if(a!==b)throw Error(String(a)+" !== "+String(b))}
        function close(a,b){if(Math.abs(a-b)>1e-10)throw Error(a+" != "+b)}
        const base={sex:"male",age:40,heightM:1.75,weightKg:75,populationGroup:"white_hispanic"};
        test("direct male",()=>close(estimateSkeletalMuscle(base).muscleKg,31.33));
        test("direct female Asian",()=>close(estimateSkeletalMuscle({sex:"female",age:35,heightM:1.65,weightKg:60,populationGroup:"asian"}).muscleKg,19.58));
        [["weightKg",76,.244],["heightM",1.76,.078],["age",41,-.098]].forEach(x=>test("metamorphic "+x[0],()=>close(estimateSkeletalMuscle(Object.assign({},base,{[x[0]]:x[1]})).muscleKg-estimateSkeletalMuscle(base).muscleKg,x[2])));
        test("metamorphic sex",()=>close(estimateSkeletalMuscle(base).muscleKg-estimateSkeletalMuscle(Object.assign({},base,{sex:"female"})).muscleKg,6.6));
        [["asian",-1.2],["african_american",1.4]].forEach(x=>test("population delta "+x[0],()=>close(estimateSkeletalMuscle(Object.assign({},base,{populationGroup:x[0]})).muscleKg-estimateSkeletalMuscle(base).muscleKg,x[1])));
        test("population Asian to African-American",()=>close(estimateSkeletalMuscle(Object.assign({},base,{populationGroup:"african_american"})).muscleKg-estimateSkeletalMuscle(Object.assign({},base,{populationGroup:"asian"})).muscleKg,2.6));
        [19,82].forEach(age=>test("age blocked "+age,()=>eq(estimateSkeletalMuscle(Object.assign({},base,{age})).validationStatus,"not_applicable_age")));
        [20,21,80,81].forEach(age=>test("age accepted "+age,()=>ok(["primary","extended_bmi"].includes(estimateSkeletalMuscle(Object.assign({},base,{age})).validationStatus))));
        [[29.99,"primary"],[30,"extended_bmi"],[30.01,"extended_bmi"]].forEach(x=>test("BMI "+x[0],()=>eq(estimateSkeletalMuscle(Object.assign({},base,{heightM:2,weightKg:x[0]*4})).validationStatus,x[1])));
        test("explicit zero adjustment",()=>{const r=estimateSkeletalMuscle(base);eq(r.populationAdjustmentApplied,true);eq(r.populationAdjustmentKg,0)});
        [undefined,null,"other","mixed","unknown","prefer_not_to_say"].forEach(group=>test("uncovered population "+String(group),()=>{const r=estimateSkeletalMuscle(Object.assign({},base,{populationGroup:group}));eq(r.populationAdjustmentApplied,false);ok(r.warnings.length)}));
        const hostile=[NaN,Infinity,-Infinity,"hola",""," ",null,undefined,[],{},-1,0,1e-300,1e300,170];
        hostile.forEach((heightM,i)=>test("hostile height "+i,()=>ok(estimateSkeletalMuscle(Object.assign({},base,{heightM})).validationStatus!=="primary")));
        hostile.forEach((weightKg,i)=>test("hostile weight "+i,()=>ok(estimateSkeletalMuscle(Object.assign({},base,{weightKg})).validationStatus!=="primary")));
        test("cm/m guard",()=>eq(estimateSkeletalMuscle(Object.assign({},base,{heightM:170})).validationStatus,"invalid_input"));
        test("cm normalizer",()=>eq(centimetresToMetres(170),1.7));
        ["170",null,NaN,Infinity,0,-1].forEach((v,i)=>test("normalizer hostile "+i,()=>eq(centimetresToMetres(v),null)));
        test("no premature rounding",()=>{const r=estimateSkeletalMuscle(Object.assign({},base,{weightKg:73.37,heightM:1.783}));close(r.musclePercent,r.muscleKg/73.37*100);ok(r.musclePercent!==roundForPresentation(r.muscleKg,1)/73.37*100)});
        ["white_hispanic","asian","african_american",undefined].forEach(group=>test("invariants "+String(group),()=>{const r=estimateSkeletalMuscle(Object.assign({},base,{populationGroup:group}));ok(Number.isFinite(r.muscleKg)&&r.muscleKg>0&&r.muscleKg<75);ok(Number.isFinite(r.musclePercent)&&r.musclePercent>0&&r.musclePercent<100);ok(Number.isFinite(r.bmi)&&r.bmi>0);eq(r.clinicalInterpretation,null);eq(r.modelSEE,2.8);ok(!("lowerBound" in r)&&!("upperBound" in r))}));
        test("physiological suppression",()=>{const r=estimateSkeletalMuscle({sex:"female",age:81,heightM:.01,weightKg:.01});eq(r.validationStatus,"physiologically_invalid");eq(r.muscleKg,null);eq(r.musclePercent,null)});
        test("reference separation",()=>{const r=estimateSkeletalMuscle(base);close(r.muscleKg,31.33);eq(r.referenceGroup,"40-49");eq(r.referenceMeanPercent,37.1);eq(r.referenceSdPercent,4.0)});
        const refs={male:[[20,29,"18-29",42.3,4.4,"standard"],[30,39,"30-39",39.1,5,"standard"],[40,49,"40-49",37.1,4,"standard"],[50,59,"50-59",35.1,3.4,"standard"],[60,69,"60-69",33.8,3.9,"standard"],[70,81,"70+",36,7.3,"limited"]],female:[[20,29,"18-29",34.1,5.7,"standard"],[30,39,"30-39",30.6,5.6,"standard"],[40,49,"40-49",29.2,5,"standard"],[50,59,"50-59",29.1,4.4,"standard"],[60,69,"60-69",27.3,4.6,"standard"],[70,81,"70+",30.2,4.7,"limited"]]};
        Object.keys(refs).forEach(sex=>refs[sex].forEach(row=>[row[0],row[1]].forEach(age=>test("MRI "+sex+" "+age,()=>{const r=estimateSkeletalMuscle(Object.assign({},base,{sex,age}));eq(r.referenceGroup,row[2]);eq(r.referenceMeanPercent,row[3]);eq(r.referenceSdPercent,row[4]);eq(r.referenceEvidence,row[5])}))));
        test("MRI reference never changes Lee values",()=>{Object.keys(refs).forEach(sex=>refs[sex].forEach(row=>[row[0],row[1]].forEach(age=>{const r=estimateSkeletalMuscle(Object.assign({},base,{sex,age})),kg=.244*75+7.8*1.75+6.6*(sex==="male"?1:0)-.098*age-3.3;close(r.muscleKg,kg);close(r.musclePercent,kg/75*100)})))});
        test("MRI output has no clinical or invented fields",()=>{Object.keys(refs).forEach(sex=>refs[sex].forEach(row=>{const r=estimateSkeletalMuscle(Object.assign({},base,{sex,age:row[0]}));eq(r.clinicalInterpretation,null);["classification","qualitativeClassification","percentile","healthyRange","idealRange"].forEach(k=>ok(!(k in r)))}))});
        test("MRI dataset integrity",()=>{eq(MUSCLE_MRI_REFERENCE_DATA.length,12);eq(new Set(MUSCLE_MRI_REFERENCE_DATA.map(r=>r.sex+":"+r.group)).size,12);ok(Object.isFrozen(MUSCLE_MRI_REFERENCE_DATA));MUSCLE_MRI_REFERENCE_DATA.forEach(r=>ok(Object.isFrozen(r)))});
        [17,89,29.5,"29",null,undefined,NaN,Infinity].forEach((age,i)=>test("MRI rejects uncovered/coerced age "+i,()=>eq(lookupMuscleMriReference("male",age),null)));
        test("MRI rejects unknown sex",()=>eq(lookupMuscleMriReference("other",40),null));
        test("broad independent formula matrix",()=>{for(let sex of ["male","female"])for(let age of [20,35,50,65,81])for(let heightM of [1.45,1.7,1.95])for(let weightKg of [55,80,120])for(let populationGroup of ["white_hispanic","asian","african_american"]){const r=estimateSkeletalMuscle({sex,age,heightM,weightKg,populationGroup});if(r.validationStatus==="physiologically_invalid")continue;const adjustment={white_hispanic:0,asian:-1.2,african_american:1.4}[populationGroup];close(r.muscleKg,.244*weightKg+7.8*heightM+6.6*(sex==="male"?1:0)-.098*age+adjustment-3.3);close(r.musclePercent,r.muscleKg/weightKg*100);ok(r.muscleKg>0&&r.muscleKg<weightKg)}});
        test("input is not mutated",()=>{const input=Object.assign({},base),before=JSON.stringify(input);estimateSkeletalMuscle(input);eq(JSON.stringify(input),before)});
        test("results have independent warnings",()=>{const a=estimateSkeletalMuscle(base),b=estimateSkeletalMuscle(base);a.warnings.push("x");ok(!b.warnings.includes("x"))});
        test("invalid sex",()=>eq(estimateSkeletalMuscle(Object.assign({},base,{sex:1})).validationStatus,"invalid_input"));
        test("fractional age",()=>eq(estimateSkeletalMuscle(Object.assign({},base,{age:40.5})).validationStatus,"invalid_input"));
        test("unknown population key",()=>eq(estimateSkeletalMuscle(Object.assign({},base,{populationGroup:"invented"})).validationStatus,"invalid_input"));
        globalThis.result={passed,failed:failures.length,failures};
    }());`;
    eval(source + "\n" + audit);
    result.failures.forEach((failure) => console.log("FAIL " + failure));
    console.log("Tests: " + result.passed + " PASS, " + result.failed + " FAIL");
    return result.failed ? 1 : 0;
}
