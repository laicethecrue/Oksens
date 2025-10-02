const CACHE = "oksens-v12";
const FILES = [
  "/oksens/",
  "/oksens/index.html",
  "/oksens/styles.css",
  "/oksens/app.js",
  "/oksens/data.json"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
});

self.addEventListener("fetch", e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
