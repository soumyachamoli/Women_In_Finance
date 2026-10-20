var CACHE = "shecodes-v1";
var FILES = [
  "./", "index.html", "css/style.css", "manifest.json", "icons/icon-192.png", "icons/icon-512.png",
  "js/budget.js", "js/calc.js", "js/parser.js", "js/lessons.js", "js/store.js", "js/vault.js", "js/app.js"
];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      return res;
    }).catch(function () {
      return caches.match(event.request);
    })
  );
});
