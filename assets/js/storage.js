/* ذخیره‌سازی محلی: آگهی‌های دیده‌شده (برای نشانگر مشاهده‌نشده) و بوکمارک‌ها.
   در نسخه‌ی وردپرس می‌تواند با حساب کاربری/سرور جایگزین شود. */
(function (global) {
  "use strict";

  var SEEN_KEY = "sog:seen";        // آرایه‌ی id آگهی‌های دیده‌شده
  var SAVED_KEY = "sog:saved";      // آرایه‌ی id بوکمارک‌ها

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  }
  function write(key, arr) {
    try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
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
    }
  };

  global.SogStore = Store;
})(window);
