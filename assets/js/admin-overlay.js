/* تصمیم‌های پنل مدیریت (مخفی/حذف/ویرایش/تأیید) روی داده‌های سایت.
   تا وقتی بک‌اند وردپرس وصل نشده، تصمیم‌ها در localStorage («sog:admin») نگه داشته می‌شوند
   و این اسکریپت هنگام خواندن data/*.json آن‌ها را روی داده اعمال می‌کند؛
   پس صفحه‌های سایت بدون تغییر در کد خودشان، نتیجه‌ی کار مدیر را نشان می‌دهند.
   در نسخه‌ی وردپرس این فایل حذف می‌شود و همین کارها را REST API انجام می‌دهد. */
(function (global) {
  "use strict";

  var KEY = "sog:admin";

  var DEFAULT_SETTINGS = {
    needsTitle: "نیازمندی‌های مراسمات",
    needsSub: "چاپ بنر، تاج گل، سنگ مزار و کلیه خدمات مرتبط",
    condFirst: 12,
    condStep: 40,
    notice: ""
  };

  function blank() {
    return { listings: {}, newListings: [], condolences: {}, businesses: {},
             cities: { added: [], hidden: [] }, users: {}, reports: {}, settings: {}, log: [] };
  }
  function read() {
    var s;
    try { s = JSON.parse(localStorage.getItem(KEY)); } catch (e) { s = null; }
    var b = blank();
    if (!s || typeof s !== "object") return b;
    Object.keys(b).forEach(function (k) { if (s[k] == null) s[k] = b[k]; });
    if (!s.cities.added) s.cities.added = [];
    if (!s.cities.hidden) s.cities.hidden = [];
    return s;
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; }
  }

  function condKey(listingId, cd) { return listingId + "|" + (cd.name || "") + "|" + String(cd.date || ""); }

  /* ---------- اعمال روی هر فایل داده ---------- */
  function applyListings(json, s) {
    var out = [];
    (json.listings || []).forEach(function (it) {
      var o = s.listings[it.id];
      if (o && (o.status === "deleted" || o.status === "hidden")) return;
      out.push(o && o.edits ? Object.assign({}, it, o.edits) : it);
    });
    s.newListings.forEach(function (it) {
      var o = s.listings[it.id];
      if (o && (o.status === "deleted" || o.status === "hidden")) return;
      out.push(o && o.edits ? Object.assign({}, it, o.edits) : it);
    });
    json.listings = out;
    return json;
  }

  function applyDetails(json, s) {
    Object.keys(json).forEach(function (id) {
      var d = json[id];
      var o = s.listings[id];
      /* آگهیِ مخفی یا حذف‌شده صفحه‌ی جزئیات هم ندارد */
      if (o && (o.status === "hidden" || o.status === "deleted")) { delete json[id]; return; }
      if (o && o.edits) {
        if (o.edits.deceased_name) d.deceased_name = o.edits.deceased_name;
        if (o.edits.subtitle != null) d.subtitle = o.edits.subtitle;
      }
      if (d.condolences) {
        d.condolences = d.condolences.filter(function (cd) {
          var c = s.condolences[condKey(id, cd)];
          if (c && c.verified != null) cd.verified = c.verified;
          return !(c && (c.status === "hidden" || c.status === "deleted"));
        });
      }
    });
    return json;
  }

  function applyBusinesses(json, s) {
    json.businesses = (json.businesses || []).filter(function (b) {
      var o = s.businesses[b.id];
      return !(o && (o.status === "hidden" || o.status === "deleted"));
    }).map(function (b) {
      var o = s.businesses[b.id];
      if (!o) return b;
      var x = o.edits ? Object.assign({}, b, o.edits) : b;
      if (o.verified != null) x.verified = o.verified;
      return x;
    });
    return json;
  }

  function applyCities(json, s) {
    var list = (json.cities || []).filter(function (c) { return s.cities.hidden.indexOf(c.slug) === -1; });
    s.cities.added.forEach(function (c) {
      if (!list.some(function (x) { return x.slug === c.slug; })) list.push(c);
    });
    json.cities = list;
    return json;
  }

  var APPLY = { listings: applyListings, details: applyDetails, businesses: applyBusinesses, cities: applyCities };

  /* داده‌ی خام (بدون تصمیم‌های مدیر) برای خودِ پنل مدیریت */
  var rawFetch = global.fetch ? global.fetch.bind(global) : null;

  if (rawFetch && !global.SOG_ADMIN_RAW) {
    global.fetch = function (input, init) {
      var url = typeof input === "string" ? input : (input && input.url) || "";
      var m = /data\/(listings|details|businesses|cities)\.json(\?|$)/.exec(url);
      if (!m) return rawFetch(input, init);
      return rawFetch(input, init).then(function (r) {
        if (!r.ok) return r;
        return r.json().then(function (json) {
          var out = json;
          try { out = APPLY[m[1]](json, read()); } catch (e) {}
          return new Response(JSON.stringify(out), { status: 200, headers: { "Content-Type": "application/json" } });
        });
      });
    };
  }

  /* کسب‌وکارهایی که کاربران ثبت کرده‌اند بعد از خواندن JSON اضافه می‌شوند؛
     تصمیم مدیر روی آن‌ها هم در فهرست و صفحه‌ی تکی کسب‌وکار اعمال می‌شود. */
  var page = (location.pathname.split("/").pop() || "").toLowerCase();
  if (global.SogBizStore && !global.SOG_ADMIN_RAW && (page === "business.html" || page === "business-detail.html")) {
    var bs = global.SogBizStore, rawAll = bs.all;
    bs.all = function () { return applyBusinesses({ businesses: rawAll() }, read()).businesses; };
    bs.merge = function (list) { return bs.all().concat(list || []); };
    bs.get = function (id) { return bs.all().filter(function (b) { return String(b.id) === String(id); })[0] || null; };
  }

  /* اطلاعیه‌ی سراسری مدیر بالای صفحه‌ی اصلی */
  function showNotice() {
    var text = (read().settings || {}).notice;
    var frame = document.querySelector(".app-frame");
    if (!text || !frame || document.body.getAttribute("data-nav") !== "home" || document.querySelector(".admin-notice")) return;
    var bar = document.createElement("div");
    bar.className = "admin-notice";
    bar.textContent = text;
    bar.style.cssText = "background:rgba(217,154,91,.14);color:#d99a5b;font-size:13px;font-weight:700;" +
      "text-align:center;padding:9px 14px;line-height:1.8";
    frame.insertBefore(bar, frame.firstChild);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showNotice);
  else showNotice();

  global.SogAdmin = {
    KEY: KEY,
    read: read,
    write: write,
    blank: blank,
    condKey: condKey,
    rawFetch: rawFetch,
    settings: function () { return Object.assign({}, DEFAULT_SETTINGS, read().settings || {}); },
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };
})(window);
