import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import "./styles.css";

function showFatalFallback(message) {
  const root = document.getElementById("root");
  if (!root) return;
  root.innerHTML =
    '<div dir="rtl" style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;' +
    'font-family:Tahoma,sans-serif;background:#F5F6F8;color:#14213A;text-align:center">' +
    '<div><div style="font-size:44px;margin-bottom:10px">⚠️</div>' +
    '<h2 style="margin:0 0 8px;font-size:17px">حدث خطأ أثناء تشغيل التطبيق</h2>' +
    '<p style="font-size:13px;color:#6B7686;line-height:1.8;max-width:320px;margin:0 auto 16px">' +
    (message ? String(message).replace(/</g, "&lt;") : "تعذّر تحميل واجهة التطبيق. أعد المحاولة أو تواصل مع الدعم الفني.") +
    '</p><button onclick="location.reload()" style="background:#F28C28;color:#fff;border:0;border-radius:10px;' +
    'padding:11px 22px;font-size:13px;font-weight:700">إعادة المحاولة</button></div></div>';
}

// تسجيل أي خطأ عام أو Promise مرفوض دون معالجة، لتشخيص المشكلة عبر adb logcat بدل شاشة بيضاء صامتة
window.addEventListener("error", (e) => console.error("Global error:", e.error || e.message));
window.addEventListener("unhandledrejection", (e) => console.error("Unhandled rejection:", e.reason));

try {
  createRoot(document.getElementById("root")).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} catch (err) {
  // شبكة أمان أخيرة: لو فشل React نفسه في التركيب (خطأ متزامن قبل أن يُركَّب ErrorBoundary)
  console.error("Fatal render error:", err);
  showFatalFallback(err?.message);
}
