// script.js - FINAL VERSION - Reads Fixtures from Firestore

// --- Firebase Initialization (ES Module Version) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js"; // Added Firestore doc/getDoc

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
const now = new Date(); // Use REAL current date for calendar 'Today' reference
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("Invalid date passed to getDateString:", date);
        const today = new Date(); return today.toISOString().split('T')[0];
    }
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// Flag Mapping & URL Generation (Using flagcdn.com)
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


// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Default to actual today
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds locally loaded/saved picks for the CURRENT user
let currentUserId = null;
// No need for global currentFixtures if fetched per date


// --- DOM Element References (Declared globally, assigned in init) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
let authSection, loginForm, signupForm, userInfo;
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let showSignupButton, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;
let showLoginButton, userEmailSpan, logoutButton;


// --- Authentication State Listener ---
onAuthStateChanged(auth, user => {
    if(loginErrorP) loginErrorP.textContent = '';
    if(signupErrorP) signupErrorP.textContent = '';

    if (user) { // User signed in
        console.log("Auth State Changed: User logged in:", user.email, user.uid);
        currentUserId = user.uid;
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        if(loginForm) loginForm.style.display = 'none';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'block';
        if(authSection) { /* Hide auth section styles */
             authSection.style.border = 'none'; authSection.style.boxShadow = 'none';
             authSection.style.background = 'none'; authSection.style.padding = '0 0 1.5rem 0';
        }
        loadUserPicksFromFirestore(user.uid); // Placeholder call (will eventually load picks from DB)
    } else { // User signed out
        console.log("Auth State Changed: User logged out");
        currentUserId = null;
        if(userEmailSpan) userEmailSpan.textContent = '';
        if(loginForm) loginForm.style.display = 'block';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'none';
         if(authSection) { /* Restore section styling */
             authSection.style.border = '1px solid var(--divider-color)';
             authSection.style.boxShadow = 'var(--elevation-1)';
             authSection.style.background = 'var(--card-background-color)';
             authSection.style.padding = '1.5rem';
         }
        userSelections = {}; // Clear local state
        localStorage.removeItem('footballGameSelections');
        // Refresh UI after clearing data
        requestAnimationFrame(() => {
             if(typeof generateCalendar === 'function') generateCalendar();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures(); // Refetch/display fixtures
        });
    }
});

// --- Firestore Fixture Fetch Function ---
/**
 * Fetches pre-saved fixture data for a specific date from Firestore.
 * @param {string} dateStr - Date in YYYY-MM-DD format.
 * @returns {Promise<Array>} Array of fixture objects or empty array.
 */
async function fetchFixturesFromFirestore(dateStr) {
    console.log(`Workspaceing fixtures from Firestore for ${dateStr}`);
    const docRef = doc(db, "fixturesByDate", dateStr); // Path: /fixturesByDate/YYYY-MM-DD
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Ensure 'fixtures' field exists and is an array
            if (Array.isArray(data.fixtures)) {
                console.log(`Firestore data found for ${dateStr}:`, data.fixtures.length, "fixtures");
                return data.fixtures;
            } else {
                console.warn(`Firestore doc ${dateStr} exists but 'fixtures' field is not an array.`, data);
                return [];
            }
        } else {
            console.log(`No pre-fetched fixture data found in Firestore for ${dateStr}`);
            return [];
        }
    } catch (error) {
        console.error(`Error fetching fixtures from Firestore for ${dateStr}:`, error);
        alert(`Could not load match data for ${dateStr}. Please try again later.`);
        return []; // Return empty on error
    }
}


// --- Core Game Functions ---

/**
 * Generates calendar navigation (5 days). Displays Day/Date and Picked Team Name only.
 */
