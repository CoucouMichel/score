// script.js - FINAL v2 - Header Modal Auth + Firestore Fixture Reads + Firestore Pick Save/Load (Final Pick)

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
    if (!(date instanceof Date) || isNaN(date.getTime())) { const today = new Date(); return today.toISOString().split('T')[0]; }
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

function getStartOfWeek(date) {
  const dt = new Date(date); const day = dt.getDay(); const diff = dt.getDate() - day;
  dt.setHours(0, 0, 0, 0); dt.setDate(diff); return dt;
}

const flagCodeMap = { /* ... Keep your flag map ... */ };
function getFlagUrl(countryName) { /* ... Keep function ... */ }


// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks loaded from Firestore for the logged-in user
let currentUserId = null;
let currentUserProfile = null;
let currentFixtures = []; // Holds fixtures for the currently displayed day
let isUpdatingFixtures = false;

// --- DOM Element References (Declared globally, assigned in init) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
// Header elements for auth state
let headerLoginLink, headerUserInfo, headerUsername, headerLogoutButton;
// Modal elements
let authModal, modalOverlay, modalCloseBtn;
let modalLoginForm, modalSignupForm, showLoginTab, showSignupTab;
// Form elements (inside modal)
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let signupUsernameInput, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;
// Calendar Nav Buttons
let prevWeekBtn, nextWeekBtn;


// --- Modal Control Functions ---
function showAuthModal() {
    if (authModal && modalOverlay) {
        authModal.classList.remove('modal-hidden'); authModal.classList.add('modal-visible');
        modalOverlay.classList.remove('modal-hidden'); modalOverlay.classList.add('modal-visible');
        showTab('login'); // Default to login tab
    }
}
function hideAuthModal() {
    if (authModal && modalOverlay) {
        authModal.classList.add('modal-hidden'); authModal.classList.remove('modal-visible');
        modalOverlay.classList.add('modal-hidden'); modalOverlay.classList.remove('modal-visible');
        if(loginErrorP) loginErrorP.textContent = ''; // Clear errors
        if(signupErrorP) signupErrorP.textContent = '';
    }
}
function showTab(tabName) {
    if (!modalLoginForm || !modalSignupForm || !showLoginTab || !showSignupTab) return;
    if (tabName === 'login') {
        modalLoginForm.style.display = 'block'; modalSignupForm.style.display = 'none';
        showLoginTab.classList.add('active'); showSignupTab.classList.remove('active');
        if(signupErrorP) signupErrorP.textContent = '';
    } else { // signup
        modalLoginForm.style.display = 'none'; modalSignupForm.style.display = 'block';
        showLoginTab.classList.remove('active'); showSignupTab.classList.add('active');
        if(loginErrorP) loginErrorP.textContent = '';
    }
}

// --- Authentication State Listener ---
onAuthStateChanged(auth, async (user) => {
    loginErrorP?.textContent && (loginErrorP.textContent = ''); // Clear potential modal errors on state change
    signupErrorP?.textContent && (signupErrorP.textContent = '');

    if (user) { // User signed in
        currentUserId = user.uid;
        console.log("Auth State: Logged In", user.uid);
        if(headerLoginLink) headerLoginLink.style.display = 'none';
        if(headerUserInfo) headerUserInfo.style.display = 'flex';
        if(headerUsername) headerUsername.textContent = 'Loading...'; // Placeholder

        // Fetch Profile
        try {
            const userDocRef = doc(db, "users", user.uid); const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) { currentUserProfile = docSnap.data(); if (headerUsername && currentUserProfile.username) headerUsername.textContent = currentUserProfile.username; else if(headerUsername) headerUsername.textContent = user.email;}
            else { console.log("No user profile found"); currentUserProfile = { email: user.email }; if(headerUsername) headerUsername.textContent = user.email; }
        } catch (error) { console.error("Error fetching profile:", error); currentUserProfile = { email: user.email }; if(headerUsername) headerUsername.textContent = user.email; }

        hideAuthModal(); // Close modal on successful login/signup handled here
        await loadUserPicksFromFirestore(user.uid); // Load user picks

    } else { // User signed out
        console.log("Auth State: Logged Out");
        currentUserId = null; currentUserProfile = null; userSelections = {};
        localStorage.removeItem('footballGameSelections'); // Clear old local backup just in case
        if(headerLoginLink) headerLoginLink.style.display = 'block';
        if(headerUserInfo) headerUserInfo.style.display = 'none';
        if(headerUsername) headerUsername.textContent = '';

        // Refresh UI for logged-out state immediately
        requestAnimationFrame(() => {
             if(typeof generateCalendar === 'function') generateCalendar();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
        });
    }
});

// --- Firestore Interaction ---

