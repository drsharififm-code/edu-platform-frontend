// Lightweight Arabic ⇄ English UI translation.
// The UI is written in Arabic; when English is selected, visible Arabic UI strings are
// swapped for their English equivalents directly in the DOM (text, placeholders, titles),
// and alert/confirm messages are translated too. User content (lecture titles, names…)
// is left untouched because it is not in the dictionary.

const LANG_KEY = "edu_lang";

export function getLang() {
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ar";
  } catch (e) {
    return "ar";
  }
}

export function setLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang === "en" ? "en" : "ar");
  } catch (e) {
    /* ignore */
  }
}

const EN = {
  // ---- platform / navigation
  "منصة التعليم الطبي الالكتروني بطب الأسرة والمجتمع": "Family & Community Medicine e-Learning Platform",
  "الرئيسية": "Home",
  "الملف الشخصي": "Profile",
  "خروج": "Log out",
  "تسجيل الدخول": "Sign in",
  "حساب جديد": "New account",
  "دخول": "Sign in",
  "إبقائي مسجّل الدخول": "Keep me signed in",
  "نسيت كلمة المرور؟": "Forgot password?",
  "العودة لتسجيل الدخول": "Back to sign in",
  "الذهاب لتسجيل الدخول": "Go to sign in",
  "رجوع": "Back",
  "متدرب": "Trainee",
  "محاضر": "Lecturer",
  "مشرف": "Admin",
  "مسودة": "Draft",
  "معتمدة": "Approved",
  "مرفوض": "Rejected",
  "مفعّل": "Active",
  "بانتظار الموافقة": "Pending approval",

  // ---- auth / profile
  "اسم المستخدم": "Username",
  "اسم المستخدم *": "Username *",
  "كلمة المرور": "Password",
  "كلمة المرور *": "Password *",
  "الاسم الأول *": "First name *",
  "اسم العائلة *": "Last name *",
  "الاسم الكامل": "Full name",
  "الاسم": "Name",
  "الرقم الوظيفي": "Employee ID",
  "الرقم الوظيفي *": "Employee ID *",
  "البريد الإلكتروني": "Email",
  "البريد الإلكتروني *": "Email *",
  "اسم المستشفى / المنشأة": "Hospital / facility",
  "اسم المستشفى / المنشأة *": "Hospital / facility *",
  "المستشفى": "Hospital",
  "التخصص": "Specialty",
  "المسمى الوظيفي": "Job title",
  "القسم / الجهة": "Department",
  "كلمة مرور جديدة (اختياري)": "New password (optional)",
  "اتركه فارغاً لعدم التغيير": "Leave blank to keep current",
  "إنشاء الحساب": "Create account",
  "سيتم إنشاء حسابك كمتدرب، وينتظر موافقة المشرف قبل تفعيله.": "Your account will be created as a trainee and must be approved by an admin before activation.",
  "الرجاء إدخال الاسم الأول واسم العائلة على الأقل.": "Please enter at least your first and last name.",
  "تم حفظ التعديلات بنجاح.": "Changes saved successfully.",
  "البريد الإلكتروني مطلوب — الرجاء إدخال بريد صحيح.": "Email is required — please enter a valid email.",
  "📧 الرجاء إضافة بريدك الإلكتروني لإكمال بيانات حسابك. سيُستخدم لإرسال إشعارات المنصة (مثل اعتماد الحساب) وشهادات الحضور.": "📧 Please add your email to complete your account. It is used for platform notifications (such as account approval) and attendance certificates.",
  "الرجاء إضافة بريدك الإلكتروني لإكمال بيانات حسابك. سيُستخدم لإرسال إشعارات المنصة (مثل اعتماد الحساب) وشهادات الحضور.": "Please add your email to complete your account. It is used for platform notifications (such as account approval) and attendance certificates.",
  "حفظ": "Save",
  "إلغاء": "Cancel",
  "إغلاق": "Close",
  "تعديل": "Edit",
  "حذف": "Delete",
  "إظهار": "Show",
  "إخفاء": "Hide",
  "إظهار كلمة المرور": "Show password",
  "إخفاء كلمة المرور": "Hide password",
  "— اختر —": "— Select —",
  "Others (أخرى — إدخال يدوي)": "Others (enter manually)",
  "اكتب القيمة يدوياً": "Type the value",

  // ---- password reset
  "أدخل اسم المستخدم أو البريد الإلكتروني المسجل، وسنرسل لك رابطاً لتعيين كلمة مرور جديدة.": "Enter your username or registered email and we will send you a link to set a new password.",
  "اسم المستخدم أو البريد الإلكتروني": "Username or email",
  "إرسال رابط إعادة التعيين": "Send reset link",
  "تعيين كلمة مرور جديدة": "Set a new password",
  "كلمة المرور الجديدة": "New password",
  "تأكيد كلمة المرور": "Confirm password",
  "حفظ كلمة المرور": "Save password",
  "كلمة المرور يجب ألا تقل عن 6 أحرف.": "Password must be at least 6 characters.",
  "كلمتا المرور غير متطابقتين.": "Passwords do not match.",
  "إعادة تعيين كلمة المرور": "Reset password",
  "إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم": "Send a password reset link to the user's email",

  // ---- dashboards / tabs
  "لوحة الإحصائيات": "Dashboard",
  "المستخدمون": "Users",
  "البرامج التدريبية": "Training programs",
  "المحاضرات": "Lectures",
  "تقرير المتابعة": "Attendance report",
  "التقرير الشخصي السنوي": "Annual personal report",
  "تقريري السنوي": "My annual report",
  "محاضراتي": "My lectures",
  "إجمالي المستخدمين": "Total users",
  "المستخدمون المفعّلون": "Active users",
  "إجمالي المحاضرات": "Total lectures",
  "المحاضرات المعتمدة": "Approved lectures",
  "مسودات": "Drafts",
  "إجمالي المشاهدات": "Total views",
  "متوسط درجات الاختبارات": "Average quiz score",
  "متوسط رضا المتدربين": "Average trainee satisfaction",

  // ---- users table
  "تاريخ التسجيل": "Registered",
  "الدور": "Role",
  "الحالة": "Status",
  "إجراءات": "Actions",
  "موافقة": "Approve",
  "رفض": "Reject",
  "حذف الحساب": "Delete account",

  // ---- programs
  "اسم البرنامج": "Program name",
  "اسم البرنامج *": "Program name *",
  "الوصف": "Description",
  "وصف مختصر (اختياري)": "Short description (optional)",
  "إضافة برنامج تدريبي": "Add training program",
  "+ إضافة البرنامج": "+ Add program",
  "إضافة البرنامج": "Add program",
  "— اختر البرنامج —": "— Select program —",
  "لا توجد برامج تدريبية بعد. أضف أول برنامج بالأسفل.": "No training programs yet. Add the first one below.",
  "لا يوجد جدول مرفق": "No schedule attached",
  "إرفاق الجدول": "Attach schedule",
  "تغيير الجدول": "Replace schedule",
  "عرض الجدول": "View schedule",
  "(حذف الجدول)": "(remove schedule)",
  "…جارٍ الرفع": "Uploading…",
  "بعد إضافة البرنامج استخدم «📎 إرفاق الجدول» لرفع جدول المحاضرات الشهري أو السنوي (PDF أو Excel) ليطّلع عليه المتدربون.": "After adding a program, use “📎 Attach schedule” to upload the monthly or annual lecture schedule (PDF or Excel) for trainees.",
  "اختر اسم البرنامج أو اكتبه.": "Select or type the program name.",
  "اسم البرنامج مطلوب.": "Program name is required.",
  "تمت إضافة البرنامج.": "Program added.",
  "تم حفظ التعديل.": "Changes saved.",
  "تم حذف البرنامج.": "Program deleted.",
  "تم حذف الجدول.": "Schedule removed.",
  "الصيغ المسموحة: PDF أو Excel (xlsx / xls).": "Allowed formats: PDF or Excel (xlsx / xls).",
  "حجم الملف أكبر من 8 ميجابايت.": "File is larger than 8 MB.",
  "تعذّرت قراءة الملف.": "Could not read the file.",
  "تحميل": "Download",
  "نافذة جديدة": "New window",
  "جدول المحاضرات السنوي": "Annual lecture schedule",
  "لم يُرفق جدول محاضرات لهذا البرنامج بعد.": "No lecture schedule has been attached to this program yet.",

  // ---- lectures list / card
  "المحاضرات المتاحة": "Available lectures",
  "تصفية حسب البرنامج": "Filter by program",
  "اختر البرنامج التدريبي": "Select training program",
  "جميع البرامج": "All programs",
  "لا توجد محاضرات متاحة حالياً.": "No lectures available right now.",
  "بدون موضوع محدد": "No topic",
  "المحاضر:": "Lecturer:",
  "متاحة حتى": "Available until",
  "انتهت الإتاحة": "Expired",
  "حتى": "until",
  "شرائح صوتية": "Spoken slides",
  "+ محاضرة جديدة": "+ New lecture",
  "+ إضافة محاضرة": "+ Add lecture",
  "محاضرة جديدة": "New lecture",
  "تعديل المحاضرة": "Edit lecture",
  "لم تُنشئ أي محاضرات بعد.": "You have not created any lectures yet.",
  "إدارة الاختبار": "Manage quiz",
  "اعتماد": "Approve",
  "إرجاع لمسودة": "Back to draft",

  // ---- lecture form
  "عنوان المحاضرة": "Lecture title",
  "البرنامج التدريبي *": "Training program *",
  "— اختر البرنامج التدريبي —": "— Select training program —",
  "اسم المحاضر": "Lecturer name",
  "اختر من القائمة أو اكتب الاسم يدوياً": "Pick from the list or type a name",
  "اختر محاضراً مسجلاً في المنصة أو اكتب اسم محاضر من خارجها. إذا تُرك فارغاً يُستخدم اسمك.": "Pick a registered lecturer or type an external lecturer's name. If left blank, your name is used.",
  "الموضوع / المحور": "Topic",
  "متاحة للمتدربين حتى تاريخ (ميلادي)": "Available to trainees until (Gregorian)",
  "اتركه فارغاً لإتاحتها بدون تاريخ انتهاء": "Leave blank for no expiry date",
  "رابط الفيديو (يوتيوب أو غيره)": "Video link (YouTube or other)",
  "رابط محاضرة PowerPoint / PDF": "PowerPoint / PDF lecture link",
  "رابط عام لملف ‎.pptx أو PDF أو Google Slides — يُعرض داخل المنصة.": "Public link to a .pptx, PDF or Google Slides file — shown inside the platform.",
  "روابط إضافية": "Extra links",
  "+ إضافة رابط": "+ Add link",
  "عنوان الرابط": "Link title",
  "📝 الاختبار البعدي Post-test (3 أسئلة اختيار من متعدد) *": "📝 Post-test (3 multiple-choice questions) *",
  "الاختبار البعدي Post-test (3 أسئلة اختيار من متعدد) *": "Post-test (3 multiple-choice questions) *",
  "إلزامي: يظهر للمتدرب بعد إكمال محتوى المحاضرة (الفيديو، محاضرة PowerPoint، أو الشرائح الصوتية).": "Mandatory: shown to the trainee after completing the lecture content (video, PowerPoint lecture or spoken slides).",
  "يمكنك تعديل الأسئلة والإجابات هنا ثم الحفظ.": "You can edit the questions and answers here, then save.",
  "نص السؤال": "Question text",
  "السؤال": "Question",
  "اختر الدائرة بجانب الإجابة الصحيحة.": "Select the circle next to the correct answer.",
  "الإجابة الصحيحة": "Correct answer",
  "حفظ التعديل سيعيد المحاضرة إلى حالة \"مسودة\" لمراجعتها من جديد (إلا إذا كنت مشرفاً).": "Saving changes returns the lecture to \"Draft\" for review (unless you are an admin).",
  "ستُحفظ المحاضرة كمسودة بانتظار اعتماد المشرف.": "The lecture will be saved as a draft pending admin approval.",
  "أضف محتوى علمياً واحداً على الأقل: رابط فيديو، أو رابط محاضرة PowerPoint، أو ملف شرائح صوتية.": "Add at least one content item: a video link, a PowerPoint lecture link, or a spoken slides file.",
  "الرجاء اختيار البرنامج التدريبي الذي تتبع له المحاضرة.": "Please select the training program for this lecture.",
  "سيتم استبدال الأسئلة الحالية بالأسئلة الجديدة. متابعة؟": "The current questions will be replaced with the new ones. Continue?",
  "خيار": "Option",
  "أ": "A",
  "ب": "B",
  "ج": "C",
  "د": "D",

  // ---- AI quiz generator
  "إنشاء الأسئلة تلقائياً من المحاضرة": "Generate questions automatically from the lecture",
  "إنشاء أسئلة الاختبار البعدي بالذكاء الاصطناعي": "Generate post-test questions with AI",
  "يقرأ النظام محتوى المحاضرة ويقترح 3 أسئلة اختيار من متعدد مع الإجابات الصحيحة، ثم يمكنك تعديلها.": "The system reads the lecture content and suggests 3 multiple-choice questions with correct answers, which you can then edit.",
  "إرفاق ملف المحاضرة (PowerPoint ‎.pptx)": "Attach lecture file (PowerPoint .pptx)",
  "تغيير ملف PowerPoint": "Change PowerPoint file",
  "أو الصق نص المحاضرة / الملخص (اختياري)": "Or paste the lecture text / summary (optional)",
  "إنشاء الأسئلة": "Generate questions",
  "تم إنشاء الأسئلة ✓ — راجعها وعدّلها بالأسفل قبل الحفظ.": "Questions generated ✓ — review and edit them below before saving.",
  "أرفق ملف المحاضرة (PowerPoint) أو الصق نصها أولاً — النص الحالي غير كافٍ.": "Attach the lecture file (PowerPoint) or paste its text first — the current text is not enough.",
  "خدمة الذكاء الاصطناعي غير مفعّلة بعد على الخادم. يمكنك كتابة الأسئلة يدوياً الآن.": "The AI service is not enabled on the server yet. You can write the questions manually for now.",
  "نص الشرائح الصوتية المرفقة (": "Text of the attached spoken slides (",
  "شريحة)": "slides)",

  // ---- slides editor / player
  "عرض الشرائح بصوت الذكاء الاصطناعي": "Slides narrated by AI voice",
  "ارفع ملف PowerPoint (‎.pptx) وستُعرض الشرائح للمتدرب واحدة تلو الأخرى مع قراءة صوتية. تُقرأ ملاحظات المتحدث (Speaker Notes) إن وُجدت، وإلا يُقرأ نص الشريحة، ويمكنك تعديل النص المقروء لكل شريحة.": "Upload a PowerPoint file (.pptx) and the slides are shown to the trainee one by one with narration. Speaker notes are read if present, otherwise the slide text; you can edit the narration for each slide.",
  "رفع ملف PowerPoint": "Upload PowerPoint file",
  "استبدال الملف": "Replace file",
  "إزالة الشرائح": "Remove slides",
  "جارِ قراءة الملف…": "Reading file…",
  "نوع الصوت": "Voice",
  "صوت رجالي 1": "Male voice 1",
  "صوت رجالي 2": "Male voice 2",
  "صوت نسائي 1": "Female voice 1",
  "صوت نسائي 2": "Female voice 2",
  "الشرائح": "Slides",
  "شريحة": "Slide",
  "شريحة (": "slides (",
  "عرض الشرائح الصوتي": "Spoken slides",
  "تشغيل العرض الصوتي": "Play narrated slides",
  "متابعة": "Resume",
  "إيقاف مؤقت": "Pause",
  "جارِ تجهيز الصوت…": "Preparing audio…",
  "السابقة": "Previous",
  "التالية ◀": "Next ▶",
  "الشريحة التالية": "Next slide",
  "الشريحة السابقة": "Previous slide",
  "أنهيت العرض": "Finished",
  "استمعت إلى": "Listened to",
  "من": "of",
  "اضغط زر التشغيل لبدء القراءة الصوتية.": "Press play to start the narration.",
  "المتصفح لا يدعم القراءة الصوتية.": "This browser does not support speech.",
  "تعذّر تشغيل الصوت.": "Could not play audio.",
  "يتم استخدام صوت المتصفح حالياً لأن خدمة الصوت الاحترافي (Google) غير مفعّلة بعد.": "The browser voice is being used because the professional voice service is not enabled yet.",
  "الرجاء اختيار ملف PowerPoint بصيغة ‎.pptx (يمكن حفظ ملفات ‎.ppt القديمة بصيغة ‎.pptx من PowerPoint).": "Please choose a PowerPoint .pptx file (old .ppt files can be saved as .pptx from PowerPoint).",
  "الملف لا يبدو ملف PowerPoint صالحاً.": "The file does not look like a valid PowerPoint file.",
  "لم يتم العثور على شرائح تحتوي نصاً في الملف.": "No slides with text were found in the file.",

  // ---- lecture detail
  "الفيديو": "Video",
  "محاضرة PowerPoint": "PowerPoint lecture",
  "فتح الفيديو": "Open video",
  "فتح المحاضرة": "Open lecture",
  "فتح في نافذة جديدة": "Open in new window",
  "أنهيت مشاهدة الفيديو": "I finished watching the video",
  "أنهيت الاطلاع على المحاضرة": "I finished viewing the lecture",
  "افتح الرابط أولاً": "Open the link first",
  "تم": "Done",
  "تمت المشاهدة": "Watched",
  "تم الاطلاع": "Viewed",
  "تم الاستماع": "Listened",
  "مشاهدة الفيديو": "Watch the video",
  "الاطلاع على محاضرة PowerPoint": "View the PowerPoint lecture",
  "الاستماع لعرض الشرائح الصوتي": "Listen to the spoken slides",
  "الاختبار البعدي": "Post-test",
  "الاختبار البعدي (Post-test)": "Post-test",
  "إلزامي": "Mandatory",
  "تم أداء الاختبار": "Post-test completed",
  "أجب عن الأسئلة ثم أرسل إجاباتك": "Answer the questions, then submit",
  "يُفتح بعد إكمال محتوى المحاضرة": "Opens after completing the lecture content",
  "إرسال الإجابات": "Submit answers",
  "سبق لك أداء هذا الاختبار": "You have already taken this test",
  "، ويمكنك إعادة المحاولة.": ", and you may retake it.",
  "اجتزت الاختبار بنجاح": "You passed the test",
  "لم تحقق درجة النجاح المطلوبة": "You did not reach the required pass mark",
  "لم تحقق درجة النجاح المطلوبة (": "You did not reach the required pass mark (",
  "النتيجة:": "Score:",
  "النتيجة": "Result",
  "نتيجة": "Result of",
  "المحاولة الأولى": "attempt 1",
  "المحاولة الثانية": "attempt 2",
  "(في المحاولة الثانية)": "(on the second attempt)",
  "يمكنك إعادة الاختبار مرة واحدة فقط.": "You can retake the test only once.",
  "إعادة الاختبار (المحاولة الأخيرة)": "Retake the test (final attempt)",
  "المحاولة الثانية والأخيرة — لن تتاح إعادة أخرى بعدها.": "Second and final attempt — no further retakes after this.",
  "استنفدت المحاولات المتاحة (محاولة أصلية + إعادة واحدة). للمساعدة تواصل مع المشرف.": "You have used all attempts (one original + one retake). Contact the admin for help.",
  "شهادة الحضور": "Attendance certificate",
  "اجتزت الاختبار البعدي بنسبة": "You passed the post-test with",
  "— رقم الشهادة": "— certificate no.",
  "% — رقم الشهادة": "% — certificate no.",
  "تحميل الشهادة PDF": "Download certificate (PDF)",
  "🎓 تُمنح شهادة الحضور عند اجتياز الاختبار البعدي بالدرجة المطلوبة.": "🎓 The attendance certificate is granted after passing the post-test with the required score.",
  "تُمنح شهادة الحضور عند اجتياز الاختبار البعدي بالدرجة المطلوبة.": "The attendance certificate is granted after passing the post-test with the required score.",
  "🔒 تقييم المحاضرة (Feedback) يُتاح بعد إكمال الاختبار البعدي.": "🔒 Lecture feedback becomes available after completing the post-test.",
  "تقييم المحاضرة (Feedback) يُتاح بعد إكمال الاختبار البعدي.": "Lecture feedback becomes available after completing the post-test.",
  "لم تؤدِّ الاختبار البعدي بعد، وهو إلزامي. هل تريد مغادرة المحاضرة دون أداء الاختبار؟": "You have not taken the mandatory post-test yet. Leave the lecture without taking it?",
  "لم تُكمل المحاضرة والاختبار البعدي الإلزامي بعد. هل تريد المغادرة الآن؟": "You have not completed the lecture and the mandatory post-test yet. Leave now?",
  "لا يوجد اختبار بعدي لهذه المحاضرة. أضفه من «تعديل» أو «إدارة الاختبار».": "This lecture has no post-test. Add one via “Edit” or “Manage quiz”.",
  "معاينة المشرف/المحاضر — الإجابات الصحيحة": "Admin/lecturer preview — correct answers",
  "الرجاء السماح بالنوافذ المنبثقة لهذا الموقع لتحميل الشهادة.": "Please allow pop-ups for this site to download the certificate.",

  // ---- feedback
  "تقييم المحاضرة": "Rate the lecture",
  "تقييم المحتوى": "Content",
  "تقييم المحاضر": "Lecturer",
  "وضوح الشرح": "Clarity",
  "ملاحظات إضافية": "Additional comments",
  "إرسال التقييم": "Submit feedback",
  "شكراً لك، تم إرسال تقييمك.": "Thank you, your feedback was submitted.",
  "تقييمات المتدربين": "Trainee feedback",
  "لا توجد تقييمات بعد.": "No feedback yet.",
  "المحتوى:": "Content:",
  "الوضوح:": "Clarity:",

  // ---- quiz form (manage quiz)
  "عنوان الاختبار": "Quiz title",
  "درجة النجاح (%)": "Pass mark (%)",
  "السماح بإعادة المحاولة": "Allow retake",
  "نوع السؤال": "Question type",
  "اختيار واحد": "Single choice",
  "اختيار متعدد": "Multiple choice",
  "صح / خطأ": "True / False",
  "+ إضافة خيار": "+ Add option",
  "+ إضافة سؤال جديد": "+ Add question",
  "حذف السؤال": "Delete question",
  "حفظ الاختبار": "Save quiz",

  // ---- attendance report
  "من تاريخ": "From",
  "إلى تاريخ": "To",
  "مسح": "Clear",
  "تصدير CSV": "Export CSV",
  "اسم المتدرب": "Trainee",
  "اسم المحاضرة": "Lecture",
  "تاريخ نزول المحاضرة": "Lecture date",
  "تاريخ الحضور": "Attendance date",
  "آخر مشاهدة": "Last viewed",
  "مدة المشاهدة (دقيقة)": "Watch time (min)",
  "نتيجة الاختبار": "Quiz result",
  "الشرائح المسموعة": "Slides listened",
  "لا توجد بيانات مشاهدة في هذه الفترة.": "No viewing data for this period.",
  "سجل · التواريخ بالتقويم الميلادي": "records · Gregorian dates",
  "ناجح": "Passed",
  "لم يجتز": "Not passed",
  "(ناجح)": "(passed)",
  "(لم يجتز)": "(not passed)",

  // ---- personal report
  "السنة (ميلادي)": "Year (Gregorian)",
  "عرض التقرير": "Show report",
  "مثال: 149560": "e.g. 149560",
  "نسبة حضور المحاضرات": "Lecture attendance rate",
  "محاضرات حضرها / المحاضرات المعتمدة": "Attended / approved lectures",
  "اختبارات اجتازها": "Tests passed",
  "متوسط درجات الاختبار البعدي": "Average post-test score",
  "يُعد المتدرب حاضراً للمحاضرة عند إكمالها وأداء اختبارها البعدي. يتحدث التقرير تلقائياً مع كل محاضرة، وتبقى بيانات السنة كاملة.": "A trainee counts as attending a lecture after completing it and taking its post-test. The report updates automatically with every lecture and keeps the full year of data.",
  "المتابعة الأسبوعية": "Weekly progress",
  "لا توجد محاضرات معتمدة في هذه السنة.": "No approved lectures in this year.",
  "تفاصيل المحاضرات": "Lecture details",
  "التاريخ": "Date",
  "المحاضرة": "Lecture",
  "البرنامج": "Program",
  "الحضور": "Attendance",
  "تاريخ الإكمال": "Completed on",
  "الدرجة": "Score",
  "حضر": "Attended",
  "بدأ ولم يكمل": "Started, not completed",
  "لم يحضر": "Did not attend",
  "طباعة التقرير": "Print report",
  "الأسبوع": "Week",

  // ---- certificate window
  "شهادة حضور": "Certificate of Attendance",
  "حفظ PDF / طباعة": "Save PDF / Print",
  "اختر «حفظ بتنسيق PDF» (Save as PDF) من نافذة الطباعة": "Choose “Save as PDF” in the print dialog",

  // ---- backup
  "النسخ الاحتياطي": "Backups",
  "تُرسل نسخة احتياطية كاملة من قاعدة البيانات تلقائياً إلى بريد المشرف في اليوم الأول من كل شهر. ويمكنك أخذ نسخة الآن.": "A full database backup is emailed automatically to the admin on the 1st of every month. You can also take a backup now.",
  "تنزيل نسخة الآن": "Download backup now",
  "إرسال نسخة إلى بريدي": "Email a backup to me",
  "تم تنزيل النسخة الاحتياطية.": "Backup downloaded.",
  "تعذّر تنزيل النسخة الاحتياطية.": "Could not download the backup.",
  "تم إرسال النسخة الاحتياطية إلى البريد.": "Backup sent by email.",

  // ---- misc
  "جارِ التحميل": "Loading",
  "انتهت": "Expired",

  // ---- server messages
  "Not found.": "Not found.",
  "أدخل اسم المستخدم أو البريد الإلكتروني.": "Enter your username or email.",
  "إذا كان الحساب موجوداً وله بريد مسجل، فستصلك رسالة لإعادة تعيين كلمة المرور خلال دقائق.": "If the account exists and has a registered email, you will receive a password reset message within minutes.",
  "استنفدت المحاولات المتاحة (محاولة أصلية + إعادة واحدة).": "You have used all attempts (one original + one retake).",
  "اسم المستخدم أو كلمة المرور غير صحيحة.": "Incorrect username or password.",
  "اسم المستخدم مطلوب.": "Username is required.",
  "اسم المستخدم هذا مستخدم بالفعل.": "This username is already taken.",
  "اسم المستخدم وكلمة المرور مطلوبان.": "Username and password are required.",
  "اسم المستشفى مطلوب.": "Hospital name is required.",
  "الاختبار غير موجود.": "Quiz not found.",
  "البرنامج غير موجود.": "Program not found.",
  "البريد الإلكتروني مسجل مسبقاً.": "This email is already registered.",
  "الرجاء إدخال بريد إلكتروني صحيح.": "Please enter a valid email.",
  "الرجاء تعبئة اسم المستخدم وكلمة المرور.": "Please fill in the username and password.",
  "الرقم الوظيفي مسجل مسبقاً.": "This employee ID is already registered.",
  "الرقم الوظيفي مطلوب.": "Employee ID is required.",
  "الصيغ المسموحة: PDF أو Excel.": "Allowed formats: PDF or Excel.",
  "المستخدم غير موجود.": "User not found.",
  "المعرف مطلوب.": "ID is required.",
  "النص مطلوب.": "Text is required.",
  "انتهت صلاحية الرابط أو استُخدم مسبقاً. اطلب رابطاً جديداً.": "The link has expired or was already used. Request a new one.",
  "بيانات الاختبار غير مكتملة.": "Quiz data is incomplete.",
  "بيانات الملف غير مكتملة.": "File data is incomplete.",
  "بيانات غير صحيحة.": "Invalid data.",
  "بيانات غير مكتملة.": "Incomplete data.",
  "تعذّر إرسال البريد الآن.": "Could not send the email right now.",
  "تعذّر توليد الأسئلة الآن، حاول مرة أخرى أو اكتبها يدوياً.": "Could not generate questions right now; try again or write them manually.",
  "تعذّر توليد الصوت.": "Could not generate audio.",
  "تم إرسال طلب التسجيل. يجب أن يوافق المشرف على حسابك قبل تسجيل الدخول.": "Registration submitted. An admin must approve your account before you can sign in.",
  "تم تعيين كلمة المرور الجديدة. يمكنك تسجيل الدخول الآن.": "Your new password is set. You can sign in now.",
  "تم رفض طلب تسجيلك. تواصل مع المشرف.": "Your registration was rejected. Please contact the admin.",
  "حسابك بانتظار موافقة المشرف.": "Your account is awaiting admin approval.",
  "خدمة البريد غير مفعّلة على الخادم.": "The email service is not enabled on the server.",
  "خدمة الذكاء الاصطناعي غير مفعّلة على الخادم.": "The AI service is not enabled on the server.",
  "خطأ في الخادم.": "Server error.",
  "رابط غير صالح.": "Invalid link.",
  "رقم الشريحة غير صحيح.": "Invalid slide number.",
  "عنوان المحاضرة مطلوب.": "Lecture title is required.",
  "غير مسجل الدخول.": "Not signed in.",
  "غير موجود.": "Not found.",
  "لا يمكن إعادة هذا الاختبار.": "This test cannot be retaken.",
  "لا يمكنك حذف حسابك.": "You cannot delete your own account.",
  "لا يوجد بريد إلكتروني مسجل لهذا المستخدم.": "This user has no registered email.",
  "لا يوجد مستخدم بهذا الرقم الوظيفي.": "No user with this employee ID.",
  "لقد اجتزت هذا الاختبار مسبقاً.": "You have already passed this test.",
  "لم يتم إعداد خدمة الصوت.": "The voice service is not configured.",
  "ممنوع.": "Forbidden.",
  "نص المحاضرة قصير جداً لتوليد الأسئلة.": "The lecture text is too short to generate questions.",
  "يمكن حذف الحسابات المرفوضة فقط. ارفض الحساب أولاً.": "Only rejected accounts can be deleted. Reject the account first.",
  "انتهت فترة إتاحة هذه المحاضرة.": "This lecture's availability period has ended.",
  "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.": "Could not reach the server. Check your internet connection.",
  "استجابة غير صالحة من الخادم.": "Invalid server response.",
  "حدث خطأ غير متوقع.": "An unexpected error occurred.",
};

