/* کسب‌وکارهای ثبت‌شده توسط کاربر.
   بدون بک‌اند: در مرورگر نگه داشته می‌شوند و کنار data/businesses.json
   در فهرست و صفحه‌ی تکی نمایش داده می‌شوند. در نسخه‌ی وردپرس به CPT «کسب‌وکار» ارسال می‌شوند. */
(function (g) {
  var KEY = "sog:myBusinesses";
  /* اشتراک: ماه اول رایگان، سپس تمدید ماهانه */
  var PLAN = { trialDays: 30, monthDays: 30, price: 300000, priceLabel: "۳۰۰ هزار تومان" };
  var DAY_MS = 86400000;
  /* کسب‌وکارهای قدیمی‌تر که هنوز تاریخ اعتبار ندارند: یک ماه از روز ثبت */
  function withPlan(b) {
    if (b && b.mine && !b.paid_until) b.paid_until = (b.created_at || Date.now()) + PLAN.trialDays * DAY_MS;
    return b;
  }
  function all() { try { return JSON.parse(localStorage.getItem(KEY) || "[]").map(withPlan); } catch (e) { return []; } }
  /* وضعیت اشتراک؛ کسب‌وکارهای نمونه‌ی سایت (بدون paid_until) همیشه فعال‌اند */
  function plan(b, until) {
    until = until || (b && b.paid_until);
    if (!until) return { active: true, none: true };
    var left = Math.ceil((until - Date.now()) / DAY_MS);
    var trial = !b.renewed_at && until <= (b.created_at || 0) + (PLAN.trialDays + 1) * DAY_MS;
    return { active: left > 0, until: until, daysLeft: Math.max(0, left), trial: trial };
  }
  function faDate(ms) {
    var d = new Date(ms), j = g.SogUtil ? g.SogUtil.gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()) : null;
    if (!j) return d.toLocaleDateString("fa-IR");
    var M = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
    return String(j.d).replace(/\d/g, function (x) { return "۰۱۲۳۴۵۶۷۸۹"[x]; }) + " " + M[j.m - 1];
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); return true; }
    catch (e) { return false; }   /* معمولاً پر شدن حافظه به‌خاطر تصاویر */
  }
  /* فایل‌های تصویر و صدا در IndexedDB (localStorage برای صدا خیلی کوچک است).
     در رکورد کسب‌وکار به‌صورت «idb:کلید» ذخیره می‌شوند. */
  var dbp = null;
  function db() {
    if (!dbp) dbp = new Promise(function (res, rej) {
      var r = indexedDB.open("sog-media", 1);
      r.onupgradeneeded = function () { r.result.createObjectStore("files"); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
    return dbp;
  }
  function tx(mode, fn) {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var t = d.transaction("files", mode), st = t.objectStore("files"), out = fn(st);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var urls = {};
  function putMedia(blob) {
    var key = "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    return tx("readwrite", function (st) { st.put(blob, key); }).then(function () { return "idb:" + key; });
  }
  function mediaURL(ref) {
    if (typeof ref !== "string" || ref.indexOf("idb:") !== 0) return Promise.resolve(ref);
    var key = ref.slice(4);
    if (urls[key]) return Promise.resolve(urls[key]);
    return tx("readonly", function (st) { return st.get(key); }).then(function (blob) {
      return blob ? (urls[key] = URL.createObjectURL(blob)) : "";
    }).catch(function () { return ""; });
  }
  function delMedia(ref) {
    if (typeof ref !== "string" || ref.indexOf("idb:") !== 0) return Promise.resolve();
    return tx("readwrite", function (st) { st.delete(ref.slice(4)); }).catch(function () {});
  }
  /* نسخه‌ای از کسب‌وکار که «idb:» هایش به آدرس قابل نمایش تبدیل شده‌اند */
  function resolve(b) {
    if (!b || !b.mine) return Promise.resolve(b);
    var c = JSON.parse(JSON.stringify(b));
    return Promise.all([
      mediaURL(c.logo).then(function (u) { c.logo = u; }),
      mediaURL(c.cover).then(function (u) { c.cover = u; }),
      Promise.all((c.gallery || []).map(mediaURL)).then(function (u) { c.gallery = u.filter(Boolean); }),
      Promise.all((c.audio || []).map(function (a) {
        return mediaURL(a.src).then(function (u) { return { title: a.title, src: u }; });
      })).then(function (u) { c.audio = u.filter(function (a) { return a.src; }); })
    ]).then(function () { return c; });
  }

  /* عکس عمودی ۹:۱۶ با عرض حداکثر ۷۲۰ */
  function storyImage(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var W = Math.min(720, img.naturalWidth), H = Math.round(W * 16 / 9);
        var c = document.createElement("canvas"); c.width = W; c.height = H;
        var x = c.getContext("2d");
        x.fillStyle = "#111"; x.fillRect(0, 0, W, H);
        var s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
        var w = img.naturalWidth * s, h = img.naturalHeight * s;
        x.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
  }
  g.SogBizStore = {
    PLAN: PLAN, plan: plan, faDate: faDate, DAY_MS: DAY_MS,
    storyImage: storyImage,
    putMedia: putMedia, mediaURL: mediaURL, delMedia: delMedia, resolve: resolve,
    resolveAll: function (list) { return Promise.all((list || []).map(resolve)); },
    all: all,
    get: function (id) { return all().filter(function (b) { return String(b.id) === String(id); })[0] || null; },
    upsert: function (biz) {
      var list = all(), i = -1;
      list.forEach(function (b, k) { if (String(b.id) === String(biz.id)) i = k; });
      if (i === -1) list.unshift(biz); else list[i] = biz;
      return save(list);
    },
    remove: function (id) {
      var b = this.get(id);
      if (b) [b.logo, b.cover].concat(b.gallery || [], (b.audio || []).map(function (a) { return a.src; })).forEach(delMedia);
      return save(all().filter(function (b) { return String(b.id) !== String(id); })); },
    /* داده‌ی سایت + کسب‌وکارهای کاربر */
    merge: function (list) { return all().concat(list || []); }
  };
})(window);