function generateCalendar() {
    if (!weekViewContainer) return;
    weekViewContainer.innerHTML = '';
    const todayForCalendar = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Use 'now' for consistency
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (let i = -1; i <= 3; i++) {
        const date = new Date(todayForCalendar.getTime() + i * oneDay);
        const dateStr = getDateString(date);
        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day'); dayButton.dataset.date = dateStr;
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`;
        if (i === 0) line1Text = `<b>TODAY ${date.getDate()}</b>`;
        let line2Text = "No Pick"; let line3Text = "&nbsp;";
        const selection = userSelections[dateStr]; // Check local/loaded selections
        if (selection?.teamName) line2Text = `<b>${selection.teamName}</b>`;
        // Removed score/odd display from calendar for simplicity
        const line1Span = document.createElement('span'); line1Span.classList.add('cal-line', 'cal-line-1'); line1Span.innerHTML = line1Text;
        const line2Span = document.createElement('span'); line2Span.classList.add('cal-line', 'cal-line-2'); line2Span.innerHTML = line2Text;
        const line3Span = document.createElement('span'); line3Span.classList.add('cal-line', 'cal-line-3'); line3Span.innerHTML = line3Text;
        dayButton.appendChild(line1Span); dayButton.appendChild(line2Span); dayButton.appendChild(line3Span);
        if (getDateString(selectedDate) === dateStr) dayButton.classList.add('active');
        dayButton.addEventListener('click', async () => {
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL'; generateCalendar(); // Redraw sync
                await updateDisplayedFixtures(); // Fetch/display async
            }
        });
        weekViewContainer.appendChild(dayButton);
    }
}

/**
 * Populates league slicers based on available fixtures for the selected day.
 */
function populateDailyLeagueSlicers(fixturesData) {
    if (!leagueSlicerContainer) return;
    if (!fixturesData) fixturesData = [];
    const leaguesToday = new Map();
    fixturesData.forEach(fixture => { if (fixture && !leaguesToday.has(fixture.competition)) leaguesToday.set(fixture.competition, fixture.country);});
    leagueSlicerContainer.innerHTML = '';
    const slicerArea = document.getElementById('daily-league-slicers');
    if (leaguesToday.size === 0) { if(slicerArea) slicerArea.style.display = 'none'; return; }
    if(slicerArea) slicerArea.style.display = 'flex';
    const allButton = document.createElement('button'); allButton.textContent = 'All Leagues'; allButton.classList.add('league-slicer'); if (selectedLeagueFilter === 'ALL') allButton.classList.add('active'); allButton.dataset.league = 'ALL'; allButton.addEventListener('click', handleSlicerClick); leagueSlicerContainer.appendChild(allButton);
    const sortedLeagues = [...leaguesToday.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    sortedLeagues.forEach(([league, country]) => {
        const button = document.createElement('button'); const flagUrl = getFlagUrl(country); let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${country} flag" class="inline-flag">&nbsp;` : '';
        button.innerHTML = `${flagHtml}${league}`; button.classList.add('league-slicer'); if (selectedLeagueFilter === league) button.classList.add('active'); button.dataset.league = league; button.addEventListener('click', handleSlicerClick); leagueSlicerContainer.appendChild(button);
    });
}

/**
 * Handles clicks on league slicer buttons.
 */
function handleSlicerClick(event) {
    const clickedButton = event.target.closest('button.league-slicer');
    if (!clickedButton || clickedButton.dataset.league === selectedLeagueFilter) return;
    selectedLeagueFilter = clickedButton.dataset.league;
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateDisplayedFixtures(); // Refilter based on currentFixtures data
}

/**
 * Fetches data from Firestore for the selected date, filters it, and calls displayFixtures.
 */
async function updateDisplayedFixtures() {
    if (!fixtureListDiv) { console.error("Fixture list div not found for update"); return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    console.log(`Updating display for date: ${selectedDateStr}, league: ${selectedLeagueFilter}`);
    fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center;">Loading matches...</p>';

    // Fetch data for the selected date FROM FIRESTORE
    const fixturesForDay = await fetchFixturesFromFirestore(selectedDateStr);

    // Update slicers based on the fetched data for the day
    populateDailyLeagueSlicers(fixturesForDay);

    // Filter fetched data by league
    const filteredFixtures = fixturesForDay.filter(fixture => {
        if (!fixture) return false;
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        return true;
    });

    console.log(`Found ${filteredFixtures.length} fixtures to display after filtering.`);
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime); // Display the filtered list
}


