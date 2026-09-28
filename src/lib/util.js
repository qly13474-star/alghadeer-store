export const fmt = (n) => Number(n || 0).toLocaleString("en-US") + " د.ع";
export const GOV = ["بغداد","البصرة","نينوى (الموصل)","أربيل","السليمانية","دهوك","كركوك","ديالى (بعقوبة)","الأنبار (الرمادي)","بابل (الحلة)","كربلاء","النجف","واسط (الكوت)","ذي قار (الناصرية)","ميسان (العمارة)","المثنى (السماوة)","القادسية (الديوانية)","صلاح الدين (تكريت)"];
export const STATUS = { NEW: "جديد", CONFIRMED: "مؤكد", PREPARING: "قيد التجهيز", READY: "جاهز", ASSIGNED_TO_COURIER: "أُسند لمندوب", OUT_FOR_DELIVERY: "خرج للتوصيل", DELIVERED: "تم التسليم", CANCELLED: "ملغي" };
export const STOCK = { available: "متوفر", unavailable: "غير متوفر", out: "نفد المخزون" };
export const discountPct = (p) => (p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const isStaff = (r) => r === "ADMIN" || r === "MANAGER";
import { normalizePhone } from "./phone.js";
export const validPhone = (v) => normalizePhone(v) !== null;
// الصورة قد تكون رابطاً نصياً (بيانات قديمة) أو كائناً { url, handle }
export const imgUrl = (x) => (typeof x === "string" ? x : x?.url || "");
