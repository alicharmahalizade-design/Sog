/* کلاینت کوچک Supabase برای سایت سوگ (بدون کتابخانه‌ی بیرونی).
   فقط وقتی فعال است که در sog-config.js آدرس و کلید عمومی پروژه پر شده باشد.
   REST (PostgREST)، RPC، ورود مدیر (Auth) و بارگذاری فایل (Storage). */
(function (g) {
  "use strict";

  var cfg = g.SOG_SUPABASE || {};
  var URL_ = String(cfg.url || "").replace(/\/+$/, "");
  var KEY = String(cfg.anonKey || "");
  var enabled = !!(URL_ && KEY);
  var AUTH_KEY = "sog:adminAuth";
  var BUCKET = "uploads";

  function readAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; } catch (e) { return null; } }
  function writeAuth(a) { try { if (a) localStorage.setItem(AUTH_KEY, JSON.stringify(a)); else localStorage.removeItem(AUTH_KEY); } catch (e) {} }

  function fail(r) {
    return r.text().then(function (t) {
      var msg = t;
      try { var j = JSON.parse(t); msg = j.message || j.msg || j.error_description || j.error || t; } catch (e) {}
      var err = new Error(msg || ("HTTP " + r.status));
      err.status = r.status;
      throw err;
    });
  }

  /* توکن مدیرِ واردشده (در صورت نزدیک بودن انقضا، تازه می‌شود) */
  var refreshing = null;
  function token() {
    var a = readAuth();
    if (!a || !a.access_token) return Promise.resolve(null);
    if (a.expires_at && Date.now() < (a.expires_at - 60) * 1000) return Promise.resolve(a.access_token);
    if (!a.refresh_token) { writeAuth(null); return Promise.resolve(null); }
    if (!refreshing) {
      refreshing = fetch(URL_ + "/auth/v1/token?grant_type=refresh_token", {
        method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: a.refresh_token })
      }).then(function (r) { return r.ok ? r.json() : fail(r); })
        .then(function (s) { saveSession(s); return s.access_token; })
        .catch(function () { writeAuth(null); return null; })
        .then(function (t) { refreshing = null; return t; });
    }
    return refreshing;
  }
  function saveSession(s) {
    writeAuth({
      access_token: s.access_token, refresh_token: s.refresh_token,
      expires_at: s.expires_at || Math.floor(Date.now() / 1000) + (s.expires_in || 3600),
      email: (s.user && s.user.email) || (readAuth() || {}).email || ""
    });
  }

  function headers(extra) {
    return token().then(function (t) {
      var h = { apikey: KEY, Authorization: "Bearer " + (t || KEY) };
      Object.keys(extra || {}).forEach(function (k) { h[k] = extra[k]; });
      return h;
    });
  }

  function req(method, path, body, extra) {
    if (!enabled) return Promise.reject(new Error("Supabase وصل نیست"));
    return headers(Object.assign({ "Content-Type": "application/json" }, extra || {})).then(function (h) {
      return fetch(URL_ + path, { method: method, headers: h, body: body == null ? undefined : JSON.stringify(body), cache: "no-store" });
    }).then(function (r) {
      if (!r.ok) return fail(r);
      if (r.status === 204) return null;
      return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
    });
  }

  /* ---------- فایل ---------- */
  function dataURLtoBlob(u) { return fetch(u).then(function (r) { return r.blob(); }); }
  var EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
              "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "aac",
              "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav" };

  function upload(src, folder) {
    var p = typeof src === "string" ? dataURLtoBlob(src) : Promise.resolve(src);
    return p.then(function (blob) {
      var type = (blob.type || "application/octet-stream").split(";")[0];
      var name = (folder || "misc") + "/" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + "." + (EXT[type] || "bin");
      return headers({ "Content-Type": type, "x-upsert": "false" }).then(function (h) {
        return fetch(URL_ + "/storage/v1/object/" + BUCKET + "/" + name, { method: "POST", headers: h, body: blob });
      }).then(function (r) {
        if (!r.ok) return fail(r);
        return URL_ + "/storage/v1/object/public/" + BUCKET + "/" + name;
      });
    });
  }

  /* هر data: URL (عکس یا صدا) داخل یک شیء را بارگذاری و با آدرس عمومی‌اش جایگزین می‌کند */
  function uploadAll(obj, folder) {
    var found = [];
    (function collect(v) {
      if (typeof v === "string") { if (/^data:(image|audio)\//.test(v) && found.indexOf(v) === -1) found.push(v); }
      else if (Array.isArray(v)) v.forEach(collect);
      else if (v && typeof v === "object") Object.keys(v).forEach(function (k) { collect(v[k]); });
    })(obj);
    var map = {};
    return Promise.all(found.map(function (u) {
      return upload(u, folder).then(function (pub) { map[u] = pub; });
    })).then(function () {
      return (function swap(v) {
        if (typeof v === "string") return map[v] || v;
        if (Array.isArray(v)) return v.map(swap);
        if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { o[k] = swap(v[k]); }); return o; }
        return v;
      })(obj);
    });
  }

  g.SogDB = {
    enabled: enabled,
    url: URL_,
    select: function (table, query) { return req("GET", "/rest/v1/" + table + "?" + (query || "select=*")); },
    insert: function (table, row, returning) {
      return req("POST", "/rest/v1/" + table, row, { Prefer: returning ? "return=representation" : "return=minimal" });
    },
    update: function (table, filter, patch) {
      return req("PATCH", "/rest/v1/" + table + "?" + filter, patch, { Prefer: "return=minimal" });
    },
    upsert: function (table, row) {
      return req("POST", "/rest/v1/" + table, row, { Prefer: "resolution=merge-duplicates,return=minimal" });
    },
    remove: function (table, filter) { return req("DELETE", "/rest/v1/" + table + "?" + filter, null, { Prefer: "return=minimal" }); },
    rpc: function (fn, args) { return req("POST", "/rest/v1/rpc/" + fn, args || {}); },
    upload: upload,
    uploadAll: uploadAll,
    auth: {
      signIn: function (email, password) {
        if (!enabled) return Promise.reject(new Error("Supabase وصل نیست"));
        return fetch(URL_ + "/auth/v1/token?grant_type=password", {
          method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password: password })
        }).then(function (r) { return r.ok ? r.json() : fail(r); })
          .then(function (s) { saveSession(s); return s.user; });
      },
      signOut: function () {
        var a = readAuth();
        writeAuth(null);
        if (a && a.access_token) {
          fetch(URL_ + "/auth/v1/logout", { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + a.access_token } }).catch(function () {});
        }
      },
      email: function () { var a = readAuth(); return a ? a.email : ""; },
      signedIn: function () { return token().then(function (t) { return !!t; }); }
    }
  };
})(window);
