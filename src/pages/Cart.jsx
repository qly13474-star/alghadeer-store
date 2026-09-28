import React, { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase.js";
import { useCol } from "../lib/data.js";
import { fmt, GOV, validPhone, imgUrl } from "../lib/util.js";
import { normalizePhone, toLocalPhone } from "../lib/phone.js";
import { Img, Empty, Field, Overlay, toast } from "../ui.jsx";

const DEFAULT_FEE = 5000;
function useTotals(prods, cart) {
  const { rows } = useCol("settings");
  const s = rows.find((r) => r.id === "main") || {};
  const items = Object.keys(cart).map((id) => ({ p: prods.find((x) => x.id === id), q: cart[id] })).filter((i) => i.p);
  const subtotal = items.reduce((a, i) => a + i.p.price * i.q, 0);
  const saved = items.reduce((a, i) => a + Math.max(0, (i.p.oldPrice || 0) - i.p.price) * i.q, 0);
  const freeFrom = Number(s.freeDeliveryFrom || 0);
  const delivery = items.length === 0 || (freeFrom && subtotal >= freeFrom) ? 0 : Number(s.deliveryFee ?? DEFAULT_FEE);
  return { items, subtotal, saved, delivery, total: subtotal + delivery };
}

export function Cart({ prods, cart, setQty, goCheckout, setTab }) {
  const t = useTotals(prods, cart);
  if (!t.items.length) return <Empty icon="🛒" text="سلتك فارغة حالياً" />;
  return (
    <div className="pad" style={{ paddingTop: 14 }}>
      <h2 style={{ fontSize: 15, marginBottom: 10 }}>سلة المشتريات</h2>
      {t.items.map(({ p, q }) => (
        <div className="row" key={p.id}>
          <div className="t"><Img src={imgUrl(p.images?.[0])} emoji={p.emoji} /></div>
          <div className="i"><h4>{p.name}</h4><div className="pr" style={{ fontSize: 12.5 }}>{fmt(p.price)} <span style={{ color: "var(--muted)", fontWeight: 400 }}>× {q} = {fmt(p.price * q)}</span></div>
            <div className="qty"><button onClick={() => setQty(p.id, q + 1)}>+</button><b>{q}</b><button onClick={() => setQty(p.id, q - 1)}>−</button>
              <button style={{ marginRight: "auto", background: "#FBE7E4", color: "var(--red)" }} onClick={() => setQty(p.id, 0)}>🗑</button></div></div>
        </div>
      ))}
      <Summary t={t} />
      <button className="btn o full" onClick={goCheckout}>إتمام الطلب</button>
    </div>
  );
}

const Summary = ({ t }) => (
  <div className="total">
    <div><span>المجموع</span><span>{fmt(t.subtotal)}</span></div>
    {t.saved > 0 && <div><span>الخصم (وفّرت)</span><span>{fmt(t.saved)}</span></div>}
    <div><span>رسوم التوصيل</span><span>{t.delivery ? fmt(t.delivery) : "مجاني"}</span></div>
    <div className="g"><span>الإجمالي النهائي</span><span>{fmt(t.total)}</span></div>
  </div>
);

export function Checkout({ prods, cart, user, profile, onClose, onDone, setTab }) {
  const t = useTotals(prods, cart);
  const [f, setF] = useState({ name: profile?.name || "", phone: profile?.phone || "", gov: "", city: "", address: "", notes: "" });
  const [errs, setErrs] = useState({}), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  if (!user) return (
    <Overlay title="إتمام الطلب" onClose={onClose}>
      <Empty icon="🔐" text="سجّل الدخول لإتمام الطلب" />
      <div className="pad"><button className="btn o full" onClick={() => { onClose(); setTab("account"); }}>تسجيل الدخول / إنشاء حساب</button></div>
    </Overlay>
  );

  async function submit() {
    if (busy) return;
    const e = {};
    if (f.name.trim().length < 3) e.name = "أدخل الاسم الكامل";
    if (!validPhone(f.phone)) e.phone = "رقم هاتف عراقي غير صحيح (07XXXXXXXXX)";
    if (!f.gov) e.gov = "اختر المحافظة";
    if (f.city.trim().length < 2) e.city = "أدخل المدينة";
    if (f.address.trim().length < 5) e.address = "أدخل العنوان التفصيلي";
    if (!t.items.length) e.cart = "السلة فارغة";
    setErrs(e); if (Object.keys(e).length) return;
    const bad = t.items.find(({ p, q }) => p.status !== "available" || Number(p.stock) < q);
    if (bad) return toast(`«${bad.p.name}» غير متوفر بالكمية المطلوبة`, "err");
    setBusy(true);
    try {
      await addDoc(collection(db, "orders"), {
        uid: user.uid, status: "NEW", payment: "COD",
        customer: { name: f.name.trim(), phone: toLocalPhone(normalizePhone(f.phone)), gov: f.gov, city: f.city.trim(), address: f.address.trim(), notes: f.notes.trim() },
        items: t.items.map(({ p, q }) => ({ id: p.id, name: p.name, price: p.price, qty: q, image: imgUrl(p.images?.[0]), emoji: p.emoji || "" })),
        subtotal: t.subtotal, discount: t.saved, delivery: t.delivery, total: t.total,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
      toast("✅ تم استلام طلبك، سنتواصل معك للتأكيد");
      onDone();
    } catch (err) { console.error(err); toast("تعذّر إرسال الطلب، تحقق من الاتصال وحاول مجدداً", "err"); setBusy(false); }
  }
  const E = ({ k }) => errs[k] ? <div className="err">{errs[k]}</div> : null;
  return (
    <Overlay title="📍 معلومات الشحن والتوصيل" onClose={onClose}>
      <div className="pad">
        <Field label="الاسم الكامل"><input className="f" value={f.name} onChange={set("name")} /><E k="name" /></Field>
        <Field label="رقم الهاتف"><input className="f" inputMode="tel" placeholder="07XXXXXXXXX" value={f.phone} onChange={set("phone")} /><E k="phone" /></Field>
        <Field label="المحافظة"><select className="f" value={f.gov} onChange={set("gov")}><option value="">اختر المحافظة</option>{GOV.map((g) => <option key={g}>{g}</option>)}</select><E k="gov" /></Field>
        <Field label="المدينة / القضاء"><input className="f" value={f.city} onChange={set("city")} /><E k="city" /></Field>
        <Field label="العنوان التفصيلي"><textarea className="f" rows="2" placeholder="المنطقة، الحي، أقرب نقطة دالة" value={f.address} onChange={set("address")} /><E k="address" /></Field>
        <Field label="ملاحظات (اختياري)"><textarea className="f" rows="2" value={f.notes} onChange={set("notes")} /></Field>
        <div className="row" style={{ marginTop: 14 }}>💵 <b>الدفع عند الاستلام (COD)</b></div>
        <Summary t={t} /><E k="cart" />
        <button className="btn o full" disabled={busy} onClick={submit}>{busy ? "جارٍ إرسال الطلب..." : "تأكيد الطلب"}</button>
      </div>
    </Overlay>
  );
}
