/* سوگ — نمایشگر تمام‌صفحه‌ی تصویر (مشترک بین صفحه‌ها)
   SogLightbox(images, start): تصویر بزرگ؛ برای چند تصویر با نوار بندانگشتی و پیمایش. */
(function () {
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function faNum(n) { return String(n).replace(/[0-9]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[+d]; }); }
  function toast(msg) {
    var old = document.querySelector(".sog-toast");
    if (old) old.remove();
    var t = el("div", "sog-toast"); t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () { t.remove(); }, 2200);
  }

  /* ---------- نمایشگر تمام‌صفحه ----------
     تصویر بزرگ با نوار بندانگشتی پایین؛ کلیک روی هر بندانگشتی آن را بالا می‌آورد. */
  function openLightbox(images, start) {
    images = (images || []).filter(Boolean);
    if (!images.length) return;
    var single = images.length === 1;
    var i = start || 0;
    var lb = el("div", "lb");
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");

    var bar = el("div", "lb-bar");
    var close = el("button", "lb-btn", SogIcon("close", 22));
    close.type = "button"; close.setAttribute("aria-label", "بستن");
    var share = el("button", "lb-btn", SogIcon("upload", 22));
    share.type = "button"; share.setAttribute("aria-label", "هم‌رسانی");
    bar.appendChild(close); bar.appendChild(share);

    var stage = el("div", "lb-stage");
    var img = el("img", "lb-img"); img.alt = "";
    var prev = el("button", "lb-nav lb-prev", SogIcon("chevLeft", 24));
    var next = el("button", "lb-nav lb-next", SogIcon("chevRight", 24));
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "تصویر قبلی"); next.setAttribute("aria-label", "تصویر بعدی");
    var count = el("span", "lb-count");
    /* واترمارک سوگ، روی خود تصویر */
    var mark = el("span", "lb-mark",
      '<img src="assets/img/logo.png" alt="سوگ">');   /* فقط لوگو */
    /* شمارنده و واترمارک داخل قابِ خودِ تصویر می‌نشینند، نه گوشه‌ی صفحه */
    var frame = el("div", "lb-frame");
    frame.appendChild(img); frame.appendChild(count); frame.appendChild(mark);
    stage.appendChild(frame); stage.appendChild(prev); stage.appendChild(next);

    var strip = el("div", "lb-strip");
    images.forEach(function (src, n) {
      var t = el("button", "lb-thumb"); t.type = "button";
      t.style.backgroundImage = 'url("' + src + '")';
      t.setAttribute("aria-label", "تصویر " + faNum(n + 1));
      t.addEventListener("click", function () { show(n); });
      strip.appendChild(t);
    });

    lb.appendChild(bar); lb.appendChild(stage);
    if (!single) lb.appendChild(strip);
    else { lb.classList.add("lb-single"); prev.remove(); next.remove(); count.remove(); }
    /* لمس فضای خالی دور تصویر، نمایشگر را می‌بندد */
    stage.addEventListener("click", function (e) { if (e.target === stage) done(); });

    function show(n) {
      i = (n + images.length) % images.length;
      img.src = images[i];
      count.textContent = faNum(i + 1) + " از " + faNum(images.length);
      Array.prototype.forEach.call(strip.children, function (t, k) {
        t.classList.toggle("is-on", k === i);
      });
      var on = strip.children[i];
      if (on && on.scrollIntoView) on.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
    prev.addEventListener("click", function () { show(i - 1); });
    next.addEventListener("click", function () { show(i + 1); });

    /* کشیدن انگشت چپ و راست */
    var x0 = null;
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (!single && Math.abs(dx) > 45) show(dx > 0 ? i - 1 : i + 1);   /* RTL: کشیدن به راست = قبلی */
      x0 = null;
    });

    function done() {
      lb.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") done();
      else if (e.key === "ArrowLeft") show(i + 1);
      else if (e.key === "ArrowRight") show(i - 1);
    }
    close.addEventListener("click", done);
    document.addEventListener("keydown", onKey);
    share.addEventListener("click", function () {
      var url = location.href;
      if (navigator.share) navigator.share({ title: document.title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("نشانی کپی شد."); });
    });

    document.body.appendChild(lb);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { lb.classList.add("is-in"); });
    show(i);
  }

  window.SogLightbox = openLightbox;
})();
