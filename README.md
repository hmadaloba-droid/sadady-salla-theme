# Sadady Salla Theme

هذا المجلد هو الثيم الرسمي لواجهة العميل داخل سلة.

القرار المعتمد نهائيًا:

- `sadady.com` = داخل سلة
- كل ما يراه العميل = داخل هذا الثيم
- `admin.sadady.com` = إدارة خارج سلة
- `ops.sadady.com` = تشغيل خارج سلة
- `api.sadady.com` = الباك إند ومصدر الحقيقة

## المرجع البصري الرسمي

المرجع المعتمد للواجهة هو الموقع الحالي `sadady.com` كما هو، وليس أي إعادة تصميم قريبة منه.

المرجع المحلي المعتمد داخل المشروع:

- `C:\Users\ha_91\Downloads\سدادي سله\sadady_official_homepage_snapshot.html`
- `C:\Users\ha_91\Downloads\سدادي سله\sadady_official_ui_source.md`
- `C:\Users\ha_91\Downloads\سدادي سله\sadady_pixel_perfect_checklist.md`

الهدف هو:

- `Porting current sadady.com into Salla Theme as-is`
- الوصول إلى مطابقة بصرية كاملة `pixel-perfect` قدر الإمكان

## الملفات الأساسية المعتمدة

### الصفحات والتخطيطات

- `src/views/pages/index.twig`
- `src/views/layouts/landing.twig`
- `src/views/layouts/master.twig`

### مكوّنات الواجهة الرسمية

- `src/views/components/sadady/layout/header.twig`
- `src/views/components/sadady/layout/footer.twig`
- `src/views/components/sadady/home/hero-banner.twig`
- `src/views/components/sadady/home/providers-strip.twig`
- `src/views/components/sadady/home/service-modes.twig`
- `src/views/components/sadady/home/request-form-sadad.twig`
- `src/views/components/sadady/home/request-form-external.twig`
- `src/views/components/sadady/journey/summary-modal.twig`
- `src/views/components/sadady/journey/otp-request-form.twig`
- `src/views/components/sadady/journey/otp-verify-form.twig`

### الطبقة البصرية والسلوكية

- `assets/css/sadady-home.css`
- `assets/css/sadady-journey.css`
- `assets/js/sadady/live-home.js`

## ما الذي يعتبر مصدر الحقيقة؟

في الصفحة الرئيسية الحالية، مصدر الحقيقة هو:

- HTML/Twig الحالي
- CSS الرسمي الحالي
- JS الرسمي الحالي

أي ملف آخر قديم أو مساعد لا يُعتبر مرجعًا بصريًا للصفحة الرئيسية ما لم يتم ذكره صراحة هنا.

## ملاحظات مهمة

- قد تبقى بعض الملفات القديمة داخل `assets/js/sadady/` أو ملفات إعدادات قديمة لأغراض مرجعية أو مستقبلية.
- هذه الملفات لا تُعد المصدر الرسمي للواجهة الرئيسية ما لم تُستخدم مباشرة في `index.twig` و`landing.twig` و`master.twig`.
- أي عمل جديد على الصفحة الرئيسية يجب أن يُقاس مباشرة مقابل `sadady.com` والملف المرجعي المحلي.

## المبدأ التنفيذي

- لا نعيد تصميم الواجهة من الصفر
- لا نغيّر ترتيب الصفحة أو أسلوبها
- لا ننقل العميل إلى بوابة منفصلة خارج سلة
- نجهز نقاط الربط مع الباك إند فقط بدون تغيير الشكل

## التحقق والنشر

- افحص الثيم محليًا قبل أي رفع:

```bash
npm --prefix theme run validate
```

- راجع دليل التشغيل الإنتاجي المختصر:
  - [PRODUCTION_RUNBOOK.md](/C:/Users/ha_91/Downloads/%D8%B3%D8%AF%D8%A7%D8%AF%D9%8A%20%D8%B3%D9%84%D9%87/theme/PRODUCTION_RUNBOOK.md)

- المسار النهائي للعميل داخل سلة يجب أن يلتقط:
  - `window.SADADY_API_BASE`
  - بيانات العميل من سلة
  - صفحات `tracking` و`thank-you` و`customer/*`
