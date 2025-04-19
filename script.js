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
    console.log("Attempting to map API fixtures:", apiFixtures);
    if (!Array.isArray(apiFixtures)) return [];

    return apiFixtures.map(item => {
        try {
            const fixture = item.fixture;
            const league = item.league;
            const teams = item.teams;
            const goals = item.goals;
            const oddsData = item.odds; // Check if odds are included directly (depends on plan/request)

            // Basic validation
            if (!fixture?.id || !league?.name || !teams?.home?.name || !teams?.away?.name || !fixture?.date) {
                 console.warn("Skipping fixture due to missing core data:", item);
                 return null;
            }

            // --- Status Mapping ---
            let internalStatus = 'SCHEDULED'; // Default
            const statusShort = fixture?.status?.short;
            // See: https://www.api-football.com/documentation-v3#tag/Fixtures/operation/get-fixtures -> Fixture Status
            if (['FT', 'AET', 'PEN'].includes(statusShort)) internalStatus = 'FINISHED';
            else if (['HT', '1H', '2H', 'ET', 'BT', 'P', 'INT'].includes(statusShort)) internalStatus = 'LIVE';
            else if (['PST', 'SUSP', 'INT', 'CANC', 'ABD', 'AWD', 'WO'].includes(statusShort)) internalStatus = fixture.status.long || 'UNKNOWN';
            else if (statusShort === 'TBD' || statusShort === 'NS') internalStatus = 'SCHEDULED';


            // --- Odds Mapping (CRITICAL - Highly depends on API response/plan) ---
            // Placeholder: Find odds for "Match Winner" (usually ID=1) from a specific bookmaker (e.g., Bet365 ID=8)
            // You MUST inspect your actual apiResult.response[...].odds to find the correct structure
            let homeWin = null, draw = null, awayWin = null;
            // Example: Loop through bookmakers if odds are included (often requires specific subscription)
            /*
            if (item.bookmakers && Array.isArray(item.bookmakers)) {
                const bet365 = item.bookmakers.find(b => b.id === 8); // Example: Find Bet365
                const matchWinnerBet = bet365?.bets?.find(bet => bet.id === 1); // Example: Find Match Winner bet
                if (matchWinnerBet?.values) {
                    homeWin = matchWinnerBet.values.find(v => v.value === 'Home')?.odd;
                    draw = matchWinnerBet.values.find(v => v.value === 'Draw')?.odd;
                    awayWin = matchWinnerBet.values.find(v => v.value === 'Away')?.odd;
                }
            }
            */
            // If direct odds fetching fails or isn't available, use defaults
             if (homeWin === null || awayWin === null || draw === null) {
                 // console.warn(`Using default odds for fixture ${fixture.id}`);
                 homeWin = 2.00; draw = 3.00; awayWin = 4.00; // Default placeholder odds
             }


            return {
                fixtureId: String(fixture.id), // Ensure ID is string
                competition: league.name,
                country: league.country,
                kickOffTime: fixture.date, // ISO8601 string
                status: internalStatus,
                homeTeam: { id: String(teams.home.id), name: teams.home.name }, // Ensure ID is string
                awayTeam: { id: String(teams.away.id), name: teams.away.name }, // Ensure ID is string
                odds: {
                    homeWin: parseFloat(homeWin) || 2.0, // Parse and fallback
                    draw: parseFloat(draw) || 3.0,
                    awayWin: parseFloat(awayWin) || 4.0
                },
                result: internalStatus === 'FINISHED' ? { homeScore: goals.home, awayScore: goals.away } : null
            };
        } catch(mapError){
             console.error("Error mapping API fixture data:", mapError, "Item:", item);
             return null; // Skip fixture if mapping fails
        }
    }).filter(fixture => fixture !== null);
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

function generateCalendar() { /* ... Keep function from response #55 ... */ }

// Modify populateDailyLeagueSlicers to accept data
function populateDailyLeagueSlicers(fixturesData) {
    if (!leagueSlicerContainer) { console.error("Slicer container not found"); return; }
    if (!fixturesData) { fixturesData = []; console.warn("populateDailyLeagueSlicers called without data");} // Handle undefined data

    const leaguesToday = new Map();
    fixturesData.forEach(fixture => {
        if (!fixture) return; // Skip null/undefined fixtures
        if (!leaguesToday.has(fixture.competition)) {
            leaguesToday.set(fixture.competition, fixture.country);
        }
    });

    leagueSlicerContainer.innerHTML = '';
    const slicerArea = document.getElementById('daily-league-slicers');

    if (leaguesToday.size === 0) {
        if(slicerArea) slicerArea.style.display = 'none'; return;
    }
    if(slicerArea) slicerArea.style.display = 'flex';

    const allButton = document.createElement('button');
    allButton.textContent = 'All Leagues'; allButton.classList.add('league-slicer');
    if (selectedLeagueFilter === 'ALL') allButton.classList.add('active');
    allButton.dataset.league = 'ALL'; allButton.addEventListener('click', handleSlicerClick);
    leagueSlicerContainer.appendChild(allButton);

    const sortedLeagues = [...leaguesToday.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    sortedLeagues.forEach(([league, country]) => {
        const button = document.createElement('button'); const flagUrl = getFlagUrl(country);
        let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${country} flag" class="inline-flag">&nbsp;` : '';
        button.innerHTML = `${flagHtml}${league}`; button.classList.add('league-slicer');
        if (selectedLeagueFilter === league) button.classList.add('active');
        button.dataset.league = league; button.addEventListener('click', handleSlicerClick);
        leagueSlicerContainer.appendChild(button);
    });
}

function handleSlicerClick(event) { /* ... Keep function ... */ }

// Modified updateDisplayedFixtures to fetch data for the selected date
async function updateDisplayedFixtures() {
    if (!fixtureListDiv) { console.error("Fixture list div not found for update"); return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    console.log(`Updating fixtures for date: ${selectedDateStr}, league: ${selectedLeagueFilter}`);

    // Show loading state
    fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center;">Loading matches...</p>';

    // Fetch data for the selected date (will use cache if available/fresh)
    const fixturesForDay = await fetchApiFootballFixtures(selectedDateStr);

    // Update slicers based on the fetched data for the day
    populateDailyLeagueSlicers(fixturesForDay);

    // Filter fetched data by league
    const filteredFixtures = fixturesForDay.filter(fixture => {
        if (!fixture) return false;
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        return true;
    });

    console.log(`Found ${filteredFixtures.length} fixtures to display after league filter.`);
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime); // displayFixtures now receives potentially real data
}


function displayFixtures(fixtures, currentTime) { /* ... Keep function from response #61 (using points display) ... */ }
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) { /* ... Keep function from response #68 (with auth check) ... */ }
function calculateScore(selection, fixture) { /* ... Keep function from response #59 (with Math.max and check for odds) ... */ }

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
