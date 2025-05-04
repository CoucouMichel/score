// script.js - FINAL COMPLETE - Firebase Auth + Firestore Fixture Reads + Firestore Pick Save/Load

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
        console.error("Invalid date passed to getDateString:", date);
        const today = new Date(); return today.toISOString().split('T')[0];
    }
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// --- Add this Helper Function (e.g., after getDateString) ---
/**
 * Gets the date for the start of the week (Sunday) containing the given date.
 */
function getStartOfWeek(date) {
  const dt = new Date(date); // Clone date
  const day = dt.getDay(); // 0 = Sunday
  const diff = dt.getDate() - day;
  dt.setHours(0, 0, 0, 0); // Avoid DST issues
  dt.setDate(diff);
  return dt;
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

// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks loaded from Firestore for the logged-in user
let currentUserId = null;
let currentUserProfile = null;
let currentFixtures = []; // Holds fixtures for the currently displayed day (fetched from Firestore)
let isUpdatingFixtures = false;

// --- DOM Element References (Declared globally, assigned in init) ---
// Game UI
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
// Calendar Nav
let prevWeekBtn, nextWeekBtn; // If using weekly calendar
// Header Auth Area
let headerLoginLink, headerUserInfo, headerUsername, headerLogoutButton;
// Modal Elements
let authModal, modalOverlay, modalCloseBtn, modalLoginForm, modalSignupForm, showLoginTab, showSignupTab;
// Modal Form Inputs/Buttons/Errors (These use IDs *inside* the modal)
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let signupUsernameInput, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;

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
            if (Array.isArray(data.fixtures)) {
                console.log(`Firestore data found for ${dateStr}: ${data.fixtures.length} fixtures`);
                return data.fixtures;
            } else { console.warn(`Firestore doc ${dateStr} invalid format.`, data); return []; }
        } else { console.log(`No pre-fetched fixture data found in Firestore for ${dateStr}`); return []; }
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
            else { console.warn("Found pick without date field:", doc.id, pick); }
        });
        userSelections = tempSelections; // Assign loaded picks to global state
        console.log("Loaded user picks from Firestore:", userSelections);
    } catch (error) {
        console.error("Error loading user picks:", error);
        userSelections = {}; // Reset on error
        alert("Could not load your saved picks.");
    }
    // UI updates (calendar/fixtures) should be called AFTER this promise resolves in onAuthStateChanged
}

