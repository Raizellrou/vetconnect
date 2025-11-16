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
  getDoc,
  getDocs,
  query,
  where,
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

/**
 * Add a clinic to user's bookmarks
 * @param {string} userId - User ID
 * @param {string} clinicId - Clinic ID to bookmark
 * @param {Object} clinicData - Optional clinic metadata (name, address, etc.)
 */
export const addBookmark = async (userId, clinicId, clinicData = {}) => {
  if (!userId || !clinicId) {
    throw new Error("User ID and Clinic ID are required");
  }

  try {
    const bookmarkRef = doc(db, "users", userId, "bookmarks", clinicId);
    await setDoc(bookmarkRef, {
      clinicId,
      clinicName: clinicData.clinicName || clinicData.name || "",
      address: clinicData.address || "",
      createdAt: serverTimestamp(),
    });
    console.log("Bookmark added:", clinicId);
  } catch (error) {
    console.error("Error adding bookmark:", error);
    throw new Error(`Failed to add bookmark: ${error.message}`);
  }
};

/**
 * Remove a clinic from user's bookmarks
 * @param {string} userId - User ID
 * @param {string} clinicId - Clinic ID to remove
 */
export const removeBookmark = async (userId, clinicId) => {
  if (!userId || !clinicId) {
    throw new Error("User ID and Clinic ID are required");
  }

  try {
    const bookmarkRef = doc(db, "users", userId, "bookmarks", clinicId);
    await deleteDoc(bookmarkRef);
    console.log("Bookmark removed:", clinicId);
  } catch (error) {
    console.error("Error removing bookmark:", error);
    throw new Error(`Failed to remove bookmark: ${error.message}`);
  }
};

/**
 * Check if a clinic is bookmarked
 * @param {string} userId - User ID
 * @param {string} clinicId - Clinic ID to check
 * @returns {Promise<boolean>}
 */
export const isClinicBookmarked = async (userId, clinicId) => {
  if (!userId || !clinicId) return false;

  try {
    const bookmarkRef = doc(db, "users", userId, "bookmarks", clinicId);
    const bookmarkSnap = await getDoc(bookmarkRef);
    return bookmarkSnap.exists();
  } catch (error) {
    console.error("Error checking bookmark:", error);
    return false;
  }
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

/* -------------------- 📅 APPOINTMENTS - Enhanced Flow -------------------- */

/**
 * Cancel an appointment (pet owner action)
 * Moves appointment to 'cancelled' status and archives it
 */
export const cancelAppointment = async (appointmentId, cancellationReason = '') => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required');
  }

  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancellationReason: cancellationReason.trim(),
      updatedAt: serverTimestamp()
    });
    console.log('Appointment cancelled:', appointmentId);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw new Error(`Failed to cancel appointment: ${error.message}`);
  }
};

/**
 * Mark appointment as completed (clinic owner action)
 * Only works if appointment date has passed
 */
export const completeAppointment = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required');
  }

  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      throw new Error('Appointment not found');
    }

    const appointmentData = appointmentSnap.data();
    const appointmentDate = appointmentData.dateTime?.toDate ? appointmentData.dateTime.toDate() : new Date(appointmentData.dateTime);
    const now = new Date();

    // Check if appointment date has passed
    if (appointmentDate > now) {
      throw new Error('Cannot complete appointment before scheduled date');
    }

    await updateDoc(appointmentRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('Appointment marked as completed:', appointmentId);
  } catch (error) {
    console.error('Error completing appointment:', error);
    throw new Error(`Failed to complete appointment: ${error.message}`);
  }
};

/**
 * Add clinic notes to an appointment
 */
export const addAppointmentNotes = async (appointmentId, notes) => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required');
  }

  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      clinicNotes: notes.trim(),
      notesUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Appointment notes added:', appointmentId);
  } catch (error) {
    console.error('Error adding appointment notes:', error);
    throw new Error(`Failed to add notes: ${error.message}`);
  }
};

/* -------------------- 🏥 MEDICAL RECORDS -------------------- */

/**
 * Create a medical record for an appointment
 */
export const createMedicalRecord = async (appointmentId, recordData) => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required');
  }

  if (!recordData.petId || !recordData.ownerId || !recordData.clinicId) {
    throw new Error('Pet ID, Owner ID, and Clinic ID are required');
  }

  try {
    const medicalRecordsRef = collection(db, 'medicalRecords');
    const recordRef = await addDoc(medicalRecordsRef, {
      appointmentId,
      petId: recordData.petId,
      ownerId: recordData.ownerId,
      clinicId: recordData.clinicId,
      vetInCharge: recordData.vetInCharge || '',
      diagnosis: recordData.diagnosis || '',
      treatment: recordData.treatment || '',
      prescriptions: recordData.prescriptions || [],
      labResults: recordData.labResults || '',
      notes: recordData.notes || '',
      followUpDate: recordData.followUpDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Link medical record to appointment
    const appointmentRef = doc(db, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      medicalRecordId: recordRef.id,
      hasMedicalRecord: true,
      updatedAt: serverTimestamp()
    });

    console.log('Medical record created:', recordRef.id);
    return recordRef.id;
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw new Error(`Failed to create medical record: ${error.message}`);
  }
};

/**
 * Get medical records for a specific pet
 */
export const getPetMedicalRecords = async (petId) => {
  if (!petId) {
    throw new Error('Pet ID is required');
  }

  try {
    const recordsQuery = firestoreQuery(
      collection(db, 'medicalRecords'),
      where('petId', '==', petId)
    );
    const recordsSnapshot = await getDocs(recordsQuery);
    
    return recordsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw new Error(`Failed to fetch medical records: ${error.message}`);
  }
};

