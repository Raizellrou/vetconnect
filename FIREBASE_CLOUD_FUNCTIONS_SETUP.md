# Firebase Cloud Functions Setup for Automatic Appointment Status Updates

This guide will help you set up Firebase Cloud Functions to automatically update appointment statuses when their dates pass.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project initialized
3. Node.js 16+ installed

## Setup Instructions

### 1. Initialize Firebase Functions

```bash
cd vetconnect
firebase init functions
```

Select:
- JavaScript or TypeScript
- ESLint for code quality
- Install dependencies with npm

### 2. Create the Cloud Function

Create `functions/index.js` with the following code:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

/**
 * Scheduled function that runs every hour to check and update appointment statuses
 * Marks confirmed appointments as completed if their date/time has passed
 */
exports.updateAppointmentStatuses = functions.pubsub
  .schedule('every 1 hours')
  .timeZone('Asia/Manila') // Adjust to your timezone
  .onRun(async (context) => {
    console.log('Starting automatic appointment status update...');
    
    try {
      const now = new Date();
      
      // Query confirmed appointments
      const appointmentsSnapshot = await db.collection('appointments')
        .where('status', '==', 'confirmed')
        .get();
      
      if (appointmentsSnapshot.empty) {
        console.log('No confirmed appointments to process');
        return null;
      }
      
      const batch = db.batch();
      let updateCount = 0;
      
      appointmentsSnapshot.forEach((doc) => {
        const appointment = doc.data();
        let appointmentDateTime;
        
        // Handle both old (dateTime) and new (date + startTime) formats
        if (appointment.dateTime) {
          appointmentDateTime = appointment.dateTime.toDate();
        } else if (appointment.date && appointment.startTime) {
          const [hours, minutes] = appointment.startTime.split(':');
          appointmentDateTime = new Date(appointment.date);
          appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        
        // If appointment date has passed, mark as completed
        if (appointmentDateTime && appointmentDateTime < now) {
          batch.update(doc.ref, {
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            autoCompleted: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
          console.log(`Marking appointment ${doc.id} as completed`);
        }
      });
      
      if (updateCount > 0) {
        await batch.commit();
        console.log(`Successfully updated ${updateCount} appointments to completed`);
      } else {
        console.log('No appointments needed status update');
      }
      
      return null;
    } catch (error) {
      console.error('Error updating appointment statuses:', error);
      return null;
    }
  });

/**
 * Real-time trigger when an appointment is created or updated
 * Automatically checks if the appointment should be completed
 */
exports.onAppointmentChange = functions.firestore
  .document('appointments/{appointmentId}')
  .onWrite(async (change, context) => {
    // Only process if document exists after the change
    if (!change.after.exists) {
      return null;
    }
    
    const appointment = change.after.data();
    const appointmentId = context.params.appointmentId;
    
    // Skip if already completed or cancelled
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return null;
    }
    
    const now = new Date();
    let appointmentDateTime;
    
    // Handle both formats
    if (appointment.dateTime) {
      appointmentDateTime = appointment.dateTime.toDate();
    } else if (appointment.date && appointment.startTime) {
      const [hours, minutes] = appointment.startTime.split(':');
      appointmentDateTime = new Date(appointment.date);
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }
    
    // Auto-complete if past and confirmed
    if (appointmentDateTime && appointmentDateTime < now && appointment.status === 'confirmed') {
      console.log(`Auto-completing past appointment ${appointmentId}`);
      
      await change.after.ref.update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        autoCompleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return null;
  });

/**
 * Trigger when a medical record is created
 * Sends notification to pet owner
 */
exports.onMedicalRecordCreated = functions.firestore
  .document('medicalRecords/{recordId}')
  .onCreate(async (snap, context) => {
    const record = snap.data();
    const recordId = context.params.recordId;
    
    try {
      // Get pet and owner details
      const petDoc = await db.collection('users')
        .doc(record.ownerId)
        .collection('pets')
        .doc(record.petId)
        .get();
      
      const ownerDoc = await db.collection('users')
        .doc(record.ownerId)
        .get();
      
      if (!petDoc.exists || !ownerDoc.exists) {
        console.error('Pet or owner not found');
        return null;
      }
      
      const petName = petDoc.data().name || 'your pet';
      
      // Create notification
      await db.collection('users')
        .doc(record.ownerId)
        .collection('notifications')
        .add({
          type: 'medical_record',
          title: 'New Medical Record Available',
          body: `A new medical record has been created for ${petName}`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          data: {
            recordId: recordId,
            petId: record.petId,
            clinicId: record.clinicId
          }
        });
      
      console.log(`Notification sent for medical record ${recordId}`);
      return null;
    } catch (error) {
      console.error('Error sending medical record notification:', error);
      return null;
    }
  });
```

### 3. Deploy the Functions

```bash
firebase deploy --only functions
```

### 4. Environment Configuration

If you need environment variables:

```bash
firebase functions:config:set timezone="Asia/Manila"
firebase deploy --only functions
```

## Testing

### Test the Scheduled Function Locally

```bash
cd functions
npm run serve
```

### Test Cloud Functions

1. Go to Firebase Console → Functions
2. Check the logs for execution history
3. Verify appointments are being updated

## Monitoring

- View logs: `firebase functions:log`
- Monitor in Firebase Console: Functions → Logs tab
- Set up alerts for function failures

## Cost Considerations

- Scheduled functions run every hour (720 executions/month)
- Firestore triggers run on each appointment change
- Free tier includes 2M invocations per month
- Monitor usage in Firebase Console → Usage tab

## Troubleshooting

### Function Not Running
- Check Firebase Console → Functions → Logs
- Verify timezone configuration
- Ensure service account has proper permissions

### Appointments Not Updating
- Check Firestore security rules allow function writes
- Verify appointment date format
- Check function logs for errors

## Alternative: Client-Side Auto-Update

The React component already includes client-side auto-update logic that runs:
- On component mount
- Every 5 minutes
- When appointments data changes

This provides instant feedback while Cloud Functions handle backend consistency.

## Best Practices

1. **Combine Both Approaches**: Use client-side updates for immediate feedback and Cloud Functions for reliability
2. **Error Handling**: Always include try-catch blocks
3. **Logging**: Use console.log for debugging
4. **Batching**: Update multiple documents in batches for efficiency
5. **Timezone**: Configure timezone in function settings

## Security Rules

Update `firestore.rules` to allow Cloud Functions to update appointments:

```javascript
match /appointments/{appointmentId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (request.auth.uid == resource.data.ownerId || 
     request.auth.uid == get(/databases/$(database)/documents/clinics/$(resource.data.clinicId)).data.ownerId);
  // Allow Cloud Functions (using service account) to update
  allow update: if request.auth.token.firebase.sign_in_provider == 'custom';
}
```

## Next Steps

1. Test the functions in development
2. Monitor execution and costs
3. Adjust schedule frequency as needed
4. Add more automation as required
