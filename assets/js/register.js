/* ویزارد ثبت سوگ — سه مرحله‌ای. داده فرم آماده‌ی ارسال به REST وردپرس. */
(function () {
  "use strict";
  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  var MONTHS = SogUtil.jMonths;
  var PROVINCES = ["آذربایجان شرقی", "آذربایجان غربی", "اردبیل", "اصفهان", "البرز", "ایلام", "بوشهر", "تهران", "چهارمحال و بختیاری", "خوزستان", "فارس", "کرمان", "گیلان", "مازندران", "همدان", "یزد"];
  var NOTES = ["به صرف ناهار", "به صرف شام", "به صرف افطار", "ایاب و ذهاب", "انجام پذیرایی", "وسیله نقلیه"];

  /* ---------- تاریخ و ساعت (پیش‌فرض: همین حالا) ---------- */
  var TODAY = SogUtil.todayJalali();

  function pad2(n) { return faNum(n < 10 ? "0" + n : String(n)); }

  // روزهای ماهِ انتخاب‌شده را می‌سازد و انتخاب قبلی را تا حد ممکن نگه می‌دارد
  function fillDays(box) {
    var day = box.querySelector(".sel-day");
    var jy = +box.querySelector(".sel-year").value || TODAY.y;
    var jm = +box.querySelector(".sel-month").value || TODAY.m;
    var len = SogUtil.jalaliMonthLength(jy, jm);
    var want = Math.min(+day.value || TODAY.d, len);
    day.innerHTML = "";
    for (var d = 1; d <= len; d++) day.appendChild(new Option(faNum(d), d));
    day.value = want;
  }

  // خط پیش‌نمایش: «جمعه ۹ مرداد ۱۴۰۵ ساعت ۱۰:۳۰»
  function updatePreview(box) {
    var out = box.querySelector(".dt-preview");
    if (!out) return;
    var jy = +box.querySelector(".sel-year").value;
    var jm = +box.querySelector(".sel-month").value;
    var jd = +box.querySelector(".sel-day").value;
    var hour = box.querySelector(".sel-hour"), min = box.querySelector(".sel-minute");
    var txt = SogUtil.jalaliWeekday(jy, jm, jd) + " " + faNum(jd) + " " + MONTHS[jm - 1] + " " + faNum(jy);
    if (hour && min) txt += " ساعت " + pad2(+hour.value) + ":" + pad2(+min.value);
    out.textContent = txt;
  }

  /* پر کردن سلکت‌های تاریخ و ساعت با مقدار پیش‌فرضِ امروز/اکنون */
  function fillDates() {
    var now = new Date();
    document.querySelectorAll(".sel-month").forEach(function (s) {
      MONTHS.forEach(function (m, i) { s.appendChild(new Option(m, i + 1)); });
      s.value = TODAY.m;
    });
    document.querySelectorAll(".sel-year").forEach(function (s) {
      for (var y = TODAY.y + 1; y >= TODAY.y - 45; y--) s.appendChild(new Option(faNum(y), y));
      s.value = TODAY.y;
    });
    document.querySelectorAll(".sel-hour").forEach(function (s) {
      for (var h = 0; h <= 23; h++) s.appendChild(new Option(pad2(h), h));
      s.value = now.getHours();
    });
    document.querySelectorAll(".sel-minute").forEach(function (s) {
      for (var m = 0; m < 60; m += 5) s.appendChild(new Option(pad2(m), m));
      s.value = Math.floor(now.getMinutes() / 5) * 5;
    });

    document.querySelectorAll(".datetime-box").forEach(function (box) {
      fillDays(box);
      updatePreview(box);
      box.querySelectorAll("select").forEach(function (s) {
        s.addEventListener("change", function () {
          if (s.classList.contains("sel-month") || s.classList.contains("sel-year")) fillDays(box);
          updatePreview(box);
        });
      });
    });
  }

  /* استان و شهر — فهرست شهر به استانِ انتخاب‌شده وابسته است */
  function fillPlaces() {
    var prov = document.getElementById("provinceSel");
    var city = document.getElementById("citySel");
    if (!prov || !city) return;

    city.disabled = true;

    function resetCity(placeholder) {
      city.innerHTML = "";
      var ph = new Option(placeholder, "");
      ph.disabled = true; ph.selected = true;
      city.appendChild(ph);
    }
    resetCity("ابتدا استان را انتخاب کنید");

    fetch("data/provinces.json").then(function (r) { return r.json(); }).then(function (d) {
      var MAP = d.provinces || {};
      Object.keys(MAP).forEach(function (name) { prov.appendChild(new Option(name, name)); });

      prov.addEventListener("change", function () {
        var list = MAP[prov.value] || [];
        resetCity(list.length ? "شهر مراسم" : "شهری یافت نشد");
        list.forEach(function (c) { city.appendChild(new Option(c, c)); });
        city.disabled = !list.length;
      });
    }).catch(function () {
      /* اگر داده‌ی استان‌ها بارگذاری نشد، دست‌کم فهرست ثابت استان‌ها نمایش داده شود */
      PROVINCES.forEach(function (p) { prov.appendChild(new Option(p, p)); });
      resetCity("شهر مراسم");
      city.disabled = false;
    });
  }

  /* چیپ‌های نکات مراسم */
  function fillNotes() {
    var grid = document.getElementById("noteGrid");
    NOTES.forEach(function (n) {
      var chip = el("button", "check-chip");
      chip.type = "button";
      chip.innerHTML = '<span class="lbl">' + n + '</span><span class="box">✓</span>';
      chip.addEventListener("click", function () { chip.classList.toggle("is-checked"); });
      grid.appendChild(chip);
    });
  }

  /* ردیف‌های بازشونده */
  function bindExpanders() {
    document.querySelectorAll(".exp-row .exp-head").forEach(function (head) {
      head.addEventListener("click", function () { head.closest(".exp-row").classList.toggle("is-open"); });
    });
    var sms = document.getElementById("smsOnly");
    if (sms) sms.addEventListener("click", function () { sms.classList.toggle("on"); });
    document.querySelectorAll(".social-btn").forEach(function (b) {
      b.addEventListener("click", function () { b.classList.toggle("on"); });
    });
  }

  /* آپلود تصویر → برش → پیش‌نمایش */
  var croppedDataUrl = null;   // تصویر برش‌خورده برای ارسال نهایی

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

  function bindUpload() {
    var input = document.getElementById("photoInput"), box = document.getElementById("uploadBox");
    if (!input) return;

    function showPreview(dataUrl) {
      croppedDataUrl = dataUrl;
      box.classList.add("has-img");
      box.innerHTML = '<img src="' + dataUrl + '" alt="">';
      var bar = el("div", "img-tools");
      var recrop = el("button", "img-tool", "برش دوباره"); recrop.type = "button";
      var remove = el("button", "img-tool", "حذف تصویر"); remove.type = "button";
      bar.appendChild(recrop); bar.appendChild(remove);
      box.appendChild(bar);
      box.appendChild(input);

      /* کلیک روی تصویر، پنجره‌ی انتخاب فایل را باز نکند */
      box.addEventListener("click", stop, true);
      function stop(e) { if (e.target !== input) e.preventDefault(); }

      recrop.addEventListener("click", function (e) {
        e.stopPropagation();
        var f = input.files && input.files[0];
        if (f) openCropper(f, showPreview);
      });
      remove.addEventListener("click", function (e) {
        e.stopPropagation();
        croppedDataUrl = null;
        input.value = "";
        box.removeEventListener("click", stop, true);
        box.classList.remove("has-img");
        box.innerHTML = '<span class="up-inner"><svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> افزودن تصویر</span>';
        box.appendChild(input);
      });
    }

    input.addEventListener("change", function () {
      var f = input.files && input.files[0]; if (!f) return;
      openCropper(f, showPreview);
    });
  }

  /* ناوبری مراحل */
  var current = 1, TOTAL = 3;
  function goStep(n) {
    current = Math.max(1, Math.min(TOTAL, n));
    document.querySelectorAll(".reg-panel").forEach(function (p) {
      p.classList.toggle("is-active", +p.dataset.panel === current);
    });
    document.querySelectorAll(".reg-step").forEach(function (s) {
      var st = +s.dataset.step;
      s.classList.toggle("is-active", st === current);
      s.classList.toggle("is-done", st < current);
    });
    renderActions();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderActions() {
    var bar = document.getElementById("regActions");
    bar.innerHTML = "";
    var next = el("button", "btn-next", current < TOTAL ? "مرحله بعد" : "ثبت آگهی");
    next.type = "button";
    next.addEventListener("click", function () { current < TOTAL ? goStep(current + 1) : submit(); });
    bar.appendChild(next);
    if (current > 1) {
      var prev = el("button", "btn-prev", "مرحله قبل");
      prev.type = "button";
      prev.addEventListener("click", function () { goStep(current - 1); });
      bar.appendChild(prev);
    }
  }

  function submit() {
    // نمونه‌ی پیش‌نمایش؛ در وردپرس این‌جا به REST API ارسال می‌شود
    document.getElementById("regSuccess").classList.add("show");
  }

  /* راه‌اندازی */
  fillDates(); fillPlaces(); fillNotes(); bindExpanders(); bindUpload(); renderActions();
  document.querySelectorAll(".reg-step").forEach(function (s) {
    s.addEventListener("click", function () { goStep(+s.dataset.step); });
  });
  document.getElementById("backBtn").addEventListener("click", function () {
    if (current > 1) goStep(current - 1); else location.href = "index.html";
  });
  document.getElementById("draftBtn").addEventListener("click", function () { alert("پیش‌نویس ذخیره شد (نمونه)."); });
})();
