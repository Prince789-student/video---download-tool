/**
 * Firebase Authentication & Firestore Configuration for OmniStream Pro
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Click "Add project" (Free Spark Plan).
 * 3. Go to "Authentication" -> "Sign-in method" -> Enable "Google".
 * 4. Go to "Firestore Database" -> "Create database" (Start in production or test mode).
 * 5. Go to Project Settings -> General -> "Your apps" -> Click "</>" (Web) -> Copy config below.
 * 6. Replace the placeholder values below with your Firebase credentials.
 */

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Global Auth State
window.currentUser = null;
window.firebaseInitialized = false;

// Initialize Firebase
function initFirebaseApp() {
  const config = window.FIREBASE_CONFIG;
  const isConfigured = config && config.apiKey && !config.apiKey.includes('YOUR_FIREBASE');

  if (isConfigured && typeof firebase !== 'undefined') {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      window.firebaseInitialized = true;
      console.log('[Firebase] Initialized successfully');

      // Listen to Auth State Changes
      firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
          // Fetch existing Firestore profile
          let userProfile = {
            uid: user.uid,
            displayName: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || '',
            phoneNumber: user.phoneNumber || ''
          };

          try {
            const doc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (doc.exists) {
              userProfile = { ...userProfile, ...doc.data() };
            }
          } catch (e) {
            console.warn('[Firestore] Could not load profile from cloud, using auth data:', e.message);
          }

          window.currentUser = userProfile;
          localStorage.setItem('omnistream_user', JSON.stringify(userProfile));
          window.dispatchEvent(new CustomEvent('auth:login', { detail: userProfile }));

          // If phone number is missing, prompt user to complete profile
          if (!userProfile.phoneNumber) {
            window.dispatchEvent(new CustomEvent('auth:require_profile', { detail: userProfile }));
          }
        } else {
          window.currentUser = null;
          localStorage.removeItem('omnistream_user');
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      });
    } catch (err) {
      console.error('[Firebase Init Error]', err);
    }
  } else {
    // Demo / Local Mode (Loads cached user or allows instant demo sign-in)
    const cached = localStorage.getItem('omnistream_user');
    if (cached) {
      try {
        window.currentUser = JSON.parse(cached);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('auth:login', { detail: window.currentUser }));
        }, 100);
      } catch (e) {}
    }
  }
}

// Google Sign-In Trigger
async function loginWithGoogle() {
  if (window.firebaseInitialized && typeof firebase !== 'undefined') {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    try {
      const result = await firebase.auth().signInWithPopup(provider);
      return result.user;
    } catch (error) {
      console.error('[Google Sign-In Error]', error);
      throw error;
    }
  } else {
    // Interactive Demo Sign-in for immediate testing before keys are pasted
    const demoName = prompt("Enter your Name for Google Sign-In (Firebase Config Mode):", "Prince Kumar");
    if (!demoName) return null;
    const demoEmail = prompt("Enter your Email:", "prince@gmail.com") || "prince@gmail.com";

    const demoUser = {
      uid: 'demo_' + Date.now(),
      displayName: demoName,
      email: demoEmail,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoName)}`,
      phoneNumber: ''
    };

    window.currentUser = demoUser;
    localStorage.setItem('omnistream_user', JSON.stringify(demoUser));
    window.dispatchEvent(new CustomEvent('auth:login', { detail: demoUser }));
    window.dispatchEvent(new CustomEvent('auth:require_profile', { detail: demoUser }));
    return demoUser;
  }
}

// Save User Profile (Name + Phone Number)
async function updateUserProfile(name, phone) {
  if (!window.currentUser) return;

  window.currentUser.displayName = name;
  window.currentUser.phoneNumber = phone;
  localStorage.setItem('omnistream_user', JSON.stringify(window.currentUser));

  // Sync with Firestore if Firebase is connected
  if (window.firebaseInitialized && typeof firebase !== 'undefined') {
    try {
      await firebase.firestore().collection('users').doc(window.currentUser.uid).set({
        displayName: name,
        phoneNumber: phone,
        email: window.currentUser.email,
        photoURL: window.currentUser.photoURL,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log('[Firestore] User profile synced successfully');
    } catch (e) {
      console.warn('[Firestore] Profile sync warning:', e.message);
    }
  }

  window.dispatchEvent(new CustomEvent('auth:profile_updated', { detail: window.currentUser }));
}

// Logout Trigger
async function logoutUser() {
  if (window.firebaseInitialized && typeof firebase !== 'undefined') {
    await firebase.auth().signOut();
  }
  window.currentUser = null;
  localStorage.removeItem('omnistream_user');
  window.dispatchEvent(new CustomEvent('auth:logout'));
}

// Initialize when scripts are ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFirebaseApp);
} else {
  initFirebaseApp();
}