/* -------------------- ⭐ REVIEWS -------------------- */

/**
 * Add a review for a clinic and update its average rating
 * @param {string} userId - User ID submitting the review
 * @param {string} clinicId - Clinic ID being reviewed
 * @param {Object} reviewData - Review data { rating, comment, appointmentId? }
 */
export const addReview = async (userId, clinicId, reviewData) => {
  if (!userId || !clinicId) {
    throw new Error("User ID and Clinic ID are required");
  }

  if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  try {
    // Add the review to subcollection
    const reviewsRef = collection(db, "clinics", clinicId, "reviews");
    const newReviewRef = await addDoc(reviewsRef, {
      userId,
      rating: Number(reviewData.rating),
      comment: reviewData.comment?.trim() || "",
      appointmentId: reviewData.appointmentId || null,
      createdAt: serverTimestamp(),
    });

    console.log("Review added:", newReviewRef.id);

    // Recalculate average rating
    await updateClinicAverageRating(clinicId);

    return newReviewRef.id;
  } catch (error) {
    console.error("Error adding review:", error);
    throw new Error(`Failed to add review: ${error.message}`);
  }
};

/**
 * Recalculate and update clinic's average rating
 * @param {string} clinicId - Clinic ID to update
 */
export const updateClinicAverageRating = async (clinicId) => {
  if (!clinicId) {
    throw new Error("Clinic ID is required");
  }

  try {
    // Fetch all reviews for this clinic
    const reviewsRef = collection(db, "clinics", clinicId, "reviews");
    const reviewsSnapshot = await getDocs(reviewsRef);

    if (reviewsSnapshot.empty) {
      // No reviews, set rating to 0
      const clinicRef = doc(db, "clinics", clinicId);
      await updateDoc(clinicRef, {
        averageRating: 0,
        reviewCount: 0,
        updatedAt: serverTimestamp(),
      });
      console.log("Clinic rating reset to 0 (no reviews)");
      return;
    }

    // Calculate average rating
    let totalRating = 0;
    let reviewCount = 0;

    reviewsSnapshot.forEach((reviewDoc) => {
      const review = reviewDoc.data();
      if (review.rating && !isNaN(review.rating)) {
        totalRating += Number(review.rating);
        reviewCount++;
      }
    });

    const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

    // Update clinic document with new average
    const clinicRef = doc(db, "clinics", clinicId);
    await updateDoc(clinicRef, {
      averageRating: Number(averageRating.toFixed(2)),
      reviewCount: reviewCount,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `Clinic ${clinicId} average rating updated: ${averageRating.toFixed(2)} (${reviewCount} reviews)`
    );
  } catch (error) {
    console.error("Error updating clinic average rating:", error);
    throw new Error(`Failed to update average rating: ${error.message}`);
  }
};

/* -------------------- 🔔 NOTIFICATIONS - Enhanced -------------------- */

/**
 * Send a notification to a user
 * @param {Object} notificationData - { toUserId, title, body, appointmentId?, data? }
 */
export const sendNotification = async (notificationData) => {
  const { toUserId, title, body, appointmentId = null, data = {} } = notificationData;
  
  if (!toUserId) {
    throw new Error("toUserId is required");
  }
  if (!title || !body) {
    throw new Error("title and body are required");
  }

  try {
    const notiRef = collection(db, "users", toUserId, "notifications");
    await addDoc(notiRef, {
      title,
      body,
      appointmentId,
      data,
      status: "unread",
      createdAt: serverTimestamp(),
    });
    console.log("Notification sent to user:", toUserId);
  } catch (error) {
    console.error("Error sending notification:", error);
    throw new Error(`Failed to send notification: ${error.message}`);
  }
};

/**
 * Mark a notification as read
 * @param {string} userId - User ID
 * @param {string} notificationId - Notification ID
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  if (!userId || !notificationId) {
    throw new Error("User ID and Notification ID are required");
  }

  try {
    const notiRef = doc(db, "users", userId, "notifications", notificationId);
    await updateDoc(notiRef, {
      status: "read",
      readAt: serverTimestamp(),
    });
    console.log("Notification marked as read:", notificationId);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 */
export const markAllNotificationsAsRead = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const notiQuery = query(
      collection(db, "users", userId, "notifications"),
      where("status", "==", "unread")
    );
    const snapshot = await getDocs(notiQuery);
    
    const updatePromises = snapshot.docs.map(doc => 
      updateDoc(doc.ref, {
        status: "read",
        readAt: serverTimestamp(),
      })
    );
    
    await Promise.all(updatePromises);
    console.log(`Marked ${updatePromises.length} notifications as read for user:`, userId);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
};

/**
 * Clear all notifications for a user (DELETE all documents)
 * @param {string} userId - User ID
 */
export const clearNotifications = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const notificationsRef = collection(db, "users", userId, "notifications");
    const snapshot = await getDocs(notificationsRef);
    
    if (snapshot.empty) {
      console.log('No notifications to clear');
      return;
    }
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ Cleared ${deletePromises.length} notifications for user:`, userId);
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw new Error(`Failed to clear notifications: ${error.message}`);
  }
};

/* -------------------- ⚙️ ADMIN FUNCTIONS -------------------- */

export const verifyClinic = async (clinicId) => {
  const clinicRef = doc(db, "clinics", clinicId);
  await updateDoc(clinicRef, { verified: true });
};
