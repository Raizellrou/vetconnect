# Appointment Scheduling System Documentation

## Overview

VetConnect now features a comprehensive appointment scheduling system with time slot management, working hours configuration, and double-booking prevention.

## Features Implemented

### 1. Booking Appointments with Time Slots

**Component**: `BookAppointmentWithTimeSlot.jsx`

- Pet owners can book appointments through the clinic details page
- 3-step booking process:
  1. Select pet and date
  2. Choose available time slot
  3. Add appointment details (reason, service, notes)
- Real-time availability checking
- Displays available/unavailable time slots
- Prevents selection of already booked slots

**Usage**:
```javascript
<BookAppointmentWithTimeSlot
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  clinicId={clinicId}
  clinicName={clinicName}
/>
```

### 2. Working Hours Management

**Component**: `WorkingHoursModal.jsx`

Clinic owners can set their operating hours through:
- Clinic Appointments page (header button)
- Edit Clinic page (header button)

**Features**:
- Time picker for opening and closing times
- Validation (end time must be after start time)
- Minimum 1 hour, maximum 16 hours per day
- Default hours: 08:00 - 17:00
- Preview of selected hours

**Data Structure**:
```javascript
// Stored in: clinics/{clinicId}/settings/workingHours
{
  start: "08:00",
  end: "17:00",
  updatedAt: timestamp
}
```

### 3. Time Slot Generation

**Function**: `generateTimeSlots(workingHours, date)`

- Automatically generates 1-hour interval time slots
- Based on clinic's working hours
- Example: 08:00-17:00 generates slots from 8:00 AM to 5:00 PM

### 4. Availability Checking

**Function**: `checkSlotAvailability(clinicId, date, startTime, endTime)`

Prevents double-booking by:
- Checking for overlapping appointments
- Considers pending, approved, and confirmed appointments
- Uses overlap logic: `requestedStart < existingEnd && requestedEnd > existingStart`

**Example**:
- Requested: 09:00-10:00
- Existing: 09:30-10:30
- Result: Conflict detected (overlap exists)

### 5. Appointment Approval with Availability Check

**Function**: `approveAppointment(appointmentId)`

- Clinic owners can approve pending appointments
- Re-checks availability before approval
- Prevents approval if time slot is no longer available
- Updates status to "approved" or "confirmed"
- Sends notification to pet owner

**Updated Status Flow**:
```
pending → approved (with availability check) → completed
       ↘ rejected
```

### 6. Appointment Extension

**Component**: `ExtendAppointmentModal.jsx`

Clinic owners can extend confirmed appointments:
- Select new end time
- Quick select buttons (30-minute increments)
- Custom time picker
- Duration preview
- Validates no conflicts with other appointments

**Features**:
- Only extends end time (start time remains same)
- Cannot extend if it overlaps with another appointment
- Shows current duration and new duration

### 7. Prevent Double-Booking Rules

A time slot is **available** only when:
- No approved appointment overlaps
- No pending appointment overlaps
- No confirmed appointment overlaps

**Overlap Detection**:
```javascript
// Conflict exists if:
requestedStart < existingEnd && requestedEnd > existingStart

// Example conflict:
Request: 09:00-10:00
Existing: 09:30-10:30
// 09:00 < 10:30 && 10:00 > 09:30 = TRUE (conflict!)
```

### 8. Appointment Data Structure

```javascript
// appointments/{appointmentId}
{
  clinicId: string,
  ownerUid: string,
  petId: string,
  date: string,              // "YYYY-MM-DD"
  startTime: string,         // "HH:mm" (e.g., "08:00")
  endTime: string,           // "HH:mm" (e.g., "09:00")
  status: string,            // "pending" | "approved" | "confirmed" | "rejected" | "cancelled"
  reason: string,            // Optional
  service: string,           // Optional
  notes: string,             // Optional
  createdAt: timestamp,
  updatedAt: timestamp,
  approvedAt: timestamp,     // When approved
  extendedAt: timestamp      // When extended
}
```

## Firestore Functions

### Core Functions

#### `fetchWorkingHours(clinicId)`
Retrieves clinic's working hours from Firestore.

**Returns**: `{ start: "08:00", end: "17:00" }`

#### `updateWorkingHours(clinicId, start, end)`
Updates clinic's working hours.

**Parameters**:
- `start`: Opening time (HH:mm format)
- `end`: Closing time (HH:mm format)

**Validation**:
- Valid time format (HH:mm)
- End time after start time
- Reasonable hours (1-16 hours)

#### `generateTimeSlots(workingHours, date)`
Generates hourly time slots.

**Returns**:
```javascript
[
  {
    startTime: "08:00",
    endTime: "09:00",
    display: "8:00 AM - 9:00 AM"
  },
  // ...more slots
]
```

#### `checkSlotAvailability(clinicId, date, startTime, endTime)`
Checks if a time slot is available.

**Returns**: `true` if available, `false` if conflict

#### `bookAppointmentWithTimeSlot(appointmentData)`
Books a new appointment with availability check.

**Throws**: Error if slot is no longer available

#### `approveAppointment(appointmentId)`
Approves an appointment with availability re-check.

**Throws**: Error if slot is no longer available

#### `extendAppointment(appointmentId, newEndTime)`
Extends appointment duration with conflict check.

**Throws**: Error if extension conflicts with another appointment

## User Flows

### Pet Owner Booking Flow

1. Visit clinic details page
2. Click "Book Appointment" button
3. Select pet and future date
4. System shows available time slots (greyed out if booked)
5. Select an available time slot
6. Add reason, service, and notes (optional)
7. Confirm booking
8. Appointment created with "pending" status
9. Wait for clinic approval