const LETTERS = { "أ": "A", "ب": "B", "ج": "C", "د": "D" };

// Dynamic strings (built with template literals in the app).
const PATTERNS = [
  [/^الرقم الوظيفي: (.+)$/, (m) => `Employee ID: ${m[1]}`],
  [/^تم إرفاق جدول «(.+)»\.$/, (m) => `Schedule attached to “${m[1]}”.`],
  [/^حذف البرنامج «(.+)»؟.*$/s, (m) => `Delete program “${m[1]}”? Its lectures will remain without a program.`],
  [/^حذف جدول برنامج «(.+)»؟$/, (m) => `Remove the schedule of “${m[1]}”?`],
  [/^حذف حساب «(.+)» \((.+)\) نهائياً؟.*$/s, (m) => `Permanently delete the account “${m[1]}” (${m[2]})? This cannot be undone.`],
  [/^إرسال رابط إعادة تعيين كلمة المرور إلى (.+)؟$/, (m) => `Send a password reset link to ${m[1]}?`],
  [/^تم إرسال رابط إعادة التعيين إلى (.+)$/, (m) => `Reset link sent to ${m[1]}`],
  [/^تم حذف البرنامج\. (\d+) محاضرة.*$/s, (m) => `Program deleted. ${m[1]} lecture(s) now have no program — edit them to choose a new one.`],
  [/^انتهت فترة إتاحة هذه المحاضرة بتاريخ (.+)\.$/, (m) => `This lecture's availability ended on ${m[1]}.`],
  [/^تختفي المحاضرة عن المتدربين بعد (.+)$/, (m) => `The lecture will be hidden from trainees after ${m[1]}`],
  [/^شريحة (\d+)$/, (m) => `Slide ${m[1]}`],
  [/^السؤال (\d+)$/, (m) => `Question ${m[1]}`],
  [/^السؤال (\d+): أدخل خيارين على الأقل\.$/, (m) => `Question ${m[1]}: enter at least two options.`],
  [/^السؤال (\d+): الإجابة الصحيحة المختارة فارغة\.$/, (m) => `Question ${m[1]}: the selected correct answer is empty.`],
  [/^الرجاء كتابة نص السؤال (\d+)\.$/, (m) => `Please write the text of question ${m[1]}.`],
  [/^الخيار ([أبجد])$/, (m) => `Option ${LETTERS[m[1]]}`],
  [/^الخيار (\d+)$/, (m) => `Option ${m[1]}`],
  [/^(?:هل تريد )?حذف المحاضرة "(.+)"؟$/, (m) => `Delete the lecture “${m[1]}”?`],
  [/^الأسبوع (.+)$/, (m) => `Week ${m[1]}`],
  [/^اختبار قصير: (.+)$/, (m) => `Short quiz: ${m[1]}`],
  [/^جدول محاضرات برنامج «(.+)»$/, (m) => `Lecture schedule — “${m[1]}”`],
  [/^نسبة حضور المحاضرات (\d{4})$/, (m) => `Lecture attendance rate ${m[1]}`],
];

