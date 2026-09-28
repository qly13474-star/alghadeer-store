import React, { useState } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { fmt, discountPct, STOCK, imgUrl } from "../lib/util.js";
import { Img, Empty, toast, Overlay } from "../ui.jsx";

const canBuy = (p) => p.status === "available" && Number(p.stock) > 0;

export async function toggleFav(user, favs, pid, setTab) {
  if (!user) { toast("سجّل الدخول لاستخدام المفضلة", "err"); setTab("account"); return; }
  const r = doc(db, "favorites", `${user.uid}_${pid}`);
  try { favs.includes(pid) ? await deleteDoc(r) : await setDoc(r, { uid: user.uid, productId: pid }); }
  catch { toast("تعذّر تحديث المفضلة", "err"); }
}

export function ProductCard({ p, open, add, buyNow, favs, user, setTab }) {
  const d = discountPct(p), ok = canBuy(p);
  return (
    <div className="p">
      <div className="im" onClick={() => open(p)}>
        <Img src={imgUrl(p.images?.[0])} emoji={p.emoji} />
        {d > 0 ? <span className="tg">-{d}%</span> : p.isNew ? <span className="tg" style={{ background: "var(--blue)" }}>جديد</span> : null}
        <button className="hb" onClick={(e) => { e.stopPropagation(); toggleFav(user, favs, p.id, setTab); }}>{favs.includes(p.id) ? "❤️" : "🤍"}</button>
      </div>
      <div className="b">
        <h3>{p.name}</h3><p className="d">{p.short}</p>
        <div><span className="pr">{fmt(p.price)}</span>{p.oldPrice > p.price && <span className="old">{fmt(p.oldPrice)}</span>}</div>
        {ok ? (
          <div className="acts">
            <button className="btn l" onClick={() => { add(p.id); toast("أُضيف إلى السلة"); }}>أضف للسلة</button>
            <button className="btn o" onClick={() => buyNow(p.id)}>اشترِ الآن</button>
          </div>
        ) : <div className="acts"><span className="pill bad" style={{ gridColumn: "1/3", textAlign: "center" }}>{STOCK[p.status === "available" ? "out" : p.status]}</span></div>}
      </div>
    </div>
  );
}

const Row = ({ title, list, ...r }) => list.length ? (<><div className="sec"><h2>{title}</h2></div><div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} {...r} />)}</div></>) : null;

export default function Home(props) {
  const { cats, prods, banners, q, cat, setCat, catsOnly } = props;
  const [bi, setBi] = useState(0);
  React.useEffect(() => { if (banners.length > 1) { const t = setInterval(() => setBi((i) => i + 1), 4000); return () => clearInterval(t); } }, [banners.length]);
  const visCats = cats.filter((c) => !c.hidden).sort((a, b) => (a.order || 0) - (b.order || 0));
  const banner = banners.filter((b) => b.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
  const bn = banner[bi % Math.max(banner.length, 1)];
  const catName = (id) => cats.find((c) => c.id === id)?.name || "";
  const live = prods.filter((p) => !cats.find((c) => c.id === p.categoryId)?.hidden);
  let list = live;
  if (cat !== "all") list = list.filter((p) => p.categoryId === cat);
  if (q) { const s = q.toLowerCase(); list = live.filter((p) => [p.name, p.short, p.desc, p.sku, catName(p.categoryId)].some((v) => (v || "").toLowerCase().includes(s))); }
  const shared = { open: props.open, add: props.add, buyNow: props.buyNow, favs: props.favs, user: props.user, setTab: props.setTab };
  const filtered = cat !== "all" || q;

  return (
    <div>
      {!catsOnly && !q && bn && (
        <div className="banner">{bn.image && <img src={bn.image} alt="" />}<div><h3>{bn.title}</h3><p>{bn.subtitle}</p></div></div>
      )}
      {!catsOnly && !q && !bn && <div className="banner"><div><h3>أهلاً بك في الغدير</h3><p>أجهزة منزلية وأثاث وأخشاب مع خدمة التوصيل</p></div></div>}
      <div className="sec"><h2>الأقسام</h2>{cat !== "all" && <button onClick={() => setCat("all")}>عرض الكل</button>}</div>
      <div className={catsOnly ? "grid" : "hs"} style={catsOnly ? { gridTemplateColumns: "repeat(3,1fr)" } : null}>
        {visCats.map((c) => (
          <button key={c.id} className={"cat " + (cat === c.id ? "on" : "")} onClick={() => setCat(c.id)}>
            <div className="c"><Img src={c.image} emoji={c.emoji} /></div>{c.name}
          </button>
        ))}
      </div>
      {filtered || catsOnly ? (
        <>
          <div className="sec"><h2>{q ? `نتائج «${q}»` : catName(cat) || "كل المنتجات"}</h2><span>{list.length} منتج</span></div>
          {list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} {...shared} />)}</div> : <Empty text="لا توجد منتجات مطابقة" />}
        </>
      ) : (
        <>
          <Row title="🔥 الأكثر مبيعاً" list={live.filter((p) => p.bestSeller).slice(0, 6)} {...shared} />
          <Row title="✨ منتجات جديدة" list={live.filter((p) => p.isNew).slice(0, 6)} {...shared} />
          <Row title="🏷️ العروض والخصومات" list={live.filter((p) => p.offer || discountPct(p) > 0).slice(0, 6)} {...shared} />
          <Row title="مقترحة لك" list={[...live].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 6)} {...shared} />
          {!live.length && <Empty icon="🛍️" text="لا توجد منتجات بعد" />}
        </>
      )}
    </div>
  );
}

