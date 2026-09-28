import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, where } from "firebase/firestore";
import { auth, db, configured, initError, WHATSAPP } from "./firebase.js";
import { useCol } from "./lib/data.js";
import { isStaff } from "./lib/util.js";
import { toast, Load } from "./ui.jsx";
import Home, { ProductDetail } from "./pages/Home.jsx";
import { Cart, Checkout } from "./pages/Cart.jsx";
import { Orders } from "./pages/Orders.jsx";
import Account from "./pages/Account.jsx";
import Admin from "./pages/Admin.jsx";
import Courier from "./pages/Courier.jsx";

function Setup() {
  return (
    <div className="setup">
      <h2>⚙️ إعداد Firebase مطلوب</h2>
      <p>انسخ <code>.env.example</code> إلى <code>.env</code> وضع مفاتيح مشروعك من Firebase Console، ثم أعد تشغيل <code>npm run dev</code>. الخطوات الكاملة في README.md.</p>
    </div>
  );
}

// يظهر فقط إذا كانت مفاتيح Firebase موجودة لكن التهيئة فشلت فعلياً (مثال: قيمة غير صحيحة) —
// حتى لا يتحول أي خطأ من Firebase إلى شاشة بيضاء صامتة بلا أي رسالة.
function FirebaseFailed() {
  return (
    <div className="setup">
      <h2>⚠️ تعذّر الاتصال بـFirebase</h2>
      <p>تحقّق من صحة قيم <code>VITE_FIREBASE_*</code> في ملف <code>.env</code> أو GitHub Secrets، ثم أعد المحاولة.</p>
      {initError && <p style={{ direction: "ltr", fontSize: 11.5, color: "var(--muted)" }}>{initError}</p>}
      <button className="btn o full" onClick={() => location.reload()}>إعادة المحاولة</button>
    </div>
  );
}

export default function App() {
  if (!configured) return <div className="app"><Setup /></div>;
  if (initError) return <div className="app"><FirebaseFailed /></div>;
  return <Main />;
}

function Main() {
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [detail, setDetail] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [panel, setPanel] = useState(null); // admin | courier
  const [msg, setMsg] = useState(null);
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem("gh_cart") || "{}"); } catch { return {}; } });
  const [favs, setFavs] = useState([]);

  useEffect(() => {
    // شبكة أمان ضد تعليق Firebase Auth (مشكلة موثّقة داخل WebView الخاص بـCapacitor):
    // إن لم يُستدعَ onAuthStateChanged خلال 6 ثوانٍ نُكمل كزائر بدل بقاء التطبيق عالقاً بلا واجهة.
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; setUser(null); } }, 6000);
    const unsub = onAuthStateChanged(
      auth,
      (u) => { done = true; clearTimeout(timer); setUser(u); },
      (err) => { console.error("Auth error:", err); done = true; clearTimeout(timer); setUser(null); }
    );
    return () => { clearTimeout(timer); unsub(); };
  }, []);
  useEffect(() => {
    if (!user) { setProfile(null); return; }
    return onSnapshot(doc(db, "users", user.uid), (s) => setProfile(s.exists() ? s.data() : null));
  }, [user?.uid]);
  useEffect(() => { try { localStorage.setItem("gh_cart", JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => {
    const h = (e) => { setMsg(e.detail); setTimeout(() => setMsg(null), 2800); };
    window.addEventListener("toast", h); return () => window.removeEventListener("toast", h);
  }, []);

  const cats = useCol("categories");
  const prods = useCol("products");
  const banners = useCol("banners");
  const { rows: favRows } = useCol("favorites", user?.uid || "x", user ? [where("uid", "==", user.uid)] : [], !!user);
  useEffect(() => setFavs(favRows.map((f) => f.productId)), [JSON.stringify(favRows.map((f) => f.productId))]);

  useEffect(() => {
    const m = location.hash.match(/p=([\w-]+)/);
    if (m && prods.rows.length) { const p = prods.rows.find((x) => x.id === m[1]); if (p) setDetail(p); }
  }, [prods.rows.length]);

  const role = profile?.role || "CUSTOMER";
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const add = (id, n = 1) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + n }));
  const setQty = (id, n) => setCart((c) => { const x = { ...c }; n <= 0 ? delete x[id] : (x[id] = n); return x; });
  const buyNow = (id, n = 1) => { add(id, n); setDetail(null); setCheckout(true); };

  const ctx = { user, profile, role, cats: cats.rows, prods: prods.rows, cart, add, setQty, buyNow, favs, setTab };

  return (
    <div className="app">
      {msg && <div className={"toast " + (msg.t === "err" ? "err" : "")}>{msg.m}</div>}
      <header className="top">
        <div className="brand">
          <div className="logo">غ</div>
          <h1>الغدير للأجهزة المنزلية والأثاث المنزلي<small>توصيل لجميع محافظات العراق</small></h1>
          <a className="ib" href={`tel:+${WHATSAPP}`} aria-label="اتصال">📞</a>
        </div>
        <div className="search"><span>🔍</span><input value={q} onChange={(e) => { setQ(e.target.value); setTab("home"); }} placeholder="ابحث بالاسم أو الوصف أو SKU أو القسم" /></div>
      </header>

      {tab === "home" && (cats.loading || prods.loading ? <Load /> :
        <Home {...ctx} banners={banners.rows} q={q.trim()} cat={cat} setCat={setCat} open={setDetail} />)}
      {tab === "cats" && <Home {...ctx} banners={[]} q="" cat={cat} setCat={setCat} open={setDetail} catsOnly />}
      {tab === "cart" && <Cart {...ctx} goCheckout={() => setCheckout(true)} />}
      {tab === "orders" && <Orders user={user} setTab={setTab} />}
      {tab === "account" && <Account {...ctx} auth={auth} favProducts={prods.rows.filter((p) => favs.includes(p.id))} open={setDetail} openPanel={setPanel} />}

      {detail && <ProductDetail {...ctx} p={detail} onClose={() => { setDetail(null); history.replaceState(null, "", location.pathname); }} open={setDetail} />}
      {checkout && <Checkout {...ctx} onClose={() => setCheckout(false)} onDone={() => { setCart({}); setCheckout(false); setTab("orders"); }} />}
      {panel === "admin" && isStaff(role) && <Admin {...ctx} onClose={() => setPanel(null)} />}
      {panel === "courier" && role === "COURIER" && <Courier user={user} onClose={() => setPanel(null)} />}

      <a className="fab" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener" aria-label="واتساب">💬</a>
      <nav className="bar">
        {[["home", "🏠", "الرئيسية"], ["cats", "▦", "الأقسام"], ["cart", "🛒", "السلة"], ["orders", "📦", "طلباتي"], ["account", "👤", "حسابي"]].map(([k, i, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => { if (k === "cats") setCat("all"); setTab(k); }}>
            <em>{i}</em>{l}{k === "cart" && count > 0 && <i className="bd">{count}</i>}
          </button>
        ))}
      </nav>
    </div>
  );
}
