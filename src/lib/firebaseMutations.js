import { collection, addDoc, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// PETS (examples if needed elsewhere)
export const addPet = (uid, data) =>
  addDoc(collection(db, "users", uid, "pets"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updatePet = (uid, petId, data) =>
  setDoc(doc(db, "users", uid, "pets", petId), { ...data, updatedAt: serverTimestamp() }, { merge: true });

export const deletePet = (uid, petId) => deleteDoc(doc(db, "users", uid, "pets", petId));

// APPOINTMENTS
export const bookAppointment = (data) =>
  addDoc(collection(db, "appointments"), {
    ...data,
    status: data.status || "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateAppointment = (appointmentId, updates) =>
  updateDoc(doc(db, "appointments", appointmentId), { ...updates, updatedAt: serverTimestamp() });

// BOOKMARKS
export const removeBookmark = (uid, clinicId) =>
  deleteDoc(doc(db, "users", uid, "bookmarks", clinicId));

// FILE UPLOAD (users/{uid}/files)
export const uploadPetFile = async (uid, file) => {
  const name = `${Date.now()}_${file.name}`;
  const sRef = storageRef(storage, `users/${uid}/files/${name}`);
  await uploadBytes(sRef, file);
  const url = await getDownloadURL(sRef);
  await addDoc(collection(db, "users", uid, "files"), {
    name: file.name,
    size: file.size,
    type: file.type,
    storagePath: sRef.fullPath,
    downloadURL: url,
    uploadedAt: serverTimestamp(),
  });
  return url;
};
