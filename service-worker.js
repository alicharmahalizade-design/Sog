/* Service Worker سوگ.
   سیاست: هیچ چیزی از کش سرو نمی‌شود مگر اینکه شبکه در دسترس نباشد.
   همه‌ی درخواست‌ها با cache:"no-store" می‌روند تا کش خود مرورگر هم دور زده شود؛
   کپی‌ها فقط برای حالت آفلاین نگه داشته می‌شوند. */
var CACHE = "sog-live-v103";

/* فقط چیزهای سنگین و بدون تغییر از کش خوانده می‌شوند */
function isStatic(url, dest) {
  return dest === "font" || dest === "audio" ||
         /\.(woff2?|ttf|mp3|m4a)(\?|$)/.test(url);
}

function fresh(request) {
  /* درخواست تازه و بدون کش؛ برای منابع هم‌ریشه از URL نو ساخته می‌شود */
  try {
    if (new URL(request.url).origin === self.location.origin) {
      return new Request(request.url, {
        cache: "no-store",
        credentials: "same-origin",
        headers: request.headers,
        mode: request.mode === "navigate" ? "same-origin" : request.mode,
        redirect: "follow"
      });
    }
  } catch (e) {}
  return request;
}

self.addEventListener("install", function (e) {
  /* بدون پیش‌کش؛ نسخه‌ی تازه بلافاصله فعال می‌شود */
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  var url = req.url;
  if (req.method !== "GET") return;

  /* ویدیو دست‌نخورده به مرورگر سپرده می‌شود (درخواست‌های Range) */
  if (req.destination === "video" || url.indexOf(".mp4") !== -1) return;

  /* فونت و صدا: از کش، چون تغییر نمی‌کنند */
  if (isStatic(url, req.destination)) {
    e.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return res;
        });
      })
    );
    return;
  }

  /* بقیه (HTML، JS، CSS، JSON، تصویر): همیشه از شبکه‌ی تازه؛
     کش فقط پشتیبانِ آفلاین است. */
  e.respondWith(
    fetch(fresh(req)).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        return hit || (req.mode === "navigate" ? caches.match("index.html") : undefined);
      });
    })
  );
});
