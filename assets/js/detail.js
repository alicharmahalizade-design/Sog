/* صفحه جزئیات آگهی سوگ — کاملاً داده‌محور و آکاردیونی.
   داده از data/details.json (کلید = id آگهی) و در نبود آن، پایه از data/listings.json.
   ساختار داده هم‌شکل ACF/WordPress است. */
(function () {
  "use strict";

  var root = document.getElementById("detail");
  var id = new URLSearchParams(location.search).get("id") || "101";

  /* ---------- آیکون‌ها ---------- */
  var ICON = {
    back: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    chevron: '<svg class="chev" viewBox="0 0 24 24" width="20" height="20"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 22s7-6.2 7-12A7 7 0 105 10c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="18" cy="5" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8.3 10.7l7.4-4.3M8.3 13.3l7.4 4.3" stroke="currentColor" stroke-width="1.8"/></svg>',
    story: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="3" width="16" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 19c1.2-2.2 3-3.3 5-3.3s3.8 1.1 5 3.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    sound: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 9c1.5 1.8 1.5 4.2 0 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M17 9l4 6M21 9l-4 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    bookmark: function (f) { return '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 3h12v18l-6-4-6 4V3z" ' + (f ? 'fill="currentColor" stroke="currentColor"' : 'fill="none" stroke="currentColor"') + ' stroke-width="1.8" stroke-linejoin="round"/></svg>'; },
    report: '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 21V4h9l-1 3 1 3H5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    candle: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3c1.6 2 1.4 3.4 0 4.4C10.6 6.4 10.4 5 12 3z" fill="currentColor"/><rect x="9.5" y="8.5" width="5" height="11" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7.8v1" stroke="currentColor" stroke-width="1.4"/></svg>',
    route: '<svg viewBox="0 0 24 24" width="17" height="17"><path d="M12 22s7-6.2 7-12A7 7 0 105 10c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>',
    calAdd: '<svg viewBox="0 0 24 24" width="17" height="17"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 9h18M8 3v4M16 3v4M12 13v4M10 15h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    call: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M5 4h4l1.5 5-2 1.5a12 12 0 005 5l1.5-2 5 1.5v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" fill="currentColor"/></svg>',
    sms: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 5h16v11H8l-4 3V5z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 10h8M8 13h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.6-1.2A9 9 0 1012 3z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 8c0 4 3 7 7 7 .7 0 1-1 .6-1.6l-1.7-.9-1 .9c-1.3-.5-2.3-1.5-2.8-2.8l.9-1-.9-1.7C11 7.1 9.7 7.3 9 8z" fill="currentColor"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M21 5L3 12l5 2 2 5 3-3 4 3 4-14z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 14l9-6-6 7" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17" cy="7" r="1.1" fill="currentColor"/></svg>',
    eitaa: '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8 14c2 2 6 2 8-2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/></svg>'
  };

  /* ---------- کمک ---------- */
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmtDesc(s) { // ⟪...⟫ → لینک خیریه
    return esc(s).replace(/⟪(.+?)⟫/g, '<span class="charity">$1</span>');
  }

  /* ---------- اسکلتون ---------- */
  function skeleton() {
    root.classList.add("detail-skeleton");
    root.innerHTML = '<div class="skeleton sk-hero"></div>' +
      '<div class="skeleton sk-block" style="height:120px"></div>' +
      '<div class="skeleton sk-block"></div>' +
      '<div class="skeleton sk-block" style="height:200px"></div>' +
      '<div class="skeleton sk-block" style="height:200px"></div>';
  }

  /* ---------- بارگذاری ---------- */
  var deceasedCity = null;

  Promise.all([
    fetch("data/details.json").then(function (r) { return r.json(); }),
    fetch("data/listings.json").then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; }),
    new Promise(function (r) { setTimeout(r, 450); })
  ]).then(function (res) {
    var details = res[0] || {};
    var listings = (res[1] && res[1].listings) || [];
    var lst = listings.filter(function (x) { return String(x.id) === String(id); })[0];
    if (lst) { deceasedCity = lst.city; }
    var d = details[id];
    if (!d) d = fallbackFromListing(listings, id);
    render(d);
  }).catch(function (e) {
    root.innerHTML = '<p style="color:#c66;text-align:center;padding:40px">خطا در بارگذاری جزئیات.</p>';
    console.error(e);
  });

  /* هر آگهیِ بدون رکورد اختصاصی، با همان قالب کاملِ صفحه‌ی نمونه ساخته می‌شود
     تا همه‌ی صفحه‌های تکیِ سوگ یک فرمت واحد داشته باشند. */
  var JMONTH_NAMES = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

  function jDateWords(jalali, weekday) {
    var p = toEnNum(jalali || "").split("/");
    if (p.length !== 3) return jalali || "";
    var m = JMONTH_NAMES[parseInt(p[1], 10) - 1] || "";
    var txt = faNum(parseInt(p[2], 10)) + " " + m + " " + faNum(p[0]);
    return weekday ? weekday + " " + txt : txt;
  }

  function fallbackFromListing(listings, id) {
    var l = listings.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!l) return { deceased_name: "آگهی یافت نشد", subtitle: "", photos: [], ceremonies: [], anniversaries: [], contacts: [], condolences: [] };
    return buildDetail(l);
  }

  function buildDetail(l) {
    var city = l.city || l.location || "";
    var venue = city + " - مسجد جامع - سالن اجتماعات";
    var when = jDateWords(l.event_date_jalali, l.event_weekday);
    var deathYear = l.death_year ? faNum(l.death_year) : "";

    function block(type, title, loc, chips, desc, gallery) {
      return {
        type: type, title: title, expanded: false,
        date: when, time_from: "۱۶:۰۰", time_to: "۱۸:۰۰",
        location: loc, map: "assets/img/map.svg",
        chips: chips, description: desc, gallery: gallery
      };
    }

    var noticeChips = ["به صرف پذیرایی", "وسیله نقلیه از مکان مراسم مهیا می‌باشد"];
    var notice = "از دوستان، فامیل و همشهریان محترم به عرض می‌رساند در این مراسم هیچگونه پولی دریافت نمی‌شود و در صورت صلاحدید از طریق ⟪خیریه⟫ اقدام نمایند.";

    var ceremonies = [];
    if (l.ceremony_type === "khaksepari") {
      ceremonies.push(block("khaksepari", "خاکسپاری", city + " - آرامستان بهشت رضوان", noticeChips, notice,
        ["assets/img/hall-1.jpg", "assets/img/hall-2.jpg", "assets/img/hall-3.jpg"]));
    }
    ceremonies.push(block("som-haftom", "سوم / هفتم / ختم", venue, noticeChips, notice,
      ["assets/img/hall-2.jpg", "assets/img/hall-3.jpg", "assets/img/hall-4.jpg"]));
    if (l.ceremony_type === "bozorgdasht") {
      ceremonies.push(block("bozorgdasht", "بزرگداشت", venue, ["به صرف پذیرایی"], notice,
        ["assets/img/hall-1.jpg", "assets/img/hall-5.jpg"]));
    }

    var years = [];
    var startYear = parseInt(toEnNum(l.event_date_jalali || "۱۴۰۵").split("/")[0], 10) || 1405;
    for (var y = startYear; y > startYear - 6; y--) {
      years.push(y === startYear
        ? { year: faNum(y), expanded: false, date: when, time_from: "۱۶:۰۰", time_to: "۱۸:۰۰",
            location: city + " - آرامستان بهشت رضوان", map: "assets/img/map.svg",
            chips: ["به صرف پذیرایی"], description: "بعد از قرائت فاتحه بر مزار مرحوم، مراسم دعای کمیل نیز همان روز در منزل شخصی برگزار می‌گردد." }
        : { year: faNum(y), expanded: false, empty: true });
    }

    return {
      id: l.id,
      deceased_name: l.deceased_name,
      subtitle: city,
      photos: [l.photo],
      birth: null,
      death: deathYear ? { date: deathYear, place: city } : null,
      // نامِ پدر/مادر در داده‌ی آگهی نیست؛ فقط طایفه و ایل نمایش داده می‌شود.
      family: (l.tayefe || l.il) ? { father: { tayefe: l.tayefe, il: l.il }, mother: null } : null,
      biography: {
        text: "یاد و خاطره‌ی " + l.deceased_name + " برای خانواده، دوستان و همشهریانش گرامی است. " +
              "این صفحه به‌یاد ایشان ساخته شده تا آشنایان بتوانند زمان و مکان مراسم را ببینند و پیام همدردی خود را ثبت کنند.",
        gallery: [],
        relatives: []
      },
      ceremonies: ceremonies,
      acknowledgment: {
        text: "از تمامی عزیزانی که در این مصیبت ما را تنها نگذاشتند و با حضور یا پیام خود موجب تسلی خاطر خانواده شدند، صمیمانه سپاسگزاریم.",
        signature: "خانواده‌ی سوگوار",
        date: when,
        has_story: false
      },
      chehelom: block("chehelom", "چهلم", city + " - آرامستان بهشت رضوان", ["به صرف پذیرایی"],
        "بعد از قرائت فاتحه بر مزار مرحوم، مراسم دعای کمیل نیز همان روز در منزل شخصی برگزار می‌گردد."),
      anniversaries: years,
      contacts: [
        { type: "call", label: "تماس" },
        { type: "sms", label: "پیامک" },
        { type: "whatsapp", label: "واتساپ" },
        { type: "eitaa", label: "ایتا" },
        { type: "telegram", label: "تلگرام" },
        { type: "instagram", label: "اینستاگرام" }
      ],
      condolence_count: "۰",
      condolences: []
    };
  }

  skeleton();

  /* ---------- رندر اصلی ---------- */
  function render(d) {
    root.classList.remove("detail-skeleton");
    root.innerHTML = "";
    currentName = d.deceased_name;
    currentDetail = d;
    document.title = d.deceased_name + " | سوگ";

    root.appendChild(hero(d));
    if (d.birth || d.death || d.age) root.appendChild(infoBox(d));
    if (d.family) { var fam = familyGrid(d.family); if (fam) root.appendChild(fam); }
    root.appendChild(actionRow(d));
    root.appendChild(reportError(d));

    if (d.biography) root.appendChild(bioAccordion(d.biography));
    (d.ceremonies || []).forEach(function (c) { root.appendChild(eventAccordion(c)); });
    if (d.acknowledgment) root.appendChild(ackAccordion(d.acknowledgment));
    if (d.chehelom) root.appendChild(eventAccordion(d.chehelom));
    var anniv = anniversariesSection(d.anniversaries);
    if (anniv) root.appendChild(anniv);

    if ((d.contacts || []).length) {
      root.appendChild(el("h2", "section-title", "ارتباط با خانواده سوگوار"));
      root.appendChild(contactRow(d.contacts, d));
    }
    root.appendChild(condolenceSection(d));
    root.appendChild(guestbookSection(d));

    if (ownerMode(d)) root.appendChild(ownerNote(d));
    root.appendChild(privateNote(d));
    root.appendChild(needsBanner());
    bindAccordions();
    markAccordionGroups(root);
    [].forEach.call(root.querySelectorAll(".acc-pad"), markAccordionGroups);
  }

  /* آکاردیون‌های پشت‌سرهم یک گروه‌اند؛ فقط بالای اولین و پایین آخرین عضو گرد می‌شود. */
  function markAccordionGroups(container) {
    var kids = container.children, prevIsAcc = false;
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i], isAcc = k.classList.contains("accordion");
      if (isAcc) {
        k.classList.remove("is-group-first");
        k.classList.remove("is-group-last");
        if (!prevIsAcc) k.classList.add("is-group-first");
        var next = kids[i + 1];
        if (!next || !next.classList.contains("accordion")) k.classList.add("is-group-last");
      }
      prevIsAcc = isAcc;
    }
  }

  /* ---------- هدر ---------- */
  function hero(d) {
    var wrap = el("section", "detail-hero");
    var photo = el("div", "hero-photo");
    var slides = el("div", "hero-slides");
    (d.photos && d.photos.length ? d.photos : ["assets/img/portrait-1.svg"]).forEach(function (src) {
      var s = el("div", "hero-slide"); s.style.backgroundImage = 'url("' + src + '")'; slides.appendChild(s);
    });
    photo.appendChild(slides);

    var top = el("div", "hero-top");
    var back = el("button", "round-btn", ICON.back); back.setAttribute("aria-label", "بازگشت");
    back.addEventListener("click", function () { if (history.length > 1) history.back(); else location.href = "index.html"; });
    // در RTL: لوگو سمت راست، دکمه بازگشت سمت چپ
    top.appendChild(el("a", "logo", '<img src="assets/img/logo.png" alt="سوگ">'));
    top.appendChild(back);
    photo.appendChild(top);

    var n = (d.photos || []).length;
    if (n > 1) {
      var dots = el("div", "hero-dots");
      var idx = 0;
      for (var i = 0; i < n; i++) { var dot = el("span", "dot" + (i === 0 ? " is-active" : "")); dots.appendChild(dot); }
      photo.appendChild(dots);
      var go = function (k) {
        idx = (k + n) % n;
        slides.style.transform = "translateX(" + (idx * 100) + "%)"; // RTL: مثبت به‌سمت اسلاید بعد
        [].forEach.call(dots.children, function (c, j) { c.classList.toggle("is-active", j === idx); });
      };
      [].forEach.call(dots.children, function (c, j) { c.addEventListener("click", function () { go(j); }); });
      setInterval(function () { go(idx + 1); }, 4500);
    }

    wrap.appendChild(photo);
    wrap.appendChild(el("h1", "detail-name", esc(d.deceased_name)));
    if (d.subtitle) wrap.appendChild(el("p", "detail-subtitle", esc(d.subtitle)));
    return wrap;
  }

  /* ---------- جعبه اطلاعات ---------- */
  function infoBox(d) {
    var box = el("div", "info-box");
    var rows = el("div", "info-rows");
    if (d.birth) rows.appendChild(infoLine("تولد", d.birth));
    if (d.death) rows.appendChild(infoLine("وفات", d.death));
    box.appendChild(rows);
    if (d.age) box.appendChild(el("div", "info-age", esc(d.age)));
    return box;
  }
  function infoLine(lbl, o) {
    var line = el("div", "info-line");
    line.appendChild(el("span", "lbl", lbl));
    line.appendChild(el("span", "val", esc(o.date) + ' <span class="sep-dash">ـ</span> ' + esc(o.place)));
    return line;
  }

  /* ---------- خانواده ---------- */
  /* «طایفه» و «ایل» لینک هستند و به فهرست آگهی‌های همان طایفه/ایل می‌روند. */
  var CLAN_KEYS = { "طایفه": "tayefe", "ایل": "il" };

  function familyGrid(f) {
    var grid = el("div", "family-grid");
    var p = f.father || {}, m = f.mother || {};
    // ردیف‌ها همیشه ساخته می‌شوند؛ فیلدِ پرنشده جای خالی نشان می‌دهد تا برچسب حذف نشود.
    grid.appendChild(familyCard([["پدر", p.name], ["طایفه", p.tayefe], ["ایل", p.il]]));
    grid.appendChild(familyCard([["مادر", m.name], ["طایفه", m.tayefe], ["ایل", m.il]]));
    return grid;
  }
  function familyCard(rows) {
    var card = el("div", "family-card");
    rows.forEach(function (r) {
      var row = el("div", "family-row");
      row.appendChild(el("span", "lbl", r[0]));
      var key = CLAN_KEYS[r[0]];
      if (!r[1]) {
        var empty = el("span", "val is-empty", "—");
        empty.setAttribute("aria-label", "ثبت‌نشده");
        row.appendChild(empty);
      } else if (key) {
        var a = el("a", "val clan-link", esc(r[1]));
        a.href = "index.html?" + key + "=" + encodeURIComponent(r[1]);
        a.title = "مشاهده‌ی همه‌ی آگهی‌های " + r[0] + " " + r[1];
        row.appendChild(a);
      } else {
        row.appendChild(el("span", "val", esc(r[1])));
      }
      card.appendChild(row);
    });
    return card;
  }

  /* ---------- دکمه‌های عمل ---------- */
  function actionRow(d) {
    var row = el("div", "action-row");
    row.appendChild(actionItem(ICON.share, "اشتراک", function () { shareCard(d); }));
    if (d.photos && d.photos.length) row.appendChild(actionItem(ICON.story, "استوری", function () { openStory(d); }));
    if (d.has_audio !== false) {
      var soundBtn = actionItem(ICON.sound, "صدا", null);
      var b = soundBtn.querySelector("button");
      startMusic(d, b);
      row.appendChild(soundBtn);
    }
    var saved = SogStore.isSaved(Number(d.id) || d.id);
    var saveBtn = actionItem(ICON.bookmark(saved), "ذخیره", null);
    var sb = saveBtn.querySelector("button");
    if (saved) sb.classList.add("is-active");
    sb.addEventListener("click", function () {
      var now = SogStore.toggleSaved(Number(d.id) || d.id);
      sb.innerHTML = ICON.bookmark(now); sb.classList.toggle("is-active", now);
    });
    row.appendChild(saveBtn);
    return row;
  }
  /* پیام کوتاه پایین صفحه */
  function toast(msg) {
    var old = document.querySelector(".sog-toast");
    if (old) old.remove();
    var t = el("div", "sog-toast", esc(msg));
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () {
      t.classList.remove("is-in");
      setTimeout(function () { if (t.parentNode) t.remove(); }, 300);
    }, 2200);
  }

  /* ---------- موزیک پیشنهادی آگهی ----------
     برای هر آگهی یکی از تراک‌ها انتخاب می‌شود؛ انتخاب بر اساس شناسه‌ی آگهی است
     تا هر آگهی همیشه موزیک خودش را داشته باشد. با افزودن فایل به این فهرست،
     تنوع موزیک‌ها بیشتر می‌شود. */
  var TRACKS = ["assets/audio/track-1.mp3"];
  var audioEl = null;

  function trackFor(d) {
    if (d.audio) return d.audio;                       /* اگر آگهی موزیک اختصاصی داشت */
    var n = parseInt(SogUtil.toEn(String(d.id)).replace(/\D/g, ""), 10) || 0;
    return TRACKS[n % TRACKS.length];
  }

  function startMusic(d, btn) {
    var src = trackFor(d);
    if (!src) return;

    audioEl = new Audio(src);
    audioEl.setAttribute("hidden", "");
    document.body.appendChild(audioEl);   /* در DOM باشد تا مرورگر آن را مدیریت کند */
    audioEl.loop = true;
    audioEl.volume = 0;                                /* بالا آمدن نرم صدا */
    audioEl.preload = "auto";

    var wanted = false;                                /* پیش‌فرض: بی‌صدا؛ کاربر خودش روشن می‌کند */
    var TARGET = 0.32;

    function fadeTo(target) {
      if (!audioEl) return;
      var step = (target - audioEl.volume) / 18;
      var timer = setInterval(function () {
        if (!audioEl) { clearInterval(timer); return; }
        var v = audioEl.volume + step;
        if ((step > 0 && v >= target) || (step < 0 && v <= target)) { v = target; clearInterval(timer); }
        audioEl.volume = Math.max(0, Math.min(1, v));
      }, 40);
    }

    function paint() {
      btn.innerHTML = wanted ? ICON.sound : ICON.soundOff;
      btn.classList.toggle("is-active", wanted);
      btn.setAttribute("aria-label", wanted ? "قطع صدا" : "پخش صدا");
    }

    btn.addEventListener("click", function () {
      wanted = !wanted;
      paint();
      if (!audioEl) return;
      if (wanted) { audioEl.play().then(function () { fadeTo(TARGET); }).catch(function () {}); }
      else { fadeTo(0); setTimeout(function () { if (audioEl && !wanted) audioEl.pause(); }, 800); }
    });

    /* با خروج از صفحه یا رفتن به پس‌زمینه، پخش متوقف شود */
    document.addEventListener("visibilitychange", function () {
      if (!audioEl) return;
      if (document.hidden) audioEl.pause();
      else if (wanted) audioEl.play().catch(function () {});
    });
    window.addEventListener("pagehide", function () { if (audioEl) audioEl.pause(); });

    paint();
    /* پخش خودکار انجام نمی‌شود؛ با زدن دکمه‌ی صدا شروع می‌شود */
  }

  function actionItem(icon, label, onClick) {
    var item = el("div", "action-item");
    var b = el("button", null, icon); b.setAttribute("aria-label", label);
    if (onClick) b.addEventListener("click", onClick);
    item.appendChild(b); item.appendChild(el("span", null, label));
    return item;
  }
  function reportError(d) {
    var b = el("button", "report-error", ICON.report + " گزارش خطا");
    b.addEventListener("click", function () { openReportSheet(d); });
    return b;
  }

  /* ---------- بۀ‌شیت گزارش خطا ---------- */
  var REPORT_TYPES = [
    "این آگهی تکراری است",
    "تصویر نامناسب یا اشتباه است",
    "محتوای توهین‌آمیز یا نامرتبط",
    "اطلاعات آگهی اشتباه است"
  ];

  function openReportSheet(d) {
    closeReportSheet();
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "report-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "گزارش خطا");

    var close = el("button", "report-close", '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>');
    close.type = "button";
    close.setAttribute("aria-label", "بستن");

    var form = el("form", "report-form");
    form.innerHTML =
      '<h3 class="report-title">گزارش خطا</h3>' +
      '<label class="report-field"><span>نوع خطا</span>' +
      '<select name="type" required>' + REPORT_TYPES.map(function (t) {
        return '<option value="' + esc(t) + '">' + esc(t) + '</option>';
      }).join("") + '</select></label>' +
      '<label class="report-field"><span>توضیحات</span>' +
      '<textarea name="note" rows="3" placeholder="چه چیزی درست نیست؟ کوتاه توضیح بدهید."></textarea></label>' +
      '<div class="report-field"><span>بارگذاری تصویر (اختیاری)</span>' +
      '<label class="report-upload"><input type="file" name="photo" accept="image/png,image/jpeg" hidden>' +
      '<span class="up-ico"><svg viewBox="0 0 24 24" width="26" height="26"><rect x="3" y="7" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="13.5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M9 7l1.4-2.4h3.2L15 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></span>' +
      '<span class="up-hint">فرمت قابل پذیرش: png، jpg، jpeg</span></label></div>' +
      '<div class="report-actions">' +
      '<button type="button" class="btn-ghost" data-cancel>بی‌خیال</button>' +
      '<button type="submit" class="btn-primary">ثبت و ارسال</button>' +
      '</div>';

    sheet.appendChild(close);
    sheet.appendChild(form);
    document.body.appendChild(back);
    document.body.appendChild(sheet);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { sheet.classList.add("is-in"); back.classList.add("is-in"); });

    /* نام فایل انتخاب‌شده زیر کادر نشان داده می‌شود */
    var file = form.querySelector('input[name="photo"]');
    file.addEventListener("change", function () {
      var hint = form.querySelector(".up-hint");
      hint.textContent = file.files && file.files[0] ? file.files[0].name : "فرمت قابل پذیرش: png، jpg، jpeg";
    });

    back.addEventListener("click", closeReportSheet);
    close.addEventListener("click", closeReportSheet);
    form.querySelector("[data-cancel]").addEventListener("click", closeReportSheet);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      /* بدون بک‌اند: گزارش به‌صورت محلی نگه داشته می‌شود تا در نسخه‌ی وردپرس به سرور ارسال شود */
      try {
        var box = JSON.parse(localStorage.getItem("sog:reports") || "[]");
        box.push({
          id: d && d.id,
          listing: d && d.deceased_name,
          type: fd.get("type"),
          note: fd.get("note") || "",
          at: Date.now(),
          /* گیرنده‌ها: هم پشتیبانی سوگ، هم ثبت‌کننده‌ی آگهی */
          to: ["sog-support", "listing-owner"],
          owner: (d && d.owner_id) || null,
          status: "queued"
        });
        localStorage.setItem("sog:reports", JSON.stringify(box));
      } catch (err) {}
      form.replaceWith(el("div", "report-done",
        '<div class="ok-ico"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<p>گزارش شما ثبت و برای پشتیبانی سوگ و ثبت‌کننده‌ی آگهی ارسال شد. با تشکر از همراهی‌تان.</p>'));
      setTimeout(closeReportSheet, 1800);
    });
  }

  function closeReportSheet() {
    var s = document.querySelector(".report-sheet");
    var b = document.querySelector(".sheet-backdrop");
    if (s) s.remove();
    if (b) b.remove();
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReportSheet(); });

  /* ---------- یادداشت خصوصی کاربر ---------- */
  /* یادداشت مخصوص آگهی‌گذار (صاحب عزا) */
  function ownerNote(d) {
    var wrap = el("section", "note-box owner-note");
    var head = el("button", "note-head"); head.type = "button";
    head.setAttribute("aria-expanded", "false");
    head.appendChild(el("span", "note-title", "یادداشت من به‌عنوان ثبت‌کننده"));
    var saved = SogStore.getOwnerNote(d.id) || "";
    var badge = el("span", "note-badge", saved ? "ثبت‌شده" : "خالی");
    head.appendChild(badge);
    head.appendChild(el("span", "note-chev", ICON.chevron));

    var body = el("div", "note-body");
    var ta = el("textarea", "note-input");
    ta.rows = 4;
    ta.placeholder = "کارهای باقی‌مانده، هماهنگی‌های مراسم، شماره‌ی خدمات‌دهنده‌ها و…";
    ta.value = saved;
    var hint = el("p", "note-hint", "این یادداشت فقط برای شما (ثبت‌کننده‌ی آگهی) قابل دیدن است.");
    var status = el("span", "note-status", "");
    var t;
    ta.addEventListener("input", function () {
      clearTimeout(t);
      status.textContent = "در حال ذخیره…";
      t = setTimeout(function () {
        SogStore.setOwnerNote(d.id, ta.value);
        badge.textContent = ta.value.trim() ? "ثبت‌شده" : "خالی";
        status.textContent = ta.value.trim() ? "ذخیره شد" : "";
        setTimeout(function () { if (status.textContent === "ذخیره شد") status.textContent = ""; }, 1800);
      }, 400);
    });
    hint.appendChild(status);
    body.appendChild(hint); body.appendChild(ta);   /* توضیح زیر عنوان */
    head.addEventListener("click", function () {
      var open = wrap.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) ta.focus();
    });
    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  }

  function privateNote(d) {
    var wrap = el("section", "note-box");
    var saved = SogStore.getNote(d.id) || "";

    /* پیش‌فرض بسته است؛ فقط اگر کاربر بخواهد باز می‌شود */
    var head = el("button", "note-head"); head.type = "button";
    head.setAttribute("aria-expanded", "false");
    head.appendChild(el("span", "note-title", "یادداشت من"));
    var badge = el("span", "note-badge", saved ? "ثبت‌شده" : "خالی");
    head.appendChild(badge);
    head.appendChild(el("span", "note-chev", ICON.chevron));

    var body = el("div", "note-body");
    var ta = el("textarea", "note-input");
    ta.rows = 3;
    ta.placeholder = "یادداشت شما…";
    ta.value = saved;
    var hint = el("p", "note-hint", "این یادداشت تنها برای شما روی همین دستگاه قابل دیدن است و برای خانواده یا دیگران نمایش داده نمی‌شود.");
    var status = el("span", "note-status", "");
    var t;
    ta.addEventListener("input", function () {
      clearTimeout(t);
      status.textContent = "در حال ذخیره…";
      t = setTimeout(function () {
        SogStore.setNote(d.id, ta.value);
        badge.textContent = ta.value.trim() ? "ثبت‌شده" : "خالی";
        status.textContent = ta.value.trim() ? "ذخیره شد" : "";
        setTimeout(function () { if (status.textContent === "ذخیره شد") status.textContent = ""; }, 2000);
      }, 400);
    });
    hint.appendChild(status);
    body.appendChild(hint); body.appendChild(ta);   /* توضیح زیر عنوان، بالای کادر متن */

    head.addEventListener("click", function () {
      var open = wrap.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) ta.focus();
    });

    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  }

  /* ---------- آکاردیون پایه ---------- */
  /* آکاردیون‌ها به‌صورت پیش‌فرض بسته‌اند مگر opts.open صراحتاً داده شود. */
  function accordion(title, bodyNode, opts) {
    opts = opts || {};
    var acc = el("section", "accordion" + (opts.open ? " is-open" : "") + (opts.empty ? " acc-empty" : ""));
    var head = el("button", "acc-head");
    head.setAttribute("aria-expanded", opts.open ? "true" : "false");
    head.innerHTML = "<span>" + esc(title) + "</span>" + ICON.chevron;
    var body = el("div", "acc-body");
    var inner = el("div", "acc-inner");  // پوشش بدون padding تا ارتفاعِ حالت بسته دقیقاً صفر شود
    var pad = el("div", "acc-pad");      // padding روی لایه‌ی داخلی
    pad.appendChild(bodyNode);
    inner.appendChild(pad);
    body.appendChild(inner);
    acc.appendChild(head); acc.appendChild(body);
    return acc;
  }

  /* ---------- زندگی‌نامه ---------- */
  function bioAccordion(bio) {
    var wrap = el("div");
    wrap.appendChild(el("p", "bio-text", fmtDesc(bio.text)));
    if (bio.gallery && bio.gallery.length) {
      /* چیدمان تصاویر همان چیزی است که هنگام ثبت انتخاب شده (پیش‌فرض: دو ستونه) */
      var g = el("div", "bio-gallery lay-" + (bio.layout || "two"));
      bio.gallery.forEach(function (src) { var i = el("img"); i.src = src; i.alt = ""; g.appendChild(i); });
      wrap.appendChild(g);
    }
    if (bio.relatives && bio.relatives.length) {
      wrap.appendChild(el("h3", "relatives-title", "سوگ‌های خویشاوند"));
      var r = el("div", "relatives");
      bio.relatives.forEach(function (p) {
        var item = el("div", "relative");
        var img = el("img"); img.src = p.photo; img.alt = p.caption; item.appendChild(img);
        item.appendChild(el("span", null, esc(p.caption)));
        r.appendChild(item);
      });
      wrap.appendChild(r);
    }
    return accordion("زندگی‌نامه", wrap);
  }

  /* ---------- بلوک رویداد ---------- */
  function eventBody(c) {
    var wrap = el("div");
    if (c.date || c.time_from || c.time_to) {
      var dl = el("div", "event-line");
      dl.innerHTML = '<span class="ev-ico">' + ICON.clock + '</span><span class="ev-lbl">زمان :</span>';
      /* تاریخ و کادر ساعت در یک ستون‌اند تا ساعت دقیقاً زیر متن تاریخ شروع شود */
      var col = el("div", "ev-col");
      if (c.date) col.appendChild(el("span", null, esc(c.date)));
      if (c.time_from || c.time_to) {
        var tp = el("div", "time-pills");
        if (c.time_to) tp.appendChild(el("span", "pill", esc(c.time_to)));
        tp.appendChild(el("span", "to", "تا"));
        if (c.time_from) tp.appendChild(el("span", "pill", esc(c.time_from)));
        col.appendChild(tp);
      }
      dl.appendChild(col);
      wrap.appendChild(dl);
    }
    if (c.location) {
      var ll = el("div", "event-line");
      ll.innerHTML = '<span class="ev-ico">' + ICON.pin + '</span><span class="ev-lbl">مکان :</span> <span>' + esc(c.location) + '</span>';
      wrap.appendChild(ll);
    }
    if (c.map) { var m = el("div", "event-map"); m.style.backgroundImage = 'url("' + c.map + '")'; wrap.appendChild(m); }
    if (c.location || c.date) {
      var eb = el("div", "event-btns");
      if (c.location) {
        var route = el("a", "event-btn route", ICON.route + " مسیر تا مراسم");
        route.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.location);
        route.target = "_blank"; route.rel = "noopener";
        eb.appendChild(route);
      }
      if (c.date) {
        var cal = el("button", "event-btn cal", ICON.calAdd + " یادآوری مراسم");
        cal.type = "button";
        cal.addEventListener("click", function () { downloadICS(c); });
        eb.appendChild(cal);
      }
      wrap.appendChild(eb);
    }
    if (c.chips && c.chips.length) {
      var cc = el("div", "chips-col");
      c.chips.forEach(function (t) { cc.appendChild(el("span", "event-chip", esc(t))); });
      wrap.appendChild(cc);
    }
    if (c.description) {
      var db = el("div", "desc-box");
      db.appendChild(el("span", "desc-label", "توضیحات"));
      db.appendChild(el("div", null, fmtDesc(c.description)));
      wrap.appendChild(db);
    }
    /* تصاویر مراسم: عکس‌های آگهی + عکس‌هایی که صاحب عزا بعد از مراسم اضافه می‌کند */
    wrap.appendChild(eventGallery(c));
    return wrap;
  }
  function eventAccordion(c) { return accordion(c.title, eventBody(c)); }

  /* گالری مراسم؛ برای ثبت‌کننده امکان افزودن و حذف تصویر دارد */
  function eventGallery(c) {
    var box = el("div", "event-gallery");
    var key = c.type || c.title || "event";
    var owner = currentDetail && ownerMode(currentDetail);

    function paint() {
      box.innerHTML = "";
      var mine = SogStore.getEventPhotos(id, key);
      var all = (c.gallery || []).concat(mine);

      if (all.length) {
        box.appendChild(el("h3", "gallery-title", "تصاویر مراسم " + esc(c.title || "")));
        var hs = el("div", "hscroll");
        all.forEach(function (src, i) {
          var t = el("div", "thumb");
          t.style.backgroundImage = 'url("' + src + '")';
          /* فقط تصاویری که خود کاربر اضافه کرده قابل حذف‌اند */
          if (owner && i >= (c.gallery || []).length) {
            var x = el("button", "thumb-x", "×"); x.type = "button";
            x.setAttribute("aria-label", "حذف تصویر");
            x.addEventListener("click", function (e) {
              e.stopPropagation();
              SogStore.removeEventPhoto(id, key, i - (c.gallery || []).length);
              paint();
            });
            t.appendChild(x);
          }
          hs.appendChild(t);
        });
        box.appendChild(hs);
      }

      if (!owner) return;

      var add = el("label", "event-add-photo");
      add.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        "<span>افزودن تصویر مراسم " + esc(c.title || "") + "</span>";
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/png,image/jpeg"; inp.multiple = true; inp.hidden = true;
      inp.addEventListener("change", function () {
        var files = Array.prototype.slice.call(inp.files || []);
        var left = 8 - SogStore.getEventPhotos(id, key).length;
        files.slice(0, Math.max(0, left)).forEach(function (f) {
          var rd = new FileReader();
          rd.onload = function () { SogStore.addEventPhoto(id, key, rd.result); paint(); };
          rd.readAsDataURL(f);
        });
        if (left <= 0) toast("حداکثر ۸ تصویر برای هر مراسم می‌توانید اضافه کنید.");
        inp.value = "";
      });
      add.appendChild(inp);
      box.appendChild(add);
      box.appendChild(el("p", "event-add-hint", "این تصاویر را بعد از برگزاری مراسم اضافه کنید؛ برای همه‌ی بازدیدکنندگان دیده می‌شود."));
    }

    paint();
    return box;
  }

  function anniversaryBody(a) {
    if (a.empty) return el("div", null, "اطلاعاتی برای این سالگرد ثبت نشده است.");
    return eventBody(Object.assign({}, a, { title: "سالگرد " + a.year }));
  }
  function anniversaryAccordion(a) {
    return accordion("سالگرد " + a.year, anniversaryBody(a), { empty: !!a.empty });
  }

  /* سالگرد جاری (آخرین سالگرد) در بیرون است و سالگردهای سال‌های پیش
     به‌صورت تودرتو در انتهای همان آکاردیون قرار می‌گیرند. */
  function anniversariesSection(list) {
    list = list || [];
    if (!list.length) return null;
    var latest = list[0], older = list.slice(1);

    var wrap = el("div");
    wrap.appendChild(anniversaryBody(latest));

    if (older.length) {
      var nest = el("div", "anniv-older");
      nest.appendChild(el("h3", "anniv-older-title", "سالگردهای سال‌های پیش"));
      older.forEach(function (a) { nest.appendChild(anniversaryAccordion(a)); });
      wrap.appendChild(nest);
    }
    return accordion("سالگرد " + latest.year, wrap, { empty: !!latest.empty && !older.length });
  }

  /* ---------- سپاسگزاری ---------- */
  function ackAccordion(ack) {
    var wrap = el("div");
    var owner = currentDetail && ownerMode(currentDetail);

    /* متن سپاسگزاری: نسخه‌ی ویرایش‌شده‌ی خانواده بر متن اولیه مقدم است */
    function currentText() { return SogStore.getAckText(id) || ack.text || ""; }

    var view = el("div");

    function paintView() {
      view.innerHTML = "";
      var live = { text: currentText(), signature: ack.signature, date: ack.date };

      view.appendChild(el("p", "ack-text", fmtDesc(live.text)));
      var foot = el("div", "ack-foot");
      var st = el("div", "ack-story");
      var b = el("button", null, ICON.story);
      b.setAttribute("aria-label", "ساخت استوری سپاسگزاری");
      b.addEventListener("click", function () { openStory(currentDetail, live); });
      st.appendChild(b); st.appendChild(el("span", null, "استوری"));
      foot.appendChild(st);
      foot.appendChild(el("div", "ack-sign", esc(live.signature) + "<br>" + esc(live.date)));
      view.appendChild(foot);

      /* خانواده می‌تواند همین‌جا متن را ویرایش کند */
      if (owner) {
        var edit = el("button", "mine-btn", "ویرایش متن سپاسگزاری");
        edit.type = "button";
        edit.addEventListener("click", paintEditor);
        var tools = el("div", "mine-tools");
        tools.appendChild(edit);
        view.appendChild(tools);
      }
    }

    function paintEditor() {
      view.innerHTML = "";
      var ta = el("textarea", "note-input");
      ta.rows = 6;
      ta.value = currentText();
      ta.placeholder = "متن سپاسگزاری خانواده…";
      view.appendChild(ta);

      view.appendChild(readyTextPicker(READY_THANKS, function (t) { ta.value = t; }));

      var row = el("div", "ack-edit-actions");
      var cancel = el("button", "btn-ghost", "بی‌خیال"); cancel.type = "button";
      var save = el("button", "btn-primary", "ذخیره‌ی متن"); save.type = "button";
      cancel.addEventListener("click", paintView);
      save.addEventListener("click", function () {
        SogStore.setAckText(id, ta.value);
        paintView();
        toast("متن سپاسگزاری به‌روزرسانی شد.");
      });
      row.appendChild(cancel); row.appendChild(save);
      view.appendChild(row);
      ta.focus();
    }

    paintView();
    wrap.appendChild(view);
    return accordion("سپاسگزاری", wrap);
  }

  /* ---------- ارتباط ---------- */
  /* لینک واقعی هر راه ارتباطی؛ اگر مقدارش نبود، شماره‌ی خانواده استفاده می‌شود */
  function contactHref(c, fallbackPhone) {
    var v = c.value || fallbackPhone || "";
    var phone = toEnNum(String(v)).replace(/[^\d+]/g, "");
    switch (c.type) {
      case "call": return phone ? "tel:" + phone : null;
      case "sms": return phone ? "sms:" + phone : null;
      case "whatsapp": return phone ? SogUtil.waLink(phone, "") : null;
      case "eitaa": return phone ? "https://eitaa.com/" + phone.replace(/^0/, "98") : null;
      case "telegram": return "https://t.me/" + String(v).replace(/^@/, "");
      case "instagram": return "https://instagram.com/" + String(v).replace(/^@/, "");
      default: return null;
    }
  }

  function contactRow(contacts, d) {
    var row = el("div", "contact-row");
    var fallback = (d && d.contact_phone) || "";
    contacts.forEach(function (c) {
      var href = contactHref(c, fallback);
      var item = el("div", "contact-item");
      var b = el(href ? "a" : "button", "c-btn" + (href ? "" : " is-off"), ICON[c.type] || ICON.call);
      var glyph = b.querySelector("svg"); if (glyph) glyph.classList.add("c-" + c.type);
      if (href) {
        b.href = href;
        if (c.type !== "call" && c.type !== "sms") { b.target = "_blank"; b.rel = "noopener"; }
        b.setAttribute("aria-label", c.label);
      } else {
        b.type = "button";
        b.addEventListener("click", function () { toast("راه ارتباطی «" + c.label + "» برای این آگهی ثبت نشده است."); });
      }
      item.appendChild(b); item.appendChild(el("span", null, esc(c.label)));
      row.appendChild(item);
    });
    return row;
  }

  /* ---------- دفتر یادبود ---------- */
  function guestbookSection(d) {
    var wrap = el("div");
    var list = el("div", "gb-list");

    var isOwner = ownerMode(d);

    function paint() {
      list.innerHTML = "";
      var all = SogStore.getGuestbook(id);
      /* خانواده همه‌ی یادبودها را می‌بیند؛ بقیه فقط یادبود خودشان را */
      var items = isOwner ? all : all.filter(function (g) { return g.mine; });

      if (isOwner && all.length) {
        list.appendChild(el("p", "gb-note", "شما ثبت‌کننده‌ی این آگهی هستید و همه‌ی یادبودهای ثبت‌شده را می‌بینید."));
      } else if (!isOwner) {
        list.appendChild(el("p", "gb-note", "یادبودها فقط برای خانواده‌ی سوگوار قابل مشاهده است؛ شما یادبود خودتان را می‌بینید."));
      }

      if (!items.length) {
        list.appendChild(el("p", "gb-empty", "هنوز خاطره‌ای ثبت نشده است. اولین نفری باشید که خاطره‌ای از این عزیز می‌نویسد."));
      } else {
        items.forEach(function (g, i) {
          var item = el("div", "gb-item");
          var head = el("div", "gb-head");
          head.appendChild(el("span", "gb-name", esc(g.name || "ناشناس")));
          head.appendChild(el("time", "gb-date", esc(g.date || "")));
          item.appendChild(head);
          item.appendChild(el("p", "gb-text", fmtDesc(g.text)));
          if (g.mine) {
            var del = el("button", "mine-btn danger", "حذف"); del.type = "button";
            del.addEventListener("click", function () {
              var all = SogStore.getGuestbook(id);
              var realIndex = all.indexOf(g);
              if (realIndex === -1) realIndex = i;
              all.splice(realIndex, 1);
              try {
                var m = JSON.parse(localStorage.getItem("sog:guest")) || {};
                m[id] = all; localStorage.setItem("sog:guest", JSON.stringify(m));
              } catch (e) {}
              paint();
              toast("خاطره‌ی شما حذف شد.");
            });
            var tools = el("div", "mine-tools");
            tools.appendChild(del);
            item.appendChild(tools);
          }
          list.appendChild(item);
        });
      }
    }

    var form = el("form", "gb-form");
    var nameInput = document.createElement("input");
    nameInput.type = "text"; nameInput.placeholder = "نام شما"; nameInput.className = "gb-input"; nameInput.required = true;
    var textInput = document.createElement("textarea");
    textInput.rows = 3; textInput.placeholder = "خاطره یا جمله‌ای از این عزیز بنویسید…"; textInput.className = "gb-input"; textInput.required = true;
    var send = el("button", "gb-send", "ثبت خاطره"); send.type = "submit";
    form.appendChild(nameInput); form.appendChild(textInput); form.appendChild(send);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!nameInput.value.trim() || !textInput.value.trim()) return;
      var t = SogUtil.todayJalali();
      SogStore.addGuestbook(id, {
        name: nameInput.value.trim(),
        text: textInput.value.trim(),
        date: faNum(t.y) + "/" + faNum(t.m < 10 ? "0" + t.m : t.m) + "/" + faNum(t.d < 10 ? "0" + t.d : t.d),
        mine: true
      });
      nameInput.value = ""; textInput.value = "";
      paint();
      toast("خاطره‌ی شما در دفتر یادبود ثبت شد.");
    });

    paint();
    wrap.appendChild(list);
    wrap.appendChild(form);
    return accordion("دفتر یادبود", wrap);
  }

  /* ---------- همدردی ---------- */
  /* متن‌های آماده‌ی همدردی و سپاسگزاری */
  var READY_CONDOLENCE = [
    "درگذشت این عزیز را به خانواده‌ی محترم تسلیت عرض می‌کنم. برای آن مرحوم علو درجات و برای بازماندگان صبر و شکیبایی آرزومندم.",
    "مصیبت وارده را خدمت شما و خانواده‌ی محترمتان تسلیت عرض می‌نمایم. از خداوند منان برای آن مرحوم رحمت واسعه مسئلت دارم.",
    "فقدان این عزیز موجب تأثر و تألم گردید. برای آن مرحوم آمرزش الهی و برای شما سلامتی و صبر جمیل خواستارم.",
    "با نهایت تأسف و تأثر، درگذشت این بزرگوار را تسلیت گفته، از درگاه ایزد منان برای ایشان غفران الهی طلب می‌کنم.",
    "خداوند روح آن عزیز سفرکرده را شاد و قرین رحمت گرداند و به شما و خانواده‌ی محترم صبر عطا فرماید."
  ];
  var READY_THANKS = [
    "از تمامی عزیزانی که در این مصیبت ما را تنها نگذاشتند و با حضور یا پیام خود موجب تسلی خاطر خانواده شدند، صمیمانه سپاسگزاریم.",
    "بدین‌وسیله از همه‌ی سروران گرامی که در مراسم تشییع و ترحیم شرکت فرمودند، کمال تشکر و قدردانی را داریم.",
    "از لطف و محبت شما بزرگواران که در این ایام سخت همراه ما بودید، صمیمانه سپاسگزاریم. اجرکم عندالله."
  ];

  /* انتخابگر متن آماده */
  function readyTextPicker(list, onPick) {
    var box = el("div", "ready-picker");
    box.appendChild(el("p", "ready-title", "یا یکی از متن‌های آماده را انتخاب کنید:"));
    var track = el("div", "ready-track");
    list.forEach(function (t) {
      var card = el("button", "ready-card", esc(t));
      card.type = "button";
      card.addEventListener("click", function () {
        Array.prototype.forEach.call(track.children, function (n) { n.classList.remove("is-picked"); });
        card.classList.add("is-picked");
        onPick(t);
      });
      track.appendChild(card);
    });
    box.appendChild(track);
    return box;
  }

  /* کلید یکتا برای هر همدردی (برای مخفی‌کردن) */
  function condKey(cd) { return (cd.name || "") + "|" + String(cd.date || ""); }

  /* آیا کاربر ثبت‌کننده‌ی این آگهی است؟
     تا وقتی حساب کاربری واقعی وصل نشده، آگهی‌هایی که خودِ کاربر روی این دستگاه ثبت کرده مالک محسوب می‌شوند. */
  function ownerMode(d) {
    try {
      var mine = JSON.parse(localStorage.getItem("sog:myListings")) || [];
      return mine.indexOf(String(d.id)) !== -1 || mine.indexOf(Number(d.id)) !== -1;
    } catch (e) { return false; }
  }

  /* همدردی خودِ کاربر: بالای فهرست و قابل ویرایش */
  function myCondolenceItem(d, entry) {
    var item = el("div", "condolence-item is-mine is-open");
    var head = el("div", "cond-head");
    head.innerHTML = '<span class="cond-logo mine-avatar">' +
      '<svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span>' +
      '<span class="cond-name">' + esc(entry.name || "همدردی شما") + '</span>' +
      '<span class="mine-badge">شما</span>';
    var body = el("div", "cond-body");
    var innerB = el("div");
    var msg = el("div", "cond-message");
    var pEl = el("p", null, fmtDesc(entry.message));
    msg.appendChild(pEl);

    /* تاریخ در همان ردیفِ دکمه‌های ویرایش و حذف */
    var tools = el("div", "mine-tools");
    tools.appendChild(el("time", "mine-date", esc(entry.date || "")));
    var edit = el("button", "mine-btn", "ویرایش"); edit.type = "button";
    var del = el("button", "mine-btn danger", "حذف"); del.type = "button";
    edit.addEventListener("click", function () { openCondolenceSheet(d, entry); });
    del.addEventListener("click", function () {
      SogStore.setMyCondolence(id, null);
      toast("همدردی شما حذف شد.");
      render(d);
    });
    tools.appendChild(edit); tools.appendChild(del);
    msg.appendChild(tools);

    innerB.appendChild(msg); body.appendChild(innerB);
    item.appendChild(head); item.appendChild(body);
    return item;
  }

  /* بۀ‌شیت ثبت/ویرایش همدردی */
  function openCondolenceSheet(d, editing) {
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "report-sheet cond-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");

    var close = el("button", "report-close", '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>');
    close.type = "button";

    var form = el("form", "report-form");
    form.innerHTML =
      '<h3 class="report-title">' + (editing ? "ویرایش همدردی" : "ثبت همدردی") + '</h3>' +
      '<div class="cond-kind">' +
        '<button type="button" class="kind-btn is-active" data-kind="person">شخصی</button>' +
        '<button type="button" class="kind-btn" data-kind="org">اداره / شرکت</button>' +
      '</div>' +
      '<label class="report-field"><span>نام</span>' +
        '<input name="name" type="text" placeholder="نام و نام خانوادگی" required></label>' +
      '<label class="report-field org-only" hidden><span>کد ملی مسئول ثبت</span>' +
        '<input name="melli" type="tel" inputmode="numeric" maxlength="10" placeholder="کد ملی ۱۰ رقمی مسئول ثبت"></label>' +
      '<label class="report-field"><span>متن همدردی</span>' +
        '<textarea name="message" rows="4" placeholder="متن همدردی خود را بنویسید…" required></textarea></label>' +
      '<div class="report-actions">' +
        '<button type="button" class="btn-ghost" data-cancel>بی‌خیال</button>' +
        '<button type="submit" class="btn-primary">' + (editing ? "ذخیره‌ی تغییرات" : "ثبت همدردی") + '</button>' +
      '</div>';

    var ta = form.querySelector('textarea[name="message"]');
    form.insertBefore(readyTextPicker(READY_CONDOLENCE, function (t) { ta.value = t; }), form.querySelector(".report-actions"));

    if (editing) {
      form.querySelector('input[name="name"]').value = editing.name || "";
      ta.value = editing.message || "";
      if (editing.kind === "org") {
        form.querySelector('.kind-btn[data-kind="person"]').classList.remove("is-active");
        form.querySelector('.kind-btn[data-kind="org"]').classList.add("is-active");
        form.querySelector(".org-only").hidden = false;
        form.querySelector('input[name="melli"]').value = editing.melli || "";
      }
    }

    /* ادارات و شرکت‌ها: ثبت با تأیید کد ملی */
    var kind = editing && editing.kind === "org" ? "org" : "person";
    Array.prototype.forEach.call(form.querySelectorAll(".kind-btn"), function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-kind");
        Array.prototype.forEach.call(form.querySelectorAll(".kind-btn"), function (n) { n.classList.remove("is-active"); });
        b.classList.add("is-active");
        form.querySelector(".org-only").hidden = kind !== "org";
        form.querySelector('input[name="name"]').placeholder = kind === "org" ? "نام اداره یا شرکت" : "نام و نام خانوادگی";
      });
    });

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
      var nameVal = String(fd.get("name") || "");

      if (kind === "person") {
        var clean = normalizeFa(nameVal);
        if (/[0-9۰-۹]/.test(clean)) {
          toast("نام شخصی نباید شامل عدد باشد.");
          return;
        }
        if (clean.split(" ").filter(Boolean).length < 2) {
          toast("لطفاً نام و نام خانوادگی را کامل بنویسید.");
          return;
        }
        var hit = orgWordIn(nameVal);
        if (hit) {
          toast("«" + hit + "» نام یک مجموعه است؛ برای ثبت به‌نام مجموعه، حالت «اداره / شرکت» را انتخاب کنید.");
          form.querySelector('.kind-btn[data-kind="org"]').classList.add("blink");
          setTimeout(function () {
            var b2 = form.querySelector('.kind-btn[data-kind="org"]');
            if (b2) b2.classList.remove("blink");
          }, 1200);
          return;
        }
      }

      if (kind === "org") {
        var code = toEnNum(String(fd.get("melli") || "")).replace(/\D/g, "");
        if (!validMelli(code)) {
          toast("کد ملی معتبر نیست؛ برای ثبت به‌نام اداره یا شرکت، کد ملی مسئول ثبت لازم است.");
          return;
        }
      }
      var t = SogUtil.todayJalali();
      SogStore.setMyCondolence(id, {
        name: fd.get("name"),
        message: fd.get("message"),
        kind: kind,
        melli: kind === "org" ? String(fd.get("melli") || "") : "",
        date: faNum(t.y) + "/" + faNum(t.m < 10 ? "0" + t.m : t.m) + "/" + faNum(t.d < 10 ? "0" + t.d : t.d)
      });
      done();
      toast(editing ? "همدردی شما ویرایش شد." : "همدردی شما ثبت شد.");
      render(d);
    });
  }

  /* واژه‌های سازمانی: اگر در حالت «شخصی» به‌کار بروند، ثبت انجام نمی‌شود */
  var ORG_WORDS = [
    "شرکت", "اداره", "سازمان", "مؤسسه", "موسسه", "بانک", "کارخانه", "شهرداری", "بیمارستان",
    "هیئت", "هیات", "تعاونی", "اتحادیه", "دانشگاه", "پتروشیمی", "کارگاه", "فروشگاه", "مجتمع",
    "درمانگاه", "کلینیک", "آموزشگاه", "مدرسه", "دبیرستان", "انجمن", "بنیاد", "خیریه", "باشگاه",
    "صندوق", "بیمه", "پالایشگاه", "نیروگاه", "فرمانداری", "بخشداری", "استانداری", "دادگستری",
    "گروه صنعتی", "صنایع", "هلدینگ", "دفتر", "نمایندگی", "اتاق اصناف", "سندیکا", "کانون", "ستاد"
  ];

  function orgWordIn(name) {
    var n = normalizeFa(name);
    for (var i = 0; i < ORG_WORDS.length; i++) {
      var w = normalizeFa(ORG_WORDS[i]);
      /* واژه باید جدا باشد تا نام‌هایی مثل «بانکی» به‌اشتباه رد نشوند */
      if (new RegExp("(^|\\s)" + w + "(\\s|$)").test(n)) return ORG_WORDS[i];
    }
    return null;
  }

  function normalizeFa(v) {
    return String(v == null ? "" : v)
      .replace(/[يﻯﻰ]/g, "ی").replace(/[كﻙ]/g, "ک")
      .replace(/[\u200c\u200f\u200e]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* اعتبارسنجی کد ملی ایران */
  function validMelli(code) {
    if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += parseInt(code[i], 10) * (10 - i);
    var r = sum % 11, c = parseInt(code[9], 10);
    return (r < 2 && c === r) || (r >= 2 && c === 11 - r);
  }

  function condolenceSection(d) {
    var wrap = el("div");
    var inner = el("div");
    d.condolences = d.condolences || [];

    var hidden = SogStore.getHidden(id);
    var isOwner = SogStore.isOwner ? SogStore.isOwner(id) : ownerMode(d);

    /* ---- نوار مدیریت صاحب عزا ---- */
    if (isOwner) {
      var bar = el("div", "owner-bar");
      bar.appendChild(el("span", "owner-tag", "شما ثبت‌کننده‌ی این آگهی هستید"));
      var hideAll = el("button", "owner-btn" + (hidden.all ? " is-on" : ""),
        hidden.all ? "نمایش همه‌ی همدردی‌ها" : "مخفی‌کردن همه‌ی همدردی‌ها");
      hideAll.type = "button";
      hideAll.addEventListener("click", function () {
        SogStore.toggleHideAll(id);
        render(d);   /* بازسازی بخش با وضعیت تازه */
      });
      bar.appendChild(hideAll);
      inner.appendChild(bar);
    }

    /* ---- همدردی خودِ کاربر، همیشه اول فهرست ---- */
    var mine = SogStore.getMyCondolence(id);
    if (mine) inner.appendChild(myCondolenceItem(d, mine));

    var list = d.condolences.filter(function (cd) {
      if (hidden.all) return false;
      return hidden.items.indexOf(condKey(cd)) === -1;
    });

    if (hidden.all && isOwner) {
      inner.appendChild(el("p", "cond-hidden-note", "همه‌ی همدردی‌ها فعلاً برای بازدیدکنندگان مخفی است."));
    }

    var visible = list.slice(0, 5);
    visible.forEach(function (cd) { inner.appendChild(condolenceItem(cd, d, isOwner)); });

    if (list.length > 5) {
      var more = el("button", "cond-more", "مشاهده بیشتر ▾");
      var expanded = false;
      more.addEventListener("click", function () {
        expanded = !expanded;
        if (expanded) { list.slice(5).forEach(function (cd) { inner.insertBefore(condolenceItem(cd, d, isOwner), more); }); more.textContent = "بستن ▴"; }
        else { location.reload(); }
      });
      inner.appendChild(more);
    }

    var actions = el("div", "cond-actions");
    var reg = el("div", "cond-action");
    var rb = el("button", "ca-btn", ICON.plus);
    rb.addEventListener("click", function () { openCondolenceSheet(d); });
    reg.appendChild(rb); reg.appendChild(el("span", null, "ثبت همدردی"));

    // شمع مجازی / صلوات‌شمار تعاملی
    var baseCount = parseInt(toEnNum(d.condolence_count || "0").replace(/\D/g, ""), 10) || 0;
    var cnt = el("div", "cond-action");
    var cb = el("button", "ca-btn candle", ICON.candle);
    var cntLabel = el("span", null, faNum(baseCount + SogStore.getSalavat(id)));
    var already = SogStore.hasCandle(id);

    function paintCandle() {
      cb.classList.toggle("is-lit", SogStore.hasCandle(id));
      cb.setAttribute("aria-label", SogStore.hasCandle(id) ? "شما شمع روشن کرده‌اید" : "روشن‌کردن شمع");
    }
    paintCandle();

    cb.addEventListener("click", function () {
      if (!SogStore.lightCandle(id)) {
        /* هر کاربر فقط یک‌بار می‌تواند شمع روشن کند */
        cb.classList.remove("shake"); void cb.offsetWidth; cb.classList.add("shake");
        toast("شما برای این آگهی شمع روشن کرده‌اید.");
        return;
      }
      cntLabel.textContent = faNum(baseCount + SogStore.getSalavat(id));
      cb.classList.remove("lit"); void cb.offsetWidth; cb.classList.add("lit");
      paintCandle();
    });
    cnt.appendChild(cb); cnt.appendChild(cntLabel);
    actions.appendChild(reg); actions.appendChild(cnt);
    inner.appendChild(actions);

    return accordion("همدردی با خانواده سوگوار", inner, { open: true });
  }
  function condolenceItem(cd, d, isOwner) {
    var item = el("div", "condolence-item");
    var head = el("button", "cond-head");
    head.setAttribute("aria-expanded", "false");
    head.dataset.acc = "cond";
    var logo = '<img class="cond-logo" src="' + esc(cd.logo) + '" alt="">';
    /* همدردی اداریِ تأییدشده نشان می‌گیرد */
    var verified = cd.kind === "org" && cd.verified
      ? '<span class="cond-verified" title="تأییدشده"><svg viewBox="0 0 24 24" width="11" height="11"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></span>'
      : "";
    head.innerHTML = logo + '<span class="cond-name">' + esc(cd.name) + verified + '</span>' + ICON.chevron;
    var body = el("div", "cond-body");
    var inner = el("div");
    var msg = el("div", "cond-message", "<p>" + fmtDesc(cd.message) + "</p><time>" + esc(cd.date) + "</time>");

    var tools = el("div", "mine-tools");

    /* صاحب عزا می‌تواند همین همدردی را مخفی کند */
    if (isOwner && d) {
      var hide = el("button", "mine-btn", "مخفی‌کردن این همدردی");
      hide.type = "button";
      hide.addEventListener("click", function (e) {
        e.stopPropagation();
        SogStore.toggleHiddenItem(id, condKey(cd));
        toast("این همدردی برای بازدیدکنندگان مخفی شد.");
        render(d);
      });
      tools.appendChild(hide);
    }
    msg.appendChild(tools);

    inner.appendChild(msg); body.appendChild(inner);
    item.appendChild(head); item.appendChild(body);
    return item;
  }

  /* ---------- اشتراک‌گذاری کارت زیبا (تصویر) ---------- */
  function fitText(ctx, text, maxW, baseSize) {
    var size = baseSize;
    do { ctx.font = "700 " + size + "px Vazirmatn, Tahoma"; size -= 2; }
    while (ctx.measureText(text).width > maxW && size > 30);
    return ctx.font;
  }
  /* تصویر متوفی به‌صورت دایره‌ای روی کارت */
  function drawPortrait(x, img, cx, cy, r) {
    var rg = x.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.9);
    rg.addColorStop(0, "rgba(217,154,91,.30)"); rg.addColorStop(1, "rgba(217,154,91,0)");
    x.fillStyle = rg; x.beginPath(); x.arc(cx, cy, r * 1.9, 0, 7); x.fill();

    x.save();
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.clip();
    x.fillStyle = "#1a1a1a"; x.fillRect(cx - r, cy - r, r * 2, r * 2);
    if (img) {
      /* تصویر به‌صورت cover داخل دایره جا می‌شود */
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      var scale = Math.max((r * 2) / iw, (r * 2) / ih);
      var w = iw * scale, h = ih * scale;
      x.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    }
    x.restore();
    x.strokeStyle = "rgba(217,154,91,.75)"; x.lineWidth = 6;
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
  }

  /* کادر نوع مراسم — جای عبارت «به یادِ» */
  function drawCeremonyBadge(x, label, cx, cy) {
    /* اندازه‌ی متن کم می‌شود تا کادر از عرض کارت بیرون نزند */
    var size = 40, maxW = x.canvas.width - 260;
    do { x.font = "700 " + size + "px Vazirmatn, Tahoma"; size -= 2; }
    while (x.measureText(label).width > maxW && size > 26);
    var w = x.measureText(label).width + 76, h = 78, r = 20;
    var left = cx - w / 2, top = cy - h / 2;
    x.beginPath();
    x.moveTo(left + r, top);
    x.arcTo(left + w, top, left + w, top + h, r);
    x.arcTo(left + w, top + h, left, top + h, r);
    x.arcTo(left, top + h, left, top, r);
    x.arcTo(left, top, left + w, top, r);
    x.closePath();
    x.fillStyle = "rgba(217,154,91,.14)"; x.fill();
    x.strokeStyle = "rgba(217,154,91,.65)"; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = "#d99a5b"; x.textBaseline = "middle";
    x.fillText(label, cx, cy + 2);
    x.textBaseline = "alphabetic";
  }

  /* برچسب نوع مراسم از روی مراسم‌های آگهی */
  function ceremonyLabel(d) {
    var names = (d.ceremonies || []).map(function (c) { return c.title; }).filter(Boolean);
    if (d.chehelom && d.chehelom.title) names.push(d.chehelom.title);
    var uniq = [];
    names.forEach(function (n) { if (uniq.indexOf(n) === -1) uniq.push(n); });
    return uniq.length ? uniq.slice(0, 2).join(" / ") : "مراسم یادبود";
  }

  /* فقط نام طایفه‌ی پدری و مادری */
  function tribesLine(d) {
    var f = d.family && d.family.father, m = d.family && d.family.mother;
    var parts = [];
    if (f && f.tayefe) parts.push("طایفه‌ی پدری: " + f.tayefe);
    if (m && m.tayefe) parts.push("طایفه‌ی مادری: " + m.tayefe);
    return parts.join("   •   ");
  }

  function makeCard(d, portrait) {
    var W = 1080, H = 1350, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#181410"); g.addColorStop(1, "#0a0a0a");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // قاب
    x.strokeStyle = "rgba(217,154,91,.35)"; x.lineWidth = 3; x.strokeRect(40, 40, W - 80, H - 80);
    x.direction = "rtl"; x.textAlign = "center";
    // برند
    x.fillStyle = "#d99a5b"; x.font = "700 46px Vazirmatn, Tahoma"; x.fillText("سوگ", W / 2, 150);
    // تصویر متوفی (به‌جای شمع)
    drawPortrait(x, portrait, W / 2, 420, 190);
    // کادر نوع مراسم (به‌جای «به یادِ»)
    drawCeremonyBadge(x, ceremonyLabel(d), W / 2, 690);
    // نام
    x.fillStyle = "#f4f4f4"; fitText(x, d.deceased_name, W - 200, 82); x.fillText(d.deceased_name, W / 2, 800);
    // زیرعنوان
    if (d.subtitle) { x.fillStyle = "#bdbdbd"; x.font = "400 40px Vazirmatn, Tahoma"; x.fillText(d.subtitle, W / 2, 866); }
    // خط
    x.strokeStyle = "#333"; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 160, 920); x.lineTo(W / 2 + 160, 920); x.stroke();
    // تاریخ‌ها
    x.fillStyle = "#d9d9d9"; x.font = "400 44px Vazirmatn, Tahoma";
    var line = "";
    if (d.birth && d.birth.date) line += d.birth.date;
    if (d.death && d.death.date) line += (line ? "  —  " : "") + d.death.date;
    if (line) x.fillText(line, W / 2, 988);
    // شهر
    var city = (d.death && d.death.place) || deceasedCity || "";
    if (city) { x.fillStyle = "#9a9a9a"; x.font = "400 38px Vazirmatn, Tahoma"; x.fillText(city, W / 2, 1050); }
    // طایفه‌ی پدری و مادری (زیر شهر)
    var tribes = tribesLine(d);
    if (tribes) { x.fillStyle = "#8c7a5e"; x.font = "400 34px Vazirmatn, Tahoma"; x.fillText(tribes, W / 2, 1110); }
    // پاورقی
    x.fillStyle = "#7a6a4f"; x.font = "400 34px Vazirmatn, Tahoma"; x.fillText("مشاهده‌ی آگهی و مراسم‌ها در اپلیکیشن سوگ", W / 2, H - 110);
    return x.canvas;
  }

  /* لوگوی سوگ برای کارت‌ها */
  function loadLogo() {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = "assets/img/logo.png";
    });
  }

  /* بارگذاری تصویر متوفی پیش از ساخت کارت (اگر نبود، کارت بدون تصویر ساخته می‌شود) */
  function loadPortrait(d) {
    var src = (d.photos && d.photos[0]) || d.photo;
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }

  /* ---------- ساخت تصویر استوری (۱۰۸۰×۱۹۲۰) ---------- */
  /* متن بلند را در چند خط می‌شکند و ارتفاع مصرف‌شده را برمی‌گرداند */
  function wrapText(x, text, cx, y, maxW, lineH) {
    var words = String(text).split(/\s+/), line = "", lines = [];
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (x.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    lines.forEach(function (l, i) { x.fillText(l, cx, y + i * lineH); });
    return lines.length * lineH;
  }

  /* نزدیک‌ترین مراسم برای نمایش روی استوری */
  function mainCeremony(d) {
    var list = (d.ceremonies || []).slice();
    if (d.chehelom) list.push(d.chehelom);
    return list.filter(Boolean)[0] || null;
  }

  /* استوری سپاسگزاری: متن تشکر خانواده در قالب استوری */
  function makeAckStory(d, ack, portrait, logo) {
    var W = 1080, H = 1920, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;

    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1b1611"); g.addColorStop(.55, "#100e0c"); g.addColorStop(1, "#070707");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(W / 2, 420, 60, W / 2, 420, 620);
    glow.addColorStop(0, "rgba(217,154,91,.13)"); glow.addColorStop(1, "rgba(217,154,91,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);
    x.strokeStyle = "rgba(217,154,91,.35)"; x.lineWidth = 3; x.strokeRect(48, 48, W - 96, H - 96);

    x.direction = "rtl"; x.textAlign = "center";
    if (logo) x.drawImage(logo, W / 2 - 55, 110, 110, 110);

    drawPortrait(x, portrait, W / 2, 450, 150);
    drawCeremonyBadge(x, "سپاسگزاری", W / 2, 650);

    x.fillStyle = "#f4f4f4"; fitText(x, d.deceased_name, W - 200, 60);
    x.fillText(d.deceased_name, W / 2, 760);

    x.strokeStyle = "#333"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(W / 2 - 180, 810); x.lineTo(W / 2 + 180, 810); x.stroke();

    /* متن سپاسگزاری با اندازه‌ی خودتنظیم تا در کادر جا شود */
    var text = String(ack && ack.text ? ack.text : "");
    var size = 42, lineH, used, maxW = W - 220, boxTop = 880, boxBottom = H - 330;
    do {
      x.font = "400 " + size + "px Vazirmatn, Tahoma";
      lineH = Math.round(size * 1.9);
      used = measureWrapped(x, text, maxW, lineH);
      size -= 2;
    } while (used > (boxBottom - boxTop) && size > 22);

    x.fillStyle = "#e2e2e2";
    wrapText(x, text, W / 2, boxTop + lineH, maxW, lineH);

    /* امضا و تاریخ */
    var signY = boxTop + used + 90;
    if (signY > H - 240) signY = H - 240;
    if (ack && ack.signature) {
      x.fillStyle = "#d99a5b"; x.font = "700 40px Vazirmatn, Tahoma";
      x.fillText(ack.signature, W / 2, signY);
    }
    if (ack && ack.date) {
      x.fillStyle = "#8c7a5e"; x.font = "400 34px Vazirmatn, Tahoma";
      x.fillText(ack.date, W / 2, signY + 54);
    }

    x.fillStyle = "#7a6a4f"; x.font = "400 32px Vazirmatn, Tahoma";
    x.fillText("اطلاعات بیشتر در سوگ", W / 2, H - 130);
    return x.canvas;
  }

  /* ارتفاع مورد نیاز متن چندخطی را حساب می‌کند (بدون کشیدن) */
  function measureWrapped(ctx, text, maxW, lineH) {
    var words = String(text).split(/\s+/), line = "", lines = 1;
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines++; line = w; }
      else line = test;
    });
    return lines * lineH;
  }

  /* نام پدر و طایفه (فقط همین دو مورد روی کارت می‌آید) */
  function fatherLine(d) {
    var f = (d.family && d.family.father) || {};
    var parts = [];
    if (f.name) parts.push("پدر: " + f.name);
    if (f.tayefe) parts.push("طایفه: " + f.tayefe);
    return parts.join("   •   ");
  }

  function makeStory(d, portrait, logo) {
    var W = 1080, H = 1920, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;

    /* پس‌زمینه */
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#1b1611"); g.addColorStop(.55, "#100e0c"); g.addColorStop(1, "#070707");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(W / 2, 640, 80, W / 2, 640, 720);
    glow.addColorStop(0, "rgba(217,154,91,.14)"); glow.addColorStop(1, "rgba(217,154,91,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);

    x.strokeStyle = "rgba(217,154,91,.35)"; x.lineWidth = 3;
    x.strokeRect(48, 48, W - 96, H - 96);

    x.direction = "rtl"; x.textAlign = "center";

    /* لوگوی سوگ بالای کارت */
    if (logo) x.drawImage(logo, W / 2 - 70, 130, 140, 140);

    /* تصویر متوفی */
    drawPortrait(x, portrait, W / 2, 640, 240);

    /* نوع مراسم */
    drawCeremonyBadge(x, ceremonyLabel(d), W / 2, 990);

    /* نام و نام خانوادگی */
    x.fillStyle = "#f4f4f4"; fitText(x, d.deceased_name, W - 180, 92);
    x.fillText(d.deceased_name, W / 2, 1130);

    /* شرح کوتاه */
    if (d.subtitle) {
      x.fillStyle = "#bdbdbd"; x.font = "400 42px Vazirmatn, Tahoma";
      x.fillText(d.subtitle, W / 2, 1200);
    }

    /* خط جداکننده */
    x.strokeStyle = "#333"; x.lineWidth = 2;
    x.beginPath(); x.moveTo(W / 2 - 180, 1260); x.lineTo(W / 2 + 180, 1260); x.stroke();

    /* پدر و طایفه */
    var fl = fatherLine(d);
    if (fl) {
      x.fillStyle = "#c9b89c"; x.font = "400 40px Vazirmatn, Tahoma";
      x.fillText(fl, W / 2, 1340);
    }

    /* پاورقی */
    if (logo) x.drawImage(logo, W / 2 - 44, H - 330, 88, 88);
    x.fillStyle = "#a08a68"; x.font = "700 40px Vazirmatn, Tahoma";
    x.fillText("اطلاعات بیشتر در سوگ", W / 2, H - 190);

    return x.canvas;
  }

  /* پیش‌نمایش استوری + دکمه‌های ذخیره و اشتراک */
  function openStory(d, ack) {
    var run = function () {
      Promise.all([loadPortrait(d), loadLogo()]).then(function (res) {
        var portrait = res[0], logo = res[1];
        var canvas = ack ? makeAckStory(d, ack, portrait, logo) : makeStory(d, portrait, logo);
        canvas.toBlob(function (blob) {
          var url = URL.createObjectURL(blob);
          var fileName = (ack ? "sog-thanks-" : "sog-story-") + d.deceased_name + ".png";

          var back = el("div", "sheet-backdrop");
          var box = el("div", "story-modal");
          box.setAttribute("role", "dialog");
          box.setAttribute("aria-modal", "true");
          box.setAttribute("aria-label", "استوری آگهی");

          var close = el("button", "story-close", '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>');
          close.type = "button"; close.setAttribute("aria-label", "بستن");

          var img = el("img", "story-img"); img.src = url; img.alt = "استوری " + d.deceased_name;
          var hint = el("p", "story-hint", "ابعاد ۱۰۸۰×۱۹۲۰ — مناسب استوری اینستاگرام و واتساپ");

          var actions = el("div", "story-actions");
          var save = el("a", "btn-primary", "ذخیره‌ی تصویر");
          save.href = url; save.download = fileName;
          var share = el("button", "btn-ghost", "استوری"); share.type = "button";
          share.addEventListener("click", function () {
            var file = new File([blob], fileName, { type: "image/png" });
            var payload = { title: d.deceased_name, text: "آگهی ترحیم " + d.deceased_name + " — اپلیکیشن سوگ", url: location.href };
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              navigator.share(Object.assign({ files: [file] }, payload)).catch(function () {});
            } else if (navigator.share) {
              navigator.share(payload).catch(function () {});
            } else {
              save.click();
            }
          });
          actions.appendChild(save); actions.appendChild(share);

          box.appendChild(close); box.appendChild(img); box.appendChild(hint); box.appendChild(actions);
          document.body.appendChild(back); document.body.appendChild(box);
          document.body.style.overflow = "hidden";
          requestAnimationFrame(function () { back.classList.add("is-in"); box.classList.add("is-in"); });

          function done() {
            box.remove(); back.remove();
            document.body.style.overflow = "";
            URL.revokeObjectURL(url);
          }
          close.addEventListener("click", done);
          back.addEventListener("click", done);
        }, "image/png");
      });
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([
        document.fonts.load("700 92px Vazirmatn"),
        document.fonts.load("400 44px Vazirmatn")
      ]).then(run).catch(run);
    } else run();
  }

  function shareCard(d) {
    var run = function () {
      loadPortrait(d).then(function (portrait) {
      var canvas = makeCard(d, portrait);
      canvas.toBlob(function (blob) {
        var file = new File([blob], "sog-" + d.deceased_name + ".png", { type: "image/png" });
        var payload = { title: d.deceased_name, text: "به یادِ " + d.deceased_name + " — اپلیکیشن سوگ", url: location.href };
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          navigator.share(Object.assign({ files: [file] }, payload)).catch(function () {});
        } else {
          var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
          a.download = "sog-" + d.deceased_name + ".png"; a.click();
          if (navigator.share) navigator.share(payload).catch(function () {});
        }
      }, "image/png");
      });
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load("700 82px Vazirmatn"), document.fonts.load("400 44px Vazirmatn")]).then(run).catch(run);
    } else run();
  }

  /* ---------- افزودن به تقویم گوشی (.ics) ---------- */
  var JMONTHS = { "فروردین": 1, "اردیبهشت": 2, "خرداد": 3, "تیر": 4, "مرداد": 5, "شهریور": 6, "مهر": 7, "آبان": 8, "آذر": 9, "دی": 10, "بهمن": 11, "اسفند": 12 };
  function toEnNum(s) { return String(s).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); }
  function j2g(jy, jm, jd) {
    var gy = jy > 979 ? 1600 : 621; jy -= jy > 979 ? 979 : 0;
    var days = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    gy += 400 * Math.floor(days / 146097); days %= 146097;
    if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++; }
    gy += 4 * Math.floor(days / 1461); days %= 1461;
    if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
    var gd = days + 1;
    var leap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    var sal = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm = 1; for (; gm <= 12 && gd > sal[gm]; gm++) gd -= sal[gm];
    return [gy, gm, gd];
  }
  function parseJalali(dateText, timeText) {
    var t = toEnNum(dateText || "");
    var year = (t.match(/\b(1[34]\d{2})\b/) || [])[1];
    var day = (t.match(/\b([0-3]?\d)\b/) || [])[1];
    var month = null;
    for (var k in JMONTHS) if (t.indexOf(k) !== -1) { month = JMONTHS[k]; break; }
    if (!year || !month || !day) return null;
    var g = j2g(parseInt(year, 10), month, parseInt(day, 10));
    var hh = 9, mm = 0;
    var tm = toEnNum(timeText || "").match(/(\d{1,2}):(\d{2})/);
    if (tm) { hh = parseInt(tm[1], 10); mm = parseInt(tm[2], 10); }
    return { gy: g[0], gm: g[1], gd: g[2], hh: hh, mm: mm };
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function downloadICS(c) {
    var dt = parseJalali(c.date, c.time_from);
    if (!dt) { alert("تاریخ مراسم قابل تبدیل نبود."); return; }
    var start = dt.gy + pad(dt.gm) + pad(dt.gd) + "T" + pad(dt.hh) + pad(dt.mm) + "00";
    var endH = (dt.hh + 2) % 24;
    var end = dt.gy + pad(dt.gm) + pad(dt.gd) + "T" + pad(endH) + pad(dt.mm) + "00";
    var title = (c.title || "مراسم") + " — " + (currentName || "");
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sog//fa", "BEGIN:VEVENT",
      "UID:sog-" + id + "-" + (c.title || "") + "@sog",
      "DTSTART:" + start, "DTEND:" + end,
      "SUMMARY:" + title,
      "LOCATION:" + (c.location || "").replace(/\n/g, " "),
      "DESCRIPTION:" + (c.date || "") + " " + (c.time_from || ""),
      "BEGIN:VALARM", "TRIGGER:-PT3H", "ACTION:DISPLAY", "DESCRIPTION:" + title, "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "sog-" + (c.title || "event") + ".ics"; a.click();
  }
  var currentName = "";
  var currentDetail = null;

  /* ---------- فوتر نیازمندی‌ها ---------- */
  function needsBanner() {
    var a = el("a", "needs-banner", "<b>نیازمندی‌های مراسمات</b><small>چاپ بنر - گل‌فروشی - سنگ مزار و ...</small>");
    a.href = "business.html";
    return a;
  }

  /* ---------- تعامل آکاردیون‌ها ---------- */
  function bindAccordions() {
    root.addEventListener("click", function (e) {
      var head = e.target.closest(".acc-head");
      if (head) {
        var acc = head.closest(".accordion");
        var open = acc.classList.toggle("is-open");
        head.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      var ch = e.target.closest(".cond-head");
      if (ch) {
        var item = ch.closest(".condolence-item");
        var o = item.classList.toggle("is-open");
        ch.setAttribute("aria-expanded", o ? "true" : "false");
      }
    });
  }
})();
