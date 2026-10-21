/* پنل مدیریت سوگ.
   داده‌ی پایه از data/*.json خوانده می‌شود و تصمیم‌های مدیر در «sog:admin» ذخیره می‌شود
   (assets/js/admin-overlay.js همان تصمیم‌ها را روی صفحه‌های سایت اعمال می‌کند).
   گزارش‌ها، پیام‌های پشتیبانی و آگهی‌های در انتظار از حافظه‌ی همین مرورگر می‌آیند.
   در نسخه‌ی وردپرس، همه‌ی این‌ها به REST API و پیشخوان وردپرس منتقل می‌شود. */
(function () {
  "use strict";

  var root = document.getElementById("admin");
  var A = window.SogAdmin;
  var fetchRaw = A.rawFetch || window.fetch.bind(window);

  /* ---------- کمک ---------- */
  var FA = "۰۱۲۳۴۵۶۷۸۹";
  function fa(n) { return String(n == null ? "" : n).replace(/[0-9]/g, function (d) { return FA[+d]; }); }
  function en(s) { return String(s == null ? "" : s).replace(/[۰-۹]/g, function (d) { return FA.indexOf(d); }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function norm(v) { return String(v || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").trim().toLowerCase(); }
  function lsGet(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function faDate(ts) {
    try { return new Date(ts).toLocaleDateString("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }); }
    catch (e) { return ""; }
  }
  function faTime(ts) {
    try { return new Date(ts).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }); }
    catch (e) { return ""; }
  }

  var IC = {
    dash: "M4 13h7V4H4zM13 20h7v-9h-7zM4 20h7v-5H4zM13 9h7V4h-7z",
    list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
    pending: "M12 7v5l3 2M12 21a9 9 0 110-18 9 9 0 010 18z",
    cond: "M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z",
    biz: "M4 9l1-4h14l1 4M5 9v10h14V9M4 9h16M9 19v-5h6v5",
    report: "M5 21V4h9l-1 3 1 3H5",
    chat: "M4 5h16v11H8l-4 3z",
    users: "M9 11a4 4 0 100-8 4 4 0 000 8zM2 21c0-4 3-6 7-6s7 2 7 6M16 3.5a4 4 0 010 7.5M22 21c0-3-1.5-5-4-5.7",
    city: "M12 22s7-6.2 7-12A7 7 0 105 10c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6L6 18",
    search: "M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3",
    plus: "M12 5v14M5 12h14",
    logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
    eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z",
    ext: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
    send: "M4 12l16-8-6 16-2-6z",
    check: "M5 12l4 4 10-10"
  };
  function svg(d, s) {
    return '<svg viewBox="0 0 24 24" width="' + (s || 20) + '" height="' + (s || 20) + '" aria-hidden="true"><path d="' + d +
      '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  var CEREMONY = { khaksepari: "تشییع و خاکسپاری", salgard: "سالگرد", chehelom: "چهلم", bozorgdasht: "بزرگداشت" };
  var STATUS = {
    published: ["منتشرشده", "ok"], hidden: ["مخفی", "warn"], deleted: ["حذف‌شده", "bad"],
    pending: ["در انتظار تأیید", "info"], open: ["باز", "warn"], done: ["رسیدگی‌شده", "ok"], blocked: ["مسدود", "bad"], active: ["فعال", "ok"]
  };
  function pill(st) { var s = STATUS[st] || [st, ""]; return '<span class="ad-pill is-' + s[1] + '">' + s[0] + "</span>"; }

  /* ---------- وضعیت ---------- */
  var D = { listings: [], details: {}, businesses: [], categories: [], cities: [], users: [], provinces: {} };
  var S = A.read();
  var view = "dash";
  var ui = { q: {}, f: {} };

  function save(msg) {
    if (!A.write(S)) { toast("ذخیره نشد؛ حافظه‌ی مرورگر پر است."); return; }
    if (msg) { logAct(msg); toast(msg); }
  }
  function logAct(msg) {
    S.log.unshift({ at: Date.now(), msg: msg });
    S.log = S.log.slice(0, 60);
    A.write(S);
  }

  /* ---------- ورود ---------- */
  var SESSION = "sog:adminSession";
  function pass() { return (S.settings && S.settings.adminPass) || "sog1405"; }
  function loggedIn() { try { return sessionStorage.getItem(SESSION) === "1"; } catch (e) { return false; } }

  function loginScreen() {
    root.innerHTML = "";
    var box = el("form", "ad-login");
    box.innerHTML =
      '<img src="assets/img/logo.png" alt="سوگ" class="ad-login-logo">' +
      '<h1>پنل مدیریت سوگ</h1>' +
      '<p class="ad-muted">برای ادامه رمز مدیریت را وارد کنید.</p>' +
      '<input class="ad-input" type="password" name="p" autocomplete="current-password" placeholder="رمز مدیریت" required>' +
      '<p class="ad-login-err" hidden>رمز درست نیست.</p>' +
      '<button class="ad-btn is-primary is-block" type="submit">ورود</button>' +
      '<p class="ad-hint">نسخه‌ی پیش‌نمایش — رمز پیش‌فرض: <b dir="ltr">sog1405</b> (از بخش تنظیمات قابل تغییر است)</p>';
    box.addEventListener("submit", function (e) {
      e.preventDefault();
      if (box.p.value === pass()) {
        try { sessionStorage.setItem(SESSION, "1"); } catch (er) {}
        boot();
      } else {
        box.querySelector(".ad-login-err").hidden = false;
        box.p.select();
      }
    });
    root.appendChild(box);
    setTimeout(function () { box.p.focus(); }, 50);
  }

  /* ---------- بارگذاری ---------- */
  function j(url, fb) { return fetchRaw(url, { cache: "no-store" }).then(function (r) { return r.json(); }).catch(function () { return fb; }); }

  function boot() {
    root.innerHTML = '<div class="ad-loading">در حال بارگذاری…</div>';
    Promise.all([
      j("data/listings.json", { listings: [] }), j("data/details.json", {}), j("data/businesses.json", { businesses: [], categories: [] }),
      j("data/cities.json", { cities: [] }), j("data/users.json", { users: [] }), j("data/provinces.json", { provinces: {} })
    ]).then(function (r) {
      D.listings = r[0].listings || [];
      D.details = r[1] || {};
      D.businesses = r[2].businesses || [];
      D.categories = r[2].categories || [];
      D.cities = (r[3].cities || []).filter(function (c) { return c.slug !== "all"; });
      D.users = r[4].users || [];
      D.provinces = r[5].provinces || {};
      shell();
      var h = (location.hash || "").replace("#", "");
      go(NAV.some(function (n) { return n.key === h; }) ? h : "dash");
    });
  }

  /* ---------- داده‌های ترکیبی ---------- */
  function lstStatus(id) { var o = S.listings[id]; return (o && o.status) || "published"; }
  function allListings() {
    return D.listings.concat(S.newListings).map(function (it) {
      var o = S.listings[it.id];
      var x = o && o.edits ? Object.assign({}, it, o.edits) : Object.assign({}, it);
      x._status = lstStatus(it.id);
      x._new = S.newListings.some(function (n) { return n.id === it.id; });
      return x;
    });
  }
  function drafts() {
    var d = lsGet("sog:draftListing", null);
    if (!d || !d.name) return [];
    if (S.reviewedDraft && S.reviewedDraft === draftSig(d)) return [];
    return [d];
  }
  function draftSig(d) { return (d.name || "") + "|" + (d.melli || "") + "|" + (d.city || ""); }

  function allCondolences() {
    var out = [];
    Object.keys(D.details).forEach(function (id) {
      var d = D.details[id];
      var name = (S.listings[id] && S.listings[id].edits && S.listings[id].edits.deceased_name) || d.deceased_name;
      (d.condolences || []).forEach(function (cd) {
        var key = A.condKey(id, cd), o = S.condolences[key] || {};
        out.push({ key: key, listingId: id, listing: name, name: cd.name, message: cd.message, date: cd.date,
                   kind: cd.kind || "person", logo: cd.logo, verified: o.verified != null ? o.verified : !!cd.verified,
                   status: o.status || "published" });
      });
    });
    var mine = lsGet("sog:myCondolence", {});
    Object.keys(mine).forEach(function (id) {
      var cd = mine[id] || {};
      var lst = allListings().filter(function (l) { return String(l.id) === String(id); })[0];
      var key = "mine|" + id, o = S.condolences[key] || {};
      out.unshift({ key: key, listingId: id, listing: lst ? lst.deceased_name : "آگهی " + fa(id), name: cd.name || "کاربر این دستگاه",
                    message: cd.text || cd.message || "", date: cd.date || "", kind: cd.kind || "person",
                    verified: !!o.verified, status: o.status || "published", local: true });
    });
    return out;
  }

  function allBusinesses() {
    var mine = window.SogBizStore ? SogBizStore.all().map(function (b) {
      var x = Object.assign({}, b, { _user: true });
      if (typeof x.logo === "string" && x.logo.indexOf("idb:") === 0) x.logo = "";
      return x;
    }) : [];
    return mine.concat(D.businesses).map(function (b) {
      var o = S.businesses[b.id] || {};
      var x = o.edits ? Object.assign({}, b, o.edits) : Object.assign({}, b);
      if (o.verified != null) x.verified = o.verified;
      x._status = o.status || "published";
      return x;
    });
  }

  function reports() {
    return lsGet("sog:reports", []).map(function (r, i) {
      var k = String(r.at || i);
      return Object.assign({ _key: k, _status: S.reports[k] || "open" }, r);
    }).reverse();
  }
  function chat() { return lsGet("sog:chat", []); }
  function users() {
    var list = D.users.slice();
    var me = lsGet("sog:user", null);
    if (me && (me.phone || me.name)) {
      list.unshift({ id: "local", name: me.name || "کاربر این دستگاه", phone: fa(me.phone || ""), city: "", verified: !!me.verified,
                     listings: lsGet("sog:myListings", []).length, condolences: Object.keys(lsGet("sog:myCondolence", {})).length,
                     joined: "این دستگاه", local: true });
    }
    return list.map(function (u) { var o = S.users[u.id] || {}; return Object.assign({ _status: o.status || "active" }, u); });
  }

  /* ---------- قاب ---------- */
  var NAV = [
    { key: "dash", label: "داشبورد", icon: IC.dash },
    { key: "listings", label: "آگهی‌ها", icon: IC.list },
    { key: "pending", label: "در انتظار تأیید", icon: IC.pending },
    { key: "condolences", label: "همدردی‌ها", icon: IC.cond },
    { key: "businesses", label: "کسب‌وکارها", icon: IC.biz },
    { key: "reports", label: "گزارش‌های خطا", icon: IC.report },
    { key: "support", label: "پشتیبانی", icon: IC.chat },
    { key: "users", label: "کاربران", icon: IC.users },
    { key: "cities", label: "شهرها", icon: IC.city },
    { key: "settings", label: "تنظیمات", icon: IC.settings }
  ];
  function badgeFor(key) {
    if (key === "pending") return drafts().length;
    if (key === "reports") return reports().filter(function (r) { return r._status === "open"; }).length;
    if (key === "support") return unreadChat();
    return 0;
  }
  function unreadChat() {
    var m = chat(), seen = S.chatSeen || 0, n = 0;
    for (var i = seen; i < m.length; i++) if (m[i].from === "me") n++;
    return n;
  }

  var side, main, title, drawerBack;
  function shell() {
    root.innerHTML = "";
    side = el("aside", "ad-side");
    var brand = el("div", "ad-brand", '<img src="assets/img/logo.png" alt=""><span>پنل مدیریت</span>');
    side.appendChild(brand);
    var nav = el("nav", "ad-nav");
    NAV.forEach(function (n) {
      var b = el("button", "ad-nav-item", svg(n.icon) + "<span>" + n.label + '</span><b class="ad-nav-badge" hidden></b>');
      b.type = "button"; b.dataset.key = n.key;
      b.addEventListener("click", function () { go(n.key); closeDrawer(); });
      nav.appendChild(b);
    });
    side.appendChild(nav);
    var foot = el("div", "ad-side-foot");
    var site = el("a", "ad-nav-item", svg(IC.ext) + "<span>مشاهده‌ی سایت</span>"); site.href = "index.html"; site.target = "_blank";
    var out = el("button", "ad-nav-item", svg(IC.logout) + "<span>خروج</span>"); out.type = "button";
    out.addEventListener("click", function () { try { sessionStorage.removeItem(SESSION); } catch (e) {} loginScreen(); });
    foot.appendChild(site); foot.appendChild(out);
    side.appendChild(foot);

    var wrap = el("div", "ad-main-wrap");
    var top = el("header", "ad-top");
    var menu = el("button", "ad-icon-btn ad-menu-btn", svg(IC.menu, 22)); menu.type = "button"; menu.setAttribute("aria-label", "منو");
    menu.addEventListener("click", openDrawer);
    title = el("h1", "ad-title", "");
    top.appendChild(menu); top.appendChild(title);
    main = el("main", "ad-main");
    wrap.appendChild(top); wrap.appendChild(main);

    drawerBack = el("div", "ad-drawer-back");
    drawerBack.addEventListener("click", closeDrawer);
    root.appendChild(side); root.appendChild(drawerBack); root.appendChild(wrap);
  }
  function openDrawer() { side.classList.add("is-open"); drawerBack.classList.add("is-in"); }
  function closeDrawer() { side.classList.remove("is-open"); drawerBack.classList.remove("is-in"); }

  function paintNav() {
    Array.prototype.forEach.call(side.querySelectorAll(".ad-nav .ad-nav-item"), function (b) {
      b.classList.toggle("is-active", b.dataset.key === view);
      var n = badgeFor(b.dataset.key), bd = b.querySelector(".ad-nav-badge");
      bd.hidden = !n; bd.textContent = fa(n);
    });
  }

  function go(key) {
    view = key;
    if (location.hash !== "#" + key) history.replaceState(null, "", "#" + key);
    var n = NAV.filter(function (x) { return x.key === key; })[0];
    title.textContent = n ? n.label : "";
    main.innerHTML = "";
    VIEWS[key]();
    paintNav();
    window.scrollTo(0, 0);
  }
  function refresh() { var y = window.pageYOffset; go(view); window.scrollTo(0, y); }

  /* ---------- اجزای مشترک ---------- */
  function toolbar(key, placeholder, filters, extra) {
    var bar = el("div", "ad-toolbar");
    var sb = el("label", "ad-search", svg(IC.search, 18));
    var inp = el("input"); inp.type = "search"; inp.placeholder = placeholder; inp.value = ui.q[key] || "";
    var t;
    inp.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () { ui.q[key] = inp.value; renderList(); }, 160);
    });
    sb.appendChild(inp); bar.appendChild(sb);
    if (extra) bar.appendChild(extra);
    main.appendChild(bar);
    if (filters) {
      var chips = el("div", "ad-chips");
      filters.forEach(function (f) {
        var c = el("button", "ad-chip" + ((ui.f[key] || filters[0].v) === f.v ? " is-on" : ""), esc(f.l) + (f.n != null ? " <b>" + fa(f.n) + "</b>" : ""));
        c.type = "button";
        c.addEventListener("click", function () { ui.f[key] = f.v; refresh(); });
        chips.appendChild(c);
      });
      main.appendChild(chips);
    }
    var list = el("div", "ad-list");
    main.appendChild(list);
    var renderList = function () { list.innerHTML = ""; ui.render(list, norm(ui.q[key] || ""), ui.f[key] || (filters ? filters[0].v : "")); };
    return renderList;
  }
  function empty(list, text) { list.appendChild(el("p", "ad-empty", text)); }

  function actBtn(label, cls, fn) {
    var b = el("button", "ad-btn is-sm " + (cls || ""), label); b.type = "button";
    b.addEventListener("click", function (e) { e.stopPropagation(); fn(); });
    return b;
  }

  function confirmBox(text, okLabel, fn) {
    var m = modal("تأیید");
    m.body.appendChild(el("p", "ad-confirm-text", esc(text)));
    var row = el("div", "ad-form-actions");
    row.appendChild(actBtn("انصراف", "", m.close));
    row.appendChild(actBtn(okLabel || "بله", "is-danger", function () { m.close(); fn(); }));
    m.body.appendChild(row);
  }

  function modal(heading) {
    var back = el("div", "ad-modal-back");
    var box = el("div", "ad-modal");
    var head = el("div", "ad-modal-head", "<h2>" + esc(heading) + "</h2>");
    var x = el("button", "ad-icon-btn", svg(IC.close, 20)); x.type = "button"; x.setAttribute("aria-label", "بستن");
    head.appendChild(x);
    var body = el("div", "ad-modal-body");
    box.appendChild(head); box.appendChild(body);
    document.body.appendChild(back); document.body.appendChild(box);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { back.classList.add("is-in"); box.classList.add("is-in"); });
    function close() {
      back.classList.remove("is-in"); box.classList.remove("is-in");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      setTimeout(function () { back.remove(); box.remove(); }, 220);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    x.addEventListener("click", close); back.addEventListener("click", close);
    return { body: body, close: close };
  }

  /* فرم ساده: fields = [{k,l,type,options,value,req,rows,ltr}] */
  function formModal(heading, fields, submitLabel, onSave) {
    var m = modal(heading);
    var f = el("form", "ad-form");
    fields.forEach(function (fd) {
      var lab = el("label", "ad-field", "<span>" + esc(fd.l) + (fd.req ? " *" : "") + "</span>");
      var inp;
      if (fd.type === "select") {
        inp = el("select", "ad-input");
        fd.options.forEach(function (o) {
          var op = el("option", null, esc(o[1])); op.value = o[0];
          if (String(o[0]) === String(fd.value)) op.selected = true;
          inp.appendChild(op);
        });
      } else if (fd.type === "textarea") {
        inp = el("textarea", "ad-input"); inp.rows = fd.rows || 3; inp.value = fd.value || "";
      } else if (fd.type === "check") {
        lab.className = "ad-field is-check";
        inp = el("input"); inp.type = "checkbox"; inp.checked = !!fd.value;
        lab.insertBefore(inp, lab.firstChild);
      } else {
        inp = el("input", "ad-input"); inp.type = fd.type || "text"; inp.value = fd.value == null ? "" : fd.value;
        if (fd.ltr) inp.dir = "ltr";
      }
      inp.name = fd.k;
      if (fd.req) inp.required = true;
      if (fd.type !== "check") lab.appendChild(inp);
      if (fd.hint) lab.appendChild(el("small", "ad-muted", esc(fd.hint)));
      f.appendChild(lab);
    });
    var row = el("div", "ad-form-actions");
    row.appendChild(actBtn("انصراف", "", m.close));
    var ok = el("button", "ad-btn is-primary", submitLabel || "ذخیره"); ok.type = "submit";
    row.appendChild(ok);
    f.appendChild(row);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var out = {};
      fields.forEach(function (fd) {
        var i = f.elements[fd.k];
        out[fd.k] = fd.type === "check" ? i.checked : i.value.trim();
      });
      if (onSave(out) !== false) m.close();
    });
    m.body.appendChild(f);
    var first = f.querySelector("input:not([type=checkbox]),select,textarea");
    if (first && window.innerWidth > 700) setTimeout(function () { first.focus(); }, 60);
  }

  function toast(msg) {
    var t = el("div", "ad-toast", esc(msg));
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () { t.classList.remove("is-in"); setTimeout(function () { t.remove(); }, 250); }, 2200);
  }

  function cityOptions() {
    var names = {};
    D.cities.concat(S.cities.added).forEach(function (c) { names[c.name] = c.slug; });
    return Object.keys(names).sort(function (a, b) { return a.localeCompare(b, "fa"); }).map(function (n) { return [n, n]; });
  }
  function slugFor(name) {
    var c = D.cities.concat(S.cities.added).filter(function (x) { return x.name === name; })[0];
    return c ? c.slug : norm(name).replace(/\s+/g, "-");
  }

  /* ---------- نماها ---------- */
  var VIEWS = {};

  VIEWS.dash = function () {
    var L = allListings(), C = allCondolences(), B = allBusinesses(), R = reports(), U = users();
    var stats = [
      ["آگهی منتشرشده", L.filter(function (x) { return x._status === "published"; }).length, "listings"],
      ["در انتظار تأیید", drafts().length, "pending"],
      ["همدردی‌ها", C.filter(function (x) { return x.status === "published"; }).length, "condolences"],
      ["کسب‌وکارها", B.filter(function (x) { return x._status === "published"; }).length, "businesses"],
      ["گزارش باز", R.filter(function (x) { return x._status === "open"; }).length, "reports"],
      ["پیام خوانده‌نشده", unreadChat(), "support"],
      ["کاربران", U.length, "users"],
      ["شهرها", D.cities.length + S.cities.added.length - S.cities.hidden.length, "cities"]
    ];
    var grid = el("div", "ad-stats");
    stats.forEach(function (s) {
      var b = el("button", "ad-stat", '<b>' + fa(s[1]) + '</b><span>' + s[0] + "</span>");
      b.type = "button";
      b.addEventListener("click", function () { go(s[2]); });
      grid.appendChild(b);
    });
    main.appendChild(grid);

    /* آگهی‌ها به تفکیک شهر */
    var byCity = {};
    L.filter(function (x) { return x._status === "published"; }).forEach(function (x) { byCity[x.city] = (byCity[x.city] || 0) + 1; });
    var cities = Object.keys(byCity).sort(function (a, b) { return byCity[b] - byCity[a]; }).slice(0, 6);
    var max = cities.length ? byCity[cities[0]] : 1;
    var card = el("section", "ad-card");
    card.appendChild(el("h2", "ad-card-title", "آگهی‌ها به تفکیک شهر"));
    if (!cities.length) card.appendChild(el("p", "ad-empty", "آگهی منتشرشده‌ای نیست."));
    cities.forEach(function (c) {
      var row = el("div", "ad-bar-row", '<span class="ad-bar-lbl">' + esc(c) + '</span><span class="ad-bar"><i style="width:' +
        Math.round(byCity[c] / max * 100) + '%"></i></span><b>' + fa(byCity[c]) + "</b>");
      card.appendChild(row);
    });
    main.appendChild(card);

    var todo = el("section", "ad-card");
    todo.appendChild(el("h2", "ad-card-title", "کارهای باقی‌مانده"));
    var items = [];
    if (drafts().length) items.push(["آگهی جدید منتظر بررسی است", "pending"]);
    var open = R.filter(function (x) { return x._status === "open"; }).length;
    if (open) items.push([fa(open) + " گزارش خطا رسیدگی نشده", "reports"]);
    if (unreadChat()) items.push([fa(unreadChat()) + " پیام پشتیبانی بی‌پاسخ", "support"]);
    var unv = C.filter(function (x) { return x.kind === "org" && !x.verified && x.status === "published"; }).length;
    if (unv) items.push([fa(unv) + " همدردی اداری تأییدنشده", "condolences"]);
    if (!items.length) todo.appendChild(el("p", "ad-empty", "همه‌چیز مرتب است."));
    items.forEach(function (it) {
      var b = el("button", "ad-todo", "<span>" + esc(it[0]) + "</span>" + svg("M15 6l-6 6 6 6", 18));
      b.type = "button"; b.addEventListener("click", function () { go(it[1]); });
      todo.appendChild(b);
    });
    main.appendChild(todo);

    var log = el("section", "ad-card");
    log.appendChild(el("h2", "ad-card-title", "آخرین فعالیت‌های مدیر"));
    if (!S.log.length) log.appendChild(el("p", "ad-empty", "هنوز فعالیتی ثبت نشده است."));
    S.log.slice(0, 8).forEach(function (l) {
      log.appendChild(el("div", "ad-log", "<span>" + esc(l.msg) + '</span><time>' + faDate(l.at) + " " + faTime(l.at) + "</time>"));
    });
    main.appendChild(log);
  };

  /* ---- آگهی‌ها ---- */
  function setListing(id, patch) {
    var o = S.listings[id] || {};
    S.listings[id] = Object.assign(o, patch);
  }
  function listingForm(item) {
    var det = item && D.details[item.id];
    var o = item && S.listings[item.id];
    var sub = (o && o.edits && o.edits.subtitle != null) ? o.edits.subtitle : (det && det.subtitle) || "";
    formModal(item ? "ویرایش آگهی" : "آگهی جدید", [
      { k: "deceased_name", l: "نام متوفی", value: item && item.deceased_name, req: true },
      { k: "subtitle", l: "عنوان زیر نام", value: sub },
      { k: "city", l: "شهر", type: "select", options: cityOptions(), value: item ? item.city : "اصفهان", req: true },
      { k: "ceremony_type", l: "نوع مراسم", type: "select", value: item ? item.ceremony_type : "khaksepari",
        options: Object.keys(CEREMONY).map(function (k) { return [k, CEREMONY[k]]; }) },
      { k: "event_date_jalali", l: "تاریخ مراسم (مثلاً ۱۴۰۵/۰۸/۱۲)", value: item && item.event_date_jalali, req: true },
      { k: "event_weekday", l: "روز هفته", type: "select", value: item ? item.event_weekday : "شنبه",
        options: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"].map(function (d) { return [d, d]; }) },
      { k: "location", l: "محل مراسم", value: item && item.location },
      { k: "tayefe", l: "طایفه", value: item && item.tayefe },
      { k: "il", l: "ایل", value: item && item.il },
      { k: "death_year", l: "سال فوت", value: item ? fa(item.death_year) : "۱۴۰۵" },
      { k: "photo", l: "آدرس عکس", value: item ? item.photo : "assets/img/portrait-1.svg", ltr: true }
    ], item ? "ذخیره‌ی تغییرات" : "انتشار آگهی", function (v) {
      var labels = { khaksepari: ["تشییع", "خاکسپاری"], salgard: ["سالگرد"], chehelom: ["چهلم"], bozorgdasht: ["بزرگداشت"] };
      var data = {
        deceased_name: v.deceased_name, city: v.city, city_slug: slugFor(v.city), ceremony_type: v.ceremony_type,
        ceremony_labels: labels[v.ceremony_type], event_date_jalali: fa(v.event_date_jalali), event_weekday: v.event_weekday,
        location: v.location || v.city, tayefe: v.tayefe, il: v.il, death_year: parseInt(en(v.death_year), 10) || 1405,
        photo: v.photo || "assets/img/portrait-1.svg", subtitle: v.subtitle
      };
      if (item) {
        var o2 = S.listings[item.id] || {};
        o2.edits = Object.assign(o2.edits || {}, data);
        S.listings[item.id] = o2;
        save("آگهی «" + v.deceased_name + "» ویرایش شد");
      } else {
        data.id = "n" + Date.now();
        data.created_at = new Date().toISOString().slice(0, 10);
        S.newListings.push(data);
        save("آگهی «" + v.deceased_name + "» منتشر شد");
      }
      refresh();
    });
  }

  VIEWS.listings = function () {
    var L = allListings();
    var count = function (st) { return L.filter(function (x) { return x._status === st; }).length; };
    var add = el("button", "ad-btn is-primary", svg(IC.plus, 18) + "<span>آگهی جدید</span>"); add.type = "button";
    add.addEventListener("click", function () { listingForm(null); });
    ui.render = function (list, q, f) {
      var items = allListings().filter(function (x) {
        if (x._status !== f) return false;
        return !q || norm([x.deceased_name, x.city, x.tayefe, x.il, x.location].join(" ")).indexOf(q) !== -1;
      });
      if (!items.length) return empty(list, "آگهی‌ای پیدا نشد.");
      items.forEach(function (x) {
        var row = el("article", "ad-row");
        row.innerHTML = '<span class="ad-thumb" style="background-image:url(\'' + esc(x.photo) + '\')"></span>' +
          '<div class="ad-row-main"><div class="ad-row-title">' + esc(x.deceased_name) + (x._new ? ' <span class="ad-pill is-info">جدید</span>' : "") + "</div>" +
          '<div class="ad-row-sub">' + esc(CEREMONY[x.ceremony_type] || "") + " · " + esc(x.city) + " · " + esc(x.event_date_jalali || "") + "</div></div>";
        var acts = el("div", "ad-row-acts");
        var view = el("a", "ad-btn is-sm", svg(IC.eye, 16)); view.href = "listing.html?id=" + encodeURIComponent(x.id); view.target = "_blank";
        view.setAttribute("aria-label", "مشاهده");
        acts.appendChild(view);
        if (x._status !== "deleted") acts.appendChild(actBtn("ویرایش", "", function () { listingForm(x); }));
        if (x._status === "published") acts.appendChild(actBtn("مخفی", "", function () { setListing(x.id, { status: "hidden" }); save("آگهی «" + x.deceased_name + "» مخفی شد"); refresh(); }));
        if (x._status !== "published") acts.appendChild(actBtn(x._status === "deleted" ? "بازگردانی" : "انتشار", "is-ok", function () { setListing(x.id, { status: "published" }); save("آگهی «" + x.deceased_name + "» منتشر شد"); refresh(); }));
        if (x._status !== "deleted") acts.appendChild(actBtn("حذف", "is-danger", function () {
          confirmBox("آگهی «" + x.deceased_name + "» حذف شود؟ بعداً از فیلتر «حذف‌شده» قابل بازگردانی است.", "حذف", function () {
            setListing(x.id, { status: "deleted" }); save("آگهی «" + x.deceased_name + "» حذف شد"); refresh();
          });
        }));
        row.appendChild(acts);
        list.appendChild(row);
      });
    };
    toolbar("listings", "جستجوی نام، شهر، طایفه…", [
      { v: "published", l: "منتشرشده", n: count("published") }, { v: "hidden", l: "مخفی", n: count("hidden") }, { v: "deleted", l: "حذف‌شده", n: count("deleted") }
    ], add)();
  };

  /* ---- در انتظار تأیید ---- */
  VIEWS.pending = function () {
    var list = el("div", "ad-list");
    main.appendChild(el("p", "ad-intro", "آگهی‌هایی که از فرم «ثبت سوگ» فرستاده شده‌اند، پیش از انتشار اینجا بررسی می‌شوند."));
    main.appendChild(list);
    var ds = drafts();
    if (!ds.length) return empty(list, "آگهی در انتظاری نیست.");
    ds.forEach(function (d) {
      var photo = (d.photos || []).filter(Boolean)[0] || "assets/img/portrait-1.svg";
      var card = el("article", "ad-card ad-pending");
      var dateTxt = function (o) { return o && typeof o === "object" ? fa([o.y, o.m, o.d].filter(Boolean).join("/")) : esc(o || "—"); };
      card.innerHTML = '<div class="ad-row"><span class="ad-thumb is-lg" style="background-image:url(\'' + esc(photo) + '\')"></span>' +
        '<div class="ad-row-main"><div class="ad-row-title">' + esc(d.name) + "</div>" +
        '<div class="ad-row-sub">' + esc(d.city || "شهر نامشخص") + (d.brief ? " · " + esc(d.brief) : "") + "</div>" + pill("pending") + "</div></div>" +
        '<dl class="ad-dl">' +
        "<dt>تولد</dt><dd>" + dateTxt(d.birth) + "</dd><dt>وفات</dt><dd>" + dateTxt(d.death) + "</dd>" +
        "<dt>پدر</dt><dd>" + esc(d.father || "—") + "</dd><dt>مادر</dt><dd>" + esc(d.mother || "—") + "</dd>" +
        "<dt>ثبت‌کننده</dt><dd>" + esc(d.applicant_name || "—") + "</dd><dt>تلفن</dt><dd>" + esc(fa(d.phone || "—")) + "</dd>" +
        "<dt>کد ملی</dt><dd>" + esc(fa(d.melli || "—")) + "</dd><dt>مراسم‌ها</dt><dd>" + fa(Object.keys(d.picked || {}).length) + "</dd></dl>";
      var acts = el("div", "ad-form-actions");
      acts.appendChild(actBtn("رد آگهی", "is-danger", function () {
        confirmBox("آگهی «" + d.name + "» رد شود؟", "رد", function () {
          S.reviewedDraft = draftSig(d); save("آگهی «" + d.name + "» رد شد"); refresh();
        });
      }));
      acts.appendChild(actBtn("تأیید و انتشار", "is-primary", function () {
        var city = d.city || "اصفهان";
        var death = d.death && typeof d.death === "object" ? d.death : null;
        S.newListings.push({
          id: "n" + Date.now(), deceased_name: d.name, photo: photo, ceremony_type: "khaksepari", ceremony_labels: ["تشییع", "خاکسپاری"],
          death_year: death && death.y ? parseInt(en(death.y), 10) : 1405, event_date_jalali: death ? fa([death.y, death.m, death.d].join("/")) : "",
          event_weekday: "", city: city, city_slug: slugFor(city), tayefe: d.father_tayefe || "", il: d.father_il || "",
          location: city, created_at: new Date().toISOString().slice(0, 10)
        });
        S.reviewedDraft = draftSig(d);
        save("آگهی «" + d.name + "» تأیید و منتشر شد");
        refresh();
      }));
      card.appendChild(acts);
      list.appendChild(card);
    });
  };

  /* ---- همدردی‌ها ---- */
  VIEWS.condolences = function () {
    var C = allCondolences();
    var n = function (fn) { return C.filter(fn).length; };
    ui.render = function (list, q, f) {
      var items = allCondolences().filter(function (c) {
        if (f === "org" ? !(c.kind === "org" && c.status !== "deleted") : c.status !== f) return false;
        return !q || norm([c.name, c.listing, c.message].join(" ")).indexOf(q) !== -1;
      });
      if (!items.length) return empty(list, "همدردی‌ای پیدا نشد.");
      items.forEach(function (c) {
        var row = el("article", "ad-row is-stack");
        row.innerHTML = '<div class="ad-row-title">' + esc(c.name) +
          (c.kind === "org" ? (c.verified ? ' <span class="ad-pill is-ok">اداری · تأییدشده</span>' : ' <span class="ad-pill is-warn">اداری · تأییدنشده</span>') : "") +
          (c.local ? ' <span class="ad-pill is-info">این دستگاه</span>' : "") + "</div>" +
          '<div class="ad-row-sub">برای ' + esc(c.listing) + (c.date ? " · " + esc(c.date) : "") + "</div>" +
          '<p class="ad-msg">' + esc(c.message) + "</p>";
        var acts = el("div", "ad-row-acts");
        var setC = function (patch, msg) { S.condolences[c.key] = Object.assign(S.condolences[c.key] || {}, patch); save(msg); refresh(); };
        if (c.kind === "org" && c.status !== "deleted") acts.appendChild(actBtn(c.verified ? "لغو تأیید" : "تأیید اداره", c.verified ? "" : "is-ok", function () {
          setC({ verified: !c.verified }, (c.verified ? "تأیید همدردی «" : "همدردی «") + c.name + (c.verified ? "» لغو شد" : "» تأیید شد"));
        }));
        if (c.status === "published") acts.appendChild(actBtn("مخفی", "", function () { setC({ status: "hidden" }, "همدردی «" + c.name + "» مخفی شد"); }));
        if (c.status !== "published") acts.appendChild(actBtn(c.status === "deleted" ? "بازگردانی" : "نمایش", "is-ok", function () { setC({ status: "published" }, "همدردی «" + c.name + "» نمایش داده شد"); }));
        if (c.status !== "deleted") acts.appendChild(actBtn("حذف", "is-danger", function () {
          confirmBox("همدردی «" + c.name + "» حذف شود؟", "حذف", function () { setC({ status: "deleted" }, "همدردی «" + c.name + "» حذف شد"); });
        }));
        var v = el("a", "ad-btn is-sm", svg(IC.eye, 16)); v.href = "listing.html?id=" + encodeURIComponent(c.listingId); v.target = "_blank";
        v.setAttribute("aria-label", "مشاهده‌ی آگهی");
        acts.appendChild(v);
        row.appendChild(acts);
        list.appendChild(row);
      });
    };
    toolbar("condolences", "جستجوی نام، آگهی یا متن…", [
      { v: "published", l: "نمایش داده‌شده", n: n(function (c) { return c.status === "published"; }) },
      { v: "org", l: "اداری", n: n(function (c) { return c.kind === "org" && c.status !== "deleted"; }) },
      { v: "hidden", l: "مخفی", n: n(function (c) { return c.status === "hidden"; }) },
      { v: "deleted", l: "حذف‌شده", n: n(function (c) { return c.status === "deleted"; }) }
    ])();
  };

  /* ---- کسب‌وکارها ---- */
  function bizForm(b) {
    var cats = D.categories.map(function (c) { return [c.slug, c.name]; });
    formModal("ویرایش کسب‌وکار", [
      { k: "name", l: "نام", value: b.name, req: true },
      { k: "category_slug", l: "دسته", type: "select", options: cats.length ? cats : [[b.category_slug, b.category_name]], value: b.category_slug },
      { k: "city", l: "شهر", type: "select", options: cityOptions(), value: b.city },
      { k: "phone", l: "تلفن", value: b.phone },
      { k: "address", l: "نشانی", value: b.address },
      { k: "price_from", l: "قیمت", value: b.price_from },
      { k: "description", l: "توضیحات", type: "textarea", value: b.description },
      { k: "tier", l: "سطح همکاری", type: "select", value: b.tier || "", options: [["", "عادی"], ["silver", "نقره‌ای"], ["gold", "طلایی"]] },
      { k: "featured", l: "ویژه (بالای فهرست)", type: "check", value: b.featured }
    ], "ذخیره", function (v) {
      var cat = D.categories.filter(function (c) { return c.slug === v.category_slug; })[0];
      var o = S.businesses[b.id] || {};
      o.edits = Object.assign(o.edits || {}, v, { city_slug: slugFor(v.city), phone: fa(v.phone), category_name: cat ? cat.name : b.category_name });
      S.businesses[b.id] = o;
      save("کسب‌وکار «" + v.name + "» ویرایش شد");
      refresh();
    });
  }
  VIEWS.businesses = function () {
    var B = allBusinesses();
    var n = function (st) { return B.filter(function (x) { return x._status === st; }).length; };
    ui.render = function (list, q, f) {
      var items = allBusinesses().filter(function (b) {
        if (b._status !== f) return false;
        return !q || norm([b.name, b.city, b.category_name, b.services && b.services.join(" ")].join(" ")).indexOf(q) !== -1;
      });
      if (!items.length) return empty(list, "کسب‌وکاری پیدا نشد.");
      items.forEach(function (b) {
        var row = el("article", "ad-row");
        row.innerHTML = '<span class="ad-thumb is-logo" style="background-image:url(\'' + esc(b.logo) + '\')"></span>' +
          '<div class="ad-row-main"><div class="ad-row-title">' + esc(b.name) +
          (b.verified ? ' <span class="ad-pill is-ok">تأییدشده</span>' : "") + (b.featured ? ' <span class="ad-pill is-info">ویژه</span>' : "") +
          (b._user ? ' <span class="ad-pill is-warn">ثبت کاربر</span>' : "") + "</div>" +
          '<div class="ad-row-sub">' + esc(b.category_name) + " · " + esc(b.city) + " · " + esc(b.phone || "") + "</div></div>";
        var acts = el("div", "ad-row-acts");
        var setB = function (patch, msg) { S.businesses[b.id] = Object.assign(S.businesses[b.id] || {}, patch); save(msg); refresh(); };
        var v = el("a", "ad-btn is-sm", svg(IC.eye, 16)); v.href = "business-detail.html?id=" + encodeURIComponent(b.id); v.target = "_blank";
        v.setAttribute("aria-label", "مشاهده");
        acts.appendChild(v);
        if (b._status !== "deleted") {
          acts.appendChild(actBtn("ویرایش", "", function () { bizForm(b); }));
          acts.appendChild(actBtn(b.verified ? "لغو تأیید" : "تأیید", b.verified ? "" : "is-ok", function () {
            setB({ verified: !b.verified }, "کسب‌وکار «" + b.name + (b.verified ? "» از حالت تأیید خارج شد" : "» تأیید شد"));
          }));
        }
        if (b._status === "published") acts.appendChild(actBtn("مخفی", "", function () { setB({ status: "hidden" }, "کسب‌وکار «" + b.name + "» مخفی شد"); }));
        if (b._status !== "published") acts.appendChild(actBtn(b._status === "deleted" ? "بازگردانی" : "انتشار", "is-ok", function () { setB({ status: "published" }, "کسب‌وکار «" + b.name + "» منتشر شد"); }));
        if (b._status !== "deleted") acts.appendChild(actBtn("حذف", "is-danger", function () {
          confirmBox("کسب‌وکار «" + b.name + "» حذف شود؟", "حذف", function () { setB({ status: "deleted" }, "کسب‌وکار «" + b.name + "» حذف شد"); });
        }));
        row.appendChild(acts);
        list.appendChild(row);
      });
    };
    toolbar("businesses", "جستجوی نام، شهر یا خدمت…", [
      { v: "published", l: "منتشرشده", n: n("published") }, { v: "hidden", l: "مخفی", n: n("hidden") }, { v: "deleted", l: "حذف‌شده", n: n("deleted") }
    ])();
  };

  /* ---- گزارش‌ها ---- */
  VIEWS.reports = function () {
    var R = reports();
    ui.render = function (list, q, f) {
      var items = reports().filter(function (r) {
        if (r._status !== f) return false;
        return !q || norm([r.listing, r.name, r.type, r.note].join(" ")).indexOf(q) !== -1;
      });
      if (!items.length) return empty(list, f === "open" ? "گزارش بازی نیست." : "گزارشی پیدا نشد.");
      items.forEach(function (r) {
        var isBiz = r.kind === "business";
        var row = el("article", "ad-row is-stack");
        row.innerHTML = '<div class="ad-row-title">' + esc(r.type || "گزارش") + " " + pill(r._status) + "</div>" +
          '<div class="ad-row-sub">' + (isBiz ? "کسب‌وکار: " : "آگهی: ") + esc(r.listing || r.name || "—") + " · " + faDate(r.at) + " " + faTime(r.at) + "</div>" +
          (r.note ? '<p class="ad-msg">' + esc(r.note) + "</p>" : "");
        var acts = el("div", "ad-row-acts");
        if (r.id != null) {
          var v = el("a", "ad-btn is-sm", svg(IC.eye, 16) + "<span>مشاهده</span>");
          v.href = (isBiz ? "business-detail.html?id=" : "listing.html?id=") + encodeURIComponent(r.id); v.target = "_blank";
          acts.appendChild(v);
        }
        acts.appendChild(actBtn(r._status === "open" ? "رسیدگی شد" : "بازکردن دوباره", r._status === "open" ? "is-ok" : "", function () {
          S.reports[r._key] = r._status === "open" ? "done" : "open";
          save(r._status === "open" ? "گزارش «" + (r.type || "") + "» رسیدگی شد" : "گزارش دوباره باز شد"); refresh();
        }));
        acts.appendChild(actBtn("حذف", "is-danger", function () {
          confirmBox("این گزارش برای همیشه حذف شود؟", "حذف", function () {
            lsSet("sog:reports", lsGet("sog:reports", []).filter(function (x, i) { return String(x.at || i) !== r._key; }));
            delete S.reports[r._key]; save("یک گزارش حذف شد"); refresh();
          });
        }));
        row.appendChild(acts);
        list.appendChild(row);
      });
    };
    toolbar("reports", "جستجو در گزارش‌ها…", [
      { v: "open", l: "باز", n: R.filter(function (r) { return r._status === "open"; }).length },
      { v: "done", l: "رسیدگی‌شده", n: R.filter(function (r) { return r._status === "done"; }).length }
    ])();
  };

  /* ---- پشتیبانی ---- */
  VIEWS.support = function () {
    var msgs = chat();
    S.chatSeen = msgs.length; A.write(S);
    main.appendChild(el("p", "ad-intro", "گفت‌وگوی صفحه‌ی «پشتیبانی» سایت. پاسخ شما در همان صفحه برای کاربر نمایش داده می‌شود."));
    var box = el("section", "ad-chat");
    var log = el("div", "ad-chat-log");
    function paint() {
      log.innerHTML = "";
      var m = chat();
      if (!m.length) { log.appendChild(el("p", "ad-empty", "هنوز پیامی نرسیده است.")); return; }
      var lastDay = "";
      m.forEach(function (x) {
        if (x.day && x.day !== lastDay) { log.appendChild(el("div", "ad-chat-day", esc(x.day))); lastDay = x.day; }
        var b = el("div", "ad-bubble " + (x.from === "me" ? "is-user" : "is-admin"));
        if (x.audio) {
          var a = el("audio"); a.controls = true; a.src = x.audio; a.preload = "none"; b.appendChild(a);
          if (x.transcript) b.appendChild(el("p", "ad-muted", esc(x.transcript)));
        } else if (x.expired) {
          b.appendChild(el("p", "ad-muted", "پیام صوتی (منقضی‌شده)"));
        } else {
          b.appendChild(el("p", null, esc(x.text)));
        }
        b.appendChild(el("time", null, esc(x.at || "")));
        log.appendChild(b);
      });
      log.scrollTop = log.scrollHeight;
    }
    var form = el("form", "ad-chat-bar");
    var inp = el("input", "ad-input"); inp.placeholder = "پاسخ پشتیبانی…"; inp.required = true;
    var send = el("button", "ad-btn is-primary", svg(IC.send, 18)); send.type = "submit"; send.setAttribute("aria-label", "ارسال");
    form.appendChild(inp); form.appendChild(send);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var t = inp.value.trim(); if (!t) return;
      var m = chat();
      var now = new Date();
      var jd = window.SogUtil && SogUtil.todayJalali ? SogUtil.todayJalali() : null;
      m.push({ id: "a" + Date.now(), from: "support", text: t,
               at: fa(now.getHours() + ":" + (now.getMinutes() < 10 ? "0" : "") + now.getMinutes()),
               day: jd ? fa(jd.y + "/" + (jd.m < 10 ? "0" : "") + jd.m + "/" + (jd.d < 10 ? "0" : "") + jd.d) : "" });
      lsSet("sog:chat", m);
      S.chatSeen = m.length; A.write(S);
      inp.value = ""; paint(); logAct("به پیام پشتیبانی پاسخ داده شد");
    });
    box.appendChild(log); box.appendChild(form);
    main.appendChild(box);
    paint();
    if (msgs.length) {
      var clear = actBtn("پاک‌کردن گفت‌وگو", "is-danger", function () {
        confirmBox("کل گفت‌وگو پاک شود؟", "پاک شود", function () { lsSet("sog:chat", []); S.chatSeen = 0; save("گفت‌وگوی پشتیبانی پاک شد"); refresh(); });
      });
      clear.classList.add("ad-chat-clear");
      main.appendChild(clear);
    }
  };

  /* ---- کاربران ---- */
  VIEWS.users = function () {
    var U = users();
    ui.render = function (list, q, f) {
      var items = users().filter(function (u) {
        if (f === "verified" ? !u.verified : f === "blocked" ? u._status !== "blocked" : false) return false;
        return !q || norm([u.name, en(u.phone), u.phone, u.city].join(" ")).indexOf(q) !== -1;
      });
      if (!items.length) return empty(list, "کاربری پیدا نشد.");
      items.forEach(function (u) {
        var row = el("article", "ad-row");
        row.innerHTML = '<span class="ad-avatar">' + esc((u.name || "?").charAt(0)) + "</span>" +
          '<div class="ad-row-main"><div class="ad-row-title">' + esc(u.name) +
          (u.verified ? ' <span class="ad-pill is-ok">تأیید هویت</span>' : "") + (u._status === "blocked" ? " " + pill("blocked") : "") +
          (u.local ? ' <span class="ad-pill is-info">این دستگاه</span>' : "") + "</div>" +
          '<div class="ad-row-sub"><span dir="ltr">' + esc(u.phone) + "</span>" + (u.city ? " · " + esc(u.city) : "") +
          " · " + fa(u.listings || 0) + " آگهی · " + fa(u.condolences || 0) + " همدردی · عضویت " + esc(u.joined || "") + "</div></div>";
        var acts = el("div", "ad-row-acts");
        var tel = el("a", "ad-btn is-sm", "تماس"); tel.href = "tel:" + en(u.phone);
        acts.appendChild(tel);
        acts.appendChild(actBtn(u._status === "blocked" ? "رفع مسدودی" : "مسدود", u._status === "blocked" ? "is-ok" : "is-danger", function () {
          var to = u._status === "blocked" ? "active" : "blocked";
          var run = function () { S.users[u.id] = { status: to }; save("کاربر «" + u.name + (to === "blocked" ? "» مسدود شد" : "» رفع مسدودی شد")); refresh(); };
          if (to === "blocked") confirmBox("کاربر «" + u.name + "» مسدود شود؟", "مسدود", run); else run();
        }));
        row.appendChild(acts);
        list.appendChild(row);
      });
    };
    toolbar("users", "جستجوی نام، تلفن یا شهر…", [
      { v: "all", l: "همه", n: U.length },
      { v: "verified", l: "تأیید هویت‌شده", n: U.filter(function (u) { return u.verified; }).length },
      { v: "blocked", l: "مسدود", n: U.filter(function (u) { return u._status === "blocked"; }).length }
    ])();
  };

  /* ---- شهرها ---- */
  VIEWS.cities = function () {
    var add = el("button", "ad-btn is-primary", svg(IC.plus, 18) + "<span>افزودن شهر</span>"); add.type = "button";
    add.addEventListener("click", function () {
      var provs = Object.keys(D.provinces).sort(function (a, b) { return a.localeCompare(b, "fa"); });
      formModal("افزودن شهر", [
        { k: "name", l: "نام شهر", req: true },
        { k: "province", l: "استان", type: "select", options: provs.map(function (p) { return [p, p]; }), value: provs[0] },
        { k: "slug", l: "نامک انگلیسی (برای آدرس)", ltr: true, hint: "مثلاً: dezful" }
      ], "افزودن", function (v) {
        var exists = D.cities.concat(S.cities.added).some(function (c) { return norm(c.name) === norm(v.name); });
        if (exists) { toast("این شهر از قبل در فهرست هست."); return false; }
        S.cities.added.push({ slug: (v.slug || "c" + Date.now()).toLowerCase().replace(/[^a-z0-9-]/g, ""), name: v.name, province: v.province });
        save("شهر «" + v.name + "» اضافه شد"); refresh();
      });
    });
    ui.render = function (list, q, f) {
      var counts = {};
      allListings().forEach(function (x) { if (x._status === "published") counts[x.city] = (counts[x.city] || 0) + 1; });
      var all = D.cities.map(function (c) { return Object.assign({ _added: false }, c); })
        .concat(S.cities.added.map(function (c) { return Object.assign({ _added: true }, c); }));
      var items = all.filter(function (c) {
        var hid = S.cities.hidden.indexOf(c.slug) !== -1;
        if (f === "hidden" ? !hid : hid) return false;
        return !q || norm(c.name + " " + c.slug).indexOf(q) !== -1;
      });
      if (!items.length) return empty(list, "شهری پیدا نشد.");
      items.forEach(function (c) {
        var row = el("article", "ad-row");
        row.innerHTML = '<span class="ad-avatar">' + svg(IC.city, 18) + "</span>" +
          '<div class="ad-row-main"><div class="ad-row-title">' + esc(c.name) + (c._added ? ' <span class="ad-pill is-info">افزوده‌ی مدیر</span>' : "") + "</div>" +
          '<div class="ad-row-sub"><span dir="ltr">' + esc(c.slug) + "</span>" + (c.province ? " · " + esc(c.province) : "") + " · " + fa(counts[c.name] || 0) + " آگهی</div></div>";
        var acts = el("div", "ad-row-acts");
        var hid = S.cities.hidden.indexOf(c.slug) !== -1;
        acts.appendChild(actBtn(hid ? "نمایش" : "مخفی از نوار شهرها", hid ? "is-ok" : "", function () {
          if (hid) S.cities.hidden = S.cities.hidden.filter(function (s) { return s !== c.slug; }); else S.cities.hidden.push(c.slug);
          save("شهر «" + c.name + (hid ? "» نمایش داده شد" : "» مخفی شد")); refresh();
        }));
        if (c._added) acts.appendChild(actBtn("حذف", "is-danger", function () {
          confirmBox("شهر «" + c.name + "» حذف شود؟", "حذف", function () {
            S.cities.added = S.cities.added.filter(function (x) { return x.slug !== c.slug; }); save("شهر «" + c.name + "» حذف شد"); refresh();
          });
        }));
        row.appendChild(acts);
        list.appendChild(row);
      });
    };
    toolbar("cities", "جستجوی شهر…", [
      { v: "shown", l: "نمایش داده‌شده" }, { v: "hidden", l: "مخفی", n: S.cities.hidden.length }
    ], add)();
  };

  /* ---- تنظیمات ---- */
  VIEWS.settings = function () {
    var st = A.settings();
    var card = el("section", "ad-card");
    card.appendChild(el("h2", "ad-card-title", "تنظیمات سایت"));
    var f = el("form", "ad-form");
    var fields = [
      ["notice", "اطلاعیه‌ی بالای صفحه‌ی اصلی", "خالی = بدون اطلاعیه", "textarea"],
      ["needsTitle", "عنوان دکمه‌ی نیازمندی‌ها (صفحه‌ی آگهی)"],
      ["needsSub", "متن زیر دکمه‌ی نیازمندی‌ها"],
      ["condFirst", "تعداد همدردی در نمایش اول", "", "number"],
      ["condStep", "تعداد همدردی در هر «دیدن همدردی بیشتر»", "", "number"]
    ];
    fields.forEach(function (x) {
      var lab = el("label", "ad-field", "<span>" + x[1] + "</span>");
      var i = x[3] === "textarea" ? el("textarea", "ad-input") : el("input", "ad-input");
      if (x[3] === "number") { i.type = "number"; i.min = 1; i.max = 500; i.dir = "ltr"; }
      if (x[3] === "textarea") i.rows = 2;
      i.name = x[0]; i.value = st[x[0]] == null ? "" : st[x[0]];
      lab.appendChild(i);
      if (x[2]) lab.appendChild(el("small", "ad-muted", x[2]));
      f.appendChild(lab);
    });
    var row = el("div", "ad-form-actions");
    var ok = el("button", "ad-btn is-primary", "ذخیره‌ی تنظیمات"); ok.type = "submit";
    row.appendChild(ok); f.appendChild(row);
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      fields.forEach(function (x) {
        var v = f.elements[x[0]].value.trim();
        if (x[3] === "number") v = Math.max(1, parseInt(en(v), 10) || A.DEFAULT_SETTINGS[x[0]]);
        S.settings[x[0]] = v;
      });
      save("تنظیمات سایت ذخیره شد");
    });
    card.appendChild(f);
    main.appendChild(card);

    var sec = el("section", "ad-card");
    sec.appendChild(el("h2", "ad-card-title", "رمز مدیریت"));
    var pf = el("form", "ad-form");
    pf.innerHTML = '<label class="ad-field"><span>رمز فعلی</span><input class="ad-input" type="password" name="cur" required autocomplete="current-password"></label>' +
      '<label class="ad-field"><span>رمز جدید (حداقل ۶ نویسه)</span><input class="ad-input" type="password" name="nw" minlength="6" required autocomplete="new-password"></label>';
    var pr = el("div", "ad-form-actions");
    var pb = el("button", "ad-btn is-primary", "تغییر رمز"); pb.type = "submit"; pr.appendChild(pb); pf.appendChild(pr);
    pf.addEventListener("submit", function (e) {
      e.preventDefault();
      if (pf.cur.value !== pass()) { toast("رمز فعلی درست نیست."); return; }
      S.settings.adminPass = pf.nw.value; save("رمز مدیریت تغییر کرد"); pf.reset();
    });
    sec.appendChild(pf);
    main.appendChild(sec);

    var data = el("section", "ad-card");
    data.appendChild(el("h2", "ad-card-title", "پشتیبان‌گیری از تصمیم‌های مدیر"));
    data.appendChild(el("p", "ad-muted", "همه‌ی تغییرات پنل در همین مرورگر ذخیره می‌شود. برای انتقال به دستگاه دیگر یا نسخه‌ی وردپرس، خروجی بگیرید."));
    var r = el("div", "ad-form-actions is-wrap");
    r.appendChild(actBtn("دریافت فایل پشتیبان", "", function () {
      var copy = JSON.parse(JSON.stringify(S)); delete copy.settings.adminPass;
      var blob = new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" });
      var a = el("a"); a.href = URL.createObjectURL(blob); a.download = "sog-admin-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    }));
    var file = el("input"); file.type = "file"; file.accept = "application/json"; file.hidden = true;
    file.addEventListener("change", function () {
      var fl = file.files && file.files[0]; if (!fl) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result);
          if (!obj || typeof obj !== "object" || !obj.listings) throw new Error("bad");
          var keepPass = S.settings.adminPass;
          S = Object.assign(A.blank(), obj);
          if (keepPass) S.settings.adminPass = keepPass;
          save("فایل پشتیبان بارگذاری شد"); refresh();
        } catch (er) { toast("این فایل پشتیبان پنل سوگ نیست."); }
      };
      rd.readAsText(fl);
    });
    r.appendChild(file);
    r.appendChild(actBtn("بارگذاری فایل پشتیبان", "", function () { file.click(); }));
    r.appendChild(actBtn("بازنشانی همه‌ی تغییرات", "is-danger", function () {
      confirmBox("همه‌ی تصمیم‌های مدیر (مخفی، حذف، ویرایش، آگهی‌های جدید و تنظیمات) پاک شود؟", "بازنشانی", function () {
        var keepPass = S.settings.adminPass;
        S = A.blank(); if (keepPass) S.settings.adminPass = keepPass;
        save("همه‌ی تغییرات پنل بازنشانی شد"); refresh();
      });
    }));
    data.appendChild(r);
    main.appendChild(data);
  };

  /* به‌روز ماندن با تغییرات تب‌های دیگر (گزارش یا پیام تازه) */
  window.addEventListener("storage", function (e) {
    if (!loggedIn() || !main) return;
    if (e.key === A.KEY) S = A.read();
    if (e.key === A.KEY || e.key === "sog:chat" || e.key === "sog:reports" || e.key === "sog:draftListing") refresh();
  });

  if (loggedIn()) boot(); else loginScreen();
})();