/** Fetches fixture data for a date from Firestore */
async function fetchFixturesFromFirestore(dateStr) {
    console.log(`Fetching fixtures from Firestore for ${dateStr}`);
    if (!db) { console.error("Firestore db not initialized!"); return [];}
    const docRef = doc(db, "fixturesByDate", dateStr);
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            return Array.isArray(data.fixtures) ? data.fixtures : [];
        } else { console.log(`No data found in Firestore for ${dateStr}`); return []; }
    } catch (error) { console.error(`Error fetching Firestore for ${dateStr}:`, error); return []; }
}

/** Fetches ALL picks for the logged-in user from Firestore and updates state */
async function loadUserPicksFromFirestore(userId) {
    if (!userId || !db) { userSelections = {}; return; }
    console.log(`Loading picks for user ${userId} from Firestore...`);
    const tempSelections = {};
    try {
        const picksColRef = collection(db, "userPicks");
        const q = query(picksColRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const pick = doc.data();
            if (pick.date) { tempSelections[pick.date] = pick; }
        });
        userSelections = tempSelections; // Assign loaded picks to global state
        console.log("Loaded user picks from Firestore:", userSelections);
    } catch (error) { console.error("Error loading user picks:", error); userSelections = {}; /* alert("Could not load your saved picks."); */ }
    // UI updates will happen AFTER this await finishes in onAuthStateChanged
    // No need to call generate/update here directly
}

/** Saves/Updates a single pick document in Firestore */
async function savePickToFirestore(selectionData) {
    if (!selectionData?.userId || !selectionData?.date || !db) { console.error("Cannot save pick", selectionData); return false; }
    const docId = `${selectionData.userId}_${selectionData.date}`;
    const pickDocRef = doc(db, "userPicks", docId);
    console.log(`Saving pick to Firestore: /userPicks/${docId}`);
    try {
        await setDoc(pickDocRef, selectionData); // Creates or overwrites
        console.log("Pick saved successfully!"); return true;
    } catch (error) { console.error("Error saving pick to Firestore: ", error); alert("Error saving pick."); return false; }
}

/** Deletes a single pick document from Firestore */
async function deletePickFromFirestore(userId, dateStr) {
    if (!userId || !dateStr || !db) return false;
    const docId = `${userId}_${dateStr}`;
    const pickDocRef = doc(db, "userPicks", docId);
    console.log(`Deleting pick from Firestore: /userPicks/${docId}`);
    try {
        await deleteDoc(pickDocRef); console.log("Pick deleted successfully!"); return true;
    } catch (error) { console.error("Error deleting pick:", error); alert("Error removing pick."); return false; }
}

// --- Core Game Functions ---

function generateCalendar() { /* ... Keep 7-day weekly view version from #119 ... */ }
function getStartOfWeek(date) { /* ... Keep function from #119 ... */ }
function populateDailyLeagueSlicers(fixturesData) { /* ... Keep function ... */ }
function handleSlicerClick(event) { /* ... Keep function ... */ }
async function updateDisplayedFixtures() { /* ... Keep function (fetches fixtures from Firestore, uses flag) ... */ }
function displayFixtures(fixtures, currentTime) { /* ... Keep function ... */ }

/**
 * Handles team selection. Pick is FINAL for the day and saved to Firestore.
 * Updated based on response #118 (no deselect)
 */
async function handleSelection(fixtureId, teamId, teamName /* removed odds params */ ) {
    // 1. Check Login
    if (!auth.currentUser) { alert("Please log in or sign up to make a pick!"); return; }
    const userId = auth.currentUser.uid;

    // 2. Check if Pick Already Exists for this Date (using local state which reflects Firestore)
    const selectedDateStr = getDateString(selectedDate);
    if (userSelections[selectedDateStr]) {
        alert(`You have already picked ${userSelections[selectedDateStr].teamName} for ${selectedDateStr}. Your pick is final!`);
        return; // Exit, pick already made and locked
    }

    // 3. Check if Clicked Game Has Started
    const realCurrentTime = new Date();
    const clickedFixture = currentFixtures.find(f => f?.fixtureId === fixtureId);
    if (!clickedFixture || !clickedFixture.kickOffTime || !clickedFixture.odds || !clickedFixture.homeTeam?.id) {
        console.error("Cannot make pick: Clicked fixture details missing", fixtureId); alert("Match details unavailable."); return;
    }
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) { alert("This match has already started."); return; }

    // 4. Prepare Selection Data
    const homeWinOdd = clickedFixture.odds.homeWin;
    const awayWinOdd = clickedFixture.odds.awayWin;
    const pickedOddForSave = (String(teamId) === String(clickedFixture.homeTeam.id)) ? homeWinOdd : awayWinOdd;

    const newSelection = {
        userId: userId, date: selectedDateStr, fixtureId: fixtureId, teamId: String(teamId),
        teamName: teamName || 'Unknown', pickedOdd: pickedOddForSave || 1.0,
        selectionTime: realCurrentTime.toISOString()
    };
    console.log(`Attempting to save final pick:`, newSelection);

    // --- Show loading state? Disable buttons? ---

    // 5. Save to Firestore
    const saveSuccess = await savePickToFirestore(newSelection);

    // 6. Update UI if Save Successful
    if (saveSuccess) {
        userSelections[selectedDateStr] = newSelection; // Update local state *after* successful save
        generateCalendar(); // Update calendar UI to show new pick
        updateDisplayedFixtures(); // Update fixture list UI (button states change)
    }
    // Error handled in savePickToFirestore
}

