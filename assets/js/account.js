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
    chev: 'M15 5l-7 7 7 7',
    check: 'M20 6L9 17l-5-5'
  };
  function svg(path, w) { w = w || 20; return '<svg viewBox="0 0 24 24" width="' + w + '" height="' + w + '"><path d="' + path + '" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }

  fetch("data/listings.json").then(function (r) { return r.json(); }).then(function (d) {
    LISTINGS = d.listings || [];
  }).catch(function () {}).then(render);

  function render() {
    root.innerHTML = "";
    var user = SogStore.getUser();
    root.appendChild(profileCard(user));
    root.appendChild(sectionTitle("فعالیت‌های من"));
    root.appendChild(activityList());
    root.appendChild(sectionTitle("تنظیمات"));
    root.appendChild(settingsList(user));
    root.appendChild(el("p", "acc-version", "سوگ — نسخه‌ی پیش‌نمایش"));
  }

  /* ---------- فعالیت‌های من: چهار ردیف آکاردئونی با شمارنده ---------- */
  function activityList() {
    var box = el("div", "acc-menu");

    box.appendChild(accRow("ذخیره‌شده‌ها", savedItems(), function (it) {
      return { title: it.deceased_name, sub: it.city, photo: it.photo, href: "listing.html?id=" + it.id,
        onRemove: function () { SogStore.toggleSaved(it.id); } };
    }, "هنوز آگهی‌ای ذخیره نکرده‌اید."));

    box.appendChild(accRow("همدردی‌های من", myCondolences(), function (c) {
      var bits = [];
      if (c.candles) bits.push(faNum(c.candles) + " شمع");
      if (c.messages) bits.push(faNum(c.messages) + " پیام");
      if (c.city) bits.push(c.city);
      return { title: c.name, sub: bits.join(" • "), photo: c.photo, href: "listing.html?id=" + c.id };
    }, "هنوز در آگهی‌ای همدردی ثبت نکرده‌اید."));

    box.appendChild(accRow("آگهی‌های من", myListingItems(), function (it) {
      return { title: it.deceased_name, sub: it.city, photo: it.photo,
        href: it.id ? "listing.html?id=" + it.id : null };
    }, "هنوز آگهی ثبت نکرده‌اید."));

    box.appendChild(accRow("سفارش‌های من", myOrders(), function (o) {
      return { title: o.business, sub: (o.service || "") + (o.date ? " • " + o.date : ""), photo: o.logo,
        onRemove: function () { removeOrder(o); } };
    }, "سفارشی ثبت نشده است."));

    return box;
  }

  /* یک ردیف آکاردئونی با شمارنده و فهرست بازشو */
  function accRow(label, items, mapItem, emptyText) {
    var wrap = el("div", "acc-item");

    var head = el("button", "acc-row"); head.type = "button";
    head.setAttribute("aria-expanded", "false");
    head.innerHTML = '<span class="ar-label">' + esc(label) + '</span>' +
      '<span class="ar-count">' + faNum(items.length) + '</span>' +
      '<span class="ar-chev">' + svg("M6 9l6 6 6-6", 20) + '</span>';

    var body = el("div", "acc-body");

    if (!items.length) {
      body.appendChild(el("p", "acc-empty-row", esc(emptyText)));
    } else {
      items.forEach(function (raw) {
        var it = mapItem(raw);
        var row = it.href ? el("a", "acc-sub") : el("div", "acc-sub");
        if (it.href) row.href = it.href;

        var ph = el("span", "acc-sub-photo");
        if (it.photo) ph.style.backgroundImage = 'url("' + it.photo + '")';
        row.appendChild(ph);

        var info = el("span", "acc-sub-info");
        info.appendChild(el("span", "acc-sub-title", esc(it.title || "بدون عنوان")));
        if (it.sub) info.appendChild(el("span", "acc-sub-meta", esc(it.sub)));
        row.appendChild(info);

        if (it.onRemove) {
          var x = el("button", "acc-sub-x", "×"); x.type = "button";
          x.setAttribute("aria-label", "حذف");
          x.addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation();
            it.onRemove();
            render();
          });
          row.appendChild(x);
        }
        body.appendChild(row);
      });
    }

    head.addEventListener("click", function () {
      var open = wrap.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    });

    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  }

  /* ---------- داده‌های هر بخش ---------- */
  function savedItems() {
    var ids = SogStore.getSaved();
    return LISTINGS.filter(function (l) { return ids.indexOf(l.id) !== -1; });
  }

  function myListingItems() {
    return myListings().map(function (rawId) {
      var item = LISTINGS.filter(function (l) { return String(l.id) === String(rawId); })[0];
      return item || { id: null, deceased_name: "آگهی ثبت‌شده", city: "در انتظار انتشار", photo: "" };
    });
  }

  function myOrders() {
    try { return JSON.parse(localStorage.getItem("sog:orders")) || []; }
    catch (e) { return []; }
  }

  function removeOrder(o) {
    var all = myOrders();
    var i = all.indexOf(o);
    if (i === -1) i = all.findIndex(function (x) { return x.at === o.at; });
    if (i !== -1) all.splice(i, 1);
    try { localStorage.setItem("sog:orders", JSON.stringify(all)); } catch (e) {}
  }

  /* ---------- تنظیمات ---------- */
  function settingsList(user) {
    var prefs = SogStore.getPrefs();
    var list = el("div", "acc-menu");
    list.appendChild(notifyRow(prefs.notify));

    var sup = el("button", "acc-row"); sup.type = "button";
    sup.innerHTML = '<span class="ar-ic">' + svg(IC.support) + '</span>' +
      '<span class="ar-label">پشتیبانی</span><span class="ar-chev">' + svg(IC.chev, 18) + '</span>';
    sup.addEventListener("click", contactSupport);
    list.appendChild(sup);

    var out = el("button", "acc-row is-danger"); out.type = "button";
    out.innerHTML = '<span class="ar-ic">' + svg(IC.logout) + '</span>' +
      '<span class="ar-label">خروج از حساب</span><span class="ar-chev">' + svg(IC.chev, 18) + '</span>';
    out.addEventListener("click", function () {
      confirmDialog("خروج از حساب", "می‌خواهید از حساب کاربری خارج شوید؟", function () {
        SogStore.clearUser(); render(); toast("از حساب خارج شدید.");
      });
    });
    list.appendChild(out);

    return list;
  }

  /* پروفایل */
  /* عکس پروفایل: انتخاب از گالری و ذخیره روی همین دستگاه */
  function avatarPicker(user) {
    var AV_KEY = "sog:avatar";
    function read() { try { return localStorage.getItem(AV_KEY) || ""; } catch (e) { return ""; } }
    function write(v) { try { if (v) localStorage.setItem(AV_KEY, v); else localStorage.removeItem(AV_KEY); } catch (e) {} }

    var box = el("label", "profile-avatar");
    box.setAttribute("aria-label", "تغییر عکس پروفایل");
    var input = document.createElement("input");
    input.type = "file"; input.accept = "image/png,image/jpeg"; input.hidden = true;

    function paint() {
      var src = read();
      box.innerHTML = "";
      if (src) {
        var img = el("img", "avatar-img"); img.src = src; img.alt = "";
        box.appendChild(img);
      } else {
        box.insertAdjacentHTML("beforeend", svg("M12 8m-4 0a4 4 0 108 0a4 4 0 10-8 0M4 21c0-4 3.5-7 8-7s8 3 8 7", 40));
      }
      box.appendChild(el("span", "avatar-cam", svg("M3 7h4l1.5-2.5h7L17 7h4v13H3zM12 12.5m-3.2 0a3.2 3.2 0 106.4 0a3.2 3.2 0 10-6.4 0", 14)));
      box.appendChild(input);
    }

    input.addEventListener("change", function () {
      var f = input.files && input.files[0];
      if (!f) return;
      if (f.size > 4 * 1024 * 1024) { toast("حجم تصویر باید کمتر از ۴ مگابایت باشد."); input.value = ""; return; }
      var rd = new FileReader();
      rd.onload = function () {
        /* تصویر به مربع ۲۵۶ پیکسلی کوچک می‌شود تا حافظه‌ی مرورگر پر نشود */
        var im = new Image();
        im.onload = function () {
          var S = 256, c = document.createElement("canvas");
          c.width = S; c.height = S;
          var x = c.getContext("2d");
          var side = Math.min(im.width, im.height);
          x.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, S, S);
          write(c.toDataURL("image/jpeg", 0.85));
          paint();
          toast("عکس پروفایل به‌روزرسانی شد.");
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(f);
      input.value = "";
    });

    paint();
    return box;
  }

  function profileCard(user) {
    var card = el("div", "profile-card");
    var avatar = avatarPicker(user);
    var info = el("div", "profile-info");
    if (user) {
      info.appendChild(el("div", "profile-name", esc(user.name || "کاربر سوگ")));
      info.appendChild(el("div", "profile-phone", esc(faNum(user.phone || ""))));
      /* نشان تأیید هویت و دکمه‌ی ویرایش در یک خط و هم‌تراز */
      var foot = el("div", "profile-foot");
      if (user.verified && validMelli(user.melli)) {
        foot.appendChild(el("span", "profile-verified",
          '<span class="pv-tick">' + svg(IC.check, 13) + '</span><span>تأیید هویت شده</span>'));
      }
      var edit = el("button", "profile-edit", svg(IC.edit, 16) + " ویرایش");
      edit.addEventListener("click", function () { openLogin(true); });
      foot.appendChild(edit);
      info.appendChild(foot);
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
  /* همدردی‌های کاربر: شمع/صلوات و پیام‌های دفتر یادبود، به تفکیک آگهی */
  function myCondolences() {
    var salavat = {}, guest = {};
    try { salavat = JSON.parse(localStorage.getItem("sog:salavat")) || {}; } catch (e) {}
    try { guest = JSON.parse(localStorage.getItem("sog:guest")) || {}; } catch (e) {}

    var ids = [];
    Object.keys(salavat).forEach(function (k) { if (salavat[k] > 0 && ids.indexOf(k) === -1) ids.push(k); });
    Object.keys(guest).forEach(function (k) { if ((guest[k] || []).length && ids.indexOf(k) === -1) ids.push(k); });

    return ids.map(function (k) {
      var item = LISTINGS.filter(function (l) { return String(l.id) === String(k); })[0];
      return {
        id: k,
        name: item ? item.deceased_name : "آگهی #" + k,
        city: item ? item.city : "",
        photo: item ? item.photo : "",
        candles: salavat[k] || 0,
        messages: (guest[k] || []).length
      };
    }).sort(function (a, b) { return (b.candles + b.messages) - (a.candles + a.messages); });
  }

  function statsRow() {
    var row = el("div", "stats-row");
    var conds = myCondolences();
    var salavat = conds.reduce(function (n, c) { return n + c.candles; }, 0);
    [
      { n: SogStore.getSaved().length, l: "ذخیره" },
      { n: SogStore.getFollows().length, l: "دنبال‌شده" },
      { n: conds.length, l: "همدردی", go: "condSection" },
      { n: salavat, l: "تسلیت", go: "condSection" }
    ].forEach(function (s) {
      var b = el("div", "stat-box" + (s.go ? " is-link" : ""));
      b.appendChild(el("div", "stat-n", faNum(s.n)));
      b.appendChild(el("div", "stat-l", s.l));
      if (s.go) {
        b.setAttribute("role", "button");
        b.setAttribute("tabindex", "0");
        b.addEventListener("click", function () {
          var t = document.getElementById(s.go);
          if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      row.appendChild(b);
    });
    return row;
  }

  /* فهرست آگهی‌هایی که کاربر در آن‌ها همدردی ثبت کرده */
  function condolenceSection() {
    var wrap = el("section", "cond-list");
    wrap.id = "condSection";
    var items = myCondolences();

    if (!items.length) {
      wrap.appendChild(el("p", "cond-empty", "هنوز در هیچ آگهی‌ای شمع روشن نکرده یا پیام همدردی نگذاشته‌اید."));
      return wrap;
    }

    items.forEach(function (c) {
      var a = el("a", "cond-item");
      a.href = "listing.html?id=" + encodeURIComponent(c.id);
      var ph = el("span", "cond-photo");
      if (c.photo) ph.style.backgroundImage = 'url("' + c.photo + '")';
      var info = el("span", "cond-info");
      info.appendChild(el("span", "cond-name", esc(c.name)));
      var bits = [];
      if (c.candles) bits.push(faNum(c.candles) + " شمع");
      if (c.messages) bits.push(faNum(c.messages) + " پیام همدردی");
      if (c.city) bits.push(esc(c.city));
      info.appendChild(el("span", "cond-meta", bits.join(" • ")));
      a.appendChild(ph); a.appendChild(info);
      a.appendChild(el("span", "cond-chev", svg(IC.chev, 18)));
      wrap.appendChild(a);
    });
    return wrap;
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
    /* پشتیبانی در همین کادر تا کادر جداگانه‌ی خالی نداشته باشیم */
    var sup = el("button", "acc-row");
    sup.type = "button";
    sup.innerHTML = '<span class="ar-ic">' + svg(IC.support) + '</span><span class="ar-label">پشتیبانی</span><span class="ar-chev">' + svg(IC.chev, 18) + '</span>';
    sup.addEventListener("click", contactSupport);
    list.appendChild(sup);
    return list;
  }
  /* ردیف اعلان: کلید همگانی + فهرست بازشوی یادآوری‌های ثبت‌شده */
  function notifyRow(on) {
    var wrap = el("div", "acc-item");
    var rems = remindersList();

    var head = el("div", "acc-row"); head.setAttribute("role", "button");
    head.setAttribute("aria-expanded", "false"); head.tabIndex = 0;
    head.innerHTML = '<span class="ar-ic">' + svg(IC.bell) + '</span>' +
      '<span class="ar-label">اعلان و یادآوری‌های مراسمات</span>' +
      '<span class="ar-count">' + faNum(rems.length) + '</span>';

    var sw = el("button", "switch" + (on ? " on" : ""));
    sw.type = "button"; sw.setAttribute("aria-pressed", on ? "true" : "false");
    sw.setAttribute("aria-label", "اعلان همگانی");
    sw.innerHTML = '<span class="knob"></span>';
    sw.addEventListener("click", function (e) {
      e.stopPropagation();
      on = !on; sw.classList.toggle("on", on); sw.setAttribute("aria-pressed", on ? "true" : "false");
      SogStore.setPref("notify", on);
      wrap.classList.toggle("notify-off", !on);
      toast(on ? "اعلان‌ها روشن شد." : "همه‌ی اعلان‌ها خاموش شد.");
    });
    head.appendChild(sw);
    head.insertAdjacentHTML("beforeend", '<span class="ar-chev">' + svg("M6 9l6 6 6-6", 20) + '</span>');

    var body = el("div", "acc-body");
    if (!rems.length) {
      body.appendChild(el("p", "acc-empty-row", "هنوز برای مراسمی یادآوری ثبت نکرده‌اید. در صفحه‌ی هر آگهی دکمه‌ی «یادآوری مراسم» را بزنید."));
    } else {
      body.appendChild(el("p", "acc-subs-note", "یادآوری هر آگهی را می‌توانید جداگانه خاموش کنید."));
      rems.forEach(function (r) {
        var row = el("div", "acc-sub");

        var link = el("a", "acc-sub-link");
        link.href = "listing.html?id=" + r.id;
        var ph = el("span", "acc-sub-photo");
        if (r.photo) ph.style.backgroundImage = 'url("' + r.photo + '")';
        link.appendChild(ph);
        var info = el("span", "acc-sub-info");
        info.appendChild(el("span", "acc-sub-title", esc(r.name || "آگهی سوگ")));
        info.appendChild(el("span", "acc-sub-meta", esc([r.title, r.date].filter(Boolean).join(" • "))));
        link.appendChild(info);
        row.appendChild(link);

        var one = el("button", "switch sm" + (r.on ? " on" : ""));
        one.type = "button"; one.setAttribute("aria-pressed", r.on ? "true" : "false");
        one.setAttribute("aria-label", "یادآوری " + (r.name || ""));
        one.innerHTML = '<span class="knob"></span>';
        one.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          r.on = !r.on;
          one.classList.toggle("on", r.on);
          one.setAttribute("aria-pressed", r.on ? "true" : "false");
          SogStore.setReminderOn(r.key, r.on);
          toast(r.on ? "یادآوری این مراسم روشن شد." : "یادآوری این مراسم خاموش شد.");
        });
        row.appendChild(one);

        var x = el("button", "acc-sub-x", "×"); x.type = "button";
        x.setAttribute("aria-label", "حذف یادآوری");
        x.addEventListener("click", function (e) {
          e.preventDefault(); e.stopPropagation();
          SogStore.removeReminder(r.key); render();
        });
        row.appendChild(x);

        body.appendChild(row);
      });
    }

    function toggleOpen() {
      var open = wrap.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open ? "true" : "false");
    }
    head.addEventListener("click", toggleOpen);
    head.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleOpen(); }
    });

    if (!on) wrap.classList.add("notify-off");
    wrap.appendChild(head); wrap.appendChild(body);
    return wrap;
  }

  /* یادآوری‌های ثبت‌شده، تازه‌ترین اول */
  function remindersList() {
    var all = (SogStore.getReminders && SogStore.getReminders()) || {};
    return Object.keys(all).map(function (k) { return all[k]; })
      .sort(function (a, b) { return (b.at || 0) - (a.at || 0); });
  }

  /* اعتبارسنجی کد ملی ایرانی (رقم کنترل) */
  function validMelli(code) {
    code = String(code == null ? "" : code);
    if (window.SogUtil) code = SogUtil.toEn(code);
    code = code.replace(/[^0-9]/g, "");
    if (!/^\d{10}$/.test(code) || /^(\d)\1{9}$/.test(code)) return false;
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += parseInt(code[i], 10) * (10 - i);
    var r = sum % 11, c = parseInt(code[9], 10);
    return (r < 2 && c === r) || (r >= 2 && c === 11 - r);
  }

  /* پاپ‌آپ تأیید با «بله / خیر» */
  function confirmDialog(title, text, onYes) {
    var back = el("div", "confirm-backdrop");
    var box = el("div", "confirm-box");
    box.appendChild(el("h3", "confirm-title", esc(title)));
    box.appendChild(el("p", "confirm-text", esc(text)));
    var row = el("div", "confirm-btns");
    var no = el("button", "confirm-btn no", "خیر"); no.type = "button";
    var yes = el("button", "confirm-btn yes", "بله"); yes.type = "button";
    row.appendChild(yes); row.appendChild(no);
    box.appendChild(row);
    back.appendChild(box);
    document.body.appendChild(back);
    document.body.style.overflow = "hidden";
    function close() {
      back.classList.remove("is-in");
      document.body.style.overflow = "";
      setTimeout(function () { if (back.parentNode) back.remove(); }, 200);
    }
    no.addEventListener("click", close);
    back.addEventListener("click", function (e) { if (e.target === back) close(); });
    yes.addEventListener("click", function () { close(); onYes(); });
    requestAnimationFrame(function () { back.classList.add("is-in"); });
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

  /* آگهی‌هایی که خودِ کاربر ثبت کرده */
  function myListings() {
    try { return JSON.parse(localStorage.getItem("sog:myListings")) || []; }
    catch (e) { return []; }
  }

  function showMyListings() {
    var ids = myListings();
    if (!ids.length) { toast("هنوز آگهی ثبت نکرده‌اید."); return; }
    var body = el("div");
    body.appendChild(el("div", "login-title", "آگهی‌های من"));
    ids.forEach(function (rawId) {
      var item = LISTINGS.filter(function (l) { return String(l.id) === String(rawId); })[0];
      if (item) {
        var a = el("a", "mini-listing");
        a.href = "listing.html?id=" + item.id;
        a.innerHTML = '<span class="ml-photo" style="background-image:url(\'' + esc(item.photo) + '\')"></span>' +
          '<span class="ml-info"><span class="ml-name">' + esc(item.deceased_name) + '</span>' +
          '<span class="ml-meta">' + esc(item.city || "") + '</span></span>';
        body.appendChild(a);
      } else {
        /* آگهی‌های ثبت‌شده‌ای که هنوز منتشر نشده‌اند */
        var row = el("div", "mini-listing is-pending");
        row.innerHTML = '<span class="ml-photo"></span><span class="ml-info">' +
          '<span class="ml-name">آگهی ثبت‌شده</span>' +
          '<span class="ml-meta">در انتظار انتشار</span></span>';
        body.appendChild(row);
      }
    });
    openSheet(body);
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
      var melli = el("input", "login-input"); melli.placeholder = "کد ملی ۱۰ رقمی (برای تأیید هویت)";
      melli.type = "tel"; melli.inputMode = "numeric"; melli.maxLength = 10; melli.value = u.melli || ""; melli.id = "lgMelli";
      body.appendChild(name); body.appendChild(phone); body.appendChild(melli);
      var btn = el("button", "login-btn", editing ? "ذخیره" : "دریافت کد تأیید");
      btn.addEventListener("click", function () {
        phoneVal = phone.value; u.name = name.value; u.phone = phone.value;
        var mv = SogUtil ? SogUtil.toEn(melli.value).replace(/[^0-9]/g, "") : melli.value;
        if (mv) {
          if (!validMelli(mv)) { toast("کد ملی معتبر نیست؛ لطفاً دوباره بررسی کنید."); return; }
          u.melli = mv; u.verified = true;
        } else { u.melli = ""; u.verified = false; }
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
        SogStore.setUser({ name: u.name || "کاربر سوگ", phone: u.phone || phoneVal, melli: u.melli || "", verified: !!u.verified });
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
    location.href = "support.html";
  }

  /* توست */
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = el("div", "toast"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastEl._t); toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
})();
