import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// base: "./" يجعل مسارات JS/CSS نسبية بدل جذرية، وهو الإعداد الموصى به لتطبيقات Capacitor
// الهجينة (يمنع أي احتمال لفشل تحميل assets داخل WebView مع اختلاف origin/scheme)، ولا يكسر نسخة الويب
// طالما أن dist تُخدَّم من مسارها الجذري كما هي الآن.
export default defineConfig({ base: "./", plugins: [react()] });
