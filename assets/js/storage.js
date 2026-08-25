/* ذخیره‌سازی محلی: آگهی‌های دیده‌شده (برای نشانگر مشاهده‌نشده) و بوکمارک‌ها.
   در نسخه‌ی وردپرس می‌تواند با حساب کاربری/سرور جایگزین شود. */
(function (global) {
  "use strict";

  var SEEN_KEY = "sog:seen";        // آرایه‌ی id آگهی‌های دیده‌شده
  var SAVED_KEY = "sog:saved";      // آرایه‌ی id بوکمارک‌ها
  var FOLLOW_KEY = "sog:follow";    // آرایه‌ی id آگهی‌های دنبال‌شده
  var SALAVAT_KEY = "sog:salavat";  // نگاشت id → تعداد صلوات کاربر
  var GUEST_KEY = "sog:guest";      // نگاشت id → آرایه‌ی پیام‌های دفتر یادبود
  var NOTE_KEY = "sog:notes";       // نگاشت id → یادداشت خصوصی کاربر
  var CITY_ORDER_KEY = "sog:cityOrder"; // ترتیب دلخواه کاربر برای شهرها (آرایه‌ی slug)
  var SEARCH_KEY = "sog:searches";   // تاریخچه‌ی جستجوی کاربر
  var MYCOND_KEY = "sog:myCondolence";  // همدردی خودِ کاربر روی هر آگهی
  var HIDDEN_KEY = "sog:hiddenCond";    // همدردی‌های مخفی‌شده توسط صاحب عزا
  var OWNERNOTE_KEY = "sog:ownerNote";  // یادداشت صاحب عزا روی آگهی خودش
  var USER_KEY = "sog:user";        // اطلاعات کاربر واردشده
  var PREFS_KEY = "sog:prefs";      // تنظیمات (اعلان/حریم خصوصی)

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function write(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
  }
  function readMap(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch (e) { return {}; }
  }
  function writeMap(key, m) {
    try { localStorage.setItem(key, JSON.stringify(m)); } catch (e) {}
  }

  var Store = {
    /* ----- همدردی خودِ کاربر (قابل ویرایش) ----- */
    getMyCondolence: function (id) { return readMap(MYCOND_KEY)[id] || null; },
    setMyCondolence: function (id, entry) {
      var m = readMap(MYCOND_KEY);
      if (entry) m[id] = entry; else delete m[id];
      writeMap(MYCOND_KEY, m);
    },

    /* ----- مخفی‌کردن همدردی‌ها توسط صاحب عزا ----- */
    getHidden: function (id) { return readMap(HIDDEN_KEY)[id] || { all: false, items: [] }; },
    setHidden: function (id, v) { var m = readMap(HIDDEN_KEY); m[id] = v; writeMap(HIDDEN_KEY, m); },
    toggleHiddenItem: function (id, key) {
      var h = this.getHidden(id);
      var i = h.items.indexOf(key);
      if (i === -1) h.items.push(key); else h.items.splice(i, 1);
      this.setHidden(id, h);
      return i === -1;
    },
    toggleHideAll: function (id) {
      var h = this.getHidden(id);
      h.all = !h.all;
      this.setHidden(id, h);
      return h.all;
    },

    /* ----- یادداشت صاحب عزا ----- */
    getOwnerNote: function (id) { return readMap(OWNERNOTE_KEY)[id] || ""; },
    setOwnerNote: function (id, text) {
      var m = readMap(OWNERNOTE_KEY);
      if (text && text.trim()) m[id] = text; else delete m[id];
      writeMap(OWNERNOTE_KEY, m);
    },

    /* ----- تاریخچه‌ی جستجو ----- */
    getSearches: function () { return read(SEARCH_KEY); },
    addSearch: function (q) {
      q = String(q || "").trim();
      if (q.length < 2) return;
      var list = read(SEARCH_KEY).filter(function (x) { return x !== q; });
      list.unshift(q);
      write(SEARCH_KEY, list.slice(0, 8));   /* حداکثر ۸ جستجوی اخیر */
    },
    removeSearch: function (q) {
      write(SEARCH_KEY, read(SEARCH_KEY).filter(function (x) { return x !== q; }));
    },
    clearSearches: function () { write(SEARCH_KEY, []); },

    /* ----- یادداشت خصوصی روی آگهی ----- */
    getNote: function (id) { return readMap(NOTE_KEY)[id] || ""; },
    setNote: function (id, text) {
      var m = readMap(NOTE_KEY);
      if (text && text.trim()) m[id] = text; else delete m[id];
      writeMap(NOTE_KEY, m);
    },

    /* ----- ترتیب دلخواه شهرها ----- */
    getCityOrder: function () { return read(CITY_ORDER_KEY); },
    setCityOrder: function (slugs) { write(CITY_ORDER_KEY, slugs || []); },

    /* ----- دیده‌شده‌ها ----- */
    getSeen: function () { return read(SEEN_KEY); },
    isSeen: function (id) { return this.getSeen().indexOf(id) !== -1; },
    markSeen: function (id) {
      var s = this.getSeen();
      if (s.indexOf(id) === -1) { s.push(id); write(SEEN_KEY, s); }
    },
    markSeenBulk: function (ids) {
      var s = this.getSeen(), changed = false;
      ids.forEach(function (id) { if (s.indexOf(id) === -1) { s.push(id); changed = true; } });
      if (changed) write(SEEN_KEY, s);
    },

    /* ----- بوکمارک‌ها ----- */
    getSaved: function () { return read(SAVED_KEY); },
    isSaved: function (id) { return this.getSaved().indexOf(id) !== -1; },
    toggleSaved: function (id) {
      var s = this.getSaved(), i = s.indexOf(id);
      if (i === -1) s.push(id); else s.splice(i, 1);
      write(SAVED_KEY, s);
      return i === -1; // true اگر اکنون ذخیره شده
    },

    /* ----- دنبال‌کردن ----- */
    getFollows: function () { return read(FOLLOW_KEY); },
    isFollowing: function (id) { return this.getFollows().indexOf(id) !== -1; },
    toggleFollow: function (id) {
      var s = this.getFollows(), i = s.indexOf(id);
      if (i === -1) s.push(id); else s.splice(i, 1);
      write(FOLLOW_KEY, s);
      return i === -1;
    },

    /* ----- صلوات (شمع مجازی) ----- */
    /* هر کاربر روی هر آگهی فقط یک شمع می‌تواند روشن کند */
    getSalavat: function (id) { return readMap(SALAVAT_KEY)[id] || 0; },
    hasCandle: function (id) { return (readMap(SALAVAT_KEY)[id] || 0) > 0; },
    lightCandle: function (id) {
      var m = readMap(SALAVAT_KEY);
      if (m[id]) return false;          /* قبلاً روشن کرده است */
      m[id] = 1; writeMap(SALAVAT_KEY, m);
      return true;
    },

    /* ----- دفتر یادبود ----- */
    getGuestbook: function (id) { return readMap(GUEST_KEY)[id] || []; },
    addGuestbook: function (id, entry) {
      var m = readMap(GUEST_KEY); if (!m[id]) m[id] = [];
      m[id].unshift(entry); writeMap(GUEST_KEY, m); return m[id];
    },

    /* ----- کاربر ----- */
    getUser: function () { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; } },
    setUser: function (u) { writeMap(USER_KEY, u); },
    clearUser: function () { try { localStorage.removeItem(USER_KEY); } catch (e) {} },

    /* ----- تنظیمات ----- */
    getPrefs: function () { var p = readMap(PREFS_KEY); return { notify: p.notify !== false, privacy: !!p.privacy }; },
    setPref: function (k, v) { var p = readMap(PREFS_KEY); p[k] = v; writeMap(PREFS_KEY, p); }
  };

  global.SogStore = Store;
})(window);
