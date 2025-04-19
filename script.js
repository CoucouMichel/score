// script.js - Firebase Auth Integration (Module Version)

// --- Firebase Initialization (ES Module Version) ---
// Import functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Your web app's Firebase configuration (PASTE YOUR OBJECT HERE)
// !! IMPORTANT: Replace with the actual config from your Firebase Console !!
const firebaseConfig = {
  apiKey: "AIzaSyAi_qvjnZlDo6r0Nu14JPs1XAvu_bRQmoM", // Use YOUR actual key
  authDomain: "oddscore-5ed5e.firebaseapp.com",    // Use YOUR domain
  projectId: "oddscore-5ed5e",                    // Use YOUR ID
  storageBucket: "oddscore-5ed5e.firebasestorage.app", // Use YOUR bucket
  messagingSenderId: "582289870654",              // Use YOUR sender ID
  appId: "1:582289870654:web:bb025764a8d37f697f266f",  // Use YOUR App ID
  measurementId: "G-HCKHYJ0HZD"                  // Optional (keep if provided)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized (module mode)!");

// Get references to Firebase services
const auth = getAuth(app); // Use getAuth()
const db = getFirestore(app); // Use getFirestore()


// --- Authentication Logic ---

// Get Auth UI elements (Check if elements exist before adding listeners)
const authSection = document.getElementById('auth-section');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const userInfo = document.getElementById('user-info');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const loginErrorP = document.getElementById('login-error');
const showSignupButton = document.getElementById('show-signup');
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signupButton = document.getElementById('signup-button');
const signupErrorP = document.getElementById('signup-error');
const showLoginButton = document.getElementById('show-login');
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');

let currentUserId = null; // Store the logged-in user's ID

// Auth State Listener
onAuthStateChanged(auth, user => { // Use onAuthStateChanged directly
    if (loginErrorP) loginErrorP.textContent = ''; // Clear errors
    if (signupErrorP) signupErrorP.textContent = '';

    if (user) {
        // User is signed in
        console.log("User logged in:", user.email, user.uid);
        currentUserId = user.uid;
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        if(loginForm) loginForm.style.display = 'none';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'block';
        if(authSection) {
            authSection.style.border = 'none'; // Optional: Hide section styling when logged in
            authSection.style.boxShadow = 'none';
            authSection.style.background = 'none';
            authSection.style.padding = '0 0 1.5rem 0'; // Adjust padding when logged in
        }

        // TODO: Load user-specific picks from Firestore here!
        loadUserPicksFromFirestore(user.uid); // We'll implement this next

    } else {
        // User is signed out
        console.log("User logged out");
        currentUserId = null;
        if(userEmailSpan) userEmailSpan.textContent = '';
        if(loginForm) loginForm.style.display = 'block'; // Show login form by default
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'none';
         if(authSection) { // Restore section styling
             authSection.style.border = '1px solid var(--divider-color)';
             authSection.style.boxShadow = 'var(--elevation-1)';
             authSection.style.background = 'var(--card-background-color)';
             authSection.style.padding = '1.5rem';
         }

        // Clear any user-specific data
        userSelections = {}; // Clear local selections object
        localStorage.removeItem('footballGameSelections'); // Clear storage backup if used
        generateCalendar(); // Refresh calendar to remove pick status
        updateDisplayedFixtures(); // Refresh fixture list
    }
});

// --- Event Listeners for Auth Forms/Buttons ---
// Need null checks in case elements aren't found
if (showSignupButton) {
    showSignupButton.addEventListener('click', () => {
        if(loginForm) loginForm.style.display = 'none';
        if(signupForm) signupForm.style.display = 'block';
        if(loginErrorP) loginErrorP.textContent = '';
    });
}

if (showLoginButton) {
    showLoginButton.addEventListener('click', () => {
        if(loginForm) loginForm.style.display = 'block';
        if(signupForm) signupForm.style.display = 'none';
        if(signupErrorP) signupErrorP.textContent = '';
    });
}

if (loginButton) {
    loginButton.addEventListener('click', () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        if(loginErrorP) loginErrorP.textContent = '';

        signInWithEmailAndPassword(auth, email, password) // Use imported function
            .then((userCredential) => { console.log("Login successful", userCredential.user); })
            .catch((error) => {
                console.error("Login Error:", error.code, error.message);
                if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(error)}`;
            });
    });
}

if (signupButton) {
    signupButton.addEventListener('click', () => {
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        if(signupErrorP) signupErrorP.textContent = '';

        createUserWithEmailAndPassword(auth, email, password) // Use imported function
            .then((userCredential) => { console.log("Signup successful", userCredential.user); })
            .catch((error) => {
                console.error("Signup Error:", error.code, error.message);
                 if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(error)}`;
            });
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOut(auth).catch((error) => { // Use imported function
            console.error("Logout Error:", error);
            alert("Error logging out.");
        });
    });
}

// Helper for friendlier error messages (optional)
function getFriendlyAuthError(error) {
    switch (error.code) {
        case 'auth/invalid-email': return 'Invalid email format.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/weak-password': return 'Password should be at least 6 characters.';
        case 'auth/email-already-in-use': return 'This email is already registered.';
        case 'auth/operation-not-allowed': return 'Email/password sign-in not enabled.'; // Should be enabled in Firebase console
        default: return error.message;
    }
}


// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;
function getDateString(date) { /* ... keep function ... */ }
const flagCodeMap = { /* ... keep map ... */ };
function getFlagUrl(countryName) { /* ... keep function ... */ }

