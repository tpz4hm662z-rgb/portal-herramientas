"use strict";
const CACHE="h360-contracciones-v6";
const RECURSOS=["./","./index.html","./css/style.css","../../assets/css/herramientas-relacionadas-v1.css","./js/config.js","./js/core.js","./js/script.js","./img/preview.svg","./icons/favicon.svg"];
self.addEventListener("install",evento=>evento.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(RECURSOS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",evento=>evento.waitUntil(caches.keys().then(claves=>Promise.all(claves.filter(c=>c!==CACHE).map(c=>caches.delete(c)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",evento=>{if(evento.request.method!=="GET")return;evento.respondWith(caches.match(evento.request).then(cacheado=>cacheado||fetch(evento.request).then(respuesta=>{const copia=respuesta.clone();caches.open(CACHE).then(cache=>cache.put(evento.request,copia));return respuesta}).catch(()=>caches.match("./index.html"))))});
