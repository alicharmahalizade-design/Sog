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

  /* استان و شهر */
  function fillPlaces() {
    var prov = document.getElementById("provinceSel");
    PROVINCES.forEach(function (p) { prov.appendChild(new Option(p, p)); });
    var city = document.getElementById("citySel");
    fetch("data/cities.json").then(function (r) { return r.json(); }).then(function (d) {
      (d.cities || []).filter(function (c) { return c.slug !== "all"; }).forEach(function (c) {
        city.appendChild(new Option(c.name, c.slug));
      });
    }).catch(function () {});
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

  /* آپلود تصویر → پیش‌نمایش */
  function bindUpload() {
    var input = document.getElementById("photoInput"), box = document.getElementById("uploadBox");
    if (!input) return;
    input.addEventListener("change", function () {
      var f = input.files && input.files[0]; if (!f) return;
      var url = URL.createObjectURL(f);
      box.classList.add("has-img");
      box.innerHTML = '<img src="' + url + '" alt="">';
      box.appendChild(input);
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
