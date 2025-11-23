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

/* -------------------- 📅 APPOINTMENTS - Enhanced Flow with Time Slot Management -------------------- */

/**
 * Fetch working hours for a clinic
 * @param {string} clinicId - Clinic ID
 * @returns {Promise<Object>} Working hours object { start, end } or null
 */
export const fetchWorkingHours = async (clinicId) => {
  if (!clinicId) {
    throw new Error('Clinic ID is required');
  }

  try {
    const workingHoursRef = doc(db, 'clinics', clinicId, 'settings', 'workingHours');
    const workingHoursSnap = await getDoc(workingHoursRef);
    
    if (workingHoursSnap.exists()) {
      return workingHoursSnap.data();
    }
    
    // Default working hours if not set
    return { start: '08:00', end: '17:00' };
  } catch (error) {
    console.error('Error fetching working hours:', error);
    // Return default on error
    return { start: '08:00', end: '17:00' };
  }
};

/**
 * Generate 1-hour interval time slots based on working hours
 * @param {Object} workingHours - Object with start and end time strings
 * @param {Date} date - The date for which to generate slots
 * @returns {Array<Object>} Array of time slot objects { startTime, endTime, display }
 */
export const generateTimeSlots = (workingHours, date = new Date()) => {
  if (!workingHours || !workingHours.start || !workingHours.end) {
    console.warn('Invalid working hours provided');
    return [];
  }

  const slots = [];
  const [startHour, startMinute] = workingHours.start.split(':').map(Number);
  const [endHour, endMinute] = workingHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  // Generate hourly slots
  for (let time = startTime; time < endTime; time += 60) {
    const slotStartHour = Math.floor(time / 60);
    const slotStartMinute = time % 60;
    const slotEndHour = Math.floor((time + 60) / 60);
    const slotEndMinute = (time + 60) % 60;
    
    const startTimeStr = `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`;
    const endTimeStr = `${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`;
    
    slots.push({
      startTime: startTimeStr,
      endTime: endTimeStr,
      display: `${formatTimeDisplay(startTimeStr)} - ${formatTimeDisplay(endTimeStr)}`
    });
  }
  
  return slots;
};

/**
 * Format time for display (e.g., "08:00" -> "8:00 AM")
 * @param {string} timeStr - Time string in HH:mm format
 * @returns {string} Formatted time string
 */
const formatTimeDisplay = (timeStr) => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
};

/**
 * Check if a time slot is available (no overlapping appointments)
 * @param {string} clinicId - Clinic ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {string} startTime - Start time (HH:mm)
 * @param {string} endTime - End time (HH:mm)
 * @returns {Promise<boolean>} True if slot is available
 */
