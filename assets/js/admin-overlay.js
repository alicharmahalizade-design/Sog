/* تصمیم‌های پنل مدیریت (مخفی/حذف/ویرایش/تأیید) و محتوای منتشرشده روی داده‌های سایت.
   • با Supabase (sog-config.js پر باشد): تصمیم‌ها از جدول site_state و آگهی/کسب‌وکارهای
     تأییدشده از جدول‌های listings و businesses خوانده می‌شوند؛ برای همه‌ی بازدیدکننده‌ها یکسان.
   • بدون Supabase: مثل قبل در localStorage («sog:admin») همین مرورگر.
   این اسکریپت هنگام خواندن data/*.json همه را روی داده اعمال می‌کند؛ پس صفحه‌های سایت
   بدون تغییر در کد خودشان، نتیجه‌ی کار مدیر را نشان می‌دهند. */
(function (global) {
  "use strict";

  var KEY = "sog:admin";
  var CACHE = "sog:adminCache";     /* آخرین نسخه‌ی خوانده‌شده از Supabase، برای نمایش سریع */
  var DB = !!(global.SogDB && global.SogDB.enabled) ? global.SogDB : null;

  var DEFAULT_SETTINGS = {
    needsTitle: "نیازمندی‌های مراسمات",
    needsSub: "چاپ بنر، تاج گل، سنگ مزار و کلیه خدمات مرتبط",
    condPages: "5,7,12,15",
    reportHideAt: 3,
    notice: ""
  };

  function blank() {
    return { listings: {}, newListings: [], condolences: {}, businesses: {},
             cities: { added: [], hidden: [] }, users: {}, reports: {}, settings: {}, log: [] };
  }
  var remote = null;
  function parse(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function read() {
    var s = DB ? (remote ? JSON.parse(JSON.stringify(remote)) : parse(CACHE)) : parse(KEY);
    var b = blank();
    if (!s || typeof s !== "object") return b;
    Object.keys(b).forEach(function (k) { if (s[k] == null) s[k] = b[k]; });
    if (!s.cities.added) s.cities.added = [];
    if (!s.cities.hidden) s.cities.hidden = [];
    return s;
  }
  /* ذخیره؛ همیشه Promise برمی‌گرداند (با Supabase فقط مدیرِ واردشده اجازه‌ی نوشتن دارد) */
  function write(s) {
    if (DB) {
      return DB.update("site_state", "id=eq.1", { state: s, updated_at: new Date().toISOString() }).then(function () {
        remote = JSON.parse(JSON.stringify(s));
        try { localStorage.setItem(CACHE, JSON.stringify(s)); } catch (e) {}
        return true;
      });
    }
    try { localStorage.setItem(KEY, JSON.stringify(s)); return Promise.resolve(true); }
    catch (e) { return Promise.reject(new Error("حافظه‌ی مرورگر پر است")); }
  }

  /* تصمیم‌های مدیر از Supabase (یک‌بار برای هر صفحه) */
  var stateReady = !DB ? Promise.resolve() :
    DB.select("site_state", "select=state&id=eq.1").then(function (rows) {
      remote = (rows && rows[0] && rows[0].state) || {};
      try { localStorage.setItem(CACHE, JSON.stringify(remote)); } catch (e) {}
    }).catch(function () { /* شبکه نبود: نسخه‌ی ذخیره‌شده‌ی قبلی */ });
  function reload() {
    if (!DB) return Promise.resolve(read());
    return DB.select("site_state", "select=state&id=eq.1").then(function (rows) {
      remote = (rows && rows[0] && rows[0].state) || {};
      try { localStorage.setItem(CACHE, JSON.stringify(remote)); } catch (e) {}
      return read();
    });
  }

  /* آگهی‌ها و کسب‌وکارهای تأییدشده در Supabase (هم‌شکل فایل‌های JSON) */
  var dbBizIds = {};
  function dbRows(table) {
    if (!DB) return Promise.resolve([]);
    return DB.select(table, "select=id,data,created_at&status=eq.published&order=created_at.desc&limit=1000")
      .then(function (rows) { return (rows || []).map(function (r) { return Object.assign({}, r.data, { id: r.id }); }); })
      .catch(function () { return []; });
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
      var kind = m[1];
      var extra = kind === "listings" ? dbRows("listings") : kind === "businesses" ? dbRows("businesses") : Promise.resolve([]);
      return Promise.all([rawFetch(input, init), extra, stateReady]).then(function (res) {
        var r = res[0], rows = res[1];
        if (!r.ok) return r;
        return r.json().then(function (json) {
          var out = json;
          try {
            if (kind === "listings" && rows.length) {
              /* نسخه‌ی تأییدشده جای نسخه‌ی «در انتظار» همین دستگاه را می‌گیرد */
              var store = global.SogStore;
              rows.forEach(function (it) { if (store && store.getMyAd && store.getMyAd(it.id) && store.removeMyAd) store.removeMyAd(it.id); });
              json.listings = rows.concat(json.listings || []);
            }
            if (kind === "businesses") {
              dbBizIds = {};
              rows.forEach(function (b) { dbBizIds[b.id] = 1; });
              json.businesses = rows.concat(json.businesses || []);
            }
            out = APPLY[kind](json, read());
          } catch (e) {}
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
    /* بعد از تأیید، نسخه‌ی منتشرشده از Supabase می‌آید و نسخه‌ی محلی تکرار نمی‌شود */
    bs.all = function () {
      var mine = rawAll().filter(function (b) { return !dbBizIds[b.id]; });
      return applyBusinesses({ businesses: mine }, read()).businesses;
    };
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
  stateReady.then(function () {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", showNotice);
    else showNotice();
  });

  /* شناسه‌ی تصادفی این دستگاه؛ چند گزارش از یک دستگاه یک گزارش حساب می‌شود */
  function deviceId() {
    var d = "";
    try { d = localStorage.getItem("sog:device") || ""; } catch (e) {}
    if (d.length < 12) {
      d = "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      try { localStorage.setItem("sog:device", d); } catch (e) {}
    }
    return d;
  }

  /* بدون Supabase: پنهان‌شدن خودکار روی همین مرورگر (با Supabase، پایگاه داده خودش انجام می‌دهد) */
  function reportFiled(kind, targetId, ref) {
    if (DB) return;
    var s = read();
    var lim = parseInt((s.settings || {}).reportHideAt, 10);
    if (isNaN(lim)) lim = 3;
    if (lim < 1) return;
    var list;
    try { list = JSON.parse(localStorage.getItem("sog:reports")) || []; } catch (e) { list = []; }
    var n = list.filter(function (r, i) {
      var st = s.reports[String(r.at || i)] || "open";
      var rk = r.kind || (r.condolence ? "condolence" : "listing");
      return st === "open" && rk === kind && String(r.id) === String(targetId) && String(r.condolence || "") === String(ref || "");
    }).length;
    if (n < lim) return;
    var grp = kind === "condolence" ? "condolences" : kind === "business" ? "businesses" : "listings";
    var key = kind === "condolence" ? targetId + "|" + ref : String(targetId);
    var cur = s[grp][key] || {};
    if ((cur.status || "published") !== "published") return;
    s[grp][key] = Object.assign(cur, { status: "hidden", autoHidden: true });
    write(s);
  }

  global.SogAdmin = {
    deviceId: deviceId,
    reportFiled: reportFiled,
    KEY: KEY,
    read: read,
    write: write,
    reload: reload,
    ready: stateReady,
    db: DB,
    blank: blank,
    condKey: condKey,
    rawFetch: rawFetch,
    settings: function () { return Object.assign({}, DEFAULT_SETTINGS, read().settings || {}); },
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };
})(window);
