// src/firebase/firestoreHelpers.js
import { db } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

/* -------------------- 🐾 PET OWNER FUNCTIONS -------------------- */

// Add a new pet under the user's pets subcollection
export const createPet = async (userId, petData) => {
  const petsRef = collection(db, "users", userId, "pets");
  await addDoc(petsRef, {
    ...petData,
    added_on: serverTimestamp(),
  });
};

// Add or remove bookmarked/saved clinic
export const addBookmark = async (userId, clinicId, clinicData) => {
  const bookmarkRef = doc(db, "users", userId, "bookmarks", clinicId);
  await setDoc(bookmarkRef, {
    ...clinicData,
    bookmarkedAt: serverTimestamp(),
  });
};

export const removeBookmark = async (userId, clinicId) => {
  const bookmarkRef = doc(db, "users", userId, "bookmarks", clinicId);
  await deleteDoc(bookmarkRef);
};

// Alias for removeBookmark to match UI terminology
export const removeSavedClinic = removeBookmark;

/* -------------------- 🏥 CLINIC OWNER FUNCTIONS -------------------- */

// Create a new clinic profile
export const createClinic = async (ownerId, clinicData) => {
  const clinicsRef = collection(db, "clinics");
  await addDoc(clinicsRef, {
    ...clinicData,
    ownerId,
    verified: false, // admin verification pending
    createdAt: serverTimestamp(),
  });
};

// Add veterinarian under a clinic
export const addVeterinarian = async (clinicId, vetData) => {
  const vetsRef = collection(db, "clinics", clinicId, "veterinarians");
  await addDoc(vetsRef, {
    ...vetData,
    addedAt: serverTimestamp(),
  });
};

// Add staff under a clinic
export const addClinicStaff = async (clinicId, staffData) => {
  const staffRef = collection(db, "clinics", clinicId, "staff");
  await addDoc(staffRef, {
    ...staffData,
    employment_date: serverTimestamp(),
  });
};

/* -------------------- 📅 APPOINTMENTS -------------------- */

export const createAppointment = async (appointmentData) => {
  const appointmentRef = collection(db, "appointments");
  await addDoc(appointmentRef, {
    ...appointmentData,
    created_date: serverTimestamp(),
    status: "pending",
  });
};

/* -------------------- ⭐ REVIEWS -------------------- */

export const addReview = async (userId, clinicId, reviewData) => {
  const reviewsRef = collection(db, "clinics", clinicId, "reviews");
  await addDoc(reviewsRef, {
    ...reviewData,
    userId,
    date_created: serverTimestamp(),
  });
};

/* -------------------- 🔔 NOTIFICATIONS -------------------- */

export const sendNotification = async (toUserId, message, appointmentId = null) => {
  const notiRef = collection(db, "notifications");
  await addDoc(notiRef, {
    toUserId,
    message,
    appointmentId,
    status: "unread",
    date_sent: serverTimestamp(),
  });
};

/* -------------------- ⚙️ ADMIN FUNCTIONS -------------------- */

export const verifyClinic = async (clinicId) => {
  const clinicRef = doc(db, "clinics", clinicId);
  await updateDoc(clinicRef, { verified: true });
};
