ObjC.import("Foundation");

function run(argv) {
    "use strict";

    var root = argv[0];
    var failures = [];
    var passes = 0;

    function read(path) {
        return ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(
            path,
            $.NSUTF8StringEncoding,
            null
        ));
    }

    function check(condition, label) {
        if (condition) passes += 1;
        else failures.push(label);
    }

    var config = read(root + "/js/config.js");
    var script = read(root + "/js/script.js");
    var html = read(root + "/index.html");
    var testSource = [
        ";(function(){",
        "var a=calcular({fechaNacimiento:'2024-01-01',fechaReferencia:'2024-02-26',semanasGestacion:32,diasGestacion:0});",
        "check(a.secundarios.fechaProbableParto==='26 de febrero de 2024','FPP 32+0 exacta');",
        "check(a.principal==='0 días'&&a.edadCorregidaDias===0,'cero en FPP');",
        "var b=calcular({fechaNacimiento:'2024-01-01',fechaReferencia:'2024-02-25',semanasGestacion:32,diasGestacion:0});",
        "check(b.antesDeTermino&&b.edadCorregidaDias===-1,'antes de FPP');",
        "check(b.principal==='Aún no ha llegado la FPP'&&b.descripcion.indexOf('Faltan 1 día')===0,'sin edad negativa');",
        "var c=calcular({fechaNacimiento:'2024-02-20',fechaReferencia:'2024-03-10',semanasGestacion:38,diasGestacion:0});",
        "check(c.secundarios.fechaProbableParto==='5 de marzo de 2024'&&c.edadCorregidaDias===5,'cruce bisiesto');",
        "var d=calcular({fechaNacimiento:'2025-12-20',fechaReferencia:'2026-02-15',semanasGestacion:35,diasGestacion:0});",
        "check(d.secundarios.fechaProbableParto==='24 de enero de 2026'&&d.edadCorregidaDias===22,'cruce de año');",
        "var e=calcular({fechaNacimiento:'2024-01-01',fechaReferencia:'2024-06-01',semanasGestacion:22,diasGestacion:0});",
        "check(e.secundarios.prematuridad==='18 semanas','límite 22+0');",
        "var f=calcular({fechaNacimiento:'2024-01-01',fechaReferencia:'2024-01-02',semanasGestacion:39,diasGestacion:6});",
        "check(f.secundarios.prematuridad==='1 día'&&f.edadCorregidaDias===0,'límite 39+6');",
        "var g=calcular({fechaNacimiento:'2022-01-01',fechaReferencia:'2024-02-27',semanasGestacion:32,diasGestacion:0});",
        "check(g.correccionSuperada&&g.interpretacion.indexOf('frontera biológica rígida')!==-1,'contexto alrededor de 2 años');",
        "check(formatearDuracion(leerFecha('2024-01-31'),leerFecha('2024-02-29'))==='1 mes','fin de mes bisiesto');",
        "check(d.recomendaciones.join(' ').indexOf('Vacunas y citas')!==-1,'contexto vacunas');",
        "check(a.recomendaciones.join(' ').indexOf('edad corregida')!==-1,'contexto primeros 2 años');",
        "})();"
    ].join("\n");

    var evaluated = JSON.parse(eval(
        "var document={addEventListener:function(){}};" +
        "var passes=0;var failures=[];" +
        "function check(condition,label){if(condition)passes+=1;else failures.push(label);}" +
        config + "\n" + script + "\n" + testSource +
        ";JSON.stringify({passes:passes,failures:failures});"
    ));
    passes += evaluated.passes;
    failures = failures.concat(evaluated.failures);

    check(script.indexOf("La fecha de referencia no puede ser futura") === -1, "fecha futura permitida");
    check(html.indexOf('id="fechaReferencia"') !== -1 && html.indexOf("Hoy, pasado o futuro") !== -1, "microcopy fecha de referencia");
    check(config.indexOf("guiaDesarrollo") === -1, "sin guiaDesarrollo");
    check(html.indexOf("Lo que probablemente venga después") === -1, "sin próximos hitos");
    check(html.indexOf("Próximamente") === -1, "sin páginas próximamente");
    check(html.indexOf("¿Qué edad tengo que mirar?") !== -1, "bloque de contexto");

    if (failures.length) {
        throw new Error(failures.length + " FAIL: " + failures.join(" | "));
    }
    return "Edad corregida: " + passes + " PASS, 0 FAIL";
}
