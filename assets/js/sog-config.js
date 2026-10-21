/* اتصال سایت به Supabase.
   آدرس پروژه و کلید عمومی (anon / publishable) را از
   Supabase → Project Settings → API بردارید و اینجا بگذارید.
   این کلید عمومی است و قرار گرفتنش در سایت امن است؛ دسترسی‌ها را
   قواعد supabase/schema.sql محدود می‌کنند. کلید service_role را هرگز اینجا نگذارید.
   تا وقتی خالی است، سایت مثل قبل فقط روی همین مرورگر ذخیره می‌کند. */
window.SOG_SUPABASE = {
  url: "",
  anonKey: ""
};
