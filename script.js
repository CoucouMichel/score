// script.js - COMPLETE - Firebase Auth + API-Football Fetching

// --- Firebase Initialization (ES Module Version) ---
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
  measurementId: "G-HCKHYJ0HZD"                  // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized (module mode)!");
const auth = getAuth(app);
const db = getFirestore(app);


// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z"); // Keep fixed date for demo consistency
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
    "Turkey": "tr", "Scotland": "gb", "UEFA": "eu" // Assuming flagcdn handles 'eu'
};
function getFlagUrl(countryName) {
    const code = flagCodeMap[countryName];
    if (code) return `https://flagcdn.com/w20/${code}.png`;
    return "";
}

// --- API-Football Key and Fetch Logic ---
const apiFootballKey = "059a4068b815413430d82f026d549d2f"; // <<< YOUR API-FOOTBALL KEY HERE
const DESIRED_LEAGUE_IDS = [
    39,  // Premier League (England)
    140, // La Liga (Spain)
    135, // Serie A (Italy)
    78,  // Bundesliga (Germany)
    61,  // Ligue 1 (France)
    2,   // Champions League (UEFA)
    3,   // Europa League (UEFA)
    // --- Add any other league IDs you want to include ---
    // Example: 88 (Eredivisie), 94 (Primeira Liga), 66 (Belgian Pro League), etc.
];

/**
 * Fetches fixtures for a specific date from API-Football.
 
 * Handles caching in Session Storage.
 * @param {string} dateStr - The date in 'YYYY-MM-DD' format.
 * @returns {Promise<Array>} A promise that resolves to an array of fixture objects in our internal format.
 */
