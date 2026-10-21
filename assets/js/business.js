/* صفحه کسب‌وکارها و خدمات مراسم سوگ — داده‌محور.
   data/businesses.json و data/cities.json. آماده‌ی CPT «کسب‌وکار» در وردپرس. */
(function () {
  "use strict";

  var DATA = { businesses: [], categories: [], cities: [] };
  /* category: دسته‌ی انتخابی (null = خانه)، sub: زیرشاخه، sort: ترتیب نتایج */
  var state = { city: "all", category: null, query: null, sub: null, sort: "smart" };

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
    mic: SogIcon("reciter", 26),
    grid: SogIcon("grid", 26),
    all: SogIcon("biz", 26)
  };
  var STAR = SogIcon("star", 14);


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
      new Promise(function (r) { setTimeout(r, 400); }),
      fetch("data/stories.json").then(function (r) { return r.json(); }).catch(function () { return { stories: [] }; })
    ]).then(function (res) {
      DATA.storyData = res[3].stories || [];
      DATA.siteBusinesses = res[0].businesses || [];
      DATA.categories = res[0].categories || [];
      DATA.cities = (res[1].cities || []).filter(function (c) { return c.slug !== "all" ? true : true; });
      /* کسب‌وکارهای ثبت‌شده توسط خود کاربر هم در فهرست می‌آیند */
      return SogBizStore.resolveAll(SogBizStore.all()).then(function (mine) {
        DATA.businesses = mine.concat(DATA.siteBusinesses);
      });
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
        render();
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
    var close = document.getElementById("cityClose");
    var back = document.getElementById("cityBackdrop");
    var input = document.getElementById("citySearchInput");
    var headBtn = document.getElementById("cityBtn");
    if (headBtn) headBtn.addEventListener("click", openCitySheet);
    if (close) close.addEventListener("click", closeCitySheet);
    if (back) back.addEventListener("click", closeCitySheet);
    if (input) input.addEventListener("input", function () { renderCityOptions(input.value); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCitySheet(); });
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


  /* ================= نمای صفحه‌ی خدمات (طراحی تازه) =================
     خانه: معرفی + استوری + نوار دسته‌ی چسبان + «منتخب سوگ» + یک ردیف افقی برای هر دسته.
     با انتخاب دسته یا جستجو: فهرست نتایج با زیرشاخه، مرتب‌سازی و کارت‌های فشرده. */
  function toEn(s) { return String(s == null ? "" : s).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); }
  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".charAt(+d); }); }
  function rateNum(b) { return parseFloat(toEn(b.rating)) || 0; }
  function reviewsNum(b) { return parseInt(toEn(b.reviews).replace(/\D/g, ""), 10) || 0; }
  function priceNum(b) { var d = toEn(b.price_from).replace(/\D/g, ""); return d ? +d : Infinity; }
  function goBiz(b) { location.href = "business-detail.html?id=" + encodeURIComponent(b.id); }
  function catOf(slug) { return DATA.categories.filter(function (c) { return c.slug === slug; })[0] || null; }
  function cover(b) {
    var g = b.gallery || [];
    return b.cover || (g.length ? g[(parseInt(b.id, 10) || 0) % g.length] : "") || b.logo;
  }
  function bg(url) { return url ? "background-image:url('" + String(url).replace(/'/g, "%27") + "')" : ""; }

  var SORTS = [["smart", "پیشنهادی"], ["rate", "بیشترین امتیاز"], ["reviews", "پرنظرترین"], ["price", "ارزان‌ترین"]];
  function sorter(a, b) {
    if (state.sort === "rate") return rateNum(b) - rateNum(a);
    if (state.sort === "reviews") return reviewsNum(b) - reviewsNum(a);
    if (state.sort === "price") return priceNum(a) - priceNum(b);
    return rank(a, b);
  }
  function inCity(b) { return state.city === "all" || b.city_slug === state.city; }
  function inQuery(b) {
    if (!state.query) return true;
    var q = normalize(state.query);
    return !q || normalize(b.name + " " + b.category_name + " " + b.city + " " + (b.services || []).join(" ")).indexOf(q) !== -1;
  }
  function pool() { return DATA.businesses.filter(function (b) { return inCity(b) && inQuery(b); }); }
  function subsOf(slug) {
    var out = [];
    DATA.businesses.forEach(function (b) {
      if (b.category_slug === slug && inCity(b)) (b.services || []).forEach(function (s) { if (out.indexOf(s) === -1) out.push(s); });
    });
    return out;
  }

  function setCategory(slug) {
    state.category = slug; state.sub = null; state.sort = "smart";
    render();
    var rail = document.getElementById("bhCats");
    if (rail) {
      var top = rail.getBoundingClientRect().top + window.scrollY - 64;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  function render() {
    syncCityLabel();
    renderStories();
    renderRail();
    var main = document.getElementById("bzMain");
    if (!main) return;
    main.innerHTML = "";
    if (state.category || state.query) renderResults(main); else renderHome(main);
  }

  /* انتخاب شهر فقط در هدر است (چسبان و هم‌جا با صفحه‌ی آگهی‌ها) */
  function syncCityLabel() {
    var lbl = document.getElementById("cityBtnLabel");
    if (lbl) lbl.textContent = currentCityName();
    var btn = document.getElementById("cityBtn");
    if (btn) btn.classList.toggle("is-set", state.city !== "all");
  }

  /* ---------- نوار دسته‌ها (چسبان) ---------- */
  function renderRail() {
    var rail = document.getElementById("bhCats");
    if (!rail) return;
    var keep = rail.querySelector(".bh-cats-track");
    var x = keep ? keep.scrollLeft : 0;
    rail.innerHTML = "";
    var track = el("div", "bh-cats-track");
    var counts = {};
    DATA.businesses.filter(inCity).forEach(function (b) { counts[b.category_slug] = (counts[b.category_slug] || 0) + 1; });
    [{ slug: null, name: "همه", icon: "all" }].concat(DATA.categories).forEach(function (c) {
      var on = state.category === c.slug;
      var n = c.slug ? counts[c.slug] || 0 : 0;
      var b = el("button", "bh-cat" + (on ? " is-on" : "") + (c.slug && !n ? " is-empty" : ""));
      b.type = "button";
      b.innerHTML = '<span class="bh-cat-ic">' + (CAT_ICON[c.icon] || CAT_ICON.candle) + "</span>" +
        '<span class="bh-cat-tx">' + esc(c.name) + "</span>";
      b.addEventListener("click", function () { setCategory(on && c.slug ? null : c.slug); });
      track.appendChild(b);
    });
    rail.appendChild(track);
    track.scrollLeft = x;
    var cur = track.querySelector(".is-on");
    if (cur && !keep) cur.scrollIntoView({ inline: "center", block: "nearest" });
  }

  /* ---------- خانه ---------- */
  function secHead(title, sub, onAll, icon) {
    var h = el("div", "bh-sec-head");
    h.innerHTML = (icon ? '<span class="bh-sec-ic">' + icon + "</span>" : "") +
      '<span class="bh-sec-tx"><b>' + esc(title) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>";
    if (onAll) {
      var a = el("button", "bh-sec-all", "همه" + SogIcon("chevLeft", 14));
      a.type = "button"; a.addEventListener("click", onAll);
      h.appendChild(a);
    }
    return h;
  }

  function renderHome(main) {
    var list = pool();
    if (!list.length) return emptyState(main, "در " + currentCityName() + " هنوز کسب‌وکاری ثبت نشده است.");

    /* منتخب سوگ: همکاران رسمی و ویژه‌ها */
    var spot = list.filter(function (b) { return b.partner || b.featured; }).sort(rank).slice(0, 8);
    if (spot.length) {
      var s1 = el("section", "bh-sec");
      s1.appendChild(secHead("منتخب سوگ", "همکاران رسمی و کسب‌وکارهای ویژه"));
      var tr = el("div", "bh-spot-track");
      spot.forEach(function (b) { tr.appendChild(spotCard(b)); });
      s1.appendChild(tr);
      main.appendChild(s1);
    }

    main.appendChild(joinBanner());

    /* یک ردیف افقی برای هر دسته */
    DATA.categories.forEach(function (c) {
      var items = list.filter(function (b) { return b.category_slug === c.slug; }).sort(rank);
      if (!items.length) return;
      var sec = el("section", "bh-sec");
      sec.appendChild(secHead(c.name, faNum(items.length) + " کسب‌وکار", function () { setCategory(c.slug); }, CAT_ICON[c.icon]));
      var row = el("div", "bh-row-track" + (items.length <= 2 ? " is-fill" : ""));
      items.slice(0, 10).forEach(function (b) { row.appendChild(tileCard(b)); });
      sec.appendChild(row);
      main.appendChild(sec);
    });
  }

  /* کارت بزرگ «منتخب»: کاور با اطلاعات روی تصویر و دکمه‌های تماس زیرش */
  function spotCard(b) {
    var card = el("article", "bh-spot");
    var story = hasStory(b.id);
    card.innerHTML =
      '<div class="bh-spot-cover" style="' + bg(cover(b)) + '">' +
        (b.partner ? '<span class="bh-flag is-gold">همکار رسمی سوگ</span>' : '<span class="bh-flag">ویژه</span>') +
        '<div class="bh-spot-id">' +
          '<span class="bh-logo' + (story ? " has-story" : "") + '" style="' + bg(b.logo) + '"></span>' +
          '<span class="bh-spot-name"><b>' + esc(b.name) + "</b>" +
          "<small>" + esc(b.category_name) + " · " + esc(b.city) + "</small></span>" +
          '<span class="bh-rate">' + STAR + esc(b.rating || "—") + "</span>" +
        "</div>" +
      "</div>" +
      '<div class="bh-spot-foot">' +
        '<span class="bh-price">' + esc(b.price_from || "") + "</span>" +
      "</div>";
    card.querySelector(".bh-spot-foot").appendChild(actions(b, true));
    card.querySelector(".bh-spot-cover").addEventListener("click", function (e) {
      if (story && e.target.classList.contains("bh-logo")) return openStoriesFor(b.id);
      goBiz(b);
    });
    return card;
  }

  /* کارت کوچک ردیف‌های دسته */
  function tileCard(b) {
    var t = el("article", "bh-tile");
    var story = hasStory(b.id);
    t.innerHTML =
      '<div class="bh-tile-cover" style="' + bg(cover(b)) + '">' +
        '<span class="bh-logo is-sm' + (story ? " has-story" : "") + '" style="' + bg(b.logo) + '"></span>' +
      "</div>" +
      '<div class="bh-tile-body">' +
        '<b class="bh-tile-name"><span>' + esc(b.name) + "</span>" + SogUtil.badge(b) + "</b>" +
        '<span class="bh-tile-meta"><span class="bh-rate">' + STAR + esc(b.rating || "—") + "</span>" +
        '<span class="bh-dot"></span><span>' + esc(b.city) + "</span></span>" +
        '<span class="bh-tile-price">' + esc(b.price_from || "تماس بگیرید") + "</span>" +
      "</div>";
    t.addEventListener("click", function (e) {
      if (story && e.target.classList.contains("bh-logo")) return openStoriesFor(b.id);
      goBiz(b);
    });
    return t;
  }

  /* دکمه‌های تماس، واتساپ و سفارش */
  function actions(b, compact) {
    var row = el("div", "bh-acts" + (compact ? " is-compact" : ""));
    var call = el("a", "bh-act", SogIcon("call", 18)); call.href = "tel:" + toEn(b.phone); call.setAttribute("aria-label", "تماس با " + b.name);
    var wa = el("a", "bh-act is-wa", SogIcon("whatsapp", 18)); wa.href = SogUtil.waLink(b.whatsapp || b.phone, "");
    wa.target = "_blank"; wa.rel = "noopener"; wa.setAttribute("aria-label", "واتساپ " + b.name);
    var order = el("button", "bh-order", SogIcon("cart", 16) + "<span>سفارش سریع</span>"); order.type = "button";
    order.addEventListener("click", function (e) { e.stopPropagation(); openOrder(b); });
    [call, wa].forEach(function (a) { a.addEventListener("click", function (e) { e.stopPropagation(); }); });
    row.appendChild(call); row.appendChild(wa); row.appendChild(order);
    return row;
  }

  function joinBanner() {
    var a = el("a", "bh-join");
    a.href = "biz-register.html";
    a.innerHTML = '<span class="bh-join-ic">' + SogIcon("biz", 24) + "</span>" +
      '<span class="bh-join-tx"><b>کسب‌وکار مراسم دارید؟</b><small>ماه اول رایگان؛ سپس ماهانه ۳۰۰ هزار تومان</small></span>' +
      '<span class="bh-join-go">ثبت رایگان</span>';
    return a;
  }

  /* ---------- نتایج دسته یا جستجو ---------- */
  function renderResults(main) {
    var cat = state.category ? catOf(state.category) : null;
    var items = pool().filter(function (b) {
      if (state.category && b.category_slug !== state.category) return false;
      if (state.sub && (b.services || []).indexOf(state.sub) === -1) return false;
      return true;
    }).sort(sorter);

    var head = el("div", "bh-res-head");
    head.innerHTML = '<span class="bh-res-tx"><b>' + esc(cat ? cat.name : "نتایج جستجو") + "</b><small>" +
      faNum(items.length) + " کسب‌وکار" + (state.query ? " برای «" + esc(state.query) + "»" : "") +
      (state.city !== "all" ? " در " + esc(currentCityName()) : "") + "</small></span>";
    var clear = el("button", "bh-res-clear", SogIcon("close", 16) + "<span>همه‌ی خدمات</span>");
    clear.type = "button";
    clear.addEventListener("click", function () {
      state.query = null; var s = document.getElementById("searchInput"); if (s) s.value = "";
      setCategory(null);
    });
    head.appendChild(clear);
    main.appendChild(head);

    /* زیرشاخه‌ها */
    if (cat) {
      var subs = subsOf(cat.slug);
      if (subs.length > 1) {
        var chips = el("div", "bh-subs");
        [null].concat(subs).forEach(function (sv) {
          var c = el("button", "bh-sub" + (state.sub === sv ? " is-on" : ""), esc(sv || "همه"));
          c.type = "button";
          c.addEventListener("click", function () { state.sub = sv; render(); });
          chips.appendChild(c);
        });
        main.appendChild(chips);
      }
    }

    /* مرتب‌سازی */
    var sort = el("div", "bh-sort");
    sort.appendChild(el("span", "bh-sort-lb", SogIcon("sort", 16) + "<span>ترتیب</span>"));
    SORTS.forEach(function (s) {
      var b = el("button", "bh-sort-op" + (state.sort === s[0] ? " is-on" : ""), s[1]);
      b.type = "button";
      b.addEventListener("click", function () { state.sort = s[0]; render(); });
      sort.appendChild(b);
    });
    main.appendChild(sort);

    if (!items.length) return emptyState(main, "موردی با این فیلترها پیدا نشد.");
    var list = el("div", "bh-list");
    items.forEach(function (b) { list.appendChild(itemCard(b)); });
    main.appendChild(list);
    main.appendChild(joinBanner());
  }

  /* کارت فهرست نتایج: تصویر مربعی + اطلاعات + دکمه‌ها */
  function itemCard(b) {
    var card = el("article", "bh-item");
    var story = hasStory(b.id);
    var svc = (b.services || []).slice(0, 2).map(function (s) { return "<span>" + esc(s) + "</span>"; }).join("") +
      ((b.services || []).length > 2 ? '<span class="is-more">+' + faNum(b.services.length - 2) + "</span>" : "");
    card.innerHTML =
      '<div class="bh-item-top">' +
        '<span class="bh-item-img" style="' + bg(cover(b)) + '">' +
          '<span class="bh-logo is-xs' + (story ? " has-story" : "") + '" style="' + bg(b.logo) + '"></span>' +
        "</span>" +
        '<div class="bh-item-info">' +
          '<b class="bh-item-name"><span>' + esc(b.name) + "</span>" + SogUtil.badge(b) + "</b>" +
          '<span class="bh-item-meta">' + esc(b.category_name) + '<span class="bh-dot"></span>' + esc(b.city) + "</span>" +
          '<span class="bh-item-meta"><span class="bh-rate">' + STAR + esc(b.rating || "—") + "</span>" +
            '<i class="bh-rev">(' + esc(b.reviews || "۰") + " نظر)</i>" +
            (b.price_from ? '<span class="bh-dot"></span><span class="bh-price">' + esc(b.price_from) + "</span>" : "") + "</span>" +
          (svc ? '<span class="bh-item-svcs">' + svc + "</span>" : "") +
        "</div>" +
      "</div>";
    card.appendChild(actions(b));
    card.querySelector(".bh-item-top").addEventListener("click", function (e) {
      if (story && e.target.classList.contains("bh-logo")) return openStoriesFor(b.id);
      goBiz(b);
    });
    return card;
  }

  function emptyState(main, msg) {
    var box = el("div", "bh-empty");
    box.innerHTML = '<span class="bh-empty-ic">' + SogIcon("search", 28) + "</span><p>" + esc(msg) + "</p>";
    if (state.city !== "all" || state.query || state.category) {
      var b = el("button", "bh-empty-btn", "نمایش همه‌ی خدمات در کل ایران"); b.type = "button";
      b.addEventListener("click", function () {
        state.city = "all"; state.query = null; state.category = null; state.sub = null;
        var s = document.getElementById("searchInput"); if (s) s.value = "";
        render();
      });
      box.appendChild(b);
    }
    main.appendChild(box);
    main.appendChild(joinBanner());
  }

  /* ---------- استوری کسب‌وکارها (مثل اینستاگرام) ---------- */
  var SEEN_KEY = "sog:storySeen", DAY = 86400000;
  function seenMap() { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) { return {}; } }
  function markSeen(sid) { var m = seenMap(); m[sid] = Date.now(); try { localStorage.setItem(SEEN_KEY, JSON.stringify(m)); } catch (e) {} }
  /* استوری‌های فعال (۲۴ ساعت اخیر): نمونه‌ها + استوری‌هایی که کسب‌وکارهای همین دستگاه گذاشته‌اند */
  function storyGroups() {
    var now = Date.now(), groups = {};
    (DATA.storyData || []).forEach(function (g) {
      (g.items || []).forEach(function (it, i) {
        var at = it.at || (now - (it.hours || 0) * 3600000);
        (groups[g.biz] = groups[g.biz] || []).push({ id: "s" + g.biz + "-" + i, img: it.img, text: it.text, at: at });
      });
    });
    var mine = {};
    try { mine = JSON.parse(localStorage.getItem("sog:bizStories")) || {}; } catch (e) {}
    Object.keys(mine).forEach(function (bid) {
      (mine[bid] || []).forEach(function (it) { (groups[bid] = groups[bid] || []).push({ id: it.id, img: it.img, text: it.text, at: it.at, mine: true }); });
    });
    var seen = seenMap();
    return Object.keys(groups).map(function (bid) {
      var biz = DATA.businesses.filter(function (b) { return String(b.id) === String(bid); })[0];
      var items = groups[bid].filter(function (it) { return now - it.at < DAY; }).sort(function (a, b) { return a.at - b.at; });
      if (!biz || !items.length) return null;
      if (state.city !== "all" && biz.city_slug !== state.city) return null;
      var unseen = items.some(function (it) { return !seen[it.id]; });
      return { biz: biz, items: items, unseen: unseen, last: items[items.length - 1].at };
    }).filter(Boolean).sort(function (a, b) { return (b.unseen - a.unseen) || (b.last - a.last); });
  }
  function hasStory(bid) { return storyGroups().some(function (g) { return String(g.biz.id) === String(bid); }); }
  function ago(at) {
    var m = Math.max(1, Math.round((Date.now() - at) / 60000));
    return m < 60 ? faNum(m) + " دقیقه پیش" : faNum(Math.round(m / 60)) + " ساعت پیش";
  }

  function renderStories() {
    var bar = document.getElementById("storyBar");
    if (!bar) return;
    var groups = storyGroups();
    bar.hidden = false;
    bar.innerHTML = "";
    var track = el("div", "st-track");
    /* اول نوار: «استوری شما» برای صاحبان کسب‌وکار */
    var add = el("button", "st-item st-add");
    add.type = "button";
    add.innerHTML = '<span class="st-ring"><span class="st-logo"></span><span class="st-plus">' + SogIcon("plus", 16) + "</span></span>" +
      '<span class="st-name">استوری شما</span>';
    var myBiz = DATA.businesses.filter(function (b) { return SogBizStore.get(b.id); });
    if (myBiz[0] && myBiz[0].logo) add.querySelector(".st-logo").style.backgroundImage = 'url("' + myBiz[0].logo + '")';
    add.addEventListener("click", function () { composeStory(myBiz); });
    track.appendChild(add);
    groups.forEach(function (g, i) {
      var b = el("button", "st-item" + (g.unseen ? " is-new" : ""));
      b.type = "button";
      b.innerHTML = '<span class="st-ring"><span class="st-logo" style="background-image:url(\'' + esc(g.biz.logo) + '\')"></span></span>' +
        '<span class="st-name">' + esc(g.biz.name) + "</span>";
      b.addEventListener("click", function () { openStories(groups, i); });
      track.appendChild(b);
    });
    bar.appendChild(track);
  }
  function openStoriesFor(bid) {
    var groups = storyGroups();
    for (var i = 0; i < groups.length; i++) if (String(groups[i].biz.id) === String(bid)) return openStories(groups, i);
  }

  /* نمایشگر تمام‌صفحه: نوار پیشرفت، ۵ ثانیه برای هر استوری، لمس چپ = بعدی، لمس راست = قبلی،
     نگه داشتن = توقف، کشیدن به پایین = بستن */
  function openStories(groups, gi) {
    var DUR = 5000, ii = 0, t0 = 0, elapsed = 0, paused = false, raf = 0;
    var g = groups[gi];
    var first = g.items.findIndex ? g.items.findIndex(function (it) { return !seenMap()[it.id]; }) : -1;
    ii = first > 0 ? first : 0;
    var ov = el("div", "st-viewer");
    ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = '<div class="st-stage"><div class="st-img"></div><div class="st-shade"></div>' +
      '<div class="st-bars"></div>' +
      '<div class="st-top"><span class="st-av"></span><span class="st-who"><b></b><small></small></span>' +
      '<button type="button" class="st-del" hidden>حذف</button>' +
      '<button type="button" class="st-x" aria-label="بستن">' + SogIcon("close", 24) + "</button></div>" +
      '<p class="st-text"></p>' +
      '<div class="st-cta"><a class="st-go">مشاهده‌ی کسب‌وکار</a><a class="st-call" aria-label="تماس">' + SogIcon("call", 20) + "</a></div>" +
      '<button type="button" class="st-zone is-prev" aria-label="قبلی"></button><button type="button" class="st-zone is-next" aria-label="بعدی"></button></div>';
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { ov.classList.add("is-in"); });
    var q = function (s) { return ov.querySelector(s); };

    function paint() {
      g = groups[gi];
      var it = g.items[ii];
      q(".st-img").style.backgroundImage = 'url("' + it.img + '")';
      q(".st-av").style.backgroundImage = 'url("' + g.biz.logo + '")';
      q(".st-who b").textContent = g.biz.name;
      q(".st-who small").textContent = ago(it.at);
      q(".st-text").textContent = it.text || "";
      q(".st-text").hidden = !it.text;
      q(".st-del").hidden = !it.mine;
      q(".st-go").href = "business-detail.html?id=" + g.biz.id;
      q(".st-call").href = "tel:" + toEn(g.biz.phone || "");
      var bars = q(".st-bars"); bars.innerHTML = "";
      g.items.forEach(function (x, k) {
        var bb = el("span", "st-bar", "<i></i>");
        if (k < ii) bb.firstChild.style.width = "100%";
        bars.appendChild(bb);
      });
      markSeen(it.id);
      t0 = performance.now(); elapsed = 0;
    }
    function tick(now) {
      if (!paused) {
        var p = Math.min(1, (elapsed + now - t0) / DUR);
        var cur = q(".st-bars").children[ii];
        if (cur) cur.firstChild.style.width = (p * 100) + "%";
        if (p >= 1) { next(); }
      }
      raf = requestAnimationFrame(tick);
    }
    function next() {
      if (ii < groups[gi].items.length - 1) ii++;
      else if (gi < groups.length - 1) { gi++; ii = 0; }
      else return close();
      paint();
    }
    function prev() {
      if (ii > 0) ii--;
      else if (gi > 0) { gi--; ii = groups[gi].items.length - 1; }
      paint();
    }
    function pause(on) {
      if (on && !paused) { elapsed += performance.now() - t0; paused = true; ov.classList.add("is-paused"); }
      else if (!on && paused) { t0 = performance.now(); paused = false; ov.classList.remove("is-paused"); }
    }
    function close() {
      cancelAnimationFrame(raf);
      ov.classList.remove("is-in");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { ov.remove(); }, 220);
      render();
    }
    function onKey(e) {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") next();
      else if (e.key === "ArrowRight") prev();
    }
    document.addEventListener("keydown", onKey);
    q(".st-x").addEventListener("click", close);
    q(".st-del").addEventListener("click", function () {
      var it = groups[gi].items[ii];
      if (!confirm("این استوری حذف شود؟")) return;
      removeMyStory(groups[gi].biz.id, it.id);
      groups[gi].items.splice(ii, 1);
      if (!groups[gi].items.length) { groups.splice(gi, 1); ii = 0; if (gi >= groups.length) return close(); }
      else if (ii >= groups[gi].items.length) ii = groups[gi].items.length - 1;
      paint();
    });
    /* لمس کوتاه = جابه‌جایی؛ نگه‌داشتن = توقف؛ کشیدن به پایین = بستن */
    var downAt = 0, downY = 0, held = false, holdT;
    ["is-prev", "is-next"].forEach(function (cls) {
      var z = q(".st-zone." + cls);
      z.addEventListener("pointerdown", function (e) {
        downAt = Date.now(); downY = e.clientY; held = false;
        holdT = setTimeout(function () { held = true; pause(true); }, 220);
      });
      z.addEventListener("pointerup", function (e) {
        clearTimeout(holdT);
        if (e.clientY - downY > 80) return close();
        if (held) { pause(false); return; }
        if (cls === "is-next") next(); else prev();
      });
      z.addEventListener("pointercancel", function () { clearTimeout(holdT); pause(false); });
    });
    paint();
    raf = requestAnimationFrame(tick);
  }

  /* ---------- گذاشتن استوری (فعلاً روی همین دستگاه؛ با اتصال پایگاه داده برای همه) ---------- */
  var MY_KEY = "sog:bizStories";
  function myStories() { try { return JSON.parse(localStorage.getItem(MY_KEY)) || {}; } catch (e) { return {}; } }
  function saveMyStories(m) {
    var now = Date.now();
    Object.keys(m).forEach(function (k) {
      m[k] = (m[k] || []).filter(function (it) { return now - it.at < DAY; });
      if (!m[k].length) delete m[k];
    });
    try { localStorage.setItem(MY_KEY, JSON.stringify(m)); return true; } catch (e) { return false; }
  }
  function removeMyStory(bid, sid) {
    var m = myStories();
    m[bid] = (m[bid] || []).filter(function (it) { return it.id !== sid; });
    saveMyStories(m);
  }
  function composeStory(myBiz) {
    if (!myBiz.length) {
      if (confirm("برای گذاشتن استوری، اول کسب‌وکارتان را ثبت کنید. به صفحه‌ی ثبت کسب‌وکار بروید؟")) location.href = "biz-register.html";
      return;
    }
    var file = el("input"); file.type = "file"; file.accept = "image/*";
    file.addEventListener("change", function () {
      var f = file.files && file.files[0];
      if (!f) return;
      SogBizStore.storyImage(f).then(function (data) { composeSheet(myBiz, data); }).catch(function () { alert("این تصویر خوانده نشد."); });
    });
    file.click();
  }
  function composeSheet(myBiz, data) {
    var ov = el("div", "st-compose");
    ov.innerHTML = '<div class="stc-card"><div class="stc-prev" style="background-image:url(\'' + data + '\')"></div>' +
      '<div class="stc-form"><b class="stc-title">استوری تازه</b>' +
      (myBiz.length > 1 ? '<select class="stc-biz">' + myBiz.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + "</option>"; }).join("") + "</select>" : '<span class="stc-who">' + esc(myBiz[0].name) + "</span>") +
      '<textarea class="stc-text" rows="3" maxlength="120" placeholder="یک جمله‌ی کوتاه روی استوری (اختیاری)"></textarea>' +
      '<p class="stc-note">استوری ۲۴ ساعت دیده می‌شود.</p>' +
      '<div class="stc-acts"><button type="button" class="stc-cancel">انصراف</button><button type="button" class="stc-ok">انتشار استوری</button></div></div></div>';
    document.body.appendChild(ov);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { ov.classList.add("is-in"); });
    function done() { ov.classList.remove("is-in"); document.body.style.overflow = ""; setTimeout(function () { ov.remove(); }, 220); }
    ov.querySelector(".stc-cancel").addEventListener("click", done);
    ov.addEventListener("click", function (e) { if (e.target === ov) done(); });
    ov.querySelector(".stc-ok").addEventListener("click", function () {
      var sel = ov.querySelector(".stc-biz"), bid = sel ? sel.value : myBiz[0].id;
      var m = myStories();
      (m[bid] = m[bid] || []).push({ id: "m" + Date.now(), img: data, text: ov.querySelector(".stc-text").value.trim(), at: Date.now() });
      if (!saveMyStories(m)) { alert("حافظه‌ی مرورگر پر است؛ یک استوری قبلی را حذف کنید."); return; }
      done(); render();
      openStoriesFor(bid);
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
      /* جستجو در همه‌ی دسته‌ها */
      if (state.query) { state.category = null; state.sub = null; }
      render();
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
      input.value = text; state.query = text; state.category = null; state.sub = null; render();
    };
    rec.onend = function () { mic.classList.remove("is-listening"); stopCountdown(); };
    rec.onerror = function () { mic.classList.remove("is-listening"); stopCountdown(); };
  }

  /* ---------- راه‌اندازی ---------- */
  load().then(function () {
    bindCityPicker(); render(); bindSearch();
    /* از «کسب‌وکارهای من»: عکس انتخاب‌شده آنجا، این‌جا منتشر می‌شود */
    var sq = new URLSearchParams(location.search).get("story"), draft = null;
    try { draft = sessionStorage.getItem("sog:storyDraft"); sessionStorage.removeItem("sog:storyDraft"); } catch (e) {}
    var mineB = DATA.businesses.filter(function (b) { return String(b.id) === sq && SogBizStore.get(b.id); });
    if (sq && draft && mineB.length) { history.replaceState(null, "", "business.html"); composeSheet(mineB, draft); }
  }).catch(function (e) {
    document.getElementById("bzMain").innerHTML = '<p class="bh-empty">خطا در بارگذاری کسب‌وکارها.</p>';
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