export function ProductDetail({ p, onClose, prods, add, buyNow, open, favs, user, setTab }) {
  const [i, setI] = useState(0), [n, setN] = useState(1);
  const ok = canBuy(p), d = discountPct(p), imgs = (p.images || []).map(imgUrl);
  const link = `${location.origin}${location.pathname}#p=${p.id}`;
  const text = encodeURIComponent(`${p.name} - ${fmt(p.price)}\n${link}`);
  const share = async () => { if (navigator.share) { try { await navigator.share({ title: p.name, url: link }); } catch {} } };
  const similar = prods.filter((x) => x.categoryId === p.categoryId && x.id !== p.id).slice(0, 4);
  return (
    <Overlay title={p.name} onClose={onClose}>
      <div className="gal"><Img src={imgs[i]} emoji={p.emoji} /></div>
      {imgs.length > 1 && <div className="thumbs">{imgs.map((u, k) => <img key={u} src={u} className={k === i ? "on" : ""} onClick={() => setI(k)} alt="" />)}</div>}
      <div className="pad" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 17 }}>{p.name}</h2>
        <div style={{ margin: "6px 0" }}>
          <span className="pr" style={{ fontSize: 19 }}>{fmt(p.price)}</span>
          {p.oldPrice > p.price && <><span className="old">{fmt(p.oldPrice)}</span><span className="pill ok" style={{ marginRight: 6 }}>وفّر {d}%</span></>}
        </div>
        <span className={"pill " + (ok ? "ok" : "bad")}>{ok ? STOCK.available : STOCK[p.status === "available" ? "out" : p.status]}</span>
        {p.sku && <span className="pill" style={{ marginRight: 6 }}>SKU: {p.sku}</span>}
        <p style={{ fontSize: 13, lineHeight: 1.9, marginTop: 10 }}>{p.desc}</p>
        {(p.specs || p.color || p.weight || p.sizes) && (
          <div className="row" style={{ display: "block", marginTop: 10, fontSize: 12.5, lineHeight: 2 }}>
            <b>المواصفات</b>
            {p.color && <div>اللون: {p.color}</div>}{p.weight && <div>الوزن: {p.weight}</div>}{p.sizes && <div>المقاسات: {p.sizes}</div>}
            {p.specs && p.specs.split("\n").filter(Boolean).map((l, k) => <div key={k}>• {l}</div>)}
          </div>
        )}
        {ok && (
          <>
            <div className="qty" style={{ margin: "12px 0" }}>
              <button onClick={() => setN(Math.max(1, n - 1))}>−</button><b>{n}</b><button onClick={() => setN(Math.min(Number(p.stock), n + 1))}>+</button>
              <span style={{ fontSize: 11.5, color: "var(--muted)" }}>الكمية</span>
            </div>
            <div className="acts">
              <button className="btn l" onClick={() => { add(p.id, n); toast("أُضيف إلى السلة"); }}>أضف للسلة</button>
              <button className="btn o" onClick={() => buyNow(p.id, n)}>شراء الآن</button>
            </div>
          </>
        )}
        <div className="acts" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          <button className="btn l" onClick={() => toggleFav(user, favs, p.id, setTab)}>{favs.includes(p.id) ? "❤️" : "🤍"}</button>
          <a className="btn g" target="_blank" rel="noopener" href={`https://wa.me/?text=${text}`}>WA</a>
          <a className="btn n" target="_blank" rel="noopener" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(p.name)}`}>TG</a>
          <a className="btn n" target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`}>FB</a>
          <button className="btn l" onClick={async () => { try { await navigator.clipboard.writeText(link); toast("تم نسخ الرابط"); } catch { share(); } }}>🔗</button>
        </div>
      </div>
      {similar.length > 0 && <><div className="sec"><h2>منتجات مشابهة</h2></div><div className="grid">{similar.map((x) => <ProductCard key={x.id} p={x} open={(z) => { setI(0); setN(1); open(z); }} add={add} buyNow={buyNow} favs={favs} user={user} setTab={setTab} />)}</div></>}
    </Overlay>
  );
}