async function fetchApiFootballFixtures(dateStr) {
    const cacheKey = `apiFootball_${dateStr}`;
    const cacheDuration = 3 * 60 * 60 * 1000; // Cache for 3 hours
    const cachedData = sessionStorage.getItem(cacheKey);
    const currentTime = new Date().getTime();

    if (cachedData) {
        const { timestamp, fixtures } = JSON.parse(cachedData);
        if (currentTime - timestamp < cacheDuration) {
            console.log(`Using cached API-Football data for ${dateStr}.`);
            return fixtures; // Return cached data if fresh
        } else {
            console.log(`Cached API-Football data expired for ${dateStr}.`);
            sessionStorage.removeItem(cacheKey); // Remove expired cache
        }
    }

    console.log(`Workspaceing new data from API-Football for ${dateStr}...`);
    // Correct API-Football endpoint for fixtures by date
    const url = `https://v3.football.api-sports.io/fixtures?date=${dateStr}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-apisports-key': apiFootballKey
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API-Football Error Data:", errorData);
             let errorMsg = `API-Football request failed! Status: ${response.status}`;
             // Check for common API errors based on their potential structure
             if (errorData.message) errorMsg += ` - ${errorData.message}`;
             if (errorData.errors && typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) {
                errorMsg += ` Details: ${JSON.stringify(errorData.errors)}`;
             } else if (Array.isArray(errorData.errors) && errorData.errors.length > 0) {
                 errorMsg += ` Details: ${errorData.errors.join(', ')}`;
             }
             // Handle specific messages
             if (errorMsg.includes("incorrect") || errorMsg.includes("bad") || errorMsg.includes("doesn't exist")) {
                 errorMsg += " (Please double-check your API Key in script.js)";
             }
             if (errorMsg.includes("blocked")) {
                  errorMsg += " (Your IP might be blocked or connection issue)";
             }
             if (errorMsg.includes("limit")) {
                  errorMsg += " (Daily API request limit likely reached)";
             }
            throw new Error(errorMsg);
        }

        const apiResult = await response.json();
        // Log raw response for debugging the mapping function
        // console.log(`Raw API Response for ${dateStr}:`, apiResult);

        if (!apiResult || !Array.isArray(apiResult.response) || apiResult.results === 0) {
             console.log(`No fixtures found for ${dateStr} from API.`);
             // Cache empty result to avoid re-fetching immediately
             sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: currentTime, fixtures: [] }));
             return [];
        }

        // Map the raw API data to our internal format
        const mappedFixtures = mapApiFootballToFixtures(apiResult.response);

        // Cache the successfully mapped data
        if (mappedFixtures.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: currentTime, fixtures: mappedFixtures }));
            console.log(`Cached ${mappedFixtures.length} fixtures for ${dateStr}.`);
        } else {
             // Cache empty result if mapping resulted in empty array
             sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: currentTime, fixtures: [] }));
             console.log(`No valid fixtures mapped for ${dateStr}, caching empty result.`);
        }
        return mappedFixtures;

    } catch (error) {
        console.error("Error fetching or processing API-Football data:", error);
        alert(`Failed to load fixtures: ${error.message}.`);
        // Return empty array or potentially cached data if available? For now, empty.
        const oldCache = sessionStorage.getItem(cacheKey);
        if(oldCache) return JSON.parse(oldCache).fixtures; // Return old cache on error
        return []; // Return empty array on failure
    }
}

/**
 * Maps raw data from API-Football /fixtures endpoint to our internal format.
 * *** This needs careful adjustment based on the actual API response structure ***
 */
function mapApiFootballToFixtures(apiFixtures) {
    console.log(`Mapping ${apiFixtures.length} raw fixtures, filtering for leagues:`, DESIRED_LEAGUE_IDS);
    if (!Array.isArray(apiFixtures)) return [];

    return apiFixtures.map(item => {
        try {
            const fixture = item.fixture;
            const league = item.league;
            const teams = item.teams;
            const goals = item.goals;

            // --- FILTERING STEP ---
            // Check if the league ID is in our desired list before proceeding
            if (!league || !DESIRED_LEAGUE_IDS.includes(league.id)) {
                 // console.log(`Skipping fixture from league ${league?.id} (${league?.name}) - Not in desired list.`);
                 return null; // Skip this fixture
            }
            // --- END FILTERING STEP ---

            // Basic validation
            if (!fixture?.id || !league?.name || !teams?.home?.name || !teams?.away?.name || !fixture?.date) {
                 console.warn("Skipping fixture due to missing core data:", item);
                 return null;
            }

            // --- Status Mapping ---
            let internalStatus = 'SCHEDULED';
            const statusShort = fixture?.status?.short;
            if (['FT', 'AET', 'PEN'].includes(statusShort)) internalStatus = 'FINISHED';
            else if (['HT', '1H', '2H', 'ET', 'BT', 'P', 'INT'].includes(statusShort)) internalStatus = 'LIVE';
            else if (['PST', 'SUSP', 'INT', 'CANC', 'ABD', 'AWD', 'WO'].includes(statusShort)) internalStatus = fixture.status.long || 'UNKNOWN';
            else if (statusShort === 'TBD' || statusShort === 'NS') internalStatus = 'SCHEDULED';

            // --- Odds Mapping Placeholder ---
            // IMPORTANT: You still need to adjust this based on the actual API response structure
            // to get real odds instead of these defaults.
            let homeWin = 2.00, draw = 3.00, awayWin = 4.00; // Default placeholder odds
            // Add your logic here to extract real odds from item.bookmakers if available

            // Create the mapped object
            return {
                fixtureId: String(fixture.id),
                competition: league.name,
                country: league.country,
                kickOffTime: fixture.date,
                status: internalStatus,
                homeTeam: { id: String(teams.home.id), name: teams.home.name },
                awayTeam: { id: String(teams.away.id), name: teams.away.name },
                odds: {
                    homeWin: parseFloat(homeWin) || 2.0,
                    draw: parseFloat(draw) || 3.0,
                    awayWin: parseFloat(awayWin) || 4.0
                },
                result: internalStatus === 'FINISHED' ? { homeScore: goals.home, awayScore: goals.away } : null
            };
        } catch(mapError){
             console.error("Error mapping API fixture data:", mapError, "Item:", item);
             return null;
        }
    }).filter(fixture => fixture !== null); // Remove nulls from skipped/failed items
}


// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {}; // Holds picks loaded for the CURRENT user

// --- DOM Element References (Assigned in DOMContentLoaded) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
let authSection, loginForm, signupForm, userInfo;
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let showSignupButton, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;
let showLoginButton, userEmailSpan, logoutButton;


// --- Authentication Logic (Keep as is) ---
// onAuthStateChanged listener ...
// Event Listeners for Auth Forms/Buttons ...
// getFriendlyAuthError function ...


// --- Core Game Functions ---

/**
 * Generates calendar navigation. Displays Day/Date and Picked Team Name only.
 */
function generateCalendar() {
    // Ensure elements are assigned before running (should be handled by DOMContentLoaded)
    if (!weekViewContainer) { console.error("Calendar container not found"); return; }

    weekViewContainer.innerHTML = ''; // Clear previous calendar
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    for (let i = -1; i <= 3; i++) { // Loop for 5 days
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);
        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day'); dayButton.dataset.date = dateStr;

        // Line 1: Combined Day Name + Date Number
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`;
        if (i === 0) line1Text = `<b>TODAY ${date.getDate()}</b>`;

        // Line 2: Pick Status (Team Name or "No Pick")
        let line2Text = "No Pick";
        const selection = userSelections[dateStr]; // Check current user's selections object
        if (selection && selection.teamName) { // Check if selection and team name exist
            line2Text = `<b>${selection.teamName}</b>`;
        }

        // Line 3: Simplified - Keep empty for now
        let line3Text = "&nbsp;";

        // Create and append spans
        const line1Span = document.createElement('span'); line1Span.classList.add('cal-line', 'cal-line-1'); line1Span.innerHTML = line1Text;
        const line2Span = document.createElement('span'); line2Span.classList.add('cal-line', 'cal-line-2'); line2Span.innerHTML = line2Text;
        const line3Span = document.createElement('span'); line3Span.classList.add('cal-line', 'cal-line-3'); line3Span.innerHTML = line3Text;

        dayButton.appendChild(line1Span); dayButton.appendChild(line2Span); dayButton.appendChild(line3Span);

        if (getDateString(selectedDate) === dateStr) dayButton.classList.add('active');

        // Click listener to update date and refresh fixtures
        dayButton.addEventListener('click', async () => { // Make async for await
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL'; // Reset league filter
                generateCalendar();         // Redraw calendar (sync UI)
                await updateDisplayedFixtures(); // Fetch and display fixtures (async)
            }
        });
        weekViewContainer.appendChild(dayButton);
    }
}

