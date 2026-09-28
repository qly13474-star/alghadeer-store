import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Capacitor } from "@capacitor/core";

// كل القيم تأتي من متغيرات البيئة (.env) — لا توجد قيم مكتوبة داخل الكود
// ملاحظة: الصور تُرفع إلى Filestack (انظر src/lib/filestack.js) ولا يُستخدم أي تخزين ملفات من Firebase
const env = import.meta.env;
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

// أهم إصلاح لمشكلة الشاشة البيضاء: لا يجوز لأي خطأ هنا أن يُرمى بلا معالجة، لأن هذا الملف
// يُستورَد في أول سطر من App.jsx؛ فأي استثناء غير مُمسوك هنا كان يمنع React من التحميل بالكامل
// (لا Setup ولا أي شيء يظهر — شاشة بيضاء تماماً).
export let initError = null;
let app = null, auth = null, db = null;

if (configured) {
  try {
    app = initializeApp(firebaseConfig);
    try {
      // getAuth() الافتراضية تحمّل resolver خاصاً بالنوافذ المنبثقة يحاول تحميل iframe من
      // authDomain، وهذا لا يكتمل أبداً تحت مصدر Capacitor المخصص (https://localhost على
      // أندرويد)، فيُعلّق onAuthStateChanged ولا يُطلَق أبداً — وهي مشكلة موثّقة لتطبيقات
      // Capacitor + Firebase Auth. لذلك نستخدم initializeAuth مباشرة داخل التطبيق الأصلي
      // (بدون resolver) مع تجربة أكثر من نوع تخزين احتياطياً، ونُبقي getAuth() لنسخة الويب.
      auth = Capacitor.isNativePlatform()
        ? initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, inMemoryPersistence] })
        : getAuth(app);
    } catch (e) {
      auth = getAuth(app); // (مثلاً عند إعادة تحميل التطوير حيث يكون Auth مهيأً مسبقاً)
    }
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase init failed:", e);
    initError = e?.message || String(e);
    app = null; auth = null; db = null;
  }
}

export { auth, db };
export const WHATSAPP = env.VITE_WHATSAPP || "9647738487299";