/**
 * Renders the list of fixtures. Shows Pick button OR calculated points.
 */
function displayFixtures(fixtures, currentTime) {
    if (!fixtureListDiv) { console.error("Cannot display fixtures, list div not found."); if(fixtureListDiv) fixtureListDiv.innerHTML = '<p>Error: Fixture list container missing.</p>'; return; }
    fixtureListDiv.innerHTML = '';
    // console.log(`--- displayFixtures: Rendering ${fixtures?.length ?? 0} fixtures ---`);

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">No matches found for the selected day/filters.</p>';
        return;
    }
    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach((fixture, index) => {
        try {
            // Robust check for essential fixture data
            if (!fixture || !fixture.fixtureId || !fixture.homeTeam?.id || !fixture.awayTeam?.id || !fixture.odds || !fixture.kickOffTime || !fixture.homeTeam?.name || !fixture.awayTeam?.name) {
                 console.warn(`Skipping fixture render index ${index} due to missing critical data:`, fixture); return;
            }
            const fixtureElement = document.createElement('div'); fixtureElement.classList.add('fixture');
            const kickOff = new Date(fixture.kickOffTime);
            const validKickoff = !isNaN(kickOff.getTime());
            const canSelect = validKickoff && fixture.status === 'SCHEDULED' && kickOff > currentTime;
            const timeString = validKickoff ? kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "TBD";
            const detailsTop = document.createElement('div'); detailsTop.classList.add('fixture-details-top');
            const flagUrl = getFlagUrl(fixture.country); let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${fixture.country || 'N/A'} flag" class="inline-flag">&nbsp;` : '';
            detailsTop.innerHTML = `${flagHtml}${fixture.competition || 'N/A'} - ${timeString}`; fixtureElement.appendChild(detailsTop);
            // Home Team Row
            const homeRow = document.createElement('div'); homeRow.classList.add('team-row');
            const homeName = document.createElement('span'); homeName.classList.add('team-name'); homeName.textContent = fixture.homeTeam.name; homeRow.appendChild(homeName);
            const homeScoreSpan = document.createElement('span'); homeScoreSpan.classList.add('team-score'); if (fixture.status === 'FINISHED' && fixture.result?.homeScore !== null && fixture.result?.homeScore !== undefined) { homeScoreSpan.textContent = fixture.result.homeScore; homeScoreSpan.classList.add('has-score'); } else { homeScoreSpan.textContent = ''; } homeRow.appendChild(homeScoreSpan);
            const homeOdd = document.createElement('span'); homeOdd.classList.add('team-odd'); homeOdd.textContent = fixture.odds.homeWin?.toFixed(2) || '-'; homeRow.appendChild(homeOdd);
            if (canSelect) { const btn = document.createElement('button'); btn.classList.add('pick-button'); btn.textContent = "Pick"; btn.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw); if (currentDaySelection?.fixtureId === fixture.fixtureId && currentDaySelection?.teamId === fixture.homeTeam.id) { btn.classList.add('selected-team'); btn.textContent = "Picked"; } homeRow.appendChild(btn); }
            else if (fixture.status === 'FINISHED' && fixture.result) { const sel = { teamId: fixture.homeTeam.id, selectedWinOdd: fixture.odds.homeWin, fixtureDrawOdd: fixture.odds.draw }; const pts = calculateScore(sel, fixture); const span = document.createElement('span'); span.classList.add('fixture-points'); if (pts !== null) { span.textContent = `${pts.toFixed(1)} pts`; if (pts > 0) span.classList.add('positive');} else { span.textContent = '-'; } homeRow.appendChild(span); }
            fixtureElement.appendChild(homeRow);
            // Away Team Row
            const awayRow = document.createElement('div'); awayRow.classList.add('team-row');
            const awayName = document.createElement('span'); awayName.classList.add('team-name'); awayName.textContent = fixture.awayTeam.name; awayRow.appendChild(awayName);
            const awayScoreSpan = document.createElement('span'); awayScoreSpan.classList.add('team-score'); if (fixture.status === 'FINISHED' && fixture.result?.awayScore !== null && fixture.result?.awayScore !== undefined) { awayScoreSpan.textContent = fixture.result.awayScore; awayScoreSpan.classList.add('has-score'); } else { awayScoreSpan.textContent = ''; } awayRow.appendChild(awayScoreSpan);
            const awayOdd = document.createElement('span'); awayOdd.classList.add('team-odd'); awayOdd.textContent = fixture.odds.awayWin?.toFixed(2) || '-'; awayRow.appendChild(awayOdd);
             if (canSelect) { const btn = document.createElement('button'); btn.classList.add('pick-button'); btn.textContent = "Pick"; btn.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw); if (currentDaySelection?.fixtureId === fixture.fixtureId && currentDaySelection?.teamId === fixture.awayTeam.id) { btn.classList.add('selected-team'); btn.textContent = "Picked"; } awayRow.appendChild(btn); }
             else if (fixture.status === 'FINISHED' && fixture.result) { const sel = { teamId: fixture.awayTeam.id, selectedWinOdd: fixture.odds.awayWin, fixtureDrawOdd: fixture.odds.draw }; const pts = calculateScore(sel, fixture); const span = document.createElement('span'); span.classList.add('fixture-points'); if (pts !== null) { span.textContent = `${pts.toFixed(1)} pts`; if (pts > 0) span.classList.add('positive'); } else { span.textContent = '-'; } awayRow.appendChild(span); }
            fixtureElement.appendChild(awayRow);
             // Bottom Details
            const detailsBottom = document.createElement('div'); detailsBottom.classList.add('fixture-details-bottom'); let bottomText = ''; if (fixture.status && fixture.status !== 'SCHEDULED' && fixture.status !== 'FINISHED') { bottomText = `<span style="font-style:italic; color:var(--error-text-color)">(${fixture.status})</span>`; } if (bottomText) { detailsBottom.innerHTML = bottomText; fixtureElement.appendChild(detailsBottom); }
            fixtureListDiv.appendChild(fixtureElement);
        } catch (error) { console.error(`Error processing fixture ${fixture?.fixtureId || `index ${index}`}:`, error); }
    });
     // console.log(`--- displayFixtures: Finished loop ---`);
}


