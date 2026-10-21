/* ثبت و ویرایش کسب‌وکار.
   نوع رسانه‌ها به دسته بستگی دارد: قاری، مداح و خواننده «صدا و تصویر»،
   بقیه (آشپز، پذیرایی، سنگ قبر و…) فقط «تصویر».
   بدون بک‌اند: اطلاعات در localStorage و فایل‌ها در IndexedDB نگه داشته می‌شوند. */
(function () {
  "use strict";

  /* دسته‌هایی که نمونه‌ی صدا هم دارند */
  var AUDIO_CATS = ["qari", "maddah", "khanande"];
  var MAX_GALLERY = 8, MAX_AUDIO = 3, MAX_AUDIO_MB = 15;

  var form = document.getElementById("brForm");
  var editId = new URLSearchParams(location.search).get("edit");
  var editing = editId ? SogBizStore.get(editId) : null;

  /* وضعیت رسانه‌ها: هر مورد یا «idb:کلید» ذخیره‌شده است یا فایل تازه */
  var media = { logo: null, cover: null, gallery: [], audio: [] };
  var removed = [];   /* فایل‌هایی که هنگام ویرایش حذف شدند */

  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function faNum(n) { return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }); }
  function toEn(s) { return String(s || "").replace(/[۰-۹]/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }

  function toast(msg) {
    var old = document.querySelector(".sog-toast"); if (old) old.remove();
    var t = el("div", "sog-toast", esc(msg)); document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  document.getElementById("backBtn").innerHTML = SogIcon("back", 22);
  document.getElementById("backBtn").addEventListener("click", function () {
    if (history.length > 1) history.back(); else location.href = "business.html";
  });

  /* تصویر را کوچک می‌کند تا حافظه پر نشود */
  function shrink(file, maxW) {
    return new Promise(function (res) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, maxW / img.width), c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { res(b || file); }, "image/jpeg", 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(url); res(file); };
      img.src = url;
    });
  }

  /* پیش‌نمایش هر مورد: فایل تازه یا ذخیره‌شده */
  function previewURL(item) {
    if (!item) return Promise.resolve("");
    if (item.blob) return Promise.resolve(item.url || (item.url = URL.createObjectURL(item.blob)));
    return SogBizStore.mediaURL(item.ref);
  }

  /* ---------- ساخت فرم ---------- */
  function field(label, input, opts) {
    opts = opts || {};
    var f = el("div", "field");
    f.appendChild(el("label", "field-label", esc(label) + (opts.req ? ' <span class="req">*</span>' : "")));
    f.appendChild(input);
    if (opts.hint) f.appendChild(el("p", "br-hint", esc(opts.hint)));
    var err = el("p", "br-err"); f.appendChild(err);
    return f;
  }
  function input(name, ph, type) {
    var i = el("input"); i.name = name; i.type = type || "text"; i.placeholder = ph || "";
    if (type === "tel") i.inputMode = "tel";
    return i;
  }
  function section(title, sub) {
    var s = el("section", "br-sec");
    s.appendChild(el("h2", "br-sec-title", esc(title)));
    if (sub) s.appendChild(el("p", "br-sec-sub", esc(sub)));
    form.appendChild(s);
    return s;
  }

  var CATS = [], CITIES = [];

  function build() {
    var s1 = section("اطلاعات اصلی");
    s1.appendChild(field("نام کسب‌وکار", input("name", "مثال: تشریفات آرامش"), { req: true }));
    var cat = el("select"); cat.name = "category";
    cat.innerHTML = '<option value="">انتخاب دسته…</option>' + CATS.map(function (c) {
      return '<option value="' + esc(c.slug) + '">' + esc(c.name) + "</option>";
    }).join("");
    s1.appendChild(field("دسته‌ی خدمات", cat, { req: true }));
    var city = el("select"); city.name = "city";
    city.innerHTML = '<option value="">انتخاب شهر…</option>' + CITIES.filter(function (c) { return c.slug !== "all"; }).map(function (c) {
      return '<option value="' + esc(c.slug) + '">' + esc(c.name) + "</option>";
    }).join("");
    s1.appendChild(field("شهر", city, { req: true }));
    s1.appendChild(field("نام مدیر", input("manager", "مثال: مهندس سیروس رزمجو")));

    var s2 = section("تماس", "شماره‌ی تماس برای مشتری‌ها نمایش داده می‌شود.");
    s2.appendChild(field("شماره تماس", input("phone", "۰۹۱۲۳۴۵۶۷۸۹", "tel"), { req: true }));
    var row = el("div", "field-row");
    row.appendChild(field("واتساپ", input("whatsapp", "۰۹…", "tel")));
    row.appendChild(field("ایتا", input("eitaa", "۰۹… یا آیدی")));
    s2.appendChild(row);
    s2.appendChild(field("تلگرام", input("telegram", "آیدی بدون @")));

    var s3 = section("آدرس و ساعات کاری");
    var addr = el("textarea"); addr.name = "address"; addr.rows = 2; addr.placeholder = "شهر - خیابان - پلاک";
    s3.appendChild(field("آدرس", addr));
    s3.appendChild(field("ساعات کاری", input("hours", "مثال: همه‌روزه ۸ تا ۲۲")));

    var s4 = section("معرفی و خدمات");
    var desc = el("textarea"); desc.name = "description"; desc.rows = 5; desc.maxLength = 1200;
    desc.placeholder = "کسب‌وکار خود را معرفی کنید: سابقه، کیفیت کار، شرایط…";
    s4.appendChild(field("درباره‌ی کسب‌وکار", desc, { req: true, hint: "حداقل ۲۰ حرف" }));
    s4.appendChild(servicesField());
    s4.appendChild(field("شروع قیمت", input("price_from", "مثال: از ۱٬۲۰۰٬۰۰۰ تومان")));

    var s5 = section("تصاویر");
    s5.appendChild(singleImage("logo", "لوگو", "مربعی، حداقل ۲۰۰×۲۰۰"));
    s5.appendChild(singleImage("cover", "تصویر کاور", "تصویر بالای صفحه، افقی"));
    s5.appendChild(galleryField());

    /* بخش صدا فقط برای دسته‌های صدادار */
    var s6 = section("نمونه صدا", "برای قاری، مداح و خواننده: نمونه‌ی اجرای خود را بارگذاری کنید.");
    s6.id = "brAudioSec";
    s6.appendChild(audioField());
    function syncAudio() {
      var on = AUDIO_CATS.indexOf(cat.value) !== -1;
      s6.hidden = !on;
    }
    cat.addEventListener("change", syncAudio);

    var actions = el("div", "reg-actions");
    var submit = el("button", "btn-next", editing ? "ذخیره‌ی تغییرات" : "ثبت کسب‌وکار");
    submit.type = "submit";
    actions.appendChild(submit);
    form.appendChild(actions);

    if (editing) fill(editing);
    syncAudio();
  }

  /* خدمات: تایپ و Enter یا دکمه‌ی افزودن */
  var services = [];
  function servicesField() {
    var wrap = el("div", "field");
    wrap.appendChild(el("label", "field-label", "خدمات"));
    var line = el("div", "br-svc-line");
    var i = input("svc", "مثال: پذیرایی");
    var add = el("button", "br-svc-add", "افزودن"); add.type = "button";
    line.appendChild(i); line.appendChild(add);
    var chips = el("div", "br-chips");
    wrap.appendChild(line); wrap.appendChild(chips);
    function paint() {
      chips.innerHTML = "";
      services.forEach(function (sv, k) {
        var c = el("span", "br-chip", esc(sv) + ' <button type="button" aria-label="حذف">×</button>');
        c.querySelector("button").addEventListener("click", function () { services.splice(k, 1); paint(); });
        chips.appendChild(c);
      });
    }
    function push() {
      var v = i.value.trim();
      if (v && services.indexOf(v) === -1 && services.length < 12) services.push(v);
      i.value = ""; paint(); i.focus();
    }
    add.addEventListener("click", push);
    i.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); push(); } });
    wrap.paint = paint;
    servicesField.paint = paint;
    return wrap;
  }

  function singleImage(key, label, hint) {
    var f = el("div", "field");
    f.appendChild(el("label", "field-label", esc(label)));
    var box = el("label", "upload-box br-up br-up-" + key);
    var file = el("input"); file.type = "file"; file.accept = "image/*"; file.hidden = true;
    box.appendChild(file);
    var inner = el("span", "up-inner", SogIcon("camera", 22) + "<span>انتخاب تصویر</span>");
    box.appendChild(inner);
    var rm = el("button", "br-rm", "×"); rm.type = "button"; rm.setAttribute("aria-label", "حذف"); rm.hidden = true;
    f.appendChild(box); f.appendChild(rm);
    f.appendChild(el("p", "br-hint", esc(hint)));
    function paint() {
      var it = media[key];
      var old = box.querySelector("img"); if (old) old.remove();
      box.classList.toggle("has-img", !!it); inner.hidden = !!it; rm.hidden = !it;
      if (it) previewURL(it).then(function (u) { var im = el("img"); im.src = u; im.alt = ""; box.appendChild(im); });
    }
    file.addEventListener("change", function () {
      var fl = file.files && file.files[0]; if (!fl) return;
      shrink(fl, key === "logo" ? 400 : 1200).then(function (b) {
        if (media[key] && media[key].ref) removed.push(media[key].ref);
        media[key] = { blob: b }; paint();
      });
      file.value = "";
    });
    rm.addEventListener("click", function () { if (media[key] && media[key].ref) removed.push(media[key].ref); media[key] = null; paint(); });
    singleImage[key] = paint;
    return f;
  }

  function galleryField() {
    var f = el("div", "field");
    f.appendChild(el("label", "field-label", "نمونه‌کارها (تا " + faNum(MAX_GALLERY) + " تصویر)"));
    var grid = el("div", "br-grid");
    var add = el("label", "br-add", SogIcon("plus", 22) + "<span>افزودن</span>");
    var file = el("input"); file.type = "file"; file.accept = "image/*"; file.multiple = true; file.hidden = true;
    add.appendChild(file);
    f.appendChild(grid);
    function paint() {
      grid.innerHTML = "";
      media.gallery.forEach(function (it, k) {
        var t = el("div", "br-thumb");
        previewURL(it).then(function (u) { t.style.backgroundImage = 'url("' + u + '")'; });
        var rm = el("button", "br-rm", "×"); rm.type = "button"; rm.setAttribute("aria-label", "حذف");
        rm.addEventListener("click", function () { if (it.ref) removed.push(it.ref); media.gallery.splice(k, 1); paint(); });
        t.appendChild(rm); grid.appendChild(t);
      });
      if (media.gallery.length < MAX_GALLERY) grid.appendChild(add);
    }
    file.addEventListener("change", function () {
      var files = Array.prototype.slice.call(file.files || [], 0, MAX_GALLERY - media.gallery.length);
      Promise.all(files.map(function (fl) { return shrink(fl, 1200); })).then(function (bs) {
        bs.forEach(function (b) { media.gallery.push({ blob: b }); }); paint();
      });
      file.value = "";
    });
    galleryField.paint = paint;
    paint();
    return f;
  }

  function audioField() {
    var f = el("div", "field");
    f.appendChild(el("label", "field-label", "فایل صوتی (تا " + faNum(MAX_AUDIO) + " فایل، هر کدام حداکثر " + faNum(MAX_AUDIO_MB) + " مگابایت)"));
    var list = el("div", "br-audios");
    var add = el("label", "br-add br-add-audio", SogIcon("reciter", 22) + "<span>افزودن فایل صوتی (mp3، m4a، ogg)</span>");
    var file = el("input"); file.type = "file"; file.accept = "audio/*"; file.hidden = true;
    add.appendChild(file);
    f.appendChild(list); f.appendChild(add);
    function paint() {
      list.innerHTML = "";
      media.audio.forEach(function (it, k) {
        var row = el("div", "br-audio");
        var t = input("", "عنوان (مثال: سوره‌ی الرحمن)"); t.value = it.title || "";
        t.addEventListener("input", function () { it.title = t.value; });
        var au = SogPlayer("", it.title);
        previewURL(it).then(function (u) { au.setSrc(u); });
        var rm = el("button", "br-rm", "×"); rm.type = "button"; rm.setAttribute("aria-label", "حذف");
        rm.addEventListener("click", function () { if (it.ref) removed.push(it.ref); media.audio.splice(k, 1); paint(); });
        row.appendChild(t); row.appendChild(au); row.appendChild(rm);
        list.appendChild(row);
      });
      add.hidden = media.audio.length >= MAX_AUDIO;
    }
    file.addEventListener("change", function () {
      var fl = file.files && file.files[0]; file.value = "";
      if (!fl) return;
      if (fl.size > MAX_AUDIO_MB * 1024 * 1024) { toast("حجم فایل صوتی بیش از " + faNum(MAX_AUDIO_MB) + " مگابایت است."); return; }
      media.audio.push({ blob: fl, title: fl.name.replace(/\.[^.]+$/, "") }); paint();
    });
    audioField.paint = paint;
    return f;
  }

  /* ---------- پر کردن فرم هنگام ویرایش ---------- */
  function fill(b) {
    document.getElementById("brTitle").textContent = "ویرایش کسب‌وکار";
    ["name", "manager", "phone", "whatsapp", "eitaa", "telegram", "address", "hours", "description", "price_from"].forEach(function (k) {
      if (form.elements[k]) form.elements[k].value = b[k] || "";
    });
    form.elements.category.value = b.category_slug || "";
    form.elements.city.value = b.city_slug || "";
    services = (b.services || []).slice(); servicesField.paint();
    media.logo = b.logo ? { ref: b.logo } : null;
    media.cover = b.cover ? { ref: b.cover } : null;
    media.gallery = (b.gallery || []).map(function (r) { return { ref: r }; });
    media.audio = (b.audio || []).map(function (a) { return { ref: a.src, title: a.title }; });
    singleImage.logo(); singleImage.cover(); galleryField.paint(); audioField.paint();
  }

  /* ---------- اعتبارسنجی و ذخیره ---------- */
  function setErr(name, msg) {
    var inp = form.elements[name]; if (!inp) return;
    var f = inp.closest(".field"), e = f && f.querySelector(".br-err");
    if (e) e.textContent = msg || "";
    if (f) f.classList.toggle("has-err", !!msg);
  }

  function validate() {
    var ok = true, first = null;
    function need(name, cond, msg) {
      setErr(name, cond ? "" : msg);
      if (!cond) { ok = false; if (!first) first = form.elements[name]; }
    }
    var v = function (n) { return (form.elements[n].value || "").trim(); };
    need("name", v("name").length >= 2, "نام کسب‌وکار را بنویسید.");
    need("category", !!v("category"), "دسته را انتخاب کنید.");
    need("city", !!v("city"), "شهر را انتخاب کنید.");
    need("phone", /^09\d{9}$/.test(toEn(v("phone")).replace(/\D/g, "")), "شماره موبایل ۱۱ رقمی و با ۰۹ شروع شود.");
    var wa = toEn(v("whatsapp")).replace(/\D/g, "");
    need("whatsapp", !wa || /^09\d{9}$/.test(wa), "شماره واتساپ درست نیست.");
    need("description", v("description").length >= 20, "حداقل ۲۰ حرف درباره‌ی کسب‌وکار بنویسید.");
    if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
    return ok;
  }

  /* ارسال به Supabase برای بررسی؛ فایل‌های IndexedDB بارگذاری و با آدرس عمومی جایگزین می‌شوند */
  function sendForReview(biz) {
    if (!(window.SogDB && SogDB.enabled)) return Promise.resolve();
    function pub(ref) {
      if (typeof ref !== "string" || ref.indexOf("idb:") !== 0) return Promise.resolve(ref);
      return SogBizStore.mediaURL(ref).then(function (u) {
        if (!u) return "";
        return fetch(u).then(function (r) { return r.blob(); }).then(function (bl) { return SogDB.upload(bl, "businesses"); });
      });
    }
    var copy = JSON.parse(JSON.stringify(biz));
    return Promise.all([
      pub(copy.logo), pub(copy.cover),
      Promise.all((copy.gallery || []).map(pub)),
      Promise.all((copy.audio || []).map(function (a) { return pub(a.src).then(function (u) { return { title: a.title, src: u }; }); }))
    ]).then(function (r) {
      copy.logo = r[0] || "assets/img/logo.png"; copy.cover = r[1] || "";
      copy.gallery = r[2].filter(Boolean); copy.audio = r[3].filter(function (a) { return a.src; });
      copy.mine = false; copy.pending = false;
      return SogDB.insert("submissions", { kind: "business", payload: { biz: copy } });
    });
  }

  /* فایل تازه را ذخیره و ارجاعش را برمی‌گرداند */
  function store(it) { return it.blob ? SogBizStore.putMedia(it.blob) : Promise.resolve(it.ref); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) { toast("لطفاً موارد مشخص‌شده را کامل کنید."); return; }
    var btn = form.querySelector(".btn-next"); btn.disabled = true; btn.textContent = "در حال ذخیره…";
    var v = function (n) { return (form.elements[n].value || "").trim(); };
    var cat = CATS.filter(function (c) { return c.slug === v("category"); })[0] || {};
    var city = CITIES.filter(function (c) { return c.slug === v("city"); })[0] || {};
    var hasAudio = AUDIO_CATS.indexOf(cat.slug) !== -1;
    if (!hasAudio) media.audio.forEach(function (a) { if (a.ref) removed.push(a.ref); });

    Promise.all([
      media.logo ? store(media.logo) : null,
      media.cover ? store(media.cover) : null,
      Promise.all(media.gallery.map(store)),
      Promise.all((hasAudio ? media.audio : []).map(function (a) {
        return store(a).then(function (r) { return { title: (a.title || "").trim(), src: r }; });
      }))
    ]).then(function (r) {
      var phone = faNum(toEn(v("phone")).replace(/\D/g, ""));
      var wa = toEn(v("whatsapp")).replace(/\D/g, "");
      var biz = {
        id: editing ? editing.id : "u" + Date.now().toString(36),
        mine: true, pending: true, created_at: editing ? editing.created_at : Date.now(),
        name: v("name"), manager: v("manager"),
        category_slug: cat.slug, category_name: cat.name,
        city: city.name, city_slug: city.slug,
        phone: phone, whatsapp: wa ? faNum(wa) : phone,
        eitaa: v("eitaa"), telegram: v("telegram").replace(/^@/, ""),
        address: v("address"), hours: v("hours"),
        description: v("description"), services: services.slice(), price_from: v("price_from"),
        logo: r[0] || "assets/img/logo.png", cover: r[1] || "",
        gallery: r[2], audio: r[3],
        rating: editing ? editing.rating : "—", reviews: editing ? editing.reviews : "۰",
        reviews_list: editing ? editing.reviews_list || [] : [],
        verified: false, featured: false, partner: false, tier: "basic"
      };
      if (biz.logo === "assets/img/logo.png" && editing && editing.logo && !media.logo) removed.push(editing.logo);
      if (!SogBizStore.upsert(biz)) throw new Error("quota");
      removed.forEach(SogBizStore.delMedia);
      /* با Supabase: نسخه‌ای با فایل‌های بارگذاری‌شده برای بررسی مدیر فرستاده می‌شود */
      return sendForReview(biz).then(function () {
        document.getElementById("brView").href = "business-detail.html?id=" + encodeURIComponent(biz.id);
        document.getElementById("brSuccess").classList.add("show");
      }, function (err) {
        console.error(err);
        btn.disabled = false; btn.textContent = editing ? "ذخیره‌ی تغییرات" : "ثبت کسب‌وکار";
        toast("روی این دستگاه ذخیره شد ولی برای بررسی ارسال نشد؛ اتصال اینترنت را بررسی کنید و دوباره بزنید.");
        throw null;
      });
    }).catch(function (err) {
      if (err === null) return;
      console.error(err);
      btn.disabled = false; btn.textContent = editing ? "ذخیره‌ی تغییرات" : "ثبت کسب‌وکار";
      toast("ذخیره نشد؛ حافظه‌ی مرورگر پر است. تعداد یا حجم فایل‌ها را کم کنید.");
    });
  });

  /* ---------- کسب‌وکارهای من ---------- */
  function paintMine() {
    var box = document.getElementById("brMine");
    var list = SogBizStore.all();
    box.hidden = !list.length || !!editing;
    if (box.hidden) return;
    box.innerHTML = "";
    box.appendChild(el("h2", "br-sec-title", "کسب‌وکارهای من"));
    list.forEach(function (b) {
      var row = el("div", "br-mine-row");
      var lg = el("span", "br-mine-logo");
      SogBizStore.mediaURL(b.logo).then(function (u) { lg.style.backgroundImage = 'url("' + u + '")'; });
      var info = el("a", "br-mine-info", '<b>' + esc(b.name) + '</b><span>' + esc(b.category_name) + " • " + esc(b.city) + ' • <i>در انتظار تأیید</i></span>');
      info.href = "business-detail.html?id=" + encodeURIComponent(b.id);
      var ed = el("a", "br-mine-btn", "ویرایش"); ed.href = "biz-register.html?edit=" + encodeURIComponent(b.id);
      var del = el("button", "br-mine-btn danger", "حذف"); del.type = "button";
      del.addEventListener("click", function () {
        if (!confirm("«" + b.name + "» حذف شود؟")) return;
        SogBizStore.remove(b.id); paintMine(); toast("کسب‌وکار حذف شد.");
      });
      row.appendChild(lg); row.appendChild(info); row.appendChild(ed); row.appendChild(del);
      box.appendChild(row);
    });
    box.appendChild(el("p", "br-sec-sub br-new", "یا یک کسب‌وکار جدید ثبت کنید:"));
  }

  Promise.all([
    fetch("data/businesses.json").then(function (r) { return r.json(); }),
    fetch("data/cities.json").then(function (r) { return r.json(); })
  ]).then(function (res) {
    CATS = res[0].categories || []; CITIES = res[1].cities || [];
    if (editId && !editing) toast("این کسب‌وکار پیدا نشد؛ فرم خالی است.");
    form.innerHTML = "";
    build(); paintMine();
  }).catch(function () { form.innerHTML = '<p class="br-sec-sub">خطا در بارگذاری فرم.</p>'; });
})();
