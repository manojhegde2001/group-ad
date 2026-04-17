# Implementation Plan: Firebase Messaging & Notifications Migration

Transition the application's real-time infrastructure from Socket.io to Firebase (Firestore & FCM) for improved scalability, reliable push notifications, and production readiness on Vercel.

## User Review Required

> [!IMPORTANT]
> **Firebase Service Account**: Ensure `FIREBASE_PRIVATE_KEY` in `.env` is the full private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`. If it contains newlines, ensure they are handled correctly (usually `\n`).

> [!WARNING]
> This change will completely remove Socket.io. Local development will no longer require a custom `server.ts` for sockets, and the app will match the Vercel production environment more closely.

## Proposed Changes

---

### [Component] Firebase Initialization & Core

#### [NEW] [firebase.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/lib/firebase.ts)
- Initialize client-side Firebase App, Auth, Firestore, and Messaging.
- Export shared instances.

#### [NEW] [firebase-admin.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/lib/firebase-admin.ts)
- Initialize `firebase-admin` for server-side operations (FCM, Custom Tokens).
- Handle Service Account credentials from environment variables.

#### [NEW] [firebase-provider.tsx](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/components/providers/firebase-provider.tsx)
- React Context Provider to handle Firebase Auth state (sign in with custom token).
- Handle FCM token registration and permission requests.
- Provide real-time messaging listener state.

#### [NEW] [firebase-token/route.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/app/api/auth/firebase-token/route.ts)
- Endpoint to generate Firebase Custom Tokens for authenticated NextAuth users.

---

### [Component] Messaging & Real-time Listeners

#### [MODIFY] [route.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/app/api/conversations/%5Bid%5D/messages/route.ts)
- Update `POST` to write new messages to Firestore in addition to Prisma.
- Remove `socketService.emitMessage`.

#### [MODIFY] [page.tsx](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/app/%28public%29/messages/page.tsx)
- Replace `useSocket` with Firestore `onSnapshot` listener.
- Synchronize Firestore messages with the UI.

#### [MODIFY] [use-unread-notifications.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/hooks/use-unread-notifications.ts)
- Remove polling (`refetchInterval`).
- Use Firestore listener for the `notifications` collection (filtered by `userId`).

---

### [Component] Notifications (FCM)

#### [NEW] [firebase-messaging-sw.js](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/public/firebase-messaging-sw.js)
- Service Worker to handle background push notifications.

#### [MODIFY] [notification-bell.tsx](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/components/notifications/notification-bell.tsx)
- Replace socket listeners with FCM foreground message handling.

#### [MODIFY] [route.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/app/api/users/%5Bid%5D/follow/route.ts) (and similar notification-triggering routes)
- Replace `socketService.notifyUser` with FCM notification logic via `firebase-admin`.

---

### [Component] Cleanup & Finalization

#### [DELETE] [socket-provider.tsx](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/components/providers/socket-provider.tsx)
#### [DELETE] [socket-io.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/lib/socket-io.ts)
#### [DELETE] [socket-service.ts](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/src/lib/socket-service.ts)

#### [MODIFY] [package.json](file:///c:/Users/Admin/MANOJ%20DEV/group-ad/package.json)
- Remove `socket.io` and `socket.io-client`.

## Open Questions

1. **Messaging Storage**: Do you prefer to keep using Prisma/MongoDB as the primary source of truth (persistence) and use Firestore only for delivering real-time updates, or should Firestore become the sole source of truth for messages? (Proposed: Mirroring for maximum compatibility).
2. **Notification History**: Should we store notification logs in Firestore as well, or keep them in MongoDB? (Proposed: Keep in MongoDB for history, use FCM for delivery).

## Verification Plan

### Automated Tests
- Check Firebase initialization logs in browser console.
- Verify Firestore network activity in Network tab.
- Test message delivery across two different browser sessions.
- Verify FCM token registration in Firestore/Console.

### Manual Verification
- Send a message from User A to User B and check for real-time update in User B's chat window.
- Send a connection request and verify FCM notification appears (foreground and background).
- Check browser Network tab for redundant API calls (ensure polling is gone).
