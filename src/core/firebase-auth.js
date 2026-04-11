import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBxV-rLc-Wf9R2pv1zGlklzJFBIkhFLHzk',
  authDomain: 'eventmanagerdavidtbilisi.firebaseapp.com',
  projectId: 'eventmanagerdavidtbilisi',
  storageBucket: 'eventmanagerdavidtbilisi.firebasestorage.app',
  messagingSenderId: '377277020601',
  appId: '1:377277020601:web:e24e2cd745eab8f605de68',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: 'select_account' })

export function signInWithGoogle() {
  return signInWithPopup(auth, provider)
}

export function signOutUser() {
  return signOut(auth)
}

export function onAuthUserChanged(callback) {
  return onAuthStateChanged(auth, callback)
}

export function getCurrentUser() {
  return auth.currentUser
}

export function getFirestoreDb() {
  return db
}

export function getFirebaseProjectId() {
  return firebaseConfig.projectId
}

export async function saveUserData(key, value) {
  const user = auth.currentUser
  if (!user) return
  await setDoc(doc(db, 'users', user.uid, 'data', key), { v: JSON.stringify(value || {}) })
}

export async function loadUserData(key) {
  const user = auth.currentUser
  if (!user) return null

  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'data', key))
    if (!snap.exists()) return null
    return JSON.parse(snap.data().v)
  } catch {
    return null
  }
}
