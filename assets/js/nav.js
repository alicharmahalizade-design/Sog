/* نوار ناوبری پایین ثابت — مشترک بین صفحات.
   استفاده: اسکریپت را در صفحه لود کنید و data-nav روی <body> تعیین کند تب فعال را.
   مقادیر: home | business | register | saved | account */
(function () {
  "use strict";
  var active = document.body.getAttribute("data-nav") || "";

  var ICON = {
    home: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 11l8-7 8 7M6 10v9h12v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    business: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 9l1-4h14l1 4M5 9v10h14V9M4 9h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 19v-5h6v5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
    saved: '<svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 3h12v18l-6-4-6 4V3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
    account: '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    register: '<svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };

  var items = [
    { key: "home", label: "آگهی‌ها", href: "index.html" },
    { key: "business", label: "کسب‌وکار", href: "business.html" },
    { key: "register", label: "ثبت سوگ", href: "register.html", center: true },
    { key: "saved", label: "ذخیره‌ها", href: "index.html?view=saved" },
    { key: "account", label: "حساب", href: "account.html" }
  ];

  var nav = document.createElement("nav");
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "ناوبری اصلی");
  items.forEach(function (it) {
    var a = document.createElement("a");
    a.className = "bn-item" + (it.center ? " bn-center" : "") + (active === it.key ? " is-active" : "");
    a.href = it.href;
    a.innerHTML = '<span class="bn-ico">' + ICON[it.key] + '</span><span class="bn-label">' + it.label + '</span>';
    nav.appendChild(a);
  });
  document.body.appendChild(nav);
  document.body.classList.add("has-bottom-nav");

  /* هنگام اسکرول، نوار پایین پنهان می‌شود و پس از توقف اسکرول برمی‌گردد */
  var idleTimer = null;
  var lastY = window.pageYOffset;
  window.addEventListener("scroll", function () {
    var y = window.pageYOffset;
    if (Math.abs(y - lastY) > 4) {
      lastY = y;
      if (y > 40) nav.classList.add("is-hidden");
    }
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { nav.classList.remove("is-hidden"); }, 220);
  }, { passive: true });
})();
