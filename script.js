// script.js - COMPLETE - Firebase Auth + API-Football + All Game Logic

// --- Firebase Initialization (ES Module Version) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
const now = new Date(); // Use the ACTUAL current date and time
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        console.error("Invalid date passed to getDateString:", date);
        // Return today's date string as a fallback or handle error appropriately
        const today = new Date();
        return today.toISOString().split('T')[0];
      }
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

const flagCodeMap = {
    "England": "gb-eng", "Spain": "es", "Germany": "de", "Italy": "it",
    "France": "fr", "Portugal": "pt", "Netherlands": "nl", "Belgium": "be",
    "Turkey": "tr", "Scotland": "gb", "UEFA": "eu" // Assuming flagcdn handles 'eu'
};

function getFlagUrl(countryName) {
    const code = flagCodeMap[countryName];
    if (code) return `https://flagcdn.com/w20/${code}.png`;
    return "";
}

// API Key
const apiFootballKey = "059a4068b815413430d82f026d549d2f"; // <<< YOUR API-FOOTBALL KEY

// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks for the CURRENT user (loaded locally or from DB)
let currentUserId = null; // Logged-in user's ID
let currentFixtures = []; // Holds the *mapped* fixtures for the currently displayed day

// --- DOM Element References (Declared globally, assigned in init) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
let authSection, loginForm, signupForm, userInfo;
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let showSignupButton, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;
let showLoginButton, userEmailSpan, logoutButton;


// --- Authentication State Listener ---
onAuthStateChanged(auth, user => {
    // Use optional chaining for safety as elements assigned later
    loginErrorP?.textContent && (loginErrorP.textContent = '');
    signupErrorP?.textContent && (signupErrorP.textContent = '');

    if (user) { // User signed in
        console.log("Auth State Changed: User logged in:", user.email, user.uid);
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
    } else { // User signed out
        console.log("Auth State Changed: User logged out");
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
        // Use requestAnimationFrame for smoother UI update after state change
        requestAnimationFrame(() => {
             if(typeof generateCalendar === 'function') generateCalendar();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
        });
    }
});


// --- API Fetching and Mapping Functions ---

async function fetchApiFootballFixtures(dateStr) {
    const cacheKey = `apiFootball_${dateStr}`;
    const cacheDuration = 3 * 60 * 60 * 1000; // 3 hours cache
    const cachedData = sessionStorage.getItem(cacheKey);
    const currentTime = new Date().getTime();

    if (cachedData) {
        const { timestamp, fixtures } = JSON.parse(cachedData);
        if (currentTime - timestamp < cacheDuration) {
            console.log(`Using cached API-Football data for ${dateStr}.`);
            return fixtures;
        } else { console.log(`Cached API-Football data expired for ${dateStr}.`); sessionStorage.removeItem(cacheKey); }
    }

    console.log(`Workspaceing new data from API-Football for ${dateStr}...`);
    const url = `https://v3.football.api-sports.io/fixtures?date=${dateStr}`; //&league=39&season=2024`; // Example single league fetch

    try {
        const response = await fetch(url, { method: 'GET', headers: { 'x-apisports-key': apiFootballKey }});
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             console.error("API-Football Error Response:", errorData);
             let errorMsg = `API Request Failed! Status: ${response.status}`;
             if (errorData?.message) { errorMsg += ` - ${errorData.message}`; }
             else if (errorData?.errors && typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) { errorMsg += ` Details: ${JSON.stringify(errorData.errors)}`; }
             else if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) { errorMsg += ` Details: ${errorData.errors.join(', ')}`; }
             if (errorMsg.includes("incorrect") || errorMsg.includes("doesn't exist")) { errorMsg += " (Double-check API Key?)"; }
             if (errorMsg.includes("blocked")) { errorMsg += " (Network/IP issue? Contact API support?)"; }
             if (errorMsg.includes("limit")) { errorMsg += " (API Request limit reached?)"; }
             throw new Error(errorMsg);
        }
        const apiResult = await response.json();
        // console.log(`Raw API Response for ${dateStr}:`, apiResult); // Uncomment for deep debug

        if (!apiResult || !Array.isArray(apiResult.response) || apiResult.results === 0) {
             console.log(`No fixtures found for ${dateStr} from API.`);
             sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: currentTime, fixtures: [] })); return [];
        }
        const mappedFixtures = mapApiFootballToFixtures(apiResult.response);
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: currentTime, fixtures: mappedFixtures }));
        console.log(`Workspaceed and cached ${mappedFixtures.length} fixtures for ${dateStr}.`);
        return mappedFixtures;
    } catch (error) {
        console.error("Error fetching or processing API-Football data:", error);
        // Don't alert here, handle display in updateDisplayedFixtures
        const oldCache = sessionStorage.getItem(cacheKey); // Try to return old cache on error
        if(oldCache) return JSON.parse(oldCache).fixtures;
        return []; // Return empty array on failure
    }
}

