/* پروفایل کسب‌وکار سوگ — گالری، نظرات، ساعات، نقشه، واتساپ. داده‌محور. */
(function () {
  "use strict";
  var root = document.getElementById("bp");
  var id = new URLSearchParams(location.search).get("id");

  var STAR = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 3l2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.9 6.6 19.4l1.2-6L3.4 9.3l6-.7L12 3z" fill="currentColor"/></svg>';
  var IC = {
    back: '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 3a9 9 0 00-7.7 13.6L3 21l4.6-1.2A9 9 0 1012 3z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 8c0 4 3 7 7 7 .7 0 1-1 .6-1.6l-1.7-.9-1 .9c-1.3-.5-2.3-1.5-2.8-2.8l.9-1-.9-1.7C11 7.1 9.7 7.3 9 8z" fill="currentColor"/></svg>',
    call: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 4h4l1.5 5-2 1.5a12 12 0 005 5l1.5-2 5 1.5v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" fill="currentColor"/></svg>',
    map: '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 22s7-6.2 7-12A7 7 0 105 10c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    bookmark: function (f) { return '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 3h12v18l-6-4-6 4V3z" ' + (f ? 'fill="currentColor" stroke="currentColor"' : 'fill="none" stroke="currentColor"') + ' stroke-width="1.8" stroke-linejoin="round"/></svg>'; },
    clock: '<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12 22s7-6.2 7-12A7 7 0 105 10c0 5.8 7 12 7 12z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    cart: '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 6h15l-1.5 9h-12L6 6zM6 6L5 3H2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="20" r="1.4" fill="currentColor"/><circle cx="18" cy="20" r="1.4" fill="currentColor"/></svg>'
  };
  /* اعتبارسنجی کد ملی ایران */
  function validMelli(code) {
    code = String(code || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/\D/g, "");
    if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += parseInt(code[i], 10) * (10 - i);
    var r = sum % 11, c = parseInt(code[9], 10);
    return (r < 2 && c === r) || (r >= 2 && c === 11 - r);
  }

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

  /* ثبت کد ملی صاحب کسب‌وکار */
  function ownerVerify(b) {
    var KEY = "sog:bizMelli";
    function read() { try { return (JSON.parse(localStorage.getItem(KEY)) || {})[b.id] || ""; } catch (e) { return ""; } }
    function write(v) {
      try {
        var m = JSON.parse(localStorage.getItem(KEY)) || {};
        if (v) m[b.id] = v; else delete m[b.id];
        localStorage.setItem(KEY, JSON.stringify(m));
      } catch (e) {}
    }

    var sec = el("div", "bp-section");
    sec.appendChild(el("h2", null, "ثبت کد ملی صاحب کسب‌وکار"));
    sec.appendChild(el("p", "bp-hint", "برای تأیید مالکیت این کسب‌وکار، کد ملی صاحب یا مسئول ثبت لازم است. این کد در صفحه نمایش داده نمی‌شود."));

    var saved = read();
    var row = el("div", "melli-row");
    var inp = document.createElement("input");
    inp.type = "tel"; inp.inputMode = "numeric"; inp.maxLength = 10;
    inp.className = "melli-input";
    inp.placeholder = "کد ملی ۱۰ رقمی";
    inp.value = saved;
    var btn = el("button", "melli-btn", saved ? "ثبت‌شده ✓" : "ثبت"); btn.type = "button";
    if (saved) btn.classList.add("is-ok");

    btn.addEventListener("click", function () {
      if (!validMelli(inp.value)) {
        toast("کد ملی معتبر نیست؛ لطفاً دوباره بررسی کنید.");
        inp.classList.add("is-bad");
        setTimeout(function () { inp.classList.remove("is-bad"); }, 1200);
        return;
      }
      write(inp.value);
      btn.textContent = "ثبت‌شده ✓";
      btn.classList.add("is-ok");
      toast("کد ملی ثبت شد؛ پس از بررسی، نشان «تأییدشده» به کسب‌وکار اضافه می‌شود.");
    });

    row.appendChild(inp); row.appendChild(btn);
    sec.appendChild(row);
    return sec;
  }

  /* گزارش خطا برای کسب‌وکار */
  var BIZ_REPORT_TYPES = [
    "این کسب‌وکار تکراری است",
    "شماره تماس یا آدرس نادرست است",
    "تصویر نامناسب یا اشتباه است",
    "خدمات یا قیمت‌ها نادرست است",
    "محتوای توهین‌آمیز یا نامرتبط",
    "این کسب‌وکار دیگر فعال نیست"
  ];

  function reportRow(b) {
    var wrap = el("div", "bp-section bp-report");
    var btn = el("button", "report-error",
      '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 21V4h9l-1 3 1 3H5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg> گزارش خطا');
    btn.type = "button";
    btn.addEventListener("click", function () { openBizReport(b); });
    wrap.appendChild(btn);
    return wrap;
  }

  function openBizReport(b) {
    var back = el("div", "sheet-backdrop");
    var sheet = el("div", "biz-report-sheet");
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");

    var close = el("button", "report-close", '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>');
    close.type = "button";
    close.setAttribute("aria-label", "بستن");

    var form = el("form", "report-form");
    form.innerHTML =
      '<h3 class="report-title">گزارش خطا</h3>' +
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

  function ownerNote(b) {
    var KEY = "sog:bizNote";
    function read() { try { return (JSON.parse(localStorage.getItem(KEY)) || {})[b.id] || ""; } catch (e) { return ""; } }
    function write(v) {
      try {
        var m = JSON.parse(localStorage.getItem(KEY)) || {};
        if (v && v.trim()) m[b.id] = v; else delete m[b.id];
        localStorage.setItem(KEY, JSON.stringify(m));
      } catch (e) {}
    }

    var sec = el("div", "bp-section");
    sec.appendChild(el("h2", null, "توضیحات خدمات‌دهنده"));
    var ta = document.createElement("textarea");
    ta.className = "bp-note";
    ta.rows = 4;
    ta.placeholder = "توضیحات، شرایط کاری، تخفیف‌ها یا هر نکته‌ای که می‌خواهید مشتری‌ها ببینند…";
    ta.value = read();
    var status = el("p", "bp-note-status", "");
    var t;
    ta.addEventListener("input", function () {
      clearTimeout(t);
      status.textContent = "در حال ذخیره…";
      t = setTimeout(function () {
        write(ta.value);
        status.textContent = ta.value.trim() ? "ذخیره شد" : "";
        setTimeout(function () { if (status.textContent === "ذخیره شد") status.textContent = ""; }, 1800);
      }, 400);
    });
    sec.appendChild(ta); sec.appendChild(status);
    return sec;
  }

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function stars(n) { var s = ""; for (var i = 0; i < 5; i++) s += '<span style="opacity:' + (i < n ? 1 : .25) + '">' + STAR + '</span>'; return s; }

  Promise.all([
    fetch("data/businesses.json").then(function (r) { return r.json(); }),
    new Promise(function (r) { setTimeout(r, 350); })
  ]).then(function (res) {
    var biz = (res[0].businesses || []).filter(function (b) { return String(b.id) === String(id); })[0];
    if (!biz) { root.innerHTML = '<p style="text-align:center;padding:50px;color:#c66">کسب‌وکار یافت نشد.</p>'; return; }
    render(biz);
  }).catch(function (e) { root.innerHTML = '<p style="text-align:center;padding:50px;color:#c66">خطا در بارگذاری.</p>'; console.error(e); });

  var currentBiz = null;
  function render(b) {
    currentBiz = b;
    document.title = b.name + " | سوگ";
    root.innerHTML = "";

    // کاور + هدر
    var cover = el("section", "bp-cover");
    var top = el("div", "bp-top");
    var back = el("button", "round-btn", IC.back); back.setAttribute("aria-label", "بازگشت");
    back.addEventListener("click", function () { if (history.length > 1) history.back(); else location.href = "business.html"; });
    top.appendChild(el("a", "logo", '<img src="assets/img/logo.png" alt="سوگ">'));
    top.appendChild(back);
    cover.appendChild(top);
    root.appendChild(cover);

    var head = el("div", "bp-head");
    var logo = el("div", "bp-logo"); logo.style.backgroundImage = 'url("' + b.logo + '")';
    var hi = el("div", "bp-headinfo");
    hi.appendChild(el("div", "bp-name", esc(b.name) + " " + SogUtil.badge(b)));
    var sub = el("div", "bp-sub");
    sub.innerHTML = '<span class="bp-rating">' + STAR + " " + esc(b.rating) + ' <span style="color:var(--text-mute)">(' + esc(b.reviews) + ' نظر)</span></span>' +
      '<span class="dot"></span>' + esc(b.category_name) + '<span class="dot"></span>' + esc(b.city);
    hi.appendChild(sub);
    head.appendChild(logo); head.appendChild(hi);
    root.appendChild(head);

    // دکمه‌های عمل
    var actions = el("div", "bp-actions");
    var wa = el("a", "bp-wa", IC.wa + " واتساپ");
    wa.href = SogUtil.waLink(b.whatsapp || b.phone, "سلام، از طریق اپلیکیشن سوگ با شما تماس می‌گیرم. درباره‌ی خدمات «" + b.name + "» سوال داشتم.");
    wa.target = "_blank"; wa.rel = "noopener";
    var call = el("a", "bp-call", IC.call + " تماس"); call.href = "tel:" + SogUtil.toEn(b.phone);
    var map = el("a", "bp-map", IC.map + " مسیر"); map.href = "#map"; map.addEventListener("click", function (e) { e.preventDefault(); document.getElementById("map").scrollIntoView({ behavior: "smooth" }); });
    var saved = SogStore.isSaved(b.id);
    var save = el("button", "bp-save" + (saved ? " is-active" : ""), IC.bookmark(saved));
    save.addEventListener("click", function () { var now = SogStore.toggleSaved(b.id); save.innerHTML = IC.bookmark(now); save.classList.toggle("is-active", now); });
    actions.appendChild(wa); actions.appendChild(call); actions.appendChild(map); actions.appendChild(save);
    root.appendChild(actions);

    // درباره
    if (b.description) { var s1 = el("div", "bp-section"); s1.appendChild(el("h2", null, "درباره")); s1.appendChild(el("p", "bp-desc", esc(b.description))); root.appendChild(s1); }

    /* کادر توضیحات که خودِ خدمات‌دهنده می‌نویسد (فعلاً روی همین دستگاه ذخیره می‌شود) */
    root.appendChild(ownerNote(b));
    root.appendChild(ownerVerify(b));
    root.appendChild(reportRow(b));

    // ساعات کاری
    if (b.hours) { var s2 = el("div", "bp-section"); s2.appendChild(el("h2", null, "ساعات کاری")); s2.appendChild(el("div", "bp-hours", '<span class="ico">' + IC.clock + '</span>' + esc(b.hours))); root.appendChild(s2); }

    // خدمات
    if (b.services && b.services.length) {
      var s3 = el("div", "bp-section"); s3.appendChild(el("h2", null, "خدمات و قیمت"));
      var wrap = el("div", "bp-services");
      b.services.forEach(function (sv) { wrap.appendChild(el("span", "svc", esc(sv))); });
      s3.appendChild(wrap);
      s3.appendChild(el("p", "bp-desc", "شروع قیمت: " + esc(b.price_from)));
      root.appendChild(s3);
    }

    // گالری نمونه‌کار
    if (b.gallery && b.gallery.length) {
      var s4 = el("div", "bp-section"); s4.appendChild(el("h2", null, "نمونه‌کارها"));
      var g = el("div", "bp-gallery");
      b.gallery.forEach(function (src) { var it = el("div", "g"); it.style.backgroundImage = 'url("' + src + '")'; g.appendChild(it); });
      s4.appendChild(g); root.appendChild(s4);
    }

    // نقشه و آدرس
    var s5 = el("div", "bp-section"); s5.id = "map"; s5.appendChild(el("h2", null, "آدرس و نقشه"));
    var m = el("div", "bp-map-img"); m.style.backgroundImage = 'url("assets/img/map.svg")';
    s5.appendChild(m);
    if (b.address) s5.appendChild(el("div", "bp-address", IC.pin + " " + esc(b.address)));
    root.appendChild(s5);

    // نظرات
    if (b.reviews_list && b.reviews_list.length) {
      var s6 = el("div", "bp-section"); s6.appendChild(el("h2", null, "نظرات مشتریان"));
      var sum = el("div", "bp-rev-summary");
      sum.innerHTML = '<div class="bp-rev-big">' + esc(b.rating) + '</div>' +
        '<div><div class="bp-rev-stars">' + stars(Math.round(parseFloat(SogUtil.toEn(b.rating)))) + '</div>' +
        '<div class="bp-rev-count">' + esc(b.reviews) + ' نظر ثبت‌شده</div></div>';
      s6.appendChild(sum);
      b.reviews_list.forEach(function (r) {
        var rv = el("div", "review");
        rv.innerHTML = '<div class="review-head"><span class="review-name">' + esc(r.name) + '</span><span class="review-stars">' + stars(r.rating) + '</span></div>' +
          '<p class="review-text">' + esc(r.text) + '</p><span class="review-date">' + esc(r.date) + '</span>';
        s6.appendChild(rv);
      });
      root.appendChild(s6);
    }

    // نوار ثابت پایین
    var cta = el("div", "bp-cta");
    var order = el("button", "btn-order", IC.cart + " سفارش سریع");
    order.addEventListener("click", function () { openOrder(b); });
    cta.appendChild(order);
    document.body.appendChild(cta);
  }

  /* ---------- بۀ‌شیت سفارش (ارسال به واتساپ) ---------- */
  var sheet = document.getElementById("orderSheet");
  var backdrop = document.getElementById("sheetBackdrop");
  var formHTML = document.getElementById("orderForm").outerHTML;

  function openOrder(b) {
    document.getElementById("sheetTitle").textContent = "سفارش سریع — " + b.name;
    var success = sheet.querySelector(".order-success"); if (success) success.outerHTML = formHTML;
    var sel = document.getElementById("orderService"); sel.innerHTML = "";
    (b.services || ["خدمت"]).forEach(function (s) { var o = document.createElement("option"); o.textContent = s; o.value = s; sel.appendChild(o); });
    sheet.hidden = false; backdrop.hidden = false; document.body.style.overflow = "hidden";
  }
  function closeOrder() { sheet.hidden = true; backdrop.hidden = true; document.body.style.overflow = ""; }
  document.getElementById("sheetClose").addEventListener("click", closeOrder);
  backdrop.addEventListener("click", closeOrder);

  sheet.addEventListener("submit", function (e) {
    if (!e.target.matches("#orderForm")) return;
    e.preventDefault();
    var fd = new FormData(e.target);
    var msg = "سلام، سفارش از اپلیکیشن سوگ:\n" +
      "• خدمت: " + fd.get("service") + "\n" +
      "• نام: " + fd.get("name") + "\n" +
      "• تماس: " + fd.get("phone") + "\n" +
      (fd.get("note") ? "• توضیحات: " + fd.get("note") + "\n" : "") +
      "کسب‌وکار: " + currentBiz.name;
    var link = SogUtil.waLink(currentBiz.whatsapp || currentBiz.phone, msg);
    // پیام موفقیت + باز کردن واتساپ
    e.target.replaceWith(el("div", "order-success",
      '<div class="ok-ico"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<p>در حال انتقال به واتساپ برای ارسال سفارش به «' + esc(currentBiz.name) + '»…</p>'));
    window.open(link, "_blank");
    setTimeout(closeOrder, 2200);
  });

  if ("serviceWorker" in navigator) window.addEventListener("load", function () { navigator.serviceWorker.register("service-worker.js").catch(function () {}); });
})();
