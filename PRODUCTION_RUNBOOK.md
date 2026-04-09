# Sadady Salla Theme Production Runbook

هذا الدليل مختصر وموجه للتشغيل الفعلي للثيم داخل سلة مع أقل قدر من الاحتكاك.

## الهدف

- تثبيت الثيم الذي يطابق واجهة `sadady.com`
- ضمان أن الثيم يقرأ من `api.sadady.com` عند توفره
- الاحتفاظ بمسار رجوع واضح إذا احتجنا rollback

## قبل الرفع

1. تحقّق من سلامة ملفات الثيم:

```bash
npm --prefix theme run validate
```

2. تأكد من أن ملف الثيم المضغوط موجود وجاهز للرفع:

- `sadady-salla-theme.zip`

3. راجع إعدادات `theme-config`:

- `GET /api/v1/public/theme-config`
- إذا تعذّر الوصول إليه، سيستخدم الثيم القيم الافتراضية المحلية

## أثناء المعاينة

- ابدأ دائمًا بالمعاينة قبل التفعيل
- اختبر:
  - الصفحة الرئيسية
  - مسار الطلب
  - صفحة التتبع
  - صفحة `thank-you`
  - صفحات العميل
- تأكد أن الجلسة تظهر في شريط السلة وأن هوية العميل تُقرأ من سلة عند وجودها

## بعد التفعيل

1. افتح `sadady.com`
2. افتح `tracking`
3. افتح `thank-you`
4. اختبر أن `window.SADADY_API_BASE` يشير إلى:

```text
https://api.sadady.com
```

5. اختبر أن الثيم يعرض:

- اسم العميل
- رقم الجوال
- هوية سلة

## rollback

إذا ظهرت مشكلة بعد النشر:

1. أوقف تفعيل الثيم الجديد داخل سلة
2. ارجع إلى النسخة السابقة المعتمدة
3. أعد فحص:
   - `api.sadady.com`
   - `theme-config`
   - `customer session`
4. احتفظ دائمًا بنسخة zip سابقة صالحة للرجوع

## checklist مختصر

- [ ] validate passed
- [ ] theme zip ready
- [ ] preview tested
- [ ] home page loaded
- [ ] tracking page loaded
- [ ] thank-you page loaded
- [ ] customer session visible
- [ ] API base resolved
- [ ] rollback path ready