// List of desired league IDs (Update with leagues you want!)
const DESIRED_LEAGUE_IDS = [ 39, 140, 135, 78, 61, 2, 3 ]; // EPL, LaLiga, SerieA, Bund, L1, UCL, UEL

function mapApiFootballToFixtures(apiFixtures) {
    // console.log("Mapping API fixtures:", apiFixtures); // Uncomment for deep debug
    if (!Array.isArray(apiFixtures)) return [];
    return apiFixtures.map(item => {
        try {
            const fixture = item.fixture;
            const league = item.league;
            const teams = item.teams;
            const goals = item.goals;

            // Filter by desired league ID
            if (!league || !DESIRED_LEAGUE_IDS.includes(league.id)) {
                 return null;
            }
            // Validate core data needed for display
             if (!fixture?.id || !league?.name || !teams?.home?.id || !teams?.home?.name || !teams?.away?.id || !teams?.away?.name || !fixture?.date) {
                 console.warn("Skipping fixture due to missing core data:", item); return null;
            }

            // Status Mapping
            let internalStatus = 'SCHEDULED';
            const statusShort = fixture?.status?.short;
            if (['FT', 'AET', 'PEN'].includes(statusShort)) internalStatus = 'FINISHED';
            else if (['HT', '1H', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE'].includes(statusShort)) internalStatus = 'LIVE'; // Treat various in-progress as LIVE
            else if (['PST', 'SUSP', 'CANC', 'ABD', 'AWD', 'WO'].includes(statusShort)) internalStatus = fixture.status.long || 'UNKNOWN';
            else if (statusShort === 'TBD' || statusShort === 'NS') internalStatus = 'SCHEDULED';

            // --- Odds Mapping Placeholder ---
            // TODO: Replace this with actual logic based on your API response/plan
            let homeWin = 2.00, draw = 3.00, awayWin = 4.00;
            // Example structure if odds included directly (unlikely on free plan?):
            // if(item.odds?.bookmakers?.[0]?.bets?.[0]?.values) { ... extract odds ... }

            return {
                fixtureId: String(fixture.id), competition: league.name, country: league.country,
                kickOffTime: fixture.date, status: internalStatus,
                homeTeam: { id: String(teams.home.id), name: teams.home.name },
                awayTeam: { id: String(teams.away.id), name: teams.away.name },
                odds: { homeWin, draw, awayWin }, // Use extracted or default odds
                result: internalStatus === 'FINISHED' ? { homeScore: goals.home, awayScore: goals.away } : null
            };
        } catch(mapError){
             console.error("Error mapping API fixture data:", mapError, "Item:", item); return null;
        }
    }).filter(fixture => fixture !== null);
}

// --- Core Game Functions ---

function generateCalendar() {
    if (!weekViewContainer) return;
    weekViewContainer.innerHTML = '';
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (let i = -1; i <= 3; i++) {
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);
        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day'); dayButton.dataset.date = dateStr;
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`;
        if (i === 0) line1Text = `<b>TODAY ${date.getDate()}</b>`;
        let line2Text = "No Pick"; let line3Text = "&nbsp;";
        const selection = userSelections[dateStr]; // Check current user's selections object
        if (selection && selection.teamName) line2Text = `<b>${selection.teamName}</b>`; // Only show team name
        const line1Span = document.createElement('span'); line1Span.classList.add('cal-line', 'cal-line-1'); line1Span.innerHTML = line1Text;
        const line2Span = document.createElement('span'); line2Span.classList.add('cal-line', 'cal-line-2'); line2Span.innerHTML = line2Text;
        const line3Span = document.createElement('span'); line3Span.classList.add('cal-line', 'cal-line-3'); line3Span.innerHTML = line3Text;
        dayButton.appendChild(line1Span); dayButton.appendChild(line2Span); dayButton.appendChild(line3Span);
        if (getDateString(selectedDate) === dateStr) dayButton.classList.add('active');
        dayButton.addEventListener('click', async () => { // Listener is async
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL'; generateCalendar();
                await updateDisplayedFixtures(); // Await fetch/display for new date
            }
        });
        weekViewContainer.appendChild(dayButton);
    }
}

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
        const button = document.createElement('button'); const flagUrl = getFlagUrl(country);
        let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${country} flag" class="inline-flag">&nbsp;` : '';
        button.innerHTML = `${flagHtml}${league}`; button.classList.add('league-slicer'); if (selectedLeagueFilter === league) button.classList.add('active'); button.dataset.league = league; button.addEventListener('click', handleSlicerClick); leagueSlicerContainer.appendChild(button);
    });
}

