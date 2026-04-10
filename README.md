# Sadady Salla Theme

ثيم خاص بسدادي داخل سلة، مبني على واجهة `sadady.com` الحالية مع ربط مباشر بواجهات `api.sadady.com`.

## الهدف

- إبقاء الصفحة الرئيسية Static داخل الثيم
- تشغيل مسار الطلب والتتبع وصفحات العميل داخل سلة
- الاعتماد على الباك إند كمصدر الحقيقة
- منع حقن بيانات العميل الحساسة داخل Twig أو JavaScript inline

## أهم الملفات

- `src/views/pages/index.twig`
- `src/views/pages/tracking.twig`
- `src/views/pages/thank-you.twig`
- `src/views/pages/customer/orders/index.twig`
- `src/views/pages/customer/orders/single.twig`
- `src/views/pages/customer/profile.twig`
- `src/views/pages/customer/notifications.twig`
- `src/views/layouts/master.twig`
- `assets/js/sadady/api-client.js`
- `assets/js/sadady/theme-api.js`
- `assets/js/sadady/quote-flow.js`
- `assets/js/sadady/checkout-flow.js`
- `assets/js/sadady/customer-orders.js`

## قواعد التنفيذ

- الصفحة الرئيسية لا تعتمد على Salla home components الديناميكية
- `theme-config` يبقى المصدر الوحيد للنصوص/الألوان/الشعار القابلة للتغيير
- تسجيل الدخول وOTP يتمان عبر سلة فقط، وليس عبر mock flow داخل الثيم
- أي Session في الواجهة يجب أن تأتي من جلسة حقيقية مخزنة محليًا أو من تكامل لاحق آمن، وليس من حقن `customer.*` داخل الصفحة

## التحقق المحلي

```bash
npm run validate
```

هذا الفحص يتأكد من وجود الملفات الأساسية وربط السكربتات والمقاطع الحساسة المطلوبة للنسخة الحالية.

## ملاحظات

- مجلد `src/locales` موجود الآن كبداية بسيطة ويمكن توسيعه لاحقًا.
- هذا الثيم خاص بسدادي، لذلك صفحات Marketplace العامة ليست أولوية في النسخة الحالية.
- تفاصيل النشر والتراجع موجودة في [PRODUCTION_RUNBOOK.md](/C:/Users/ha_91/Downloads/سدادي%20سله/theme/PRODUCTION_RUNBOOK.md).