/** Saves/Updates a single pick document in Firestore */
async function savePickToFirestore(selectionData) {
    if (!selectionData?.userId || !selectionData?.date || !db) {
        console.error("Cannot save pick, missing userId/date or DB not ready", selectionData); return false;
    }
    const docId = `${selectionData.userId}_${selectionData.date}`; // Use combined ID
    const pickDocRef = doc(db, "userPicks", docId);
    console.log(`Saving pick to Firestore: /userPicks/${docId}`);
    try {
        await setDoc(pickDocRef, selectionData); // Creates or overwrites
        console.log("Pick saved successfully!"); return true;
    } catch (error) { console.error("Error saving pick to Firestore: ", error); alert("Error saving your pick."); return false; }
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

/**
 * Generates calendar navigation (5 days: -1, Selected, +1, +2, +3 relative to selectedDate).
 */
function generateCalendar() {
    // Ensure elements are assigned before running
    if (!weekViewContainer) { console.error("Calendar container not found"); return; }

    weekViewContainer.innerHTML = ''; // Clear previous calendar
    const todayActual = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Actual 'today' date for comparison
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; // Using uppercase abbreviations

    // Loop for 5 days relative to selectedDate: Day-1, Day, Day+1, Day+2, Day+3
    for (let i = -1; i <= 3; i++) {
        const date = new Date(selectedDate.getTime() + i * oneDay); // Calculate date based on selectedDate
        const dateStr = getDateString(date);
        if (!dateStr) continue;

        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day');
        dayButton.dataset.date = dateStr;

        // --- Determine content for each line ---
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`; // e.g., "FRI 18"
        // Check if this button's date IS the actual current date
        if (dateStr === getDateString(todayActual)) {
            line1Text = `<b>TODAY ${date.getDate()}</b>`; // Bold Today + Date
        }

        let line2Text = "No Pick";
        let line3Text = "&nbsp;";
        const selection = userSelections[dateStr]; // Check loaded userSelections
        if (selection?.teamName) {
            line2Text = `<b>${selection.teamName}</b>`;
        }

        // Create and append spans
        const line1Span = document.createElement('span'); line1Span.classList.add('cal-line', 'cal-line-1'); line1Span.innerHTML = line1Text;
        const line2Span = document.createElement('span'); line2Span.classList.add('cal-line', 'cal-line-2'); line2Span.innerHTML = line2Text;
        const line3Span = document.createElement('span'); line3Span.classList.add('cal-line', 'cal-line-3'); line3Span.innerHTML = line3Text;
        dayButton.appendChild(line1Span); dayButton.appendChild(line2Span); dayButton.appendChild(line3Span);

        // Set active state if this button's date IS the selectedDate
        if (getDateString(selectedDate) === dateStr) {
            dayButton.classList.add('active');
        }

        // Click listener - select this specific day
        dayButton.addEventListener('click', async () => {
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL';
                generateCalendar(); // Redraw calendar to update active state
                await updateDisplayedFixtures(); // Fetch/display fixtures for newly selected day
            }
        });
        weekViewContainer.appendChild(dayButton);
    }
}

function populateDailyLeagueSlicers(fixturesData) {
    if (!leagueSlicerContainer) return;
    if (!fixturesData) fixturesData = [];
    const leaguesToday = new Map();
    fixturesData.forEach(fixture => { if (fixture?.competition && !leaguesToday.has(fixture.competition)) leaguesToday.set(fixture.competition, fixture.country);});
    leagueSlicerContainer.innerHTML = '';
    const slicerArea = document.getElementById('daily-league-slicers');
    if (leaguesToday.size === 0) { if(slicerArea) slicerArea.style.display = 'none'; return; }
    if(slicerArea) slicerArea.style.display = 'flex';
    const allButton = document.createElement('button'); allButton.textContent = 'All Leagues'; allButton.classList.add('league-slicer'); if (selectedLeagueFilter === 'ALL') allButton.classList.add('active'); allButton.dataset.league = 'ALL'; allButton.addEventListener('click', handleSlicerClick); leagueSlicerContainer.appendChild(allButton);
    const sortedLeagues = [...leaguesToday.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    sortedLeagues.forEach(([league, country]) => {
        const button = document.createElement('button'); const flagUrl = getFlagUrl(country); let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${country || '?'} flag" class="inline-flag">&nbsp;` : '';
        button.innerHTML = `${flagHtml}${league}`; button.classList.add('league-slicer'); if (selectedLeagueFilter === league) button.classList.add('active'); button.dataset.league = league; button.addEventListener('click', handleSlicerClick); leagueSlicerContainer.appendChild(button);
    });
}

function handleSlicerClick(event) {
    const clickedButton = event.target.closest('button.league-slicer');
    if (!clickedButton || clickedButton.dataset.league === selectedLeagueFilter) return;
    selectedLeagueFilter = clickedButton.dataset.league;
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateDisplayedFixtures(); // Refilter based on currently loaded currentFixtures
}