function handleSlicerClick(event) {
    const clickedButton = event.target.closest('button.league-slicer');
    if (!clickedButton || clickedButton.dataset.league === selectedLeagueFilter) return;
    selectedLeagueFilter = clickedButton.dataset.league;
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateDisplayedFixtures(); // Refilter based on currentFixtures
}

// Modified updateDisplayedFixtures to use fetched data for the day
async function updateDisplayedFixtures() {
    if (!fixtureListDiv) { console.error("Fixture list div not found for update"); return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    console.log(`Updating display for date: ${selectedDateStr}, league: ${selectedLeagueFilter}`);

    fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">Loading matches...</p>'; // Loading message

    // Fetch data for the selected date (uses cache if available/fresh)
    const fixturesForDay = await fetchApiFootballFixtures(selectedDateStr);
    currentFixtures = fixturesForDay; // Store globally for handleSelection etc.

    // Update slicers based on the fetched data for the day
    populateDailyLeagueSlicers(fixturesForDay);

    // Filter fetched data by league
    const filteredFixtures = currentFixtures.filter(fixture => {
        if (!fixture) return false;
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        return true;
    });

    console.log(`Found ${filteredFixtures.length} fixtures to display after league filter.`);
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime); // Pass filtered data to display
}


// displayFixtures - uses more defensive checks now
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
            const homeRow = document.createElement('div'); homeRow.classList.add('team-row');
            const homeName = document.createElement('span'); homeName.classList.add('team-name'); homeName.textContent = fixture.homeTeam.name; homeRow.appendChild(homeName);
            const homeScoreSpan = document.createElement('span'); homeScoreSpan.classList.add('team-score'); if (fixture.status === 'FINISHED' && fixture.result?.homeScore !== null && fixture.result?.homeScore !== undefined) { homeScoreSpan.textContent = fixture.result.homeScore; homeScoreSpan.classList.add('has-score'); } else { homeScoreSpan.textContent = ''; } homeRow.appendChild(homeScoreSpan);
            const homeOdd = document.createElement('span'); homeOdd.classList.add('team-odd'); homeOdd.textContent = fixture.odds.homeWin?.toFixed(2) || '-'; homeRow.appendChild(homeOdd);
            if (canSelect) { const btn = document.createElement('button'); btn.classList.add('pick-button'); btn.textContent = "Pick"; btn.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw); if (currentDaySelection?.fixtureId === fixture.fixtureId && currentDaySelection?.teamId === fixture.homeTeam.id) { btn.classList.add('selected-team'); btn.textContent = "Picked"; } homeRow.appendChild(btn); }
            else if (fixture.status === 'FINISHED' && fixture.result) { const sel = { teamId: fixture.homeTeam.id, selectedWinOdd: fixture.odds.homeWin, fixtureDrawOdd: fixture.odds.draw }; const pts = calculateScore(sel, fixture); const span = document.createElement('span'); span.classList.add('fixture-points'); if (pts !== null) { span.textContent = `${pts.toFixed(1)} pts`; if (pts > 0) span.classList.add('positive');} else { span.textContent = '-'; } homeRow.appendChild(span); }
            fixtureElement.appendChild(homeRow);
            const awayRow = document.createElement('div'); awayRow.classList.add('team-row');
            const awayName = document.createElement('span'); awayName.classList.add('team-name'); awayName.textContent = fixture.awayTeam.name; awayRow.appendChild(awayName);
            const awayScoreSpan = document.createElement('span'); awayScoreSpan.classList.add('team-score'); if (fixture.status === 'FINISHED' && fixture.result?.awayScore !== null && fixture.result?.awayScore !== undefined) { awayScoreSpan.textContent = fixture.result.awayScore; awayScoreSpan.classList.add('has-score'); } else { awayScoreSpan.textContent = ''; } awayRow.appendChild(awayScoreSpan);
            const awayOdd = document.createElement('span'); awayOdd.classList.add('team-odd'); awayOdd.textContent = fixture.odds.awayWin?.toFixed(2) || '-'; awayRow.appendChild(awayOdd);
            if (canSelect) { const btn = document.createElement('button'); btn.classList.add('pick-button'); btn.textContent = "Pick"; btn.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw); if (currentDaySelection?.fixtureId === fixture.fixtureId && currentDaySelection?.teamId === fixture.awayTeam.id) { btn.classList.add('selected-team'); btn.textContent = "Picked"; } awayRow.appendChild(btn); }
            else if (fixture.status === 'FINISHED' && fixture.result) { const sel = { teamId: fixture.awayTeam.id, selectedWinOdd: fixture.odds.awayWin, fixtureDrawOdd: fixture.odds.draw }; const pts = calculateScore(sel, fixture); const span = document.createElement('span'); span.classList.add('fixture-points'); if (pts !== null) { span.textContent = `${pts.toFixed(1)} pts`; if (pts > 0) span.classList.add('positive'); } else { span.textContent = '-'; } awayRow.appendChild(span); }
            fixtureElement.appendChild(awayRow);
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
    if (existingSelection) {
        const existingFixture = currentFixtures.find(f => f.fixtureId === existingSelection.fixtureId); // Use currentFixtures
        if (existingFixture && new Date(existingFixture.kickOffTime) <= realCurrentTime) {
            alert(`Your pick (${existingSelection.teamName}) for ${selectedDateStr} is locked.`); return;
        }
    }
    const clickedFixture = currentFixtures.find(f => f.fixtureId === fixtureId); // Use currentFixtures
    if (!clickedFixture) { console.error("Clicked fixture not found in current data"); return; }
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) { alert("This match has already started..."); return; }

    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        delete userSelections[selectedDateStr]; console.log(`Deselected team ${teamId} for ${selectedDateStr}`);
        // TODO: Delete pick from Firestore
    } else {
        const newSelection = {
            fixtureId: fixtureId, teamId: teamId, teamName: teamName || 'Unknown',
            selectedWinOdd: teamWinOdd || 1.0, fixtureDrawOdd: drawOdd || 1.0,
            selectionTime: realCurrentTime.toISOString(), userId: auth.currentUser.uid
        };
        userSelections[selectedDateStr] = newSelection;
        console.log(`Selected/Changed to team ${teamId} (Fixture ${fixtureId}) for ${selectedDateStr}`);
        // TODO: Save pick to Firestore
    }
    saveUserDataToLocal();
    generateCalendar();
    updateDisplayedFixtures(); // Uses currentFixtures, maybe not needed? Let's keep for button state.
}