/**
 * Renders the list of fixtures. Shows Pick button OR calculated points. (Added Defensive Checks)
 */
function displayFixtures(fixtures, currentTime) {
    if (!fixtureListDiv) { console.error("Cannot display fixtures, list div not found."); if(fixtureListDiv) fixtureListDiv.innerHTML = '<p>Error: Fixture list container missing.</p>'; return; }
    fixtureListDiv.innerHTML = '';
    console.log(`--- displayFixtures: Attempting to display ${fixtures?.length ?? 0} fixtures ---`);

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">No matches found for the selected day/filters.</p>';
        return;
    }

    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach((fixture, index) => {
        try {
            // More robust check for essential data before processing
            if (!fixture || !fixture.fixtureId || !fixture.homeTeam?.id || !fixture.awayTeam?.id || !fixture.odds || !fixture.kickOffTime || !fixture.homeTeam?.name || !fixture.awayTeam?.name) {
                 console.warn(`Skipping fixture index ${index} due to missing critical data:`, fixture);
                 return; // Skip this fixture iteration
            }

            const fixtureElement = document.createElement('div'); fixtureElement.classList.add('fixture');
            const kickOff = new Date(fixture.kickOffTime);
            // Check if kickoff is a valid date, fallback if not
            const validKickoff = !isNaN(kickOff.getTime());
            const canSelect = validKickoff && fixture.status === 'SCHEDULED' && kickOff > currentTime;
            const timeString = validKickoff ? kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "TBD";

            // Top Details
            const detailsTop = document.createElement('div'); detailsTop.classList.add('fixture-details-top');
            const flagUrl = getFlagUrl(fixture.country);
            let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${fixture.country || 'N/A'} flag" class="inline-flag">&nbsp;` : '';
            detailsTop.innerHTML = `${flagHtml}${fixture.competition || 'N/A'} - ${timeString}`;
            fixtureElement.appendChild(detailsTop);

            // Home Team Row
            const homeRow = document.createElement('div'); homeRow.classList.add('team-row');
            const homeName = document.createElement('span'); homeName.classList.add('team-name'); homeName.textContent = fixture.homeTeam.name; homeRow.appendChild(homeName);
            const homeScoreSpan = document.createElement('span'); homeScoreSpan.classList.add('team-score');
             // Check result object and score property exist
            if (fixture.status === 'FINISHED' && fixture.result?.homeScore !== null && fixture.result?.homeScore !== undefined) { homeScoreSpan.textContent = fixture.result.homeScore; homeScoreSpan.classList.add('has-score'); } else { homeScoreSpan.textContent = ''; } homeRow.appendChild(homeScoreSpan);
            const homeOdd = document.createElement('span'); homeOdd.classList.add('team-odd'); homeOdd.textContent = fixture.odds.homeWin?.toFixed(2) || '-'; homeRow.appendChild(homeOdd);
            if (canSelect) {
                const homeButton = document.createElement('button'); homeButton.classList.add('pick-button'); homeButton.textContent = "Pick";
                homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
                if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.homeTeam.id) { homeButton.classList.add('selected-team'); homeButton.textContent = "Picked"; }
                homeRow.appendChild(homeButton);
            } else if (fixture.status === 'FINISHED' && fixture.result) {
                const tempHomeSelection = { teamId: fixture.homeTeam.id, selectedWinOdd: fixture.odds.homeWin, fixtureDrawOdd: fixture.odds.draw };
                const points = calculateScore(tempHomeSelection, fixture);
                const pointsSpan = document.createElement('span'); pointsSpan.classList.add('fixture-points');
                if (points !== null) { pointsSpan.textContent = `${points.toFixed(1)} pts`; if (points > 0) pointsSpan.classList.add('positive');} else { pointsSpan.textContent = '-'; }
                homeRow.appendChild(pointsSpan);
            }
            fixtureElement.appendChild(homeRow);

            // Away Team Row
            const awayRow = document.createElement('div'); awayRow.classList.add('team-row');
            const awayName = document.createElement('span'); awayName.classList.add('team-name'); awayName.textContent = fixture.awayTeam.name; awayRow.appendChild(awayName);
            const awayScoreSpan = document.createElement('span'); awayScoreSpan.classList.add('team-score');
             // Check result object and score property exist
            if (fixture.status === 'FINISHED' && fixture.result?.awayScore !== null && fixture.result?.awayScore !== undefined) { awayScoreSpan.textContent = fixture.result.awayScore; awayScoreSpan.classList.add('has-score'); } else { awayScoreSpan.textContent = ''; } awayRow.appendChild(awayScoreSpan);
            const awayOdd = document.createElement('span'); awayOdd.classList.add('team-odd'); awayOdd.textContent = fixture.odds.awayWin?.toFixed(2) || '-'; awayRow.appendChild(awayOdd);
             if (canSelect) {
                const awayButton = document.createElement('button'); awayButton.classList.add('pick-button'); awayButton.textContent = "Pick";
                awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
                if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.awayTeam.id) { awayButton.classList.add('selected-team'); awayButton.textContent = "Picked"; }
                awayRow.appendChild(awayButton);
            } else if (fixture.status === 'FINISHED' && fixture.result) {
                const tempAwaySelection = { teamId: fixture.awayTeam.id, selectedWinOdd: fixture.odds.awayWin, fixtureDrawOdd: fixture.odds.draw };
                const points = calculateScore(tempAwaySelection, fixture);
                const pointsSpan = document.createElement('span'); pointsSpan.classList.add('fixture-points');
                 if (points !== null) { pointsSpan.textContent = `${points.toFixed(1)} pts`; if (points > 0) pointsSpan.classList.add('positive'); } else { pointsSpan.textContent = '-'; }
                awayRow.appendChild(pointsSpan);
            }
            fixtureElement.appendChild(awayRow);

             // Bottom Details
            const detailsBottom = document.createElement('div'); detailsBottom.classList.add('fixture-details-bottom');
            let bottomText = '';
            if (fixture.status && fixture.status !== 'SCHEDULED' && fixture.status !== 'FINISHED') { bottomText = `<span style="font-style:italic; color:var(--error-text-color)">(${fixture.status})</span>`; }
            if (bottomText) { detailsBottom.innerHTML = bottomText; fixtureElement.appendChild(detailsBottom); }

            // Append the complete fixture element
            if (fixtureListDiv) { // Final check before appending
                 fixtureListDiv.appendChild(fixtureElement);
            } else {
                 console.error("fixtureListDiv became null before appendChild");
            }

        } catch (error) {
            console.error(`Error processing fixture ${fixture?.fixtureId || `index ${index}`} in displayFixtures loop:`, error);
        }
    });
     console.log(`--- displayFixtures: Finished loop ---`);
}

