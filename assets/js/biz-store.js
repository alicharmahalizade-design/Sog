/* کسب‌وکارهای ثبت‌شده توسط کاربر.
   بدون بک‌اند: در مرورگر نگه داشته می‌شوند و کنار data/businesses.json
   در فهرست و صفحه‌ی تکی نمایش داده می‌شوند. در نسخه‌ی وردپرس به CPT «کسب‌وکار» ارسال می‌شوند. */
(function (g) {
  var KEY = "sog:myBusinesses";
  function all() { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; } }
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

  g.SogBizStore = {
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
