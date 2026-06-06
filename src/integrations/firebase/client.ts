// Firebase client initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCeXmJIw-oMOVccq33_1Nj3tjdkSOuN7jk",
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scan-verify.firebaseapp.com",
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scan-verify",
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scan-verify.firebasestorage.app",
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "141675485557",
	appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:141675485557:web:87be6576736094f7801b3c",
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-6DRK8X2TZ9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export let analytics: ReturnType<typeof getAnalytics> | null = null;
(async () => {
	try {
		if (typeof window !== "undefined" && (await isSupported())) {
			analytics = getAnalytics(app);
		}
	} catch {
		analytics = null;
	}
})();
