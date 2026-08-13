"use strict";

(function (root) {
    const age = [
        [2013,423,65,0,65,1],[2014,426,65,0,65,2],[2015,429,65,0,65,3],
        [2016,432,65,0,65,4],[2017,435,65,0,65,5],[2018,438,65,0,65,6],
        [2019,441,65,0,65,8],[2020,444,65,0,65,10],[2021,447,65,0,66,0],
        [2022,450,65,0,66,2],[2023,453,65,0,66,4],[2024,456,65,0,66,6],
        [2025,459,65,0,66,8],[2026,459,65,0,66,10],[2027,462,65,0,67,0]
    ].map(function (x) { return { fromYear:x[0], thresholdMonths:x[1], qualifyingAge:{years:x[2],months:x[3]}, ordinaryAge:{years:x[4],months:x[5]} }; });
    const voluntary = [
        [24,21,19,17,13],[23,17.6,16.5,15,12],[22,14.67,14,13.33,11],[21,12.57,12,11.43,10],
        [20,11,10.5,10,9.2],[19,9.78,9.33,8.89,8.4],[18,8.8,8.4,8,7.6],[17,8,7.64,7.27,6.91],
        [16,7.33,7,6.67,6.33],[15,6.77,6.46,6.15,5.85],[14,6.29,6,5.71,5.43],[13,5.87,5.6,5.33,5.07],
        [12,5.5,5.25,5,4.75],[11,5.18,4.94,4.71,4.47],[10,4.89,4.67,4.44,4.22],[9,4.63,4.42,4.21,4],
        [8,4.4,4.2,4,3.8],[7,4.19,4,3.81,3.62],[6,4,3.82,3.64,3.45],[5,3.83,3.65,3.48,3.3],
        [4,3.67,3.5,3.33,3.17],[3,3.52,3.36,3.2,3.04],[2,3.38,3.23,3.08,2.92],[1,3.26,3.11,2.96,2.81]
    ].map(function (x) { return { monthsEarly:x[0], rates:x.slice(1).map(function (v) { return v / 100; }) }; });
    const involuntary = [
        [48,30,28,26,24],[47,29.38,27.42,25.46,23.5],[46,28.75,26.83,24.92,23],[45,28.13,26.25,24.38,22.5],
        [44,27.5,25.67,23.83,22],[43,26.88,25.08,23.29,21.5],[42,26.25,24.5,22.75,21],[41,25.63,23.92,22.21,20.5],
        [40,25,23.33,21.67,20],[39,24.38,22.75,21.13,19.5],[38,23.75,22.17,20.58,19],[37,23.13,21.58,20.04,18.5],
        [36,22.5,21,19.5,18],[35,21.88,20.42,18.96,17.5],[34,21.25,19.83,18.42,17],[33,20.63,19.25,17.88,16.5],
        [32,20,18.67,17.33,16],[31,19.38,18.08,16.79,15.5],[30,18.75,17.5,16.25,15],[29,18.13,16.92,15.71,14.5],
        [28,17.5,16.33,15.17,14],[27,16.88,15.75,14.63,13.5],[26,16.25,15.17,14.08,13],[25,15.63,14.58,13.54,12.5],
        [24,15,14,13,12],[23,14.38,13.42,12.46,11.5],[22,13.75,12.83,11.92,11],[21,12.57,12,11.38,10],
        [20,11,10.5,10,9.2],[19,9.78,9.33,8.89,8.4],[18,8.8,8.4,8,7.6],[17,8,7.64,7.27,6.91],
        [16,7.33,7,6.67,6.33],[15,6.77,6.46,6.15,5.85],[14,6.29,6,5.71,5.43],[13,5.87,5.6,5.33,5.07],
        [12,5.5,5.25,5,4.75],[11,5.18,4.94,4.71,4.47],[10,4.89,4.67,4.44,4.22],[9,4.63,4.42,4.21,4],
        [8,4.4,4.2,4,3.8],[7,4.19,4,3.81,3.62],[6,3.75,3.5,3.25,3],[5,3.13,2.92,2.71,2.5],
        [4,2.5,2.33,2.17,2],[3,1.88,1.75,1.63,1.5],[2,1.25,1.17,1.08,1],[1,.63,.58,.54,.5]
    ].map(function (x) { return { monthsEarly:x[0], rates:x.slice(1).map(function (v) { return v / 100; }) }; });
    const baseRegulatoryTransition = [
        [2026,304,302,352.33],[2027,308,304,354.67],[2028,312,306,357],[2029,316,308,359.33],
        [2030,320,310,361.67],[2031,324,312,364],[2032,328,314,366.33],[2033,332,316,368.67],
        [2034,336,318,371],[2035,340,320,373.33],[2036,344,322,375.67],[2037,348,324,378]
    ].map(function (x) { return { year:x[0],windowMonths:x[1],selectedMonths:x[2],divisor:x[3] }; });
    const data = {
        version:"1.0.0", reviewedAt:"2026-08-13", jurisdiction:"ES", regime:"GENERAL_STANDARD",
        sources:[
            { id:"LGSS",url:"https://www.boe.es/buscar/act.php?id=BOE-A-2015-11724",provisions:["205","207","208","209","210","DT 7","DT 9","DT 40"] },
            { id:"SS_ORDINARY",url:"https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10963/28393/28396" },
            { id:"SS_EARLY",url:"https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/PrestacionesPensionesTrabajadores/10963/28393" }
            ,{ id:"RD_371_2023",url:"https://www.boe.es/buscar/act.php?id=BOE-A-2023-11645",provisions:["2","3","5"] }
            ,{ id:"RDL_11_2024",url:"https://www.boe.es/buscar/act.php?id=BOE-A-2024-26917",provisions:["article 1.1"] }
            ,{ id:"RD_416_2026",url:"https://www.boe.es/buscar/act.php?id=BOE-A-2026-11474",provisions:["DF 1","DF 4"] }
        ],
        ordinaryAgeCalendar:age,
        minimumOrdinaryAge:{years:65,months:0},
        minimumContributionMonths:{ ordinary:180, voluntary:420, involuntary:396 },
        specificCarence:{ monthsRequired:24, lookbackMonths:180 },
        percentageScales:[
            { fromYear:2013,toYear:2019,baseMonths:180,baseRate:.5,steps:[{months:163,rate:.0021},{months:83,rate:.0019}] },
            { fromYear:2020,toYear:2022,baseMonths:180,baseRate:.5,steps:[{months:106,rate:.0021},{months:146,rate:.0019}] },
            { fromYear:2023,toYear:2026,baseMonths:180,baseRate:.5,steps:[{months:49,rate:.0021},{months:209,rate:.0019}] },
            { fromYear:2027,toYear:null,baseMonths:180,baseRate:.5,steps:[{months:248,rate:.0019},{months:16,rate:.0018}] }
        ],
        coefficientBands:[{min:0,max:461},{min:462,max:497},{min:498,max:533},{min:534,max:null}],
        voluntaryEarly:{maxMonths:24,table:voluntary}, involuntaryEarly:{maxMonths:48,employmentRegistrationMonths:6,table:involuntary},
        baseRegulatory:{legacy:{windowMonths:300,selectedMonths:300,divisor:350},transition:baseRegulatoryTransition,favorableComparison:[{fromYear:2026,toYear:2040,windowMonths:300,selectedMonths:300,divisor:350},{fromYear:2041,toYear:2041,windowMonths:306,selectedMonths:306,divisor:357},{fromYear:2042,toYear:2042,windowMonths:312,selectedMonths:312,divisor:364},{fromYear:2043,toYear:2043,windowMonths:318,selectedMonths:318,divisor:371},{fromYear:2044,toYear:null,windowMonths:348,selectedMonths:324,divisor:378}],requiresIpc:true,lagunasRequireSpecialAnalysis:true},
        pensionPaymentsPerYear:14,
        deferredRetirement:{
            mixedOptionEffectiveDate:"2023-05-18", statutoryEnhancementEffectiveDate:"2025-04-01", mixedAdaptationPendingFrom:"2025-04-01", mixedReformEffectiveDate:"2026-08-28",
            annualPercentageRate:.04, additionalFractionRate:.02, additionalFractionMinimumMonthsExclusive:6,
            lumpSum:{baseFactor:800,annualPensionDivisor:500,exponentDenominator:1.65,longCareerThresholdMonths:534,longCareerMultiplier:1.1,fractionMultiplier:.5},
            mixedBeforeReform:{minimumYears:2,upperSplitYears:10,fixedLumpYearsFrom:11,fixedLumpYears:5},
            mixedAfterReform:{minimumYears:2,upperSplitYears:8,fixedLumpYearsFrom:9,fixedLumpYears:5,semesterMonths:6}
        }
    };
    function deepFreeze(x) { Object.getOwnPropertyNames(x).forEach(function (k) { if (x[k] && typeof x[k] === "object" && !Object.isFrozen(x[k])) deepFreeze(x[k]); }); return Object.freeze(x); }
    root.ImoancyJubilacionNormativa2026 = deepFreeze(data);
}(typeof globalThis !== "undefined" ? globalThis : this));
