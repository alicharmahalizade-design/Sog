/* پنل کاربری سوگ — داشبورد کامل روی داده‌ی محلی.
   در نسخه‌ی وردپرس با حساب کاربری/REST جایگزین می‌شود. */
(function () {
  "use strict";
  var root = document.getElementById("account");
  var LISTINGS = [];

  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var IC = {
    listing: 'M4 5h16v14H4zM4 9h16M8 13h8M8 16h5',
    saved: 'M6 3h12v18l-6-4-6 4V3z',
    follow: 'M12 21s-7-4.5-7-10a4 4 0 017-2.6A4 4 0 0119 11c0 5.5-7 10-7 10z',
    order: 'M6 6h15l-1.5 9h-12zM6 6L5 3H2',
    candle: 'M12 3c1.6 2 1.4 3.4 0 4.4M9.5 8.5h5v11h-5z',
    biz: 'M4 9l1-4h14l1 4M5 9v10h14V9',
    bell: 'M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6M10 21h4',
    lock: 'M6 10V8a6 6 0 1112 0v2M5 10h14v11H5z',
    support: 'M12 3a9 9 0 00-9 9v5a2 2 0 002 2h1v-6H5a7 7 0 0114 0h-1v6h1a2 2 0 002-2v-5a9 9 0 00-9-9z',
    edit: 'M4 20l4-1 11-11-3-3L5 16z',
    logout: 'M15 4h4v16h-4M11 8l-4 4 4 4M7 12h10',
    chev: 'M15 5l-7 7 7 7'
  };
  function svg(path, w) { w = w || 20; return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

  fetch("data/listings.json").then(function (r) { return r.json(); }).then(function (d) {
    LISTINGS = d.listings || [];
  }).catch(function () {}).then(render);

  function render() {
    root.innerHTML = "";
    var user = SogStore.getUser();
    root.appendChild(profileCard(user));
    root.appendChild(statsRow());
    root.appendChild(quickActions());
    root.appendChild(sectionTitle("آگهی‌ها و فعالیت‌های من"));
    root.appendChild(menuList([
      { icon: IC.listing, label: "آگهی‌های من", badge: "۰", onClick: function () { toast("هنوز آگهی ثبت نکرده‌اید."); } },
      { icon: IC.saved, label: "ذخیره‌شده‌ها", badge: faNum(SogStore.getSaved().length), href: "index.html?view=saved" },
      { icon: IC.follow, label: "دنبال‌شده‌ها", badge: faNum(SogStore.getFollows().length), onClick: showFollowed },
      { icon: IC.order, label: "سفارش‌های من", onClick: function () { toast("سفارشی ثبت نشده است."); } }
    ]));
    root.appendChild(sectionTitle("تنظیمات"));
    root.appendChild(prefsList());
    root.appendChild(menuList([
      { icon: IC.biz, label: "ثبت کسب‌وکار در سوگ", href: "business.html" },
      { icon: IC.support, label: "پشتیبانی", onClick: contactSupport }
    ]));
    if (user) root.appendChild(logoutBtn());
    root.appendChild(el("p", "acc-version", "سوگ — نسخه‌ی پیش‌نمایش"));
  }

  /* پروفایل */
  function profileCard(user) {
    var card = el("div", "profile-card");
    var avatar = el("div", "profile-avatar", svg("M12 8m-4 0a4 4 0 108 0a4 4 0 10-8 0M4 21c0-4 3.5-7 8-7s8 3 8 7", 40));
    var info = el("div", "profile-info");
    if (user) {
      info.appendChild(el("div", "profile-name", esc(user.name || "کاربر سوگ")));
      info.appendChild(el("div", "profile-phone", esc(user.phone || "")));
      var edit = el("button", "profile-edit", svg(IC.edit, 16) + " ویرایش");
      edit.addEventListener("click", function () { openLogin(true); });
      info.appendChild(edit);
    } else {
      info.appendChild(el("div", "profile-name", "مهمان"));
      info.appendChild(el("div", "profile-phone", "برای مدیریت آگهی‌ها وارد شوید"));
      var login = el("button", "profile-login", "ورود / ثبت‌نام");
      login.addEventListener("click", function () { openLogin(false); });
      info.appendChild(login);
    }
    card.appendChild(avatar); card.appendChild(info);
    return card;
  }

  /* آمار */
  function statsRow() {
    var row = el("div", "stats-row");
    var salavat = 0; try { var m = JSON.parse(localStorage.getItem("sog:salavat")) || {}; Object.keys(m).forEach(function (k) { salavat += m[k]; }); } catch (e) {}
    [
      { n: SogStore.getSaved().length, l: "ذخیره" },
      { n: SogStore.getFollows().length, l: "دنبال‌شده" },
      { n: 0, l: "آگهی من" },
      { n: salavat, l: "شمع" }
    ].forEach(function (s) {
      var b = el("div", "stat-box");
      b.appendChild(el("div", "stat-n", faNum(s.n)));
      b.appendChild(el("div", "stat-l", s.l));
      row.appendChild(b);
    });
    return row;
  }

  /* اکشن سریع */
  function quickActions() {
    var wrap = el("div", "quick-actions");
    var reg = el("a", "qa-btn qa-primary", '<span class="qa-ic">' + svg("M12 5v14M5 12h14", 22) + '</span><span>ثبت سوگ جدید</span>');
    reg.href = "register.html";
    var biz = el("a", "qa-btn", '<span class="qa-ic">' + svg(IC.biz, 22) + '</span><span>ثبت کسب‌وکار</span>');
    biz.href = "business.html";
    wrap.appendChild(reg); wrap.appendChild(biz);
    return wrap;
  }

  function sectionTitle(t) { return el("h2", "acc-section-title", t); }

  function menuList(items) {
    var list = el("div", "acc-menu");
    items.forEach(function (it) {
      var row = it.href ? el("a", "acc-row") : el("button", "acc-row");
      if (it.href) row.href = it.href; else row.type = "button";
      row.innerHTML = '<span class="ar-ic">' + svg(it.icon) + '</span><span class="ar-label">' + esc(it.label) + '</span>' +
        (it.badge != null ? '<span class="ar-badge">' + esc(it.badge) + '</span>' : '') +
        '<span class="ar-go">' + svg(IC.chev, 18) + '</span>';
      if (it.onClick) row.addEventListener("click", it.onClick);
      list.appendChild(row);
    });
    return list;
  }

  /* تنظیمات با کلید */
  function prefsList() {
    var prefs = SogStore.getPrefs();
    var list = el("div", "acc-menu");
    list.appendChild(toggleRow(IC.bell, "اعلان مراسم‌ها و یادآوری‌ها", "notify", prefs.notify));
    list.appendChild(toggleRow(IC.lock, "حالت حریم خصوصی (پنهان‌کردن شماره)", "privacy", prefs.privacy));
    return list;
  }
  function toggleRow(icon, label, key, on) {
    var row = el("div", "acc-row");
    row.innerHTML = '<span class="ar-ic">' + svg(icon) + '</span><span class="ar-label">' + esc(label) + '</span>';
    var sw = el("button", "switch" + (on ? " on" : ""));
    sw.type = "button"; sw.setAttribute("aria-pressed", on ? "true" : "false");
    sw.innerHTML = '<span class="knob"></span>';
    sw.addEventListener("click", function () {
      on = !on; sw.classList.toggle("on", on); sw.setAttribute("aria-pressed", on ? "true" : "false");
      SogStore.setPref(key, on);
    });
    row.appendChild(sw);
    return row;
  }

  function logoutBtn() {
    var b = el("button", "acc-logout", svg(IC.logout) + " خروج از حساب");
    b.addEventListener("click", function () { SogStore.clearUser(); render(); toast("از حساب خارج شدید."); });
    return b;
  }

  /* دنبال‌شده‌ها به‌صورت لیست */
  function showFollowed() {
    var ids = SogStore.getFollows();
    if (!ids.length) { toast("موردی دنبال نکرده‌اید."); return; }
    var items = LISTINGS.filter(function (l) { return ids.indexOf(l.id) !== -1; });
    var body = el("div");
    body.appendChild(el("div", "login-title", "دنبال‌شده‌ها"));
    items.forEach(function (l) {
      var a = el("a", "mini-listing");
      a.href = "listing.html?id=" + l.id;
      a.innerHTML = '<span class="ml-photo" style="background-image:url(&quot;' + l.photo + '&quot;)"></span>' +
        '<span class="ml-info"><span class="ml-name">' + esc(l.deceased_name) + '</span><span class="ml-sub">' + esc(l.city) + ' • ' + esc(l.event_date_jalali) + '</span></span>';
      body.appendChild(a);
    });
    openSheet(body);
  }

  /* ورود (OTP نمونه) */
  function openLogin(editing) {
    var body = document.getElementById("loginBody");
    var step = 1, phoneVal = "";
    var u = SogStore.getUser() || {};
    function paintPhone() {
      body.innerHTML = "";
      body.appendChild(el("div", "login-title", editing ? "ویرایش پروفایل" : "ورود / ثبت‌نام"));
      body.appendChild(el("p", "login-hint", editing ? "نام و شماره‌ی خود را ویرایش کنید." : "شماره موبایل خود را وارد کنید تا کد تأیید ارسال شود."));
      var name = el("input", "login-input"); name.placeholder = "نام و نام خانوادگی"; name.value = u.name || ""; name.id = "lgName";
      var phone = el("input", "login-input"); phone.placeholder = "۰۹…"; phone.type = "tel"; phone.value = u.phone || ""; phone.id = "lgPhone";
      body.appendChild(name); body.appendChild(phone);
      var btn = el("button", "login-btn", editing ? "ذخیره" : "دریافت کد تأیید");
      btn.addEventListener("click", function () {
        phoneVal = phone.value; u.name = name.value; u.phone = phone.value;
        if (editing) { SogStore.setUser(u); closeSheet(); render(); toast("پروفایل ذخیره شد."); }
        else { step = 2; paintCode(); }
      });
      body.appendChild(btn);
    }
    function paintCode() {
      body.innerHTML = "";
      body.appendChild(el("div", "login-title", "کد تأیید"));
      body.appendChild(el("p", "login-hint", "کد پیامک‌شده به " + esc(phoneVal || "شماره‌ی شما") + " را وارد کنید. (نمونه: هر کدی را بزنید)"));
      var code = el("input", "login-input otp"); code.placeholder = "- - - - -"; code.inputMode = "numeric"; code.maxLength = 5;
      body.appendChild(code);
      var btn = el("button", "login-btn", "ورود");
      btn.addEventListener("click", function () {
        SogStore.setUser({ name: u.name || "کاربر سوگ", phone: u.phone || phoneVal });
        closeSheet(); render(); toast("خوش آمدید 🌿");
      });
      body.appendChild(btn);
      var back = el("button", "login-back", "تغییر شماره");
      back.addEventListener("click", paintPhone);
      body.appendChild(back);
    }
    paintPhone();
    openSheet();
  }

  /* بۀ‌شیت عمومی */
  var sheet = document.getElementById("loginSheet"), backdrop = document.getElementById("loginBackdrop"), body = document.getElementById("loginBody");
  function openSheet(node) { if (node) { body.innerHTML = ""; body.appendChild(node); } sheet.hidden = false; backdrop.hidden = false; document.body.style.overflow = "hidden"; }
  function closeSheet() { sheet.hidden = true; backdrop.hidden = true; document.body.style.overflow = ""; }
  backdrop.addEventListener("click", closeSheet);

  function contactSupport() {
    if (window.SogUtil) location.href = SogUtil.waLink("۰۹۱۲۰۰۰۰۰۰۰", "سلام، درباره‌ی اپلیکیشن سوگ سوال داشتم.");
    else toast("پشتیبانی: ۰۹۱۲۰۰۰۰۰۰۰");
  }

  /* توست */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", "toast"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
})();
