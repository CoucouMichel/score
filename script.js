// script.js - Firebase Auth Integration + Game Logic

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
    if(loginErrorP) loginErrorP.textContent = ''; // Clear errors
    if(signupErrorP) signupErrorP.textContent = '';

    if (user) {
        // User is signed in
        console.log("User logged in:", user.email, user.uid);
        currentUserId = user.uid;
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        if(loginForm) loginForm.style.display = 'none';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'block';
        // Optionally hide auth section styling
        if(authSection) {
            authSection.style.border = 'none';
            authSection.style.boxShadow = 'none';
            authSection.style.background = 'none';
            authSection.style.padding = '0 0 1.5rem 0';
        }

        // TODO: Load user-specific picks from Firestore here!
        loadUserPicksFromFirestore(user.uid); // Placeholder for next step

    } else {
        // User is signed out
        console.log("User logged out");
        currentUserId = null;
        if(userEmailSpan) userEmailSpan.textContent = '';
        if(loginForm) loginForm.style.display = 'block'; // Show login form
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'none';
        // Optionally restore auth section styling
         if(authSection) {
             authSection.style.border = '1px solid var(--divider-color)';
             authSection.style.boxShadow = 'var(--elevation-1)';
             authSection.style.background = 'var(--card-background-color)';
             authSection.style.padding = '1.5rem';
         }

        // Clear local data and refresh UI
        userSelections = {};
        localStorage.removeItem('footballGameSelections'); // Clear storage backup if used
        // Delay UI refresh slightly to ensure elements are ready if needed
        setTimeout(() => {
             generateCalendar();
             populateDailyLeagueSlicers(); // Re-pop needs recalculation based on day
             updateDisplayedFixtures();
        }, 0);
    }
});

// --- Event Listeners for Auth Forms/Buttons ---
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
        if (!loginEmailInput || !loginPasswordInput) return; // Ensure inputs exist
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
         if (!signupEmailInput || !signupPasswordInput) return; // Ensure inputs exist
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
        case 'auth/operation-not-allowed': return 'Email/password sign-in not enabled.';
        case 'auth/missing-password': return 'Please enter a password.';
        default: return 'An unknown error occurred.'; // Avoid showing raw message directly
    }
}

// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;
function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}
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
    // ADD THIS CHECK AT THE START:
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
        delete userSelections[selectedDateStr]; // Remove from local state
        // TODO: Delete pick from Firestore
        // deletePickFromFirestore(auth.currentUser.uid, selectedDateStr);
    } else {
        console.log(`Selected/Changed to team ${teamId} (Fixture ${fixtureId}) for ${selectedDateStr}`);
        const newSelection = {
            fixtureId: fixtureId, teamId: teamId, teamName: teamName,
            selectedWinOdd: teamWinOdd, fixtureDrawOdd: drawOdd,
            selectionTime: realCurrentTime.toISOString(),
            // Add userId when saving to Firestore
            userId: auth.currentUser.uid // Store user ID with selection
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

// Renamed: Loads from local storage only (will be replaced)
function loadUserDataFromLocal() {
    console.log("Loading selections from Local Storage (temporary)");
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) {
        try { userSelections = JSON.parse(savedSelections); }
        catch (e) { console.error("Error parsing saved selections:", e); userSelections = {}; }
    } else { userSelections = {}; }
    // Update UI after loading local data initially
    generateCalendar();
    updateDisplayedFixtures();
}

// Renamed: Saves only to local storage (will be replaced)
function saveUserDataToLocal() {
    console.log("Saving selections to Local Storage (temporary)");
    try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
    catch (e) { console.error("Error saving selections to localStorage:", e); }
}

// --- Placeholder function for Firestore interaction ---
function loadUserPicksFromFirestore(userId) {
    console.log(`TODO: Load picks for user ${userId} from Firestore and update userSelections object.`);
    // ---- IMPORTANT ----
    // For now, to avoid conflicts after login, let's clear local state
    // when a user logs in and Firestore loading *should* happen.
    // Once Firestore loading is implemented, it will populate this correctly.
    userSelections = {}; // Clear local state on login trigger
    console.log("Cleared local userSelections, waiting for Firestore load (not implemented yet).");
    // Refresh UI to show 'No Pick' based on cleared local state
    generateCalendar();
    updateDisplayedFixtures();
    // ---- END IMPORTANT ----

    // Real implementation will look something like:
    // const picksCol = collection(db, 'picks');
    // const q = query(picksCol, where("userId", "==", userId));
    // const querySnapshot = await getDocs(q);
    // const loadedPicks = {};
    // querySnapshot.forEach((doc) => {
    //   const data = doc.data();
    //   loadedPicks[data.date] = data;
    // });
    // userSelections = loadedPicks;
    // generateCalendar(); // Update UI with loaded picks
    // updateDisplayedFixtures();
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth listeners are set up above and handle initial UI state via onAuthStateChanged
    // Load initial data from local storage (will be cleared/overridden on login by onAuthStateChanged -> loadUserPicksFromFirestore)
    loadUserDataFromLocal();
    // Initial UI generation (will be updated by onAuthStateChanged if needed)
    // generateCalendar(); // Called by loadUserDataFromLocal & onAuthStateChanged
    populateDailyLeagueSlicers();
    // updateDisplayedFixtures(); // Called by loadUserDataFromLocal & onAuthStateChanged
});