// handleSelection - checks login, locks, saves locally (Firestore TODO)
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    if (!auth.currentUser) { alert("Please log in or sign up to make a pick!"); return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    const existingSelection = userSelections[selectedDateStr];

    // Find the existing fixture from the currently displayed data for the lock check
    const existingFixture = currentFixtures.find(f => f?.fixtureId === existingSelection?.fixtureId);
    if (existingSelection && existingFixture && new Date(existingFixture.kickOffTime) <= realCurrentTime) {
        alert(`Your pick (${existingSelection.teamName}) for ${selectedDateStr} is locked.`); return;
    }

    // Find the clicked fixture from the currently displayed data
    const clickedFixture = currentFixtures.find(f => f?.fixtureId === fixtureId);
    if (!clickedFixture) { console.error("Clicked fixture not found in current data"); return; }
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) { alert("This match has already started..."); return; }

    // Select / Deselect / Overwrite
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        delete userSelections[selectedDateStr]; console.log(`Deselected team ${teamId} for ${selectedDateStr}`);
        // TODO: Delete pick from Firestore: deletePickFromFirestore(auth.currentUser.uid, selectedDateStr);
    } else {
        const newSelection = {
            fixtureId: fixtureId, teamId: teamId, teamName: teamName || 'Unknown',
            selectedWinOdd: teamWinOdd || 1.0, fixtureDrawOdd: drawOdd || 1.0,
            selectionTime: realCurrentTime.toISOString(), userId: auth.currentUser.uid
        };
        userSelections[selectedDateStr] = newSelection;
        console.log(`Selected/Changed to team ${teamId} (Fixture ${fixtureId}) for ${selectedDateStr}`);
        // TODO: Save pick to Firestore: savePickToFirestore(auth.currentUser.uid, selectedDateStr, newSelection);
    }
    saveUserDataToLocal(); // Temp save
    generateCalendar(); // Update calendar immediately
    updateDisplayedFixtures(); // Update list button states
}

