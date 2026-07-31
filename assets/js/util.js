/* ابزارهای مشترک سوگ */
(function (g) {
  "use strict";
  function toEn(s) { return String(s == null ? "" : s).replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }); }

  // ساخت لینک واتساپ ایران: ۰۹۱۳… → 98913…
  function waLink(phone, text) {
    var n = toEn(phone).replace(/\D/g, "");
    if (n.charAt(0) === "0") n = "98" + n.slice(1);
    else if (n.slice(0, 2) !== "98") n = "98" + n;
    return "https://wa.me/" + n + (text ? "?text=" + encodeURIComponent(text) : "");
  }

  // نشان «همکار سوگ» یا «تأییدشده»
  var CHECK = '<svg viewBox="0 0 24 24" width="11" height="11"><path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var GEM = '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M6 3h12l3 6-9 12L3 9l3-6z" fill="currentColor"/><path d="M3 9h18M9 3l-2 6 5 12 5-12-2-6" fill="none" stroke="rgba(0,0,0,.3)" stroke-width="1"/></svg>';
  function badge(b) {
    if (b.partner) return '<span class="sog-badge partner" title="همکار رسمی سوگ">' + GEM + ' همکار سوگ</span>';
    if (b.verified) return '<span class="verified" title="تأییدشده">' + CHECK + '</span>';
    return "";
  }

  /* ---------- تقویم شمسی ---------- */
  var J_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  var J_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"]; // ایندکس = Date#getDay

  function gregorianToJalali(gy, gm, gd) {
    var gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    var jy = (gy <= 1600) ? 0 : 979;
    gy -= (gy <= 1600) ? 621 : 1600;
    var gy2 = (gm > 2) ? (gy + 1) : gy;
    var days = (365 * gy) + ((gy2 + 3) / 4 | 0) - ((gy2 + 99) / 100 | 0) + ((gy2 + 399) / 400 | 0) - 80 + gd + gdm[gm - 1];
    jy += 33 * (days / 12053 | 0); days %= 12053;
    jy += 4 * (days / 1461 | 0); days %= 1461;
    if (days > 365) { jy += ((days - 1) / 365 | 0); days = (days - 1) % 365; }
    var jm = (days < 186) ? 1 + (days / 31 | 0) : 7 + ((days - 186) / 30 | 0);
    var jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
    return { y: jy, m: jm, d: jd };
  }

  function jalaliToGregorian(jy, jm, jd) {
    var gy = (jy <= 979) ? 621 : 1600;
    jy -= (jy <= 979) ? 0 : 979;
    var days = (365 * jy) + ((jy / 33 | 0) * 8) + (((jy % 33) + 3) / 4 | 0) + 78 + jd +
      ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    gy += 400 * (days / 146097 | 0); days %= 146097;
    if (days > 36524) { days--; gy += 100 * (days / 36524 | 0); days %= 36524; if (days >= 365) days++; }
    gy += 4 * (days / 1461 | 0); days %= 1461;
    if (days > 365) { gy += ((days - 1) / 365 | 0); days = (days - 1) % 365; }
    var gd = days + 1;
    var leap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0);
    var ml = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var gm = 0;
    while (gm < 12 && gd > ml[gm]) { gd -= ml[gm]; gm++; }
    return { y: gy, m: gm + 1, d: gd };
  }

  // تاریخ شمسی امروز
  function todayJalali() {
    var n = new Date();
    return gregorianToJalali(n.getFullYear(), n.getMonth() + 1, n.getDate());
  }

  // شمار روزهای یک ماه شمسی (اسفند کبیسه با رفت‌وبرگشت تبدیل سنجیده می‌شود)
  function jalaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    var g = jalaliToGregorian(jy, 12, 30);
    var back = gregorianToJalali(g.y, g.m, g.d);
    return (back.y === jy && back.m === 12 && back.d === 30) ? 30 : 29;
  }

  // نام روز هفته‌ی یک تاریخ شمسی
  function jalaliWeekday(jy, jm, jd) {
    var g = jalaliToGregorian(jy, jm, jd);
    return J_WEEKDAYS[new Date(g.y, g.m - 1, g.d).getDay()];
  }

  g.SogUtil = {
    toEn: toEn, waLink: waLink, badge: badge,
    jMonths: J_MONTHS,
    gregorianToJalali: gregorianToJalali,
    jalaliToGregorian: jalaliToGregorian,
    todayJalali: todayJalali,
    jalaliMonthLength: jalaliMonthLength,
    jalaliWeekday: jalaliWeekday
  };
})(window);
