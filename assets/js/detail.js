/* صفحه جزئیات آگهی سوگ — کاملاً داده‌محور و آکاردیونی.
   داده از data/details.json (کلید = id آگهی) و در نبود آن، پایه از data/listings.json.
   ساختار داده هم‌شکل ACF/WordPress است. */
(function () {
  "use strict";

  var root = document.getElementById("detail");
  var id = new URLSearchParams(location.search).get("id") || "101";

  /* ---------- آیکون‌ها ---------- */
  var ICON = {
    back: SogIcon("back", 22),
    /* کلاس chev برای چرخش فلش آکاردئون لازم است */
    chevron: SogIcon("chevron", 20).replace("<svg ", '<svg class="chev" '),
    clock: SogIcon("clock", 18),
    pin: SogIcon("pin", 18),
    share: SogIcon("share", 22),
    story: SogIcon("story", 22),
    sound: SogIcon("sound", 22),
    soundOff: SogIcon("soundOff", 22),
    bookmark: function (f) {
      var svg = SogIcon("bookmark", 22);
      return f ? svg.replace('fill="none"', 'fill="currentColor"') : svg;
    },
    report: SogIcon("report", 16),
    pencil: SogIcon("pencil", 17),
    plus: SogIcon("plus", 26, 2.4),
    candle: SogIcon("candle", 24),
    route: SogIcon("route", 17),
    bell: SogIcon("bell", 22),
    calAdd: SogIcon("calAdd", 17),
    call: SogIcon("call", 22),
    sms: SogIcon("sms", 22),
    whatsapp: SogIcon("whatsapp", 22),
    telegram: SogIcon("telegram", 22),
    instagram: SogIcon("instagram", 22),
    /* ایتا در مجموعه‌های متن‌باز نشان رسمی ندارد */
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

  /* بخش‌هایی که فعلاً نمایش داده نمی‌شوند و در نسخه‌های بعدی برمی‌گردند */
  var LATER = { candle: true, guestbook: true, notes: true };

  /* همدردی‌ها: ۱۲ تای اول، سپس با هر «دیدن همدردی بیشتر» ۴۰ تای دیگر */
  /* اعداد از تنظیمات پنل مدیریت خوانده می‌شوند (پیش‌فرض ۱۲ و ۴۰) */
  function adminSet() { return window.SogAdmin ? SogAdmin.settings() : {}; }
  var DB = window.SogDB && SogDB.enabled ? SogDB : null;

  /* همدردی‌های ثبت‌شده در Supabase برای این آگهی، هم‌شکل داده‌ی JSON */
  function dbCondolences() {
    if (!DB) return Promise.resolve([]);
    return DB.select("condolences", "select=id,name,message,kind,avatar_url,donated,verified,created_at&listing_id=eq." +
      encodeURIComponent(id) + "&status=eq.published&order=created_at.desc&limit=2000")
      .then(function (rows) {
        return (rows || []).map(function (r) {
          return { db_id: r.id, name: r.name, message: r.message, kind: r.kind, verified: r.verified, donated: r.donated,
                   date: isoToJalali(r.created_at),
                   logo: r.avatar_url || (r.kind === "org" ? "assets/img/org-1.svg" : "assets/img/portrait-1.svg") };
        });
      }).catch(function () { return []; });
  }
  /* عکس پروفایل کاربرِ واردشده (از صفحه‌ی حساب کاربری) */
  function myAvatar() {
    try {
      var uid = window.SogStore && SogStore.getActiveId ? SogStore.getActiveId() : "";
      return localStorage.getItem("sog:avatar:" + (uid || "guest")) || localStorage.getItem("sog:avatar") || "";
    } catch (e) { return ""; }
  }
  function isoToJalali(iso) {
    try {
      var p = new Date(iso).toLocaleDateString("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit" });
      return p.replace(/\u200f/g, "");
    } catch (e) { return ""; }
  }

  /* ---------- بارگذاری ---------- */
  var deceasedCity = null;
  var ALL_LISTINGS = [];

  Promise.all([
    fetch("data/details.json").then(function (r) { return r.json(); }),
    fetch("data/listings.json").then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; }),
    new Promise(function (r) { setTimeout(r, 450); }),
    dbCondolences()
  ]).then(function (res) {
    var details = res[0] || {};
    var listings = (res[1] && res[1].listings) || [];
    /* آگهی‌های ثبت‌شده روی همین دستگاه هم باید باز شوند */
    if (window.SogStore && SogStore.getMyAds) listings = SogStore.getMyAds().concat(listings);
    ALL_LISTINGS = listings;
    var lst = listings.filter(function (x) { return String(x.id) === String(id); })[0];
    if (lst) { deceasedCity = lst.city; }
    var d = details[id];
    if (!d) d = fallbackFromListing(listings, id);
    /* همدردی‌های واقعی کاربران (جدیدترین اول)، به‌جز همدردی خودِ همین دستگاه که جدا نشان داده می‌شود */
    var mineC = SogStore.getMyCondolence(id);
    var live = (res[3] || []).filter(function (c) { return !(mineC && mineC.db_id && mineC.db_id === c.db_id); });
    if (live.length) d.condolences = live.concat(d.condolences || []);
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
    stickyBar(d);
    /* از اطلاعیه‌ی سوگ فوری با «استوری» آمده‌ایم: پنجره‌ی استوری خودکار باز شود */
    if (new URLSearchParams(location.search).get("story") === "1" && !render._story) {
      render._story = true;
      setTimeout(function () { openStory(d); }, 300);
      try { history.replaceState(null, "", location.pathname + "?id=" + encodeURIComponent(id)); } catch (e) {}
    }
    if (d.birth || d.death || d.age) root.appendChild(infoBox(d));
    if (d.family) { var fam = familyGrid(d.family); if (fam) root.appendChild(fam); }
    root.appendChild(actionRow(d));
    root.appendChild(charityCard(d));
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
    if (!LATER.guestbook) root.appendChild(guestbookSection(d));

    if (!LATER.notes) {
      if (ownerMode(d)) root.appendChild(ownerNote(d));
      root.appendChild(privateNote(d));
    }
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
      var s = el("div", "hero-slide" + (slides.children.length ? "" : " is-active")); s.style.backgroundImage = 'url("' + src + '")'; slides.appendChild(s);
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
        [].forEach.call(slides.children, function (c, j) { c.classList.toggle("is-active", j === idx); });
        [].forEach.call(dots.children, function (c, j) { c.classList.toggle("is-active", j === idx); });
      };
      [].forEach.call(dots.children, function (c, j) { c.addEventListener("click", function () { go(j); }); });
      setInterval(function () { go(idx + 1); }, 5500);
    }

    wrap.appendChild(photo);
    wrap.appendChild(el("h1", "detail-name", esc(d.deceased_name)));
    if (d.subtitle) wrap.appendChild(el("p", "detail-subtitle", esc(d.subtitle)));
    return wrap;
  }

  /* ---------- نوار ثابت بالا: وقتی نام درگذشته از دید خارج شد ظاهر می‌شود ---------- */
  function stickyBar(d) {
    var old = document.querySelector(".detail-bar"); if (old) old.remove();
    var bar = el("div", "detail-bar");
    bar.setAttribute("aria-hidden", "true");
    var back = el("button", "db-back", ICON.back); back.type = "button"; back.setAttribute("aria-label", "بازگشت");
    back.addEventListener("click", function () { if (history.length > 1) history.back(); else location.href = "index.html"; });
    var photo = (d.photos && d.photos[0]) || "assets/img/portrait-1.svg";
    var yr = function (o) { var m = /([۰-۹0-9]{4})/.exec((o && o.date) || ""); return m ? m[1] : ""; };
    var years = [yr(d.birth), yr(d.death)].filter(Boolean).join(" – ");
    var sub = [years, d.subtitle].filter(Boolean)[0] || "";
    var info = el("button", "db-info",
      '<span class="db-photo" style="background-image:url(\'' + esc(photo) + '\')"></span>' +
      '<span class="db-text"><b>' + esc(d.deceased_name) + "</b>" + (sub ? "<small>" + esc(sub) + "</small>" : "") + "</span>");
    info.type = "button";
    info.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    bar.appendChild(info); bar.appendChild(back);
    document.body.appendChild(bar);
    var target = root.querySelector(".detail-name");
    if (!target || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (es) {
      var show = !es[0].isIntersecting && es[0].boundingClientRect.top < 0;
      bar.classList.toggle("is-in", show);
      bar.setAttribute("aria-hidden", show ? "false" : "true");
    }).observe(target);
  }

  /* ---------- خیرات به نیت درگذشته ---------- */
  var CHARITY = null;
  function loadCharities() {
    if (CHARITY) return Promise.resolve(CHARITY);
    return fetch("data/charities.json").then(function (r) { return r.json(); }).then(function (j) { CHARITY = j; return j; });
  }
  function myDonations() { try { return JSON.parse(localStorage.getItem("sog:donations")) || []; } catch (e) { return []; } }
  function toman(n) { return faNum(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "٬")) + " تومان"; }

  function charityCard(d) {
    var card = el("button", "charity-card"); card.type = "button";
    var mine = myDonations().filter(function (x) { return String(x.listing) === String(id); });
    card.innerHTML =
      '<span class="cc-ico">' + SogIcon("condole", 24) + "</span>" +
      '<span class="cc-text"><b>خیرات به نیت ' + esc(d.deceased_name) + "</b>" +
      "<small>" + (mine.length ? "شما " + faNum(mine.length) + " بار خیرات کرده‌اید · باز هم" : "کودکان سرطانی، کمیته امداد، هلال احمر، زندانیان، بهزیستی") + "</small></span>" +
      '<span class="cc-go">خیرات</span>';
    card.addEventListener("click", function () { loadCharities().then(function () { openCharitySheet(d); }); });
    return card;
  }

  function openCharitySheet(d) {
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "report-sheet charity-sheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    var pick = { charity: null, amount: CHARITY.amounts[1] };
    sheet.innerHTML =
      '<div class="sheet-handle"></div>' +
      '<h3 class="report-title">خیرات به نیت ' + esc(d.deceased_name) + "</h3>" +
      '<p class="ch-label">به نیت کجا؟</p><div class="ch-orgs"></div>' +
      '<p class="ch-label">مبلغ</p><div class="ch-amounts"></div>' +
      '<label class="ch-custom"><input type="text" inputmode="numeric" placeholder="مبلغ دلخواه"><span>تومان</span></label>' +
      '<p class="ch-note">پرداخت در سایت رسمی همان مؤسسه انجام می‌شود.</p>' +
      '<div class="report-actions"><button type="button" class="btn-primary ch-pay" disabled>انتخاب مؤسسه</button>' +
      '<button type="button" class="btn-ghost ch-cancel">بی‌خیال</button></div>';
    var orgs = sheet.querySelector(".ch-orgs"), amts = sheet.querySelector(".ch-amounts");
    var custom = sheet.querySelector(".ch-custom input"), pay = sheet.querySelector(".ch-pay");
    function paintPay() {
      pay.disabled = !pick.charity || !(pick.amount >= 1000);
      pay.textContent = !pick.charity ? "انتخاب مؤسسه" : pick.amount >= 1000 ? "پرداخت " + toman(pick.amount) : "مبلغ را وارد کنید";
    }
    CHARITY.charities.forEach(function (c) {
      var b = el("button", "ch-org", '<span class="ch-dot" style="background:' + esc(c.color) + '"></span><span><b>' + esc(c.name) + "</b><small>" + esc(c.org) + "</small></span>");
      b.type = "button";
      b.addEventListener("click", function () {
        pick.charity = c;
        Array.prototype.forEach.call(orgs.children, function (n) { n.classList.toggle("is-on", n === b); });
        paintPay();
      });
      orgs.appendChild(b);
    });
    CHARITY.amounts.forEach(function (a) {
      var b = el("button", "ch-amt" + (a === pick.amount ? " is-on" : ""), toman(a)); b.type = "button";
      b.addEventListener("click", function () {
        pick.amount = a; custom.value = "";
        Array.prototype.forEach.call(amts.children, function (n) { n.classList.toggle("is-on", n === b); });
        paintPay();
      });
      amts.appendChild(b);
    });
    custom.addEventListener("input", function () {
      var v = parseInt(toEnNum(custom.value).replace(/\D/g, ""), 10) || 0;
      custom.value = v ? faNum(String(v).replace(/\B(?=(\d{3})+(?!\d))/g, "٬")) : "";
      pick.amount = v;
      Array.prototype.forEach.call(amts.children, function (n) { n.classList.remove("is-on"); });
      paintPay();
    });
    function done() {
      sheet.classList.remove("is-in"); back.classList.remove("is-in");
      document.body.style.overflow = "";
      setTimeout(function () { sheet.remove(); back.remove(); }, 220);
    }
    pay.addEventListener("click", function () {
      var rec = { listing: id, name: d.deceased_name, charity: pick.charity.id, charityName: pick.charity.name, amount: pick.amount, at: Date.now() };
      var all = myDonations(); all.push(rec);
      try { localStorage.setItem("sog:donations", JSON.stringify(all)); } catch (e) {}
      /* اگر قبلاً همدردی نوشته، نشان «خیرات کرده» کنارش می‌آید */
      var mineC = SogStore.getMyCondolence(id);
      if (mineC) {
        mineC.donated = true; SogStore.setMyCondolence(id, mineC);
        if (DB && mineC.db_id && mineC.token) DB.rpc("mark_condolence_donated", { p_id: mineC.db_id, p_token: mineC.token }).catch(function () {});
      }
      window.open(pick.charity.url, "_blank", "noopener");
      done();
      toast("در سایت " + pick.charity.org + " مبلغ " + toman(pick.amount) + " را پرداخت کنید. خدا قبول کند.");
      render(d);
    });
    sheet.querySelector(".ch-cancel").addEventListener("click", done);
    back.addEventListener("click", done);
    document.body.appendChild(back); document.body.appendChild(sheet);
    document.body.style.overflow = "hidden";
    paintPay();
    requestAnimationFrame(function () { back.classList.add("is-in"); sheet.classList.add("is-in"); });
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
  /* متن تک‌خطی که اگر جا نشد آرام می‌چرخد (مثل کارت‌های صفحه‌ی اصلی) */
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
        /* متن در یک ستون کشسان که در صورت طولانی‌بودن می‌چرخد؛
           شمارنده ستون جداگانه‌ی خودش را دارد و هیچ‌وقت جابه‌جا نمی‌شود. */
        var a = el("a", "val clan-link",
          '<span class="mq-inner">' + esc(r[1]) + "</span>");
        a.href = "index.html?" + key + "=" + encodeURIComponent(r[1]);
        a.title = "مشاهده‌ی همه‌ی آگهی‌های " + r[0] + " " + r[1];
        row.appendChild(a);
        marquee(a);
      } else {
        var v = el("span", "val", '<span class="mq-inner">' + esc(r[1]) + "</span>");
        row.appendChild(v);
        marquee(v);
      }
      card.appendChild(row);
    });
    return card;
  }

  /* ---------- دکمه‌های عمل ---------- */
  function actionRow(d) {
    var row = el("div", "action-row");
    row.appendChild(actionItem(ICON.bell, "یادآوری", function () { openRemindSheet(d); }));
    if (d.photos && d.photos.length) row.appendChild(actionItem(ICON.story, "استوری اشتراک", function () { openStory(d); }));
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
    var b = el("button", "report-error", '<span class="report-art"></span>');
    b.setAttribute("aria-label", "گزارش خطا");
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

  /* ---------- بازشوی یادآوری مراسم‌ها ---------- */
  /* تاریخ سالگردِ بعدی بر اساس همان روز و ماه */
  function nextYearlyDate(dateText) {
    var t = toEnNum(dateText || "");
    var day = (t.match(/\b([0-3]?\d)\b/) || [])[1];
    var month = null, monthName = "";
    for (var k in JMONTHS) if (t.indexOf(k) !== -1) { month = JMONTHS[k]; monthName = k; break; }
    if (!day || !month || !window.SogUtil) return null;
    day = parseInt(day, 10);
    var today = SogUtil.todayJalali();
    var year = today.y;
    if (month * 100 + day <= today.m * 100 + today.d) year += 1;
    return faNum(day) + " " + monthName + " " + faNum(year);
  }

  function openRemindSheet(d) {
    closeReportSheet();
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "report-sheet remind-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "یادآوری مراسم");

    var close = el("button", "report-close", SogIcon("close", 22));
    close.type = "button"; close.setAttribute("aria-label", "بستن");

    sheet.appendChild(close);
    sheet.appendChild(el("h3", "report-title", "یادآوری مراسم"));
    sheet.appendChild(el("p", "remind-hint", "مراسم‌هایی را که می‌خواهید یادآوری‌شان را داشته باشید انتخاب کنید."));

    /* همه‌ی رویدادها: مراسم‌ها، چهلم و سالگردها */
    var events = (d.ceremonies || []).slice();
    if (d.chehelom) events.push(Object.assign({ type: "chehelom", title: "چهلم" }, d.chehelom));
    (d.anniversaries || []).forEach(function (a) {
      events.push(Object.assign({ type: "salgard-" + a.year, title: "سالگرد " + faNum(a.year) }, a));
    });

    /* سالگرد هر سال تکرار می‌شود؛ اگر تاریخِ ثبت‌شده گذشته باشد،
       سالگردِ بعدی محاسبه و برای یادآوری پیشنهاد می‌شود. */
    events = events.map(function (c) {
      if (!c.date || !/^salgard-/.test(c.type || "") || !isPastEvent(c)) return c;
      var next = nextYearlyDate(c.date);
      if (!next) return c;
      return Object.assign({}, c, { date: next, nextYear: true });
    });

    var upcoming = events.filter(function (c) { return c.date && !isPastEvent(c); });
    var saved = (window.SogStore && SogStore.getReminders && SogStore.getReminders()) || {};
    var chosen = {};

    if (!upcoming.length) {
      sheet.appendChild(el("p", "remind-empty", "مراسمِ پیش‌روی ثبت‌شده‌ای برای این آگهی وجود ندارد."));
    } else {
      var list = el("div", "remind-list");
      upcoming.forEach(function (c) {
        var key = id + "|" + (c.type || c.title || "event");
        var on = !!(saved[key] && saved[key].on);
        chosen[key] = on;

        var row = el("button", "remind-row" + (on ? " is-on" : "")); row.type = "button";
        var info = el("span", "rr-info");
        info.appendChild(el("span", "rr-title", esc(c.title || "مراسم")));
        info.appendChild(el("span", "rr-meta",
          esc([c.nextYear ? "سالگرد بعدی: " + c.date : c.date, c.time_from ? "ساعت " + c.time_from : ""].filter(Boolean).join(" • "))));
        row.appendChild(info);
        row.appendChild(el("span", "rr-check", SogIcon("check", 15)));
        row.addEventListener("click", function () {
          chosen[key] = !chosen[key];
          row.classList.toggle("is-on", chosen[key]);
        });
        row.dataset.key = key;
        row._ev = c;
        list.appendChild(row);
      });
      sheet.appendChild(list);

      var save = el("button", "remind-save", "ثبت یادآوری"); save.type = "button";
      save.addEventListener("click", function () {
        var n = 0;
        Array.prototype.forEach.call(list.querySelectorAll(".remind-row"), function (row) {
          var key = row.dataset.key, c = row._ev;
          if (chosen[key]) {
            n++;
            if (window.SogStore && SogStore.addReminder) {
              SogStore.addReminder({
                key: key, id: id, name: currentName || "",
                photo: (currentDetail && (currentDetail.photo || (currentDetail.photos || [])[0])) || "",
                title: c.title || "مراسم", date: c.date || ""
              });
            }
            downloadICS(c);
          } else if (window.SogStore && SogStore.removeReminder) {
            SogStore.removeReminder(key);
          }
        });
        closeReportSheet();
        toast(n ? "یادآوری " + faNum(n) + " مراسم ثبت شد؛ در «پروفایل ← اعلان» قابل مدیریت است."
                : "همه‌ی یادآوری‌های این آگهی برداشته شد.");
      });
      sheet.appendChild(save);
    }

    close.addEventListener("click", closeReportSheet);
    back.addEventListener("click", closeReportSheet);
    document.body.appendChild(back); document.body.appendChild(sheet);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { back.classList.add("is-in"); sheet.classList.add("is-in"); });
  }

  /* گزارش همدردی: دلیل‌ها مخصوص همان پیام است */
  var COND_REPORT_TYPES = ["محتوای توهین‌آمیز یا نامناسب", "اطلاعات نادرست", "تبلیغات یا هرزنامه", "سایر"];

  function openReportSheet(d, cd) {
    closeReportSheet();
    var title = cd ? "گزارش همدردی" : "گزارش خطا";
    var types = cd ? COND_REPORT_TYPES : REPORT_TYPES;
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "report-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", title);

    var close = el("button", "report-close", SogIcon("close", 22));
    close.type = "button";
    close.setAttribute("aria-label", "بستن");

    var form = el("form", "report-form");
    form.innerHTML =
      '<h3 class="report-title">' + title + '</h3>' +
      (cd ? '<p class="report-sub">گزارش شما برای ' + esc(cd.name) + ' (ثبت‌کننده‌ی این همدردی) ارسال می‌شود.</p>' : '') +
      '<label class="report-field"><span>' + (cd ? "دلیل گزارش" : "نوع خطا") + '</span>' +
      '<select name="type" required>' + types.map(function (t) {
        return '<option value="' + esc(t) + '">' + esc(t) + '</option>';
      }).join("") + '</select></label>' +
      '<label class="report-field"><span>توضیحات</span>' +
      '<textarea name="note" rows="3" placeholder="چه چیزی درست نیست؟ کوتاه توضیح بدهید."></textarea></label>' +
      '<div class="report-field"><span>بارگذاری تصویر (اختیاری)</span>' +
      '<label class="report-upload"><input type="file" name="photo" accept="image/png,image/jpeg" hidden>' +
      '<span class="up-ico">' + SogIcon("camera", 26) + '</span>' +
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
          /* گیرنده: گزارش همدردی به ثبت‌کننده‌ی همان همدردی؛ گزارش خطا به پشتیبانی و ثبت‌کننده‌ی آگهی */
          condolence: cd ? (cd.db_id ? "db:" + cd.db_id : condKey(cd)) : null,
          to: cd ? ["condolence-author"] : ["sog-support", "listing-owner"],
          owner: (d && d.owner_id) || null,
          status: "queued"
        });
        localStorage.setItem("sog:reports", JSON.stringify(box));
      } catch (err) {}
      var targetId = d && d.id != null ? String(d.id) : String(id);
      if (window.SogAdmin && SogAdmin.reportFiled) {
        SogAdmin.reportFiled(cd ? "condolence" : "listing", targetId, cd ? (cd.db_id ? "db:" + cd.db_id : condKey(cd)) : "");
      }
      if (DB) {
        var photo = fd.get("photo");
        var up = photo && photo.size ? DB.upload(photo, "reports").catch(function () { return null; }) : Promise.resolve(null);
        up.then(function (url) {
          return DB.insert("reports", {
            kind: cd ? "condolence" : "listing",
            target_id: targetId,
            target_ref: cd ? (cd.db_id ? "db:" + cd.db_id : "json:" + condKey(cd)) : null,
            reporter: window.SogAdmin ? SogAdmin.deviceId() : null,
            target_name: (d && d.deceased_name || "") + (cd ? " — همدردی «" + (cd.name || "") + "»" : ""),
            type: String(fd.get("type") || ""), note: String(fd.get("note") || "").slice(0, 3000), photo_url: url
          });
        }).catch(function (er) { console.error(er); });
      }
      form.replaceWith(el("div", "report-done",
        '<div class="ok-ico">' + SogIcon("check", 30) + '</div>' +
        '<p>' + (cd ? "گزارش شما ثبت و برای ثبت‌کننده‌ی این همدردی ارسال شد." : "گزارش شما ثبت و برای پشتیبانی سوگ و ثبت‌کننده‌ی آگهی ارسال شد.") + ' با تشکر از همراهی‌تان.</p>'));
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
      wrap.appendChild(carousel(bio.gallery, function (n) { openLightbox(bio.gallery, n); }));
    }
    /* لینک اختیاری اینستاگرام درگذشته */
    if (bio.instagram) {
      var handle = String(bio.instagram).replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/+$/, "");
      var ig = el("a", "bio-instagram");
      ig.href = "https://instagram.com/" + handle;
      ig.target = "_blank"; ig.rel = "noopener";
      ig.innerHTML = '<span class="bi-ico">' + SogIcon("instagram", 22) + '</span>' +
        '<span class="bi-info"><span class="bi-text">صفحه‌ی اینستاگرام درگذشته</span>' +
        '<span class="bi-handle">@' + esc(handle) + '</span></span>' +
        '<span class="bi-go">مشاهده</span>';
      wrap.appendChild(ig);
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

  /* مراسم پس از نیمه‌شبِ روز برگزاری «تمام‌شده» حساب می‌شود.
     تاریخ هم به شکل «۱۴۰۴/۰۵/۱۷» و هم «پنج‌شنبه ۱۷ مرداد ۱۴۰۴» خوانده می‌شود. */
  function eventNum(dateStr) {
    if (!dateStr || !window.SogUtil) return 0;
    var t = SogUtil.toEn(dateStr);
    var m = t.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
    if (m) return +m[1] * 10000 + +m[2] * 100 + +m[3];
    var mi = -1;
    SogUtil.jMonths.forEach(function (name, i) { if (t.indexOf(name) !== -1) mi = i + 1; });
    var nums = t.match(/\d{1,4}/g) || [];
    var day = null, year = null;
    nums.forEach(function (n) { if (n.length === 4) year = +n; else if (day === null) day = +n; });
    if (mi < 1 || !year || !day) return 0;
    return year * 10000 + mi * 100 + day;
  }
  function isPastEvent(c) {
    var ev = eventNum(c && c.date);
    if (!ev || !window.SogUtil) return false;
    var t = SogUtil.todayJalali();
    return ev < t.y * 10000 + t.m * 100 + t.d;
  }

  /* ---------- بلوک رویداد ---------- */
  function eventBody(c) {
    var wrap = el("div");
    /* مراسمِ تمام‌شده خلاصه می‌شود: نقشه، مسیریابی، یادآوری و چیپ‌ها حذف می‌شوند
       و فقط زمان، مکان و تصاویر مراسم می‌ماند. */
    var past = isPastEvent(c);
    if (past) wrap.className = "event-past";
    if (c.date || c.time_from || c.time_to) {
      var dl = el("div", "event-line");
      dl.innerHTML = '<span class="ev-ico">' + ICON.clock + '</span><span class="ev-lbl">زمان :</span>';
      /* تاریخ و کادر ساعت در یک ستون‌اند تا ساعت دقیقاً زیر متن تاریخ شروع شود */
      var col = el("div", "ev-col");
      if (c.date) col.appendChild(el("span", null, esc(c.date)));
      if ((c.time_from || c.time_to) && !past) {
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
    if (c.map && !past) { var m = el("div", "event-map"); m.style.backgroundImage = 'url("' + c.map + '")'; wrap.appendChild(m); }
    if ((c.location || c.date) && !past) {
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
        cal.addEventListener("click", function () {
          downloadICS(c);
          /* یادآوری در پنل کاربری ثبت می‌شود تا کاربر بتواند جداگانه خاموشش کند */
          if (window.SogStore && SogStore.addReminder) {
            SogStore.addReminder({
              key: id + "|" + (c.type || c.title || "event"),
              id: id, name: currentName || "",
              photo: (currentDetail && (currentDetail.photo || (currentDetail.photos || [])[0])) || "",
              title: c.title || "مراسم", date: c.date || ""
            });
          }
          toast("یادآوری این مراسم ثبت شد؛ در «تنظیمات ← اعلان» قابل مدیریت است.");
        });
        eb.appendChild(cal);
      }
      wrap.appendChild(eb);
    }
    if (c.chips && c.chips.length && !past) {
      var cc = el("div", "chips-col");
      c.chips.forEach(function (t) { cc.appendChild(el("span", "event-chip", esc(t))); });
      wrap.appendChild(cc);
    }
    if (c.description && !past) {
      var db = el("div", "desc-box");
      db.appendChild(el("span", "desc-label", "توضیحات"));
      db.appendChild(el("div", null, fmtDesc(c.description)));
      wrap.appendChild(db);
    }
    /* تصاویر مراسم: عکس‌های آگهی + عکس‌هایی که صاحب عزا بعد از مراسم اضافه می‌کند */
    wrap.appendChild(eventGallery(c));
    return wrap;
  }
  function markPast(acc, c) {
    if (acc && isPastEvent(c)) {
      acc.classList.add("is-past");
      var head = acc.querySelector(".acc-head");
      if (head && !head.querySelector(".acc-done")) {
        head.querySelector("span").insertAdjacentHTML("afterend", '<span class="acc-done">برگزار شد</span>');
      }
    }
    return acc;
  }
  function eventAccordion(c) { return markPast(accordion(c.title, eventBody(c)), c); }

  /* ---------- کاروسل افقی ----------
     اسکرول افقی با snap، بخشی از تصویر بعدی پیداست و خودکار می‌چرخد.
     با دست زدن کاربر مکث می‌کند و بعد از چند ثانیه دوباره راه می‌افتد. */
  function carousel(images, onOpen, extra) {
    var box = el("div", "carousel");
    var track = el("div", "car-track");

    images.forEach(function (src, i) {
      var slide = el("div", "car-slide");
      var btn = el("button", "car-img"); btn.type = "button";
      btn.style.backgroundImage = 'url("' + src + '")';
      btn.setAttribute("aria-label", "بزرگ‌نمایی تصویر " + faNum(i + 1));
      btn.addEventListener("click", function () { onOpen(i); });
      slide.appendChild(btn);
      if (extra) extra(slide, i);
      track.appendChild(slide);
    });
    box.appendChild(track);

    if (images.length < 2) return box;

    var dots = el("div", "car-dots");
    images.forEach(function (_, i) {
      var d = el("span", "car-dot" + (i === 0 ? " is-on" : ""));
      dots.appendChild(d);
    });
    box.appendChild(dots);

    function slideAt() {
      var first = track.firstChild;
      return first ? first.getBoundingClientRect().width + 10 : 1;
    }
    /* در چیدمان راست‌به‌چپ، scrollLeft منفی می‌شود؛ جهت باید لحاظ شود
       وگرنه scrollTo به صفر چسبانده می‌شود و کاروسل تکان نمی‌خورد. */
    /* جهت باید هنگام استفاده خوانده شود، نه هنگام ساخت: عنصرِ هنوز
       اضافه‌نشده به صفحه همیشه ltr گزارش می‌شود. */
    function dir() { return getComputedStyle(track).direction === "rtl" ? -1 : 1; }
    function current() { return Math.round(Math.abs(track.scrollLeft) / slideAt()); }
    function goTo(n) { track.scrollTo({ left: dir() * n * slideAt(), behavior: "smooth" }); }
    function markDots() {
      var n = Math.min(images.length - 1, Math.max(0, current()));
      Array.prototype.forEach.call(dots.children, function (d, i) {
        d.classList.toggle("is-on", i === n);
      });
    }
    track.addEventListener("scroll", markDots, { passive: true });

    /* چرخش خودکار */
    var paused = false, resume = null;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      var timer = setInterval(function () {
        /* وقتی صفحه دوباره ساخته شد، تایمر قدیمی خودش را جمع می‌کند */
        if (!document.body.contains(box)) { clearInterval(timer); return; }
        if (paused || document.hidden) return;
        var r = box.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;   /* بیرون از دید */
        var next = current() + 1;
        if (next >= images.length) next = 0;
        goTo(next);
      }, 4000);
    }
    function pause() {
      paused = true;
      clearTimeout(resume);
      resume = setTimeout(function () { paused = false; }, 6000);
    }
    ["pointerdown", "touchstart", "wheel"].forEach(function (ev) {
      track.addEventListener(ev, pause, { passive: true });
    });

    return box;
  }

  /* ---------- نمایشگر تمام‌صفحه ----------
     تصویر بزرگ با نوار بندانگشتی پایین؛ کلیک روی هر بندانگشتی آن را بالا می‌آورد. */
  function openLightbox(images, start) {
    var i = start || 0;
    var lb = el("div", "lb");
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");

    var bar = el("div", "lb-bar");
    var close = el("button", "lb-btn", SogIcon("close", 22));
    close.type = "button"; close.setAttribute("aria-label", "بستن");
    var share = el("button", "lb-btn", SogIcon("upload", 22));
    share.type = "button"; share.setAttribute("aria-label", "هم‌رسانی");
    bar.appendChild(close); bar.appendChild(share);

    var stage = el("div", "lb-stage");
    var img = el("img", "lb-img"); img.alt = "";
    var prev = el("button", "lb-nav lb-prev", SogIcon("chevLeft", 24));
    var next = el("button", "lb-nav lb-next", SogIcon("chevRight", 24));
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "تصویر قبلی"); next.setAttribute("aria-label", "تصویر بعدی");
    var count = el("span", "lb-count");
    /* واترمارک سوگ، روی خود تصویر */
    var mark = el("span", "lb-mark",
      '<img src="assets/img/logo.png" alt="سوگ">');   /* فقط لوگو */
    /* شمارنده و واترمارک داخل قابِ خودِ تصویر می‌نشینند، نه گوشه‌ی صفحه */
    var frame = el("div", "lb-frame");
    frame.appendChild(img); frame.appendChild(count); frame.appendChild(mark);
    stage.appendChild(frame); stage.appendChild(prev); stage.appendChild(next);

    var strip = el("div", "lb-strip");
    images.forEach(function (src, n) {
      var t = el("button", "lb-thumb"); t.type = "button";
      t.style.backgroundImage = 'url("' + src + '")';
      t.setAttribute("aria-label", "تصویر " + faNum(n + 1));
      t.addEventListener("click", function () { show(n); });
      strip.appendChild(t);
    });

    lb.appendChild(bar); lb.appendChild(stage); lb.appendChild(strip);

    function show(n) {
      i = (n + images.length) % images.length;
      img.src = images[i];
      count.textContent = faNum(i + 1) + " از " + faNum(images.length);
      Array.prototype.forEach.call(strip.children, function (t, k) {
        t.classList.toggle("is-on", k === i);
      });
      var on = strip.children[i];
      if (on && on.scrollIntoView) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    prev.addEventListener("click", function () { show(i - 1); });
    next.addEventListener("click", function () { show(i + 1); });

    /* کشیدن انگشت چپ و راست */
    var x0 = null;
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(dx > 0 ? i - 1 : i + 1);   /* RTL: کشیدن به راست = قبلی */
      x0 = null;
    });

    function done() {
      lb.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") done();
      else if (e.key === "ArrowLeft") show(i + 1);
      else if (e.key === "ArrowRight") show(i - 1);
    }
    close.addEventListener("click", done);
    document.addEventListener("keydown", onKey);
    share.addEventListener("click", function () {
      var url = location.href;
      if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("نشانی کپی شد."); });
    });

    document.body.appendChild(lb);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { lb.classList.add("is-in"); });
    show(i);
  }

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
        box.appendChild(carousel(all, function (n) { openLightbox(all, n); }, function (slide, i) {
          /* فقط تصاویری که خود کاربر اضافه کرده قابل حذف‌اند */
          if (owner && i >= (c.gallery || []).length) {
            var x = el("button", "thumb-x", "×"); x.type = "button";
            x.setAttribute("aria-label", "حذف تصویر");
            x.addEventListener("click", function (e) {
              e.stopPropagation();
              SogStore.removeEventPhoto(id, key, i - (c.gallery || []).length);
              paint();
            });
            slide.appendChild(x);
          }
        }));
      }

      if (!owner) return;

      var add = el("label", "event-add-photo");
      add.innerHTML = SogIcon("plus", 18) +
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
    var title = "سالگرد " + a.year;
    if (a.empty) {
      /* سالگردی که هنوز اطلاعاتی ندارد: خانواده می‌تواند تصاویرش را اضافه کند */
      var wrap = el("div");
      wrap.appendChild(el("p", "anniv-empty-text", "اطلاعاتی برای این سالگرد ثبت نشده است."));
      wrap.appendChild(eventGallery({ title: title, type: "salgard-" + a.year, gallery: [] }));
      return wrap;
    }
    return eventBody(Object.assign({}, a, { title: title }));
  }
  function anniversaryAccordion(a) {
    return markPast(accordion("سالگرد " + a.year, anniversaryBody(a), { empty: !!a.empty }), a);
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
    return markPast(accordion("سالگرد " + latest.year, wrap, { empty: !!latest.empty && !older.length }), latest);
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

    var acc = accordion("سپاسگزاری", wrap);

    /* مداد ویرایش روی سربرگ: فقط برای ثبت‌کننده‌ی آگهی */
    if (owner) {
      var head = acc.querySelector(".acc-head");
      if (head) {
        var pen = el("span", "acc-edit", ICON.pencil);
        pen.setAttribute("role", "button");
        pen.tabIndex = 0;
        pen.setAttribute("aria-label", "ویرایش متن سپاسگزاری");
        function openEditor(e) {
          e.preventDefault(); e.stopPropagation();
          if (!acc.classList.contains("is-open")) head.click();
          paintEditor();
        }
        pen.addEventListener("click", openEditor);
        pen.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") openEditor(e);
        });
        head.querySelector("span").insertAdjacentElement("afterend", pen);
      }
    }
    return acc;
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
    "با کمال تأسف در غم از دست دادن عزیزتان شریک هستیم. صبر و آرامش برای شما و خانواده محترم آرزومندیم.",
    "خبر درگذشت ایشان ما را سخت اندوهگین کرد. تسلیت صمیمانه ما را بپذیرید.",
    "این ضایعه جبران‌ناپذیر را به شما و بازماندگان محترم تسلیت عرض می‌کنیم. روحش شاد و یادش گرامی.",
    "غم بزرگی است که در آن سهیم هستیم. برای شما صبر و برای آن عزیز رحمت الهی آرزو داریم.",
    "با شنیدن این خبر تلخ، قلبمان اندوهگین شد. برای خانواده داغدار آرزوی صبر داریم.",
    "درگذشت این عزیز را تسلیت می‌گوییم. یادش همیشه در دل‌ها زنده خواهد ماند.",
    "این مصیبت را به شما تسلیت عرض می‌کنیم و برای روح آن مرحوم طلب مغفرت داریم.",
    "در این لحظات سخت، در کنار شما و خانواده‌تان هستیم. تسلیت صمیمانه ما را بپذیرید.",
    "فقدان این عزیز، غمی بزرگ برای همه ماست. برایتان صبر و شکیبایی آرزومندیم.",
    "با تأسف فراوان این خبر تلخ را شنیدیم. تسلیت ما را به شما و خانواده محترم تقدیم می‌کنیم.",
    "با نهایت تأسف و تألم، درگذشت آن عزیز سفرکرده را به اطلاع رسیدیم. این ضایعه جبران‌ناپذیر را به بازماندگان محترم تسلیت عرض می‌کنیم. برای آن مرحوم علو درجات و برای شما صبر جمیل آرزومندیم.",
    "خبر تلخ درگذشت ایشان موجب اندوه عمیق ما گردید. در این غم بزرگ، خود را شریک شما و خانواده محترمتان می‌دانیم. روحش شاد، یادش گرامی و راهش پر رهرو باد.",
    "زندگی گذرگاهی است که همه ما را به سوی ابدیت رهنمون می‌سازد. درگذشت آن عزیز، دل همه دوستداران و آشنایان را اندوهگین ساخت. از خداوند برای آن مرحوم رحمت واسعه و برای شما صبر مسئلت داریم.",
    "با کمال تأثر و تألم، ضایعه درگذشت عزیز سفرکرده‌تان را شنیدیم. این مصیبت را به شما و سایر بازماندگان محترم تسلیت می‌گوییم. امیدواریم یاد و خاطره او همیشه در قلب‌های شما زنده بماند.",
    "غم از دست دادن یک عزیز، غمی است که تنها با گذر زمان کمی تسکین می‌یابد. ما نیز در این اندوه بزرگ خود را سهیم می‌دانیم. برای آن مرحوم رحمت الهی و برای بازماندگان صبر و سلامتی آرزومندیم.",
    "درگذشت ناگهانی این عزیز، بر ما نیز سخت و دشوار گذشت. تسلیت قلبی خود را به شما و خانواده محترمتان تقدیم می‌داریم. یادش گرامی و خاطراتش برای همیشه ماندگار باد.",
    "هر انسانی روزی این جهان فانی را ترک می‌گوید، اما جای خالی برخی هیچ‌گاه پر نمی‌شود. درگذشت آن عزیز برای همه ما دردناک و غم‌انگیز بود. برای شما صبر و برای روح او آرامش ابدی آرزومندیم.",
    "با تألم فراوان از درگذشت آن عزیز آگاه شدیم. این خبر تلخ، اندوه عمیقی در دل ما ایجاد کرد. برای خانواده داغدار صبر و برای مرحوم غفران الهی خواستاریم.",
    "در سوگ عزیز از دست رفته‌تان با شما همراه و همدل هستیم. این ضایعه بزرگ را از صمیم قلب تسلیت عرض می‌کنیم. باشد که خداوند به شما صبر و به روح او آرامش عطا فرماید.",
    "زندگی او هرچند کوتاه بود، اما خاطره‌ای ماندگار از خود بر جای گذاشت. درگذشتش را به شما و تمامی بازماندگان محترم تسلیت می‌گوییم. یادش جاودان و روحش شاد باد."
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
  /* آیا این دستگاه به نیت همین درگذشته خیرات کرده است؟ */
  function iDonated() {
    return myDonations().some(function (x) { return String(x.listing) === String(id); });
  }
  var DONOR_BADGE = '<span class="donor-badge" title="به نیت درگذشته خیرات کرده است">' +
    '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8.3 3.3 5 6.6 5c2 0 3.3 1.1 4.1 2.3h2.6C14.1 6.1 15.4 5 17.4 5c3.3 0 5.5 3.3 4.1 6.7C19.5 16.4 12 21 12 21z" fill="currentColor"/></svg>' +
    "نیکوکار</span>";

  function myCondolenceItem(d, entry) {
    var item = el("div", "condolence-item is-mine is-open");
    var head = el("div", "cond-head");
    var av = myAvatar();
    head.innerHTML = (av ? '<img class="cond-logo" src="' + esc(av) + '" alt="">'
      : '<span class="cond-logo mine-avatar">' + SogIcon("user", 22) + '</span>') +
      '<span class="cond-name">' + esc(entry.name || "همدردی شما") + '</span>' +
      (entry.donated || iDonated() ? DONOR_BADGE : "") +
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
      var gone = function () { SogStore.setMyCondolence(id, null); toast("همدردی شما حذف شد."); render(d); };
      if (DB && entry.db_id && entry.token) {
        del.disabled = true;
        DB.rpc("delete_condolence", { p_id: entry.db_id, p_token: entry.token }).then(gone)
          .catch(function () { del.disabled = false; toast("حذف نشد؛ اتصال اینترنت را بررسی کنید."); });
      } else gone();
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

    var close = el("button", "report-close", SogIcon("close", 22));
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
    /* نام از حساب کاربری پر می‌شود و قابل ویرایش است */
    var profileName = "";
    try { profileName = String(((window.SogStore && SogStore.getUser && SogStore.getUser()) || {}).name || "").trim(); } catch (e) {}
    var nameIn = form.querySelector('input[name="name"]');
    if (!editing && profileName) nameIn.value = profileName;

    /* ادارات و شرکت‌ها: ثبت با تأیید کد ملی */
    var kind = editing && editing.kind === "org" ? "org" : "person";
    Array.prototype.forEach.call(form.querySelectorAll(".kind-btn"), function (b) {
      b.addEventListener("click", function () {
        kind = b.getAttribute("data-kind");
        Array.prototype.forEach.call(form.querySelectorAll(".kind-btn"), function (n) { n.classList.remove("is-active"); });
        b.classList.add("is-active");
        form.querySelector(".org-only").hidden = kind !== "org";
        form.querySelector('input[name="name"]').placeholder = kind === "org" ? "نام اداره یا شرکت" : "نام و نام خانوادگی";
        /* نام شخص برای اداره معنی ندارد؛ با برگشت به «شخصی» دوباره پر می‌شود */
        if (kind === "org" && profileName && nameIn.value.trim() === profileName) nameIn.value = "";
        if (kind === "person" && profileName && !nameIn.value.trim()) nameIn.value = profileName;
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
      var entry = {
        name: String(fd.get("name") || "").trim(),
        message: String(fd.get("message") || "").trim(),
        kind: kind,
        melli: kind === "org" ? toEnNum(String(fd.get("melli") || "")).replace(/\D/g, "") : "",
        date: faNum(t.y) + "/" + faNum(t.m < 10 ? "0" + t.m : t.m) + "/" + faNum(t.d < 10 ? "0" + t.d : t.d)
      };
      var finish = function () {
        SogStore.setMyCondolence(id, entry);
        done();
        toast(editing ? "همدردی شما ویرایش شد." : "همدردی شما ثبت شد.");
        render(d);
      };
      if (!DB) { finish(); return; }

      /* با Supabase: برای همه نمایش داده می‌شود؛ رمز ویرایش فقط روی همین دستگاه می‌ماند */
      var sendBtn = form.querySelector('button[type="submit"]');
      sendBtn.disabled = true;
      var args = { p_name: entry.name, p_message: entry.message, p_kind: kind, p_melli: entry.melli || null };
      /* عکس پروفایل یک‌بار بارگذاری می‌شود تا برای همه کنار همدردی دیده شود */
      var av = myAvatar();
      var avUp = !av ? Promise.resolve(null)
        : /^https:/.test(av) ? Promise.resolve(av)
        : (editing && editing.avatar_src === av && editing.avatar_url) ? Promise.resolve(editing.avatar_url)
        : DB.upload(av, "avatars").catch(function () { return null; });
      var call = avUp.then(function (avUrl) {
        args.p_avatar = avUrl;
        entry.avatar_src = av; entry.avatar_url = avUrl;
        return editing && editing.db_id && editing.token
        ? DB.rpc("edit_condolence", Object.assign({ p_id: editing.db_id, p_token: editing.token }, args)).then(function (ok) {
            if (!ok) throw new Error("not found");
            entry.db_id = editing.db_id; entry.token = editing.token;
          })
        : DB.rpc("add_condolence", Object.assign({ p_listing: String(id) }, args)).then(function (rows) {
            var r = rows && rows[0];
            if (!r) throw new Error("no id");
            entry.db_id = r.id; entry.token = r.owner_token;
          });
      });
      call.then(function () {
        if (!iDonated()) return;
        entry.donated = true;
        return DB.rpc("mark_condolence_donated", { p_id: entry.db_id, p_token: entry.token }).catch(function () {});
      }).then(finish).catch(function (err) {
        console.error(err);
        sendBtn.disabled = false;
        toast("ثبت نشد؛ اتصال اینترنت را بررسی کنید و دوباره بفرستید.");
      });
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

    /* فهرست در یک کادر، مثل کادر «فعالیت‌های من» در پروفایل */
    var box = el("div", "cond-box");
    var shown = 0;
    var st = adminSet();
    /* اول ۵ تا، سپس با هر «دیدن همدردی‌های بیشتر» ۷، بعد ۱۲، و از آن به بعد ۱۵ تا ۱۵ تا (از تنظیمات پنل) */
    var PAGES = String(st.condPages || "5,7,12,15").replace(/[۰-۹]/g, function (x) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(x); })
      .split(/[^0-9]+/).map(Number).filter(function (n) { return n > 0; });
    if (!PAGES.length) PAGES = [5, 7, 12, 15];
    var clicks = 0;
    function showMore(n) {
      list.slice(shown, shown + n).forEach(function (cd) { box.appendChild(condolenceItem(cd, d, isOwner)); });
      shown = Math.min(list.length, shown + n);
      if (shown >= list.length && more.parentNode) more.remove();
    }
    var more = el("button", "cond-more", "<span>دیدن همدردی‌های بیشتر</span>" + ICON.chevron);
    more.type = "button";
    more.addEventListener("click", function () {
      clicks++;
      showMore(PAGES[Math.min(clicks, PAGES.length - 1)]);
    });
    if (list.length) inner.appendChild(box);
    if (list.length > PAGES[0]) inner.appendChild(more);
    showMore(PAGES[0]);

    var actions = el("div", "cond-actions");
    var reg = el("div", "cond-action");
    var rb = el("button", "ca-btn is-primary", ICON.plus);
    rb.type = "button";
    rb.setAttribute("aria-label", "ثبت همدردی");
    rb.addEventListener("click", function () { openCondolenceSheet(d); });
    reg.appendChild(rb); reg.appendChild(el("span", null, "ثبت همدردی"));
    actions.appendChild(reg);
    if (!LATER.candle) actions.appendChild(candleAction(d));
    inner.appendChild(actions);

    return accordion("همدردی با خانواده سوگوار", inner, { open: true });
  }
  /* شمع مجازی / صلوات‌شمار — فعلاً نمایش داده نمی‌شود (LATER.candle) */
  function candleAction(d) {
    var baseCount = parseInt(toEnNum(d.condolence_count || "0").replace(/\D/g, ""), 10) || 0;
    var cnt = el("div", "cond-action");
    var cb = el("button", "ca-btn candle", ICON.candle);
    var cntLabel = el("span", null, faNum(baseCount + SogStore.getSalavat(id)));
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
    return cnt;
  }

  function condolenceItem(cd, d, isOwner) {
    var item = el("div", "condolence-item");
    var head = el("button", "cond-head");
    head.setAttribute("aria-expanded", "false");
    head.dataset.acc = "cond";
    var logo = '<img class="cond-logo" src="' + esc(cd.logo) + '" alt="">';
    /* همدردی اداریِ تأییدشده نشان می‌گیرد */
    var verified = cd.kind === "org" && cd.verified
      ? '<span class="cond-verified" title="تأییدشده">' + SogIcon("check", 11) + '</span>'
      : "";
    head.innerHTML = logo + '<span class="cond-name">' + esc(cd.name) + verified + '</span>' + (cd.donated ? DONOR_BADGE : "") + ICON.chevron;
    var body = el("div", "cond-body");
    var inner = el("div");
    var msg = el("div", "cond-message", "<p>" + fmtDesc(cd.message) + "</p>");

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
    /* هر همدردی قابل گزارش است؛ گزارش به ثبت‌کننده‌ی همان همدردی می‌رود */
    var rep = el("button", "mine-btn cond-report", ICON.report + " گزارش");
    rep.type = "button";
    rep.setAttribute("aria-label", "گزارش همدردی");
    rep.addEventListener("click", function (e) { e.stopPropagation(); openReportSheet(d, cd); });
    tools.appendChild(rep);
    /* تاریخ هم‌ردیفِ دکمه‌ی گزارش، سمت چپ */
    tools.appendChild(el("time", "cond-date", esc(cd.date)));
    msg.appendChild(tools);

    inner.appendChild(msg);
    body.appendChild(inner);
    item.appendChild(head); item.appendChild(body);
    return item;
  }

  /* ---------- اشتراک‌گذاری کارت زیبا (تصویر) ---------- */
  function fitText(ctx, text, maxW, baseSize) {
    var size = baseSize;
    do { ctx.font = "700 " + size + "px IRANSansX, Tahoma"; size -= 2; }
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
    do { x.font = "700 " + size + "px IRANSansX, Tahoma"; size -= 2; }
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
    /* اطلاعیه‌ی سوگ فوری هنوز مراسمی ندارد */
    var lst = ALL_LISTINGS.filter(function (x) { return String(x.id) === String(d.id != null ? d.id : id); })[0];
    if (lst && (lst.is_notice || !(lst.ceremony_labels && lst.ceremony_labels.length))) return "اطلاعیه درگذشت";
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
    x.fillStyle = "#d99a5b"; x.font = "700 46px IRANSansX, Tahoma"; x.fillText("سوگ", W / 2, 150);
    // تصویر متوفی (به‌جای شمع)
    drawPortrait(x, portrait, W / 2, 420, 190);
    // کادر نوع مراسم (به‌جای «به یادِ»)
    drawCeremonyBadge(x, ceremonyLabel(d), W / 2, 690);
    // نام
    x.fillStyle = "#f4f4f4"; fitText(x, d.deceased_name, W - 200, 82); x.fillText(d.deceased_name, W / 2, 800);
    // زیرعنوان
    if (d.subtitle) { x.fillStyle = "#bdbdbd"; x.font = "400 40px IRANSansX, Tahoma"; x.fillText(d.subtitle, W / 2, 866); }
    // خط
    x.strokeStyle = "#333"; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 160, 920); x.lineTo(W / 2 + 160, 920); x.stroke();
    // تاریخ‌ها
    x.fillStyle = "#d9d9d9"; x.font = "400 44px IRANSansX, Tahoma";
    var line = "";
    if (d.birth && d.birth.date) line += d.birth.date;
    if (d.death && d.death.date) line += (line ? "  —  " : "") + d.death.date;
    if (line) x.fillText(line, W / 2, 988);
    // شهر
    var city = (d.death && d.death.place) || deceasedCity || "";
    if (city) { x.fillStyle = "#9a9a9a"; x.font = "400 38px IRANSansX, Tahoma"; x.fillText(city, W / 2, 1050); }
    // طایفه‌ی پدری و مادری (زیر شهر)
    var tribes = tribesLine(d);
    if (tribes) { x.fillStyle = "#8c7a5e"; x.font = "400 34px IRANSansX, Tahoma"; x.fillText(tribes, W / 2, 1110); }
    // پاورقی
    x.fillStyle = "#7a6a4f"; x.font = "400 34px IRANSansX, Tahoma"; x.fillText("مشاهده‌ی آگهی و مراسم‌ها در سایت سوگ", W / 2, H - 110);
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

  /* استوری سپاسگزاری: کارت تیره با تصویر و نام در بالا، متن تشکر، امضا و
     نوار «اطلاعات بیشتر در سایت سوگ» در پایین.
     ارتفاع کارت به اندازه‌ی متن است و کل گروه در قاب استوری وسط می‌نشیند. */
  function makeAckStory(d, ack, portrait, logo) {
    var W = 1080, H = 1920, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;
    x.direction = "rtl";

    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(W / 2, 420, 80, W / 2, 420, 950);
    glow.addColorStop(0, "rgba(217,154,91,.07)"); glow.addColorStop(1, "rgba(217,154,91,0)");
    x.fillStyle = glow; x.fillRect(0, 0, W, H);

    var CX = 56, CW = W - CX * 2, PAD = 52, innerW = CW - PAD * 2;
    var PH = 230, HEAD_GAP = 110, SIGN_GAP = 130;
    var FOOT_H = 132, FOOT_GAP = 30, MARGIN = 110;

    /* ۱) اندازه‌ی متن را طوری انتخاب می‌کنیم که گروه در ارتفاع قاب جا شود */
    /* هر خطِ نوشته‌شده جدا می‌ماند؛ خط خالی یعنی فاصله‌ی بین پاراگراف‌ها */
    var paras = String(ack && ack.text ? ack.text : "").replace(/^\s+|\s+$/g, "").split("\n")
      .map(function (t) { return t.trim(); });
    var roomForCard = H - MARGIN * 2 - FOOT_H - FOOT_GAP;
    var fixed = PAD + PH + HEAD_GAP + SIGN_GAP + 24 + PAD;   /* همه‌چیز جز خود متن */

    var size = 42, lineH, gap, textH;
    while (true) {
      x.font = "400 " + size + "px IRANSansX, Tahoma";
      lineH = Math.round(size * 1.75);
      gap = lineH;   /* خط خالی = یک سطر فاصله */
      textH = paras.reduce(function (sum, t) {
        return sum + (t ? measureWrapped(x, t, innerW, lineH) : gap);
      }, 0);
      if (textH < 0) textH = 0;
      if (fixed + textH <= roomForCard || size <= 22) break;
      size -= 2;
    }

    var CH = fixed + textH;
    var groupH = CH + FOOT_GAP + FOOT_H;
    var CY = Math.round((H - groupH) / 2);

    /* ۲) کارت */
    roundPath(x, CX, CY, CW, CH, 40);
    x.fillStyle = "#121212"; x.fill();
    x.strokeStyle = "rgba(255,255,255,.16)"; x.lineWidth = 3; x.stroke();

    var right = CX + CW - PAD, left = CX + PAD;

    /* سربرگ: تصویر سمت چپ، برچسب و نام سمت راست */
    var phTop = CY + PAD;
    drawFramedPhoto(x, portrait, left, phTop, PH, PH, 22);

    /* برچسب «سپاسگزاری» داخل کادر گرد نارنجیِ تیره */
    x.textAlign = "right";
    x.font = "700 36px IRANSansX, Tahoma";
    var bw = x.measureText("سپاسگزاری").width + 56, bh = 64, bTop = phTop + 30;
    roundPath(x, right - bw, bTop, bw, bh, 14);
    x.fillStyle = "#33241a"; x.fill();
    x.fillStyle = "#f07d1f";
    x.fillText("سپاسگزاری", right - 28, bTop + 44);

    /* «شادروان» در خط اول و نام در خط دوم */
    x.fillStyle = "#f4f4f4";
    var nameSize = 50;
    do { x.font = "700 " + nameSize + "px IRANSansX, Tahoma"; nameSize -= 2; }
    while (x.measureText(d.deceased_name).width > innerW - PH - 40 && nameSize > 30);
    x.fillText("شادروان", right - 12, bTop + bh + 76);
    x.fillText(d.deceased_name, right - 12, bTop + bh + 76 + Math.round(nameSize * 1.5));

    /* ۳) متن */
    x.fillStyle = "#dcdcdc";
    x.font = "400 " + size + "px IRANSansX, Tahoma";
    var y = phTop + PH + HEAD_GAP + lineH;
    /* متن وسط‌چین، با همان شکستن خط‌هایی که خانواده نوشته است */
    x.textAlign = "center";
    paras.forEach(function (t) {
      if (!t) { y += gap; return; }
      wrapLines(x, t, innerW).forEach(function (ln) { x.fillText(ln, CX + CW / 2, y); y += lineH; });
    });

    /* ۴) امضا و تاریخ کنار هم، وسط کارت */
    var signY = phTop + PH + HEAD_GAP + textH + SIGN_GAP;
    var sign = [ack && ack.signature, ack && ack.date].filter(Boolean).join("     ");
    if (sign) {
      x.textAlign = "center";
      x.fillStyle = "#e6e6e6"; x.font = "400 36px IRANSansX, Tahoma";
      x.fillText(sign, CX + CW / 2, signY);
    }

    /* ۵) نوار پایین: لوگو، متن و فلش */
    var fy = CY + CH + FOOT_GAP;
    roundPath(x, CX, fy, CW, FOOT_H, 34);
    x.fillStyle = "#151515"; x.fill();
    x.strokeStyle = "rgba(255,255,255,.08)"; x.lineWidth = 2; x.stroke();

    if (logo) {
      var LS = 84, lx = CX + 30, ly = fy + (FOOT_H - LS) / 2;
      roundPath(x, lx, ly, LS, LS, 18);
      x.save(); x.clip();
      x.fillStyle = "#fff"; x.fillRect(lx, ly, LS, LS);
      x.drawImage(logo, lx + 4, ly + 4, LS - 8, LS - 8);
      x.restore();
    }

    /* متن وسط نوار و فلش دقیقاً کنارش، تا روی هم نیفتند */
    var label = "اطلاعات بیشتر در سایت سوگ";
    x.font = "700 38px IRANSansX, Tahoma";
    var tw = x.measureText(label).width;
    var cxLabel = CX + CW / 2 + 40;
    x.textAlign = "center";
    x.fillStyle = "#e8e8e8";
    x.fillText(label, cxLabel, fy + FOOT_H / 2 + 14);

    var ax = cxLabel - tw / 2 - 46, ay = fy + FOOT_H / 2;
    x.strokeStyle = "#9a9a9a"; x.lineWidth = 4;
    x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.moveTo(ax - 16, ay - 8); x.lineTo(ax, ay + 10); x.lineTo(ax + 16, ay - 8); x.stroke();

    x.textAlign = "center";
    return x.canvas;
  }

  /* متن راست‌چینِ دوطرفه‌چین: فاصله‌ی بین کلمات کشیده می‌شود تا هر سطر
     (جز سطر آخر) هر دو لبه را پر کند. */
  function drawJustified(ctx, text, right, y, maxW, lineH) {
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], line = [];
    words.forEach(function (w) {
      var test = line.concat(w).join(" ");
      if (ctx.measureText(test).width > maxW && line.length) { lines.push(line); line = [w]; }
      else line.push(w);
    });
    if (line.length) lines.push(line);

    var space = ctx.measureText(" ").width;
    lines.forEach(function (ws, i) {
      var ly = y + i * lineH;
      var last = i === lines.length - 1;
      if (last || ws.length < 2) { ctx.textAlign = "right"; ctx.fillText(ws.join(" "), right, ly); return; }
      var wordsW = ws.reduce(function (sum, w) { return sum + ctx.measureText(w).width; }, 0);
      var extra = (maxW - wordsW) / (ws.length - 1);
      if (extra < space) extra = space;          /* هرگز از فاصله‌ی عادی کمتر نشود */
      ctx.textAlign = "right";
      var cursor = right;
      ws.forEach(function (w) {
        ctx.fillText(w, cursor, ly);
        cursor -= ctx.measureText(w).width + extra;
      });
    });
    ctx.textAlign = "right";
  }

  /* متن را به سطرهایی که در عرض جا می‌شوند می‌شکند */
  function wrapLines(ctx, text, maxW) {
    var words = String(text).split(/\s+/).filter(Boolean), lines = [], line = "";
    words.forEach(function (w) {
      var test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; }
      else line = test;
    });
    if (line) lines.push(line);
    return lines;
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
    return parts.join("   |   ");
  }

  /* مسیر مستطیل گِرد */
  function roundPath(x, left, top, w, h, r) {
    x.beginPath();
    x.moveTo(left + r, top);
    x.arcTo(left + w, top, left + w, top + h, r);
    x.arcTo(left + w, top + h, left, top + h, r);
    x.arcTo(left, top + h, left, top, r);
    x.arcTo(left, top, left + w, top, r);
    x.closePath();
  }

  /* تصویر متوفی در قاب مستطیلِ گِرد (cover) */
  function drawFramedPhoto(x, img, left, top, w, h, r) {
    x.save();
    roundPath(x, left, top, w, h, r); x.clip();
    x.fillStyle = "#151515"; x.fillRect(left, top, w, h);
    if (img) {
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      var scale = Math.max(w / iw, h / ih);
      var dw = iw * scale, dh = ih * scale;
      x.drawImage(img, left + (w - dw) / 2, top + (h - dh) / 2, dw, dh);
    }
    x.restore();
  }

  /* کادر گِرد با متن وسط‌چین (نوع مراسم / پدر و طایفه) */
  function drawOutlinePill(x, label, cx, cy, opt) {
    opt = opt || {};
    var size = opt.size || 42, maxW = (opt.maxW || x.canvas.width - 300);
    do { x.font = "700 " + size + "px IRANSansX, Tahoma"; size -= 2; }
    while (x.measureText(label).width > maxW && size > 24);
    var w = x.measureText(label).width + (opt.padX || 80), h = opt.h || 86, r = h / 2;
    roundPath(x, cx - w / 2, cy - h / 2, w, h, r);
    x.fillStyle = opt.fill || "rgba(255,255,255,.04)"; x.fill();
    x.strokeStyle = opt.stroke || "rgba(255,255,255,.22)"; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = opt.color || "#f2f2f2";
    x.textBaseline = "middle";
    x.fillText(label, cx, cy + 2);
    x.textBaseline = "alphabetic";
  }

  /* شکستن نام به حداکثر دو سطر */
  function wrapName(x, text, maxW) {
    if (x.measureText(text).width <= maxW) return [text];
    var words = String(text).split(" "), line = "", out = [];
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (x.measureText(t).width > maxW && line) { out.push(line); line = w; }
      else line = t;
    });
    if (line) out.push(line);
    return out.slice(0, 2);
  }

  function makeStory(d, portrait, logo) {
    var W = 1080, H = 1920, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;

    /* پس‌زمینه‌ی تمام‌مشکی */
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);

    x.direction = "rtl"; x.textAlign = "center";

    /* کارت اصلی */
    var cardL = 64, cardT = 70, cardW = W - 128, cardH = 1560;
    roundPath(x, cardL, cardT, cardW, cardH, 60);
    x.fillStyle = "#070707"; x.fill();
    x.strokeStyle = "rgba(255,255,255,.14)"; x.lineWidth = 3; x.stroke();

    /* تصویر متوفی */
    var phL = cardL + 56, phT = cardT + 50, phW = cardW - 112, phH = 980;
    drawFramedPhoto(x, portrait, phL, phT, phW, phH, 46);

    var y = phT + phH + 96;

    /* نوع مراسم */
    var cl = ceremonyLabel(d);
    if (cl) { drawOutlinePill(x, cl, W / 2, y, { size: 42, maxW: cardW - 180 }); y += 120; }

    /* نام و نام خانوادگی (حداکثر دو سطر) */
    x.fillStyle = "#ffffff";
    fitText(x, d.deceased_name, cardW - 150, 88);
    var lines = wrapName(x, d.deceased_name, cardW - 150);
    lines.forEach(function (ln, i) { x.fillText(ln, W / 2, y + 30 + i * 104); });
    y += 30 + (lines.length - 1) * 104;

    /* شرح کوتاه */
    if (d.subtitle) {
      x.fillStyle = "#9a9a9a"; x.font = "400 42px IRANSansX, Tahoma";
      x.fillText(d.subtitle, W / 2, y + 86);
      y += 86;
    }

    /* پدر و طایفه */
    var fl = fatherLine(d);
    if (fl) drawOutlinePill(x, fl, W / 2, y + 116, { size: 38, maxW: cardW - 180, h: 82 });

    /* نوار پایانی: اطلاعات بیشتر در سایت سوگ */
    var barW = 720, barH = 104, barL = (W - barW) / 2, barT = cardT + cardH + 60;
    roundPath(x, barL, barT, barW, barH, 32);
    x.fillStyle = "#1a1a1a"; x.fill();
    x.strokeStyle = "rgba(255,255,255,.10)"; x.lineWidth = 2; x.stroke();
    x.fillStyle = "#ffffff"; x.font = "700 44px IRANSansX, Tahoma";
    x.textBaseline = "middle";
    x.fillText("اطلاعات بیشتر در سایت سوگ", W / 2 + 34, barT + barH / 2 + 2);
    x.textBaseline = "alphabetic";

    /* فلش رو به پایین سمت چپ متن */
    var ax = barL + 84, ay = barT + barH / 2 - 8;
    x.strokeStyle = "#ffffff"; x.lineWidth = 6; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.moveTo(ax - 22, ay - 6); x.lineTo(ax, ay + 18); x.lineTo(ax + 22, ay - 6); x.stroke();

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

          var close = el("button", "story-close", SogIcon("close", 22));
          close.type = "button"; close.setAttribute("aria-label", "بستن");

          var img = el("img", "story-img"); img.src = url; img.alt = "استوری " + d.deceased_name;
          var hint = el("p", "story-hint", "ابعاد ۱۰۸۰×۱۹۲۰ — مناسب استوری اینستاگرام و واتساپ");

          var actions = el("div", "story-actions");
          var save = el("a", "btn-primary", "ذخیره‌ی تصویر");
          save.href = url; save.download = fileName;
          var share = el("button", "btn-ghost", "استوری"); share.type = "button";
          share.addEventListener("click", function () {
            var file = new File([blob], fileName, { type: "image/png" });
            var payload = { title: d.deceased_name, text: "آگهی ترحیم " + d.deceased_name + " — سایت سوگ", url: location.href };
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
        document.fonts.load("700 92px IRANSansX"),
        document.fonts.load("400 44px IRANSansX")
      ]).then(run).catch(run);
    } else run();
  }

  function shareCard(d) {
    var run = function () {
      loadPortrait(d).then(function (portrait) {
      var canvas = makeCard(d, portrait);
      canvas.toBlob(function (blob) {
        var file = new File([blob], "sog-" + d.deceased_name + ".png", { type: "image/png" });
        var payload = { title: d.deceased_name, text: "به یادِ " + d.deceased_name + " — سایت سوگ", url: location.href };
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
      Promise.all([document.fonts.load("700 82px IRANSansX"), document.fonts.load("400 44px IRANSansX")]).then(run).catch(run);
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
    var st = adminSet();
    var a = el("a", "needs-banner", "<b>" + esc(st.needsTitle || "نیازمندی‌های مراسمات") + "</b><small>" +
      esc(st.needsSub || "چاپ بنر، تاج گل، سنگ مزار و کلیه خدمات مرتبط") + "</small>");
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
