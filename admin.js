// admin.js - Fetches from The Odds API and saves to Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
// Import auth is needed if you secure Firestore writes with rules based on login
// import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


// --- Configuration ---
// Paste the SAME firebaseConfig object you use in script.js
const firebaseConfig = {
    apiKey: "AIzaSyAi_qvjnZlDo6r0Nu14JPs1XAvu_bRQmoM", // Use YOUR actual key
    authDomain: "oddscore-5ed5e.firebaseapp.com",    // Use YOUR domain
    projectId: "oddscore-5ed5e",                    // Use YOUR ID
    storageBucket: "oddscore-5ed5e.firebasestorage.app", // Use YOUR bucket
    messagingSenderId: "582289870654",              // Use YOUR sender ID
    appId: "1:582289870654:web:bb025764a8d37f697f266f",  // Use YOUR App ID
    measurementId: "G-HCKHYJ0HZD"                  // Optional
};
// !! IMPORTANT: Paste The Odds API Key !!
const oddsApiKey = "a5d733b1f9c23c11015d87ca5428c3a4";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const auth = getAuth(app); // Initialize auth if your Firestore rules require login for writes
console.log("Firebase initialized for Admin page!");

// --- DOM Elements ---
const fetchButton = document.getElementById('fetch-button');
// Remove single date elements if not needed, or keep for specific updates
// const fetchSingleButton = document.getElementById('fetch-single-button');
// const singleDateInput = document.getElementById('single-date-input');
const statusDiv = document.getElementById('status');

// --- Helper: getDateString ---
function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// --- Map Sport Keys to Country (for mapping function) ---
const leagueSportKeys = {
    "soccer_epl": { name: "Premier League", country: "England" },
    "soccer_spain_la_liga": { name: "La Liga", country: "Spain" },
    "soccer_germany_bundesliga": { name: "Bundesliga", country: "Germany" },
    "soccer_italy_serie_a": { name: "Serie A", country: "Italy" },
    "soccer_france_ligue1": { name: "Ligue 1", country: "France" },
    "soccer_uefa_champions_league": { name: "Champions League", country: "UEFA"},
    // Add more leagues if desired
};
const sportKeysToFetch = Object.keys(leagueSportKeys); // Get keys like 'soccer_epl'

/**
 * Fetches upcoming odds for a SINGLE sport key from The Odds API.
 * @param {string} sportKey - The sport key (e.g., 'soccer_epl').
 * @returns {Promise<Array|null>} Array of raw event objects or null on error.
 */
async function fetchOddsApiData(sportKey) {
    console.log(`Workspaceing from The Odds API for ${sportKey}...`);
    const regions = 'eu'; // uk, eu, au, us
    const markets = 'h2h'; // Head-to-head (1X2 / Moneyline)
    const oddsFormat = 'decimal'; const dateFormat = 'iso';
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${oddsApiKey}&regions=${regions}&markets=${markets}&oddsFormat=${oddsFormat}&dateFormat=${dateFormat}`;

    try {
        const response = await fetch(url);
        const requestsRemaining = response.headers.get('x-requests-remaining');
        if (requestsRemaining) console.log(`API Requests Remaining: ${requestsRemaining} (after fetching ${sportKey})`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error(`The Odds API Error for ${sportKey}:`, errorData);
            throw new Error(`API Request Failed! Status: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }
        const apiResult = await response.json();
        // Add sport_key to each fixture for easier mapping later
        if(Array.isArray(apiResult)) {
             apiResult.forEach(item => item.sport_key_source = sportKey);
        }
        return Array.isArray(apiResult) ? apiResult : [];
    } catch (error) {
        console.error(`Error fetching The Odds API data for ${sportKey}:`, error);
        statusDiv.textContent = `Error fetching ${sportKey}: ${error.message}`;
        statusDiv.className = 'error';
        return null; // Indicate failure
    }
}

/**
 * Maps raw data from The Odds API /odds endpoint to our internal fixture format.
 */
