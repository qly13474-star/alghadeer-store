import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase.js";

// اشتراك مباشر: أي تعديل من الإدارة يظهر فوراً على كل الأجهزة. key يحدد متى يُعاد الاشتراك، و enabled=false يوقفه.
export function useCol(name, key = "", constraints = [], enabled = true) {
  const [rows, setRows] = useState(null), [error, setError] = useState(null);
  useEffect(() => {
    if (!db || !enabled) { setRows(enabled ? null : []); return; }
    return onSnapshot(query(collection(db, name), ...constraints),
      (s) => { setError(null); setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }))); }, setError);
  }, [name, key, enabled]);
  return { rows: rows || [], error, loading: enabled && rows === null && !error };
}
export { orderBy, where };
