// script.js - FINAL CORRECTED VERSION with Auth & Fixes

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
const auth = getAuth(app);
const db = getFirestore(app);


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
onAuthStateChanged(auth, user => {
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
        if(authSection) { // Optional: Hide section styling when logged in
            authSection.style.border = 'none'; authSection.style.boxShadow = 'none';
            authSection.style.background = 'none'; authSection.style.padding = '0 0 1.5rem 0';
        }
        loadUserPicksFromFirestore(user.uid); // Placeholder call
    } else {
        // User is signed out
        console.log("User logged out");
        currentUserId = null;
        if(userEmailSpan) userEmailSpan.textContent = '';
        if(loginForm) loginForm.style.display = 'block';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'none';
         if(authSection) { // Restore section styling
             authSection.style.border = '1px solid var(--divider-color)';
             authSection.style.boxShadow = 'var(--elevation-1)';
             authSection.style.background = 'var(--card-background-color)';
             authSection.style.padding = '1.5rem';
         }
        userSelections = {}; // Clear local state
        localStorage.removeItem('footballGameSelections');
        // Refresh UI after clearing data
        setTimeout(() => {
             if(typeof generateCalendar === 'function') generateCalendar(); // Check if functions exist before calling
             if(typeof populateDailyLeagueSlicers === 'function') populateDailyLeagueSlicers();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
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
        if (!loginEmailInput || !loginPasswordInput) return;
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        if(loginErrorP) loginErrorP.textContent = '';
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => { console.log("Login successful", userCredential.user); })
            .catch((error) => {
                console.error("Login Error:", error.code, error.message);
                if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(error)}`;
            });
    });
}
if (signupButton) {
    signupButton.addEventListener('click', () => {
         if (!signupEmailInput || !signupPasswordInput) return;
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        if(signupErrorP) signupErrorP.textContent = '';
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => { console.log("Signup successful", userCredential.user); })
            .catch((error) => {
                console.error("Signup Error:", error.code, error.message);
                 if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(error)}`;
            });
    });
}
if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        signOut(auth).catch((error) => {
            console.error("Logout Error:", error);
            alert("Error logging out.");
        });
    });
}
// Helper for friendlier error messages
function getFriendlyAuthError(error) {
    switch (error.code) {
        case 'auth/invalid-email': return 'Invalid email format.';
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/weak-password': return 'Password should be at least 6 characters.';
        case 'auth/email-already-in-use': return 'This email is already registered.';
        case 'auth/operation-not-allowed': return 'Email/password sign-in not enabled.';
        case 'auth/missing-password': return 'Please enter a password.';
        default: return 'An unknown error occurred.';
    }
}
// --- END Authentication Logic ---


// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}
// Flag Mapping & URL Generation
const flagCodeMap = {
    "England": "gb-eng", "Spain": "es", "Germany": "de", "Italy": "it",
    "France": "fr", "Portugal": "pt", "Netherlands": "nl", "Belgium": "be",
    "Turkey": "tr", "Scotland": "gb", "UEFA": "eu"
};
function getFlagUrl(countryName) {
    const code = flagCodeMap[countryName];
    if (code) return `https://flagcdn.com/w20/${code}.png`;
    return "";
}

