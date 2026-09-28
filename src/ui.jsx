import React from "react";
export const toast = (m, t = "ok") => window.dispatchEvent(new CustomEvent("toast", { detail: { m, t } }));
export const Img = ({ src, emoji }) => (src ? <img src={src} alt="" loading="lazy" /> : <span>{emoji || "📦"}</span>);
export const Load = () => <div className="skel-wrap">{[1, 2, 3, 4].map((i) => <div key={i} className="skel" />)}</div>;
export const Empty = ({ icon = "🔎", text }) => <div className="empty"><big>{icon}</big>{text}</div>;
// group=true: لا نستعمل <label> حتى لا يفتح النقر على الصور/الأزرار نافذة اختيار الملفات
export const Field = ({ label, children, group }) => (group ? <div className="fld"><span>{label}</span>{children}</div> : <label className="fld">{label}{children}</label>);
export const Overlay = ({ title, onClose, children }) => (
  <div className="ov"><div className="hd"><button className="ib" style={{ background: "var(--tile)", color: "var(--text)" }} onClick={onClose}>→</button><h2>{title}</h2></div>{children}</div>
);
