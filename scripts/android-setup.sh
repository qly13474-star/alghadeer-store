#!/usr/bin/env bash
# يُشغَّل مرة واحدة بعد: npx cap add android
set -e
S=android/app/src/main/res/values/strings.xml
sed -i 's|<string name="app_name">.*</string>|<string name="app_name">الغدير</string>|' $S
sed -i 's|<string name="title_activity_main">.*</string>|<string name="title_activity_main">الغدير للأجهزة المنزلية والأثاث المنزلي</string>|' $S
grep -q 'applicationId "com.alghadeer.store"' android/app/build.gradle && echo "applicationId OK" || echo "تحقق من applicationId في android/app/build.gradle"