### Clinic Owner Approval Flow

1. View appointments for selected clinic
2. See pending appointments
3. Click "Approve" on a pending appointment
4. System checks if slot is still available
5. If available: Appointment approved, pet owner notified
6. If not available: Error shown, appointment remains pending

### Clinic Owner Extension Flow

1. View confirmed appointments
2. Click "Extend" on an appointment
3. Select new end time (must be after original end time)
4. System checks if extended time conflicts
5. If no conflict: Appointment extended
6. If conflict: Error shown, appointment unchanged

### Working Hours Setup Flow

1. Navigate to Clinic Appointments or Edit Clinic page
2. Click "Manage Working Hours" button
3. Set opening and closing times
4. Save hours
5. Hours immediately affect available time slots for future bookings

## Firestore Rules

### Appointments
- **Read**: Pet owner or clinic owner only
- **Create**: Pet owners can create with "pending" status
- **Update**: 
  - Pet owners can cancel their own appointments
  - Clinic owners can update appointments at their clinics
- **Delete**: Clinic owners only

### Working Hours
- **Read**: Any authenticated user
- **Write**: Clinic owner only

### Example Rules
```javascript
// Only clinic owners can update working hours
match /clinics/{clinicId}/settings/{settingId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && 
    get(/databases/$(database)/documents/clinics/$(clinicId)).data.ownerId == request.auth.uid;
}

// Pet owners can create appointments
match /appointments/{appointmentId} {
  allow create: if isAuthenticated() && 
    request.auth.uid == request.resource.data.ownerUid &&
    request.resource.data.status == 'pending';
}
```

## Technical Details

### Time Format
- All times use 24-hour format: "HH:mm" (e.g., "14:30")
- Dates use ISO format: "YYYY-MM-DD"

### Slot Duration
- Fixed 1-hour intervals
- Cannot book partial hours
- Extensions can be any duration (30-minute increments suggested)

### Conflict Detection Algorithm
```javascript
function hasOverlap(slot1, slot2) {
  const start1 = parseTime(slot1.startTime);
  const end1 = parseTime(slot1.endTime);
  const start2 = parseTime(slot2.startTime);
  const end2 = parseTime(slot2.endTime);
  
  return start1 < end2 && end1 > start2;
}
```

### Performance Considerations
- Availability checks query only appointments for specific clinic and date
- Uses Firestore compound queries for efficiency
- Checks performed both client-side and during booking/approval

## Error Handling

### Common Errors

**"This time slot is no longer available"**
- Another appointment was booked in the meantime
- Solution: Select a different time slot

**"Cannot extend appointment. The extended time slot conflicts"**
- Extension would overlap with another appointment
- Solution: Choose a shorter extension or different end time

**"End time must be after start time"**
- Invalid time range
- Solution: Select proper start/end times

**"Working hours must be at least 1 hour"**
- Invalid working hours range
- Solution: Set hours with minimum 1-hour difference

## Testing Scenarios

### Test 1: Concurrent Booking Prevention
1. Two users try to book the same slot simultaneously
2. First submission succeeds
3. Second submission fails with availability error

### Test 2: Approval After Slot Taken
1. User A books slot 09:00-10:00 (pending)
2. User B books slot 09:00-10:00 (pending)
3. Clinic approves User A's appointment
4. Clinic tries to approve User B's appointment → Error (slot taken)

### Test 3: Extension Conflict
1. Appointment A: 09:00-10:00 (confirmed)
2. Appointment B: 10:00-11:00 (confirmed)
3. Try to extend A to 10:30 → Error (conflicts with B)

### Test 4: Working Hours Update
1. Set working hours to 08:00-17:00
2. Available slots: 08:00-09:00, 09:00-10:00, ..., 16:00-17:00
3. Update working hours to 09:00-15:00
4. New available slots reflect updated hours

## Future Enhancements

### Potential Features
1. **Break Times**: Support for lunch breaks or non-working periods
2. **Variable Slot Duration**: Allow 30-minute or 2-hour appointments
3. **Recurring Appointments**: Weekly/monthly recurring appointments
4. **Waitlist**: Automatically notify when a slot becomes available
5. **Multiple Locations**: Different working hours for different clinic branches
6. **Veterinarian-Specific Slots**: Assign appointments to specific vets
7. **Buffer Time**: Automatic gaps between appointments for cleanup
8. **Appointment Reminders**: Email/SMS notifications before appointments
9. **Calendar Integration**: Export to Google Calendar, iCal
10. **Walk-in Queue**: Manage walk-in patients alongside appointments

## Troubleshooting

### Slots Not Showing
- Check if working hours are set
- Verify date is in the future
- Check if all slots are booked

### Cannot Approve Appointment
- Verify you're the clinic owner
- Check if slot is still available
- Ensure appointment is in "pending" status

### Extension Not Working
- Check if new end time is valid
- Verify no conflicts with other appointments
- Ensure appointment is "confirmed"

## API Reference

### Component Props

#### BookAppointmentWithTimeSlot
```typescript
interface BookAppointmentWithTimeSlotProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}
```

#### WorkingHoursModal
```typescript
interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinicId: string;
  clinicName: string;
}
```

#### ExtendAppointmentModal
```typescript
interface ExtendAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
}
```

## Support

For issues or questions:
1. Check this documentation
2. Review console logs for error details
3. Verify Firestore rules are deployed
4. Check network tab for failed requests
5. Ensure working hours are configured

---

**Version**: 1.0  
**Last Updated**: November 22, 2025  
**Status**: Production Ready ✅
