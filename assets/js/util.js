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

  g.SogUtil = { toEn: toEn, waLink: waLink, badge: badge };
})(window);
