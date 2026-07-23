# سوگ | Sog

مرجع آگهی‌های سوگ ایران — وب‌اپلیکیشن موبایلی برای ثبت و مشاهده‌ی آگهی‌های سوگ و سفارش سریع خدمات سوگواری (قاری قرآن، سنگ قبر، چاپ و بسته‌بندی و…).

این مخزن **پیش‌نمایش (prototype)** پویای صفحه‌ی اصلی است. پس از تأیید طراحی، به **قالب وردپرس** تبدیل می‌شود.

## وضعیت فعلی
- ✅ صفحه‌ی اصلی: هدر (لوگو، جستجو، منو، پروفایل)، نوار انتخاب شهر با نشانگر مشاهده‌نشده، کارت‌های آگهی، کالکشن خودکار «سوگ‌های سال‌های گذشته»
- ⏳ بخش کسب‌وکارها و سایر صفحات — با ارسال طرح‌هایشان اضافه می‌شوند

## اجرای محلی
چون داده‌ها با `fetch` از فایل JSON خوانده می‌شوند، باید از طریق یک وب‌سرور اجرا شود (نه باز کردن مستقیم فایل):

```bash
cd Sog
python3 -m http.server 8000
# سپس مرورگر: http://localhost:8000
```

## معماری (آماده‌ی وردپرس)
| بخش پیش‌نمایش | معادل وردپرس |
|---|---|
| `data/listings.json` | Custom Post Type «آگهی» + فیلدهای ACF |
| `data/cities.json` | Taxonomy «شهر» |
| `fetch('data/*.json')` در `app.js` | WordPress REST API |
| `assets/css/styles.css` | همان CSS، بدون تغییر در قالب |
| `assets/js/app.js` رندر کارت | `template-parts` در PHP یا نگه‌داری همین رندر کلاینتی |

ساختار داده‌ی JSON عمداً هم‌شکل خروجی REST API طراحی شده تا هنگام تبدیل، **فقط منبع داده** عوض شود و طراحی دست‌نخورده بماند.

### مدل داده‌ی هر آگهی
- `deceased_name` نام متوفی
- `photo` عکس
- `ceremony_type` نوع مراسم: `khaksepari` | `salgard` | `bozorgdasht` | `chehelom`
- `ceremony_labels` برچسب‌های نمایشی (تشییع، خاکسپاری، …)
- `death_year` سال شمسی فوت → مبنای **دسته‌بندی خودکار** کالکشن سال‌ها
- `event_date_jalali` / `event_weekday` تاریخ و روز مراسم
- `city` / `city_slug` / `location` شهر و محل

## قابلیت‌های پویا
- **دسته‌بندی خودکار سال**: کالکشن «سال‌های گذشته» از روی `death_year` ساخته می‌شود؛ افزودن آگهی جدید خودکار به‌روزرسانی می‌شود.
- **نشانگر مشاهده‌نشده**: با `localStorage` (per-city) شمارش واقعی.
- **بوکمارک**: ذخیره در `localStorage`.
- **جستجوی زنده** و **فیلتر شهر/سال** سمت کلاینت.
- **PWA**: قابل نصب روی موبایل، کش آفلاین.

## دیپلوی (GitHub Pages)
با هر push، workflow `.github/workflows/pages.yml` سایت را منتشر می‌کند.
یک‌بار لازم است در **Settings → Pages** منبع را روی **GitHub Actions** بگذارید.

## ساختار فایل‌ها
```
index.html
assets/css/styles.css
assets/js/app.js          منطق اصلی
assets/js/storage.js      localStorage
assets/fonts/             وزیرمتن (Vazirmatn)
assets/img/               لوگو، آیکون‌ها، شمع، پرتره‌های نمونه
data/listings.json        آگهی‌ها
data/cities.json          شهرها
manifest.webmanifest      PWA
service-worker.js         کش آفلاین
```

---
_فونت: [Vazirmatn](https://github.com/rastikerdar/vazirmatn) (SIL OFL 1.1)_
