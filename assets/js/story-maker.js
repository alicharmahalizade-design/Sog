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
  /* ردیف کپسول‌ها: اندازه‌ی متن کم می‌شود تا ردیف در عرض جا شود؛ اگر باز جا نشد، آخری‌ها حذف می‌شوند.
     items: [{ parts: [[متن, رنگ], …] }] — در راست‌به‌چپ اولی سمت راست می‌نشیند. */
  function pillRow(x, items, cy, maxW, o) {
    items = items.filter(function (it) { return it && it.parts && it.parts.length; });
    if (!items.length) return;
    var size = o.size, gap = 16, padX = o.padX || 28, sep = o.sep || 14;
    function partsW(it) {
      var w = 0;
      it.parts.forEach(function (pt, i) { w += x.measureText(pt[0]).width + (i ? sep : 0); });
      return w + padX * 2;
    }
    function total() { return items.reduce(function (n, it) { return n + partsW(it); }, 0) + gap * (items.length - 1); }
    for (;;) {
      x.font = o.weight + " " + size + "px IRANSansX, Tahoma";
      if (total() <= maxW) break;
      if (size > o.min) { size -= 2; continue; }
      if (items.length > 1) { items = items.slice(0, -1); size = o.size; continue; }
      break;
    }
    var right = x.canvas.width / 2 + total() / 2, h = o.h;
    x.textBaseline = "middle"; x.textAlign = "right";
    items.forEach(function (it) {
      var w = partsW(it), left = right - w;
      roundPath(x, left, cy - h / 2, w, h, o.r || 18);
      x.fillStyle = o.bg; x.fill();
      var tx = right - padX;
      it.parts.forEach(function (pt, i) {
        if (i) tx -= sep;
        x.fillStyle = pt[1]; x.fillText(pt[0], tx, cy + 2);
        tx -= x.measureText(pt[0]).width;
      });
      right = left - gap;
    });
    x.textAlign = "center"; x.textBaseline = "alphabetic";
  }

  /* استوری ۱۰۸۰×۱۹۲۰: کارت با قاب نازک، تصویر، کپسول‌های مراسم، نام، کپسول‌های طایفه و پدر،
     و زیر کارت نوار «اطلاعات بیشتر در سایت سوگ» با لوگو. کل مجموعه در قاب وسط می‌نشیند. */
  function makeStory(d, portrait, logo, labels) {
    var W = 1080, H = 1920, x = document.createElement("canvas").getContext("2d");
    x.canvas.width = W; x.canvas.height = H;
    x.fillStyle = "#000"; x.fillRect(0, 0, W, H);
    x.direction = "rtl"; x.textAlign = "center";

    if (typeof labels === "string") labels = labels ? [labels] : [];
    labels = (labels || []).filter(Boolean);
    var f = (d.family && d.family.father) || {};
    var kin = [];
    if (f.tayefe) kin.push({ parts: [["طایفه", "#d6d6d6"], ["|", "#6a6a6a"], [f.tayefe, "#ffffff"]] });
    if (f.name) kin.push({ parts: [["پدر", "#d6d6d6"], ["|", "#6a6a6a"], [f.name, "#ffffff"]] });

    /* اندازه‌ها */
    var cardW = 952, cardL = (W - cardW) / 2, pad = 60;
    var phW = cardW - pad * 2, phH = 976;
    /* نام: تا ۸۰px؛ بلندتر از یک خط، دو خط می‌شود */
    var nameSize = 80;
    x.font = "800 " + nameSize + "px IRANSansX, Tahoma";
    while (x.measureText(d.deceased_name).width > phW * 1.7 && nameSize > 56) { nameSize -= 2; x.font = "800 " + nameSize + "px IRANSansX, Tahoma"; }
    var lines = wrapName(x, d.deceased_name, phW);
    var lineH = Math.round(nameSize * 1.25);
    var cardH = pad + phH + (labels.length ? 56 + 64 : 0) + 56 + lines.length * lineH + (kin.length ? 36 + 68 : 0) + 64;
    var barH = 108, gapBar = 40;
    var top = Math.max(60, Math.round((H - (cardH + gapBar + barH)) / 2));

    /* کارت */
    roundPath(x, cardL, top, cardW, cardH, 60);
    x.fillStyle = "#050505"; x.fill();
    x.strokeStyle = "#3a3a3a"; x.lineWidth = 4; x.stroke();

    /* تصویر */
    var y = top + pad;
    drawFramedPhoto(x, portrait, cardL + pad, y, phW, phH, 52);
    y += phH;

    /* کپسول‌های مراسم */
    if (labels.length) {
      y += 56 + 32;
      pillRow(x, labels.map(function (l) { return { parts: [[l, "#e6bf8f"]] }; }), y, phW,
        { size: 32, min: 24, weight: "500", h: 64, bg: "#3a2a1c", r: 16 });
      y += 32;
    }

    /* نام */
    y += 56;
    x.fillStyle = "#ffffff"; x.font = "800 " + nameSize + "px IRANSansX, Tahoma";
    x.textBaseline = "middle";
    lines.forEach(function (ln, i) { x.fillText(ln, W / 2, y + lineH / 2 + i * lineH); });
    x.textBaseline = "alphabetic";
    y += lines.length * lineH;

    /* طایفه و پدر */
    if (kin.length) {
      y += 36 + 34;
      pillRow(x, kin, y, phW, { size: 32, min: 22, weight: "500", h: 68, bg: "#262626", r: 18, sep: 14 });
    }

    /* نوار پایین: لوگو، متن و فلش */
    var barW = cardW - 44, barL = (W - barW) / 2, barT = top + cardH + gapBar;
    roundPath(x, barL, barT, barW, barH, 26);
    x.fillStyle = "#1f1f1f"; x.fill();
    var lg = 76, lgL = barL + 16, lgT = barT + (barH - lg) / 2;
    x.save(); roundPath(x, lgL, lgT, lg, lg, 18); x.clip();
    /* حروف لوگو شفاف‌اند؛ مثل هدر سایت روی زمینه‌ی مشکی */
    x.fillStyle = logo ? "#000" : "#fff"; x.fillRect(lgL, lgT, lg, lg);
    if (logo) x.drawImage(logo, lgL, lgT, lg, lg);
    x.restore();
    x.fillStyle = "#ffffff"; x.font = "500 38px IRANSansX, Tahoma";
    x.textBaseline = "middle"; x.textAlign = "right";
    var label = "اطلاعات بیشتر در سایت سوگ", tR = barL + barW - 48;
    x.fillText(label, tR, barT + barH / 2 + 2);
    var ax = tR - x.measureText(label).width - 56, ay = barT + barH / 2;
    x.strokeStyle = "#ffffff"; x.lineWidth = 5; x.lineCap = "round"; x.lineJoin = "round";
    x.beginPath(); x.moveTo(ax - 16, ay - 8); x.lineTo(ax, ay + 8); x.lineTo(ax + 16, ay - 8); x.stroke();
    x.textAlign = "center"; x.textBaseline = "alphabetic";
    return x.canvas;
  }
  function open(d, opts) {
    opts = opts || {};
    var run = function () {
      Promise.all([loadPortrait(d), loadLogo()]).then(function (res) {
        var canvas = makeStory(d, res[0], res[1], opts.labels || opts.label || "");
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
