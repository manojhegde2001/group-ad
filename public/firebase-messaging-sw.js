importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBaCwj4yN0ptt4CPgdIoAv0ykHN3uZQU8o",
  authDomain: "group-ad.firebaseapp.com",
  projectId: "group-ad",
  storageBucket: "group-ad.firebasestorage.app",
  messagingSenderId: "197438417852",
  appId: "1:197438417852:web:15790a6531ef95916499b9",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/auth/logo-small.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
