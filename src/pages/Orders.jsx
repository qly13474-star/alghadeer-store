import React from "react";
import { useCol, where } from "../lib/data.js";
import { fmt, STATUS } from "../lib/util.js";
import { Empty, Load, Img } from "../ui.jsx";

export const when = (t) => t?.toDate ? t.toDate().toLocaleString("ar-IQ") : "";
const FLOW = ["NEW", "CONFIRMED", "PREPARING", "READY", "ASSIGNED_TO_COURIER", "OUT_FOR_DELIVERY", "DELIVERED"];

export function OrderCard({ o, children }) {
  const step = FLOW.indexOf(o.status);
  return (
    <div className="row" style={{ display: "block" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <b>#{o.id.slice(0, 6).toUpperCase()}</b>
        <span className={"pill " + (o.status === "DELIVERED" ? "ok" : o.status === "CANCELLED" ? "bad" : "")}>{STATUS[o.status]}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", margin: "3px 0 8px" }}>{when(o.createdAt)}</div>
      {o.items.map((i, k) => <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, padding: "3px 0" }}><div className="t" style={{ width: 34, height: 34, fontSize: 16, borderRadius: 8 }}><Img src={i.image} emoji={i.emoji} /></div><span style={{ flex: 1 }}>{i.name} × {i.qty}</span><span>{fmt(i.price * i.qty)}</span></div>)}
      {o.status !== "CANCELLED" && <div style={{ display: "flex", gap: 3, margin: "8px 0" }}>{FLOW.map((s, k) => <i key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: k <= step ? "var(--orange)" : "var(--line)" }} />)}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 13 }}><span>الإجمالي (دفع عند الاستلام)</span><span style={{ color: "var(--orange)" }}>{fmt(o.total)}</span></div>
      {children}
    </div>
  );
}

export function Orders({ user, setTab }) {
  const { rows, loading, error } = useCol("orders", user?.uid || "", user ? [where("uid", "==", user.uid)] : [], !!user);
  if (!user) return <><Empty icon="🔐" text="سجّل الدخول لعرض طلباتك" /><div className="pad"><button className="btn o full" onClick={() => setTab("account")}>تسجيل الدخول</button></div></>;
  if (loading) return <Load />;
  if (error) return <Empty icon="⚠️" text="تعذّر تحميل الطلبات" />;
  if (!rows.length) return <Empty icon="📦" text="لا توجد طلبات بعد" />;
  return <div className="pad" style={{ paddingTop: 14 }}>{[...rows].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((o) => <OrderCard key={o.id} o={o} />)}</div>;
}
