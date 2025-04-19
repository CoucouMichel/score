// script.js - FINAL CORRECTED VERSION with DOMContentLoaded Fix

// --- Firebase Initialization (ES Module Version) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Your web app's Firebase configuration (PASTE YOUR OBJECT HERE)
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
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

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
    // ... include all ~30 fixtures ...
];

// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks loaded for the CURRENT user
let currentUserId = null; // Store the logged-in user's ID

// --- DOM Element References (Will be assigned in DOMContentLoaded) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
let authSection, loginForm, signupForm, userInfo;
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let showSignupButton, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;
let showLoginButton, userEmailSpan, logoutButton;


// --- Auth State Listener (Updates UI based on login state) ---
onAuthStateChanged(auth, user => {
    // Ensure elements exist before manipulating
    if (loginErrorP) loginErrorP.textContent = '';
    if (signupErrorP) signupErrorP.textContent = '';

    if (user) { // User is signed in
        console.log("User logged in:", user.email, user.uid);
        currentUserId = user.uid;
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        if(loginForm) loginForm.style.display = 'none';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'block';
        if(authSection) { // Optional UI cleanup
             authSection.style.border = 'none'; authSection.style.boxShadow = 'none';
             authSection.style.background = 'none'; authSection.style.padding = '0 0 1.5rem 0';
        }
        loadUserPicksFromFirestore(user.uid); // Placeholder call
    } else { // User is signed out
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
             if(typeof generateCalendar === 'function') generateCalendar();
             if(typeof populateDailyLeagueSlicers === 'function') populateDailyLeagueSlicers();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
        }, 0);
    }
});

// --- Core Game Functions ---

