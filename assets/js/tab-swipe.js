/* سوگ — جابه‌جایی بین تب‌های اصلی با کشیدن انگشت (مثل اینستاگرام و تلگرام)
   ترتیب تب‌ها همان نوار پایین است: آگهی‌ها ← کسب‌وکار ← ثبت سوگ ← ذخیره‌ها ← حساب من.
   در راست‌چین تب بعدی سمت چپ است؛ پس کشیدن انگشت به راست تب بعدی را می‌آورد.
   - صفحه همراه انگشت جابه‌جا می‌شود و پیش‌نمایش تب کناری از لبه وارد می‌شود
   - رها کردن پس از حدود یک‌سوم پهنا یا کشیدن سریع = رفتن به تب کناری؛ وگرنه برمی‌گردد
   - روی کاروسل‌ها، اسکرول‌های افقی، فیلدها و پنجره‌های باز کار نمی‌کند
   - صفحه‌ی تب‌های کناری از قبل بارگذاری می‌شود تا جابه‌جایی سریع باشد */
(function () {
  "use strict";

  var TABS = [
    { key: "home", label: "آگهی‌ها", href: "index.html", icon: "home" },
    { key: "business", label: "کسب‌وکار", href: "business.html", icon: "business" },
    { key: "register", label: "ثبت سوگ", href: "register.html", icon: "register" },
    { key: "saved", label: "ذخیره‌ها", href: "account.html?open=saved", icon: "saved" },
    { key: "account", label: "حساب من", href: "account.html", icon: "account" }
  ];

  function currentKey() {
    var p = location.pathname.split("/").pop() || "index.html";
    if (p === "index.html" || p === "") return "home";
    if (p === "business.html") return "business";
    if (p === "register.html") return "register";
    if (p === "account.html") return /[?&]open=saved\b/.test(location.search) ? "saved" : "account";
    return "";
  }
  var cur = currentKey();
  var idx = -1;
  TABS.forEach(function (t, i) { if (t.key === cur) idx = i; });
  if (idx < 0) return;

  var frame = document.querySelector(".app-frame");
  if (!frame) return;
  var KEY = "sog:tabSwipe";

  /* ---------- ورود نرم صفحه‌ی تازه از همان سمتی که کشیده شد ---------- */
  try {
    var mark = JSON.parse(sessionStorage.getItem(KEY) || "null");
    sessionStorage.removeItem(KEY);
    if (mark && Date.now() - mark.t < 4000) {
      var from = mark.dir === "right" ? "-38%" : "38%";
      frame.style.transition = "none";
      frame.style.transform = "translateX(" + from + ")";
      frame.style.opacity = "0";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          frame.style.transition = "transform .42s cubic-bezier(.2,.8,.2,1), opacity .3s ease";
          frame.style.transform = "";
          frame.style.opacity = "";
          setTimeout(function () { frame.style.transition = ""; }, 450);
        });
      });
    }
  } catch (e) {}

  /* ---------- پیش‌بارگذاری تب‌های کناری ---------- */
  function prefetch(t) {
    if (!t) return;
    var l = document.createElement("link");
    l.rel = "prefetch"; l.href = t.href;
    document.head.appendChild(l);
  }
  setTimeout(function () { prefetch(TABS[idx + 1]); prefetch(TABS[idx - 1]); }, 1500);

  /* ---------- پیش‌نمایش تب کناری ---------- */
  var ghost = document.createElement("div");
  ghost.className = "tab-ghost";
  ghost.setAttribute("aria-hidden", "true");
  document.body.appendChild(ghost);
  var shade = document.createElement("div");
  shade.className = "tab-shade";
  shade.setAttribute("aria-hidden", "true");
  document.body.appendChild(shade);

  function paintGhost(t) {
    var ico = window.SogIcon ? SogIcon(t.icon, 30) : "";
    ghost.innerHTML = '<span class="tg-ico">' + ico + '</span><span class="tg-lbl">' + t.label + "</span>";
  }

  /* ---------- تشخیص اینکه این لمس باید کشیدن تب باشد یا نه ---------- */
  function blocked(target) {
    if (document.body.style.overflow === "hidden") return true;            /* پاپ‌آپ یا پنجره‌ی باز */
    if (document.querySelector(".lb, .crop-modal, .pp-sheet.is-in, .notify-sheet.is-in, .story-sheet.is-in, .av-pop")) return true;
    /* ثبت سوگ: وقتی فرم شروع شده، کشیدن غیرفعال است تا اطلاعات از دست نرود */
    if (cur === "register" && !document.querySelector(".mode-card")) return true;
    for (var n = target; n && n !== document.body; n = n.parentElement) {
      if (n.nodeType !== 1) continue;
      var tag = n.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || n.isContentEditable) return true;
      if (n.hasAttribute("data-noswipe")) return true;
      if (n.scrollWidth > n.clientWidth + 2) {
        var ox = getComputedStyle(n).overflowX;
        if (ox === "auto" || ox === "scroll") return true;                 /* اسکرول افقی (کاروسل، تب‌ها، شهرها) */
      }
      var cls = n.className && n.className.baseVal == null ? n.className : "";
      if (/\b(arc-grid|arc-picker|carousel|car-track|leaflet-container|map-picker|crop-stage)\b/.test(cls)) return true;
    }
    return false;
  }

  var W = 0, x0 = 0, y0 = 0, t0 = 0, dx = 0, lock = null, target = null, active = false;

  function width() { return frame.getBoundingClientRect().width || window.innerWidth; }
  /* dx > 0 (انگشت به راست) → تب بعدی (سمت چپ در راست‌چین) */
  function neighbour(d) { return d > 0 ? TABS[idx + 1] : TABS[idx - 1]; }

  function onStart(e) {
    if (e.touches.length !== 1) return;
    var t = e.touches[0];
    /* لبه‌های صفحه برای ژست برگشت مرورگر/سیستم آزاد می‌ماند */
    if (t.clientX < 18 || t.clientX > window.innerWidth - 18) return;
    if (blocked(e.target)) return;
    W = width(); x0 = t.clientX; y0 = t.clientY; t0 = Date.now();
    dx = 0; lock = null; active = true; target = null;
  }

  function apply(d) {
    var nb = neighbour(d);
    if (!nb) d = d / 4;                                  /* اولین/آخرین تب: کش لاستیکی */
    var p = Math.min(1, Math.abs(d) / W);
    frame.style.transform = "translateX(" + d + "px)";
    frame.style.opacity = String(1 - p * 0.35);
    shade.style.opacity = String(p * 0.6);
    if (nb) {
      if (target !== nb) { target = nb; paintGhost(nb); }
      var side = d > 0 ? -1 : 1;                         /* پیش‌نمایش از لبه‌ی مقابلِ جهت حرکت می‌آید */
      var off = side * (W * 0.55) * (1 - p);
      ghost.style.opacity = String(Math.min(1, p * 2.2));
      ghost.style.transform = "translate(calc(-50% + " + off + "px), -50%) scale(" + (0.86 + p * 0.14) + ")";
      ghost.style.display = "flex";
    } else {
      ghost.style.display = "none";
      target = null;
    }
  }

  function onMove(e) {
    if (!active) return;
    var t = e.touches[0];
    var mx = t.clientX - x0, my = t.clientY - y0;
    if (!lock) {
      if (Math.abs(mx) < 10 && Math.abs(my) < 10) return;
      lock = Math.abs(mx) > Math.abs(my) * 1.3 ? "x" : "y";
      if (lock === "y") { active = false; return; }
      document.body.classList.add("is-tab-swiping");
      frame.style.transition = "none";
      ghost.style.transition = "none";
    }
    e.preventDefault();
    dx = mx;
    apply(dx);
  }

  function reset() {
    var ease = "transform .32s cubic-bezier(.2,.8,.2,1), opacity .25s ease";
    frame.style.transition = ease; ghost.style.transition = ease; shade.style.transition = "opacity .25s ease";
    frame.style.transform = ""; frame.style.opacity = "";
    ghost.style.opacity = "0"; shade.style.opacity = "0";
    setTimeout(function () {
      frame.style.transition = ""; ghost.style.display = "none";
      document.body.classList.remove("is-tab-swiping");
    }, 330);
  }

  function go(nb, d) {
    var ease = "transform .26s cubic-bezier(.4,0,.2,1), opacity .22s ease";
    frame.style.transition = ease; ghost.style.transition = ease; shade.style.transition = "opacity .22s ease";
    frame.style.transform = "translateX(" + (d > 0 ? W : -W) + "px)";
    frame.style.opacity = "0";
    ghost.style.opacity = "1";
    ghost.style.transform = "translate(-50%, -50%) scale(1)";
    shade.style.opacity = "0.6";
    /* تب مقصد در نوار پایین همان لحظه فعال دیده شود */
    var bn = document.querySelectorAll(".bottom-nav .bn-item");
    Array.prototype.forEach.call(bn, function (n, i) { n.classList.toggle("is-active", TABS[i] === nb); });
    try { sessionStorage.setItem(KEY, JSON.stringify({ dir: d > 0 ? "right" : "left", t: Date.now() })); } catch (e) {}
    setTimeout(function () { location.href = nb.href; }, 200);
  }

  function onEnd() {
    if (!active) return;
    active = false;
    if (lock !== "x") return;
    var nb = neighbour(dx);
    var v = Math.abs(dx) / Math.max(1, Date.now() - t0);           /* پیکسل بر میلی‌ثانیه */
    if (nb && (Math.abs(dx) > W * 0.32 || (v > 0.55 && Math.abs(dx) > 40))) go(nb, dx);
    else reset();
  }

  document.addEventListener("touchstart", onStart, { passive: true });
  document.addEventListener("touchmove", onMove, { passive: false });
  document.addEventListener("touchend", onEnd, { passive: true });
  document.addEventListener("touchcancel", function () { if (active && lock === "x") { active = false; reset(); } active = false; }, { passive: true });

  /* برگشت با دکمه‌ی عقب مرورگر به صفحه‌ای که در حالت کشیده‌شده مانده بود */
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { frame.style.transition = "none"; frame.style.transform = ""; frame.style.opacity = ""; ghost.style.display = "none"; shade.style.opacity = "0"; document.body.classList.remove("is-tab-swiping"); }
  });
})();
