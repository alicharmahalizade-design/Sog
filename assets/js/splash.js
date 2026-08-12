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

  var MIN_MS = 1100;   // دست‌کم این‌قدر بماند تا پرشی دیده نشود
  var MAX_MS = 3500;   // اگر بارگذاری طول کشید، بیش از این نماند
  var start = Date.now();

  var box = document.createElement("div");
  box.id = "sogSplash";
  box.setAttribute("role", "status");
  box.setAttribute("aria-label", "در حال بارگذاری اپلیکیشن سوگ");
  box.innerHTML =
    '<div class="splash-inner">' +
      '<div class="splash-mark"><img src="assets/img/logo.png" alt="سوگ"></div>' +
      '<div class="splash-name">سوگ</div>' +
      '<div class="splash-tag">مرجع آگهی‌های سوگ ایران</div>' +
      '<div class="splash-bar"><span></span></div>' +
    '</div>' +
    '<div class="splash-foot">یادِ رفتگان، زنده در دل‌های ما</div>';

  function mount() {
    if (!document.body) return;
    document.body.appendChild(box);
    document.body.style.overflow = "hidden";
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  }

  function hide() {
    var wait = Math.max(0, MIN_MS - (Date.now() - start));
    setTimeout(function () {
      box.classList.add("is-out");
      document.body.style.overflow = "";
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 500);
    }, wait);
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);

  window.addEventListener("load", hide);
  setTimeout(hide, MAX_MS);   // ضامن اطمینان
})();