async function updateDisplayedFixtures() {
    if (isUpdatingFixtures) { console.log("UpdateDisplayedFixtures already running..."); return; }
    isUpdatingFixtures = true;
    if (!fixtureListDiv || !leagueSlicerContainer) { console.error("UI containers not ready for updateDisplayedFixtures"); isUpdatingFixtures = false; return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    console.log(`Updating display for date: ${selectedDateStr}, league: ${selectedLeagueFilter}`);
    fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">Loading matches...</p>';

    try {
        const fixturesForDay = await fetchFixturesFromFirestore(selectedDateStr);
        currentFixtures = fixturesForDay; // Store globally

        populateDailyLeagueSlicers(fixturesForDay); // Update slicers

        const filteredFixtures = currentFixtures.filter(fixture => { // Filter global data
            if (!fixture) return false;
            if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
            return true;
        });
        console.log(`Found ${filteredFixtures.length} fixtures to display after filtering.`);
        filteredFixtures.sort((a, b) => { try { return new Date(a.kickOffTime) - new Date(b.kickOffTime); } catch(e) { return 0; }});
        displayFixtures(filteredFixtures, realCurrentTime); // Display the filtered list

    } catch (error) {
        console.error("Error during updateDisplayedFixtures:", error);
        if(fixtureListDiv) fixtureListDiv.innerHTML = '<p style="color: var(--error-text-color); text-align: center; grid-column: 1 / -1;">Error loading fixtures.</p>';
    } finally {
        isUpdatingFixtures = false; // Reset flag
    }
}

function displayFixtures(fixtures, currentTime) {
    if (!fixtureListDiv) { console.error("Cannot display fixtures, list div not found."); return; }
    fixtureListDiv.innerHTML = '';
    // console.log(`--- displayFixtures rendering ${fixtures?.length ?? 0} fixtures ---`);
    if (!fixtures || fixtures.length === 0) { fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">No matches found for the selected day/filters.</p>'; return; }
    const currentDaySelection = userSelections[getDateString(selectedDate)];
    fixtures.forEach((fixture, index) => {
        try {
            if (!fixture || !fixture.fixtureId || !fixture.homeTeam?.id || !fixture.awayTeam?.id || !fixture.odds || !fixture.kickOffTime || !fixture.homeTeam?.name || !fixture.awayTeam?.name) { console.warn(`Skipping render index ${index}: missing data`); return; }
            const fixtureElement = document.createElement('div'); fixtureElement.classList.add('fixture'); const kickOff = new Date(fixture.kickOffTime); const validKickoff = !isNaN(kickOff.getTime()); const canSelect = validKickoff && fixture.status === 'SCHEDULED' && kickOff > currentTime; const timeString = validKickoff ? kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "TBD";
            const detailsTop = document.createElement('div'); detailsTop.classList.add('fixture-details-top'); const flagUrl = getFlagUrl(fixture.country); let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${fixture.country || 'N/A'} flag" class="inline-flag">&nbsp;` : ''; detailsTop.innerHTML = `${flagHtml}${fixture.competition || 'N/A'} - ${timeString}`; fixtureElement.appendChild(detailsTop);
            const homeRow = document.createElement('div'); homeRow.classList.add('team-row'); const homeName = document.createElement('span'); homeName.classList.add('team-name'); homeName.textContent = fixture.homeTeam.name; homeRow.appendChild(homeName); const homeScoreSpan = document.createElement('span'); homeScoreSpan.classList.add('team-score'); if (fixture.status === 'FINISHED' && fixture.result?.homeScore !== null && fixture.result?.homeScore !== undefined) { homeScoreSpan.textContent = fixture.result.homeScore; homeScoreSpan.classList.add('has-score'); } else { homeScoreSpan.textContent = ''; } homeRow.appendChild(homeScoreSpan); const homeOdd = document.createElement('span'); homeOdd.classList.add('team-odd'); homeOdd.textContent = fixture.odds.homeWin?.toFixed(2) || '-'; homeRow.appendChild(homeOdd);
            if (canSelect) { const btn = document.createElement('button'); btn.classList.add('pick-button'); btn.textContent = "Pick"; btn.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw); if (currentDaySelection?.fixtureId === fixture.fixtureId && currentDaySelection?.teamId === fixture.homeTeam.id) { btn.classList.add('selected-team'); btn.textContent = "Picked"; } homeRow.appendChild(btn); }
            else if (fixture.status === 'FINISHED' && fixture.result) { const sel = { teamId: fixture.homeTeam.id, selectedWinOdd: fixture.odds.homeWin, fixtureDrawOdd: fixture.odds.draw }; const pts = calculateScore(sel, fixture); const span = document.createElement('span'); span.classList.add('fixture-points'); if (pts !== null) { span.textContent = `${pts.toFixed(1)} pts`; if (pts > 0) span.classList.add('positive');} else { span.textContent = '-'; } homeRow.appendChild(span); }
            fixtureElement.appendChild(homeRow);
            const awayRow = document.createElement('div'); awayRow.classList.add('team-row'); const awayName = document.createElement('span'); awayName.classList.add('team-name'); awayName.textContent = fixture.awayTeam.name; awayRow.appendChild(awayName); const awayScoreSpan = document.createElement('span'); awayScoreSpan.classList.add('team-score'); if (fixture.status === 'FINISHED' && fixture.result?.awayScore !== null && fixture.result?.awayScore !== undefined) { awayScoreSpan.textContent = fixture.result.awayScore; awayScoreSpan.classList.add('has-score'); } else { awayScoreSpan.textContent = ''; } awayRow.appendChild(awayScoreSpan); const awayOdd = document.createElement('span'); awayOdd.classList.add('team-odd'); awayOdd.textContent = fixture.odds.awayWin?.toFixed(2) || '-'; awayRow.appendChild(awayOdd);
             if (canSelect) { const btn = document.createElement('button'); btn.classList.add('pick-button'); btn.textContent = "Pick"; btn.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw); if (currentDaySelection?.fixtureId === fixture.fixtureId && currentDaySelection?.teamId === fixture.awayTeam.id) { btn.classList.add('selected-team'); btn.textContent = "Picked"; } awayRow.appendChild(btn); }
             else if (fixture.status === 'FINISHED' && fixture.result) { const sel = { teamId: fixture.awayTeam.id, selectedWinOdd: fixture.odds.awayWin, fixtureDrawOdd: fixture.odds.draw }; const pts = calculateScore(sel, fixture); const span = document.createElement('span'); span.classList.add('fixture-points'); if (pts !== null) { span.textContent = `${pts.toFixed(1)} pts`; if (pts > 0) span.classList.add('positive'); } else { span.textContent = '-'; } awayRow.appendChild(span); }
            fixtureElement.appendChild(awayRow);
            const detailsBottom = document.createElement('div'); detailsBottom.classList.add('fixture-details-bottom'); let bottomText = ''; if (fixture.status && fixture.status !== 'SCHEDULED' && fixture.status !== 'FINISHED') { bottomText = `<span style="font-style:italic; color:var(--error-text-color)">(${fixture.status})</span>`; } if (bottomText) { detailsBottom.innerHTML = bottomText; fixtureElement.appendChild(detailsBottom); }
            if(fixtureListDiv) fixtureListDiv.appendChild(fixtureElement); // Check again before append
        } catch (error) { console.error(`Error processing fixture ${fixture?.fixtureId || `index ${index}`}:`, error); }
    });
}