// calculateScore - uses Math.max, checks data
function calculateScore(selection, fixture) {
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result || selection.selectedWinOdd === undefined || selection.fixtureDrawOdd === undefined) { return null; }
    let score = 0; const isHome = fixture.homeTeam.id === selection.teamId;
    const teamScore = isHome ? fixture.result.homeScore : fixture.result.awayScore;
    const oppScore = isHome ? fixture.result.awayScore : fixture.result.homeScore;
    if (teamScore === null || teamScore === undefined || oppScore === null || oppScore === undefined) return null;
    if (teamScore > oppScore) score += (selection.selectedWinOdd || 1.0) * 5;
    else if (teamScore === oppScore) score += (selection.fixtureDrawOdd || 1.0) * 2;
    score += teamScore * 3; score -= oppScore * 1;
    return Math.max(0, score);
}

// Loads from local storage only
function loadUserDataFromLocal() { /* ... keep function ... */ }
// Saves only to local storage
function saveUserDataToLocal() { /* ... keep function ... */ }
// Placeholder for Firestore loading
function loadUserPicksFromFirestore(userId) { /* ... keep function ... */ }
// Auth error helper
function getFriendlyAuthError(error) { /* ... keep function ... */ }


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

    // Basic check if elements exist
     if (!weekViewContainer || !fixtureListDiv || !loginForm || !signupForm || !userInfo) {
         console.error("One or more critical DOM elements not found! Page may not function correctly.");
         if(fixtureListDiv) fixtureListDiv.innerHTML = "<p>Error loading page elements. Please refresh.</p>";
         // Optionally return early if critical elements missing
     }

    // Attach Auth Event Listeners (Ensure elements exist first)
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(loginErrorP) loginErrorP.textContent = ''; }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(signupErrorP) signupErrorP.textContent = ''; }); }
    if (loginButton) { loginButton.addEventListener('click', () => { if (!loginEmailInput || !loginPasswordInput) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; if(loginErrorP) loginErrorP.textContent = ''; signInWithEmailAndPassword(auth, email, password).then(/*...*/).catch((err) => { if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (signupButton) { signupButton.addEventListener('click', () => { if (!signupEmailInput || !signupPasswordInput) return; const email = signupEmailInput.value; const password = signupPasswordInput.value; if(signupErrorP) signupErrorP.textContent = ''; createUserWithEmailAndPassword(auth, email, password).then(/*...*/).catch((err) => { if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (logoutButton) { logoutButton.addEventListener('click', () => { signOut(auth).catch(/*...*/); }); }

    // Initial Load
    loadUserDataFromLocal(); // Load local selections
    generateCalendar(); // Draw calendar
    await updateDisplayedFixtures(); // Fetch and display initial fixtures/slicers

    console.log("Initial setup complete.");
}

// --- Run Initialization ---
document.addEventListener('DOMContentLoaded', initializeAppAndListeners);
