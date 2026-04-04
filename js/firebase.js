import { initializeApp }                                              from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut,
         onAuthStateChanged }                                          from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc }                          from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBxV-rLc-Wf9R2pv1zGlklzJFBIkhFLHzk",
  authDomain:        "eventmanagerdavidtbilisi.firebaseapp.com",
  projectId:         "eventmanagerdavidtbilisi",
  storageBucket:     "eventmanagerdavidtbilisi.firebasestorage.app",
  messagingSenderId: "377277020601",
  appId:             "1:377277020601:web:e24e2cd745eab8f605de68",
};

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

// ── Public API (used by non-module scripts) ────────────────────────────────
window.fbUser    = null;
window.fbSignIn  = () => signInWithPopup(auth, provider).catch(() => showToast('Sign-in failed'));
window.fbSignOut = () => signOut(auth);

window.fbSave = (key, obj) => {
  if (!auth.currentUser) return;
  setDoc(doc(db, 'users', auth.currentUser.uid, 'data', key), { v: JSON.stringify(obj) })
    .catch(console.error);
};

window.fbLoad = async (key) => {
  if (!auth.currentUser) return null;
  try {
    const snap = await getDoc(doc(db, 'users', auth.currentUser.uid, 'data', key));
    return snap.exists() ? JSON.parse(snap.data().v) : null;
  } catch { return null; }
};

// ── Auth state ─────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async user => {
  window.fbUser = user;
  updateAuthUI(user);
  if (user) await pullOrPush(user);
});

const ALL_DECKS  = ['major','sem3','months','clocks','calendar','bibleoverview','biblebooks','binary','pao'];
const NON_MAJOR  = ALL_DECKS.filter(d => d !== 'major');

async function pullOrPush() {
  // Fetch everything in one round-trip
  const [majorAssoc, cloudAnalytics, cloudDeckStats, ...rest] = await Promise.all([
    window.fbLoad('major_assoc'),
    window.fbLoad('analytics'),
    window.fbLoad('deckStats'),
    ...NON_MAJOR.map(d => window.fbLoad(d + '_edits')),
    ...ALL_DECKS.map(d => window.fbLoad('weights_' + d)),
  ]);
  const nonMajorEdits = rest.slice(0, NON_MAJOR.length);
  const cloudWeights  = rest.slice(NON_MAJOR.length);

  // ── Major associations ──────────────────────────────────────────────────
  if (majorAssoc) {
    const clean = Object.fromEntries(Object.entries(majorAssoc).filter(([, v]) => v && v.trim()));
    localStorage.setItem(LS_KEY, JSON.stringify(clean));
  } else {
    const local  = localStorage.getItem(LS_KEY);
    const toSave = { ...DEFAULTS, ...(local ? JSON.parse(local) : {}) };
    window.fbSave('major_assoc', toSave);
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
  }

  // ── Non-major deck edits ────────────────────────────────────────────────
  NON_MAJOR.forEach((d, i) => {
    const lsKey = DECK_LS_KEYS[d];
    if (nonMajorEdits[i]) {
      localStorage.setItem(lsKey, JSON.stringify(nonMajorEdits[i]));
    } else {
      const local = localStorage.getItem(lsKey);
      if (local) window.fbSave(d + '_edits', JSON.parse(local));
    }
  });

  // ── Weights ─────────────────────────────────────────────────────────────
  ALL_DECKS.forEach((d, i) => {
    if (cloudWeights[i]) {
      localStorage.setItem('weights_' + d, JSON.stringify(cloudWeights[i]));
    } else {
      const local = localStorage.getItem('weights_' + d);
      if (local) window.fbSave('weights_' + d, JSON.parse(local));
    }
  });

  // ── Analytics (cross-device sync) ──────────────────────────────────────
  if (window.loadAnalyticsFromCloud) {
    window.loadAnalyticsFromCloud(cloudAnalytics, cloudDeckStats);
  }

  loadData();
  showToast('Synced ☁');
}

function updateAuthUI(user) {
  const signedOut = document.getElementById('auth-signed-out');
  const signedIn  = document.getElementById('auth-signed-in');
  const nameEl    = document.getElementById('auth-name');
  if (!signedOut) return;
  if (user) {
    signedOut.style.display = 'none';
    signedIn.style.display  = 'flex';
    nameEl.textContent = user.displayName || user.email;
  } else {
    signedOut.style.display = 'flex';
    signedIn.style.display  = 'none';
  }
}