// REPLACE the existing handleSelection function in script.js

/**
 * Handles team selection. Allows changing picks until the *selected* game starts.
 * Saves/Deletes picks from Firestore.
 */
async function handleSelection(fixtureId, teamId, teamName /* removed odds params */ ) {
    // 1. Check Login
    if (!auth.currentUser) {
        alert("Please log in or sign up to make a pick!");
        return;
    }
    const userId = auth.currentUser.uid;
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();

    // 2. Check if an existing pick for this date is LOCKED (game started)
    const existingSelection = userSelections[selectedDateStr];
    if (existingSelection) {
        // Find the fixture corresponding to the *existing* pick in our current fixture list
        const existingFixture = currentFixtures.find(f => f?.fixtureId === existingSelection.fixtureId);
        if (existingFixture?.kickOffTime && new Date(existingFixture.kickOffTime) <= realCurrentTime) {
            // If the KICKED OFF game is the one selected, the pick is locked
            alert(`Your pick (${existingSelection.teamName}) for ${selectedDateStr} is locked because the match has started.`);
            return; // Cannot change or deselect
        }
        // If we reach here, a pick exists but is NOT locked yet.
    }

    // 3. Check if the game the user is trying to CLICK ON NOW has started
    const clickedFixture = currentFixtures.find(f => f?.fixtureId === fixtureId);
    if (!clickedFixture || !clickedFixture.kickOffTime || !clickedFixture.odds || !clickedFixture.homeTeam?.id) {
        console.error("Cannot make pick: Clicked fixture details/odds missing", fixtureId);
        alert("Could not find details for the selected match.");
        return;
    }
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) {
        alert("This match has already started, you cannot select it.");
        return; // Cannot select a game that has already started
    }

    // --- If checks pass, handle Select / Deselect / Overwrite ---

    // 5. Handle New Selection or Overwriting an Existing (unlocked) Pick
    else {
        // Get odds from the fixture data
        const homeWinOdd = clickedFixture.odds.homeWin;
        const awayWinOdd = clickedFixture.odds.awayWin;
        const selectedOddForSave = (String(teamId) === String(clickedFixture.homeTeam.id)) ? homeWinOdd : awayWinOdd;

        const newSelection = {
            userId: userId,
            date: selectedDateStr,
            fixtureId: fixtureId,
            teamId: String(teamId),
            teamName: teamName || 'Unknown',
            pickedOdd: selectedOddForSave || 1.0,
            selectionTime: realCurrentTime.toISOString()
        };

        console.log(`Saving/Updating pick for ${selectedDateStr}:`, newSelection);
        // Attempt to save/overwrite in Firestore
        const saveSuccess = await savePickToFirestore(newSelection);

        if (saveSuccess) {
            userSelections[selectedDateStr] = newSelection; // Update local state on success
            // saveUserDataToLocal(); // Keep removed or add back
            generateCalendar();
            updateDisplayedFixtures();
        } else {
            console.error("Failed to save pick to Firestore.");
        }
    }
}



