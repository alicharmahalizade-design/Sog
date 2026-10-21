/* ساخت تصویر استوری آگهی (۱۰۸۰×۱۹۲۰) — مشترک بین صفحه‌ی آگهی و پاپ‌آپ سوگ فوری.
   SogStoryMaker.draw(d, portrait, logo, label) → canvas
   SogStoryMaker.open(d, { label, url })        → پیش‌نمایش با «ذخیره‌ی تصویر» و «استوری»
   d = { deceased_name, photo | photos[], subtitle, family: { father: { name, tayefe } } } */
(function (g) {
  "use strict";
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  function fitText(ctx, text, maxW, baseSize) {
    var size = baseSize;
    do { ctx.font = "700 " + size + "px IRANSansX, Tahoma"; size -= 2; }
    while (ctx.measureText(text).width > maxW && size > 30);
    return ctx.font;
  }
  function roundPath(x, left, top, w, h, r) {
    x.beginPath();
    x.moveTo(left + r, top);
    x.arcTo(left + w, top, left + w, top + h, r);
    x.arcTo(left + w, top + h, left, top + h, r);
    x.arcTo(left, top + h, left, top, r);
    x.arcTo(left, top, left + w, top, r);
    x.closePath();
  }
  function drawFramedPhoto(x, img, left, top, w, h, r) {
    x.save();
    roundPath(x, left, top, w, h, r); x.clip();
    x.fillStyle = "#151515"; x.fillRect(left, top, w, h);
    if (img) {
      var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      var scale = Math.max(w / iw, h / ih);
      var dw = iw * scale, dh = ih * scale;
      x.drawImage(img, left + (w - dw) / 2, top + (h - dh) / 2, dw, dh);
    }
    x.restore();
  }
  function drawOutlinePill(x, label, cx, cy, opt) {
    opt = opt || {};
    var size = opt.size || 42, maxW = (opt.maxW || x.canvas.width - 300);
    do { x.font = "700 " + size + "px IRANSansX, Tahoma"; size -= 2; }
    while (x.measureText(label).width > maxW && size > 24);
    var w = x.measureText(label).width + (opt.padX || 80), h = opt.h || 86, r = h / 2;
    roundPath(x, cx - w / 2, cy - h / 2, w, h, r);
    x.fillStyle = opt.fill || "rgba(255,255,255,.04)"; x.fill();
    x.strokeStyle = opt.stroke || "rgba(255,255,255,.22)"; x.lineWidth = 2.5; x.stroke();
    x.fillStyle = opt.color || "#f2f2f2";
    x.textBaseline = "middle";
    x.fillText(label, cx, cy + 2);
    x.textBaseline = "alphabetic";
  }
  function wrapName(x, text, maxW) {
    if (x.measureText(text).width <= maxW) return [text];
    var words = String(text).split(" "), line = "", out = [];
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (x.measureText(t).width > maxW && line) { out.push(line); line = w; }
      else line = t;
    });
    if (line) out.push(line);
    return out.slice(0, 2);
  }
  function fatherLine(d) {
    var f = (d.family && d.family.father) || {};
    var parts = [];
    if (f.name) parts.push("پدر: " + f.name);
    if (f.tayefe) parts.push("طایفه: " + f.tayefe);
    return parts.join("   |   ");
  }
  function loadLogo() {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = "assets/img/logo.png";
    });
  }
  function loadPortrait(d) {
    var src = (d.photos && d.photos[0]) || d.photo;
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = src;
    });
  }
  function makeStory(d, portrait, logo, label) {
    var W = 1080, H = 1920, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;

    /* پس‌زمینه‌ی تمام‌مشکی */
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);

    x.direction = "rtl"; x.textAlign = "center";

    /* کارت اصلی */
    var cardL = 64, cardT = 70, cardW = W - 128, cardH = 1560;
    roundPath(x, cardL, cardT, cardW, cardH, 60);
    x.fillStyle = "#070707"; x.fill();
    x.strokeStyle = "rgba(255,255,255,.14)"; x.lineWidth = 3; x.stroke();

    /* تصویر متوفی */
    var phL = cardL + 56, phT = cardT + 50, phW = cardW - 112, phH = 980;
    drawFramedPhoto(x, portrait, phL, phT, phW, phH, 46);

    var y = phT + phH + 96;

    /* نوع مراسم */
    var cl = label;
    if (cl) { drawOutlinePill(x, cl, W / 2, y, { size: 42, maxW: cardW - 180 }); y += 120; }

    /* نام و نام خانوادگی (حداکثر دو سطر) */
    x.fillStyle = "#ffffff";
    fitText(x, d.deceased_name, cardW - 150, 88);
    var lines = wrapName(x, d.deceased_name, cardW - 150);
    lines.forEach(function (ln, i) { x.fillText(ln, W / 2, y + 30 + i * 104); });
    y += 30 + (lines.length - 1) * 104;

    /* شرح کوتاه */
    if (d.subtitle) {
      x.fillStyle = "#9a9a9a"; x.font = "400 42px IRANSansX, Tahoma";
      x.fillText(d.subtitle, W / 2, y + 86);
      y += 86;
    }

    /* پدر و طایفه */
    var fl = fatherLine(d);
    if (fl) drawOutlinePill(x, fl, W / 2, y + 116, { size: 38, maxW: cardW - 180, h: 82 });

    /* نوار پایانی: اطلاعات بیشتر در سایت سوگ */
    var barW = 720, barH = 104, barL = (W - barW) / 2, barT = cardT + cardH + 60;
    roundPath(x, barL, barT, barW, barH, 32);
    x.fillStyle = "#1a1a1a"; x.fill();
    x.strokeStyle = "rgba(255,255,255,.10)"; x.lineWidth = 2; x.stroke();
    x.fillStyle = "#ffffff"; x.font = "700 44px IRANSansX, Tahoma";
    x.textBaseline = "middle";
    x.fillText("اطلاعات بیشتر در سایت سوگ", W / 2 + 34, barT + barH / 2 + 2);
    x.textBaseline = "alphabetic";

    /* فلش رو به پایین سمت چپ متن */
    var ax = barL + 84, ay = barT + barH / 2 - 8;
    x.strokeStyle = "#ffffff"; x.lineWidth = 6; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.moveTo(ax - 22, ay - 6); x.lineTo(ax, ay + 18); x.lineTo(ax + 22, ay - 6); x.stroke();

    return x.canvas;
  }
  function open(d, opts) {
    opts = opts || {};
    var run = function () {
      Promise.all([loadPortrait(d), loadLogo()]).then(function (res) {
        var canvas = makeStory(d, res[0], res[1], opts.label || "");
        canvas.toBlob(function (blob) {
          var url = URL.createObjectURL(blob);
          var fileName = "sog-story-" + d.deceased_name + ".png";
          var back = el("div", "sheet-backdrop story-back");
          var box = el("div", "story-modal");
          box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true");
          box.setAttribute("aria-label", "استوری آگهی");
          var close = el("button", "story-close", g.SogIcon ? SogIcon("close", 22) : "×");
          close.type = "button"; close.setAttribute("aria-label", "بستن");
          var img = el("img", "story-img"); img.src = url; img.alt = "استوری " + d.deceased_name;
          var hint = el("p", "story-hint", "ابعاد ۱۰۸۰×۱۹۲۰ — مناسب استوری اینستاگرام و واتساپ");
          var actions = el("div", "story-actions");
          var save = el("a", "btn-primary", "ذخیره‌ی تصویر");
          save.href = url; save.download = fileName;
          var share = el("button", "btn-ghost", opts.shareLabel || "استوری"); share.type = "button";
          share.addEventListener("click", function () {
            var file = new File([blob], fileName, { type: "image/png" });
            var payload = { title: d.deceased_name, text: (opts.text || "آگهی ترحیم " + d.deceased_name + " — سایت سوگ"), url: opts.url || location.href };
            if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share(Object.assign({ files: [file] }, payload)).catch(function () {});
            else if (navigator.share) navigator.share(payload).catch(function () {});
            else save.click();
          });
          actions.appendChild(save); actions.appendChild(share);
          box.appendChild(close); box.appendChild(img); box.appendChild(hint); box.appendChild(actions);
          document.body.appendChild(back); document.body.appendChild(box);
          var prevOverflow = document.body.style.overflow;
          document.body.style.overflow = "hidden";
          requestAnimationFrame(function () { back.classList.add("is-in"); box.classList.add("is-in"); });
          function done() {
            box.remove(); back.remove();
            document.body.style.overflow = prevOverflow;
            URL.revokeObjectURL(url);
            if (opts.onClose) opts.onClose();
          }
          close.addEventListener("click", done);
          back.addEventListener("click", done);
        }, "image/png");
      });
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load("700 92px IRANSansX"), document.fonts.load("400 44px IRANSansX")]).then(run).catch(run);
    } else run();
  }

  g.SogStoryMaker = { draw: makeStory, open: open };
})(window);
