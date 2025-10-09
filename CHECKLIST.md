# 📝 VetConnect 30-Day Development Checklist

## 🗓 Week 1: Core Setup & Authentication ✅
**Goal:** Solid foundation, working auth flow, role-based routing.

- [ ] Day 1: Create Firebase project + enable Auth, Firestore, Storage, Hosting + initialize React project
- [ ] Day 2: Build AuthContext, setup ProtectedRoutes + routing
- [ ] Day 3: Implement registration with role selection + save to Firestore
- [ ] Day 4: Implement login flow with role-based redirects
- [ ] Day 5: Setup basic UI layouts (sidebar + dashboard shell)
- [ ] Day 6: Create Firestore structure + security rules for user roles
- [ ] Day 7: Test registration/login + deploy initial build to Firebase Hosting

🔸 **Deliverable:**  
Working auth ✅ • Role-based dashboards showing placeholder content

---

## 🏥 Week 2: Clinic Search, CRUD & Bookmarks 🚧
**Goal:** Clinic Owners manage clinics • Pet Owners search & bookmark.

- [ ] Day 8: Setup clinics collection + Clinic Owner Dashboard UI
- [ ] Day 9: Implement Clinic Create/Edit/Delete forms
- [ ] Day 10: Build public clinic listing for Pet Owners
- [ ] Day 11: Implement search by name/location/services
- [ ] Day 12: Emergency “Find Nearest Clinic” simulation
- [ ] Day 13: Add Bookmarking (users/{userId}/bookmarks/{clinicId})
- [ ] Day 14: Build Bookmarks page for Pet Owners

🔸 **Deliverable:**  
Clinic CRUD works ✅ • Pet Owners can search & bookmark clinics

---

## 📅 Week 3: Appointments, Ratings & Profile
**Goal:** Full booking flow + feedback loop.

- [ ] Day 15: Design appointments collection structure
- [ ] Day 16: Implement appointment booking modal/button
- [ ] Day 17: Clinic Dashboard appointment list/calendar
- [ ] Day 18: Pet Owner Appointment History page
- [ ] Day 19: Implement ratings & reviews after appointments
- [ ] Day 20: Build User Profile Page (name, photo, pets)
- [ ] Day 21: Internal testing of booking flow and ratings

🔸 **Deliverable:**  
Appointments ✅ • Ratings ✅ • Profile management ✅

---

## 🔔 Week 4: Notifications, QA & Polish
**Goal:** Real-time notifications + polish + deploy.

- [ ] Day 22: Setup Firebase Cloud Messaging (FCM)
- [ ] Day 23: Implement booking/appointment notifications
- [ ] Day 24: Notification storage (notifications collection)
- [ ] Day 25: UI polish — loading/error/empty states
- [ ] Day 26: Review & tighten Firestore security rules
- [ ] Day 27: Final bug fixing & testing
- [ ] Day 28: Deploy final version to Firebase Hosting
- [ ] Day 29: Prepare presentation/demo deck
- [ ] Day 30: Launch Day 🚀

🔸 **Deliverable:**  
Live prototype ✅ • Notifications ✅ • Clean UI ✅

---

## 📂 Firebase Collections Summary
- `users` — Role, profile info  
- `clinics` — Clinic info, subcollections: services, vets  
- `appointments` — Booking records  
- `ratings` — Reviews from users to clinics  
- `users/{userId}/bookmarks` — Bookmarked clinics  
- `notifications` — Stored notification data for both roles

---

## 🧠 Developer Notes
- Focus on core flows before fancy UI.  
- Use Firestore emulator locally to save quota.  
- Modularize components early.  
- Document collections and routes as you build.

---
