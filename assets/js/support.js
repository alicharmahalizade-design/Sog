/* چت پشتیبانی سوگ — پیام متنی و صوتی، دوطرفه.
   گفت‌وگو روی همین دستگاه نگه داشته می‌شود و اگر آدرس سرویس پشتیبانی تنظیم شده باشد
   (window.SOG_SUPPORT_API یا کلید sog:supportApi) پیام‌ها به همان‌جا ارسال و پاسخ‌ها
   از همان‌جا خوانده می‌شوند. */
(function () {
  "use strict";

  var KEY = "sog:chat";
  var FA = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  function toFa(n) { return String(n).replace(/[0-9]/g, function (d) { return FA[+d]; }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var log = document.getElementById("chatLog");
  var form = document.getElementById("chatBar");
  var input = document.getElementById("chatInput");
  var micBtn = document.getElementById("micBtn");
  var recBar = document.getElementById("recBar");
  var recTime = document.getElementById("recTime");
  var recCancel = document.getElementById("recCancel");
  var statusEl = document.getElementById("chatStatus");

  /* ---------- نگه‌داری گفت‌وگو ---------- */
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); }
    catch (e) {
      /* اگر حافظه پر شد، صداهای قدیمی حذف می‌شوند تا متن‌ها بمانند */
      for (var i = 0; i < list.length && i < 40; i++) {
        if (list[i].audio) { delete list[i].audio; list[i].expired = true; }
        try { localStorage.setItem(KEY, JSON.stringify(list)); return; } catch (e2) {}
      }
    }
  }
  var msgs = read();

  function api() {
    if (window.SOG_SUPPORT_API) return window.SOG_SUPPORT_API;
    try { return localStorage.getItem("sog:supportApi") || ""; } catch (e) { return ""; }
  }

  function nowStamp() {
    var d = new Date();
    return toFa(d.getHours()) + ":" + toFa(d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes());
  }

  /* ---------- رندر ---------- */
  function bubble(m) {
    var row = el("div", "msg-row " + (m.from === "me" ? "is-me" : "is-support"));
    var b = el("div", "bubble");

    if (m.audio) {
      b.classList.add("has-audio");
      var play = el("button", "voice-play", iconPlay());
      play.type = "button";
      var bar = el("span", "voice-bar", '<span class="voice-fill"></span>');
      var dur = el("span", "voice-dur", m.dur ? toFa(fmtDur(m.dur)) : "");
      var audio = new Audio(m.audio);
      var fill = bar.querySelector(".voice-fill");
      play.addEventListener("click", function () {
        if (audio.paused) { audio.play(); play.innerHTML = iconPause(); }
        else { audio.pause(); play.innerHTML = iconPlay(); }
      });
      audio.addEventListener("timeupdate", function () {
        if (audio.duration) fill.style.width = (audio.currentTime / audio.duration * 100) + "%";
        dur.textContent = toFa(fmtDur(Math.max(0, (audio.duration || m.dur || 0) - audio.currentTime)));
      });
      audio.addEventListener("ended", function () {
        play.innerHTML = iconPlay(); fill.style.width = "0%";
        dur.textContent = toFa(fmtDur(m.dur || 0));
      });
      b.appendChild(play); b.appendChild(bar); b.appendChild(dur);
    } else if (m.expired) {
      b.appendChild(el("span", "msg-text msg-faded", "پیام صوتی (برای آزاد شدن حافظه حذف شد)"));
    } else {
      b.appendChild(el("span", "msg-text", esc(m.text).replace(/\n/g, "<br>")));
    }

    var meta = el("span", "msg-meta", esc(m.at || ""));
    if (m.from === "me") meta.insertAdjacentHTML("beforeend", m.sent ? ' <span class="msg-tick">✓✓</span>' : ' <span class="msg-tick one">✓</span>');
    b.appendChild(meta);
    row.appendChild(b);
    return row;
  }

  function fmtDur(sec) {
    sec = Math.round(sec || 0);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  }
  function iconPlay() { return '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>'; }
  function iconPause() { return '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M8 5h3v14H8zM13 5h3v14h-3z" fill="currentColor"/></svg>'; }

  function paint() {
    log.innerHTML = "";
    if (!msgs.length) {
      log.appendChild(el("div", "chat-intro",
        '<strong>به پشتیبانی سوگ خوش آمدید</strong>' +
        '<p>سؤال یا مشکل‌تان را بنویسید یا پیام صوتی بفرستید؛ پشتیبان در ساعات کاری پاسخ می‌دهد.</p>'));
    }
    var lastDay = "";
    msgs.forEach(function (m) {
      if (m.day && m.day !== lastDay) { lastDay = m.day; log.appendChild(el("div", "chat-day", esc(m.day))); }
      log.appendChild(bubble(m));
    });
    log.scrollTop = log.scrollHeight;
  }

  function todayFa() {
    if (!window.SogUtil) return "";
    var t = SogUtil.todayJalali();
    return toFa(t.y) + "/" + toFa(t.m < 10 ? "0" + t.m : t.m) + "/" + toFa(t.d < 10 ? "0" + t.d : t.d);
  }

  function push(m) {
    m.id = "m" + Date.now() + Math.random().toString(36).slice(2, 6);
    m.at = nowStamp();
    m.day = todayFa();
    msgs.push(m);
    write(msgs);
    paint();
    if (m.from === "me") send(m);
  }

  /* ---------- ارسال به پشتیبان ---------- */
  function send(m) {
    var url = api();
    if (!url) { statusEl.textContent = "پیام شما ثبت شد؛ پشتیبان پس از اتصال سرویس پاسخ می‌دهد"; return; }
    var user = (window.SogStore && SogStore.getUser()) || {};
    fetch(url.replace(/\/$/, "") + "/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: m.id, text: m.text || "", audio: m.audio || "", dur: m.dur || 0,
        user: { name: user.name || "", phone: user.phone || "" }
      })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function () {
      m.sent = true; write(msgs); paint();
    }).catch(function () {});
  }

  /* پاسخ‌های پشتیبان: هر ۱۰ ثانیه از سرویس خوانده می‌شوند */
  function poll() {
    var url = api();
    if (!url) return;
    var since = msgs.length ? msgs[msgs.length - 1].id : "";
    fetch(url.replace(/\/$/, "") + "/replies?since=" + encodeURIComponent(since))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.messages || !d.messages.length) return;
        d.messages.forEach(function (x) {
          if (msgs.some(function (m) { return m.id === x.id; })) return;
          msgs.push({ id: x.id, from: "support", text: x.text || "", audio: x.audio || "", dur: x.dur || 0, at: x.at || nowStamp(), day: x.day || todayFa() });
        });
        write(msgs); paint();
      }).catch(function () {});
  }
  setInterval(poll, 10000);
  poll();

  /* ---------- ارسال متن ---------- */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var t = input.value.trim();
    if (!t) return;
    push({ from: "me", text: t });
    input.value = ""; input.style.height = "auto";
  });
  input.addEventListener("input", function () {
    input.style.height = "auto";
    input.style.height = Math.min(120, input.scrollHeight) + "px";
  });
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.dispatchEvent(new Event("submit")); }
  });

  /* ---------- پیام صوتی ---------- */
  var rec = null, chunks = [], startAt = 0, timer = null, cancelled = false;
  var MAX_MS = 120000;   /* حداکثر دو دقیقه */

  function stopTimer() { clearInterval(timer); timer = null; }

  function startRec() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      toast("ضبط صدا در این مرورگر پشتیبانی نمی‌شود.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      cancelled = false; chunks = [];
      rec = new MediaRecorder(stream);
      rec.addEventListener("dataavailable", function (e) { if (e.data && e.data.size) chunks.push(e.data); });
      rec.addEventListener("stop", function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stopTimer(); recBar.hidden = true; micBtn.classList.remove("is-rec");
        var sec = Math.round((Date.now() - startAt) / 1000);
        if (cancelled || !chunks.length || sec < 1) return;
        var blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        var fr = new FileReader();
        fr.onload = function () { push({ from: "me", audio: fr.result, dur: sec }); };
        fr.readAsDataURL(blob);
      });
      rec.start();
      startAt = Date.now();
      recBar.hidden = false; micBtn.classList.add("is-rec");
      recTime.textContent = toFa("0:00");
      timer = setInterval(function () {
        var s = Math.round((Date.now() - startAt) / 1000);
        recTime.textContent = toFa(fmtDur(s));
        if (Date.now() - startAt >= MAX_MS) stopRec();
      }, 250);
    }).catch(function () {
      toast("اجازه‌ی دسترسی به میکروفون داده نشد.");
    });
  }
  function stopRec() { if (rec && rec.state !== "inactive") rec.stop(); }

  micBtn.addEventListener("click", function () {
    if (rec && rec.state === "recording") stopRec(); else startRec();
  });
  recCancel.addEventListener("click", function () { cancelled = true; stopRec(); });

  /* ---------- توست ---------- */
  function toast(msg) {
    var t = el("div", "sog-toast", esc(msg));
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("is-in"); });
    setTimeout(function () { t.classList.remove("is-in"); setTimeout(function () { if (t.parentNode) t.remove(); }, 300); }, 2600);
  }

  paint();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js", { updateViaCache: "none" }).catch(function () {});
    });
  }
})();
