# Quick Start Guide: Appointment Scheduling System

## 🚀 Getting Started in 5 Minutes

### For Clinic Owners

#### 1. Set Your Working Hours (First Time Setup)
```
1. Login as clinic owner
2. Navigate to: Clinic Appointments or Edit Clinic page
3. Click: "Manage Working Hours" button (orange button in header)
4. Set: Opening time (e.g., 08:00)
5. Set: Closing time (e.g., 17:00)
6. Click: "Save Hours"
```

**Result**: Your clinic now accepts appointments from 8:00 AM to 5:00 PM in 1-hour slots.

#### 2. Manage Appointments
```
1. Navigate to: Clinic Appointments
2. Select: Your clinic
3. View: All pending, confirmed, and completed appointments
```

**Actions Available:**
- ✅ **Approve**: Click "Approve" on pending appointments
- ❌ **Reject**: Click "Reject" on pending appointments  
- ⏱️ **Extend**: Click "Extend" on confirmed appointments
- 📝 **Add Notes**: Click "Add Notes" to add clinic notes
- ✓ **Mark Done**: Click "Mark Done" when appointment is complete

### For Pet Owners

#### 1. Book an Appointment
```
1. Login as pet owner
2. Browse: Find a clinic on the map or search
3. Visit: Click on clinic to view details
4. Click: "Book Appointment" button
5. Follow: 3-step booking wizard
   - Step 1: Select pet and date
   - Step 2: Choose available time slot (green = available)
   - Step 3: Add details (optional)
6. Click: "Confirm Booking"
```

**Result**: Appointment created with "pending" status. Wait for clinic approval.

#### 2. Check Appointment Status
```
1. Navigate to: Pet Owner Dashboard
2. View: Your appointments section
3. Status: 
   - 🟡 Pending = Waiting for clinic approval
   - 🟢 Approved = Confirmed by clinic
   - 🔴 Rejected = Declined by clinic
```

---

## 📋 Common Scenarios

### Scenario 1: "I want to change my working hours"
```
1. Go to Edit Clinic page
2. Click "Working Hours" button
3. Update times
4. Save changes
```
**Note**: Only affects future bookings, not existing appointments.

### Scenario 2: "Appointment is taking longer than expected"
```
1. Go to Clinic Appointments
2. Find the appointment
3. Click "Extend"
4. Select new end time
5. System checks for conflicts
6. If clear, appointment extended
```
**Note**: Cannot extend if it conflicts with next appointment.

### Scenario 3: "Two appointments at the same time?"
```
This CANNOT happen! The system:
1. Checks availability when booking
2. Re-checks when approving
3. Prevents overlapping appointments
4. Shows "slot taken" error if conflict detected
```

### Scenario 4: "Pet owner books during closed hours"
```
This CANNOT happen! The system:
1. Reads your working hours
2. Only shows slots within those hours
3. Hides slots outside working hours
```

---

## ⚠️ Important Notes

### Working Hours
- **Minimum**: 1 hour per day
- **Maximum**: 16 hours per day
- **Format**: 24-hour (e.g., 14:00 = 2:00 PM)
- **Default**: 08:00 - 17:00 (if not set)

### Time Slots
- **Duration**: 1 hour (fixed)
- **Example**: 08:00-09:00, 09:00-10:00, etc.
- **Booking**: Can only book future dates
- **Extension**: Can extend in 30-minute increments

### Appointment Status Flow
```
Pet Owner Books → Pending
                    ↓
Clinic Approves → Approved/Confirmed
                    ↓
Appointment Day → Completed
```

### Availability
- ✅ **Available**: No appointments in that slot
- ❌ **Unavailable**: Slot has pending, approved, or confirmed appointment
- 🚫 **Cannot Book**: Slot is in the past or outside working hours

---

## 🐛 Troubleshooting

### "No time slots available"
**Possible Causes:**
1. Working hours not set → Go set working hours
2. All slots are booked → Try another date
3. Selected past date → Choose future date

**Solution**: Check working hours in Edit Clinic page.

### "Cannot approve appointment - slot taken"
**Cause**: Another appointment was approved in that slot first

**Solution**: 
1. Inform pet owner
2. Reject this appointment
3. Pet owner can book another slot

### "Cannot extend appointment"
**Cause**: Extension would overlap with next appointment

**Solution**:
1. Extend to just before next appointment, OR
2. Cancel/reschedule next appointment, OR
3. Keep original duration

### "Slot shows as unavailable but I don't see any appointment"
**Possible Causes:**
1. There's a pending appointment (not yet approved)
2. Another user just booked it
3. Cache issue

**Solution**: Refresh the page

---

## 📱 Quick Actions Reference

### Clinic Owner Dashboard
| Button | Location | Action |
|--------|----------|--------|
| Manage Working Hours | Header (Appointments/Edit) | Set clinic operating hours |
| Approve | Appointment card | Approve pending appointment |
| Reject | Appointment card | Reject pending appointment |
| Extend | Appointment card | Extend appointment duration |
| Add Notes | Appointment card | Add clinic notes |
| Mark Done | Appointment card | Mark as completed |

### Pet Owner Dashboard
| Button | Location | Action |
|--------|----------|--------|
| Book Appointment | Clinic Details | Start booking wizard |
| View Appointment | Dashboard | See appointment details |
| Cancel Appointment | Appointment details | Cancel booking |

---

## 🎯 Best Practices

### For Clinic Owners
1. ✅ Set working hours BEFORE accepting appointments
2. ✅ Review pending appointments daily
3. ✅ Add notes for follow-up appointments
4. ✅ Extend appointments as needed (with conflicts check)
5. ✅ Mark appointments as completed after finishing

### For Pet Owners
1. ✅ Book appointments in advance
2. ✅ Provide detailed reason for visit
3. ✅ Select appropriate service type
4. ✅ Add any special requirements in notes
5. ✅ Arrive on time for your slot

---

## 📞 Need Help?

### Check These First:
1. 📖 Full Documentation: `APPOINTMENT_SCHEDULING_DOCUMENTATION.md`
2. 📋 Summary: `APPOINTMENT_SCHEDULING_SUMMARY.md`
3. 💻 Code Comments: All functions have JSDoc comments

### Common Questions:

**Q: Can I have different hours for different days?**
A: Not yet. Current system uses same hours for all days.

**Q: Can I book 30-minute appointments?**
A: Not yet. All appointments are 1-hour slots. Can extend after booking.

**Q: What happens if I change working hours?**
A: Only affects new bookings. Existing appointments unchanged.

**Q: Can I book multiple slots at once?**
A: No. Book one slot per appointment. Can extend after approval.

**Q: Do I get notified when appointment is approved?**
A: Yes! Pet owners receive in-app notification immediately.

---

## ✅ Checklist: First Time Setup

### Clinic Owner Checklist
- [ ] Login to VetConnect
- [ ] Complete clinic registration (if not done)
- [ ] Set working hours
- [ ] Test booking an appointment (use test account)
- [ ] Practice approving an appointment
- [ ] Try extending an appointment
- [ ] Add notes to an appointment

### Pet Owner Checklist
- [ ] Login to VetConnect
- [ ] Add at least one pet
- [ ] Browse clinics on map
- [ ] View a clinic's details
- [ ] Check their working hours
- [ ] Book a test appointment
- [ ] Check appointment status

---

**Ready to use!** 🎉

Your appointment scheduling system is now fully operational. Start booking!
