import { collection, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

export const addPet = (uid, data) =>
  addDoc(collection(db, "users", uid, "pets"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

// PET FILES - Upload file for a specific pet
export const uploadPetFile = async (uid, petId, file) => {
  try {
    if (!uid) throw new Error('User ID is required');
    if (!petId) throw new Error('Pet ID is required');
    if (!file) throw new Error('File is required');

    const name = `${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, `users/${uid}/pets/${petId}/files/${name}`);
    
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    
    await addDoc(collection(db, "users", uid, "pets", petId, "files"), {
      name: file.name,
      size: file.size,
      type: file.type,
      storagePath: sRef.fullPath,
      downloadURL: url,
      uploadedAt: serverTimestamp(),
    });
    
    console.log('File uploaded successfully for pet:', petId);
    return url;
  } catch (error) {
    console.error('Error uploading pet file:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

// PET FILES - Delete file for a specific pet
export const deletePetFile = async (uid, petId, fileId) => {
  try {
    if (!uid) throw new Error('User ID is required');
    if (!petId) throw new Error('Pet ID is required');
    if (!fileId) throw new Error('File ID is required');

    // Delete from Firestore
    const fileDocRef = doc(db, "users", uid, "pets", petId, "files", fileId);
    await deleteDoc(fileDocRef);
    
    console.log('File deleted successfully for pet:', petId);
  } catch (error) {
    console.error('Error deleting pet file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};
