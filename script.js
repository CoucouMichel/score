// script.js - FINAL - Firebase Auth + Firestore Fixture Reads + Firestore Pick Save/Load

// --- Firebase Initialization (ES Module Version) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// Import ALL needed Firestore functions
import { getFirestore, doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// !! IMPORTANT: Replace with the actual config from your Firebase Console !!
const firebaseConfig = {
  apiKey: "AIzaSyAi_qvjnZlDo6r0Nu14JPs1XAvu_bRQmoM", // Use YOUR actual key
  authDomain: "oddscore-5ed5e.firebaseapp.com",    // Use YOUR domain
  projectId: "oddscore-5ed5e",                    // Use YOUR ID
  storageBucket: "oddscore-5ed5e.firebasestorage.app", // Use YOUR bucket
  messagingSenderId: "582289870654",              // Use YOUR sender ID
  appId: "1:582289870654:web:bb025764a8d37f697f266f",  // Use YOUR App ID
  measurementId: "G-HCKHYJ0HZD"                  // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized (module mode)!");
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants and Helpers ---
const now = new Date(); // Use REAL current date/time
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        const today = new Date(); return today.toISOString().split('T')[0];
    }
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// Flag Mapping & URL Generation
const flagCodeMap = { /* ... Keep your flag map ... */ };
function getFlagUrl(countryName) { /* ... Keep function ... */ }


// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks loaded from Firestore for the logged-in user
let currentUserId = null;
let currentUserProfile = null;
let currentFixtures = []; // Holds fixtures for the day fetched from Firestore
let isUpdatingFixtures = false;

// --- DOM Element References (Declared globally, assigned in init) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
let authSection, loginForm, signupForm, userInfo;
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let showSignupButton, signupEmailInput, signupPasswordInput, signupUsernameInput, signupButton, signupErrorP;
let showLoginButton, userDisplayNameSpan, logoutButton;


// --- Authentication State Listener ---
onAuthStateChanged(auth, async (user) => {
    loginErrorP?.textContent && (loginErrorP.textContent = '');
    signupErrorP?.textContent && (signupErrorP.textContent = '');

    if (user) { // User signed in
        currentUserId = user.uid;
        console.log("Auth State: User logged in:", user.email, currentUserId);
        if(loginForm) loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'none'; if(userInfo) userInfo.style.display = 'block';
        if(authSection) { /* Hide auth section styles */ /* ... */ }

        // Fetch Profile
        try {
            const userDocRef = doc(db, "users", user.uid); const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) { currentUserProfile = docSnap.data(); if (userDisplayNameSpan && currentUserProfile.username) userDisplayNameSpan.textContent = currentUserProfile.username; }
            else { console.log("No user profile found"); currentUserProfile = { email: user.email }; if(userDisplayNameSpan) userDisplayNameSpan.textContent = user.email + " (No Profile)"; }
        } catch (error) { console.error("Error fetching profile:", error); currentUserProfile = { email: user.email }; if(userDisplayNameSpan) userDisplayNameSpan.textContent = user.email + " (Profile Error)";}

        // Load user picks *after* profile is attempted
        await loadUserPicksFromFirestore(user.uid);

        // Initial UI draw after loading picks
        generateCalendar();
        updateDisplayedFixtures(); // This will fetch fixtures from DB

    } else { // User signed out
        console.log("Auth State: User logged out");
        currentUserId = null; currentUserProfile = null; userSelections = {}; // Clear state
        localStorage.removeItem('footballGameSelections'); // Clear any old local backup
        if(userDisplayNameSpan) userDisplayNameSpan.textContent = '';
        if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(userInfo) userInfo.style.display = 'none';
         if(authSection) { /* Restore section styling */ /* ... */ }
        // Refresh UI immediately after logout
        requestAnimationFrame(() => {
             if(typeof generateCalendar === 'function') generateCalendar();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
        });
    }
});

// --- Firestore Interaction ---

/** Fetches fixture data for a date from Firestore */
async function fetchFixturesFromFirestore(dateStr) { /* ... Keep function from response #81 ... */ }

