import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import PetForm from "../components/PetForm";
import PetList from "../components/PetList";

export default function PetManagement({ userData, onViewRecords }) {
  const [pets, setPets] = useState([]);
  const [editingPet, setEditingPet] = useState(null);

  const fetchPets = async () => {
    if (!userData?.uid) return;
    const petsRef = collection(db, "users", userData.uid, "pets");
    const snapshot = await getDocs(petsRef);
    setPets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    fetchPets();
  }, [userData]);

  const handleSavePet = async (formData) => {
    if (!userData?.uid) return;
    const petsRef = collection(db, "users", userData.uid, "pets");

    if (editingPet) {
      const petRef = doc(db, "users", userData.uid, "pets", editingPet.id);
      await updateDoc(petRef, formData);
      setEditingPet(null);
    } else {
      await addDoc(petsRef, { ...formData, createdAt: new Date() });
    }
    fetchPets();
  };

  return (
    <div>
      <PetForm
        onSubmit={handleSavePet}
        editingPet={editingPet}
        setEditingPet={setEditingPet}
      />

      <p className="text-sm text-red-500 mt-2">
        ⚠️ Once you add a pet, it cannot be deleted. Please make sure the
        details are accurate.
      </p>

      <hr className="my-4" />

      <PetList pets={pets} onEdit={setEditingPet} onViewRecords={onViewRecords} />
    </div>
  );
}