export const checkSlotAvailability = async (clinicId, date, startTime, endTime) => {
  if (!clinicId || !date || !startTime || !endTime) {
    throw new Error('All parameters are required');
  }

  try {
    // Parse the date and times
    const requestedDate = new Date(date);
    const [reqStartHour, reqStartMin] = startTime.split(':').map(Number);
    const [reqEndHour, reqEndMin] = endTime.split(':').map(Number);
    
    const requestedStart = new Date(requestedDate);
    requestedStart.setHours(reqStartHour, reqStartMin, 0, 0);
    
    const requestedEnd = new Date(requestedDate);
    requestedEnd.setHours(reqEndHour, reqEndMin, 0, 0);

    // Query appointments for this clinic on this date
    // Only check approved and confirmed appointments - pending ones don't block slots
    const appointmentsRef = collection(db, 'appointments');
    const appointmentsQuery = query(
      appointmentsRef,
      where('clinicId', '==', clinicId),
      where('status', 'in', ['approved', 'confirmed']) // Only approved/confirmed block slots
    );
    
    const appointmentsSnap = await getDocs(appointmentsQuery);
    
    console.log(`Checking slot availability for ${date} from ${startTime} to ${endTime}`);
    console.log(`Found ${appointmentsSnap.docs.length} APPROVED/CONFIRMED appointments for clinic (pending appointments don't block slots)`);
    
    // Debug: Log all appointments that are blocking slots
    appointmentsSnap.docs.forEach(doc => {
      const apt = doc.data();
      console.log('Blocking appointment:', {
        id: doc.id,
        date: apt.date,
        startTime: apt.startTime,
        endTime: apt.endTime,
        status: apt.status
      });
    });
    
    // Check for overlaps
    for (const appointmentDoc of appointmentsSnap.docs) {
      const apt = appointmentDoc.data();
      
      // Skip if appointment is not on the same date
      if (apt.date !== date) {
        console.log(`Skipping appointment ${appointmentDoc.id} - different date: ${apt.date} vs ${date}`);
        continue;
      }
      
      console.log(`Checking appointment ${appointmentDoc.id} on same date ${date}`);
      
      
      // Skip if appointment doesn't have startTime/endTime (old format)
      if (!apt.startTime || !apt.endTime) {
        console.log('Skipping appointment without time slots:', appointmentDoc.id);
        continue;
      }
      
      // Parse existing appointment times
      const [existingStartHour, existingStartMin] = apt.startTime.split(':').map(Number);
      const [existingEndHour, existingEndMin] = apt.endTime.split(':').map(Number);
      
      const existingStart = new Date(requestedDate);
      existingStart.setHours(existingStartHour, existingStartMin, 0, 0);
      
      const existingEnd = new Date(requestedDate);
      existingEnd.setHours(existingEndHour, existingEndMin, 0, 0);
      
      // Check for overlap: requestedStart < existingEnd && requestedEnd > existingStart
      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        console.log('Time slot conflict detected:', {
          requested: { start: startTime, end: endTime },
          existing: { start: apt.startTime, end: apt.endTime }
        });
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking slot availability:', error);
    throw new Error(`Failed to check availability: ${error.message}`);
  }
};

/**
 * Book a new appointment with time slot
 * @param {Object} appointmentData - Appointment data
 * @returns {Promise<string>} Appointment ID
 */
export const bookAppointmentWithTimeSlot = async (appointmentData) => {
  const {
    clinicId,
    ownerUid,
    petId,
    date,
    startTime,
    endTime,
    reason,
    service,
    notes
  } = appointmentData;

  if (!clinicId || !ownerUid || !petId || !date || !startTime || !endTime) {
    throw new Error('Required appointment fields are missing');
  }

  try {
    // Check if slot is still available
    const isAvailable = await checkSlotAvailability(clinicId, date, startTime, endTime);
    
    if (!isAvailable) {
      throw new Error('This time slot is no longer available. Please select another time.');
    }

    // Create appointment document
    const appointmentsRef = collection(db, 'appointments');
    const appointmentDoc = await addDoc(appointmentsRef, {
      clinicId,
      ownerId: ownerUid, // Store as ownerId to match clinic dashboard expectations
      petId,
      date,
      startTime,
      endTime,
      status: 'pending',
      reason: reason || '',
      service: service || '',
      notes: notes || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Appointment booked:', appointmentDoc.id);
    
    // Fetch clinic owner ID and clinic name to send notification
    try {
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);
      
      if (clinicSnap.exists()) {
        const clinicData = clinicSnap.data();
        const clinicOwnerId = clinicData.ownerId;
        const clinicName = clinicData.clinicName || clinicData.name || 'Your Clinic';
        
        if (clinicOwnerId) {
          // Fetch pet and owner names for the notification
          let petName = 'a pet';
          let ownerName = 'A pet owner';
          
          try {
            const petRef = doc(db, 'users', ownerUid, 'pets', petId);
            const petSnap = await getDoc(petRef);
            if (petSnap.exists()) {
              petName = petSnap.data().name || 'a pet';
            }
            
            const ownerRef = doc(db, 'users', ownerUid);
            const ownerSnap = await getDoc(ownerRef);
            if (ownerSnap.exists()) {
              const ownerData = ownerSnap.data();
              ownerName = ownerData.fullName || ownerData.displayName || ownerData.email || 'A pet owner';
            }
          } catch (err) {
            console.warn('Failed to fetch pet/owner details for notification:', err);
          }
          
          // Format the time display
          const formatTime = (timeStr) => {
            const [hour, minute] = timeStr.split(':').map(Number);
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
            return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
          };
          
          const timeSlot = `${formatTime(startTime)} - ${formatTime(endTime)}`;
          const formattedDate = new Date(date).toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
          
          // Send notification to clinic owner
          await sendNotification({
            toUserId: clinicOwnerId,
            title: '🔔 New Appointment Request',
            body: `${ownerName} requested an appointment for ${petName} on ${formattedDate} at ${timeSlot}`,
            appointmentId: appointmentDoc.id,
            data: {
              type: 'new_appointment',
              clinicId,
              clinicName,
              appointmentId: appointmentDoc.id,
              date,
              timeSlot,
              petName,
              ownerName,
              action: 'view_appointments'
            }
          });
          
          console.log('Notification sent to clinic owner:', clinicOwnerId);
        }
      }
    } catch (notifError) {
      console.error('Error sending notification to clinic owner:', notifError);
      // Don't fail the appointment booking if notification fails
    }
    
    return appointmentDoc.id;
  } catch (error) {
    console.error('Error booking appointment:', error);
    throw error;
  }
};

/**
 * Approve an appointment (clinic owner action)
 * Checks availability before approving
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<void>}
 */
export const approveAppointment = async (appointmentId) => {
  if (!appointmentId) {
    throw new Error('Appointment ID is required');
  }

  try {
    // Fetch the appointment
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      throw new Error('Appointment not found');
    }

    const appointment = appointmentSnap.data();
    
    // Check if time slot is still available
    const isAvailable = await checkSlotAvailability(
      appointment.clinicId,
      appointment.date,
      appointment.startTime,
      appointment.endTime
    );
    
    if (!isAvailable) {
      throw new Error('This time slot is no longer available. Another appointment may have been approved.');
    }

    // Update status to approved
    await updateDoc(appointmentRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Appointment approved:', appointmentId);
  } catch (error) {
    console.error('Error approving appointment:', error);
    throw error;
  }
};

/**
 * Extend appointment duration (clinic owner action)
 * @param {string} appointmentId - Appointment ID
 * @param {string} newEndTime - New end time (HH:mm)
 * @returns {Promise<void>}
 */
export const extendAppointment = async (appointmentId, newEndTime) => {
  if (!appointmentId || !newEndTime) {
    throw new Error('Appointment ID and new end time are required');
  }

  try {
    // Fetch the appointment
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const appointmentSnap = await getDoc(appointmentRef);
    
    if (!appointmentSnap.exists()) {
      throw new Error('Appointment not found');
    }

    const appointment = appointmentSnap.data();
    
    // Validate that new end time is after start time
    const [startHour, startMin] = appointment.startTime.split(':').map(Number);
    const [newEndHour, newEndMin] = newEndTime.split(':').map(Number);
    
    if (newEndHour < startHour || (newEndHour === startHour && newEndMin <= startMin)) {
      throw new Error('End time must be after start time');
    }

    // Check if extended time slot is available
    const isAvailable = await checkSlotAvailability(
      appointment.clinicId,
      appointment.date,
      appointment.startTime,
      newEndTime
    );
    
    if (!isAvailable) {
      throw new Error('Cannot extend appointment. The extended time slot conflicts with another appointment.');
    }

    // Update appointment with new end time
    await updateDoc(appointmentRef, {
      endTime: newEndTime,
      extendedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Appointment extended:', appointmentId, 'New end time:', newEndTime);
  } catch (error) {
    console.error('Error extending appointment:', error);
    throw error;
  }
};

/**
 * Update clinic working hours
 * @param {string} clinicId - Clinic ID
 * @param {string} start - Start time (HH:mm)
 * @param {string} end - End time (HH:mm)
 * @returns {Promise<void>}
 */
export const updateWorkingHours = async (clinicId, start, end) => {
  if (!clinicId || !start || !end) {
    throw new Error('Clinic ID, start time, and end time are required');
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) {
    throw new Error('Invalid time format. Use HH:mm format (e.g., 08:00)');
  }

  // Validate that end time is after start time
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  if (endHour < startHour || (endHour === startHour && endMin <= startMin)) {
    throw new Error('End time must be after start time');
  }

  try {
    // Create or update working hours document
    const workingHoursRef = doc(db, 'clinics', clinicId, 'settings', 'workingHours');
    await setDoc(workingHoursRef, {
      start,
      end,
      updatedAt: serverTimestamp()
    });

    console.log('Working hours updated for clinic:', clinicId);
  } catch (error) {
    console.error('Error updating working hours:', error);
    throw new Error(`Failed to update working hours: ${error.message}`);
  }
};

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
    // Support both legacy `dateTime` and separate `date` + `startTime` formats
    let appointmentDate = null;
    if (appointmentData.dateTime) {
      appointmentDate = appointmentData.dateTime?.toDate ? appointmentData.dateTime.toDate() : new Date(appointmentData.dateTime);
    } else if (appointmentData.date && appointmentData.startTime) {
      try {
        const [hours, minutes] = appointmentData.startTime.split(':').map(Number);
        const d = new Date(appointmentData.date);
        d.setHours(hours || 0, minutes || 0, 0, 0);
        appointmentDate = d;
      } catch (e) {
        appointmentDate = new Date(appointmentData.date);
      }
    } else {
      // Fallback to now (prevents accidental completion before the stored date)
      appointmentDate = appointmentData.dateTime ? new Date(appointmentData.dateTime) : new Date();
    }
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
    // Allow optional `files` (array of urls) to be attached to the record
    const recordPayload = {
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
      files: recordData.files || [],
      followUpDate: recordData.followUpDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const recordRef = await addDoc(medicalRecordsRef, recordPayload);

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