/** Fetches ALL picks for the logged-in user from Firestore */
async function loadUserPicksFromFirestore(userId) {
    if (!userId || !db) { userSelections = {}; return; } // Exit if no user ID or DB not ready
    console.log(`Loading picks for user ${userId} from Firestore...`);
    const tempSelections = {};
    try {
        const picksCol = collection(db, "userPicks");
        const q = query(picksCol, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const pick = doc.data();
            if (pick.date) { tempSelections[pick.date] = pick; }
            else { console.warn("Found pick without date field:", doc.id, pick); }
        });
        userSelections = tempSelections; // Assign loaded picks to global state
        console.log("Loaded user picks from Firestore:", userSelections);
    } catch (error) {
        console.error("Error loading user picks:", error);
        userSelections = {}; // Reset on error
        alert("Could not load your saved picks.");
    }
    // UI update should happen after this finishes (called from onAuthStateChanged or init)
}

/** Saves/Updates a single pick document in Firestore */
async function savePickToFirestore(selectionData) {
    if (!selectionData?.userId || !selectionData?.date || !db) {
        console.error("Cannot save pick, missing userId/date or DB not ready", selectionData);
        return false;
    }
    // Use userId_date as the document ID for easy lookup/overwrite
    const docId = `${selectionData.userId}_${selectionData.date}`;
    const pickDocRef = doc(db, "userPicks", docId);
    console.log(`Saving pick to Firestore: /userPicks/${docId}`);
    try {
        // Use setDoc to create or completely overwrite the document for that user/date
        await setDoc(pickDocRef, selectionData);
        console.log("Pick saved successfully!");
        return true;
    } catch (error) {
        console.error("Error saving pick to Firestore: ", error);
        alert("Error saving your pick. Please try again.");
        return false;
    }
}

/** Deletes a single pick document from Firestore (Optional - not used if picks are final) */
async function deletePickFromFirestore(userId, dateStr) {
    if (!userId || !dateStr || !db) return false;
    const docId = `${userId}_${dateStr}`;
    const pickDocRef = doc(db, "userPicks", docId);
    console.log(`Deleting pick from Firestore: /userPicks/${docId}`);
    try {
        await deleteDoc(pickDocRef);
        console.log("Pick deleted successfully!");
        return true;
    } catch (error) { console.error("Error deleting pick: ", error); alert("Error removing pick."); return false;}
}

// --- Core Game Functions ---

function generateCalendar() { /* ... Keep simplified function from response #81 ... */ }
function populateDailyLeagueSlicers(fixturesData) { /* ... Keep function ... */ }
function handleSlicerClick(event) { /* ... Keep function ... */ }
async function updateDisplayedFixtures() { /* ... Keep function (fetches fixtures from Firestore) ... */ }
function displayFixtures(fixtures, currentTime) { /* ... Keep function ... */ }

/**
 * Handles team selection. Pick is now FINAL for the day and saved to Firestore.
 */
