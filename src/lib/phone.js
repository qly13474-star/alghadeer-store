// تطبيع رقم الهاتف العراقي إلى صيغة موحدة واحدة: 964 + 10 أرقام تبدأ بـ 7  (مثال: 9647701234567)
// يقبل: 07701234567 | 7701234567 | +964 770 123 4567 | 00964... | 964... | 0964... | أرقام عربية/فارسية
const AR = "٠١٢٣٤٥٦٧٨٩", FA = "۰۱۲۳۴۵۶۷۸۹";
export function normalizePhone(input) {
  let s = String(input || "")
    .replace(/[٠-٩]/g, (d) => AR.indexOf(d))
    .replace(/[۰-۹]/g, (d) => FA.indexOf(d))
    .replace(/[\s\-().]/g, "");
  if (s.startsWith("+")) s = s.slice(1);
  if (s.startsWith("00")) s = s.slice(2);
  if (s.startsWith("0964")) s = s.slice(1);
  if (s.startsWith("964")) s = s.slice(3);
  if (s.startsWith("0")) s = s.slice(1);
  return /^7\d{9}$/.test(s) ? "964" + s : null;
}
export const toLocalPhone = (n) => "0" + n.slice(3); // 07XXXXXXXXX للعرض
// معرّف داخلي ثابت لا يراه المستخدم، يُستعمل مع Firebase Email/Password فقط (لا يُرسَل إليه أي بريد)
export const PHONE_EMAIL_DOMAIN = "phone.alghadeer.store";
export const phoneToAuthEmail = (n) => `${n}@${PHONE_EMAIL_DOMAIN}`;

const COMMON = ["123456", "1234567", "12345678", "654321", "000000", "111111", "123123", "password", "qwerty"];
export function passwordError(p) {
  if (!p || p.length < 6) return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
  if (/^(.)\1+$/.test(p) || COMMON.includes(p.toLowerCase())) return "كلمة المرور ضعيفة جداً، اختر كلمة أصعب";
  return null;
}
export function passwordStrength(p) {
  let s = 0; if (p.length >= 6) s++; if (p.length >= 9) s++; if (/[a-zA-Z]/.test(p) && /\d/.test(p)) s++; if (/[^\w]/.test(p)) s++;
  return passwordError(p) ? 0 : Math.max(1, Math.min(3, s - 0));
}
export const AUTH_ERRORS = {
  "auth/invalid-credential": "رقم الهاتف أو كلمة المرور غير صحيحة",
  "auth/user-not-found": "الحساب غير موجود",
  "auth/wrong-password": "كلمة المرور غير صحيحة",
  "auth/email-already-in-use": "رقم الهاتف مستخدم مسبقاً",
  "auth/weak-password": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  "auth/too-many-requests": "محاولات كثيرة، انتظر قليلاً ثم حاول مجدداً",
  "auth/user-disabled": "هذا الحساب موقوف، تواصل مع الإدارة",
  "auth/network-request-failed": "تحقق من الاتصال بالإنترنت",
  "auth/operation-not-allowed": "تسجيل الدخول غير مفعّل في Firebase (فعّل Email/Password)",
};