function calculateScore(selection, fixture) { /* ... Keep function for final scoring rules (response #101) ... */ }

function getFriendlyAuthError(error) { /* ... Keep function ... */ }

// --- Initialization Function ---
async function initializeAppAndListeners() {
    console.log("DOM Loaded, assigning elements and listeners...");

    // Assign DOM Elements
    weekViewContainer = document.getElementById('week-view'); fixtureListDiv = document.getElementById('fixture-list'); leagueSlicerContainer = document.getElementById('league-slicer-container'); scoreListUl = document.getElementById('score-list');
    headerLoginLink = document.getElementById('header-login-link'); headerUserInfo = document.getElementById('header-user-info'); headerUsername = document.getElementById('header-username'); headerLogoutButton = document.getElementById('header-logout-button');
    authModal = document.getElementById('auth-modal'); modalOverlay = document.getElementById('modal-overlay'); modalCloseBtn = document.getElementById('modal-close-btn');
    modalLoginForm = document.getElementById('modal-login-form'); modalSignupForm = document.getElementById('modal-signup-form'); showLoginTab = document.getElementById('show-login-tab'); showSignupTab = document.getElementById('show-signup-tab');
    loginEmailInput = document.getElementById('login-email'); loginPasswordInput = document.getElementById('login-password'); loginButton = document.getElementById('login-button'); loginErrorP = document.getElementById('login-error');
    signupUsernameInput = document.getElementById('signup-username'); signupEmailInput = document.getElementById('signup-email'); signupPasswordInput = document.getElementById('signup-password'); signupButton = document.getElementById('signup-button'); signupErrorP = document.getElementById('signup-error');
    // Note: showSignupButton and showLoginButton refs inside OLD #auth-section are no longer needed
    prevWeekBtn = document.getElementById('cal-prev-week'); nextWeekBtn = document.getElementById('cal-next-week');

    // Check critical elements
     if (!weekViewContainer || !fixtureListDiv || !headerLoginLink || !authModal || !prevWeekBtn || !nextWeekBtn) { console.error("One or more critical DOM elements not found!"); return; }

    // Attach Modal Control Listeners
    headerLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthModal(); });
    modalCloseBtn.addEventListener('click', hideAuthModal);
    modalOverlay.addEventListener('click', hideAuthModal);
    showLoginTab.addEventListener('click', () => showTab('login'));
    showSignupTab.addEventListener('click', () => showTab('signup'));

    // Attach Auth Form Submit Listeners (inside modal)
    if (loginButton) { loginButton.addEventListener('click', () => { if (!loginEmailInput || !loginPasswordInput) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; if(loginErrorP) loginErrorP.textContent = ''; signInWithEmailAndPassword(auth, email, password).catch((err) => { if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (signupButton) { signupButton.addEventListener('click', () => { if (!signupEmailInput || !signupPasswordInput || !signupUsernameInput) return; const email = signupEmailInput.value; const password = signupPasswordInput.value; const username = signupUsernameInput.value.trim(); if(signupErrorP) signupErrorP.textContent = ''; if (username.length < 3) { /* ... */ return; } if (/\s/.test(username)) { /* ... */ return; } createUserWithEmailAndPassword(auth, email, password).then((cred) => { const user = cred.user; const userDocRef = doc(db, "users", user.uid); return setDoc(userDocRef, { username: username, email: user.email, joinedAt: serverTimestamp() }); }).then(() => { /* Clear inputs */ }).catch((err) => { if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (headerLogoutButton) { headerLogoutButton.addEventListener('click', () => { signOut(auth).catch(/*...*/); }); }

    // Attach Calendar Navigation Listeners
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', async () => { selectedDate.setDate(selectedDate.getDate() - 7); generateCalendar(); await updateDisplayedFixtures(); });
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', async () => { selectedDate.setDate(selectedDate.getDate() + 7); generateCalendar(); await updateDisplayedFixtures(); });

    // Initial Load - Wait for Auth State
    console.log("Initial setup complete. Waiting for Auth State...");
    if(fixtureListDiv) fixtureListDiv.innerHTML = '<p>Initializing...</p>';
    if(weekViewContainer) weekViewContainer.innerHTML = '<p>...</p>';
}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initializeAppAndListeners);