// --- Fake Fixtures Data ---
const fakeFixtures = [ /* ... PASTE YOUR EXPANDED FAKE FIXTURES ARRAY HERE ... */
    { fixtureId: 101, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() + 2 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 1, name: "Man Reds" }, awayTeam: { id: 2, name: "Lon Blues" }, odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.8 }, result: null },
    { fixtureId: 305, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() - 1 * oneDay + 18.5 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 56, name: "Leipzig Bulls" }, awayTeam: { id: 57, name: "Hoffenheim Village" }, odds: { homeWin: 1.8, draw: 4.0, awayWin: 4.2 }, result: { homeScore: 2, awayScore: 2 } },
    // ... include all ~30 fixtures ...
];


// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks loaded for the CURRENT user
// scoreHistory remains unused for now

// --- DOM Element References (Non-Auth) ---
const weekViewContainer = document.getElementById('week-view');
const fixtureListDiv = document.getElementById('fixture-list');
const leagueSlicerContainer = document.getElementById('league-slicer-container');
const scoreListUl = document.getElementById('score-list');

// --- Core Game Functions ---

function generateCalendar() { /* ... keep function from response #55 ... */ }
function populateDailyLeagueSlicers() { /* ... keep function from response #55 ... */ }
function handleSlicerClick(event) { /* ... keep function from response #55 ... */ }
function updateDisplayedFixtures() { /* ... keep function from response #55 ... */ }
function displayFixtures(fixtures, currentTime) { /* ... keep function from response #59 ... */ }

// MODIFIED handleSelection to include Auth Check
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    // Check if user is logged in before allowing pick
    if (!auth.currentUser) {
         alert("Please log in or sign up to make a pick!");
         return; // Stop if not logged in
    }
    // If logged in, proceed with existing logic...
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();

    // Check if pick is locked
    const existingSelection = userSelections[selectedDateStr];
    if (existingSelection) {
        const existingFixture = fakeFixtures.find(f => f.fixtureId === existingSelection.fixtureId);
        if (existingFixture && new Date(existingFixture.kickOffTime) <= realCurrentTime) {
            alert(`Your pick (${existingSelection.teamName}) for ${selectedDateStr} is locked because the match has started.`);
            return;
        }
    }

    // Check if clicked game started
    const clickedFixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
    if (!clickedFixture) return;
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) {
        alert("This match has already started, you cannot select it.");
        return;
    }

    // Handle Select / Deselect / Overwrite
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        console.log(`Deselecting team ${teamId} for ${selectedDateStr}`);
        delete userSelections[selectedDateStr];
        // TODO: Delete pick from Firestore
        // deletePickFromFirestore(auth.currentUser.uid, selectedDateStr);
    } else {
        console.log(`Selected/Changed to team ${teamId} (Fixture ${fixtureId}) for ${selectedDateStr}`);
        const newSelection = {
            fixtureId: fixtureId, teamId: teamId, teamName: teamName,
            selectedWinOdd: teamWinOdd, fixtureDrawOdd: drawOdd,
            selectionTime: realCurrentTime.toISOString(),
            // Add userId when saving to Firestore
            // userId: auth.currentUser.uid
        };
        userSelections[selectedDateStr] = newSelection; // Update local state immediately
        // TODO: Save pick to Firestore
        // savePickToFirestore(auth.currentUser.uid, selectedDateStr, newSelection);
    }

    saveUserDataToLocal(); // Save to localStorage temporarily
    generateCalendar();
    updateDisplayedFixtures();
}

function calculateScore(selection, fixture) { /* ... keep function from response #59 ... */ }

// Renamed to avoid confusion with potential Firestore loading
function loadUserDataFromLocal() {
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) {
        try { userSelections = JSON.parse(savedSelections); }
        catch (e) { console.error("Error parsing saved selections:", e); userSelections = {}; }
    } else { userSelections = {}; }
    // This only loads YOUR picks from the browser it was saved on
    // It will be overwritten when real Firestore loading is implemented
}

// Renamed to avoid confusion
function saveUserDataToLocal() {
    // We'll replace this with Firestore saving soon
    try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
    catch (e) { console.error("Error saving selections to localStorage:", e); }
}

// --- Placeholder functions for Firestore interaction (To be implemented next) ---
function loadUserPicksFromFirestore(userId) {
    console.log(`TODO: Load picks for user ${userId} from Firestore`);
    // This function will query Firestore and update the global 'userSelections' object
    // For now, it does nothing, so only localStorage picks show (if any)
    // We might want to clear local state here before loading from DB:
    // userSelections = {};
    // generateCalendar();
    // updateDisplayedFixtures();
}

/* // Example structure for saving (we'll implement properly later)
async function savePickToFirestore(userId, dateStr, selectionData) {
    const pickDocRef = db.collection('picks').doc(`${userId}_${dateStr}`); // Example doc ID
    try {
        await pickDocRef.set({ ...selectionData, userId: userId, date: dateStr });
        console.log("Pick saved to Firestore");
    } catch (error) {
        console.error("Error saving pick: ", error);
        alert("Could not save your pick. Please try again.");
    }
}

async function deletePickFromFirestore(userId, dateStr) {
     const pickDocRef = db.collection('picks').doc(`${userId}_${dateStr}`);
     try {
        await pickDocRef.delete();
        console.log("Pick deleted from Firestore");
    } catch (error) {
        console.error("Error deleting pick: ", error);
        alert("Could not remove your pick. Please try again.");
    }
}
*/


// --- Initialization ---
// DOMContentLoaded might still be useful to ensure elements exist before adding listeners
document.addEventListener('DOMContentLoaded', () => {
    // Auth listeners are set up outside/above based on element existence
    // Load initial state (will be overwritten by onAuthStateChanged if user logs in)
    loadUserDataFromLocal();
    generateCalendar();
    populateDailyLeagueSlicers();
    updateDisplayedFixtures();
});