function generateCalendar() {
    if (!weekViewContainer) return; // Ensure container exists
    weekViewContainer.innerHTML = '';
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (let i = -1; i <= 3; i++) {
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);
        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day');
        dayButton.dataset.date = dateStr;
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`;
        if (i === 0) line1Text = `<b>TODAY ${date.getDate()}</b>`;
        let line2Text = "No Pick"; let line3Text = "&nbsp;";
        const selection = userSelections[dateStr];
        if (selection) {
            line2Text = `<b>${selection.teamName}</b>`;
            const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
            if (fixture) {
                if (fixture.status === 'FINISHED' && fixture.result) {
                    const score = calculateScore(selection, fixture);
                    line3Text = score !== null ? `Score: <b>${score.toFixed(1)}</b>` : "Score Pend."; // Use 1 decimal
                } else if (fixture.status === 'SCHEDULED') {
                    line3Text = `Odd: ${selection.selectedWinOdd.toFixed(2)}`;
                } else { line3Text = `(${fixture.status})`; }
            } else { line3Text = "Error"; }
        }
        const line1Span = document.createElement('span'); line1Span.classList.add('cal-line', 'cal-line-1'); line1Span.innerHTML = line1Text;
        const line2Span = document.createElement('span'); line2Span.classList.add('cal-line', 'cal-line-2'); line2Span.innerHTML = line2Text;
        const line3Span = document.createElement('span'); line3Span.classList.add('cal-line', 'cal-line-3'); line3Span.innerHTML = line3Text;
        dayButton.appendChild(line1Span); dayButton.appendChild(line2Span); dayButton.appendChild(line3Span);
        if (getDateString(selectedDate) === dateStr) dayButton.classList.add('active');
        dayButton.addEventListener('click', () => {
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL'; generateCalendar(); populateDailyLeagueSlicers(); updateDisplayedFixtures();
            }
        });
        weekViewContainer.appendChild(dayButton);
    }
}

function populateDailyLeagueSlicers() {
    if (!leagueSlicerContainer) return; // Ensure container exists
    const selectedDateStr = getDateString(selectedDate);
    const leaguesToday = new Map();
    fakeFixtures.forEach(fixture => { /* ... keep logic ... */ });
    leagueSlicerContainer.innerHTML = '';
    if (leaguesToday.size > 0) { /* ... create 'All Leagues' button ... */ }
    const sortedLeagues = [...leaguesToday.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    sortedLeagues.forEach(([league, country]) => { /* ... create league buttons with flags ... */ });
    const slicerArea = document.getElementById('daily-league-slicers');
    if (slicerArea) slicerArea.style.display = leaguesToday.size > 0 ? 'flex' : 'none';
}

function handleSlicerClick(event) {
    const clickedButton = event.target.closest('button.league-slicer');
    if (!clickedButton || clickedButton.dataset.league === selectedLeagueFilter) return;
    selectedLeagueFilter = clickedButton.dataset.league;
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateDisplayedFixtures();
}

function updateDisplayedFixtures() {
    if (!fixtureListDiv) return; // Ensure container exists
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    const filteredFixtures = fakeFixtures.filter(fixture => { /* ... keep logic ... */ });
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime);
}

function displayFixtures(fixtures, currentTime) { /* ... Keep the LATEST version from response #61 ... */ }

function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    if (!auth.currentUser) { alert("Please log in or sign up to make a pick!"); return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    const existingSelection = userSelections[selectedDateStr];
    if (existingSelection) { /* ... check if locked ... */ }
    const clickedFixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
    if (!clickedFixture) return;
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) { alert("This match has already started..."); return; }
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        delete userSelections[selectedDateStr];
        // TODO: Delete from Firestore
    } else {
        const newSelection = { /* ... create selection object including userId ... */ };
        userSelections[selectedDateStr] = newSelection;
        // TODO: Save to Firestore
    }
    saveUserDataToLocal(); // Temp save
    generateCalendar();
    updateDisplayedFixtures();
}

function calculateScore(selection, fixture) { /* ... Keep function from response #59 (with Math.max) ... */ }

// Loads data initially from local storage
function loadUserDataFromLocal() {
    console.log("Loading selections from Local Storage (temporary)");
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) { try { userSelections = JSON.parse(savedSelections); } catch (e) { console.error(e); userSelections = {}; } }
    else { userSelections = {}; }
    // Don't update UI here, let DOMContentLoaded or onAuthStateChanged handle it
}

// Saves data temporarily to local storage
function saveUserDataToLocal() {
    console.log("Saving selections to Local Storage (temporary)");
    try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
    catch (e) { console.error(e); }
}

// Placeholder for Firestore loading
function loadUserPicksFromFirestore(userId) {
    console.log(`TODO: Load picks for user ${userId} from Firestore and update userSelections object.`);
    userSelections = {}; // Clear local state on login trigger
    console.log("Cleared local userSelections, waiting for Firestore load (not implemented yet).");
    generateCalendar(); // Refresh UI to show 'No Pick'
    updateDisplayedFixtures();
}

// Helper for friendlier error messages
function getFriendlyAuthError(error) { /* ... Keep function from response #59 ... */ }


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded, assigning elements and adding listeners...");

    // Assign DOM Elements *after* DOM is loaded
    weekViewContainer = document.getElementById('week-view');
    fixtureListDiv = document.getElementById('fixture-list');
    leagueSlicerContainer = document.getElementById('league-slicer-container');
    scoreListUl = document.getElementById('score-list');
    authSection = document.getElementById('auth-section');
    loginForm = document.getElementById('login-form');
    signupForm = document.getElementById('signup-form');
    userInfo = document.getElementById('user-info');
    loginEmailInput = document.getElementById('login-email');
    loginPasswordInput = document.getElementById('login-password');
    loginButton = document.getElementById('login-button');
    loginErrorP = document.getElementById('login-error');
    showSignupButton = document.getElementById('show-signup');
    signupEmailInput = document.getElementById('signup-email');
    signupPasswordInput = document.getElementById('signup-password');
    signupButton = document.getElementById('signup-button');
    signupErrorP = document.getElementById('signup-error');
    showLoginButton = document.getElementById('show-login');
    userEmailSpan = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');

    // Attach Auth Event Listeners *after* elements are assigned
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { /* ... show/hide logic ... */ }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { /* ... show/hide logic ... */ }); }
    if (loginButton) { loginButton.addEventListener('click', () => { /* ... signIn call ... */ }); }
    if (signupButton) { signupButton.addEventListener('click', () => { /* ... createUser call ... */ }); }
    if (logoutButton) { logoutButton.addEventListener('click', () => { /* ... signOut call ... */ }); }

    // Initial Load and Display
    loadUserDataFromLocal(); // Load any existing local data
    generateCalendar(); // Initial calendar draw
    populateDailyLeagueSlicers(); // Initial slicer draw
    updateDisplayedFixtures(); // Initial fixture draw

    console.log("Initial setup complete.");
});
