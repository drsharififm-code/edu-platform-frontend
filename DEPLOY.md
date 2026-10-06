# خطوات النشر

## تحديث 2.0 — الأمن (OWASP) + التحقق الثنائي + الشهادات الموثّقة
- التحقق الثنائي TOTP إلزامي للجميع، يظهر في تطبيق المصادقة باسم **site.sa** (Google/Microsoft Authenticator) + 8 رموز استرداد + إعادة ضبط من المشرف.
- كلمة المرور: 10 أحرف على الأقل + حرف كبير وصغير ورقم ورمز، ولا تحتوي اسم المستخدم. كلمات المرور القديمة الضعيفة تُجبر على التغيير بعد الدخول.
- تشفير كلمة المرور في المتصفح (RSA-OAEP) قبل الإرسال، وفي الخادم PBKDF2-SHA256 + Pepper سري. رموز الجلسات والاستعادة مخزنة مُجزّأة (SHA-256)، وأسرار TOTP مشفرة AES-256-GCM.
- Cloudflare Turnstile للتحقق البشري في الدخول والتسجيل ونسيت كلمة المرور.
- إيقاف مؤقت 15 دقيقة بعد 5 محاولات فاشلة + حدود معدل للطلبات + سجل أمان (Audit log).
- رسائل أخطاء واضحة بالعربية والإنجليزية دون كشف تفاصيل داخلية (الأخطاء غير المتوقعة تعرض رقم مرجع فقط).
- الشهادات تصدر من الخادم برقم فريد + رمز QR، صالحة سنة، تُحمّل PDF مباشرة، وصفحة تحقق عامة `/?verify=` + بوابة للمشرف (بحث/إلغاء/إعادة تفعيل).
- التحقق من إكمال المحتوى في الخادم قبل الاختبار البعدي، وضبط صلاحيات المحاضر، ومنع الروابط غير الآمنة، وترويسات أمان CSP عبر `public/_headers`.
- النسخ الاحتياطية لا تحتوي كلمات المرور أو أسرار التحقق الثنائي.

### قاعدة البيانات
تم تنفيذ الترحيل ✅ (أعمدة TOTP في users + جداول app_keys, mfa_challenges, rate_limits, audit_log, certificates).

### الخادم (Cloudflare → edu-platform-api) — بالترتيب
1. Settings → Variables and Secrets → Add → Type **Secret** → Name `DATA_ENC_KEY` → قيمة عشوائية طويلة (32 حرفاً أو أكثر). **لا تغيّرها لاحقاً.**
2. Turnstile → Add widget (Managed) للنطاقين `edu.sharififcm.com` و `edu-platform-frontend-bxa.pages.dev` → انسخ **Secret key** إلى Secret باسم `TURNSTILE_SECRET`، وضع **Site key** في `config.js`.
3. Edit code → الصق `worker/worker.js` → Deploy.
4. بعدها مباشرة تُرفع ملفات الواجهة إلى GitHub (النشر تلقائي).

## تحديث 1.5 — إدارة البرامج + توليد أسئلة الاختبار بالذكاء الاصطناعي
- المشرف: إضافة / تعديل / حذف البرامج التدريبية (حذف البرنامج لا يحذف محاضراته).
- اختيار البرنامج التدريبي إلزامي عند إضافة محاضرة أو تعديلها.
- زر «✨ إنشاء الأسئلة تلقائياً من المحاضرة»: من الشرائح الصوتية أو ملف ‎.pptx أو نص ملصوق؛ ثم تعديل الأسئلة والإجابات.
- تعديل أسئلة الاختبار البعدي الموجود من نموذج تعديل المحاضرة.
- إشعار بريد عند اعتماد حساب المتدرب (يعمل بعد إضافة RESEND_API_KEY).

### الخادم (Cloudflare → edu-platform-api)
1. Edit code → الصق `worker/worker.js` → Deploy.
2. Settings → Bindings → Add → **Workers AI** → Variable name: `AI` → Deploy. (مجاني ضمن الحد اليومي)
3. (اختياري) إشعارات البريد: Secret باسم `RESEND_API_KEY`، ومتغير نصي `MAIL_FROM` مثل: `منصة التعليم الطبي <no-reply@sharififcm.com>`.

الاستضافة الآن على Cloudflare Pages (مشروع edu-platform-frontend) وتُنشر تلقائياً من GitHub.


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
