"use strict";
(function(root){
 const c=root.ImoancyJubilacionCore,N=c.NORMATIVA;let passed=0,failures=[];
 function test(name,fn){try{fn();passed+=1;}catch(e){failures.push(name+": "+e.message);}}
 function eq(a,b){if(a!==b)throw Error(String(a)+" !== "+String(b));}
 function ok(x){if(!x)throw Error("assertion failed");}
 function close(a,b){if(Math.abs(a-b)>Math.max(1,Math.abs(b))*1e-12)throw Error(a+" != "+b);}
 function base(months,extra){return Object.assign({option:c.DEFERRED_OPTION.PERCENTAGE,ordinaryRetirementDate:"2023-01-15",deferredRetirementDate:c.addMonths("2023-01-15",months),effectiveContributionMonthsDuringDeferral:months,ordinaryCarenceMet:true},extra||{});}
 [0,1,5,6,7,11].forEach(function(months){test("sin año completo "+months,function(){eq(c.calculateDeferredPercentageBonus(base(months)).status,c.STATUS.NOT_ELIGIBLE);});});
 [[12,.04,false],[13,.04,false],[18,.04,false],[23,.04,false],[24,.08,false],[30,.08,false],[31,.10,true],[35,.10,true],[36,.12,false],[42,.12,false],[43,.14,true]].forEach(function(x){test("porcentaje corte "+x[0],function(){const r=c.calculateDeferredPercentageBonus(base(x[0]));close(r.additionalPercentageRate,x[1]);eq(r.fractionRecognized,x[2]);});});
 test("mejora semestral no retroactiva",function(){const r=c.calculateDeferredPercentageBonus(base(31,{ordinaryRetirementDate:"2022-08-31",deferredRetirementDate:"2025-03-31"}));close(r.additionalPercentageRate,.08);eq(r.fractionRecognized,false);});
 test("mejora vigente desde 1 abril 2025",function(){const r=c.calculateDeferredPercentageBonus(base(31,{ordinaryRetirementDate:"2022-09-01",deferredRetirementDate:"2025-04-01"}));close(r.additionalPercentageRate,.10);});
 test("meses efectivos mandan sobre calendario",function(){const r=c.calculateDeferredPercentageBonus(base(24,{deferredRetirementDate:"2026-01-15",effectiveContributionMonthsDuringDeferral:11}));eq(r.status,c.STATUS.NOT_ELIGIBLE);eq(r.period.civilCompleteMonths,36);});
 test("meses efectivos no pueden exceder calendario",function(){eq(c.calculateDeferredPercentageBonus(base(13,{deferredRetirementDate:"2024-01-15"})).status,c.STATUS.INVALID_INPUT);});
 test("carencia desconocida no afirma derecho",function(){eq(c.calculateDeferredPercentageBonus(base(12,{ordinaryCarenceMet:undefined})).status,c.STATUS.POTENTIALLY_ELIGIBLE);});
 test("carencia incumplida",function(){eq(c.calculateDeferredPercentageBonus(base(12,{ordinaryCarenceMet:false})).status,c.STATUS.NOT_ELIGIBLE);});
 ["partialOrFlexibleRetirement","accessFromAssimilatedStatus","pensionAlreadyCaused"].forEach(function(field){test("situación fuera "+field,function(){const x={};x[field]=true;eq(c.calculateDeferredPercentageBonus(base(12,x)).status,c.STATUS.OUT_OF_SCOPE);});});
 test("pensión calculable sin máximo afectado",function(){const r=c.calculateDeferredPercentageBonus(base(24,{baseRegulatory:2000,ordinaryPercentageRate:1,pensionMaximumAnnual:40000}));eq(r.pension.status,c.STATUS.OK);close(r.pension.monthlyGrossAfterBonus,2160);close(r.pension.monthlyDifference,160);});
 test("pensión exige variables",function(){eq(c.calculateDeferredPercentageBonus(base(24)).pension.status,c.STATUS.REQUIRES_SPECIAL_ANALYSIS);});
 test("tope evita falsa precisión",function(){eq(c.calculateDeferredPercentageBonus(base(24,{baseRegulatory:3000,ordinaryPercentageRate:1,pensionMaximumAnnual:40000})).pension.status,c.STATUS.REQUIRES_SPECIAL_ANALYSIS);});
 function lump(months,extra){return base(months,Object.assign({option:c.DEFERRED_OPTION.LUMP_SUM,initialAnnualPension:14000,pensionMaximumAnnual:45000,contributedMonthsAtOrdinaryDate:500,multiplePensionsConfirmed:false,internationalProration:false},extra||{}));}
 test("tanto alzado fórmula carrera corta",function(){const r=c.calculateDeferredLumpSum(lump(24));const unit=800*Math.pow(14000/500,1/1.65);close(r.lumpSumUnit,unit);close(r.lumpSumAmount,unit*2);eq(r.lumpSumUnits,2);});
 test("tanto alzado contra referencia Decimal independiente",function(){const r=c.calculateDeferredLumpSum(lump(31,{contributedMonthsAtOrdinaryDate:534}));close(r.lumpSumAmount,16576.321233425802);});
 test("tanto alzado carrera larga 44a6m",function(){const short=c.calculateDeferredLumpSum(lump(24,{contributedMonthsAtOrdinaryDate:533})),long=c.calculateDeferredLumpSum(lump(24,{contributedMonthsAtOrdinaryDate:534}));close(long.lumpSumUnit,short.lumpSumUnit*1.1);});
 test("tanto alzado limita pensión usada al máximo",function(){const a=c.calculateDeferredLumpSum(lump(24,{initialAnnualPension:50000})),b=c.calculateDeferredLumpSum(lump(24,{initialAnnualPension:45000}));close(a.lumpSumAmount,b.lumpSumAmount);});
 [[30,2],[31,2.5],[35,2.5]].forEach(function(x){test("unidades tanto alzado "+x[0],function(){eq(c.calculateDeferredLumpSum(lump(x[0])).lumpSumUnits,x[1]);});});
 test("concurrencia requiere análisis",function(){eq(c.calculateDeferredLumpSum(lump(24,{multiplePensionsConfirmed:true})).status,c.STATUS.REQUIRES_SPECIAL_ANALYSIS);});
 test("prorrata internacional fuera",function(){eq(c.calculateDeferredLumpSum(lump(24,{internationalProration:true})).status,c.STATUS.OUT_OF_SCOPE);});
 test("mixta no existía antes RD 371",function(){const r=c.calculateDeferredMixedOption(lump(24,{deferredRetirementDate:"2023-05-17",ordinaryRetirementDate:"2021-05-17"}));eq(r.reason,"MIXED_OPTION_NOT_YET_IN_FORCE");});
 function mixed(months,date,extra){return lump(months,Object.assign({option:c.DEFERRED_OPTION.MIXED,deferredRetirementDate:date,ordinaryRetirementDate:c.addMonths(date,-months)},extra||{}));}
 [[24,1,1],[36,1,2],[96,4,4],[108,4,5],[120,5,5],[132,6,5]].forEach(function(x){test("mixta RD371 "+x[0],function(){const r=c.calculateDeferredMixedOption(mixed(x[0],"2026-08-27"));eq(r.legalRegime,"RD_371_2023_ORIGINAL");eq(r.percentageYears,x[1]);eq(r.lumpSumYears,x[2]);eq(r.lumpSumSemesterRecognized,false);});});
 test("fracción vieja anterior a abril 2025 se ignora",function(){const r=c.calculateDeferredMixedOption(mixed(103,"2025-03-31"));eq(r.percentageYears,4);eq(r.lumpSumUnits,4);});
 test("vacío reglamentario mixto 2a6m",function(){const r=c.calculateDeferredMixedOption(mixed(30,"2025-04-01"));eq(r.status,c.STATUS.REQUIRES_SPECIAL_ANALYSIS);eq(r.reason,"MIXED_SEMESTER_PENDING_REGULATORY_ADAPTATION");});
 test("vacío reglamentario hasta víspera RD416",function(){eq(c.calculateDeferredMixedOption(mixed(103,"2026-08-27")).status,c.STATUS.REQUIRES_SPECIAL_ANALYSIS);});
 [[24,1,1,false],[30,1,1,true],[96,4,4,false],[102,4,4,true]].forEach(function(x){test("mixta RD416 tramo bajo "+x[0],function(){const r=c.calculateDeferredMixedOption(mixed(x[0],"2026-08-28"));eq(r.legalRegime,"RD_416_2026");eq(r.percentageYears,x[1]);eq(r.lumpSumYears,x[2]);eq(r.lumpSumSemesterRecognized,x[3]);});});
 [[108,4,5,false],[114,4,5,true],[120,5,5,false],[126,5,5,true]].forEach(function(x){test("mixta RD416 nueve o más "+x[0],function(){const r=c.calculateDeferredMixedOption(mixed(x[0],"2036-08-28"));eq(r.percentageYears,x[1]);eq(r.lumpSumYears,x[2]);eq(r.percentageSemesterRecognized,x[3]);});});
 test("frontera RD416 día anterior sin fracción",function(){eq(c.calculateDeferredMixedOption(mixed(108,"2026-08-27")).legalRegime,"RD_371_2023_ORIGINAL");});
 test("frontera RD416 día efectivo",function(){eq(c.calculateDeferredMixedOption(mixed(108,"2026-08-28")).legalRegime,"RD_416_2026");});
 test("bisiesto y fin de mes",function(){const r=c.calculateDeferredPercentageBonus(base(12,{ordinaryRetirementDate:"2024-02-29",deferredRetirementDate:"2025-02-28"}));eq(r.period.civilCompleteMonths,12);});
 [0,-1,NaN,Infinity,Number.MIN_VALUE].forEach(function(v){test("dinero hostil "+String(v),function(){eq(c.calculateDeferredLumpSum(lump(24,{initialAnnualPension:v})).status,c.STATUS.INVALID_INPUT);});});
 test("importe extremo acotado por máximo",function(){const r=c.calculateDeferredLumpSum(lump(24,{initialAnnualPension:Number.MAX_VALUE}));eq(r.status,c.STATUS.OK);ok(Number.isFinite(r.lumpSumAmount));});
 test("opción obligatoria y exclusiva",function(){eq(c.calculateDeferredRetirement(base(24,{option:"ALL"})).status,c.STATUS.INVALID_INPUT);const r=c.calculateDeferredRetirement(lump(24));eq(r.option,c.DEFERRED_OPTION.LUMP_SUM);ok(r.additionalPercentageRate===undefined);});
 test("comparador no recomienda",function(){const r=c.compareRetirementTiming({ordinary:{date:"2026-01-01"},early:{date:"2025-01-01"},deferred:base(24)});eq(r.status,c.STATUS.OK);eq(r.recommendation,null);eq(r.deferred.option,c.DEFERRED_OPTION.PERCENTAGE);});
 test("normativa demorada congelada",function(){ok(Object.isFrozen(N.deferredRetirement));ok(Object.isFrozen(N.deferredRetirement.lumpSum));});
 root.ImoancyJubilacionDeferredTestResult={passed:passed,failed:failures.length,failures:failures};
}(typeof globalThis!=="undefined"?globalThis:this));
