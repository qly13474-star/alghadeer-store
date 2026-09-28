import React, { useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { useCol, where } from "../lib/data.js";
import { Empty, Overlay, toast } from "../ui.jsx";
import { OrderCard } from "./Orders.jsx";

const NEXT = { ASSIGNED_TO_COURIER: ["OUT_FOR_DELIVERY", "🚚 استلمت الطلب وخرجت للتوصيل"], OUT_FOR_DELIVERY: ["DELIVERED", "✅ تم التسليم"] };

export default function Courier({ user, onClose }) {
  const { rows } = useCol("orders", user.uid, [where("courierId", "==", user.uid)]);
  const [notes, setNotes] = useState({});
  const act = async (o, status) => {
    try { await updateDoc(doc(db, "orders", o.id), { status, courierNote: notes[o.id] ?? o.courierNote ?? "", updatedAt: serverTimestamp() }); toast("تم التحديث"); }
    catch { toast("تعذّر التحديث", "err"); }
  };
  const list = rows.filter((o) => o.status !== "CANCELLED").sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return (
    <Overlay title="🛵 طلباتي كمندوب" onClose={onClose}>
      <div className="pad" style={{ paddingTop: 12 }}>
        {!list.length && <Empty icon="🛵" text="لا توجد طلبات مسندة إليك" />}
        {list.map((o) => (
          <OrderCard key={o.id} o={o}>
            <div style={{ fontSize: 12.5, marginTop: 8, lineHeight: 1.9 }}>👤 {o.customer.name}<br />📍 {o.customer.gov} - {o.customer.city} - {o.customer.address}{o.customer.notes && <><br />📝 {o.customer.notes}</>}</div>
            <a className="btn g full" href={`tel:${o.customer.phone}`}>📞 الاتصال بالعميل ({o.customer.phone})</a>
            {NEXT[o.status] && <>
              <input className="f" style={{ marginTop: 8 }} placeholder="ملاحظة (اختياري)" value={notes[o.id] ?? o.courierNote ?? ""} onChange={(e) => setNotes({ ...notes, [o.id]: e.target.value })} />
              <button className="btn o full" onClick={() => act(o, NEXT[o.status][0])}>{NEXT[o.status][1]}</button>
            </>}
          </OrderCard>
        ))}
      </div>
    </Overlay>
  );
}
