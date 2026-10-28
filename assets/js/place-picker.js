/* انتخاب شهر یا روستا از تقسیمات کشوری (مرکز آمار ایران، مرداد ۱۳۹۹).
   استان ← شهرستان ← شهرها و روستاهای همان شهرستان (به تفکیک دهستان) با جستجو.
   داده‌ها در data/places/ هستند و هر استان فقط وقتی لازم شد بارگذاری می‌شود.
   SogPlacePicker.open({ onPick: function (place) {} })
   place = { type: "city" | "village", name, county, province, dehestan } */
(function (g) {
  "use strict";

  var INDEX = null, CACHE = {};
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function fa(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* جستجو بدون حساسیت به «آ/ا»، «ي/ی»، «ك/ک» و فاصله‌ها */
  function norm(s) {
    return String(s || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[آأإ]/g, "ا").replace(/ة/g, "ه")
      .replace(/[‌\s]+/g, "").toLowerCase();
  }
  function loadIndex() {
    if (INDEX) return Promise.resolve(INDEX);
    return fetch("data/places/index.json").then(function (r) { return r.json(); }).then(function (d) { INDEX = d.provinces; return INDEX; });
  }
  function loadProvince(id) {
    if (CACHE[id]) return Promise.resolve(CACHE[id]);
    return fetch("data/places/p" + id + ".json").then(function (r) { return r.json(); }).then(function (d) { CACHE[id] = d; return d; });
  }

  /* برچسب نمایشی یک مکان انتخاب‌شده */
  function label(p) {
    if (!p) return "";
    return p.type === "village" ? "شهرستان " + p.county + "، روستای " + p.name : (p.county && p.county !== p.name ? "شهرستان " + p.county + "، " : "") + p.name;
  }

  function open(opts) {
    opts = opts || {};
    var back = el("div", "pp-back");
    var sheet = el("div", "pp-sheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    var head = el("div", "pp-head");
    var backBtn = el("button", "pp-nav", "‹ بازگشت"); backBtn.type = "button";
    var title = el("h3", "pp-title", "انتخاب شهر یا روستا");
    var close = el("button", "pp-x", "×"); close.type = "button"; close.setAttribute("aria-label", "بستن");
    head.appendChild(backBtn); head.appendChild(title); head.appendChild(close);
    var search = el("input", "pp-search"); search.type = "search";
    var crumbs = el("p", "pp-crumbs");
    var list = el("div", "pp-list");
    sheet.appendChild(el("div", "pp-handle"));
    sheet.appendChild(head); sheet.appendChild(search); sheet.appendChild(crumbs); sheet.appendChild(list);
    document.body.appendChild(back); document.body.appendChild(sheet);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { back.classList.add("is-in"); sheet.classList.add("is-in"); });

    function done() {
      back.classList.remove("is-in"); sheet.classList.remove("is-in");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { back.remove(); sheet.remove(); }, 220);
    }
    function onKey(e) { if (e.key === "Escape") done(); }
    document.addEventListener("keydown", onKey);
    back.addEventListener("click", done); close.addEventListener("click", done);

    var stack = [];
    function go(view) { stack.push(view); view(); }
    backBtn.addEventListener("click", function () { if (stack.length > 1) { stack.pop(); stack[stack.length - 1](); } });

    function row(text, sub, onClick, cls) {
      var b = el("button", "pp-row" + (cls ? " " + cls : ""), '<span class="pp-name">' + esc(text) + "</span>" + (sub ? '<span class="pp-sub">' + esc(sub) + "</span>" : ""));
      b.type = "button"; b.addEventListener("click", onClick);
      return b;
    }
    function pick(p) { done(); if (opts.onPick) opts.onPick(p); }
    function setUp(t, ph, crumb) {
      title.textContent = t; search.placeholder = ph; search.value = ""; crumbs.textContent = crumb || "";
      backBtn.style.visibility = stack.length > 1 ? "visible" : "hidden";
      list.scrollTop = 0;
    }

    /* ۱) استان‌ها؛ جستجو در نام همه‌ی شهرستان‌های کشور */
    function provinces() {
      setUp("انتخاب استان", "جستجوی شهرستان در کل کشور…", "");
      function paint() {
        list.innerHTML = "";
        var q = norm(search.value);
        if (q) {
          var hits = [];
          INDEX.forEach(function (p) { p[2].forEach(function (c) { if (norm(c).indexOf(q) !== -1) hits.push([p, c]); }); });
          if (!hits.length) list.appendChild(el("p", "pp-empty", "شهرستانی با این نام پیدا نشد."));
          hits.slice(0, 80).forEach(function (h) {
            list.appendChild(row(h[1], "استان " + h[0][1], function () { go(function () { county(h[0], h[1]); }); }));
          });
          return;
        }
        INDEX.forEach(function (p) {
          list.appendChild(row(p[1], fa(p[2].length) + " شهرستان", function () { go(function () { counties(p); }); }));
        });
      }
      search.oninput = paint; paint();
    }

    /* ۲) شهرستان‌های یک استان */
    function counties(p) {
      setUp("استان " + p[1], "جستجوی شهرستان…", "");
      function paint() {
        list.innerHTML = "";
        var q = norm(search.value);
        p[2].filter(function (c) { return !q || norm(c).indexOf(q) !== -1; }).forEach(function (c) {
          list.appendChild(row("شهرستان " + c, "", function () { go(function () { county(p, c); }); }));
        });
      }
      search.oninput = paint; paint();
    }

    /* ۳) شهرها و روستاهای یک شهرستان */
    function county(p, cName) {
      setUp("شهرستان " + cName, "جستجوی شهر یا روستا…", "استان " + p[1]);
      list.innerHTML = '<p class="pp-empty">در حال بارگذاری…</p>';
      loadProvince(p[0]).then(function (d) {
        var c = d.c.filter(function (x) { return x.n === cName; })[0];
        if (!c) { list.innerHTML = '<p class="pp-empty">اطلاعات این شهرستان پیدا نشد.</p>'; return; }
        var total = c.d.reduce(function (n, x) { return n + x[1].length; }, 0);
        crumbs.textContent = "استان " + p[1] + " · " + fa(c.s.length) + " شهر · " + fa(total) + " روستا";
        function paint() {
          list.innerHTML = "";
          var q = norm(search.value), n = 0;
          var cities = c.s.filter(function (s) { return !q || norm(s).indexOf(q) !== -1; });
          if (cities.length) {
            list.appendChild(el("div", "pp-group", "شهرها"));
            cities.forEach(function (s) {
              n++;
              list.appendChild(row(s, "شهر", function () { pick({ type: "city", name: s, county: cName, province: p[1] }); }, "is-city"));
            });
          }
          c.d.forEach(function (dh) {
            var vs = dh[1].filter(function (v) { return !q || norm(v).indexOf(q) !== -1; });
            if (!vs.length) return;
            list.appendChild(el("div", "pp-group", "دهستان " + esc(dh[0])));
            vs.forEach(function (v) {
              n++;
              list.appendChild(row(v, "", function () { pick({ type: "village", name: v, county: cName, province: p[1], dehestan: dh[0] }); }));
            });
          });
          if (!n) list.appendChild(el("p", "pp-empty", "با این نام چیزی در شهرستان " + esc(cName) + " پیدا نشد."));
          /* نام در فهرست نیست: نوشتن دستی */
          var own = el("div", "pp-own");
          own.appendChild(el("p", null, "روستای شما در فهرست نیست؟"));
          var inp = el("input", "pp-own-in"); inp.placeholder = "نام روستا را بنویسید"; inp.value = search.value;
          var ok = el("button", "pp-own-ok", "ثبت"); ok.type = "button";
          ok.addEventListener("click", function () {
            var v = inp.value.trim(); if (v.length < 2) { inp.focus(); return; }
            pick({ type: "village", name: v, county: cName, province: p[1], custom: true });
          });
          own.appendChild(inp); own.appendChild(ok);
          list.appendChild(own);
        }
        search.oninput = paint; paint();
      }).catch(function () { list.innerHTML = '<p class="pp-empty">بارگذاری نشد؛ اتصال اینترنت را بررسی کنید.</p>'; });
    }

    loadIndex().then(function () { go(provinces); })
      .catch(function () { list.innerHTML = '<p class="pp-empty">بارگذاری نشد؛ اتصال اینترنت را بررسی کنید.</p>'; });
  }

  g.SogPlacePicker = { open: open, label: label };
})(window);