async function handleSelection(fixtureId, teamId, teamName /* removed odds params */ ) {
    // 1. Check Login
    if (!auth.currentUser) { alert("Please log in or sign up to make a pick!"); return; }
    const userId = auth.currentUser.uid; // Get user ID

    // 2. Check if Pick Already Exists for this Date (using local state which reflects Firestore)
    const selectedDateStr = getDateString(selectedDate);
    if (userSelections[selectedDateStr]) {
        alert(`You have already picked ${userSelections[selectedDateStr].teamName} for ${selectedDateStr}. Your pick is final for the day!`);
        return; // Exit, pick already made and locked
    }

    // 3. Check if Clicked Game Has Started
    const realCurrentTime = new Date();
    const clickedFixture = currentFixtures.find(f => f?.fixtureId === fixtureId);
    if (!clickedFixture || !clickedFixture.kickOffTime || !clickedFixture.odds || !clickedFixture.homeTeam?.id) {
        console.error("Cannot make pick: Clicked fixture details/odds missing", fixtureId);
        alert("Could not find details for the selected match.");
        return;
    }
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) {
        alert("This match has already started, you cannot select it."); return;
    }

    // 4. Prepare Selection Data
    const homeWinOdd = clickedFixture.odds.homeWin;
    const awayWinOdd = clickedFixture.odds.awayWin;
    const pickedOddForSave = (String(teamId) === String(clickedFixture.homeTeam.id)) ? homeWinOdd : awayWinOdd;

    const newSelection = {
        userId: userId,
        date: selectedDateStr,
        fixtureId: fixtureId,
        teamId: String(teamId), // Ensure ID is string
        teamName: teamName || 'Unknown',
        pickedOdd: pickedOddForSave || 1.0, // Store the odd AT TIME OF PICK
        selectionTime: realCurrentTime.toISOString()
        // Removed fixtureDrawOdd
    };
    console.log(`Attempting to save final pick:`, newSelection);

    // --- Show loading state? Disable buttons? ---

    // 5. Save to Firestore
    const saveSuccess = await savePickToFirestore(newSelection);

    // 6. Update UI if Save Successful
    if (saveSuccess) {
        userSelections[selectedDateStr] = newSelection; // Update local state
        // No need for saveUserDataToLocal anymore
        generateCalendar(); // Update calendar UI to show new pick
        updateDisplayedFixtures(); // Update fixture list UI (button states change)
    } else {
        // Handle save failure (alert already shown in savePickToFirestore)
        console.error("Failed to save pick to Firestore. Pick not registered locally either.");
        // Re-enable buttons?
    }
}

function calculateScore(selection, fixture) { /* ... Keep function for NEW scoring rules (response #101) ... */ }

// REMOVED loadUserDataFromLocal / saveUserDataToLocal
function getFriendlyAuthError(error) { /* ... Keep function ... */ }


// --- Initialization Function ---
async function initializeAppAndListeners() {
    console.log("DOM Loaded, assigning elements and listeners...");
    // Assign DOM Elements
    weekViewContainer = document.getElementById('week-view'); fixtureListDiv = document.getElementById('fixture-list'); /* ... assign ALL elements ... */
    leagueSlicerContainer = document.getElementById('league-slicer-container'); scoreListUl = document.getElementById('score-list'); authSection = document.getElementById('auth-section'); loginForm = document.getElementById('login-form'); signupForm = document.getElementById('signup-form'); userInfo = document.getElementById('user-info'); loginEmailInput = document.getElementById('login-email'); loginPasswordInput = document.getElementById('login-password'); loginButton = document.getElementById('login-button'); loginErrorP = document.getElementById('login-error'); showSignupButton = document.getElementById('show-signup'); signupEmailInput = document.getElementById('signup-email'); signupPasswordInput = document.getElementById('signup-password'); signupUsernameInput = document.getElementById('signup-username'); signupButton = document.getElementById('signup-button'); signupErrorP = document.getElementById('signup-error'); showLoginButton = document.getElementById('show-login'); userDisplayNameSpan = document.getElementById('user-display-name'); logoutButton = document.getElementById('logout-button');
     if (!weekViewContainer || !fixtureListDiv || !loginForm ) { /* ... error check ... */ return; }
    // Attach Auth Event Listeners
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { /* ... */ }); } if (showLoginButton) { showLoginButton.addEventListener('click', () => { /* ... */ }); } if (loginButton) { loginButton.addEventListener('click', () => { /* ... */ }); } if (signupButton) { signupButton.addEventListener('click', () => { /* ... (Ensure setDoc for profile uses imported functions) ... */ }); } if (logoutButton) { logoutButton.addEventListener('click', () => { /* ... */ }); }

    // Initial Load - Wait for Auth State
    // The onAuthStateChanged listener will trigger the initial data load (picks and fixtures)
    console.log("Initial setup complete. Waiting for Auth State...");
    // Display a loading message initially maybe?
    if(fixtureListDiv) fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">Initializing...</p>';
    if(weekViewContainer) weekViewContainer.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center;">...</p>'; // Placeholder

}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initializeAppAndListeners);
