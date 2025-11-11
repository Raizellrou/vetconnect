import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function MedicalRecords({ userData, petId, onBack }) {
  const [records, setRecords] = useState([]);

  const fetchRecords = async () => {
    const recordsRef = collection(
      db,
      "users",
      userData.uid,
      "pets",
      petId,
      "medical_records"
    );
    const snapshot = await getDocs(recordsRef);
    setRecords(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchRecords();
  }, [petId]);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">Medical Records</h2>
      {records.length === 0 ? (
        <p>No medical records found.</p>
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="border p-3 rounded">
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-gray-600">{r.description}</p>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onBack}
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
      >
        ← Back to Pets
      </button>
    </div>
  );
}
