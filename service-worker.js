/* Service Worker ساده برای پیش‌نمایش PWA سوگ.
   استراتژی: cache-first برای دارایی‌های ثابت، network-first برای داده‌ی JSON. */
var CACHE = "sog-preview-v13";
var ASSETS = [
  "./",
  "index.html",
  "listing.html",
  "business.html",
  "business-detail.html",
  "register.html",
  "account.html",
  "assets/css/styles.css",
  "assets/css/detail.css",
  "assets/css/business.css",
  "assets/js/app.js",
  "assets/js/detail.js",
  "assets/js/business.js",
  "assets/js/business-detail.js",
  "assets/js/util.js",
  "assets/js/nav.js",
  "assets/js/account.js",
  "assets/css/account.css",
  "assets/js/register.js",
  "assets/css/register.css",
  "assets/js/storage.js",
  "assets/fonts/Vazirmatn-Regular.woff2",
  "assets/fonts/Vazirmatn-Medium.woff2",
  "assets/fonts/Vazirmatn-Bold.woff2",
  "assets/img/logo.svg",
  "assets/img/candle.svg",
  "manifest.webmanifest"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var url = e.request.url;
  if (e.request.method !== "GET") return;

  // داده‌ی JSON: network-first تا آگهی‌ها تازه بمانند
  if (url.indexOf("/data/") !== -1 && url.indexOf(".json") !== -1) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () { return caches.match(e.request); })
    );
    return;
  }

  // بقیه: cache-first
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      return cached || fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    })
  );
});
