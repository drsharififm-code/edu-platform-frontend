# خطوات النشر — تحديث 1.1.0

## 1) قاعدة البيانات (D1) — ✅ تمّت
أُضيفت الأعمدة: `users.employee_id / email / hospital`، `lectures.available_until / slides_json`، وجدول `tts_cache` لتخزين الصوت المولَّد.

## 2) تحديث الخادم (Cloudflare Worker: edu-platform-api)
1. افتح Cloudflare → Workers & Pages → **edu-platform-api** → **Edit code**.
2. احذف الكود الموجود والصق محتوى الملف `worker/worker.js` كاملاً ثم **Deploy**.
3. (للصوت الاحترافي) Settings → **Variables and Secrets** → Add:
   - Type: **Secret** — Name: `OPENAI_API_KEY` — Value: مفتاحك من platform.openai.com
   - بدون المفتاح تعمل الشرائح بصوت المتصفح تلقائياً.

## 3) تحديث الواجهة (Netlify)
من مجلد المشروع على جهازك:
```
git push
```
سيبني Netlify الموقع تلقائياً (أُضيفت مكتبة `jszip` في package.json لقراءة ملفات PowerPoint).

## ملاحظات
- التواريخ كلها بالتقويم الميلادي وبتوقيت السعودية.
- تاريخ الإتاحة: بعد انتهائه تختفي المحاضرة عن المتدربين ويرفض الخادم الحضور/الاختبار.
- تكلفة الصوت تقريبية ≈ 0.015$ للدقيقة، ويُخزَّن الصوت بعد أول تشغيل فلا يتكرر الدفع.
