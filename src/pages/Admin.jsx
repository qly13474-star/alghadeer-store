import React, { useState } from "react";
import { addDoc, collection, deleteDoc, doc, increment, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase.js";
import { useCol } from "../lib/data.js";
import { filestackConfigured, prepareImage, uploadImage, imgMsg } from "../lib/filestack.js";
import { fmt, STATUS, STOCK, discountPct, imgUrl } from "../lib/util.js";
import { Empty, Field, Img, Overlay, toast } from "../ui.jsx";
import { OrderCard } from "./Orders.jsx";
import { SEED_CATEGORIES, SEED_PRODUCTS } from "../data_seed.js";

const num = (v) => (v === "" || v == null ? 0 : Number(v));

const asImg = (x) => (typeof x === "string" ? { url: x, handle: "" } : x);

// اختيار صور → ضغط + معاينة → زر «رفع» → Filestack → حفظ url و handle في Firestore
function ImagePicker({ images, setImages, single, folder }) {
  const [staged, setStaged] = useState([]), [busy, setBusy] = useState(false);
  const list = images.map(asImg);
  const max = single ? 1 : 8;
  const patch = (id, o) => setStaged((a) => a.map((x) => (x.id === id ? { ...x, ...o } : x)));
  const drop = (id) => setStaged((a) => { a.filter((x) => x.id === id).forEach((x) => URL.revokeObjectURL(x.previewUrl)); return a.filter((x) => x.id !== id); });

  async function pick(e) {
    let files = [...e.target.files]; e.target.value = "";
    if (!files.length) return; // أُغلقت نافذة الاختيار بدون ملفات
    if (single) { staged.forEach((x) => URL.revokeObjectURL(x.previewUrl)); setStaged([]); files = files.slice(0, 1); }
    else files = files.slice(0, Math.max(0, max - list.length - staged.length));
    if (!files.length) return toast(`الحد الأقصى ${max} صور`, "err");
    for (const f of files) {
      try {
        const r = await prepareImage(f, folder);
        setStaged((a) => [...(single ? [] : a), { id: Math.random().toString(36).slice(2), ...r, progress: 0, status: "ready" }]);
      } catch (err) { toast(`${f.name}: ${imgMsg(err.message)}`, "err"); }
    }
  }

  async function uploadAll() {
    if (busy) return;
    setBusy(true);
    const done = [];
    for (const s of staged) {
      patch(s.id, { status: "uploading", progress: 0, error: "" });
      try {
        const r = await uploadImage(s.blob, folder, (p) => patch(s.id, { progress: p }));
        done.push({ id: s.id, r });
      } catch (err) { patch(s.id, { status: "error", error: imgMsg(err.message) }); toast(imgMsg(err.message), "err"); }
    }
    if (done.length) {
      setImages(single ? [done[done.length - 1].r] : [...list, ...done.map((d) => d.r)]);
      done.forEach((d) => drop(d.id));
      toast(`تم رفع ${done.length} صورة`);
    }
    setBusy(false);
  }

  return (
    <div>
      {!filestackConfigured && <div className="err" style={{ marginBottom: 6 }}>⚠️ رفع الصور غير مُهيأ بعد. أضف VITE_FILESTACK_API_KEY في ملف .env (راجع README).</div>}
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple={!single} onChange={pick} disabled={busy || !filestackConfigured} />
      <div className="imgs">
        {list.map((im, k) => (
          <div key={im.url} className={k === 0 ? "main" : ""}>
            <img src={im.url} alt="" onClick={() => !single && setImages([im, ...list.filter((x) => x.url !== im.url)])} />
            <button onClick={() => setImages(list.filter((x) => x.url !== im.url))}>×</button>
          </div>
        ))}
        {staged.map((s) => (
          <div key={s.id}>
            <img src={s.previewUrl} alt="" style={{ opacity: s.status === "uploading" ? 0.45 : 1, borderColor: s.status === "error" ? "var(--red)" : undefined }} />
            <span style={{ position: "absolute", bottom: 3, right: 3, left: 3, textAlign: "center", fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(11,31,58,.75)", borderRadius: 6 }}>
              {s.status === "uploading" ? `${s.progress}%` : s.status === "error" ? "فشل" : `${Math.round(s.size / 1024)}KB`}
            </span>
            {!busy && <button onClick={() => drop(s.id)}>×</button>}
          </div>
        ))}
      </div>
      {staged.length > 0 && (
        <>
          <button className="btn n" style={{ marginTop: 8 }} disabled={busy} onClick={uploadAll}>{busy ? "جارٍ الرفع..." : `رفع ${staged.length} صورة`}</button>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>هذه معاينة الصور بعد الضغط. اضغط «رفع» قبل حفظ النموذج.</div>
        </>
      )}
      {!single && list.length > 1 && <small style={{ color: "var(--muted)" }}>اضغط على أي صورة لتصبح الرئيسية (الأولى بإطار برتقالي)</small>}
    </div>
  );
}

function ProductForm({ p, cats, onClose }) {
  const [f, setF] = useState({ name: "", short: "", desc: "", price: "", oldPrice: "", categoryId: cats[0]?.id || "", stock: 10, status: "available", bestSeller: false, isNew: false, offer: false, specs: "", weight: "", color: "", sizes: "", sku: "", images: [], emoji: "", ...p });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  async function save() {
    if (busy) return;
    if (f.name.trim().length < 2 || num(f.price) <= 0 || !f.categoryId) return toast("أدخل الاسم والسعر واختر القسم", "err");
    if (num(f.oldPrice) && num(f.oldPrice) < num(f.price)) return toast("السعر القديم يجب أن يكون أكبر من السعر الحالي", "err");
    setBusy(true);
    const data = { ...f, price: num(f.price), oldPrice: num(f.oldPrice), stock: num(f.stock), name: f.name.trim(), sku: f.sku.trim() || "GH-" + Date.now().toString(36).toUpperCase() };
    delete data.id;
    try {
      if (p?.id) await updateDoc(doc(db, "products", p.id), data);
      else await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      toast("تم حفظ المنتج"); onClose();
    } catch (e) { console.error(e); toast("تعذّر الحفظ (تحقق من صلاحياتك)", "err"); setBusy(false); }
  }
  return (
    <Overlay title={p?.id ? "تعديل منتج" : "إضافة منتج"} onClose={onClose}>
      <div className="pad">
        <Field label="اسم المنتج"><input className="f" value={f.name} onChange={set("name")} /></Field>
        <Field label="وصف مختصر"><input className="f" value={f.short} onChange={set("short")} /></Field>
        <Field label="الوصف الكامل"><textarea className="f" rows="3" value={f.desc} onChange={set("desc")} /></Field>
        <Field label="القسم"><select className="f" value={f.categoryId} onChange={set("categoryId")}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="السعر (د.ع)"><input className="f" inputMode="numeric" value={f.price} onChange={set("price")} /></Field>
        <Field label="السعر القديم (اختياري)"><input className="f" inputMode="numeric" value={f.oldPrice} onChange={set("oldPrice")} /></Field>
        {num(f.oldPrice) > num(f.price) && <div className="pill ok" style={{ marginTop: 6 }}>نسبة الخصم: {discountPct({ price: num(f.price), oldPrice: num(f.oldPrice) })}%</div>}
        <Field label="المخزون"><input className="f" inputMode="numeric" value={f.stock} onChange={set("stock")} /></Field>
        <Field label="الحالة"><select className="f" value={f.status} onChange={set("status")}>{Object.entries(STOCK).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        <div className="chk">
          <label><input type="checkbox" checked={!!f.bestSeller} onChange={set("bestSeller")} />الأكثر مبيعاً</label>
          <label><input type="checkbox" checked={!!f.isNew} onChange={set("isNew")} />جديد</label>
          <label><input type="checkbox" checked={!!f.offer} onChange={set("offer")} />عرض خاص</label>
        </div>
        <Field label="المواصفات (سطر لكل مواصفة)"><textarea className="f" rows="3" value={f.specs} onChange={set("specs")} /></Field>
        <Field label="اللون"><input className="f" value={f.color} onChange={set("color")} /></Field>
        <Field label="المقاسات"><input className="f" value={f.sizes} onChange={set("sizes")} /></Field>
        <Field label="الوزن"><input className="f" value={f.weight} onChange={set("weight")} /></Field>
        <Field label="رقم المنتج SKU (يُولَّد تلقائياً إن تُرك فارغاً)"><input className="f" dir="ltr" value={f.sku} onChange={set("sku")} /></Field>
        <Field label="صور المنتج (من الهاتف أو التابلت)" group><ImagePicker images={f.images || []} setImages={(images) => setF((x) => ({ ...x, images }))} folder="products" /></Field>
        <button className="btn o full" disabled={busy} onClick={save}>{busy ? "جارٍ الحفظ..." : "حفظ المنتج"}</button>
      </div>
    </Overlay>
  );
}

function CatForm({ c, orderNext, onClose }) {
  const [f, setF] = useState({ name: "", emoji: "", image: "", imageHandle: "", hidden: false, order: orderNext, ...c }), [busy, setBusy] = useState(false);
  async function save() {
    if (busy || f.name.trim().length < 2) return toast("أدخل اسم القسم", "err");
    setBusy(true);
    const data = { name: f.name.trim(), emoji: f.emoji, image: f.image || "", imageHandle: f.imageHandle || "", hidden: !!f.hidden, order: num(f.order) };
    try { c?.id ? await updateDoc(doc(db, "categories", c.id), data) : await addDoc(collection(db, "categories"), data); toast("تم حفظ القسم"); onClose(); }
    catch { toast("تعذّر الحفظ", "err"); setBusy(false); }
  }
  return (
    <Overlay title={c?.id ? "تعديل قسم" : "إضافة قسم"} onClose={onClose}>
      <div className="pad">
        <Field label="اسم القسم"><input className="f" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="أيقونة تعبيرية (تظهر إن لم توجد صورة)"><input className="f" value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} /></Field>
        <Field label="صورة القسم" group><ImagePicker single images={f.image ? [{ url: f.image, handle: f.imageHandle || "" }] : []} setImages={(a) => setF((x) => ({ ...x, image: a[0]?.url || "", imageHandle: a[0]?.handle || "" }))} folder="categories" /></Field>
        <div className="chk"><label><input type="checkbox" checked={f.hidden} onChange={(e) => setF({ ...f, hidden: e.target.checked })} />إخفاء القسم عن الزبائن</label></div>
        <button className="btn o full" disabled={busy} onClick={save}>حفظ القسم</button>
      </div>
    </Overlay>
  );
}

function BannerForm({ b, onClose }) {
  const [f, setF] = useState({ title: "", subtitle: "", image: "", imageHandle: "", active: true, order: 1, ...b });
  async function save() {
    if (f.title.trim().length < 2) return toast("أدخل عنوان العرض", "err");
    const data = { title: f.title.trim(), subtitle: f.subtitle, image: f.image || "", imageHandle: f.imageHandle || "", active: !!f.active, order: num(f.order) };
    try { b?.id ? await updateDoc(doc(db, "banners", b.id), data) : await addDoc(collection(db, "banners"), data); toast("تم الحفظ"); onClose(); } catch { toast("تعذّر الحفظ", "err"); }
  }
  return (
    <Overlay title="بانر / عرض" onClose={onClose}>
      <div className="pad">
        <Field label="العنوان"><input className="f" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="نص فرعي"><input className="f" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></Field>
        <Field label="الترتيب"><input className="f" inputMode="numeric" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} /></Field>
        <Field label="الصورة" group><ImagePicker single images={f.image ? [{ url: f.image, handle: f.imageHandle || "" }] : []} setImages={(a) => setF((x) => ({ ...x, image: a[0]?.url || "", imageHandle: a[0]?.handle || "" }))} folder="banners" /></Field>
        <div className="chk"><label><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />مفعّل</label></div>
        <button className="btn o full" onClick={save}>حفظ</button>
      </div>
    </Overlay>
  );
}

async function setStatus(o, status, extra = {}) {
  try {
    const b = writeBatch(db);
    b.update(doc(db, "orders", o.id), { status, updatedAt: serverTimestamp(), ...extra });
    // خصم المخزون مرة واحدة عند تأكيد الطلب الجديد
    if (o.status === "NEW" && status === "CONFIRMED") o.items.forEach((i) => b.update(doc(db, "products", i.id), { stock: increment(-i.qty) }));
    await b.commit(); toast("تم تحديث الطلب");
  } catch (e) { console.error(e); toast("تعذّر التحديث", "err"); }
}

export default function Admin({ onClose, role, cats, prods }) {
  const [tab, setTab] = useState("dash"), [form, setForm] = useState(null), [os, setOs] = useState("ALL");
  const orders = useCol("orders").rows.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  const users = useCol("users").rows;
  const banners = useCol("banners").rows.sort((a, b) => (a.order || 0) - (b.order || 0));
  const couriers = users.filter((u) => u.role === "COURIER");
  const sorted = [...cats].sort((a, b) => (a.order || 0) - (b.order || 0));
  const cnt = (s) => orders.filter((o) => o.status === s).length;
  const sales = orders.filter((o) => o.status === "DELIVERED").reduce((a, o) => a + o.total, 0);

  async function seed() {
    if (!confirm("تحميل 7 أقسام و15 منتجاً تجريبياً؟")) return;
    try {
      const b = writeBatch(db), ids = SEED_CATEGORIES.map((c) => { const r = doc(collection(db, "categories")); b.set(r, { ...c, image: "", hidden: false }); return r.id; });
      SEED_PRODUCTS.forEach((p, i) => { const { cat, ...rest } = p; b.set(doc(collection(db, "products")), { ...rest, categoryId: ids[cat], sku: "GH-" + String(1000 + i), createdAt: serverTimestamp() }); });
      b.set(doc(collection(db, "banners")), { title: "عروض الديوانيات", subtitle: "أناقة الجلسة العربية بأسعار الغدير", image: "", active: true, order: 1 });
      b.set(doc(db, "settings", "main"), { deliveryFee: 5000, freeDeliveryFrom: 0 });
      await b.commit(); toast("تم تحميل البيانات التجريبية");
    } catch (e) { console.error(e); toast("فشل التحميل (هل حسابك ADMIN؟)", "err"); }
  }
  async function move(c, dir) { const i = sorted.findIndex((x) => x.id === c.id), o = sorted[i + dir]; if (!o) return; const b = writeBatch(db); b.update(doc(db, "categories", c.id), { order: o.order ?? i + dir }); b.update(doc(db, "categories", o.id), { order: c.order ?? i }); await b.commit(); }
  async function del(col, x) { if (!confirm("حذف نهائي؟")) return; try { await deleteDoc(doc(db, col, x.id)); toast("تم الحذف"); } catch { toast("تعذّر الحذف", "err"); } }

  if (form?.type === "product") return <ProductForm p={form.item} cats={sorted} onClose={() => setForm(null)} />;
  if (form?.type === "cat") return <CatForm c={form.item} orderNext={sorted.length + 1} onClose={() => setForm(null)} />;
  if (form?.type === "banner") return <BannerForm b={form.item} onClose={() => setForm(null)} />;

  return (
    <Overlay title="🛠️ لوحة الإدارة" onClose={onClose}>
      <div className="tabs">{[["dash", "الرئيسية"], ["orders", "الطلبات"], ["products", "المنتجات"], ["cats", "الأقسام"], ["banners", "البانرات"], ["users", "المستخدمون"]].map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}</button>)}</div>

      {tab === "dash" && <>
        <div className="stats">{[["إجمالي الطلبات", orders.length], ["طلبات جديدة", cnt("NEW")], ["قيد التجهيز", cnt("PREPARING")], ["قيد التوصيل", cnt("OUT_FOR_DELIVERY")], ["مكتملة", cnt("DELIVERED")], ["إجمالي المبيعات", fmt(sales)], ["المنتجات", prods.length], ["الأقسام", cats.length], ["العملاء", users.filter((u) => u.role === "CUSTOMER").length], ["المندوبون", couriers.length]].map(([l, v]) => <div className="stat" key={l}><b>{v}</b><span>{l}</span></div>)}</div>
        <div className="pad"><button className="btn l full" onClick={seed}>تحميل البيانات التجريبية</button></div>
      </>}

      {tab === "orders" && <div className="pad">
        <div className="tabs" style={{ padding: "0 0 8px" }}>{["ALL", ...Object.keys(STATUS)].map((s) => <button key={s} className={os === s ? "on" : ""} onClick={() => setOs(s)}>{s === "ALL" ? "الكل" : STATUS[s]}</button>)}</div>
        {orders.filter((o) => os === "ALL" || o.status === os).map((o) => (
          <OrderCard key={o.id} o={o}>
            <div style={{ fontSize: 12, marginTop: 8, lineHeight: 1.8 }}>👤 {o.customer.name} · <a href={`tel:${o.customer.phone}`}>{o.customer.phone}</a><br />📍 {o.customer.gov} - {o.customer.city} - {o.customer.address}{o.customer.notes && <><br />📝 {o.customer.notes}</>}{o.courierNote && <><br />🛵 {o.courierNote}</>}</div>
            <select className="f" style={{ marginTop: 8 }} value={o.status} onChange={(e) => setStatus(o, e.target.value)}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className="f" style={{ marginTop: 6 }} value={o.courierId || ""} onChange={(e) => e.target.value && setStatus(o, "ASSIGNED_TO_COURIER", { courierId: e.target.value, courierName: couriers.find((c) => c.id === e.target.value)?.name || "" })}>
              <option value="">{o.courierName ? `المندوب: ${o.courierName}` : "إسناد إلى مندوب"}</option>{couriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </OrderCard>
        ))}
        {!orders.length && <Empty icon="📦" text="لا توجد طلبات" />}
      </div>}

      {tab === "products" && <div className="pad"><button className="btn o full" style={{ marginTop: 0 }} onClick={() => setForm({ type: "product" })} disabled={!sorted.length}>+ إضافة منتج {!sorted.length && "(أضف قسماً أولاً)"}</button>
        {prods.map((p) => <div className="row" key={p.id} style={{ marginTop: 10 }}><div className="t"><Img src={imgUrl(p.images?.[0])} emoji={p.emoji} /></div><div className="i"><h4>{p.name}</h4><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{fmt(p.price)} · مخزون {p.stock} · {STOCK[p.status]}</div><div className="acts"><button className="btn l" onClick={() => setForm({ type: "product", item: p })}>تعديل</button><button className="btn r" onClick={() => del("products", p)}>حذف</button></div></div></div>)}</div>}

      {tab === "cats" && <div className="pad"><button className="btn o full" style={{ marginTop: 0 }} onClick={() => setForm({ type: "cat" })}>+ إضافة قسم</button>
        {sorted.map((c) => <div className="row" key={c.id} style={{ marginTop: 10 }}><div className="t"><Img src={c.image} emoji={c.emoji} /></div><div className="i"><h4>{c.name} {c.hidden && <span className="pill">مخفي</span>}</h4><div className="acts" style={{ gridTemplateColumns: "repeat(4,1fr)" }}><button className="btn l" onClick={() => move(c, -1)}>▲</button><button className="btn l" onClick={() => move(c, 1)}>▼</button><button className="btn l" onClick={() => setForm({ type: "cat", item: c })}>تعديل</button><button className="btn r" onClick={() => del("categories", c)}>حذف</button></div></div></div>)}</div>}

      {tab === "banners" && <div className="pad"><button className="btn o full" style={{ marginTop: 0 }} onClick={() => setForm({ type: "banner" })}>+ إضافة بانر</button>
        {banners.map((b) => <div className="row" key={b.id} style={{ marginTop: 10 }}><div className="t"><Img src={b.image} emoji="🎯" /></div><div className="i"><h4>{b.title} {!b.active && <span className="pill">متوقف</span>}</h4><div className="acts"><button className="btn l" onClick={() => setForm({ type: "banner", item: b })}>تعديل</button><button className="btn r" onClick={() => del("banners", b)}>حذف</button></div></div></div>)}</div>}

      {tab === "users" && <div className="pad">{users.map((u) => <div className="row" key={u.id}><div className="i"><h4>{u.name}</h4><div style={{ fontSize: 11.5, color: "var(--muted)" }}>{u.phone}</div></div>
        <select className="f" style={{ width: 120 }} disabled={role !== "ADMIN"} value={u.role} onChange={(e) => updateDoc(doc(db, "users", u.id), { role: e.target.value }).then(() => toast("تم تغيير الدور")).catch(() => toast("تعذّر", "err"))}>{["CUSTOMER", "COURIER", "MANAGER", "ADMIN"].map((r) => <option key={r}>{r}</option>)}</select></div>)}
        {role !== "ADMIN" && <small>تغيير الأدوار للمدير (ADMIN) فقط</small>}</div>}
    </Overlay>
  );
}