// calculateScore - uses Math.max, checks data
function calculateScore(selection, fixture) {
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result || selection.selectedWinOdd === undefined || selection.fixtureDrawOdd === undefined) { return null; }
    let score = 0; const isHome = String(fixture.homeTeam.id) === String(selection.teamId); // Compare as strings
    const teamScore = isHome ? fixture.result.homeScore : fixture.result.awayScore;
    const oppScore = isHome ? fixture.result.awayScore : fixture.result.homeScore;
    if (teamScore === null || teamScore === undefined || oppScore === null || oppScore === undefined) return null;
    if (teamScore > oppScore) score += (selection.selectedWinOdd || 1.0) * 5;
    else if (teamScore === oppScore) score += (selection.fixtureDrawOdd || 1.0) * 2;
    score += teamScore * 3; score -= oppScore * 1;
    return Math.max(0, score);
}

// Loads from local storage only
function loadUserDataFromLocal() {
    console.log("Loading selections from Local Storage (temporary)");
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) { try { userSelections = JSON.parse(savedSelections); } catch (e) { console.error("Error parsing local selections:", e); userSelections = {}; } }
    else { userSelections = {}; }
}

// Saves only to local storage
function saveUserDataToLocal() {
    console.log("Saving selections to Local Storage (temporary)");
     try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
     catch (e) { console.error("Error saving selections to localStorage:", e); }
}

// Placeholder for Firestore loading
function loadUserPicksFromFirestore(userId) {
    console.log(`TODO: Load picks for user ${userId} from Firestore and update userSelections object.`);
    userSelections = {}; // Clear local state on login for now
    console.log("Cleared local userSelections, waiting for Firestore load (not implemented yet).");
    // Refresh UI immediately after clearing local state
    if(typeof generateCalendar === 'function') generateCalendar();
    if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
}


// --- Initialization Function ---
async function initializeAppAndListeners() {
    console.log("DOM Loaded, assigning elements and listeners...");

    // Assign DOM Elements
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

     if (!weekViewContainer || !fixtureListDiv || !loginForm || !signupForm || !userInfo || !leagueSlicerContainer) {
         console.error("One or more critical DOM elements not found!");
         return;
     }

    // Attach Auth Event Listeners
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(loginErrorP) loginErrorP.textContent = ''; }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(signupErrorP) signupErrorP.textContent = ''; }); }
    if (loginButton) { loginButton.addEventListener('click', () => { if (!loginEmailInput || !loginPasswordInput) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; if(loginErrorP) loginErrorP.textContent = ''; signInWithEmailAndPassword(auth, email, password).then((cred) => console.log("Login OK")).catch((err) => { if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (signupButton) { signupButton.addEventListener('click', () => { if (!signupEmailInput || !signupPasswordInput) return; const email = signupEmailInput.value; const password = signupPasswordInput.value; if(signupErrorP) signupErrorP.textContent = ''; createUserWithEmailAndPassword(auth, email, password).then((cred) => console.log("Signup OK")).catch((err) => { if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (logoutButton) { logoutButton.addEventListener('click', () => { signOut(auth).catch((err) => { console.error(err); alert("Logout failed."); }); }); }

    // Initial Load
    loadUserDataFromLocal(); // Load local state first
    generateCalendar(); // Draw calendar based on local state
    await updateDisplayedFixtures(); // Fetch data for initial date & display

    console.log("Initial setup complete.");
}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initializeAppAndListeners);