// --- Keep other functions (populateDailyLeagueSlicers, handleSlicerClick, updateDisplayedFixtures, handleSelection, calculateScore, data loading/saving, etc.) ---

// Make sure the calculateScore function also uses optional chaining or checks for odds existence:
function calculateScore(selection, fixture) {
    // Add checks for odds existence in selection object
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result || selection.selectedWinOdd === undefined || selection.fixtureDrawOdd === undefined) {
        console.warn("Cannot calculate score, missing data", selection, fixture);
        return null;
    }
    // ... rest of calculation logic using selection.selectedWinOdd and selection.fixtureDrawOdd ...
    let score = 0;
    const selectedTeamIsHome = fixture.homeTeam.id === selection.teamId;
    const selectedTeamScore = selectedTeamIsHome ? fixture.result.homeScore : fixture.result.awayScore;
    const concededScore = selectedTeamIsHome ? fixture.result.awayScore : fixture.result.homeScore;
    if (selectedTeamScore === null || selectedTeamScore === undefined || concededScore === null || concededScore === undefined) return null;

    if (selectedTeamScore > concededScore) score += (selection.selectedWinOdd || 1.0) * 5;
    else if (selectedTeamScore === concededScore) score += (selection.fixtureDrawOdd || 1.0) * 2;
    score += selectedTeamScore * 3; score -= concededScore * 1;
    return Math.max(0, score);
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Loaded, assigning elements, adding listeners, fetching initial data...");

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

    // Attach Auth Event Listeners
    // Ensure these listeners exist from response #70
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(loginErrorP) loginErrorP.textContent = ''; }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(signupErrorP) signupErrorP.textContent = ''; }); }
    if (loginButton) { loginButton.addEventListener('click', () => { if (!loginEmailInput || !loginPasswordInput) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; if(loginErrorP) loginErrorP.textContent = ''; signInWithEmailAndPassword(auth, email, password).then((cred) => console.log("Login OK", cred.user)).catch((err) => { if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (signupButton) { signupButton.addEventListener('click', () => { if (!signupEmailInput || !signupPasswordInput) return; const email = signupEmailInput.value; const password = signupPasswordInput.value; if(signupErrorP) signupErrorP.textContent = ''; createUserWithEmailAndPassword(auth, email, password).then((cred) => console.log("Signup OK", cred.user)).catch((err) => { if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (logoutButton) { logoutButton.addEventListener('click', () => { signOut(auth).catch((err) => { console.error(err); alert("Logout failed."); }); }); }


    // Initial Load
    loadUserDataFromLocal(); // Load local selections first
    generateCalendar(); // Draw calendar using local state
    await updateDisplayedFixtures(); // Fetch API data and display fixtures/slicers

    console.log("Initial setup complete.");
});

// Renamed: Loads from local storage only
function loadUserDataFromLocal() {
    console.log("Loading selections from Local Storage (temporary)");
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) { try { userSelections = JSON.parse(savedSelections); } catch (e) { console.error(e); userSelections = {}; } }
    else { userSelections = {}; }
}

// Renamed: Saves only to local storage
function saveUserDataToLocal() {
    console.log("Saving selections to Local Storage (temporary)");
     try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
     catch (e) { console.error(e); }
}

// Placeholder for Firestore loading
function loadUserPicksFromFirestore(userId) {
    console.log(`TODO: Load picks for user ${userId} from Firestore and update userSelections object.`);
    userSelections = {}; // Clear local state on login
    console.log("Cleared local userSelections, waiting for Firestore load (not implemented yet).");
    // Refresh UI immediately (calendar needed, fixtures updated by subsequent call)
    if(typeof generateCalendar === 'function') generateCalendar();
    if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures(); // Trigger fixture load for the day
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => { // Make async
    console.log("DOM Loaded, assigning elements, adding listeners, fetching initial data...");

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

    // Attach Auth Event Listeners
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'none'; if(signupForm) signupForm.style.display = 'block'; if(loginErrorP) loginErrorP.textContent = ''; }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { if(loginForm) loginForm.style.display = 'block'; if(signupForm) signupForm.style.display = 'none'; if(signupErrorP) signupErrorP.textContent = ''; }); }
    if (loginButton) { loginButton.addEventListener('click', () => { if (!loginEmailInput || !loginPasswordInput) return; const email = loginEmailInput.value; const password = loginPasswordInput.value; if(loginErrorP) loginErrorP.textContent = ''; signInWithEmailAndPassword(auth, email, password).then((cred) => console.log("Login OK", cred.user)).catch((err) => { if(loginErrorP) loginErrorP.textContent = `Login Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (signupButton) { signupButton.addEventListener('click', () => { if (!signupEmailInput || !signupPasswordInput) return; const email = signupEmailInput.value; const password = signupPasswordInput.value; if(signupErrorP) signupErrorP.textContent = ''; createUserWithEmailAndPassword(auth, email, password).then((cred) => console.log("Signup OK", cred.user)).catch((err) => { if(signupErrorP) signupErrorP.textContent = `Signup Failed: ${getFriendlyAuthError(err)}`;}); }); }
    if (logoutButton) { logoutButton.addEventListener('click', () => { signOut(auth).catch((err) => { console.error(err); alert("Logout failed."); }); }); }

    // Initial Load
    loadUserDataFromLocal(); // Load local picks first
    generateCalendar(); // Draw calendar based on local state initially
    await updateDisplayedFixtures(); // Fetch and display fixtures for initial date

    console.log("Initial setup complete.");
});