function mapOddsApiToFixtures(apiData) {
    if (!Array.isArray(apiData)) return [];

    return apiData.map(item => {
        try {
            // Basic validation
            if (!item || !item.id || !item.commence_time || !item.home_team || !item.away_team || !item.sport_key_source) {
                 console.warn("Skipping mapping due to missing core data:", item); return null;
            }

            // Get league name and country from our map using sport_key_source
            const leagueInfo = leagueSportKeys[item.sport_key_source];
            const competitionName = leagueInfo?.name || item.sport_title || item.sport_key_source;
            const countryName = leagueInfo?.country || "Unknown";

            // --- Odds Extraction ---
            // IMPORTANT: This logic needs verification against actual API response!
            // It attempts to average H2H odds from available bookmakers.
            let homeOdds = [], drawOdds = [], awayOdds = [];
            if (Array.isArray(item.bookmakers)) {
                item.bookmakers.forEach(bookie => {
                    const h2hMarket = bookie.markets?.find(m => m.key === 'h2h');
                    if (h2hMarket?.outcomes) {
                        const home = h2hMarket.outcomes.find(o => o.name === item.home_team)?.price;
                        const away = h2hMarket.outcomes.find(o => o.name === item.away_team)?.price;
                        const draw = h2hMarket.outcomes.find(o => o.name === 'Draw')?.price;
                        if (home) homeOdds.push(home);
                        if (draw) drawOdds.push(draw);
                        if (away) awayOdds.push(away);
                    }
                });
            }
            const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
            let homeWin = parseFloat(avg(homeOdds)) || 2.00; // Default if no odds found
            let draw = parseFloat(avg(drawOdds)) || 3.00;
            let awayWin = parseFloat(avg(awayOdds)) || 4.00;
             // --- End Odds Extraction ---

            return {
                fixtureId: item.id, // Use API's event ID
                competition: competitionName,
                country: countryName,
                kickOffTime: item.commence_time, // ISO8601 string
                status: 'SCHEDULED', // Assume scheduled from this endpoint
                homeTeam: { id: item.home_team, name: item.home_team }, // Use names as IDs
                awayTeam: { id: item.away_team, name: item.away_team },
                odds: { homeWin, draw, awayWin },
                result: null // No results from this endpoint
            };
        } catch(mapError){ console.error("Error mapping Odds API fixture:", mapError, "Item:", item); return null; }
    }).filter(fixture => fixture !== null);
}


// --- Firestore Saving Function ---
async function saveFixturesToFirestore(fixturesData) {
     if (!statusDiv) { console.error("Status div missing"); return; } // Check element
     if (!fixturesData || fixturesData.length === 0) {
         statusDiv.textContent = "No valid fixtures found/mapped to save."; statusDiv.className = ''; return;
     }
     statusDiv.textContent = "Processing fixtures..."; statusDiv.className = '';
     const fixturesByDate = {};
     fixturesData.forEach(fixture => { /* ... Keep grouping logic ... */ });
     console.log("Fixtures grouped by date:", fixturesByDate);
     statusDiv.textContent = `Saving fixtures for ${Object.keys(fixturesByDate).length} dates...`;
     const batch = writeBatch(db); let operations = 0;
     for (const dateStr in fixturesByDate) { /* ... Keep batching logic ... */ }
     try {
         await batch.commit(); console.log("Firestore successfully updated!");
         statusDiv.textContent = `Successfully saved/merged fixtures for ${Object.keys(fixturesByDate).length} dates.`; statusDiv.className = 'success';
     } catch (error) {
         console.error("Error writing batch to Firestore: ", error);
         statusDiv.textContent = `Error saving to Firestore: ${error.message}. Check Firestore rules or console.`; statusDiv.className = 'error';
     }
}


// --- Event Listener for the Main Fetch Button ---
if (fetchButton) {
    fetchButton.addEventListener('click', async () => {
        statusDiv.textContent = `Workspaceing ${sportKeysToFetch.length} leagues from The Odds API... (Uses ${sportKeysToFetch.length} requests)`;
        statusDiv.className = '';
        fetchButton.disabled = true;

        // Fetch all desired leagues concurrently
        const promises = sportKeysToFetch.map(key => fetchOddsApiData(key));
        const results = await Promise.allSettled(promises);

        let combinedRawData = [];
        let fetchErrors = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value !== null) {
                 if (Array.isArray(result.value)) {
                    combinedRawData.push(...result.value); // Add fixtures from this league
                 }
            } else {
                fetchErrors++;
                console.error(`Failed to fetch/process league ${sportKeysToFetch[index]}:`, result.reason);
            }
        });

        statusDiv.textContent = `Finished fetching ${sportKeysToFetch.length - fetchErrors}/${sportKeysToFetch.length} leagues.`;

        if (combinedRawData.length > 0) {
            const mappedFixtures = mapOddsApiToFixtures(combinedRawData);
            if (mappedFixtures.length > 0) {
                 await saveFixturesToFirestore(mappedFixtures); // Save mapped results
            } else {
                 statusDiv.textContent += " No relevant fixtures found after mapping/filtering.";
                 statusDiv.className = 'error';
            }
        } else {
             statusDiv.textContent += " No data retrieved from API.";
             statusDiv.className = fetchErrors > 0 ? 'error' : '';
        }

        fetchButton.disabled = false;
    });
} else {
    console.error("Fetch Button not found!");
}

// Remove or comment out the single date fetch logic if not needed
// if (fetchSingleButton) { ... }
