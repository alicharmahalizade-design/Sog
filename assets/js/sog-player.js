/* پلیر صوتی اختصاصی سوگ با اکولایزر زنده.
   ستون‌های اکولایزر از طیف واقعی صدا (Web Audio AnalyserNode) ساخته می‌شوند. */
(function (g) {
  var BARS = 28;
  var ctx = null, current = null;

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return (m + ":" + (s < 10 ? "0" : "") + s).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
  }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }

  var PLAY = '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  var PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor"/></svg>';

  function SogPlayer(src, title) {
    var root = el("div", "sp");
    var audio = new Audio(); audio.preload = "metadata"; audio.src = src;

    var btn = el("button", "sp-btn", PLAY); btn.type = "button"; btn.setAttribute("aria-label", "پخش");
    var body = el("div", "sp-body");
    var head = el("div", "sp-head");
    head.appendChild(el("span", "sp-title", title ? String(title).replace(/</g, "&lt;") : "نمونه صدا"));
    var time = el("span", "sp-time", fmt(0) + " / " + fmt(0));
    head.appendChild(time);

    /* اکولایزر: هم نمایشگر است و هم نوار جلو/عقب بردن */
    var eq = el("div", "sp-eq"); eq.setAttribute("role", "slider"); eq.setAttribute("aria-label", "موقعیت پخش"); eq.tabIndex = 0;
    var bars = [];
    for (var i = 0; i < BARS; i++) {
      var b = el("span", "sp-bar");
      /* شکل ثابتِ موج وقتی پخش نمی‌شود */
      var rest = 0.22 + 0.5 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6));
      b.dataset.rest = rest.toFixed(3);
      b.style.transform = "scaleY(" + rest + ")";
      eq.appendChild(b); bars.push(b);
    }
    body.appendChild(head); body.appendChild(eq);
    root.appendChild(btn); root.appendChild(body);

    var analyser = null, data = null, raf = 0;

    function setup() {
      if (analyser) return;
      try {
        ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
        var srcNode = ctx.createMediaElementSource(audio);
        analyser = ctx.createAnalyser(); analyser.fftSize = 128; analyser.smoothingTimeConstant = 0.78;
        srcNode.connect(analyser); analyser.connect(ctx.destination);
        data = new Uint8Array(analyser.frequencyBinCount);
      } catch (e) { analyser = null; }   /* بدون Web Audio: انیمیشن ساختگی */
    }

    function paintProgress() {
      var p = audio.duration ? audio.currentTime / audio.duration : 0;
      var played = Math.round(p * BARS);
      bars.forEach(function (b, k) { b.classList.toggle("is-played", k < played); });
      time.textContent = fmt(audio.currentTime) + " / " + fmt(audio.duration);
    }

    function loop() {
      if (analyser) {
        analyser.getByteFrequencyData(data);
        /* ۲۸ ستون روی بخش شنیداری طیف پخش می‌شوند */
        var usable = Math.floor(data.length * 0.7);
        bars.forEach(function (b, k) {
          /* مقیاس لگاریتمی‌گونه تا فرکانس‌های پایین همه‌ی ستون‌ها را نگیرند */
          var v = data[Math.floor(Math.pow(k / BARS, 1.8) * usable)] / 255;
          b.style.transform = "scaleY(" + Math.max(0.08, v).toFixed(3) + ")";
        });
      } else {
        var t = performance.now() / 160;
        bars.forEach(function (b, k) { b.style.transform = "scaleY(" + (0.25 + 0.7 * Math.abs(Math.sin(t + k * 0.55))).toFixed(3) + ")"; });
      }
      paintProgress();
      raf = requestAnimationFrame(loop);
    }

    function rest() {
      cancelAnimationFrame(raf);
      bars.forEach(function (b) { b.style.transform = "scaleY(" + b.dataset.rest + ")"; });
      paintProgress();
    }

    btn.addEventListener("click", function () {
      if (audio.paused) {
        if (current && current !== audio) current.pause();   /* فقط یک صدا در لحظه */
        setup();
        if (ctx && ctx.state === "suspended") ctx.resume();
        audio.play();
      } else audio.pause();
    });
    audio.addEventListener("play", function () {
      current = audio; root.classList.add("is-playing");
      btn.innerHTML = PAUSE; btn.setAttribute("aria-label", "توقف");
      cancelAnimationFrame(raf); loop();
    });
    audio.addEventListener("pause", function () {
      root.classList.remove("is-playing");
      btn.innerHTML = PLAY; btn.setAttribute("aria-label", "پخش");
      rest();
    });
    audio.addEventListener("ended", function () { audio.currentTime = 0; });
    audio.addEventListener("loadedmetadata", paintProgress);
    audio.addEventListener("timeupdate", function () { if (audio.paused) paintProgress(); });

    /* جلو و عقب: در RTL شروع از سمت راست است */
    function seekAt(x) {
      var r = eq.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (r.right - x) / r.width));
      if (audio.duration) { audio.currentTime = p * audio.duration; paintProgress(); }
    }
    eq.addEventListener("click", function (e) { seekAt(e.clientX); });
    eq.addEventListener("keydown", function (e) {
      if (!audio.duration) return;
      if (e.key === "ArrowLeft") audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
      else if (e.key === "ArrowRight") audio.currentTime = Math.max(0, audio.currentTime - 5);
      else return;
      e.preventDefault(); paintProgress();
    });

    root.audio = audio;
    root.setSrc = function (u) { audio.src = u; };
    return root;
  }

  g.SogPlayer = SogPlayer;
})(window);
