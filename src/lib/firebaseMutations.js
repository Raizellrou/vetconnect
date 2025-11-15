import { collection, addDoc, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../firebase/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// PETS
export const addPet = async (uid, data) => {
  try {
    if (!uid) throw new Error('User ID is required');
    if (!data.name) throw new Error('Pet name is required');
    if (!data.species) throw new Error('Pet species is required');

    const petDoc = {
      name: data.name.trim(),
      species: data.species.trim(),
      breed: data.breed?.trim() || '',
      dob: data.dob || null,
      gender: data.gender || '',
      weightKg: data.weightKg !== null && data.weightKg !== '' ? Number(data.weightKg) : null,
      notes: data.notes?.trim() || '',
      avatarURL: data.avatarURL?.trim() || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, "users", uid, "pets"), petDoc);
    console.log('Pet added successfully:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding pet:', error);
    throw new Error(`Failed to add pet: ${error.message}`);
  }
};

export const updatePet = async (uid, petId, data) => {
  try {
    if (!uid) throw new Error('User ID is required');
    if (!petId) throw new Error('Pet ID is required');

    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, "users", uid, "pets", petId), updateData, { merge: true });
    console.log('Pet updated successfully:', petId);
  } catch (error) {
    console.error('Error updating pet:', error);
    throw new Error(`Failed to update pet: ${error.message}`);
  }
};

export const deletePet = async (uid, petId) => {
  try {
    if (!uid) throw new Error('User ID is required');
    if (!petId) throw new Error('Pet ID is required');

    await deleteDoc(doc(db, "users", uid, "pets", petId));
    console.log('Pet deleted successfully:', petId);
  } catch (error) {
    console.error('Error deleting pet:', error);
    throw new Error(`Failed to delete pet: ${error.message}`);
  }
};

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

// APPOINTMENTS - Enhanced
export { 
  cancelAppointment, 
  completeAppointment, 
  addAppointmentNotes,
  createMedicalRecord,
  getPetMedicalRecords
} from '../firebase/firestoreHelpers';

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
