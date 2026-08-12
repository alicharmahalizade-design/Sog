/* صفحه کسب‌وکارها و خدمات مراسم سوگ — داده‌محور.
   data/businesses.json و data/cities.json. آماده‌ی CPT «کسب‌وکار» در وردپرس. */
(function () {
  "use strict";

  var DATA = { businesses: [], categories: [], cities: [] };
  var state = { city: "all", category: null, query: null, view: "grid", open: null, sub: null, openBiz: null };
  try { var sv = localStorage.getItem("sog_biz_view"); if (sv === "accordion" || sv === "grid") state.view = sv; } catch (e) {}

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

  /* ---------- رتبه‌بندی: همکارها بالا، سپس تأییدشده‌ها، سپس امتیاز ---------- */
  function rank(a, b) {
    var pa = a.partner ? 2 : (a.verified ? 1 : 0), pb = b.partner ? 2 : (b.verified ? 1 : 0);
    if (pa !== pb) return pb - pa;
    return parseFloat(SogUtil.toEn(b.rating)) - parseFloat(SogUtil.toEn(a.rating));
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
      chip.addEventListener("click", function () { state.city = c.slug; renderCities(); applyView(); });
      bar.appendChild(chip);
    });
    var label = document.getElementById("cityPickerLabel");
    if (label) label.textContent = currentCityName();
  }

  /* ---------- انتخاب شهر با جستجو ---------- */
  function currentCityName() {
    var c = DATA.cities.filter(function (x) { return x.slug === state.city; })[0];
    return c ? c.name : "کل ایران";
  }

  function renderCityOptions(q) {
    var box = document.getElementById("cityOptions");
    if (!box) return;
    box.innerHTML = "";
    var term = (q || "").trim();
    var list = DATA.cities.filter(function (c) { return !term || c.name.indexOf(term) !== -1; });
    if (!list.length) {
      box.appendChild(el("p", "city-empty", "شهری با این نام پیدا نشد."));
      return;
    }
    list.forEach(function (c) {
      var btn = el("button", "city-option" + (c.slug === state.city ? " is-active" : ""));
      btn.type = "button";
      btn.appendChild(el("span", null, esc(c.name)));
      btn.addEventListener("click", function () {
        state.city = c.slug;
        closeCitySheet();
        renderCities();
        applyView();
      });
      box.appendChild(btn);
    });
  }

  function openCitySheet() {
    var sheet = document.getElementById("citySheet");
    var back = document.getElementById("cityBackdrop");
    var input = document.getElementById("citySearchInput");
    if (!sheet) return;
    if (input) input.value = "";
    renderCityOptions("");
    sheet.hidden = false; back.hidden = false;
    document.body.style.overflow = "hidden";
    if (input) setTimeout(function () { input.focus(); }, 60);
  }

  function closeCitySheet() {
    var sheet = document.getElementById("citySheet");
    var back = document.getElementById("cityBackdrop");
    if (!sheet) return;
    sheet.hidden = true; back.hidden = true;
    document.body.style.overflow = "";
  }

  function bindCityPicker() {
    var btn = document.getElementById("cityPickerBtn");
    var close = document.getElementById("cityClose");
    var back = document.getElementById("cityBackdrop");
    var input = document.getElementById("citySearchInput");
    if (btn) btn.addEventListener("click", openCitySheet);
    if (close) close.addEventListener("click", closeCitySheet);
    if (back) back.addEventListener("click", closeCitySheet);
    if (input) input.addEventListener("input", function () { renderCityOptions(input.value); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCitySheet(); });
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
    items.sort(rank).forEach(function (b) {
      var card = el("div", "featured-card");
      var logo = el("div", "f-logo"); logo.style.backgroundImage = 'url("' + b.logo + '")';
      card.appendChild(logo);
      card.appendChild(el("div", "f-name", esc(b.name) + " " + SogUtil.badge(b)));
      card.appendChild(el("div", "f-cat", esc(b.category_name)));
      card.appendChild(el("div", "f-rating", STAR + " " + esc(b.rating) + " (" + esc(b.reviews) + ")"));
      card.addEventListener("click", function () { location.href = "business-detail.html?id=" + b.id; });
      track.appendChild(card);
    });
  }

  /* ---------- کارت کسب‌وکار ---------- */
  function bizCard(b) {
    var card = el("article", "biz-card");
    var main = el("div", "biz-main");
    main.style.cursor = "pointer";
    main.addEventListener("click", function () { location.href = "business-detail.html?id=" + b.id; });
    var logo = el("div", "biz-logo"); logo.style.backgroundImage = 'url("' + b.logo + '")';
    var info = el("div", "biz-info");
    info.appendChild(el("div", "biz-name", esc(b.name) + " " + SogUtil.badge(b)));
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
  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".charAt(+d); }); }

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
      renderCities(); renderCategories(); applyView();
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
    var items = DATA.businesses.filter(matches).sort(rank);
    if (!items.length) { empty.hidden = false; return; }
    empty.hidden = true;
    items.forEach(function (b) { list.appendChild(bizCard(b)); });
  }

  /* ---------- نمایش آکاردئونی ---------- */
  var CHEV = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var STAR_O = '<svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6L12 4z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  var ICO = {
    call: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4h4l1.5 5-2 1.5a12 12 0 005 5l1.5-2 5 1.5v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" fill="currentColor"/></svg>',
    sms: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 7l8 6 8-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 8.5c0 4 3 7 7 7 .8 0 1.2-.4 1.2-1.2l-2-1-1 1c-1.3-.6-2.4-1.7-3-3l1-1-1-2c-.8 0-2.2.4-2.2 1.2z" fill="currentColor"/></svg>',
    eitaa: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M21 4L3 11l5 2 2 5 3-4 4 3 4-13z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17" cy="7" r="1.2" fill="currentColor"/></svg>'
  };

  /* کسب‌وکارهای یک دسته با در نظر گرفتن شهر، جستجو و زیرشاخه‌ی انتخاب‌شده */
  function catItems(slug, sub) {
    return DATA.businesses.filter(function (b) {
      if (b.category_slug !== slug) return false;
      if (state.city !== "all" && b.city_slug !== state.city) return false;
      if (sub && (b.services || []).indexOf(sub) === -1) return false;
      if (state.query) {
        var hay = b.name + " " + b.category_name + " " + b.city + " " + (b.services || []).join(" ");
        if (hay.indexOf(state.query.trim()) === -1) return false;
      }
      return true;
    }).sort(rank);
  }

  /* زیرشاخه‌های یک دسته از روی خدمات کسب‌وکارها ساخته می‌شوند */
  function catSubs(slug) {
    var out = [];
    DATA.businesses.forEach(function (b) {
      if (b.category_slug !== slug) return;
      (b.services || []).forEach(function (sv) { if (out.indexOf(sv) === -1) out.push(sv); });
    });
    return out;
  }

  /* ستاره‌های امتیاز */
  function stars(rating) {
    var n = Math.round(parseFloat(SogUtil.toEn(rating)) || 0);
    var h = "";
    for (var i = 1; i <= 5; i++) h += (i <= n ? STAR : STAR_O);
    return h;
  }

  /* دایره‌های راه ارتباطی */
  function contactCircles(b) {
    var wrap = el("div", "acc-contacts");
    var links = [
      { k: "call", label: "تماس", href: "tel:" + toEn(b.phone) },
      { k: "sms", label: "پیامک", href: "sms:" + toEn(b.phone) },
      { k: "whatsapp", label: "واتساپ", href: SogUtil.waLink(b.whatsapp || b.phone, "") },
      { k: "eitaa", label: "ایتا", href: b.eitaa || null },
      { k: "instagram", label: "اینستاگرام", href: b.instagram || null }
    ];
    links.forEach(function (l) {
      var item = el("a", "acc-contact" + (l.href ? "" : " is-off"));
      item.href = l.href || "javascript:void(0)";
      if (l.href && l.k !== "call" && l.k !== "sms") { item.target = "_blank"; item.rel = "noopener"; }
      if (!l.href) item.setAttribute("aria-disabled", "true");
      item.appendChild(el("span", "acc-contact-ico", ICO[l.k]));
      item.appendChild(el("span", "acc-contact-label", l.label));
      wrap.appendChild(item);
    });
    var more = el("button", "acc-more", "مشاهده‌ی صفحه‌ی کسب‌وکار");
    more.type = "button";
    more.addEventListener("click", function () { location.href = "business-detail.html?id=" + b.id; });
    wrap.appendChild(more);
    return wrap;
  }

  /* ردیف کسب‌وکار — خودش یک آکاردئون تودرتو است */
  function accBiz(b) {
    var isOpen = state.openBiz === b.id;
    var row = el("div", "acc-biz" + (isOpen ? " is-open" : ""));

    var head = el("button", "acc-biz-head"); head.type = "button";
    head.setAttribute("aria-expanded", isOpen ? "true" : "false");
    var logo = el("span", "acc-biz-logo"); logo.style.backgroundImage = 'url("' + b.logo + '")';
    var info = el("span", "acc-biz-info");
    info.appendChild(el("span", "acc-biz-name", esc(b.name) + " " + SogUtil.badge(b)));
    if (isOpen) info.appendChild(el("span", "acc-biz-stars", stars(b.rating)));
    else info.appendChild(el("span", "acc-biz-sub", esc(b.city) + ' <span class="dot"></span> ' + esc(b.price_from)));
    head.appendChild(logo); head.appendChild(info);
    head.appendChild(el("span", "acc-chev", CHEV));
    head.addEventListener("click", function () {
      state.openBiz = isOpen ? null : b.id;
      renderAccordion();
    });
    row.appendChild(head);

    if (isOpen) row.appendChild(contactCircles(b));
    return row;
  }

  function renderAccordion() {
    var wrap = document.getElementById("accList");
    if (!wrap) return;
    wrap.innerHTML = "";

    /* دسته‌ها بر اساس تعداد کسب‌وکار مرتب می‌شوند (پرتعدادترین بالا) */
    var rows = DATA.categories.map(function (cat) {
      return { cat: cat, items: catItems(cat.slug, null) };
    }).filter(function (r) { return r.items.length > 0; })
      .sort(function (a, b) { return b.items.length - a.items.length; });

    if (!rows.length) {
      wrap.appendChild(el("p", "acc-empty", "کسب‌وکاری برای این بخش یافت نشد."));
      return;
    }

    rows.forEach(function (r) {
      var isOpen = state.open === r.cat.slug;
      var subs = catSubs(r.cat.slug);
      var sub = isOpen ? state.sub : null;
      var item = el("div", "acc-item" + (isOpen ? " is-open" : ""));

      var head = el("button", "acc-head"); head.type = "button";
      head.setAttribute("aria-expanded", isOpen ? "true" : "false");
      head.appendChild(el("span", "acc-ico", CAT_ICON[r.cat.icon] || CAT_ICON.candle));
      var htext = el("span", "acc-head-text");
      var titleLine = el("span", "acc-title-line");
      titleLine.appendChild(el("span", "acc-title", esc(r.cat.name)));
      titleLine.appendChild(el("span", "acc-count", "(" + faNum(r.items.length) + " مورد)"));
      htext.appendChild(titleLine);
      if (subs.length) htext.appendChild(el("span", "acc-subs-hint", esc(subs.slice(0, 3).join(" ، ")) + (subs.length > 3 ? " و …" : "")));
      head.appendChild(htext);
      head.appendChild(el("span", "acc-chev", CHEV));
      head.addEventListener("click", function () {
        state.open = isOpen ? null : r.cat.slug;
        state.sub = null; state.openBiz = null;
        renderAccordion();
      });
      item.appendChild(head);

      if (isOpen) {
        var body = el("div", "acc-body");

        if (subs.length) {
          var chips = el("div", "acc-subs");
          subs.forEach(function (sv) {
            var chip = el("button", "acc-sub-chip" + (sub === sv ? " is-active" : ""), esc(sv));
            chip.type = "button";
            chip.addEventListener("click", function () {
              state.sub = (sub === sv ? null : sv);
              state.openBiz = null;
              renderAccordion();
            });
            chips.appendChild(chip);
          });
          body.appendChild(chips);
        }

        var items = catItems(r.cat.slug, sub);
        if (!items.length) body.appendChild(el("p", "acc-empty", "موردی در این زیرشاخه نیست."));
        else items.forEach(function (b) { body.appendChild(accBiz(b)); });

        item.appendChild(body);
      }

      wrap.appendChild(item);
    });
  }

  /* ---------- سوییچ نمایش ---------- */
  function applyView() {
    var grid = document.getElementById("gridView");
    var acc = document.getElementById("accView");
    var list = document.getElementById("bizList");
    var featured = document.getElementById("featuredSection");
    var empty = document.getElementById("emptyState");
    var isAcc = state.view === "accordion";

    if (grid) grid.hidden = isAcc;
    if (acc) acc.hidden = !isAcc;
    if (list) list.hidden = isAcc;
    if (isAcc) {
      if (featured) featured.hidden = true;
      if (empty) empty.hidden = true;
      renderAccordion();
    } else {
      renderList();
    }

    Array.prototype.forEach.call(document.querySelectorAll(".vs-btn"), function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-view") === state.view);
    });
  }

  function bindViewSwitch() {
    Array.prototype.forEach.call(document.querySelectorAll(".vs-btn"), function (btn) {
      btn.addEventListener("click", function () {
        state.view = btn.getAttribute("data-view");
        try { localStorage.setItem("sog_biz_view", state.view); } catch (e) {}
        applyView();
      });
    });
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

  // ارسال فرم → باز کردن واتساپ با پیام آماده (بدون بک‌اند)
  sheet.addEventListener("submit", function (e) {
    if (!e.target.matches("#orderForm")) return;
    e.preventDefault();
    var fd = new FormData(e.target);
    var msg = "سلام، سفارش از اپلیکیشن سوگ:\n" +
      "• خدمت: " + fd.get("service") + "\n" +
      "• نام: " + fd.get("name") + "\n" +
      "• تماس: " + fd.get("phone") + "\n" +
      (fd.get("note") ? "• توضیحات: " + fd.get("note") + "\n" : "") +
      "کسب‌وکار: " + currentBiz.name;
    var link = SogUtil.waLink(currentBiz.whatsapp || currentBiz.phone, msg);
    e.target.replaceWith(el("div", "order-success",
      '<div class="ok-ico"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p>در حال انتقال به واتساپ برای ارسال سفارش به «' + esc(currentBiz.name) + '»…</p>'));
    window.open(link, "_blank");
    setTimeout(closeOrder, 2200);
  });

  /* ---------- جستجو ---------- */
  function bindSearch() {
    var input = document.getElementById("searchInput");
    var t;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { state.query = input.value || null; applyView(); }, 180);
    });
  }

  /* ---------- راه‌اندازی ---------- */
  load().then(function () {
    renderCities(); renderCategories(); bindViewSwitch(); bindCityPicker(); applyView(); bindSearch();
  }).catch(function (e) {
    document.getElementById("bizList").innerHTML = '<p style="color:#c66;text-align:center;padding:30px">خطا در بارگذاری کسب‌وکارها.</p>';
    console.error(e);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("service-worker.js").catch(function () {}); });
  }
})();
