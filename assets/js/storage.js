/* ذخیره‌سازی محلی: آگهی‌های دیده‌شده (برای نشانگر مشاهده‌نشده) و بوکمارک‌ها.
   در نسخه‌ی وردپرس می‌تواند با حساب کاربری/سرور جایگزین شود. */
(function (global) {
  "use strict";

  var SEEN_KEY = "sog:seen";        // آرایه‌ی id آگهی‌های دیده‌شده
  var SAVED_KEY = "sog:saved";      // آرایه‌ی id بوکمارک‌ها
  var FOLLOW_KEY = "sog:follow";    // آرایه‌ی id آگهی‌های دنبال‌شده
  var SALAVAT_KEY = "sog:salavat";  // نگاشت id → تعداد صلوات کاربر
  var GUEST_KEY = "sog:guest";      // نگاشت id → آرایه‌ی پیام‌های دفتر یادبود
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
    getSalavat: function (id) { return readMap(SALAVAT_KEY)[id] || 0; },
    addSalavat: function (id) {
      var m = readMap(SALAVAT_KEY); m[id] = (m[id] || 0) + 1; writeMap(SALAVAT_KEY, m); return m[id];
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