// calculateScore - uses Win/Draw/Loss multipliers and new Goal Pts
function calculateScore(selection, fixture) {
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result || selection.selectedWinOdd === undefined || selection.teamId === undefined || !fixture.homeTeam?.id || !fixture.awayTeam?.id || fixture.result.homeScore === null || fixture.result.homeScore === undefined || fixture.result.awayScore === null || fixture.result.awayScore === undefined) { return null; }
    let score = 0; const teamId = String(selection.teamId); const homeId = String(fixture.homeTeam.id); const isHome = (teamId === homeId);
    const teamScore = isHome ? fixture.result.homeScore : fixture.result.awayScore;
    const oppScore = isHome ? fixture.result.awayScore : fixture.result.homeScore;
    const pickedOdd = selection.selectedWinOdd || 1.0; // Use the odd stored with the pick
    let resultMultiplier = 0; // Loss
    if (teamScore > oppScore) { resultMultiplier = 5; } // Win
    else if (teamScore === oppScore) { resultMultiplier = 2.5; } // Draw
    const outcomePoints = pickedOdd * resultMultiplier;
    const goalPoints = (teamScore * 2.5) - (oppScore * 1);
    const totalScore = outcomePoints + goalPoints;
    return Math.max(0, totalScore); // Min score is 0
}

