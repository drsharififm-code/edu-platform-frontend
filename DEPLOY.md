# خطوات النشر

## تحديث 1.2 — نسبة الشرائح المسموعة + صوت Google
- التقرير: عمود جديد «الشرائح المسموعة» (النسبة وعدد الشرائح التي استمع المتدرب لقراءتها حتى النهاية).
- المتدرب يرى أثناء العرض: «استمعت إلى X من Y شريحة».
- الصوت: Google Cloud Text-to-Speech (WaveNet) — عربي وإنجليزي؛ الشرائح ثنائية اللغة تُقرأ كل لغة بصوتها.
- قاعدة البيانات: أُضيف العمود `lecture_views.slides_heard` ✅

### الملفات التي تُرفع إلى GitHub
`App.jsx` · `api.js` · `slides.jsx` · `DEPLOY.md` · `worker/worker.js`

### الخادم (Cloudflare → edu-platform-api → Edit code)
الصق محتوى `worker/worker.js` ثم Deploy.

### مفتاح Google (مرة واحدة)
1. https://console.cloud.google.com → أنشئ مشروعاً (مثلاً edu-platform).
2. فعّل الفوترة (Billing) للمشروع — مطلوبة حتى مع الحصة المجانية.
3. ابحث عن **Cloud Text-to-Speech API** → Enable.
4. APIs & Services → Credentials → Create credentials → **API key**.
5. اضغط على المفتاح → API restrictions → Restrict key → اختر Cloud Text-to-Speech API → Save.
6. في Cloudflare → edu-platform-api → Settings → Variables and Secrets → Add:
   - Type: Secret — Name: `GOOGLE_TTS_API_KEY` — Value: المفتاح.
7. (اختياري) لصوت أكثر طبيعية: أضف متغير نصي `GOOGLE_TTS_TIER` = `chirp`.

### التكلفة (Google)
| النوع | مجاناً شهرياً | بعدها |
|---|---|---|
| WaveNet (الافتراضي) | 4 ملايين حرف | 4$ لكل مليون حرف |
| Chirp 3 HD (`chirp`) | مليون حرف | 30$ لكل مليون حرف |

الصوت يُخزَّن بعد أول توليد لكل شريحة، فلا يُدفع مرة أخرى عند استماع متدربين آخرين.

---

## تحديث 1.1
حقول التسجيل، الشرائح الصوتية، الاختبار القصير، تاريخ الإتاحة، التقرير الميلادي، عرض الجوال.
