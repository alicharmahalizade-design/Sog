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
    qr: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="currentColor"/></svg>',
    pen: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
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
  var BUSINESSES = [];
  var deceasedCitySlug = null, deceasedCity = null;

  Promise.all([
    fetch("data/details.json").then(function (r) { return r.json(); }),
    fetch("data/listings.json").then(function (r) { return r.json(); }).catch(function () { return { listings: [] }; }),
    fetch("data/businesses.json").then(function (r) { return r.json(); }).catch(function () { return { businesses: [] }; }),
    new Promise(function (r) { setTimeout(r, 450); })
  ]).then(function (res) {
    var details = res[0] || {};
    var listings = (res[1] && res[1].listings) || [];
    BUSINESSES = (res[2] && res[2].businesses) || [];
    var lst = listings.filter(function (x) { return String(x.id) === String(id); })[0];
    if (lst) { deceasedCitySlug = lst.city_slug; deceasedCity = lst.city; }
    var d = details[id];
    if (!d) d = fallbackFromListing(listings, id);
    render(d);
  }).catch(function (e) {
    root.innerHTML = '<p style="color:#c66;text-align:center;padding:40px">خطا در بارگذاری جزئیات.</p>';
    console.error(e);
  });

  function fallbackFromListing(listings, id) {
    var l = listings.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!l) return { deceased_name: "آگهی یافت نشد", subtitle: "", photos: [], ceremonies: [], anniversaries: [], contacts: [], condolences: [] };
    return {
      id: l.id, deceased_name: l.deceased_name, subtitle: l.location || l.city,
      photos: [l.photo], birth: null, death: null, family: null,
      ceremonies: [], anniversaries: [], contacts: [], condolences: [],
      _minimal: true
    };
  }

  skeleton();

  /* ---------- رندر اصلی ---------- */
  function render(d) {
    root.classList.remove("detail-skeleton");
    root.innerHTML = "";
    currentName = d.deceased_name;
    document.title = d.deceased_name + " | سوگ";

    root.appendChild(hero(d));
    if (d.birth || d.death || d.age) root.appendChild(infoBox(d));
    if (d.family) root.appendChild(familyGrid(d.family));
    root.appendChild(actionRow(d));
    root.appendChild(reportError());

    if (d.biography) root.appendChild(bioAccordion(d.biography));
    (d.ceremonies || []).forEach(function (c) { root.appendChild(eventAccordion(c)); });
    if (d.acknowledgment) root.appendChild(ackAccordion(d.acknowledgment));
    if (d.chehelom) root.appendChild(eventAccordion(d.chehelom));
    (d.anniversaries || []).forEach(function (a) { root.appendChild(anniversaryAccordion(a)); });

    if ((d.contacts || []).length) {
      root.appendChild(el("h2", "section-title", "ارتباط با خانواده سوگوار"));
      root.appendChild(contactRow(d.contacts));
    }
    if ((d.condolences || []).length) root.appendChild(condolenceSection(d));

    root.appendChild(guestbookAccordion());

    var qr = qrSection();
    if (qr) root.appendChild(qr);

    var suggest = smartSuggest();
    if (suggest) root.appendChild(suggest);

    root.appendChild(needsBanner());
    bindAccordions();
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
    top.appendChild(el("a", "logo", '<img src="assets/img/logo.svg" alt="سوگ">'));
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
  function familyGrid(f) {
    var grid = el("div", "family-grid");
    grid.appendChild(familyCard([["پدر", f.father.name], ["طایفه", f.father.tayefe], ["ایل", f.father.il]]));
    grid.appendChild(familyCard([["مادر", f.mother.name], ["طایفه", f.mother.tayefe], ["ایل", f.mother.il]]));
    return grid;
  }
  function familyCard(rows) {
    var card = el("div", "family-card");
    rows.forEach(function (r) {
      var row = el("div", "family-row");
      row.appendChild(el("span", "lbl", r[0]));
      row.appendChild(el("span", "val", esc(r[1])));
      card.appendChild(row);
    });
    return card;
  }

  /* ---------- دکمه‌های عمل ---------- */
  function actionRow(d) {
    var row = el("div", "action-row");
    row.appendChild(actionItem(ICON.share, "اشتراک", function () { shareCard(d); }));
    if (d.photos && d.photos.length) row.appendChild(actionItem(ICON.story, "استوری", function () { alert("نمایش استوری (نمونه)."); }));
    if (d.has_audio) {
      var soundBtn = actionItem(ICON.sound, "صدا", null);
      var on = true, b = soundBtn.querySelector("button");
      b.classList.add("is-active");
      b.addEventListener("click", function () { on = !on; b.innerHTML = on ? ICON.sound : ICON.soundOff; b.classList.toggle("is-active", on); });
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
  function actionItem(icon, label, onClick) {
    var item = el("div", "action-item");
    var b = el("button", null, icon); b.setAttribute("aria-label", label);
    if (onClick) b.addEventListener("click", onClick);
    item.appendChild(b); item.appendChild(el("span", null, label));
    return item;
  }
  function reportError() {
    var b = el("button", "report-error", ICON.report + " گزارش خطا");
    b.addEventListener("click", function () { alert("ثبت گزارش خطا (نمونه)."); });
    return b;
  }

  /* ---------- آکاردیون پایه ---------- */
  function accordion(title, bodyNode, opts) {
    opts = opts || {};
    var acc = el("section", "accordion" + (opts.open ? " is-open" : "") + (opts.empty ? " acc-empty" : ""));
    var head = el("button", "acc-head");
    head.setAttribute("aria-expanded", opts.open ? "true" : "false");
    head.innerHTML = "<span>" + esc(title) + "</span>" + ICON.chevron;
    var body = el("div", "acc-body");
    var inner = el("div", "acc-inner");
    inner.appendChild(bodyNode);
    body.appendChild(inner);
    acc.appendChild(head); acc.appendChild(body);
    return acc;
  }

  /* ---------- زندگی‌نامه ---------- */
  function bioAccordion(bio) {
    var wrap = el("div");
    wrap.appendChild(el("p", "bio-text", fmtDesc(bio.text)));
    if (bio.gallery && bio.gallery.length) {
      var g = el("div", "bio-gallery");
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
    return accordion("زندگی‌نامه", wrap, { open: true });
  }

  /* ---------- بلوک رویداد ---------- */
  function eventBody(c) {
    var wrap = el("div");
    if (c.date) {
      var dl = el("div", "event-line");
      dl.innerHTML = '<span class="ev-ico">' + ICON.clock + '</span><span class="ev-lbl">زمان :</span> <span>' + esc(c.date) + '</span>';
      wrap.appendChild(dl);
    }
    if (c.time_from || c.time_to) {
      var tp = el("div", "time-pills");
      if (c.time_to) tp.appendChild(el("span", "pill", esc(c.time_to)));
      tp.appendChild(el("span", "to", "تا"));
      if (c.time_from) tp.appendChild(el("span", "pill", esc(c.time_from)));
      wrap.appendChild(tp);
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
    if (c.gallery && c.gallery.length) {
      wrap.appendChild(el("h3", "gallery-title", "تصاویر مراسم " + esc(c.title || "")));
      var hs = el("div", "hscroll");
      c.gallery.forEach(function (src) { var t = el("div", "thumb"); t.style.backgroundImage = 'url("' + src + '")'; hs.appendChild(t); });
      wrap.appendChild(hs);
    }
    return wrap;
  }
  function eventAccordion(c) { return accordion(c.title, eventBody(c), { open: !!c.expanded }); }

  function anniversaryAccordion(a) {
    if (a.empty) {
      return accordion("سالگرد " + a.year, el("div", null, "اطلاعاتی برای این سالگرد ثبت نشده است."), { open: false, empty: true });
    }
    var c = Object.assign({}, a, { title: "سالگرد " + a.year });
    return accordion("سالگرد " + a.year, eventBody(c), { open: !!a.expanded });
  }

  /* ---------- سپاسگزاری ---------- */
  function ackAccordion(ack) {
    var wrap = el("div");
    wrap.appendChild(el("p", "ack-text", fmtDesc(ack.text)));
    var foot = el("div", "ack-foot");
    if (ack.has_story) {
      var st = el("div", "ack-story");
      var b = el("button", null, ICON.story); b.addEventListener("click", function () { alert("نمایش استوری (نمونه)."); });
      st.appendChild(b); st.appendChild(el("span", null, "استوری"));
      foot.appendChild(st);
    } else { foot.appendChild(el("div")); }
    foot.appendChild(el("div", "ack-sign", esc(ack.signature) + "<br>" + esc(ack.date)));
    wrap.appendChild(foot);
    return accordion("سپاسگزاری", wrap, { open: false });
  }

  /* ---------- ارتباط ---------- */
  function contactRow(contacts) {
    var row = el("div", "contact-row");
    contacts.forEach(function (c) {
      var item = el("div", "contact-item");
      var b = el("button", "c-btn", ICON[c.type] || ICON.call);
      var glyph = b.querySelector("svg"); if (glyph) glyph.classList.add("c-" + c.type);
      b.addEventListener("click", function () { alert(c.label + " (نمونه)."); });
      item.appendChild(b); item.appendChild(el("span", null, esc(c.label)));
      row.appendChild(item);
    });
    return row;
  }

  /* ---------- همدردی ---------- */
  function condolenceSection(d) {
    var wrap = el("div");
    var inner = el("div");
    var visible = d.condolences.slice(0, 5);
    visible.forEach(function (cd) { inner.appendChild(condolenceItem(cd)); });

    if (d.condolences.length > 5) {
      var more = el("button", "cond-more", "مشاهده بیشتر ▾");
      var expanded = false;
      more.addEventListener("click", function () {
        expanded = !expanded;
        if (expanded) { d.condolences.slice(5).forEach(function (cd) { inner.insertBefore(condolenceItem(cd), more); }); more.textContent = "بستن ▴"; }
        else { location.reload(); }
      });
      inner.appendChild(more);
    }

    var actions = el("div", "cond-actions");
    var reg = el("div", "cond-action");
    var rb = el("button", "ca-btn", ICON.plus); rb.addEventListener("click", function () { alert("ثبت همدردی (نمونه)."); });
    reg.appendChild(rb); reg.appendChild(el("span", null, "ثبت همدردی"));

    // شمع مجازی / صلوات‌شمار تعاملی
    var baseCount = parseInt(toEnNum(d.condolence_count || "0").replace(/\D/g, ""), 10) || 0;
    var cnt = el("div", "cond-action");
    var cb = el("button", "ca-btn candle", ICON.candle);
    var cntLabel = el("span", null, faNum(baseCount + SogStore.getSalavat(id)));
    cb.setAttribute("aria-label", "روشن‌کردن شمع / صلوات");
    cb.addEventListener("click", function () {
      var mine = SogStore.addSalavat(id);
      cntLabel.textContent = faNum(baseCount + mine);
      cb.classList.remove("lit"); void cb.offsetWidth; cb.classList.add("lit");
    });
    cnt.appendChild(cb); cnt.appendChild(cntLabel);
    actions.appendChild(reg); actions.appendChild(cnt);
    inner.appendChild(actions);
    inner.appendChild(el("p", "candle-hint", "روی شمع بزنید تا به یادش شمعی روشن کنید 🕯️"));

    var acc = accordion("همدردی با خانواده سوگوار", inner, { open: true });
    return acc;
  }
  function condolenceItem(cd) {
    var item = el("div", "condolence-item" + (cd.expanded ? " is-open" : ""));
    var head = el("button", "cond-head");
    head.setAttribute("aria-expanded", cd.expanded ? "true" : "false");
    head.dataset.acc = "cond";
    var logo = '<img class="cond-logo" src="' + esc(cd.logo) + '" alt="">';
    head.innerHTML = logo + '<span class="cond-name">' + esc(cd.name) + '</span>' + ICON.chevron;
    var body = el("div", "cond-body");
    var inner = el("div");
    var msg = el("div", "cond-message", "<p>" + fmtDesc(cd.message) + "</p><time>" + esc(cd.date) + "</time>");
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
  function candleOn(x, cx, cy) {
    var rg = x.createRadialGradient(cx, cy - 40, 0, cx, cy - 40, 200);
    rg.addColorStop(0, "rgba(255,180,80,.55)"); rg.addColorStop(1, "rgba(255,160,60,0)");
    x.fillStyle = rg; x.beginPath(); x.arc(cx, cy - 40, 200, 0, 7); x.fill();
    x.fillStyle = "#e6d8bc"; x.fillRect(cx - 26, cy, 52, 150); // بدنه شمع
    x.fillStyle = "#5a4a2c"; x.fillRect(cx - 3, cy - 26, 6, 26); // فتیله
    var fg = x.createLinearGradient(cx, cy - 90, cx, cy - 26);
    fg.addColorStop(0, "#fff3c4"); fg.addColorStop(.5, "#ffb43d"); fg.addColorStop(1, "#ff6a00");
    x.fillStyle = fg; x.beginPath();
    x.moveTo(cx, cy - 96); x.quadraticCurveTo(cx + 24, cy - 60, cx, cy - 26); x.quadraticCurveTo(cx - 24, cy - 60, cx, cy - 96); x.fill();
  }
  function makeCard(d) {
    var W = 1080, H = 1350, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#181410"); g.addColorStop(1, "#0a0a0a");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    // قاب
    x.strokeStyle = "rgba(217,154,91,.35)"; x.lineWidth = 3; x.strokeRect(40, 40, W - 80, H - 80);
    x.direction = "rtl"; x.textAlign = "center";
    // برند
    x.fillStyle = "#d99a5b"; x.font = "700 46px Vazirmatn, Tahoma"; x.fillText("سوگ", W / 2, 150);
    // شمع
    candleOn(x, W / 2, 360);
    // به یاد
    x.fillStyle = "#9a9a9a"; x.font = "400 42px Vazirmatn, Tahoma"; x.fillText("به یادِ", W / 2, 640);
    // نام
    x.fillStyle = "#f4f4f4"; fitText(x, d.deceased_name, W - 200, 82); x.fillText(d.deceased_name, W / 2, 740);
    // زیرعنوان
    if (d.subtitle) { x.fillStyle = "#bdbdbd"; x.font = "400 40px Vazirmatn, Tahoma"; x.fillText(d.subtitle, W / 2, 812); }
    // خط
    x.strokeStyle = "#333"; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 160, 872); x.lineTo(W / 2 + 160, 872); x.stroke();
    // تاریخ‌ها
    x.fillStyle = "#d9d9d9"; x.font = "400 44px Vazirmatn, Tahoma";
    var line = "";
    if (d.birth && d.birth.date) line += d.birth.date;
    if (d.death && d.death.date) line += (line ? "  —  " : "") + d.death.date;
    if (line) x.fillText(line, W / 2, 940);
    // شهر
    var city = (d.death && d.death.place) || deceasedCity || "";
    if (city) { x.fillStyle = "#9a9a9a"; x.font = "400 38px Vazirmatn, Tahoma"; x.fillText(city, W / 2, 1004); }
    // پاورقی
    x.fillStyle = "#7a6a4f"; x.font = "400 34px Vazirmatn, Tahoma"; x.fillText("مشاهده‌ی آگهی و مراسم‌ها در اپلیکیشن سوگ", W / 2, H - 110);
    return x.canvas;
  }
  function shareCard(d) {
    var run = function () {
      var canvas = makeCard(d);
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
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load("700 82px Vazirmatn"), document.fonts.load("400 44px Vazirmatn")]).then(run).catch(run);
    } else run();
  }

  /* ---------- پیشنهاد هوشمند کسب‌وکار (بر اساس شهر متوفی) ---------- */
  function smartSuggest() {
    if (!BUSINESSES.length) return null;
    var inCity = BUSINESSES.filter(function (b) { return deceasedCitySlug && b.city_slug === deceasedCitySlug; });
    var pool = inCity.length ? inCity : BUSINESSES;
    // مرتب‌سازی: همکار > تأییدشده > امتیاز
    pool = pool.slice().sort(function (a, b) {
      var pa = a.partner ? 2 : (a.verified ? 1 : 0), pb = b.partner ? 2 : (b.verified ? 1 : 0);
      if (pa !== pb) return pb - pa;
      return parseFloat((b.rating + "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })) -
             parseFloat((a.rating + "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }));
    });
    var picks = pool.slice(0, 3);
    if (!picks.length) return null;

    var wrap = el("section", "smart-suggest");
    var title = inCity.length && deceasedCity ? "خدمات پیشنهادی در " + esc(deceasedCity) : "خدمات پیشنهادی مراسم";
    wrap.appendChild(el("h2", null, title));
    picks.forEach(function (b) {
      var a = document.createElement("a");
      a.className = "suggest-card";
      a.href = "business-detail.html?id=" + b.id;
      var badge = (window.SogUtil && SogUtil.badge) ? SogUtil.badge(b) : "";
      a.innerHTML =
        '<span class="s-logo" style="background-image:url(&quot;' + b.logo + '&quot;)"></span>' +
        '<span class="s-info"><span class="s-name">' + esc(b.name) + ' ' + badge + '</span>' +
        '<span class="s-sub">' + esc(b.category_name) + ' • ' + esc(b.city) + ' • ⭐ ' + esc(b.rating) + '</span></span>' +
        '<span class="s-go"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      wrap.appendChild(a);
    });
    return wrap;
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

  /* ---------- دفتر یادبود دیجیتال ---------- */
  function guestbookAccordion() {
    var wrap = el("div", "guestbook");
    var form = el("form", "gb-form");
    form.innerHTML =
      '<input name="name" type="text" placeholder="نام شما" required>' +
      '<textarea name="msg" rows="2" placeholder="یادبود، خاطره یا پیام تسلیت خود را بنویسید…" required></textarea>' +
      '<button type="submit" class="btn-gb">' + ICON.pen + ' ثبت در دفتر یادبود</button>';
    var list = el("div", "gb-list");
    function paint() {
      list.innerHTML = "";
      var entries = SogStore.getGuestbook(id);
      if (!entries.length) { list.appendChild(el("p", "gb-empty", "هنوز پیامی ثبت نشده؛ اولین نفر باشید.")); return; }
      entries.forEach(function (e) {
        var it = el("div", "gb-item");
        it.innerHTML = '<div class="gb-head"><span class="gb-name">' + esc(e.name) + '</span><span class="gb-date">' + esc(e.date) + '</span></div><p>' + esc(e.msg) + '</p>';
        list.appendChild(it);
      });
    }
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      SogStore.addGuestbook(id, { name: fd.get("name"), msg: fd.get("msg"), date: faToday() });
      form.reset(); paint();
    });
    wrap.appendChild(form); wrap.appendChild(list); paint();
    return accordion("دفتر یادبود", wrap, { open: false });
  }
  function faToday() {
    // تاریخ نمایشی ساده (میلادی به فارسی) — در وردپرس با تاریخ سرور جایگزین می‌شود
    var d = new Date();
    return String(d.getFullYear()) + "/" + pad(d.getMonth() + 1) + "/" + pad(d.getDate());
  }

  /* ---------- QR یادبود سنگ قبر ---------- */
  function qrSection() {
    if (typeof qrcode === "undefined") return null;
    var sec = el("section", "qr-section");
    sec.appendChild(el("h2", "section-title", "یادبود دیجیتال (QR سنگ قبر)"));
    var card = el("div", "qr-card");
    var qr = qrcode(0, "M"); qr.addData(location.href); qr.make();
    var img = qr.createDataURL(6, 12);
    card.innerHTML =
      '<img class="qr-img" src="' + img + '" alt="QR">' +
      '<div class="qr-info"><p>این کد را روی سنگ قبر نصب کنید؛ با اسکن، همین صفحه‌ی یادبود باز می‌شود.</p></div>';
    var dl = el("a", "qr-download", ICON.qr + " دانلود QR");
    dl.href = img; dl.download = "sog-qr-" + id + ".png";
    card.appendChild(dl);
    sec.appendChild(card);
    return sec;
  }

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