// Auth error helper
function getFriendlyAuthError(error) {
    switch (error.code) {
        case 'auth/invalid-email': return 'Invalid email format.'; case 'auth/user-not-found': return 'No account found.'; case 'auth/wrong-password': return 'Incorrect password.';
        case 'auth/weak-password': return 'Password needs 6+ characters.'; case 'auth/email-already-in-use': return 'Email already registered.'; default: return 'An unknown auth error occurred.';
    }
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
    headerLoginLink = document.getElementById('header-login-link'); headerUserInfo = document.getElementById('header-user-info'); headerUsername = document.getElementById('header-username'); headerLogoutButton = document.getElementById('header-logout-button');
    authModal = document.getElementById('auth-modal'); modalOverlay = document.getElementById('modal-overlay'); modalCloseBtn = document.getElementById('modal-close-btn');
    modalLoginForm = document.getElementById('modal-login-form'); modalSignupForm = document.getElementById('modal-signup-form'); showLoginTab = document.getElementById('show-login-tab'); showSignupTab = document.getElementById('show-signup-tab');
    loginEmailInput = document.getElementById('login-email'); loginPasswordInput = document.getElementById('login-password'); loginButton = document.getElementById('login-button'); loginErrorP = document.getElementById('login-error');
    signupUsernameInput = document.getElementById('signup-username'); signupEmailInput = document.getElementById('signup-email'); signupPasswordInput = document.getElementById('signup-password'); signupButton = document.getElementById('signup-button'); signupErrorP = document.getElementById('signup-error');
    showLoginButton = document.getElementById('show-login');
    logoutButton = document.getElementById('logout-button');
    const prevWeekBtn = document.getElementById('cal-prev-week');
    const nextWeekBtn = document.getElementById('cal-next-week');


    // Attach Auth Event Listeners
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(loginErrorP) loginErrorP.textContent = ''; }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(signupErrorP) signupErrorP.textContent = ''; }); }
    if (loginButton) {
    loginButton.addEventListener('click', () => {
        if (!loginEmailInput || !loginPasswordInput) return;
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        if (loginErrorP) loginErrorP.textContent = '';
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Login successful!
                console.log("Login OK:", userCredential.user.uid);
                hideAuthModal(); // <<< CLOSE MODAL ON SUCCESS
                // onAuthStateChanged will handle other UI updates
            })
            .catch((err) => {
                console.error("Login Failed:", err);
                if (loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(err)}`;
            });
    });
}
// Inside initializeAppAndListeners function

if (signupButton) {
    signupButton.addEventListener('click', () => {
        if (!signupEmailInput || !signupPasswordInput || !signupUsernameInput) return;
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        const username = signupUsernameInput.value.trim();
        if (signupErrorP) signupErrorP.textContent = '';

        // Basic validation
        if (username.length < 3) { if (signupErrorP) signupErrorP.textContent = 'Username must be at least 3 characters.'; return; }
        if (/\s/.test(username)) { if (signupErrorP) signupErrorP.textContent = 'Username cannot contain spaces.'; return; }
        // TODO: Add check for username uniqueness in Firestore before creating user

        console.log(`Attempting signup for ${email} with username ${username}`);
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("Signup auth successful:", user.uid);
                // Save profile to Firestore
                const userDocRef = doc(db, "users", user.uid);
                return setDoc(userDocRef, { username: username, email: user.email, joinedAt: serverTimestamp() });
            })
            .then(() => {
                console.log("User profile saved.");
                // Clear form
                if (signupUsernameInput) signupUsernameInput.value = '';
                if (signupEmailInput) signupEmailInput.value = '';
                if (signupPasswordInput) signupPasswordInput.value = '';
                hideAuthModal(); // <<< CLOSE MODAL AFTER PROFILE SAVE
                // onAuthStateChanged will handle other UI updates
            })
            .catch((error) => {
                console.error("Signup/Profile Save Error:", error);
                // If error is 'auth/email-already-in-use', user might already exist
                // If error is Firestore related, user might be created but profile failed
                if (signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(error)}`;
            });
    });
}
    if (headerLogoutButton) { // Use the correct variable
        headerLogoutButton.addEventListener('click', () => {
            console.log("Logout button clicked");
            signOut(auth)
                .then(() => { console.log("Sign out successful initiated."); })
                .catch((error) => {
                    console.error("Logout Error:", error);
                    alert(`Logout failed: ${error.message}`);
                });
        });
    } else {
         console.error("Header logout button not found!");
    }
  
  // *** ADD Event Listeners for Calendar Navigation ***
    prevWeekBtn.addEventListener('click', async () => {
        selectedDate.setDate(selectedDate.getDate() - 1); // Move back 7 days
        generateCalendar(); // Redraw calendar for the new week
        await updateDisplayedFixtures(); // Fetch/display fixtures for the new selected date
    });

    nextWeekBtn.addEventListener('click', async () => {
        selectedDate.setDate(selectedDate.getDate() + 1); // Move forward 7 days
        generateCalendar(); // Redraw calendar for the new week
        await updateDisplayedFixtures(); // Fetch/display fixtures for the new selected date
    });
    // *** END Calendar Navigation Listeners ***

  
      // Initial Load
    generateCalendar();
    await updateDisplayedFixtures(); // Fetch initial data from Firestore and display
  }

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initializeAppAndListeners);
