/* اپلیکیشن سوگ — منطق صفحه اصلی
   داده‌ها از فایل‌های JSON خوانده می‌شوند (هم‌شکل با خروجی WordPress REST API).
   در نسخه‌ی وردپرس فقط مسیر fetch به REST API تغییر می‌کند. */
(function () {
  "use strict";

  var DATA = { listings: [], cities: [] };
  var state = { city: "all", query: "", year: null, ceremony: null, sort: "newest", followOnly: false, savedOnly: false, tayefe: null, il: null };
  var PARAMS = new URLSearchParams(location.search);
  if (PARAMS.get("view") === "saved") state.savedOnly = true;
  // ورود از لینک «طایفه» / «ایل» در صفحه‌ی آگهی
  state.tayefe = PARAMS.get("tayefe") || null;
  state.il = PARAMS.get("il") || null;

  var CARDS_BEFORE_COLLECTION = 5; // بعد از ۵ کارت، کالکشن سال‌ها

  var CEREMONY_TYPES = [
    { type: "khaksepari", label: "تشییع و خاکسپاری" },
    { type: "salgard", label: "سالگرد" },
    { type: "chehelom", label: "چهلم" },
    { type: "bozorgdasht", label: "بزرگداشت" }
  ];

  /* ---------- کمک‌کارها ---------- */
  var FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  function toFa(n) { return String(n).replace(/[0-9]/g, function (d) { return FA_DIGITS[+d]; }); }
  function toEn(s) { return String(s == null ? "" : s).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); }
  // تاریخ شمسی «۱۴۰۵/۱۱/۲۹» → عدد قابل مقایسه ۱۴۰۵۱۱۲۹
  function jalaliNum(item) {
    var p = toEn(item.event_date_jalali || "").split("/");
    if (p.length !== 3) return 0;
    return parseInt(p[0], 10) * 10000 + parseInt(p[1], 10) * 100 + parseInt(p[2], 10);
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ---------- اسکلتون لودینگ ---------- */
  function renderSkeletons() {
    var bar = document.getElementById("cityBar");
    bar.classList.add("is-loading");
    bar.innerHTML = "";
    for (var i = 0; i < 6; i++) bar.appendChild(el("div", "skeleton sk-chip"));

    var feed = document.getElementById("feed");
    feed.innerHTML = "";
    for (var j = 0; j < 5; j++) {
      var card = el("div", "sk-card");
      card.appendChild(el("div", "skeleton sk-photo"));
      var body = el("div", "sk-body");
      body.appendChild(el("div", "skeleton sk-line tag"));
      body.appendChild(el("div", "skeleton sk-line name"));
      body.appendChild(el("div", "skeleton sk-line meta"));
      card.appendChild(body);
      feed.appendChild(card);
    }
  }

  /* ---------- بارگذاری داده ---------- */
  function load() {
    return Promise.all([
      fetch("data/listings.json").then(function (r) { return r.json(); }),
      fetch("data/cities.json").then(function (r) { return r.json(); })
    ]).then(function (res) {
      DATA.listings = res[0].listings || [];
      DATA.cities = res[1].cities || [];
    });
  }

  /* ---------- فیلترها ---------- */
  function matchesFilters(item) {
    if (state.city !== "all" && item.city_slug !== state.city) return false;
    if (state.year != null && item.death_year !== state.year) return false;
    if (state.ceremony && item.ceremony_type !== state.ceremony) return false;
    if (state.tayefe && item.tayefe !== state.tayefe) return false;
    if (state.il && item.il !== state.il) return false;
    if (state.followOnly && !SogStore.isFollowing(item.id)) return false;
    if (state.savedOnly && !SogStore.isSaved(item.id)) return false;
    if (state.query) {
      var q = state.query.trim();
      var hay = (item.deceased_name + " " + item.city + " " + (item.tayefe || "") + " " + (item.il || "") + " " + (item.ceremony_labels || []).join(" "));
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }
  function sortItems(items) {
    return items.slice().sort(function (a, b) {
      return state.sort === "soonest" ? jalaliNum(a) - jalaliNum(b) : jalaliNum(b) - jalaliNum(a);
    });
  }

  /* تعداد آگهی‌های مشاهده‌نشده برای هر شهر */
  function unseenCountForCity(slug) {
    return DATA.listings.filter(function (it) {
      if (slug !== "all" && it.city_slug !== slug) return false;
      return !SogStore.isSeen(it.id);
    }).length;
  }

  /* شهرها به ترتیب تعداد آگهی‌های جدید (مشاهده‌نشده) — بیشتر، جلوتر.
     شهر ویژه («کل ایران») همیشه اول می‌ماند و ترتیب اصلی، تساوی‌ها را می‌شکند. */
  function orderedCities() {
    return DATA.cities.map(function (c, i) {
      return { city: c, idx: i, unseen: c.featured ? Infinity : unseenCountForCity(c.slug) };
    }).sort(function (a, b) {
      if (a.unseen !== b.unseen) return b.unseen - a.unseen;
      return a.idx - b.idx;
    }).map(function (x) { return x.city; });
  }

  /* ---------- رندر نوار شهرها ---------- */
  function renderCities() {
    var bar = document.getElementById("cityBar");
    bar.innerHTML = "";
    orderedCities().forEach(function (c, idx) {
      var chip = el("button", "city-chip");
      chip.type = "button";
      chip.dataset.slug = c.slug;
      if (c.slug === state.city) chip.classList.add("is-active");

      chip.appendChild(el("span", "chip-label", c.name));

      if (c.featured && c.total_label) {
        chip.appendChild(el("span", "chip-badge badge-featured", c.total_label));
      } else {
        var unseen = unseenCountForCity(c.slug);
        if (unseen > 0) chip.appendChild(el("span", "chip-badge", toFa(unseen)));
      }

      chip.addEventListener("click", function () {
        state.city = c.slug;
        state.year = null;
        renderCities();
        renderFeed();
      });

      bar.appendChild(chip);

      // دکمه‌ی «انتخاب شهر» بعد از چیپ فعال اول (مطابق طرح)
      if (idx === 3) {
        var add = el("button", "city-chip is-add");
        add.type = "button";
        add.innerHTML = '<span class="chip-label">انتخاب شهر</span><span class="add-plus">+</span>';
        add.addEventListener("click", function () {
          alert("انتخاب شهر — این بخش در نسخه‌ی کامل باز می‌شود.");
        });
        bar.appendChild(add);
      }
    });
  }

  /* ---------- نوار ابزار (نزدیک‌من، فیلتر نوع مراسم، مرتب‌سازی) ---------- */
  function renderToolbar() {
    var bar = document.getElementById("toolbar");
    if (!bar) return;
    bar.innerHTML = "";

    // نزدیک من (GPS)
    var gps = el("button", "tool-chip tool-gps",
      '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M12 21s7-6.2 7-12A7 7 0 105 9c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9" r="2.4" fill="currentColor"/></svg> نزدیک من');
    gps.type = "button";
    gps.addEventListener("click", useNearMe);
    bar.appendChild(gps);

    bar.appendChild(el("span", "tool-sep"));

    // فیلتر نوع مراسم
    CEREMONY_TYPES.forEach(function (c) {
      var chip = el("button", "tool-chip" + (state.ceremony === c.type ? " is-active" : ""), c.label);
      chip.type = "button";
      chip.addEventListener("click", function () {
        state.ceremony = (state.ceremony === c.type ? null : c.type);
        state.year = null; renderToolbar(); renderFeed();
      });
      bar.appendChild(chip);
    });

    bar.appendChild(el("span", "tool-sep"));

    // مرتب‌سازی
    var sortLabel = state.sort === "soonest" ? "نزدیک‌ترین مراسم" : "جدیدترین";
    var sort = el("button", "tool-chip",
      '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M7 4v16M7 20l-3-3M7 4l3 3M17 20V4M17 4l-3 3M17 20l3-3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg> ' + sortLabel);
    sort.type = "button";
    sort.addEventListener("click", function () { state.sort = state.sort === "newest" ? "soonest" : "newest"; renderToolbar(); renderFeed(); });
    bar.appendChild(sort);
  }

  /* «نزدیک من»: نزدیک‌ترین شهر بر اساس GPS */
  function useNearMe() {
    if (!navigator.geolocation) { alert("موقعیت‌یابی در این مرورگر پشتیبانی نمی‌شود."); return; }
    var chip = document.querySelector(".tool-gps");
    if (chip) chip.textContent = "در حال یافتن…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var la = pos.coords.latitude, lo = pos.coords.longitude, best = null, bestD = Infinity;
      DATA.cities.forEach(function (c) {
        if (c.lat == null) return;
        var d = Math.pow(c.lat - la, 2) + Math.pow(c.lng - lo, 2);
        if (d < bestD) { bestD = d; best = c; }
      });
      if (best) { state.city = best.slug; state.year = null; state.sort = "soonest"; renderCities(); renderToolbar(); renderFeed(); }
    }, function () {
      alert("دسترسی به موقعیت داده نشد. لطفاً شهر را دستی انتخاب کنید.");
      renderToolbar();
    }, { timeout: 8000 });
  }

  /* جستجوی صوتی فارسی (Web Speech API) */
  function bindVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var mic = document.getElementById("micBtn");
    if (!SR || !mic) return;
    mic.hidden = false;
    var rec = new SR();
    rec.lang = "fa-IR"; rec.interimResults = false; rec.maxAlternatives = 1;
    mic.addEventListener("click", function () {
      try { rec.start(); mic.classList.add("is-listening"); } catch (e) {}
    });
    rec.onresult = function (e) {
      var text = e.results[0][0].transcript;
      var input = document.getElementById("searchInput");
      input.value = text; state.query = text; state.year = null; renderFeed();
    };
    rec.onend = function () { mic.classList.remove("is-listening"); };
    rec.onerror = function () { mic.classList.remove("is-listening"); };
  }

  /* متن‌های طولانی کارت: همیشه تک‌خطی؛ اگر جا نشد، آرام رفت‌وبرگشت حرکت می‌کنند. */
  function marquee(node) {
    node.classList.add("mq");
    requestAnimationFrame(function () {
      var inner = node.querySelector(".mq-inner");
      if (!inner) return;
      var over = inner.scrollWidth - node.clientWidth;
      if (over <= 4) return;
      node.classList.add("is-marquee");
      node.style.setProperty("--mq-shift", over + "px");
      node.style.setProperty("--mq-dur", Math.max(5, over / 16).toFixed(1) + "s");
    });
  }

  /* ---------- کارت آگهی ---------- */
  function listingCard(item) {
    var card = el("article", "listing-card");
    card.dataset.id = item.id;

    var photo = el("div", "listing-photo");
    if (item.photo) photo.style.backgroundImage = 'url("' + item.photo + '")';

    var body = el("div", "listing-body");

    // بالای کارت: برچسب‌ها + بوکمارک
    var top = el("div", "listing-top");
    var tags = el("div", "tags");
    (item.ceremony_labels || []).forEach(function (lbl) {
      var t = el("span", "tag", lbl);
      t.dataset.type = item.ceremony_type;
      tags.appendChild(t);
    });
    var actions = el("div", "card-actions");
    actions.style.cssText = "display:flex;align-items:flex-start;order:2";
    var saved = SogStore.isSaved(item.id);
    var bm = el("button", "bookmark-btn" + (saved ? " is-saved" : ""));
    bm.type = "button";
    bm.setAttribute("aria-label", "ذخیره");
    bm.innerHTML = bookmarkSvg(saved);
    bm.addEventListener("click", function (e) {
      e.stopPropagation();
      var now = SogStore.toggleSaved(item.id);
      bm.classList.toggle("is-saved", now);
      bm.innerHTML = bookmarkSvg(now);
    });
    actions.appendChild(bm);
    top.appendChild(tags);
    top.appendChild(actions);

    var name = el("h3", "listing-name", '<span class="mq-inner">' + item.deceased_name + '</span>');
    var divider = el("div", "listing-divider");

    var meta = el("div", "listing-meta");
    meta.innerHTML = '<span class="mq-inner">' +
      '<span class="meta-date">' +
      (item.event_weekday ? item.event_weekday + " " : "") + item.event_date_jalali + '</span>' +
      '<span class="sep"></span>' +
      '<span class="meta-city">' + item.city + '</span></span>';
    marquee(name); marquee(meta);

    body.appendChild(top);
    body.appendChild(name);
    body.appendChild(divider);
    body.appendChild(meta);

    card.appendChild(photo);
    card.appendChild(body);

    card.addEventListener("click", function () {
      SogStore.markSeen(item.id);
      location.href = "listing.html?id=" + encodeURIComponent(item.id);
    });

    return card;
  }

  function bookmarkSvg(filled) {
    return '<svg viewBox="0 0 24 24" width="20" height="20">' +
      '<path d="M6 3h12v18l-6-4-6 4V3z" ' +
      (filled ? 'fill="currentColor" stroke="currentColor"' : 'fill="none" stroke="currentColor"') +
      ' stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }

  /* ---------- کالکشن سال‌های گذشته (خودکار) ---------- */
  function buildYearCollection() {
    // گروه‌بندی خودکار بر اساس سال فوت، به‌جز سال جاری‌ترین‌ها
    var counts = {};
    DATA.listings.forEach(function (it) {
      if (it.death_year == null) return;
      counts[it.death_year] = (counts[it.death_year] || 0) + 1;
    });
    var years = Object.keys(counts).map(Number).sort(function (a, b) { return b - a; });
    // «سال‌های گذشته» = همه‌ی سال‌ها به‌جز جدیدترین سال
    if (years.length <= 1) return null;
    var pastYears = years.slice(1);

    var wrap = el("section", "year-collection");
    wrap.appendChild(el("h2", "collection-title", "سوگ‌های سال‌های گذشته"));
    var track = el("div", "year-track");
    pastYears.forEach(function (y) {
      var yc = el("button", "year-card");
      yc.type = "button";
      yc.style.backgroundImage = 'url("assets/img/candles.jpg")';
      yc.appendChild(el("span", "year-label", toFa(y)));
      yc.addEventListener("click", function () {
        state.year = (state.year === y ? null : y);
        state.city = "all";
        renderCities();
        renderFeed();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      track.appendChild(yc);
    });
    wrap.appendChild(track);
    return wrap;
  }

  /* ---------- بنر فیلتر فعال ---------- */
  function filterBanner() {
    if (state.year == null && state.city === "all" && !state.query && !state.ceremony && !state.followOnly && !state.savedOnly && !state.tayefe && !state.il) return null;
    var label = [];
    if (state.savedOnly) label.push("ذخیره‌شده‌ها");
    if (state.followOnly) label.push("دنبال‌شده‌ها");
    if (state.tayefe) label.push("طایفه: " + state.tayefe);
    if (state.il) label.push("ایل: " + state.il);
    if (state.city !== "all") {
      var c = DATA.cities.filter(function (x) { return x.slug === state.city; })[0];
      if (c) label.push("شهر: " + c.name);
    }
    if (state.ceremony) {
      var ct = CEREMONY_TYPES.filter(function (x) { return x.type === state.ceremony; })[0];
      if (ct) label.push(ct.label);
    }
    if (state.year != null) label.push("سال فوت: " + toFa(state.year));
    if (state.query) label.push("جستجو: «" + state.query + "»");
    var b = el("div", "filter-banner");
    b.appendChild(el("span", null, label.join(" • ")));
    var btn = el("button", null, "حذف فیلتر");
    btn.type = "button";
    btn.addEventListener("click", function () {
      state.city = "all"; state.year = null; state.query = ""; state.ceremony = null; state.followOnly = false; state.savedOnly = false;
      state.tayefe = null; state.il = null;
      // پارامترهای فیلتر را از URL هم پاک کن تا رفرش دوباره فیلتر نکند
      if (history.replaceState) history.replaceState(null, "", location.pathname);
      var s = document.getElementById("searchInput"); if (s) s.value = "";
      renderCities(); renderToolbar(); renderFeed();
    });
    b.appendChild(btn);
    return b;
  }

  /* ---------- رندر فید ---------- */
  function renderFeed() {
    var feed = document.getElementById("feed");
    var empty = document.getElementById("emptyState");
    feed.innerHTML = "";

    var banner = filterBanner();
    if (banner) feed.appendChild(banner);

    var items = sortItems(DATA.listings.filter(matchesFilters));

    if (items.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    // آیا کالکشن سال را نشان بدهیم؟ فقط در نمای پیش‌فرض
    var showCollection = (state.year == null && !state.query && !state.ceremony && !state.followOnly && !state.savedOnly && !state.tayefe && !state.il);
    var collection = showCollection ? buildYearCollection() : null;

    items.forEach(function (item, i) {
      if (collection && i === CARDS_BEFORE_COLLECTION) {
        feed.appendChild(collection);
        collection = null;
      }
      feed.appendChild(listingCard(item));
    });
    // اگر آگهی‌ها کمتر از حد بودند، کالکشن را انتهای فهرست بگذار
    if (collection) feed.appendChild(collection);
  }

  /* ---------- جستجو ---------- */
  function bindSearch() {
    var input = document.getElementById("searchInput");
    var t;
    input.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        state.query = input.value;
        state.year = null;
        renderFeed();
      }, 180);
    });
  }

  /* ---------- راه‌اندازی ---------- */
  renderSkeletons();
  var minDelay = new Promise(function (r) { setTimeout(r, 550); }); // حداقل نمایش اسکلتون
  Promise.all([load(), minDelay]).then(function () {
    document.getElementById("cityBar").classList.remove("is-loading");
    renderCities();
    renderToolbar();
    renderFeed();
    bindSearch();
    bindVoice();
  }).catch(function (err) {
    document.getElementById("cityBar").classList.remove("is-loading");
    document.getElementById("feed").innerHTML =
      '<p style="color:#c66;text-align:center;padding:30px">خطا در بارگذاری داده‌ها.</p>';
    console.error(err);
  });

  /* ---------- ثبت service worker (PWA) ---------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    });
  }
})();
