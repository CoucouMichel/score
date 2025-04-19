// script.js - Using API-Football Integration

// --- Firebase Initialization ---
// ... (Keep existing Firebase init code: imports, config, initializeApp, getAuth, getFirestore) ...
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
// Make sure getAuth and other needed Auth functions are imported here:
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
// Make sure getFirestore is imported here:
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- NOW the firebaseConfig, initializeApp, getAuth, getFirestore calls follow ---
const firebaseConfig = { /* ... Your Config ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // This should now work
const db = getFirestore(app); // This should now work
console.log("Firebase initialized (module mode)!");


// --- Authentication Logic ---
// ... (Keep existing Auth logic: element refs, onAuthStateChanged, listeners, helper) ...
let currentUserId = null;
// ... onAuthStateChanged, listeners etc ...


// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;
function getDateString(date) { /* ... keep function ... */ }
const flagCodeMap = { /* ... keep map ... */ }; // Keep this map
function getFlagUrl(countryName) { /* ... keep function ... */ }

// --- NEW: API-Football Key and Fetch Logic ---
const apiFootballKey = "059a4068b815413430d82f026d549d2f"; // <<< PASTE YOUR API-SPORTS KEY HERE

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
    const nowTime = new Date().getTime();

    if (cachedData) {
        const { timestamp, fixtures } = JSON.parse(cachedData);
        if (nowTime - timestamp < cacheDuration) {
            console.log(`Using cached API-Football data for ${dateStr}.`);
            return fixtures;
        } else {
            console.log(`Cached API-Football data expired for ${dateStr}.`);
        }
    }

    console.log(`Workspaceing new data from API-Football for ${dateStr}...`);
    // Example endpoint: Fetch fixtures for a specific date
    // Check API-Football V3 Docs for exact parameters (e.g., timezone, league, season might be needed)
    const url = `https://v3.football.api-sports.io/fixtures?date=${dateStr}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'x-apisports-key': apiFootballKey
                // Add other headers if required by API-Sports
            }
        });

        if (!response.ok) {
            // Log API error response for debugging
            const errorData = await response.json().catch(() => ({})); // Try to get error details
            console.error("API-Football Error Data:", errorData);
            throw new Error(`API-Football request failed! status: ${response.status} - ${errorData?.message || 'Unknown error'}`);
        }

        const apiResult = await response.json();
        console.log(`API Response for ${dateStr}:`, apiResult); // Log raw response

        if (!apiResult || !apiResult.response || apiResult.results === 0) {
             console.log(`No fixtures found for ${dateStr} from API.`);
             return []; // Return empty if no fixtures found
        }

        // Map the raw API data to our internal format
        const mappedFixtures = mapApiFootballToFixtures(apiResult.response);

        // Cache the successfully mapped data
        if (mappedFixtures.length > 0) {
            sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: nowTime, fixtures: mappedFixtures }));
            console.log(`Cached ${mappedFixtures.length} fixtures for ${dateStr}.`);
        }
        return mappedFixtures;

    } catch (error) {
        console.error("Error fetching or processing API-Football data:", error);
        alert(`Failed to load fixtures: ${error.message}. Check API key or limits.`);
        return []; // Return empty array on failure
    }
}

/**
 * Maps raw data from API-Football /fixtures endpoint to our internal format.
 * *** This needs careful adjustment based on the actual API response structure ***
 * @param {Array} apiFixtures - The 'response' array from the API.
 * @returns {Array} Array of fixtures in our internal format.
 */
function mapApiFootballToFixtures(apiFixtures) {
    if (!Array.isArray(apiFixtures)) return [];

    return apiFixtures.map(item => {
        try {
            const fixture = item.fixture;
            const league = item.league;
            const teams = item.teams;
            const goals = item.goals;
            // Odds might require a separate call or specific parameters/plan
            // For now, extract basic 1x2 if available directly, otherwise default
            // This part HIGHLY depends on your plan and the exact response structure for odds!
            // Placeholder for basic H2H odds (assuming structure, likely incorrect)
            const odds = { homeWin: 2.0, draw: 3.0, awayWin: 4.0 }; // DEFAULT PLACEHOLDER ODDS

            // Determine status based on API's status short code
            let internalStatus = 'SCHEDULED'; // Default
            const statusShort = fixture?.status?.short;
            if (['FT', 'AET', 'PEN'].includes(statusShort)) {
                internalStatus = 'FINISHED';
            } else if (['HT', '1H', '2H', 'ET', 'BT', 'P', 'INT'].includes(statusShort)) {
                internalStatus = 'LIVE'; // Or map specific live statuses
            } else if (['PST', 'CANC', 'ABD'].includes(statusShort)) {
                internalStatus = fixture.status.long; // Use the long status like 'Postponed'
            } // Default is SCHEDULED ('NS', 'TBD')

            // Ensure necessary data exists
             if (!fixture?.id || !league?.name || !teams?.home?.name || !teams?.away?.name || !fixture?.date) {
                 console.warn("Skipping fixture due to missing core data:", item);
                 return null;
            }


            return {
                fixtureId: fixture.id.toString(), // Use API's fixture ID (ensure string?)
                competition: league.name,
                country: league.country, // API provides country name
                kickOffTime: fixture.date, // API provides ISO8601 string with timezone
                status: internalStatus,
                homeTeam: { id: teams.home.id, name: teams.home.name }, // Use API IDs
                awayTeam: { id: teams.away.id, name: teams.away.name },
                odds: odds, // Use extracted or default odds
                result: internalStatus === 'FINISHED' ? { homeScore: goals.home, awayScore: goals.away } : null
            };
        } catch(mapError){
             console.error("Error mapping API fixture data:", mapError, "Item:", item);
             return null; // Skip fixture if mapping fails
        }
    }).filter(fixture => fixture !== null); // Remove any null entries from skipped/failed items
}

// --- Fake Fixtures Data ---
// REMOVE or comment out the old fakeFixtures array definition
// let fakeFixtures = []; // Keep as let if needed globally, but prefer passing data

// --- State Variables ---
// ... keep selectedDate, selectedLeagueFilter, userSelections ...

// --- DOM Element References (Non-Auth - Assigned in DOMContentLoaded) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;

// --- Core Game Functions ---
// generateCalendar, populateDailyLeagueSlicers, handleSlicerClick
// updateDisplayedFixtures, displayFixtures, handleSelection, calculateScore
// NOTE: These functions will now operate on the data fetched from the API

// Example modification needed for functions using global 'fakeFixtures'
// They should now accept 'fixturesData' as a parameter or fetch it themselves.
// Let's modify updateDisplayedFixtures to fetch data:

async function updateDisplayedFixtures() { // Make async
    if (!fixtureListDiv) return;
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();

    // Show loading state
    fixtureListDiv.innerHTML = '<p>Loading real matches...</p>';

    // Fetch data for the selected date
    const fixturesForDay = await fetchApiFootballFixtures(selectedDateStr);

    console.log(`Filtering ${fixturesForDay.length} fixtures for league: ${selectedLeagueFilter}`);

    // Filter fetched data by league
    const filteredFixtures = fixturesForDay.filter(fixture => {
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        return true;
    });

    console.log(`Found ${filteredFixtures.length} fixtures to display after league filter.`);

    // Sort and display
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime); // displayFixtures now receives real data

    // Also update slicers based on the fetched data for the day
    populateDailyLeagueSlicers(fixturesForDay); // Pass fetched data to slicers
}

// Modify populateDailyLeagueSlicers to accept data
function populateDailyLeagueSlicers(fixturesData) {
    if (!leagueSlicerContainer) return;
    if (!fixturesData || fixturesData.length === 0) {
         // Handle case with no fixtures for the day
         leagueSlicerContainer.innerHTML = '';
         const slicerArea = document.getElementById('daily-league-slicers');
         if(slicerArea) slicerArea.style.display = 'none';
         return;
    }

    const leaguesToday = new Map();
    fixturesData.forEach(fixture => { // Use passed-in data
        if (!leaguesToday.has(fixture.competition)) {
            leaguesToday.set(fixture.competition, fixture.country);
        }
    });

    leagueSlicerContainer.innerHTML = ''; // Clear

    if (leaguesToday.size > 0) { /* ... create 'All Leagues' button ... */ }
    const sortedLeagues = [...leaguesToday.entries()].sort(/* ... */);
    sortedLeagues.forEach(([league, country]) => { /* ... create league buttons with flags ... */ });
    const slicerArea = document.getElementById('daily-league-slicers');
    if(slicerArea) slicerArea.style.display = 'flex'; // Show slicer area
}

// displayFixtures needs no change as it already accepts fixtures array
// generateCalendar needs modification if using real data for status
// handleSelection might need modification based on real fixture IDs/data
// calculateScore should work if result object is mapped correctly

// --- Data Loading/Saving ---
function loadUserDataFromLocal() { /* ... keep for now ... */ }
function saveUserDataToLocal() { /* ... keep for now ... */ }
function loadUserPicksFromFirestore(userId) { /* ... keep placeholder ... */ }


// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => { // Make async
    console.log("DOM Loaded, assigning elements, adding listeners, fetching initial data...");

    // Assign DOM Elements
    weekViewContainer = document.getElementById('week-view');
    fixtureListDiv = document.getElementById('fixture-list');
    leagueSlicerContainer = document.getElementById('league-slicer-container');
    scoreListUl = document.getElementById('score-list');
    // Assign Auth Elements...
    authSection = document.getElementById('auth-section');
    loginForm = document.getElementById('login-form'); /* ... assign all auth elements ... */
    userInfo = document.getElementById('user-info'); loginEmailInput = document.getElementById('login-email'); loginPasswordInput = document.getElementById('login-password'); loginButton = document.getElementById('login-button'); loginErrorP = document.getElementById('login-error'); showSignupButton = document.getElementById('show-signup'); signupEmailInput = document.getElementById('signup-email'); signupPasswordInput = document.getElementById('signup-password'); signupButton = document.getElementById('signup-button'); signupErrorP = document.getElementById('signup-error'); showLoginButton = document.getElementById('show-login'); userEmailSpan = document.getElementById('user-email'); logoutButton = document.getElementById('logout-button');

    // Attach Auth Event Listeners
    if (showSignupButton) { /* ... listener ... */ }
    if (showLoginButton) { /* ... listener ... */ }
    if (loginButton) { /* ... listener ... */ }
    if (signupButton) { /* ... listener ... */ }
    if (logoutButton) { /* ... listener ... */ }

    // Initial Load
    loadUserDataFromLocal(); // Load local picks first
    generateCalendar(); // Draw calendar based on local state initially
    // Fetch and display fixtures for initially selected date
    await updateDisplayedFixtures(); // Await initial fixture fetch & display

    console.log("Initial setup complete.");
});