// --- Fake Fixtures Data ---
// !! IMPORTANT: PASTE YOUR EXPANDED fakeFixtures ARRAY HERE !!
const fakeFixtures = [
    { fixtureId: 101, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() + 2 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 1, name: "Man Reds" }, awayTeam: { id: 2, name: "Lon Blues" }, odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.8 }, result: null },
    { fixtureId: 305, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() - 1 * oneDay + 18.5 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 56, name: "Leipzig Bulls" }, awayTeam: { id: 57, name: "Hoffenheim Village" }, odds: { homeWin: 1.8, draw: 4.0, awayWin: 4.2 }, result: { homeScore: 2, awayScore: 2 } },
    { fixtureId: 301, competition: "Europa League", country: "UEFA", kickOffTime: new Date(now.getTime() - 2 * oneDay + 17 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 50, name: "Roma Gladiators" }, awayTeam: { id: 51, name: "Leverkusen Works" }, odds: { homeWin: 2.8, draw: 3.5, awayWin: 2.5 }, result: { homeScore: 1, awayScore: 1 } },
    { fixtureId: 302, competition: "Europa League", country: "UEFA", kickOffTime: new Date(now.getTime() - 2 * oneDay + 19 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 52, name: "Marseille Port" }, awayTeam: { id: 53, name: "Atalanta Hills" }, odds: { homeWin: 2.6, draw: 3.3, awayWin: 2.7 }, result: { homeScore: 2, awayScore: 0 } },
    { fixtureId: 303, competition: "Pro League", country: "Belgium", kickOffTime: new Date(now.getTime() - 2 * oneDay + 18 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 54, name: "Club Brugge" }, awayTeam: { id: 55, name: "Anderlecht Royals" }, odds: { homeWin: 2.1, draw: 3.6, awayWin: 3.2 }, result: { homeScore: 3, awayScore: 1 } },
    { fixtureId: 304, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 5, name: "Mersey Reds" }, awayTeam: { id: 6, name: "Man Citizens" }, odds: { homeWin: 2.2, draw: 3.5, awayWin: 3.1 }, result: { homeScore: 3, awayScore: 1 } },
    { fixtureId: 306, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19.5 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 58, name: "Inter Serpents" }, awayTeam: { id: 59, name: "Lazio Eagles" }, odds: { homeWin: 1.6, draw: 4.2, awayWin: 5.0 }, result: { homeScore: 1, awayScore: 0 } },
    { fixtureId: 102, competition: "La Liga", country: "Spain", kickOffTime: new Date(now.getTime() + 4 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 3, name: "Madrid Whites" }, awayTeam: { id: 4, name: "Catalan Giants" }, odds: { homeWin: 1.9, draw: 3.8, awayWin: 4.0 }, result: null },
    { fixtureId: 105, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() + 5 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 11, name: "Dortmund Bees" }, awayTeam: { id: 7, name: "Bavarian Stars" }, odds: { homeWin: 2.9, draw: 3.6, awayWin: 2.4 }, result: null },
    { fixtureId: 307, competition: "Primeira Liga", country: "Portugal", kickOffTime: new Date(now.getTime() + 6 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 60, name: "Porto Dragons" }, awayTeam: { id: 61, name: "Sporting Lions" }, odds: { homeWin: 2.3, draw: 3.3, awayWin: 3.0 }, result: null },
    { fixtureId: 308, competition: "Eredivisie", country: "Netherlands", kickOffTime: new Date(now.getTime() + 7 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 62, name: "Ajax Masters" }, awayTeam: { id: 63, name: "PSV Lights" }, odds: { homeWin: 2.0, draw: 3.8, awayWin: 3.5 }, result: null },
    { fixtureId: 309, competition: "Ligue 1", country: "France", kickOffTime: new Date(now.getTime() + 8 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 64, name: "Monaco Princes" }, awayTeam: { id: 65, name: "Lille Dogs" }, odds: { homeWin: 1.9, draw: 3.5, awayWin: 4.1 }, result: null },
    { fixtureId: 201, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() + 1 * oneDay + 3 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 9, name: "Milan Devils" }, awayTeam: { id: 10, name: "Turin Zebras" }, odds: { homeWin: 3.1, draw: 3.3, awayWin: 2.3 }, result: null },
    { fixtureId: 202, competition: "Ligue 1", country: "France", kickOffTime: new Date(now.getTime() + 1 * oneDay + 5 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 8, name: "Paris Royals" }, awayTeam: { id: 12, name: "Lyon Lions" }, odds: { homeWin: 1.5, draw: 4.5, awayWin: 6.0 }, result: null },
    { fixtureId: 203, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() + 1 * oneDay + 6 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 6, name: "Man Citizens" }, awayTeam: { id: 5, name: "Mersey Reds" }, odds: { homeWin: 1.7, draw: 4.0, awayWin: 4.8 }, result: null },
    { fixtureId: 310, competition: "La Liga", country: "Spain", kickOffTime: new Date(now.getTime() + 1 * oneDay + 7 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 66, name: "Sevilla Rojos" }, awayTeam: { id: 67, name: "Betis Verdes" }, odds: { homeWin: 2.4, draw: 3.2, awayWin: 2.9 }, result: null },
    { fixtureId: 311, competition: "Süper Lig", country: "Turkey", kickOffTime: new Date(now.getTime() + 1 * oneDay + 4 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 68, name: "Galatasaray Lions" }, awayTeam: { id: 69, name: "Fenerbahce Canaries" }, odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.7 }, result: null },
    { fixtureId: 312, competition: "Scottish Premiership", country: "Scotland", kickOffTime: new Date(now.getTime() + 1 * oneDay + 1 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 70, name: "Celtic Hoops" }, awayTeam: { id: 71, name: "Rangers Gers" }, odds: { homeWin: 1.9, draw: 3.7, awayWin: 3.8 }, result: null },
    { fixtureId: 313, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() + 2 * oneDay + 18.75 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 72, name: "Napoli Blues" }, awayTeam: { id: 50, name: "Roma Gladiators" }, odds: { homeWin: 2.0, draw: 3.5, awayWin: 3.6 }, result: null },
    { fixtureId: 314, competition: "La Liga", country: "Spain", kickOffTime: new Date(now.getTime() + 2 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 73, name: "Athletic Bilbao" }, awayTeam: { id: 74, name: "Real Sociedad" }, odds: { homeWin: 2.6, draw: 3.1, awayWin: 2.8 }, result: null },
    { fixtureId: 315, competition: "Pro League", country: "Belgium", kickOffTime: new Date(now.getTime() + 2 * oneDay + 18 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 75, name: "Gent Buffalos" }, awayTeam: { id: 76, name: "Standard Liege" }, odds: { homeWin: 1.9, draw: 3.4, awayWin: 4.0 }, result: null },
    { fixtureId: 316, competition: "Champions League", country: "UEFA", kickOffTime: new Date(now.getTime() + 3 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 7, name: "Bavarian Stars" }, awayTeam: { id: 4, name: "Catalan Giants" }, odds: { homeWin: 1.7, draw: 4.0, awayWin: 4.5 }, result: null },
    { fixtureId: 317, competition: "Champions League", country: "UEFA", kickOffTime: new Date(now.getTime() + 3 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 6, name: "Man Citizens" }, awayTeam: { id: 3, name: "Madrid Whites" }, odds: { homeWin: 1.9, draw: 3.8, awayWin: 3.7 }, result: null },
    { fixtureId: 318, competition: "Süper Lig", country: "Turkey", kickOffTime: new Date(now.getTime() + 3 * oneDay + 17 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 77, name: "Besiktas Eagles" }, awayTeam: { id: 78, name: "Trabzonspor Storm" }, odds: { homeWin: 2.1, draw: 3.4, awayWin: 3.3 }, result: null },
    { fixtureId: 319, competition: "Scottish Premiership", country: "Scotland", kickOffTime: new Date(now.getTime() + 4 * oneDay + 18.5 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 79, name: "Hearts Jambos" }, awayTeam: { id: 80, name: "Hibernian Hibees" }, odds: { homeWin: 2.5, draw: 3.2, awayWin: 2.8 }, result: null },
    { fixtureId: 320, competition: "Eredivisie", country: "Netherlands", kickOffTime: new Date(now.getTime() + 4 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 81, name: "Feyenoord Port" }, awayTeam: { id: 82, name: "AZ Alkmaar" }, odds: { homeWin: 1.8, draw: 3.9, awayWin: 4.1 }, result: null },
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
// NOTE: Make sure these functions are correctly defined below
function generateCalendar() { /* ... function code ... */ }
function populateDailyLeagueSlicers() { /* ... function code ... */ }
function handleSlicerClick(event) { /* ... function code ... */ }
function updateDisplayedFixtures() { /* ... function code ... */ }
function displayFixtures(fixtures, currentTime) { /* ... function code ... */ }
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) { /* ... function code ... */ }
function calculateScore(selection, fixture) { /* ... function code ... */ }
function loadUserDataFromLocal() { /* ... function code ... */ }
function saveUserDataToLocal() { /* ... function code ... */ }
function loadUserPicksFromFirestore(userId) { /* ... function code ... */ }


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Auth listeners are set up above and handle initial UI state via onAuthStateChanged
    loadUserDataFromLocal(); // Load local data first (for non-logged-in state)
    // Initial UI generation (parts might be updated by onAuthStateChanged)
    if(typeof populateDailyLeagueSlicers === 'function') populateDailyLeagueSlicers();
    // generateCalendar and updateDisplayedFixtures are called within loadUserDataFromLocal and onAuthStateChanged
});
