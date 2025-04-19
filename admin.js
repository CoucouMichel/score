// admin.js - Fetches single dates from API-Football and saves to Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- Configuration ---
// !! IMPORTANT: Paste the SAME firebaseConfig object you use in script.js !!
const firebaseConfig = {
    apiKey: "AIzaSyAi_qvjnZlDo6r0Nu14JPs1XAvu_bRQmoM", // Use YOUR actual key
    authDomain: "oddscore-5ed5e.firebaseapp.com",    // Use YOUR domain
    projectId: "oddscore-5ed5e",                    // Use YOUR ID
    storageBucket: "oddscore-5ed5e.firebasestorage.app", // Use YOUR bucket
    messagingSenderId: "582289870654",              // Use YOUR sender ID
    appId: "1:582289870654:web:bb025764a8d37f697f266f",  // Use YOUR App ID
    measurementId: "G-HCKHYJ0HZD"                  // Optional
};
// !! IMPORTANT: Paste YOUR API-Football Key !!
const apiFootballKey = "059a4068b815413430d82f026d549d2f";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized for Admin page!");

// --- DOM Elements ---
const fetchButton = document.getElementById('fetch-button');
const fetchSingleButton = document.getElementById('fetch-single-button');
const singleDateInput = document.getElementById('single-date-input');
const statusDiv = document.getElementById('status');

// --- Helper: getDateString ---
function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date)) return null;
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// Set default date for single fetch input
const todayForInput = new Date();
const yyyy = todayForInput.getFullYear();
const mm = String(todayForInput.getMonth() + 1).padStart(2, '0');
const dd = String(todayForInput.getDate()).padStart(2, '0');
if(singleDateInput) singleDateInput.value = `${yyyy}-${mm}-${dd}`;


// --- API Fetch Function (Fetches SINGLE date) ---
/**
 * Fetches fixtures for a specific date from API-Football.
 * @param {string} dateStr - The date in 'YYYY-MM-DD' format.
 * @returns {Promise<Array|null>} Array of mapped fixtures or null on fetch error.
 */
async function fetchApiFootballDate(dateStr) {
    if (!dateStr) return null;
    console.log(`Workspaceing from API-Football for single date: ${dateStr}...`);
    // Use the 'date' parameter, remove 'from', 'to', 'season'
    const url = `https://v3.football.api-sports.io/fixtures?date=${dateStr}`;

    try {
        const response = await fetch(url, { method: 'GET', headers: { 'x-apisports-key': apiFootballKey }});

        // Log remaining requests if header exists
        const requestsRemaining = response.headers.get('x-requests-remaining');
        if (requestsRemaining) console.log(`API Requests Remaining: ${requestsRemaining}`);

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({}));
             console.error(`API-Football Error for date ${dateStr}:`, errorData);
             let errorMsg = `API Request Failed! Status: ${response.status}`;
             if (errorData?.message) { errorMsg += ` - ${errorData.message}`; }
             else if (errorData?.errors && typeof errorData.errors === 'object' && Object.keys(errorData.errors).length > 0) { errorMsg += ` Details: ${JSON.stringify(errorData.errors)}`; }
             else if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) { errorMsg += ` Details: ${errorData.errors.join(', ')}`; }
             // Check for the specific season/plan error from before
             if (errorMsg.toLowerCase().includes("plan") || errorMsg.toLowerCase().includes("season")) {
                 errorMsg += " (Free plan might restrict access to this date/season?)";
             }
             throw new Error(errorMsg);
        }

        const apiResult = await response.json();
        // console.log(`Raw API Response for ${dateStr}:`, apiResult); // Keep commented unless debugging specific date

        if (!apiResult || !Array.isArray(apiResult.response) || apiResult.results === 0) {
             console.log(`No fixtures found for ${dateStr} from API.`);
             return []; // Return empty array for no results
        }
        // Map the results
        const mappedFixtures = mapApiFootballToFixtures(apiResult.response);
        return mappedFixtures;

    } catch (error) {
        console.error(`Error fetching API-Football data for ${dateStr}:`, error);
        if (statusDiv) { // Update status only if element exists
             statusDiv.textContent = `Error fetching ${dateStr}: ${error.message}`;
             statusDiv.className = 'error';
        }
        return null; // Indicate failure
    }
}

// --- Mapping Function (Includes League Filter) ---
// League IDs to include (Update as needed)
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
            if (!league || !DESIRED_LEAGUE_IDS.includes(league.id)) { return null; }

            // Basic validation
            if (!fixture?.id || !league?.name || !teams?.home?.id || !teams?.home?.name || !teams?.away?.id || !teams?.away?.name || !fixture?.date) {
                 console.warn("Skipping fixture due to missing core data:", item); return null;
            }

            // Status Mapping
            let internalStatus = 'SCHEDULED';
            const statusShort = fixture?.status?.short;
            if (['FT', 'AET', 'PEN'].includes(statusShort)) internalStatus = 'FINISHED';
            else if (['HT', '1H', '2H', 'ET', 'BT', 'P', 'INT', 'LIVE'].includes(statusShort)) internalStatus = 'LIVE';
            else if (['PST', 'SUSP', 'CANC', 'ABD', 'AWD', 'WO'].includes(statusShort)) internalStatus = fixture.status.long || 'UNKNOWN';
            else if (statusShort === 'TBD' || statusShort === 'NS') internalStatus = 'SCHEDULED';

            // Odds Placeholder (Replace with actual extraction if available)
            let homeWin = 2.00, draw = 3.00, awayWin = 4.00;
            // TODO: Add logic here to parse item.bookmakers or item.odds if present

            return {
                fixtureId: String(fixture.id), competition: league.name, country: league.country,
                kickOffTime: fixture.date, status: internalStatus,
                homeTeam: { id: String(teams.home.id), name: teams.home.name },
                awayTeam: { id: String(teams.away.id), name: teams.away.name },
                odds: { homeWin, draw, awayWin },
                result: internalStatus === 'FINISHED' ? { homeScore: goals.home, awayScore: goals.away } : null
            };
        } catch(mapError){ console.error("Error mapping API fixture:", mapError, "Item:", item); return null; }
    }).filter(fixture => fixture !== null);
}

