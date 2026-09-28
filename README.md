# الغدير للأجهزة المنزلية والأثاث المنزلي — React + Firebase + Capacitor

Package ID: `com.alghadeer.store` · اسم التطبيق على Android: **الغدير**

## 1) إنشاء Firebase (مرة واحدة — من حسابك)
1. https://console.firebase.google.com ← Add project ← اسمه مثلاً `alghadeer-store`.
2. Build ← **Authentication** ← Get started ← فعّل **Email/Password** (يُستخدم داخلياً فقط: رقم الهاتف يُحوَّل إلى معرّف ثابت `9647XXXXXXXXX@phone.alghadeer.store`، ولا يظهر أي بريد للمستخدم).
3. Build ← **Firestore Database** ← Create database (Production mode) ← اختر منطقة قريبة.
4. **لا تفعّل Storage ولا Blaze** — الصور تُرفع إلى Filestack (انظر قسم Filestack أدناه).
5. Project settings ← Your apps ← أضف **Web app** ← انسخ القيم إلى `.env` (انسخ `.env.example`).
6. الصق محتوى `firestore.rules` في Firestore ← Rules ← Publish.
   (أو: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules`)

## 2) أول مدير (ADMIN)
سجّل حساباً برقم الهاتف وكلمة المرور من التطبيق (حسابي ← إنشاء حساب جديد)، ثم في Firestore ← `users` ← مستند حسابك ← غيّر الحقل `role` من `CUSTOMER` إلى `ADMIN`.
بعدها من التطبيق: حسابي ← لوحة الإدارة ← الرئيسية ← «تحميل البيانات التجريبية» (7 أقسام + 15 منتجاً).
لتعيين مندوب: لوحة الإدارة ← المستخدمون ← غيّر دوره إلى COURIER.

## 3) التشغيل والاختبار
```
npm install
npm run dev
```

## 4) Android
```
npm run build
npx cap add android
bash scripts/android-setup.sh      # الاسم + التحقق من applicationId
npm run cap:assets                 # يولّد الأيقونة وSplash من مجلد assets
npm run cap:sync
cd android && ./gradlew assembleRelease
```
الناتج: `android/app/build/outputs/apk/release/app-release-unsigned.apk` — يحتاج توقيعاً ليُثبَّت (الأسهل: GitHub Actions أدناه).

## 5) بناء APK مجاناً بدون تثبيت شيء (GitHub Actions)
1. ارفع المشروع إلى مستودع GitHub خاص.
2. ولّد مفتاح توقيع (احتفظ به دائماً؛ ضياعه يمنع تحديث التطبيق):
   `keytool -genkey -v -keystore release.keystore -alias alghadeer -keyalg RSA -keysize 2048 -validity 10000`
   ثم `base64 -w0 release.keystore` لنسخ الناتج.
3. Settings ← Secrets and variables ← Actions: أضف `VITE_FIREBASE_*` الخمسة و`VITE_FILESTACK_API_KEY`، و`KEYSTORE_B64` و`KEYSTORE_PASSWORD` و`KEY_ALIAS`.
4. Actions ← Build Android APK ← Run workflow ← حمّل `app-release.apk` من Artifacts.

## ملاحظات أمان وحدود النسخة الأولى
- الأسعار وإجمالي الطلب تُحسب في التطبيق؛ للتحقق من جهة الخادم أضف Cloud Function لاحقاً (تحتاج خطة Blaze).
- الإشعارات Push: التطبيق جاهز ببنية الحالات؛ الإرسال يتم عبر Cloud Function تستمع لتغيّر `orders.status` وترسل FCM (لم تُنفَّذ بعد).
- خصم المخزون يحدث عند تحويل الطلب من NEW إلى CONFIRMED.

## تسجيل الدخول برقم الهاتف
- الرقم يُوحَّد إلى `964` + 10 أرقام (يقبل 07XXXXXXXXX و+964 و00964 والأرقام العربية)، فلا يمكن فتح حسابين لنفس الرقم.
- كلمة المرور تُعالَج داخل Firebase Auth فقط ولا تُكتب في Firestore أو Storage.
- لا يوجد استرجاع كلمة مرور بالبريد (لا بريد حقيقي)؛ عند النسيان يعيد المدير تعيينها من Firebase Console ← Authentication.
- إن كانت حماية «Email enumeration protection» مفعّلة (الافتراضي)، تظهر رسالة موحّدة «رقم الهاتف أو كلمة المرور غير صحيحة» بدل التمييز بين الحساب غير الموجود والكلمة الخاطئة، وهذا أفضل أمنياً.

## Filestack (رفع الصور)
1. أنشئ حساباً مجانياً في https://dev.filestack.com وانسخ **API Key** من Developer Portal (مفتاح عام مخصّص للاستخدام في الواجهة، وليس سرّاً).
2. ضعه في `.env` (ولا ترفع `.env` إلى GitHub):
   ```
   VITE_FILESTACK_API_KEY=<API Key>
   ```
   ثم أعد تشغيل `npm run dev`. في GitHub Actions أضفه كـ Secret باسم `VITE_FILESTACK_API_KEY`.
3. لا تحتاج **Application Secret** ولا تضعه في المشروع أبداً. لا تفعّل «Security Policy» على تطبيق Filestack، فهي تتطلب توقيعاً من خادم ولا تعمل مع رفع مباشر من التطبيق.
- الرفع يتم من المتصفح عبر SDK الرسمي `filestack-js` (يُثبَّت مع `npm install`)، وفي Firestore يُحفظ فقط: `images: [{ url, handle }]` للمنتجات، و`image` + `imageHandle` للأقسام والبانرات (لا يُخزَّن ملف الصورة).
- حذف صورة من لوحة الإدارة يزيلها من المنتج/القسم/البانر فقط، ولا يحذف الأصل من Filestack (الحذف يحتاج Secret من الخادم). يمكنك الحذف يدوياً من Developer Portal، أو نضيف لاحقاً Cloud Function آمنة.
- راجع حدود الخطة المجانية (عدد الرفعات والتخزين والنطاق) في صفحة أسعار Filestack قبل الإطلاق.

## اختبار APK عبر GitHub Actions (Debug بدون keystore)
1. Settings ← Secrets and variables ← Actions ← New repository secret. أضف:
   `VITE_FIREBASE_API_KEY` و`VITE_FIREBASE_AUTH_DOMAIN` و`VITE_FIREBASE_PROJECT_ID` و`VITE_FIREBASE_MESSAGING_SENDER_ID` و`VITE_FIREBASE_APP_ID` و`VITE_FILESTACK_API_KEY`.
2. Actions ← **Build Android APK** ← Run workflow ← `build_type = debug` ← Run.
3. بعد النجاح افتح التشغيل ← قسم **Artifacts** ← نزّل `alghadeer-debug-apk` (ملف ZIP يحتوي `alghadeer-debug.apk`) وثبّته على Android (اسمح بالتثبيت من مصادر غير معروفة).
- أسرار التوقيع (`KEYSTORE_*`) غير مطلوبة للـ Debug؛ إن اخترت `release` بدونها يُبنى Debug تلقائياً مع تحذير.
- غياب `VITE_FILESTACK_API_KEY` لا يفشل البناء: يعمل التطبيق ويظهر للمشرف أن رفع الصور غير مُهيأ.
