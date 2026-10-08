/* صفحه کسب‌وکارها و خدمات مراسم سوگ — داده‌محور.
   data/businesses.json و data/cities.json. آماده‌ی CPT «کسب‌وکار» در وردپرس. */
(function () {
  "use strict";

  var DATA = { businesses: [], categories: [], cities: [] };
  /* نمایش فقط به‌صورت آکاردئونی است */
  var state = { city: "all", category: null, query: null, open: null, sub: null, openBiz: null };

  /* آیکون‌های دسته */
  var CAT_ICON = {
    quran: SogIcon("quran", 26),
    stone: SogIcon("stone", 26),
    print: SogIcon("print", 26),
    flower: SogIcon("flower", 26),
    chair: SogIcon("chair", 26),
    dates: SogIcon("dates", 26),
    food: SogIcon("food", 26),
    car: SogIcon("car", 26),
    candle: SogIcon("candle", 26),
    mic: SogIcon("reciter", 26)
  };
  var STAR = SogIcon("star", 14);
  var CHECK = SogIcon("check", 11);
  var CALL = SogIcon("call", 20);

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  /* یکسان‌سازی حروف عربی/فارسی و نیم‌فاصله تا جستجو به شکل نوشتن حساس نباشد */
  function normalize(v) {
    return String(v == null ? "" : v)
      .replace(/[يﻯﻰ]/g, "ی").replace(/[كﻙ]/g, "ک")
      .replace(/[\u200c\u200f\u200e]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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
      var hay = normalize(b.name + " " + b.category_name + " " + b.city + " " + (b.services || []).join(" "));
      var q = normalize(state.query);
      if (q && hay.indexOf(q) === -1) return false;
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
    /* دکمه‌ی انتخاب شهر در هدر صفحه‌ی خدمات */
    var headBtn = document.getElementById("cityBtn");
    if (headBtn) headBtn.addEventListener("click", openCitySheet);
    /* برچسب دکمه‌ی شهر در هدر با شهر انتخابی هماهنگ می‌ماند */
    var headLbl = document.getElementById("cityBtnLabel");
    if (headLbl) {
      var pick = document.getElementById("cityPickerLabel");
      var sync = function () { headLbl.textContent = pick ? pick.textContent : "کل ایران"; };
      sync();
      if (pick && window.MutationObserver) new MutationObserver(sync).observe(pick, { childList: true, characterData: true, subtree: true });
    }
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
    var order = el("button", "btn-order", '' + SogIcon("cart", 18) + ' سفارش سریع');
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
  var CHEV = SogIcon("chevron", 22);
  var STAR_O = SogIcon("star", 13);
  var ICO = {
    call: SogIcon("call", 22),
    sms: SogIcon("sms", 22),
    whatsapp: SogIcon("whatsapp", 22),
    eitaa: SogIcon("telegram", 22),
    instagram: SogIcon("instagram", 22)
  };

  /* کسب‌وکارهای یک دسته با در نظر گرفتن شهر، جستجو و زیرشاخه‌ی انتخاب‌شده */
  function catItems(slug, sub) {
    return DATA.businesses.filter(function (b) {
      if (b.category_slug !== slug) return false;
      if (state.city !== "all" && b.city_slug !== state.city) return false;
      if (sub && (b.services || []).indexOf(sub) === -1) return false;
      if (state.query) {
        var hay = normalize(b.name + " " + b.category_name + " " + b.city + " " + (b.services || []).join(" "));
        var q = normalize(state.query);
        if (q && hay.indexOf(q) === -1) return false;
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

    var rep = el("button", "acc-report",
      '' + SogIcon("report", 14) + ' گزارش خطا');
    rep.type = "button";
    rep.addEventListener("click", function () { openBizReport(b); });
    wrap.appendChild(rep);
    return wrap;
  }

  /* پیام کوتاه */
  function toast(msg) {
    var old = document.querySelector(".sog-toast");
    if (old) old.remove();
    var t = el("div", "sog-toast", esc(msg));
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () {
      t.classList.remove("is-in");
      setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
    }, 2600);
  }

  /* گزارش خطای کسب‌وکار — همان فرم صفحه‌ی کسب‌وکار */
  var BIZ_REPORT_TYPES = [
    "این کسب‌وکار تکراری است",
    "شماره تماس یا آدرس نادرست است",
    "تصویر نامناسب یا اشتباه است",
    "خدمات یا قیمت‌ها نادرست است",
    "محتوای توهین‌آمیز یا نامرتبط",
    "این کسب‌وکار دیگر فعال نیست"
  ];

  function openBizReport(b) {
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "biz-report-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "گزارش خطا");

    var close = el("button", "report-close", SogIcon("close", 22));
    close.type = "button"; close.setAttribute("aria-label", "بستن");

    var form = el("form", "report-form");
    form.innerHTML =
      '<h3 class="report-title">گزارش خطا — ' + esc(b.name) + '</h3>' +
      '<label class="report-field"><span>نوع خطا</span><select name="type" required>' +
      BIZ_REPORT_TYPES.map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '</option>'; }).join("") +
      '</select></label>' +
      '<label class="report-field"><span>توضیحات</span>' +
      '<textarea name="note" rows="3" placeholder="چه چیزی درست نیست؟ کوتاه توضیح بدهید."></textarea></label>' +
      '<div class="report-actions">' +
      '<button type="button" class="btn-ghost" data-cancel>بی‌خیال</button>' +
      '<button type="submit" class="btn-primary">ثبت و ارسال</button></div>';

    sheet.appendChild(close); sheet.appendChild(form);
    document.body.appendChild(back); document.body.appendChild(sheet);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { sheet.classList.add("is-in"); back.classList.add("is-in"); });

    function done() {
      sheet.remove(); back.remove();
      document.body.style.overflow = "";
    }
    close.addEventListener("click", done);
    back.addEventListener("click", done);
    form.querySelector("[data-cancel]").addEventListener("click", done);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      try {
        var box = JSON.parse(localStorage.getItem("sog:reports") || "[]");
        box.push({
          kind: "business", id: b.id, name: b.name,
          type: fd.get("type"), note: fd.get("note") || "",
          at: Date.now(), to: ["sog-support", "business-owner"], status: "queued"
        });
        localStorage.setItem("sog:reports", JSON.stringify(box));
      } catch (err) {}
      done();
      toast("گزارش شما ثبت و برای پشتیبانی سوگ و صاحب کسب‌وکار ارسال شد.");
    });
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

  /* ---------- نمایش ---------- */
  function applyView() {
    var grid = document.getElementById("gridView");
    var acc = document.getElementById("accView");
    var list = document.getElementById("bizList");
    var featured = document.getElementById("featuredSection");
    var empty = document.getElementById("emptyState");

    if (grid) grid.hidden = true;
    if (list) list.hidden = true;
    if (featured) featured.hidden = true;
    if (empty) empty.hidden = true;
    if (acc) acc.hidden = false;

    renderAccordion();
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
    var msg = "سلام، سفارش از سایت سوگ:\n" +
      "• خدمت: " + fd.get("service") + "\n" +
      "• نام: " + fd.get("name") + "\n" +
      "• تماس: " + fd.get("phone") + "\n" +
      (fd.get("note") ? "• توضیحات: " + fd.get("note") + "\n" : "") +
      "کسب‌وکار: " + currentBiz.name;
    var link = SogUtil.waLink(currentBiz.whatsapp || currentBiz.phone, msg);
    /* سفارش در حساب کاربری ثبت می‌شود */
    try {
      var orders = JSON.parse(localStorage.getItem("sog:orders")) || [];
      var t = SogUtil.todayJalali();
      orders.unshift({
        business: currentBiz.name, logo: currentBiz.logo,
        service: fd.get("service"), name: fd.get("name"), phone: fd.get("phone"),
        note: fd.get("note") || "",
        date: faNum(t.y) + "/" + faNum(t.m < 10 ? "0" + t.m : t.m) + "/" + faNum(t.d < 10 ? "0" + t.d : t.d),
        at: Date.now()
      });
      localStorage.setItem("sog:orders", JSON.stringify(orders));
    } catch (e) {}
    e.target.replaceWith(el("div", "order-success",
      '<div class="ok-ico">' + SogIcon("check", 30) + '</div>' +
      '<p>در حال انتقال به واتساپ برای ارسال سفارش به «' + esc(currentBiz.name) + '»…</p>'));
    window.open(link, "_blank");
    setTimeout(closeOrder, 2200);
  });

  /* ---------- جستجو ---------- */
  function bindSearch() {
    var input = document.getElementById("searchInput");
    if (!input) return;
    /* بدون تأخیر: با هر حرف، نتیجه‌ها به‌روز می‌شوند */
    input.addEventListener("input", function () {
      state.query = input.value || null;
      applyView();
    });
    bindVoice(input);
  }

  /* جستجوی صوتی فارسی */
  function bindVoice(input) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var mic = document.getElementById("micBtn");
    if (!SR || !mic) return;
    mic.hidden = false;

    var rec = new SR();
    rec.lang = "fa-IR"; rec.interimResults = false; rec.maxAlternatives = 1;

    var timer = el("span", "mic-timer");
    timer.hidden = true;
    /* کنار خود میکروفون می‌نشیند تا همیشه دیده شود */
    if (mic.parentNode) mic.parentNode.insertBefore(timer, mic);
    else mic.appendChild(timer);
    var tick;

    function startCountdown() {
      var left = 5;
      timer.hidden = false; timer.textContent = faNum(left);
      clearInterval(tick);
      tick = setInterval(function () {
        left--;
        if (left <= 0) {
          clearInterval(tick); timer.textContent = faNum(0);
          setTimeout(function () { timer.hidden = true; }, 300);
          try { rec.stop(); } catch (e) {}
          return;
        }
        timer.textContent = faNum(left);
      }, 1000);
    }
    function stopCountdown() { clearInterval(tick); timer.hidden = true; }

    mic.addEventListener("click", function () {
      try { rec.start(); mic.classList.add("is-listening"); startCountdown(); } catch (e) {}
    });
    rec.onresult = function (e) {
      var text = e.results[0][0].transcript;
      input.value = text; state.query = text; applyView();
    };
    rec.onend = function () { mic.classList.remove("is-listening"); stopCountdown(); };
    rec.onerror = function () { mic.classList.remove("is-listening"); stopCountdown(); };
  }

  /* ---------- راه‌اندازی ---------- */
  load().then(function () {
    renderCities(); renderCategories(); bindCityPicker(); applyView(); bindSearch();
  }).catch(function (e) {
    document.getElementById("bizList").innerHTML = '<p style="color:#c66;text-align:center;padding:30px">خطا در بارگذاری کسب‌وکارها.</p>';
    console.error(e);
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () { navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" })
        .then(function (r) {
          r.update();
          document.addEventListener("visibilitychange", function () {
            if (!document.hidden) r.update();
          });
        }).catch(function () {}); });
  }
})();