// --- Firestore Saving Function ---
async function saveFixturesToFirestore(fixturesData) {
    if (!fixturesData || fixturesData.length === 0) {
        statusDiv.textContent = "No valid fixtures found to save."; statusDiv.className = ''; return;
    }
    statusDiv.textContent = "Processing fixtures..."; statusDiv.className = '';
    const fixturesByDate = {};
    fixturesData.forEach(fixture => { try { const d = getDateString(new Date(fixture.kickOffTime)); if(!d) return; if (!fixturesByDate[d]) fixturesByDate[d] = []; fixturesByDate[d].push(fixture); } catch (e) { console.error(e); }});
    console.log("Fixtures grouped by date:", fixturesByDate);
    statusDiv.textContent = `Saving fixtures for ${Object.keys(fixturesByDate).length} dates...`;
    const batch = writeBatch(db); let operations = 0;
    for (const dateStr in fixturesByDate) {
        const docRef = doc(db, "fixturesByDate", dateStr);
        batch.set(docRef, { fixtures: fixturesByDate[dateStr], fetchedAt: new Date().toISOString() }, { merge: true }); // Use merge option
        operations++;
        if (operations >= 490) { console.log("Committing partial batch..."); await batch.commit(); batch = writeBatch(db); operations = 0; statusDiv.textContent = `Saving... (batch ${operations}...)`; }
    }
    try {
        await batch.commit(); console.log("Firestore successfully updated!");
        statusDiv.textContent = `Successfully saved/merged fixtures for ${Object.keys(fixturesByDate).length} dates.`; statusDiv.className = 'success';
    } catch (error) {
        console.error("Error writing batch to Firestore: ", error);
        statusDiv.textContent = `Error saving to Firestore: ${error.message}`; statusDiv.className = 'error';
    }
}


// --- Event Listeners ---
if (fetchButton) {
    fetchButton.addEventListener('click', async () => {
        statusDiv.textContent = "Fetching next 14 days (1 call per day)...";
        statusDiv.className = '';
        fetchButton.disabled = true; fetchSingleButton.disabled = true;

        const today = new Date(); // Use actual today
        const allFetchedFixtures = [];
        let fetchErrors = 0;
        const promises = [];

        // Create fetch promises for the next 14 days
        for (let i = 0; i < 14; i++) {
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + i);
            const dateStr = getDateString(targetDate);
            if (dateStr) { // Ensure date string is valid
                 promises.push(fetchApiFootballDate(dateStr)); // Call single-date fetch
            }
        }

        // Execute all promises
        const results = await Promise.allSettled(promises); // Use allSettled to get all results/errors

        // Process results
        results.forEach((result, index) => {
             const dayNum = index + 1;
             if (result.status === 'fulfilled' && result.value !== null) {
                 console.log(`Day ${dayNum} fetch successful.`);
                 if (Array.isArray(result.value)) {
                     allFetchedFixtures.push(...result.value);
                 }
             } else {
                 fetchErrors++;
                 console.error(`Day ${dayNum} fetch failed:`, result.reason || "Unknown error");
             }
        });


        statusDiv.textContent = `Finished fetching ${14 - fetchErrors}/14 days. Found ${allFetchedFixtures.length} total valid fixtures.`;

        if (allFetchedFixtures.length > 0) {
            await saveFixturesToFirestore(allFetchedFixtures); // Save combined results
        } else {
            statusDiv.textContent += " Nothing to save.";
            statusDiv.className = fetchErrors > 0 ? 'error' : '';
        }

        fetchButton.disabled = false; fetchSingleButton.disabled = false;
    });
} else {
    console.error("Fetch 14 Days Button not found!");
}

if (fetchSingleButton) {
    fetchSingleButton.addEventListener('click', async () => {
        const dateToFetch = singleDateInput.value;
        if (!dateToFetch) { statusDiv.textContent = "Please select a date."; statusDiv.className = 'error'; return; }
        statusDiv.textContent = `Workspaceing single date: ${dateToFetch}...`; statusDiv.className = '';
        fetchButton.disabled = true; fetchSingleButton.disabled = true;

        const fixtures = await fetchApiFootballDate(dateToFetch); // Use new single-date fetch
         if (fixtures) { // Check if fetch didn't return null (error)
            await saveFixturesToFirestore(fixtures); // Save just this day's fixtures
        } else {
             statusDiv.textContent = `Workspace failed for ${dateToFetch}. Check console.`; statusDiv.className = 'error';
        }

        fetchButton.disabled = false; fetchSingleButton.disabled = false;
    });
} else {
     console.error("Fetch Single Date Button not found!");
}

// Initial check
if (!fetchButton || !fetchSingleButton || !singleDateInput || !statusDiv) {
    console.error("One or more admin page elements are missing!");
    if(statusDiv) statusDiv.textContent = "Error: Page elements missing.";
}
