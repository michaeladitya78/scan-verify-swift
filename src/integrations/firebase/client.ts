// Firebase client initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
	apiKey: "AIzaSyCeXmJIw-oMOVccq33_1Nj3tjdkSOuN7jk",
	authDomain: "scan-verify.firebaseapp.com",
	projectId: "scan-verify",
	storageBucket: "scan-verify.firebasestorage.app",
	messagingSenderId: "141675485557",
	appId: "1:141675485557:web:87be6576736094f7801b3c",
	measurementId: "G-6DRK8X2TZ9",
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