const AR_RE = /[؀-ۿ]/;
const EDGE_RE = /^([^؀-ۿA-Za-z]*)([\s\S]*?)([\s:()%.،*«»"]*)$/;

export function translate(text) {
  if (!text || !AR_RE.test(text)) return text;
  const raw = text;
  const lead = raw.match(/^\s*/)[0];
  const trail = raw.match(/\s*$/)[0];
  const t = raw.trim().replace(/\s+/g, " ");
  if (EN[t] !== undefined) return lead + EN[t] + trail;
  for (const [re, fn] of PATTERNS) {
    const m = t.match(re);
    if (m) return lead + fn(m) + trail;
  }
  const e = t.match(EDGE_RE);
  if (e && e[2]) {
    const core = e[2].trim();
    if (EN[core] !== undefined) return lead + e[1] + EN[core] + e[3] + trail;
    for (const [re, fn] of PATTERNS) {
      const m = core.match(re);
      if (m) return lead + e[1] + fn(m) + e[3] + trail;
    }
    // try including trailing punctuation (e.g. "المحاضر:")
    const withTrail = (core + e[3]).trim();
    if (EN[withTrail] !== undefined) return lead + e[1] + EN[withTrail] + trail;
  }
  return text;
}

const ATTRS = ["placeholder", "title", "aria-label"];

function translateNode(node) {
  if (node.nodeType === 3) {
    const v = node.nodeValue;
    if (v && AR_RE.test(v)) {
      const tr = translate(v);
      if (tr !== v) node.nodeValue = tr;
    }
    return;
  }
  if (node.nodeType !== 1) return;
  const tag = node.tagName;
  if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEXTAREA") return;
  for (const a of ATTRS) {
    const v = node.getAttribute && node.getAttribute(a);
    if (v && AR_RE.test(v)) {
      const tr = translate(v);
      if (tr !== v) node.setAttribute(a, tr);
    }
  }
  if (node.isContentEditable) return;
  for (let c = node.firstChild; c; c = c.nextSibling) translateNode(c);
}

export function startTranslation() {
  if (getLang() !== "en") return;
  document.documentElement.lang = "en";
  document.documentElement.dir = "ltr";
  document.title = translate(document.title);
  const origAlert = window.alert.bind(window);
  const origConfirm = window.confirm.bind(window);
  window.alert = (msg) => origAlert(translate(String(msg ?? "")));
  window.confirm = (msg) => origConfirm(translate(String(msg ?? "")));
  const run = () => translateNode(document.body);
  run();
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") translateNode(m.target);
      else if (m.type === "attributes") translateNode(m.target);
      else m.addedNodes.forEach((n) => translateNode(n));
    }
  });
  obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export function dateLocale() {
  return getLang() === "en" ? "en-GB" : "ar-SA-u-ca-gregory-nu-latn";
}
