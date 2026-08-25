/* ویزارد ثبت سوگ — مرحله‌ها از روی مراسم‌های انتخاب‌شده ساخته می‌شوند.
   داده‌ی فرم در قالبی جمع می‌شود که مستقیم به REST وردپرس قابل ارسال است. */
(function () {
  "use strict";
  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var MONTHS = SogUtil.jMonths;
  var TODAY = SogUtil.todayJalali();
  function pad2(n) { return faNum(n < 10 ? "0" + n : String(n)); }

  /* مراسم‌های قابل انتخاب — هرکدام می‌تواند بیش از یک نوبت داشته باشد */
  var CEREMONIES = [
    { key: "tashi", name: "تشییع / خاکسپاری", on: true },
    { key: "sevom", name: "سوم" },
    { key: "haftom", name: "هفتم" },
    { key: "sevom-haftom", name: "سوم/هفتم" },
    { key: "khatm", name: "ختم" },
    { key: "sevom-haftom-khatm", name: "سوم/هفتم/ختم" },
    { key: "bozorgdasht", name: "بزرگداشت", on: true },
    { key: "shame-ghariban", name: "شام غریبان" },
    { key: "chehelom", name: "چهلم" },
    { key: "salgard", name: "سالگرد" },
    { key: "shabe-sal", name: "شب سال" }
  ];
  var NOTES = ["به صرف ناهار", "به صرف شام", "به صرف پذیرایی", "به صرف افطار"];
  var MESSENGERS = ["روبیکا", "اینستاگرام", "بله", "واتساپ", "ایتا", "تلگرام"];
  var READY_THANKS = [
    "از تمامی عزیزانی که در این مصیبت ما را تنها نگذاشتند و با حضور یا پیام خود موجب تسلی خاطر خانواده شدند، صمیمانه سپاسگزاریم.",
    "بدین‌وسیله از همه‌ی سروران گرامی که در مراسم تشییع و ترحیم شرکت فرمودند، کمال تشکر و قدردانی را داریم.",
    "از لطف و محبت شما بزرگواران که در این ایام سخت همراه ما بودید، صمیمانه سپاسگزاریم. اجرکم عندالله."
  ];

  /* داده‌ی فرم */
  var data = {
    photos: [null, null, null],      /* اولی تصویر اصلی */
    name: "", brief: "",
    birth: null, death: null, age: "", birthplace: "", city: "",
    father: "", father_tayefe: "", father_il: "",
    mother: "", mother_tayefe: "", mother_il: "",
    picked: {},                      /* key → تعداد نوبت */
    events: {},                      /* key#i → {date,time,address,lat,lng,map_link,desc,notes[],photos[]} */
    bio: "", bio_photos: [], bio_layout: "one", music: null,
    phone: "", messengers: [], messenger_links: {}, relation: "", thanks: ""
  };
  CEREMONIES.forEach(function (c) { if (c.on) data.picked[c.key] = 1; });

  /* ویرایشگر برش: جابه‌جایی با کشیدن، بزرگ‌نمایی با اسلایدر، نسبت ۴:۵ */
  function openCropper(file, onDone) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var back = el("div", "crop-backdrop");
      var modal = el("div", "crop-modal");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "برش تصویر");

      modal.appendChild(el("h3", "crop-title", "برش تصویر"));
      var stage = el("div", "crop-stage");
      var canvas = document.createElement("canvas");
      canvas.className = "crop-canvas";
      stage.appendChild(canvas);
      modal.appendChild(stage);

      var zoomWrap = el("div", "crop-zoom");
      zoomWrap.appendChild(el("span", null, "بزرگ‌نمایی"));
      var zoom = document.createElement("input");
      zoom.type = "range"; zoom.min = "100"; zoom.max = "300"; zoom.value = "100";
      zoomWrap.appendChild(zoom);
      modal.appendChild(zoomWrap);
      modal.appendChild(el("p", "crop-hint", "تصویر را با انگشت جابه‌جا کنید تا کادر دلخواه انتخاب شود."));

      var actions = el("div", "crop-actions");
      var cancel = el("button", "btn-ghost", "بی‌خیال"); cancel.type = "button";
      var ok = el("button", "btn-primary", "برش و تأیید"); ok.type = "button";
      actions.appendChild(cancel); actions.appendChild(ok);
      modal.appendChild(actions);

      document.body.appendChild(back); document.body.appendChild(modal);
      document.body.style.overflow = "hidden";

      /* اندازه‌ی کادر برش با نسبت ۴:۵ */
      var VW = Math.min(320, window.innerWidth - 80), VH = Math.round(VW * 5 / 4);
      canvas.width = VW; canvas.height = VH;
      var ctx = canvas.getContext("2d");

      var minScale = Math.max(VW / img.width, VH / img.height);
      var scale = minScale, ox = 0, oy = 0;   /* ox/oy: جابه‌جایی مرکز تصویر */

      function clamp() {
        var w = img.width * scale, h = img.height * scale;
        var maxX = Math.max(0, (w - VW) / 2), maxY = Math.max(0, (h - VH) / 2);
        ox = Math.max(-maxX, Math.min(maxX, ox));
        oy = Math.max(-maxY, Math.min(maxY, oy));
      }
      function draw() {
        clamp();
        var w = img.width * scale, h = img.height * scale;
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, VW, VH);
        ctx.drawImage(img, (VW - w) / 2 + ox, (VH - h) / 2 + oy, w, h);
      }
      draw();

      zoom.addEventListener("input", function () {
        scale = minScale * (parseInt(zoom.value, 10) / 100);
        draw();
      });

      var dragging = false, lastX = 0, lastY = 0;
      canvas.addEventListener("pointerdown", function (e) {
        dragging = true; lastX = e.clientX; lastY = e.clientY;
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        ox += e.clientX - lastX; oy += e.clientY - lastY;
        lastX = e.clientX; lastY = e.clientY;
        draw();
      });
      ["pointerup", "pointercancel"].forEach(function (ev) {
        canvas.addEventListener(ev, function () { dragging = false; });
      });

      function close() {
        modal.remove(); back.remove();
        document.body.style.overflow = "";
        URL.revokeObjectURL(url);
      }
      cancel.addEventListener("click", close);
      back.addEventListener("click", close);
      ok.addEventListener("click", function () {
        /* خروجی با کیفیت بالاتر (۸۰۰×۱۰۰۰) ساخته می‌شود */
        var out = document.createElement("canvas");
        out.width = 800; out.height = 1000;
        var k = out.width / VW;
        var octx = out.getContext("2d");
        var w = img.width * scale * k, h = img.height * scale * k;
        octx.fillStyle = "#000"; octx.fillRect(0, 0, out.width, out.height);
        octx.drawImage(img, (out.width - w) / 2 + ox * k, (out.height - h) / 2 + oy * k, w, h);
        onDone(out.toDataURL("image/jpeg", 0.9));
        close();
      });
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;
  }

  /* تصاویر زندگی‌نامه: چند عکس با پیش‌نمایش و امکان حذف */
  function bindBioPhotos() {
    var input = document.getElementById("bioPhotoInput");
    var box = document.getElementById("bioThumbs");
    if (!input || !box) return;
    var photos = [];

    function draw() {
      box.innerHTML = "";
      photos.forEach(function (src, i) {
        var th = el("div", "bio-thumb");
        th.style.backgroundImage = 'url("' + src + '")';
        var rm = el("button", "bio-thumb-x", "×"); rm.type = "button";
        rm.setAttribute("aria-label", "حذف تصویر");
        rm.addEventListener("click", function () { photos.splice(i, 1); draw(); });
        th.appendChild(rm);
        box.appendChild(th);
      });
    }

    input.addEventListener("change", function () {
      var files = Array.prototype.slice.call(input.files || []);
      files.forEach(function (f) {
        var rd = new FileReader();
        rd.onload = function () { photos.push(rd.result); draw(); };
        rd.readAsDataURL(f);
      });
      input.value = "";
    });
  }


  /* ---------- سازنده‌های فیلد ---------- */
  function field(label, req, node, hint) {
    var f = el("div", "field");
    var l = el("div", "field-label");
    l.innerHTML = '<span class="info">ⓘ</span> ' + esc(label) + (req ? ' <span class="req">*</span>' : "");
    f.appendChild(l);
    if (hint) f.appendChild(el("p", "field-hint", esc(hint)));
    f.appendChild(node);
    return f;
  }

  function textInput(key, placeholder, opts) {
    opts = opts || {};
    var i = document.createElement(opts.tag || "input");
    if (opts.tag !== "textarea") i.type = opts.type || "text";
    i.placeholder = placeholder;
    if (opts.rows) i.rows = opts.rows;
    if (opts.max) i.maxLength = opts.max;
    if (opts.inputmode) i.setAttribute("inputmode", opts.inputmode);
    i.value = opts.get ? (opts.get() || "") : (data[key] || "");
    i.addEventListener("input", function () {
      if (opts.set) opts.set(i.value); else data[key] = i.value;
      if (opts.max && i.parentNode) {
        var c = i.parentNode.querySelector(".char-count");
        if (c) c.textContent = faNum(opts.max - i.value.length);
      }
    });
    if (!opts.max) return i;
    var wrap = el("div", "ta-wrap");
    wrap.appendChild(i);
    wrap.appendChild(el("span", "char-count", faNum(opts.max - (i.value.length || 0))));
    return wrap;
  }

  /* کادر تاریخ شمسی (و در صورت نیاز ساعت) */
  function dateBox(getter, setter, withTime) {
    var box = el("div", "datetime-box");
    var prev = el("p", "dt-preview");
    var row = el("div", "date-row");
    var day = document.createElement("select"), mon = document.createElement("select"), yr = document.createElement("select");
    day.className = "sel-day"; mon.className = "sel-month"; yr.className = "sel-year";
    MONTHS.forEach(function (m, i) { mon.appendChild(new Option(m, i + 1)); });
    for (var y = TODAY.y + 1; y >= TODAY.y - 100; y--) yr.appendChild(new Option(faNum(y), y));
    row.appendChild(day); row.appendChild(mon); row.appendChild(yr);
    box.appendChild(prev); box.appendChild(row);

    var hour, min;
    if (withTime) {
      var trow = el("div", "time-row");
      hour = document.createElement("select"); hour.className = "sel-hour";
      for (var h = 0; h <= 23; h++) hour.appendChild(new Option(pad2(h), h));
      min = document.createElement("select"); min.className = "sel-minute";
      for (var m2 = 0; m2 < 60; m2 += 5) min.appendChild(new Option(pad2(m2), m2));
      /* در چیدمان راست‌چین، دقیقه سمت راست و ساعت سمت چپ می‌نشیند */
      trow.appendChild(min); trow.appendChild(el("span", "dt-colon", ":")); trow.appendChild(hour);
      box.appendChild(trow);
    }

    var cur = getter() || { y: TODAY.y, m: TODAY.m, d: TODAY.d, h: 16, i: 0 };
    yr.value = cur.y; mon.value = cur.m;

    function fillDays() {
      var len = SogUtil.jalaliMonthLength(+yr.value, +mon.value);
      var want = Math.min(+day.value || cur.d, len);
      day.innerHTML = "";
      for (var d = 1; d <= len; d++) day.appendChild(new Option(faNum(d), d));
      day.value = want;
    }
    fillDays();
    if (withTime) { hour.value = cur.h == null ? 16 : cur.h; min.value = cur.i || 0; }

    function sync() {
      var v = { y: +yr.value, m: +mon.value, d: +day.value };
      if (withTime) { v.h = +hour.value; v.i = +min.value; }
      var txt = SogUtil.jalaliWeekday(v.y, v.m, v.d) + " " + faNum(v.d) + " " + MONTHS[v.m - 1] + " " + faNum(v.y);
      if (withTime) txt += " ساعت " + pad2(v.h) + ":" + pad2(v.i);
      prev.textContent = txt;
      setter(v);
    }
    [day, mon, yr].concat(withTime ? [hour, min] : []).forEach(function (s) {
      s.addEventListener("change", function () {
        if (s === mon || s === yr) fillDays();
        sync();
      });
    });
    sync();
    return box;
  }

  /* انتخاب تصویر با برش */
  function photoSlot(index, label) {
    var box = el("label", "photo-slot" + (data.photos[index] ? " has-img" : ""));
    function paint() {
      box.innerHTML = "";
      box.className = "photo-slot" + (data.photos[index] ? " has-img" : "");
      if (data.photos[index]) {
        var img = el("img"); img.src = data.photos[index]; img.alt = "";
        box.appendChild(img);
        var rm = el("button", "slot-x", "×"); rm.type = "button";
        rm.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          data.photos[index] = null; paint();
        });
        box.appendChild(rm);
      } else {
        box.appendChild(el("span", "slot-txt",
          '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="3" y="7" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="13.5" r="3.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 7l1.3-2.2h3.4L15 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg> ' + esc(label)));
      }
      var inp = document.createElement("input");
      inp.type = "file"; inp.accept = "image/*"; inp.hidden = true;
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        openCropper(f, function (url) { data.photos[index] = url; paint(); });
        inp.value = "";
      });
      box.appendChild(inp);
    }
    paint();
    return box;
  }

  /* چند تصویر برای هر مراسم */
  function multiPhotos(ev, max, note) {
    var wrap = el("div", "multi-photos");
    if (note) wrap.appendChild(el("p", "field-hint", esc(note)));
    var thumbs = el("div", "bio-thumbs");
    function paint() {
      thumbs.innerHTML = "";
      (ev.photos || []).forEach(function (src, i) {
        var th = el("div", "bio-thumb"); th.style.backgroundImage = 'url("' + src + '")';
        var x = el("button", "bio-thumb-x", "×"); x.type = "button";
        x.addEventListener("click", function () { ev.photos.splice(i, 1); paint(); });
        th.appendChild(x); thumbs.appendChild(th);
      });
      btn.hidden = (ev.photos || []).length >= max;
    }
    var btn = el("label", "pick-btn", "انتخاب تصاویر مراسم ( " + faNum(max) + " تصویر )");
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/png,image/jpeg"; inp.multiple = true; inp.hidden = true;
    inp.addEventListener("change", function () {
      Array.prototype.slice.call(inp.files || []).forEach(function (f) {
        if ((ev.photos || []).length >= max) return;
        var rd = new FileReader();
        rd.onload = function () { ev.photos = ev.photos || []; ev.photos.push(rd.result); paint(); };
        rd.readAsDataURL(f);
      });
      inp.value = "";
    });
    btn.appendChild(inp);
    wrap.appendChild(thumbs); wrap.appendChild(btn);
    paint();
    return wrap;
  }

  /* تصاویر زندگی‌نامه + انتخاب چیدمان نمایش */
  var BIO_LAYOUTS = [
    { key: "one",  name: "یک ستونه",
      ico: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/>' },
    { key: "two",  name: "دو ستونه",
      ico: '<rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/>' },
    { key: "two-one", name: "دو ستونه بالا، یک ستونه پایین",
      ico: '<rect x="3" y="4" width="8" height="8" rx="2"/><rect x="13" y="4" width="8" height="8" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/>' },
    { key: "grid", name: "شبکه‌ی دو در دو",
      ico: '<rect x="3" y="4" width="8" height="7" rx="2"/><rect x="13" y="4" width="8" height="7" rx="2"/><rect x="3" y="13" width="8" height="7" rx="2"/><rect x="13" y="13" width="8" height="7" rx="2"/>' }
  ];

  function bioPhotosField() {
    var box = el("div", "bio-field");

    /* انتخاب چیدمان */
    var lay = el("div", "layout-picker");
    BIO_LAYOUTS.forEach(function (L) {
      var b = el("button", "layout-opt" + (data.bio_layout === L.key ? " is-active" : ""));
      b.type = "button";
      b.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6">' + L.ico + '</svg>' +
                    '<span>' + esc(L.name) + '</span>';
      b.addEventListener("click", function () {
        data.bio_layout = L.key;
        Array.prototype.forEach.call(lay.children, function (n) { n.classList.remove("is-active"); });
        b.classList.add("is-active");
        paint();
      });
      lay.appendChild(b);
    });

    /* پیش‌نمایش تصاویر با همان چیدمان */
    var preview = el("div", "bio-preview");
    function paint() {
      preview.className = "bio-preview lay-" + data.bio_layout;
      preview.innerHTML = "";
      data.bio_photos.forEach(function (src, i) {
        var cell = el("div", "bp-cell");
        cell.style.backgroundImage = 'url("' + src + '")';
        var x = el("button", "bio-thumb-x", "×"); x.type = "button";
        x.addEventListener("click", function () { data.bio_photos.splice(i, 1); paint(); });
        cell.appendChild(x);
        preview.appendChild(cell);
      });
      if (!data.bio_photos.length) preview.appendChild(el("p", "field-hint", "هنوز تصویری اضافه نشده است."));
    }

    var add = el("label", "pick-btn", "افزودن تصویر به زندگی‌نامه");
    var inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/png,image/jpeg"; inp.multiple = true; inp.hidden = true;
    inp.addEventListener("change", function () {
      Array.prototype.slice.call(inp.files || []).forEach(function (f) {
        var rd = new FileReader();
        rd.onload = function () { data.bio_photos.push(rd.result); paint(); };
        rd.readAsDataURL(f);
      });
      inp.value = "";
    });
    add.appendChild(inp);

    box.appendChild(el("p", "field-hint", "چیدمان نمایش تصاویر را انتخاب کنید:"));
    box.appendChild(lay);
    box.appendChild(preview);
    box.appendChild(add);
    paint();
    return box;
  }

  /* انتخاب موقعیت روی نقشه */
  function mapPicker(ev) {
    var box = el("div", "map-pick");
    var map = el("div", "loc-map");
    map.style.backgroundImage = "url('assets/img/map.svg')";
    var status = el("p", "map-status", ev.lat ? "موقعیت ثبت شد" : "موقعیت دقیق آرامگاه را در نقشه انتخاب کنید");
    var btn = el("button", "map-btn", "استفاده از موقعیت فعلی من"); btn.type = "button";
    btn.addEventListener("click", function () {
      if (!navigator.geolocation) { status.textContent = "دستگاه شما موقعیت‌یابی ندارد."; return; }
      status.textContent = "در حال یافتن موقعیت…";
      navigator.geolocation.getCurrentPosition(function (pos) {
        ev.lat = pos.coords.latitude; ev.lng = pos.coords.longitude;
        status.textContent = "موقعیت ثبت شد ✓";
      }, function () { status.textContent = "دسترسی به موقعیت داده نشد؛ می‌توانید لینک نقشه را بگذارید."; });
    });
    var link = textInput(null, "یا لینک موقعیت از گوگل‌مپ / نشان را اینجا بگذارید", {
      get: function () { return ev.map_link; },
      set: function (v) { ev.map_link = v; }
    });
    box.appendChild(map); box.appendChild(status); box.appendChild(btn); box.appendChild(link);
    return box;
  }

  /* ---------- ساخت مرحله‌ها ---------- */
  function ceremonyInstances() {
    var out = [];
    CEREMONIES.forEach(function (c) {
      if (!data.picked[c.key]) return;
      if (!data.events[c.key]) data.events[c.key] = { photos: [], notes: [] };
      out.push({ id: c.key, name: c.name });
    });
    return out;
  }

  function buildSteps() {
    var steps = [];

    /* ۱) تصویر و نام */
    steps.push({ title: "مشخصات درگذشته", build: function () {
      var p = el("section", "reg-panel");
      var slots = el("div", "photo-slots");
      slots.appendChild(photoSlot(0, "انتخاب تصویر ( تصویر اصلی )"));
      slots.appendChild(photoSlot(1, "انتخاب تصویر"));
      slots.appendChild(photoSlot(2, "انتخاب تصویر"));
      p.appendChild(field("تصویر درگذشته", true, slots));
      p.appendChild(field("نام و نام خانوادگی درگذشته", true, textInput("name", "نام و نام خانوادگی درگذشته را وارد کنید")));
      p.appendChild(field("شرح کوتاه از درگذشته", false, textInput("brief", "مثال : پدری دلسوز / مادری مهربان / …")));
      return p;
    }});

    /* ۲) تاریخ‌ها و مکان */
    steps.push({ title: "تاریخ‌ها و زادگاه", build: function () {
      var p = el("section", "reg-panel");
      p.appendChild(field("تاریخ تولد", true, dateBox(function () { return data.birth; }, function (v) { data.birth = v; })));
      p.appendChild(field("تاریخ درگذشت", true, dateBox(function () { return data.death; }, function (v) { data.death = v; })));
      p.appendChild(field("سن درگذشته", true, textInput("age", "مثال : ۸۵ سال")));
      p.appendChild(field("زادگاه", false, textInput("birthplace", "نام شهر محل تولد را وارد کنید")));
      p.appendChild(field("شهر", false, textInput("city", "نام شهر محل زندگی را وارد کنید")));
      return p;
    }});

    /* ۳) خانواده */
    steps.push({ title: "خانواده و طایفه", build: function () {
      var p = el("section", "reg-panel");
      p.appendChild(field("نام پدر", false, textInput("father", "فقط نام پدر نوشته شود")));
      p.appendChild(field("نام طایفه پدری", true, textInput("father_tayefe", "فقط نام طایفه نوشته شود ( بدون توصیفات )")));
      p.appendChild(field("نام ایل پدری", false, textInput("father_il", "فقط نام ایل نوشته شود ( بدون توصیفات )")));
      p.appendChild(field("نام مادر", true, textInput("mother", "نام و نام خانوادگی یا فقط نام خانوادگی نوشته شود")));
      p.appendChild(field("نام طایفه مادری", true, textInput("mother_tayefe", "فقط نام طایفه نوشته شود ( بدون توصیفات )")));
      p.appendChild(field("نام ایل مادری", false, textInput("mother_il", "فقط نام ایل نوشته شود ( بدون توصیفات )")));
      return p;
    }});

    /* ۴) انتخاب مراسم */
    steps.push({ title: "انتخاب مراسم", rebuild: true, build: function () {
      var p = el("section", "reg-panel");
      p.appendChild(el("p", "panel-sub", "مراسمات انتخاب‌شده را در صفحه‌های بعدی تکمیل کنید"));
      var list = el("div", "cer-list");
      CEREMONIES.forEach(function (c) {
        var row = el("div", "cer-row" + (data.picked[c.key] ? " is-on" : ""));
        var chk = el("button", "cer-check"); chk.type = "button";
        chk.setAttribute("aria-pressed", data.picked[c.key] ? "true" : "false");
        chk.innerHTML = '<span class="box">✓</span><span class="lbl">' + esc(c.name) + "</span>";
        chk.addEventListener("click", function () {
          if (data.picked[c.key]) delete data.picked[c.key];
          else data.picked[c.key] = 1;
          var on = !!data.picked[c.key];
          row.classList.toggle("is-on", on);
          chk.setAttribute("aria-pressed", on ? "true" : "false");
          refreshSteps();
        });
        row.appendChild(chk);
        list.appendChild(row);
      });
      p.appendChild(list);
      return p;
    }});

    /* ۵) دو صفحه برای هر مراسم انتخاب‌شده */
    ceremonyInstances().forEach(function (ins) {
      var ev = data.events[ins.id];

      steps.push({ title: "مراسم " + ins.name, build: function () {
        var p = el("section", "reg-panel");
        p.appendChild(field("تاریخ و ساعت مراسم " + ins.name, true,
          dateBox(function () { return ev.when; }, function (v) { ev.when = v; }, true)));
        p.appendChild(field("موقعیت مراسم " + ins.name + " در نقشه", false, mapPicker(ev)));
        p.appendChild(field("آدرس مراسم " + ins.name, true, textInput(null, "آدرس مراسم " + ins.name + " را بنویسید", {
          tag: "textarea", rows: 3, max: 250,
          get: function () { return ev.address; }, set: function (v) { ev.address = v; }
        })));
        return p;
      }});

      steps.push({ title: "توضیحات " + ins.name, build: function () {
        var p = el("section", "reg-panel");
        p.appendChild(field("توضیحات مراسم " + ins.name, false, textInput(null,
          "در این قسمت توضیحات تکمیلی درباره‌ی نحوه‌ی برگزاری، امکانات و شرایط مهیاشده‌ی مراسم را بنویسید …", {
            tag: "textarea", rows: 5, max: 500,
            get: function () { return ev.desc; }, set: function (v) { ev.desc = v; }
          })));

        var grid = el("div", "check-grid");
        NOTES.forEach(function (n) {
          var chip = el("button", "check-chip" + (ev.notes.indexOf(n) !== -1 ? " is-checked" : ""));
          chip.type = "button";
          chip.innerHTML = '<span class="lbl">' + esc(n) + '</span><span class="box">✓</span>';
          chip.addEventListener("click", function () {
            var i = ev.notes.indexOf(n);
            if (i === -1) ev.notes.push(n); else ev.notes.splice(i, 1);
            chip.classList.toggle("is-checked", i === -1);
          });
          grid.appendChild(chip);
        });
        p.appendChild(field("نکات مراسم", false, grid));
        p.appendChild(field("تصاویر مراسم " + ins.name, false,
          multiPhotos(ev, 4, "در این قسمت بعد از برگزاری مراسم " + ins.name + " تصاویر مراسم را وارد کنید")));
        return p;
      }});
    });

    /* ۶) زندگی‌نامه و موزیک */
    steps.push({ title: "زندگی‌نامه و موزیک", build: function () {
      var p = el("section", "reg-panel");
      p.appendChild(field("زندگی‌نامه", false, textInput("bio", "زندگی‌نامه و شرح زندگی درگذشته…", { tag: "textarea", rows: 7, max: 2000 })));
      p.appendChild(field("تصاویر زندگی‌نامه", false, bioPhotosField()));
      var music = el("div");
      music.appendChild(el("p", "field-hint", "فایل موزیک مورد نظر خود را وارد کنید"));
      var mbtn = el("label", "pick-btn", "انتخاب فایل موزیک");
      var minp = document.createElement("input");
      minp.type = "file"; minp.accept = "audio/*"; minp.hidden = true;
      var mname = el("p", "music-name", data.music ? esc(data.music) : "");
      minp.addEventListener("change", function () {
        var f = minp.files && minp.files[0];
        data.music = f ? f.name : null;
        mname.textContent = f ? f.name : "";
      });
      mbtn.appendChild(minp);
      music.appendChild(mbtn); music.appendChild(mname);
      p.appendChild(field("موزیک", false, music));
      return p;
    }});

    /* ۷) ارتباط */
    steps.push({ title: "ارتباط با شما", build: function () {
      var p = el("section", "reg-panel");
      p.appendChild(el("p", "panel-sub", "برای ارتباط با شما شماره تلفن و کانال‌های ارتباطی مجازی خود را وارد کنید …"));
      p.appendChild(field("موبایل", true, textInput("phone", "۰۹۱۲۳۴۵۶۷۸۹", { type: "tel", inputmode: "tel" })));
      /* برای هر پیام‌رسان انتخاب‌شده، کاربر می‌تواند لینک/شناسه بدهد؛
         اگر خالی بماند، همان شماره‌ی موبایل به‌صورت پیش‌فرض استفاده می‌شود. */
      var wrap = el("div");
      var grid = el("div", "check-grid");
      var links = el("div", "msg-links");

      function paintLinks() {
        links.innerHTML = "";
        if (!data.messengers.length) return;
        data.messengers.forEach(function (m) {
          var row = el("div", "msg-link");
          row.appendChild(el("span", "msg-link-name", esc(m)));
          var inp = textInput(null, "لینک یا شناسه‌ی " + m + " (اختیاری)", {
            get: function () { return data.messenger_links[m]; },
            set: function (v) { data.messenger_links[m] = v; }
          });
          row.appendChild(inp);
          links.appendChild(row);
        });
        links.appendChild(el("p", "field-hint", "اگر خالی بماند، به‌صورت پیش‌فرض از همان شماره‌ی موبایل شما استفاده می‌شود."));
      }

      MESSENGERS.forEach(function (m) {
        var chip = el("button", "check-chip" + (data.messengers.indexOf(m) !== -1 ? " is-checked" : ""));
        chip.type = "button";
        chip.innerHTML = '<span class="lbl">' + esc(m) + '</span><span class="box">✓</span>';
        chip.addEventListener("click", function () {
          var i = data.messengers.indexOf(m);
          if (i === -1) data.messengers.push(m);
          else { data.messengers.splice(i, 1); delete data.messenger_links[m]; }
          chip.classList.toggle("is-checked", i === -1);
          paintLinks();
        });
        grid.appendChild(chip);
      });
      paintLinks();
      wrap.appendChild(grid); wrap.appendChild(links);
      p.appendChild(field("پیام‌رسان‌ها", false, wrap));
      p.appendChild(field("ارتباط خویشاوندی با درگذشته", false, textInput("relation", "مثال : فرزند")));

      /* آیکون جفت: ثبت همدردی و سپاسگزاری در پایان ثبت آگهی */
      var pair = el("div", "final-pair");
      var thanksBtn = el("button", "pair-btn" + (data.thanks ? " is-on" : ""));
      thanksBtn.type = "button";
      thanksBtn.innerHTML = '<span class="pair-ico"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z" fill="none" stroke="currentColor" stroke-width="1.7"/></svg></span><span>متن سپاسگزاری</span>';
      var condBtn = el("button", "pair-btn is-off");
      condBtn.type = "button";
      condBtn.innerHTML = '<span class="pair-ico"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 3c1.6 2 1.4 3.4 0 4.4C10.6 6.4 10.4 5 12 3z" fill="currentColor"/><rect x="9.5" y="8.5" width="5" height="11" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></span><span>ثبت همدردی</span>';
      condBtn.disabled = true;
      condBtn.title = "پس از انتشار آگهی، بازدیدکنندگان می‌توانند همدردی ثبت کنند";
      pair.appendChild(thanksBtn); pair.appendChild(condBtn);

      var thanksBox = el("div", "thanks-box");
      thanksBox.hidden = !data.thanks;
      var ta = textInput("thanks", "متن سپاسگزاری خود را بنویسید…", { tag: "textarea", rows: 4, max: 600 });
      thanksBox.appendChild(ta);
      thanksBox.appendChild(el("p", "field-hint", "یا یکی از متن‌های آماده را انتخاب کنید:"));
      var track = el("div", "ready-track");
      READY_THANKS.forEach(function (t) {
        var card = el("button", "ready-card", esc(t));
        card.type = "button";
        card.addEventListener("click", function () {
          Array.prototype.forEach.call(track.children, function (n) { n.classList.remove("is-picked"); });
          card.classList.add("is-picked");
          data.thanks = t;
          var input = thanksBox.querySelector("textarea");
          if (input) {
            input.value = t;
            var c = thanksBox.querySelector(".char-count");
            if (c) c.textContent = faNum(600 - t.length);
          }
        });
        track.appendChild(card);
      });
      thanksBox.appendChild(track);

      thanksBtn.addEventListener("click", function () {
        thanksBox.hidden = !thanksBox.hidden;
        thanksBtn.classList.toggle("is-on", !thanksBox.hidden);
      });

      p.appendChild(field("همدردی و سپاسگزاری", false, pair));
      p.appendChild(thanksBox);
      return p;
    }});

    return steps;
  }

  /* ---------- ناوبری ---------- */
  var steps = buildSteps();
  var current = 0;
  var panels = document.getElementById("panels");

  function refreshSteps() {
    var stayTitle = steps[current] && steps[current].title;
    steps = buildSteps();
    /* اگر مرحله‌ی فعلی هنوز وجود دارد، همان‌جا بمانیم */
    var idx = -1;
    steps.forEach(function (s, i) { if (s.title === stayTitle) idx = i; });
    current = idx === -1 ? Math.min(current, steps.length - 1) : idx;
    paintProgress();
  }

  function paintProgress() {
    document.getElementById("stepTitle").textContent = steps[current].title;
    document.getElementById("stepCount").textContent = "مرحله " + faNum(current + 1) + " از " + faNum(steps.length);
    document.getElementById("stepBar").style.width = ((current + 1) / steps.length * 100) + "%";
  }

  function show(i) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    panels.innerHTML = "";
    var node = steps[current].build();
    node.classList.add("is-active");
    panels.appendChild(node);
    paintProgress();
    renderActions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderActions() {
    var bar = document.getElementById("regActions");
    bar.innerHTML = "";
    var prev = el("button", "btn-prev", "قبلی"); prev.type = "button";
    prev.disabled = current === 0;
    prev.addEventListener("click", function () { show(current - 1); });
    var isLast = current === steps.length - 1;
    var next = el("button", "btn-next", isLast ? "ثبت آگهی" : "بعدی"); next.type = "button";
    next.addEventListener("click", function () {
      if (isLast) submit(); else show(current + 1);
    });
    bar.appendChild(prev); bar.appendChild(next);
  }

  function submit() {
    /* بدون بک‌اند: داده به‌صورت محلی نگه داشته می‌شود تا در نسخه‌ی وردپرس ارسال شود */
    try {
      localStorage.setItem("sog:draftListing", JSON.stringify(data));
      /* تا وقتی حساب کاربری واقعی وصل نشده، ثبت‌کننده روی همین دستگاه شناخته می‌شود */
      var mine = JSON.parse(localStorage.getItem("sog:myListings")) || [];
      var newId = "draft-" + Date.now();
      mine.push(newId);
      localStorage.setItem("sog:myListings", JSON.stringify(mine));
    } catch (e) {}
    document.getElementById("regSuccess").classList.add("is-in");
  }

  var backBtn = document.getElementById("backBtn");
  if (backBtn) backBtn.addEventListener("click", function () {
    if (current > 0) show(current - 1); else history.back();
  });
  var draftBtn = document.getElementById("draftBtn");
  if (draftBtn) draftBtn.addEventListener("click", function () {
    try { localStorage.setItem("sog:draftListing", JSON.stringify(data)); } catch (e) {}
    draftBtn.classList.add("saved");
    setTimeout(function () { draftBtn.classList.remove("saved"); }, 1200);
  });

  show(0);
})();
