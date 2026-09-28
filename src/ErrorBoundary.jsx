import React from "react";

const Screen = ({ title, text, onRetry }) => (
  <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "Cairo, Tahoma, sans-serif", background: "#F5F6F8", color: "#14213A", textAlign: "center" }}>
    <div>
      <div style={{ fontSize: 44, marginBottom: 10 }}>⚠️</div>
      <h2 style={{ margin: "0 0 8px", fontSize: 17 }}>{title}</h2>
      <p style={{ fontSize: 13, color: "#6B7686", lineHeight: 1.8, maxWidth: 320, margin: "0 auto 16px" }}>{text}</p>
      <button onClick={onRetry} style={{ background: "#F28C28", color: "#fff", border: 0, borderRadius: 10, padding: "11px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
        إعادة تحميل التطبيق
      </button>
    </div>
  </div>
);

// شبكة أمان: يمنع أي خطأ تشغيلي في أي مكوّن من تحويل الواجهة إلى شاشة بيضاء فارغة،
// ويعرض رسالة عربية واضحة بدلاً من ذلك.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("React render error:", error, info?.componentStack); }
  render() {
    if (this.state.error) {
      return <Screen title="حدث خطأ غير متوقع" text="تعذّر عرض هذه الشاشة. جرّب إعادة تحميل التطبيق، وإذا تكررت المشكلة تواصل مع الدعم الفني." onRetry={() => location.reload()} />;
    }
    return this.props.children;
  }
}
export { Screen };
