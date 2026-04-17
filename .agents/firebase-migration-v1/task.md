# Task Tracking: Firebase Migration

- [x] Firebase Initialization
    - [x] Create `src/lib/firebase.ts` (Client)
    - [x] Create `src/lib/firebase-admin.ts` (Server)
    - [x] Create `src/app/api/auth/firebase-token/route.ts`
- [x] Messaging Migration
    - [x] Update `POST /api/conversations/[id]/messages` to write to Firestore
    - [x] Update `src/app/(public)/messages/page.tsx` for Firestore listeners
    - [x] Update `useUnreadMessages` hook
- [x] Notifications Migration
    - [x] Create `public/firebase-messaging-sw.js`
    - [x] Create `FirebaseProvider`
    - [x] Update `NotificationBell` for FCM
    - [x] Replace `socketService.notifyUser` with FCM logic
- [x] Optimization & Cleanup
    - [x] Replace polling in `useUnreadNotifications`
    - [x] Remove Socket.io dependencies and files
    - [x] Final verification
