import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { sendNotification } from '../firebase/firestoreHelpers';
import { formatShortDate, formatTime } from './dateUtils';

/**
 * Check for upcoming appointments and send reminders
 * Call this function on dashboard load or periodically
 */
export const checkAndSendReminders = async (userId, userRole) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    if (userRole === 'petOwner') {
      // Check pet owner's upcoming appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('ownerId', '==', userId),
        where('status', '==', 'confirmed')
      );
      
      const snapshot = await getDocs(appointmentsQuery);
      
      for (const aptDoc of snapshot.docs) {
        const apt = aptDoc.data();
        const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
        
        // Check if appointment is today or tomorrow
        const isToday = aptDate >= today && aptDate < tomorrow && aptDate > now;
        const isTomorrow = aptDate >= tomorrow && aptDate < new Date(tomorrow.getTime() + 86400000);
        
        if (isToday || isTomorrow) {
          // Check if reminder already sent (store in localStorage)
          const reminderKey = `reminder_sent_${aptDoc.id}_${aptDate.toDateString()}`;
          if (localStorage.getItem(reminderKey)) {
            continue; // Already sent reminder for this appointment
          }
          
          // Fetch clinic and pet details
          const clinicDoc = await getDoc(doc(db, 'clinics', apt.clinicId));
          const clinicData = clinicDoc.exists() ? clinicDoc.data() : {};
          
          const petDoc = await getDoc(doc(db, 'users', userId, 'pets', apt.petId));
          const petData = petDoc.exists() ? petDoc.data() : {};
          
          const clinicName = clinicData.clinicName || clinicData.name || 'Your Clinic';
          const petName = petData.name || 'Your Pet';
          
          const timeText = isToday ? 'today' : 'tomorrow';
          
          await sendNotification({
            toUserId: userId,
            title: `⏰ Appointment Reminder - ${timeText.toUpperCase()}`,
            body: `Reminder: ${petName} has an appointment at ${clinicName} ${timeText} at ${formatTime(aptDate)}`,
            appointmentId: aptDoc.id,
            data: {
              type: 'appointment_reminder',
              when: timeText,
              clinicId: apt.clinicId,
              clinicName: clinicName,
              petId: apt.petId,
              petName: petName,
              appointmentDate: formatShortDate(aptDate),
              appointmentTime: formatTime(aptDate)
            }
          });
          
          // Mark reminder as sent
          localStorage.setItem(reminderKey, 'true');
          console.log(`✅ Reminder sent for appointment ${aptDoc.id}`);
        }
      }
    } else if (userRole === 'clinicOwner') {
      // Check clinic owner's appointments for all their clinics
      const clinicsQuery = query(
        collection(db, 'clinics'),
        where('ownerId', '==', userId)
      );
      
      const clinicsSnapshot = await getDocs(clinicsQuery);
      
      for (const clinicDoc of clinicsSnapshot.docs) {
        const clinicData = clinicDoc.data();
        const clinicName = clinicData.clinicName || clinicData.name || 'Your Clinic';
        
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('clinicId', '==', clinicDoc.id),
          where('status', '==', 'confirmed')
        );
        
        const aptSnapshot = await getDocs(appointmentsQuery);
        const todayAppointments = [];
        
        for (const aptDoc of aptSnapshot.docs) {
          const apt = aptDoc.data();
          const aptDate = apt.dateTime?.toDate ? apt.dateTime.toDate() : new Date(apt.dateTime);
          
          // Check if appointment is today
          if (aptDate >= today && aptDate < tomorrow) {
            // Fetch pet and owner details
            let petName = 'Unknown Pet';
            let ownerName = 'Unknown Owner';
            
            if (apt.petId && apt.ownerId) {
              try {
                const petDoc = await getDoc(doc(db, 'users', apt.ownerId, 'pets', apt.petId));
                if (petDoc.exists()) {
                  petName = petDoc.data().name || 'Unknown Pet';
                }
                
                const ownerDoc = await getDoc(doc(db, 'users', apt.ownerId));
                if (ownerDoc.exists()) {
                  const ownerData = ownerDoc.data();
                  ownerName = ownerData.fullName || ownerData.displayName || ownerData.email || 'Unknown Owner';
                }
              } catch (err) {
                console.warn('Error fetching pet/owner details:', err);
              }
            }
            
            todayAppointments.push({
              id: aptDoc.id,
              time: formatTime(aptDate),
              petName,
              ownerName,
              aptDate
            });
          }
        }
        
        // Send summary notification for today's appointments
        if (todayAppointments.length > 0) {
          const reminderKey = `clinic_reminder_sent_${clinicDoc.id}_${today.toDateString()}`;
          if (!localStorage.getItem(reminderKey)) {
            // Sort by time
            todayAppointments.sort((a, b) => a.aptDate - b.aptDate);
            
            const appointmentsList = todayAppointments
              .slice(0, 3)
              .map(apt => `${apt.time} - ${apt.petName} (${apt.ownerName})`)
              .join(', ');
            
            const moreText = todayAppointments.length > 3 ? ` and ${todayAppointments.length - 3} more` : '';
            
            await sendNotification({
              toUserId: userId,
              title: `📋 Today's Schedule - ${clinicName}`,
              body: `You have ${todayAppointments.length} appointment${todayAppointments.length !== 1 ? 's' : ''} today at ${clinicName}: ${appointmentsList}${moreText}`,
              data: {
                type: 'daily_schedule',
                clinicId: clinicDoc.id,
                clinicName: clinicName,
                appointmentCount: todayAppointments.length,
                date: formatShortDate(today)
              }
            });
            
            localStorage.setItem(reminderKey, 'true');
            console.log(`✅ Daily schedule reminder sent for clinic ${clinicName}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking and sending reminders:', error);
  }
};

/**
 * Clear old reminder flags (call this daily)
 */
export const clearOldReminderFlags = () => {
  const keys = Object.keys(localStorage);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  keys.forEach(key => {
    if (key.startsWith('reminder_sent_') || key.startsWith('clinic_reminder_sent_')) {
      // Remove old flags
      localStorage.removeItem(key);
    }
  });
};
