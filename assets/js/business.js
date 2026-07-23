/* صفحه کسب‌وکارها و خدمات مراسم سوگ — داده‌محور.
   data/businesses.json و data/cities.json. آماده‌ی CPT «کسب‌وکار» در وردپرس. */
(function () {
  "use strict";

  var DATA = { businesses: [], categories: [], cities: [] };
  var state = { city: "all", category: null, query: null };

  /* آیکون‌های دسته */
  var CAT_ICON = {
    quran: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 6C10 4.7 6.5 4.7 4 5.5v13c2.5-.8 6-.8 8 .5 2-1.3 5.5-1.3 8-.5v-13C17.5 4.7 14 4.7 12 6z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 6v13" stroke="currentColor" stroke-width="1.4"/></svg>',
    stone: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M6 21V9a6 6 0 0112 0v12" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M4 21h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M9 12h6M9 15h6" stroke="currentColor" stroke-width="1.4"/></svg>',
    print: '<svg viewBox="0 0 24 24" width="26" height="26"><rect x="6" y="3" width="12" height="6" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="4" y="9" width="16" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="7" y="15" width="10" height="6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    flower: '<svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="8" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="11" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="16" cy="11" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12v9" stroke="currentColor" stroke-width="1.6"/></svg>',
    chair: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M7 10V5h10v5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="6" y="10" width="12" height="4" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 14v6M17 14v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    dates: '<svg viewBox="0 0 24 24" width="26" height="26"><ellipse cx="12" cy="15" rx="8" ry="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6 15c2-5 10-5 12 0" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    food: '<svg viewBox="0 0 24 24" width="26" height="26"><circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="13" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M12 3v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    car: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M5 15h14l-1.5-5H6.5L5 15z" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="4" y="15" width="16" height="3" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="18.5" r="1.4" fill="currentColor"/><circle cx="16" cy="18.5" r="1.4" fill="currentColor"/></svg>',
    candle: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 3c1.6 2 1.4 3.4 0 4.4C10.6 6.4 10.4 5 12 3z" fill="currentColor"/><rect x="9.5" y="8.5" width="5" height="11" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    mic: '<svg viewBox="0 0 24 24" width="26" height="26"><rect x="9" y="3" width="6" height="11" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M6 12a6 6 0 0012 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M12 18v3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>'
  };
  var STAR = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.4 9.3l6-.7L12 3z" fill="currentColor"/></svg>';
  var CHECK = '<svg viewBox="0 0 24 24" width="11" height="11"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CALL = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 4h4l1.5 5-2 1.5a12 12 0 005 5l1.5-2 5 1.5v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" fill="currentColor"/></svg>';

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- بارگذاری ---------- */
  function load() {
    return Promise.all([
      fetch("data/businesses.json").then(function (r) { return r.json(); }),
      fetch("data/cities.json").then(function (r) { return r.json(); }),
      new Promise(function (r) { setTimeout(r, 400); })
    ]).then(function (res) {
      DATA.businesses = res[0].businesses || [];
      DATA.categories = res[0].categories || [];
      DATA.cities = (res[1].cities || []).filter(function (c) { return c.slug !== "all" ? true : true; });
    });
  }

  /* ---------- فیلتر ---------- */
  function matches(b) {
    if (state.city !== "all" && b.city_slug !== state.city) return false;
    if (state.category && b.category_slug !== state.category) return false;
    if (state.query) {
      var hay = b.name + " " + b.category_name + " " + b.city + " " + (b.services || []).join(" ");
      if (hay.indexOf(state.query.trim()) === -1) return false;
    }
    return true;
  }

  /* ---------- نوار شهر ---------- */
  function renderCities() {
    var bar = document.getElementById("cityBar");
    bar.innerHTML = "";
    DATA.cities.forEach(function (c) {
      var chip = el("button", "city-chip" + (c.slug === state.city ? " is-active" : ""));
      chip.type = "button";
      chip.appendChild(el("span", "chip-label", c.name));
      chip.addEventListener("click", function () { state.city = c.slug; renderCities(); renderList(); });
      bar.appendChild(chip);
    });
  }

  /* ---------- گرید دسته ---------- */
  function renderCategories() {
    var grid = document.getElementById("catGrid");
    grid.innerHTML = "";
    DATA.categories.forEach(function (cat) {
      var item = el("button", "cat-item" + (state.category === cat.slug ? " is-active" : ""));
      item.type = "button";
      item.appendChild(el("div", "cat-icon", CAT_ICON[cat.icon] || CAT_ICON.candle));
      item.appendChild(el("div", "cat-label", esc(cat.name)));
      item.addEventListener("click", function () {
        state.category = (state.category === cat.slug ? null : cat.slug);
        renderCategories(); renderList();
        window.scrollTo({ top: document.querySelector(".biz-list").offsetTop - 60, behavior: "smooth" });
      });
      grid.appendChild(item);
    });
  }

  /* ---------- ویژه ---------- */
  function renderFeatured() {
    var sec = document.getElementById("featuredSection");
    var track = document.getElementById("featuredTrack");
    var items = DATA.businesses.filter(function (b) { return b.featured; });
    if (!items.length || state.category || state.query) { sec.hidden = true; return; }
    sec.hidden = false; track.innerHTML = "";
    items.forEach(function (b) {
      var card = el("div", "featured-card");
      var logo = el("div", "f-logo"); logo.style.backgroundImage = 'url("' + b.logo + '")';
      card.appendChild(logo);
      card.appendChild(el("div", "f-name", esc(b.name) + (b.verified ? ' <span class="verified">' + CHECK + '</span>' : "")));
      card.appendChild(el("div", "f-cat", esc(b.category_name)));
      card.appendChild(el("div", "f-rating", STAR + " " + esc(b.rating) + " (" + esc(b.reviews) + ")"));
      card.addEventListener("click", function () { openOrder(b); });
      track.appendChild(card);
    });
  }

  /* ---------- کارت کسب‌وکار ---------- */
  function bizCard(b) {
    var card = el("article", "biz-card");
    var main = el("div", "biz-main");
    var logo = el("div", "biz-logo"); logo.style.backgroundImage = 'url("' + b.logo + '")';
    var info = el("div", "biz-info");
    info.appendChild(el("div", "biz-name", esc(b.name) + (b.verified ? ' <span class="verified">' + CHECK + '</span>' : "")));
    var sub = el("div", "biz-sub");
    sub.innerHTML = esc(b.category_name) + ' <span class="dot"></span> ' + esc(b.city);
    info.appendChild(sub);
    var metrics = el("div", "biz-metrics");
    metrics.innerHTML = '<span class="biz-rating">' + STAR + " " + esc(b.rating) + ' <span style="color:var(--text-mute)">(' + esc(b.reviews) + ')</span></span>' +
      '<span class="biz-price">' + esc(b.price_from) + '</span>';
    info.appendChild(metrics);
    main.appendChild(logo); main.appendChild(info);
    card.appendChild(main);

    if (b.services && b.services.length) {
      var sv = el("div", "biz-services");
      b.services.forEach(function (s) { sv.appendChild(el("span", "svc-chip", esc(s))); });
      card.appendChild(sv);
    }

    var actions = el("div", "biz-actions");
    var order = el("button", "btn-order", '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6h15l-1.5 9h-12L6 6zM6 6L5 3H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/></svg> سفارش سریع');
    order.type = "button";
    order.addEventListener("click", function () { openOrder(b); });
    var call = el("button", "btn-call", CALL); call.type = "button";
    call.addEventListener("click", function () { location.href = "tel:" + toEn(b.phone); });
    actions.appendChild(order); actions.appendChild(call);
    card.appendChild(actions);
    return card;
  }
  function toEn(s) { return String(s).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); }

  /* ---------- بنر فیلتر ---------- */
  function filterBanner() {
    if (state.city === "all" && !state.category && !state.query) return null;
    var parts = [];
    if (state.category) { var c = DATA.categories.filter(function (x) { return x.slug === state.category; })[0]; if (c) parts.push(c.name); }
    if (state.city !== "all") { var ct = DATA.cities.filter(function (x) { return x.slug === state.city; })[0]; if (ct) parts.push("شهر: " + ct.name); }
    if (state.query) parts.push("جستجو: «" + state.query + "»");
    var b = el("div", "filter-banner");
    b.appendChild(el("span", null, parts.join(" • ")));
    var btn = el("button", null, "حذف فیلتر"); btn.type = "button";
    btn.addEventListener("click", function () {
      state.city = "all"; state.category = null; state.query = null;
      var s = document.getElementById("searchInput"); if (s) s.value = "";
      renderCities(); renderCategories(); renderFeatured(); renderList();
    });
    b.appendChild(btn);
    return b;
  }

  /* ---------- لیست ---------- */
  function renderList() {
    renderFeatured();
    var list = document.getElementById("bizList");
    var empty = document.getElementById("emptyState");
    list.innerHTML = "";
    var banner = filterBanner();
    if (banner) list.appendChild(banner);
    var items = DATA.businesses.filter(matches);
    if (!items.length) { empty.hidden = false; return; }
    empty.hidden = true;
    items.forEach(function (b) { list.appendChild(bizCard(b)); });
  }

  /* ---------- بۀ‌شیت سفارش ---------- */
  var sheet = document.getElementById("orderSheet");
  var backdrop = document.getElementById("sheetBackdrop");
  var sheetTitle = document.getElementById("sheetTitle");
  var formHTML = document.getElementById("orderForm").outerHTML; // قالب اولیه‌ی فرم برای بازسازی
  var currentBiz = null;

  function openOrder(b) {
    currentBiz = b;
    sheetTitle.textContent = "سفارش سریع — " + b.name;
    // اگر پیام موفقیت نمایش داده شده، فرم را بازسازی کن
    var success = sheet.querySelector(".order-success");
    if (success) { success.outerHTML = formHTML; }
    var sel = document.getElementById("orderService");
    sel.innerHTML = "";
    (b.services || ["خدمت"]).forEach(function (s) { var o = document.createElement("option"); o.textContent = s; o.value = s; sel.appendChild(o); });
    sheet.hidden = false; backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeOrder() { sheet.hidden = true; backdrop.hidden = true; document.body.style.overflow = ""; }

  document.getElementById("sheetClose").addEventListener("click", closeOrder);
  backdrop.addEventListener("click", closeOrder);

  // ارسال فرم — با delegation تا بعد از بازسازی هم کار کند
  sheet.addEventListener("submit", function (e) {
    if (!e.target.matches("#orderForm")) return;
    e.preventDefault();
    // نمونه‌ی پیش‌نمایش؛ در وردپرس این‌جا به REST API / واتساپ ارسال می‌شود
    var form = e.target;
    var wrap = el("div", "order-success",
      '<div class="ok-ico"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p>سفارش شما برای «' + esc(currentBiz.name) + '» ثبت شد.<br>به‌زودی با شماره‌ی شما تماس می‌گیریم.</p>');
    form.replaceWith(wrap);
    setTimeout(closeOrder, 2200);
  });

  /* ---------- جستجو ---------- */
  function bindSearch() {
    var input = document.getElementById("searchInput");
    var t;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { state.query = input.value || null; renderFeatured(); renderList(); }, 180);
    });
  }

  /* ---------- راه‌اندازی ---------- */
  load().then(function () {
    renderCities(); renderCategories(); renderFeatured(); renderList(); bindSearch();
  }).catch(function (e) {
    document.getElementById("bizList").innerHTML = '<p style="color:#c66;text-align:center;padding:30px">خطا در بارگذاری کسب‌وکارها.</p>';
    console.error(e);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("service-worker.js").catch(function () {}); });
  }
})();
