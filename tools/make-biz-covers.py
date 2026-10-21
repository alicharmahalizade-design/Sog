"""ساخت کاور SVG برای کسب‌وکارهای نمونه از روی رنگ و نماد لوگوی هرکدام.
اجرا: python3 tools/make-biz-covers.py  → assets/img/biz/cover-*.svg و فیلد cover در data/businesses.json"""
import json, re, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
data_path = os.path.join(ROOT, "data", "businesses.json")
data = json.load(open(data_path, encoding="utf-8"))

def logo_parts(path):
    svg = open(os.path.join(ROOT, path), encoding="utf-8").read()
    color = (re.search(r'stop-color="(#[0-9a-fA-F]{6})"', svg) or [None, "#d99a5b"])[1]
    body = svg[svg.index("</defs>") + 7: svg.rindex("</svg>")] if "</defs>" in svg else svg[svg.index(">") + 1: svg.rindex("</svg>")]
    body = re.sub(r'<rect width="120" height="120"[^>]*/>', "", body).strip()
    return color, body

def cover(color, glyph, seed):
    rnd = random.Random(seed)
    W, H = 720, 400
    bokeh = "".join(
        '<circle cx="%d" cy="%d" r="%d" fill="%s" opacity="%.2f"/>' % (
            rnd.randint(0, W), rnd.randint(0, H), rnd.randint(18, 70),
            rnd.choice([color, "#ffffff", "#d99a5b"]), rnd.uniform(.04, .12))
        for _ in range(14))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <radialGradient id="g" cx="78%" cy="20%" r="95%">
      <stop offset="0" stop-color="{color}" stop-opacity=".95"/>
      <stop offset=".55" stop-color="{color}" stop-opacity=".28"/>
      <stop offset="1" stop-color="#0b0b0b" stop-opacity="1"/>
    </radialGradient>
    <filter id="b"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="{W}" height="{H}" fill="#0b0b0b"/>
  <rect width="{W}" height="{H}" fill="url(#g)"/>
  <g filter="url(#b)">{bokeh}</g>
  <g transform="translate(40 40) scale(2.7)" opacity=".16">{glyph}</g>
  <g transform="translate(470 150) scale(1.6) rotate(-8 60 60)" opacity=".10">{glyph}</g>
</svg>
'''

made = {}
for b in data["businesses"]:
    logo = b.get("logo") or ""
    if not logo.startswith("assets/img/biz/logo-"):
        continue
    key = logo.split("logo-")[1].rsplit(".", 1)[0] + "-" + str(b["id"])
    color, glyph = logo_parts(logo)
    out = "assets/img/biz/cover-%s.svg" % key
    open(os.path.join(ROOT, out), "w", encoding="utf-8").write(cover(color, glyph, b["id"]))
    b["cover"] = out
    made[b["id"]] = out

json.dump(data, open(data_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(len(made), "covers")
