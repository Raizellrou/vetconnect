import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase/firebase";

export const useCollection = (path, constraints = [], orderConstraints = []) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!path) {
      setDocs([]);
      setLoading(false);
      return;
    }
    const parts = path.split("/").filter(Boolean);
    const ref = collection(db, ...parts);

    // Combine constraints and order constraints
    const allConstraints = [...constraints, ...orderConstraints];
    const q = allConstraints.length > 0 ? query(ref, ...allConstraints) : ref;

    const unsub = onSnapshot(
      q,
      (snap) => {
        setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, JSON.stringify(constraints), JSON.stringify(orderConstraints)]);

  return { docs, loading, error };
};
