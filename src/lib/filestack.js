// رفع الصور إلى Filestack مباشرة من المتصفح عبر SDK الرسمي (filestack-js) بمفتاح API العام فقط.
// لا يوجد Application Secret في المشروع. في Firestore تُحفظ الروابط (url) و handle فقط، لا ملف الصورة.
const env = import.meta.env;
const API_KEY = (env.VITE_FILESTACK_API_KEY || "").trim();
export const filestackConfigured = Boolean(API_KEY);

export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;
export const MAX_FINAL_BYTES = 2 * 1024 * 1024;   // الحد الأقصى بعد الضغط: 2MB
const MAX_RAW_BYTES = 25 * 1024 * 1024;           // حماية الذاكرة قبل الضغط
const MAX_SIDE = { products: 1200, categories: 600, banners: 1600 }; // أطول ضلع بالبكسل

export const imgMsg = (code) => ({
  NOT_IMAGE: "الملف ليس صورة صالحة",
  BAD_FORMAT: "صيغة غير مدعومة، المسموح: JPG وPNG وWEBP فقط",
  RAW_TOO_BIG: "حجم الصورة كبير جداً (الحد 25MB قبل الضغط)",
  TOO_BIG: "تعذّر تصغير الصورة إلى أقل من 2MB، اختر صورة أصغر",
  NOT_CONFIGURED: "رفع الصور غير مُهيأ: أضف VITE_FILESTACK_API_KEY في ملف .env",
  NETWORK: "تعذّر الاتصال بالإنترنت أثناء رفع الصورة",
  TIMEOUT: "انتهت مهلة الرفع، حاول مرة أخرى",
  AUTH: "مفتاح Filestack غير صحيح أو تم تجاوز الحد المجاني للحساب",
  UPLOAD_FAILED: "فشل رفع الصورة، حاول مرة أخرى",
}[code] || "فشل رفع الصورة، حاول مرة أخرى");

function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("NOT_IMAGE")); };
    img.src = url;
  });
}
const toBlob = (c, q) => new Promise((res) => c.toBlob(res, "image/jpeg", q));

// تحقق + تصغير + ضغط (JPEG) حتى يصبح ≤ 2MB. يرجع { blob, previewUrl, width, height, size }
export async function prepareImage(file, folder = "products") {
  if (!file || !ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXT.test(file.name || "")) throw new Error(file?.type?.startsWith("image/") ? "BAD_FORMAT" : "NOT_IMAGE");
  if (file.size > MAX_RAW_BYTES) throw new Error("RAW_TOO_BIG");
  const img = await loadImage(file), side = MAX_SIDE[folder] || 1200;
  for (const shrink of [1, 0.8, 0.6, 0.45]) {
    const s = Math.min(1, side / Math.max(img.width, img.height)) * shrink;
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); // خلفية بيضاء للصور الشفافة (PNG/WEBP)
    g.drawImage(img, 0, 0, c.width, c.height);
    for (const q of [0.82, 0.7, 0.55]) {
      const blob = await toBlob(c, q);
      if (blob && blob.size <= MAX_FINAL_BYTES) return { blob, previewUrl: URL.createObjectURL(blob), width: c.width, height: c.height, size: blob.size };
    }
  }
  throw new Error("TOO_BIG");
}

// تحويل أي خطأ من SDK/الشبكة إلى رمز داخلي (401/403 → AUTH، 413 → TOO_BIG، الشبكة → NETWORK ...)
export function uploadErrorCode(err) {
  if (err?.message && ["NOT_CONFIGURED", "TIMEOUT"].includes(err.message)) return err.message;
  const status = [err?.code, err?.status, err?.statusCode, err?.response?.status, err?.details?.code, err?.details?.status]
    .map(Number).find((n) => Number.isInteger(n) && n >= 400 && n < 600);
  if (status === 401 || status === 403) return "AUTH";
  if (status === 413) return "TOO_BIG";
  const m = String(err?.message || "") + " " + String(err?.details?.message || "");
  if (/network|failed to fetch|load failed|offline|xhr|cors/i.test(m)) return "NETWORK";
  if (/timeout|timed out/i.test(m)) return "TIMEOUT";
  if (/forbidden|unauthori[sz]ed|invalid.*(api|key)|apikey/i.test(m)) return "AUTH";
  if (/too large|too big|payload/i.test(m)) return "TOO_BIG";
  return "UPLOAD_FAILED";
}

let clientPromise = null;
const getClient = () => (clientPromise ||= import("filestack-js").then((m) => (m.init || m.default?.init)(API_KEY)));

// رفع عبر SDK الرسمي مع نسبة التقدم. يرجع { url, handle }
export async function uploadImage(blob, folder = "products", onProgress) {
  if (!filestackConfigured) throw new Error("NOT_CONFIGURED");
  try {
    const client = await getClient();
    const name = `${folder}-${Date.now()}.jpg`;
    const file = new File([blob], name, { type: "image/jpeg" });
    const res = await client.upload(
      file,
      { onProgress: (e) => onProgress?.(Math.min(100, Math.round(e?.totalPercent ?? 0))), retry: 3, timeout: 60000 },
      { filename: name, mimetype: "image/jpeg" },
    );
    const handle = res?.handle || String(res?.url || "").split("/").pop();
    if (!handle) throw new Error("UPLOAD_FAILED");
    return { url: res?.url || `https://cdn.filestackcontent.com/${handle}`, handle };
  } catch (err) {
    throw new Error(uploadErrorCode(err));
  }
}
