/* اسپلش‌اسکرین ورود — یک‌بار در هر نشست نمایش داده می‌شود و پس از آماده‌شدن صفحه محو می‌شود. */
/* وقتی نسخه‌ی جدید service worker کنترل صفحه را می‌گیرد، یک‌بار صفحه تازه می‌شود
   تا کاربر هیچ‌وقت روی نسخه‌ی قدیمیِ کش‌شده گیر نکند. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  var reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (reloading || !navigator.serviceWorker.controller) return;
    reloading = true;
    location.reload();
  });
})();

(function () {
  "use strict";

  var KEY = "sog:splashSeen";
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
  if (seen) return;

  /* روی‌هم‌رفته حدود دو ثانیه: ۱٫۷۵ ثانیه ماندن + ۰٫۲۵ ثانیه محوشدن */
  var MIN_MS = 1750;
  var MAX_MS = 1750;
  var start = Date.now();

  var box = document.createElement("div");
  box.id = "sogSplash";
  box.setAttribute("role", "status");
  box.setAttribute("aria-label", "در حال بارگذاری اپلیکیشن سوگ");
  box.innerHTML =
    '<video class="splash-video" src="assets/video/splash.mp4" autoplay muted loop playsinline ' +
      'preload="auto" aria-hidden="true" tabindex="-1"></video>' +
    '<div class="splash-scrim" aria-hidden="true"></div>' +
    '<div class="splash-inner">' +
      '<div class="splash-mark"><img src="assets/img/logo.png" alt="سوگ"></div>' +
      '<div class="splash-tag">مرجع ثبت سوگ ایرانیان</div>' +
      '<div class="splash-bar"><span></span></div>' +
    '</div>' +
    '<div class="splash-foot">یادِ رفتگان، زنده در دل‌های ما</div>';

  function mount() {
    if (!document.body) return;
    document.body.appendChild(box);
    document.body.style.overflow = "hidden";
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
    // بعضی مرورگرها پخش خودکار را فقط پس از فراخوانی صریح play() شروع می‌کنند.
    var vid = box.querySelector(".splash-video");
    if (vid) {
      vid.muted = true;
      var p = vid.play();
      if (p && p.catch) p.catch(function () {});    // اگر پخش ممکن نبود، پس‌زمینه‌ی گرادیانی می‌ماند
      vid.addEventListener("playing", function () { box.classList.add("has-video"); });
    }
  }

  function hide() {
    var wait = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(function () {
      box.classList.add("is-out");
      document.body.style.overflow = "";
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 260);
    }, wait);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.addEventListener("load", hide);
  setTimeout(hide, MAX_MS);   // ضامن اطمینان
})();
