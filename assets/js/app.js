/* اپلیکیشن سوگ — منطق صفحه اصلی
   داده‌ها از فایل‌های JSON خوانده می‌شوند (هم‌شکل با خروجی WordPress REST API).
   در نسخه‌ی وردپرس فقط مسیر fetch به REST API تغییر می‌کند. */
(function () {
  "use strict";

  var DATA = { listings: [], cities: [] };
  var state = { city: "all", query: "", year: null };

  var CARDS_BEFORE_COLLECTION = 5; // بعد از ۵ کارت، کالکشن سال‌ها

  /* ---------- کمک‌کارها ---------- */
  var FA_DIGITS = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
  function toFa(n) { return String(n).replace(/[0-9]/g, function (d) { return FA_DIGITS[+d]; }); }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
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
    if (state.query) {
      var q = state.query.trim();
      var hay = (item.deceased_name + " " + item.city + " " + (item.ceremony_labels || []).join(" "));
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  }

  /* تعداد آگهی‌های مشاهده‌نشده برای هر شهر */
  function unseenCountForCity(slug) {
    return DATA.listings.filter(function (it) {
      if (slug !== "all" && it.city_slug !== slug) return false;
      return !SogStore.isSeen(it.id);
    }).length;
  }

  /* ---------- رندر نوار شهرها ---------- */
  function renderCities() {
    var bar = document.getElementById("cityBar");
    bar.innerHTML = "";
    DATA.cities.forEach(function (c, idx) {
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
    top.appendChild(tags);
    top.appendChild(bm);

    var name = el("h3", "listing-name", item.deceased_name);
    var divider = el("div", "listing-divider");

    var meta = el("div", "listing-meta");
    meta.innerHTML =
      '<span class="meta-date"><span class="meta-ico">' + calendarSvg() + '</span>' +
      (item.event_weekday ? item.event_weekday + " " : "") + item.event_date_jalali + '</span>' +
      '<span class="sep"></span>' +
      '<span class="meta-city">' + item.city + '</span>';

    body.appendChild(top);
    body.appendChild(name);
    body.appendChild(divider);
    body.appendChild(meta);

    card.appendChild(body);
    card.appendChild(photo);

    card.addEventListener("click", function () {
      SogStore.markSeen(item.id);
      renderCities(); // به‌روزرسانی نشانگر مشاهده‌نشده
    });

    return card;
  }

  function bookmarkSvg(filled) {
    return '<svg viewBox="0 0 24 24" width="20" height="20">' +
      '<path d="M6 3h12v18l-6-4-6 4V3z" ' +
      (filled ? 'fill="currentColor" stroke="currentColor"' : 'fill="none" stroke="currentColor"') +
      ' stroke-width="1.8" stroke-linejoin="round"/></svg>';
  }
  function calendarSvg() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" style="vertical-align:-2px">' +
      '<rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
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
      yc.style.backgroundImage = 'url("assets/img/candle.svg")';
      yc.appendChild(el("span", "year-count", toFa(counts[y]) + " آگهی"));
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
    if (state.year == null && state.city === "all" && !state.query) return null;
    var label = [];
    if (state.city !== "all") {
      var c = DATA.cities.filter(function (x) { return x.slug === state.city; })[0];
      if (c) label.push("شهر: " + c.name);
    }
    if (state.year != null) label.push("سال فوت: " + toFa(state.year));
    if (state.query) label.push("جستجو: «" + state.query + "»");
    var b = el("div", "filter-banner");
    b.appendChild(el("span", null, label.join(" • ")));
    var btn = el("button", null, "حذف فیلتر");
    btn.type = "button";
    btn.addEventListener("click", function () {
      state.city = "all"; state.year = null; state.query = "";
      var s = document.getElementById("searchInput"); if (s) s.value = "";
      renderCities(); renderFeed();
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

    var items = DATA.listings.filter(matchesFilters);

    if (items.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    // آیا کالکشن سال را نشان بدهیم؟ فقط در نمای پیش‌فرض (بدون فیلتر سال/جستجو)
    var showCollection = (state.year == null && !state.query);
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
  load().then(function () {
    renderCities();
    renderFeed();
    bindSearch();
  }).catch(function (err) {
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
