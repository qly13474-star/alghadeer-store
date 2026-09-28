import React, { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";
import { isStaff } from "../lib/util.js";
import { normalizePhone, toLocalPhone, phoneToAuthEmail, passwordError, passwordStrength, AUTH_ERRORS } from "../lib/phone.js";
import { Field, toast } from "../ui.jsx";
import { ProductCard } from "./Home.jsx";

const ROLE_AR = { CUSTOMER: "عميل", ADMIN: "مدير", MANAGER: "مدير مساعد", COURIER: "مندوب توصيل" };

export default function Account(props) {
  const { user, profile, role, auth, favProducts, open, openPanel } = props;
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", phone: "", pass: "", pass2: "" });
  const [errs, setErrs] = useState({}), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const E = ({ k }) => (errs[k] ? <div className="err">{errs[k]}</div> : null);

  async function login() {
    const phone = normalizePhone(f.phone);
    const e = {};
    if (!phone) e.phone = "رقم الهاتف غير صحيح";
    if (!f.pass) e.pass = "أدخل كلمة المرور";
    setErrs(e); if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, phoneToAuthEmail(phone), f.pass);
      // جلب بيانات المستخدم من Firestore بعد الدخول؛ وإن فُقد المستند (فشل سابق أثناء التسجيل) يُنشأ مستند أساسي
      const ref = doc(db, "users", cred.user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) await setDoc(ref, { phone: toLocalPhone(phone), phoneNormalized: phone, name: "", role: "CUSTOMER", createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      toast("أهلاً بك 👋");
    } catch (err) { toast(AUTH_ERRORS[err.code] || "حدث خطأ، حاول مرة أخرى", "err"); }
    setBusy(false);
  }

  async function register() {
    const phone = normalizePhone(f.phone);
    const e = {};
    if (f.name.trim().length < 3) e.name = "أدخل الاسم الكامل";
    if (!phone) e.phone = "رقم الهاتف غير صحيح";
    const pe = passwordError(f.pass); if (pe) e.pass = pe;
    if (!e.pass && f.pass !== f.pass2) e.pass2 = "كلمة المرور غير متطابقة";
    setErrs(e); if (Object.keys(e).length) return;
    setBusy(true);
    let cred = null;
    try {
      cred = await createUserWithEmailAndPassword(auth, phoneToAuthEmail(phone), f.pass); // يفشل تلقائياً إن كان الرقم مسجّلاً
      await setDoc(doc(db, "users", cred.user.uid), {
        phone: toLocalPhone(phone), phoneNormalized: phone, name: f.name.trim(), role: "CUSTOMER",
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      toast("تم إنشاء حسابك بنجاح ✅");
    } catch (err) {
      if (cred && err.code?.startsWith("permission")) { try { await deleteUser(cred.user); } catch {} } // لا نترك حساب مصادقة بلا ملف بيانات
      if (err.code === "auth/email-already-in-use") setErrs({ phone: "رقم الهاتف مستخدم مسبقاً" });
      toast(err.code?.startsWith("permission") ? "تعذّر إنشاء الحساب، حاول مرة أخرى" : (AUTH_ERRORS[err.code] || "حدث خطأ، حاول مرة أخرى"), "err");
    }
    setBusy(false);
  }

  if (!user) {
    const st = passwordStrength(f.pass);
    return (
      <div className="pad" style={{ paddingTop: 16 }}>
        <div className="tabs" style={{ padding: 0 }}>
          <button className={mode === "login" ? "on" : ""} onClick={() => { setMode("login"); setErrs({}); }}>تسجيل الدخول</button>
          <button className={mode === "register" ? "on" : ""} onClick={() => { setMode("register"); setErrs({}); }}>إنشاء حساب جديد</button>
        </div>
        {mode === "register" && <Field label="الاسم الكامل"><input className="f" autoComplete="name" value={f.name} onChange={set("name")} /><E k="name" /></Field>}
        <Field label="رقم الهاتف"><input className="f" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXXX أو +964" value={f.phone} onChange={set("phone")} /><E k="phone" /></Field>
        <Field label="كلمة المرور"><input className="f" dir="ltr" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.pass} onChange={set("pass")} /><E k="pass" /></Field>
        {mode === "register" && (
          <>
            {f.pass && <div style={{ display: "flex", gap: 4, marginTop: 6 }}>{[1, 2, 3].map((i) => <i key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= st ? (st === 1 ? "var(--red)" : st === 2 ? "var(--orange)" : "var(--green)") : "var(--line)" }} />)}</div>}
            <Field label="تأكيد كلمة المرور"><input className="f" dir="ltr" type="password" autoComplete="new-password" value={f.pass2} onChange={set("pass2")} /><E k="pass2" /></Field>
          </>
        )}
        <button className="btn o full" disabled={busy} onClick={mode === "login" ? login : register}>{busy ? "..." : mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button>
      </div>
    );
  }

  return (
    <div className="pad" style={{ paddingTop: 16 }}>
      <div className="row">
        <div className="t">👤</div>
        <div className="i"><h4>{profile?.name || "مستخدم"}</h4><div style={{ fontSize: 12, color: "var(--muted)" }} dir="ltr">{profile?.phone}</div><span className="pill">{ROLE_AR[role] || role}</span></div>
      </div>
      {isStaff(role) && <button className="btn n full" onClick={() => openPanel("admin")}>🛠️ لوحة الإدارة</button>}
      {role === "COURIER" && <button className="btn n full" onClick={() => openPanel("courier")}>🛵 لوحة المندوب</button>}
      <div className="sec" style={{ padding: "16px 0 8px" }}><h2>❤️ المفضلة</h2></div>
      {favProducts.length
        ? <div className="grid" style={{ padding: 0 }}>{favProducts.map((p) => <ProductCard key={p.id} p={p} open={open} add={props.add} buyNow={props.buyNow} favs={props.favs} user={user} setTab={props.setTab} />)}</div>
        : <div style={{ fontSize: 12.5, color: "var(--muted)" }}>لم تضف منتجات للمفضلة بعد</div>}
      <button className="btn r full" onClick={() => signOut(auth)}>تسجيل الخروج</button>
    </div>
  );
}
