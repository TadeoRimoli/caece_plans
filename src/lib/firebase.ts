import { initializeApp } from "firebase/app"
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

const provider = new GoogleAuthProvider()

export const loginWithGoogle = async (useRedirect = false): Promise<User | null> => {
  if (useRedirect) {
    await signInWithRedirect(auth, provider)
    return null
  } else {
    const result = await signInWithPopup(auth, provider)
    return result.user
  }
}

export const getRedirectUser = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth)
    return result?.user ?? null
  } catch (err) {
    console.error("Error en getRedirectUser:", err)
    return null
  }
}

export async function logout() {
  return signOut(auth)
}
