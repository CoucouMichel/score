// admin.js - Fetches data from TheSportsDB, Calculates Synthetic Odds, Saves to Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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
// TheSportsDB Free Test API Key (Consider getting a Patreon key for better stability/limits)
const theSportsDbApiKey = "3";

// Define Leagues to fetch using TheSportsDB IDs (Verify these IDs!)
const DESIRED_LEAGUES = {
    // Format: { "League Name (for display/mapping)": leagueId }
    "Premier League": 4328,
    "La Liga": 4335,
    "Serie A": 4332,
    "Bundesliga": 4331,
    "Ligue 1": 4334,
    // Add more league IDs here - find them on TheSportsDB website/API
    // e.g., Champions League: 4480 (?) - Often structured differently
};
const leagueIdsToFetch = Object.values(DESIRED_LEAGUES);

// Define Seasons (Adjust years as needed)
const CURRENT_SEASON = "2024-2025";
const PREVIOUS_SEASON = "2023-2024";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized for Admin page!");

// --- DOM Elements ---
const fetchButton = document.getElementById('fetch-button');
// Remove single date elements if using 14-day fetch only
// const fetchSingleButton = document.getElementById('fetch-single-button');
// const singleDateInput = document.getElementById('single-date-input');
const statusDiv = document.getElementById('status');

// --- Helper Functions ---
function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

/**
 * Fetches data from a specific TheSportsDB endpoint.
 * @param {string} endpoint - The endpoint path (e.g., 'lookuptable.php').
 * @param {object} params - Query parameters as key-value pairs.
 * @returns {Promise<object|null>} The JSON response data or null on error.
 */
async function fetchTSDBData(endpoint, params) {
    const query = new URLSearchParams(params).toString();
    const url = `https://www.thesportsdb.com/api/v1/json/${theSportsDbApiKey}/${endpoint}?${query}`;
    // console.log("Fetching:", url); // Debug URL
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TheSportsDB API request failed! Status: ${response.status} for ${endpoint}`);
        }
        const data = await response.json();
        // Add small delay to respect rate limits (TheSportsDB free tier is rate-limited per minute)
        await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
        return data;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        statusDiv.textContent = `Error fetching ${endpoint}: ${error.message}`;
        statusDiv.className = 'error';
        return null; // Indicate failure
    }
}

// --- Data Processing Functions ---

/**
 * Calculates form points (W=3, D=1, L=0) from last N games.
 * @param {string} teamId - The ID of the team to calculate form for.
 * @param {Array} allRecentEvents - Array of recent event objects for the league.
 * @param {number} numGames - Number of games to consider (e.g., 5).
 * @returns {number} Form points (0-15 for 5 games).
 */
function calculateForm(teamId, allRecentEvents, numGames = 5) {
    if (!teamId || !Array.isArray(allRecentEvents)) return 0;
    let formPoints = 0;
    let gamesCounted = 0;
    // Sort events by date descending to easily get the latest
    allRecentEvents.sort((a, b) => new Date(b.dateEvent) - new Date(a.dateEvent));

    for (const event of allRecentEvents) {
        if (gamesCounted >= numGames) break; // Stop after N games

        // Check if team participated and scores are valid numbers
        if (event.idHomeTeam === teamId || event.idAwayTeam === teamId) {
             const homeScore = parseInt(event.intHomeScore, 10);
             const awayScore = parseInt(event.intAwayScore, 10);

            if (!isNaN(homeScore) && !isNaN(awayScore)) { // Only count if scores are valid
                 gamesCounted++;
                 if (event.idHomeTeam === teamId) { // Team played Home
                     if (homeScore > awayScore) formPoints += 3; // Win
                     else if (homeScore === awayScore) formPoints += 1; // Draw
                 } else { // Team played Away
                     if (awayScore > homeScore) formPoints += 3; // Win
                     else if (awayScore === homeScore) formPoints += 1; // Draw
                 }
            }
        }
    }
    // console.log(`Form for team ${teamId}: ${formPoints} points from ${gamesCounted} games.`);
    return formPoints;
}


/**
 * Calculates SYNTHETIC Home Win and Away Win odds based on ranks and form.
 * Uses formula refined in response #100.
 */
function calculateSyntheticOdds(homeRank, awayRank, homeForm, awayForm, homePrevRank, awayPrevRank) {
    // Use defaults if rank/form data is missing (treat as mid-table avg form)
    homeRank = homeRank ?? 10; awayRank = awayRank ?? 10;
    homeForm = homeForm ?? 7; awayForm = awayForm ?? 7;
    homePrevRank = homePrevRank ?? 10; awayPrevRank = awayPrevRank ?? 10;

    const rankDiff = awayRank - homeRank;
    const formDiff = homeForm - awayForm;
    const prevRankDiff = awayPrevRank - homePrevRank;

    // Base odds & Scaling Factors (Tune these if needed)
    const baseHome = 2.40; const baseAway = 2.70;
    const rankScale = 0.07; const formScale = 0.025; const prevRankScale = 0.01;
    const rankCap = 12; // Max rank difference effect

    const cappedRankDiff = Math.max(-rankCap, Math.min(rankCap, rankDiff));
    const rankAdj = cappedRankDiff * rankScale;
    const formAdj = formDiff * formScale;
    const prevRankAdj = prevRankDiff * prevRankScale;

    let homeOdd = baseHome - rankAdj - formAdj - prevRankAdj;
    let awayOdd = baseAway + rankAdj + formAdj + prevRankAdj;

    homeOdd = Math.max(1.01, homeOdd); // Ensure min odd
    awayOdd = Math.max(1.01, awayOdd);

    return {
        homeWin: parseFloat(homeOdd.toFixed(2)),
        awayWin: parseFloat(awayOdd.toFixed(2))
    };
}


/**
 * Maps data from TheSportsDB events endpoints to our internal fixture format.
 * Includes calculated synthetic odds.
 */
function mapTheSportsDbToFixtures(apiEvents, leagueName, leagueCountry, rankings, prevRankings, recentEventsMap) {
    if (!Array.isArray(apiEvents)) return [];

    return apiEvents.map(event => {
        try {
            // Basic validation
            if (!event || !event.idEvent || !event.strHomeTeam || !event.strAwayTeam || !event.idHomeTeam || !event.idAwayTeam || !event.dateEvent || !event.strTime) {
                console.warn("Skipping TSB event due to missing core data:", event); return null;
            }

            // Combine date and time - TheSportsDB stores them separately
            // Time often includes timezone info like "19:00:00+00:00" or just "19:00:00" - try parsing robustly
            const timePart = event.strTime.split('+')[0]; // Handle potential timezone offset string
            const kickOffIso = `${event.dateEvent}T${timePart}Z`; // Assume UTC if no offset provided by API, might need adjustment!
            const kickOffDate = new Date(kickOffIso);
            if (isNaN(kickOffDate.getTime())) { // Check if date is valid
                 console.warn("Skipping TSB event due to invalid date/time:", event.dateEvent, event.strTime); return null;
            }

            // Status Mapping (TSDB uses text descriptions)
            let internalStatus = 'SCHEDULED';
            if (event.strStatus === 'Match Finished') internalStatus = 'FINISHED';
            else if (event.strStatus?.includes('Postponed')) internalStatus = 'Postponed'; // Use API text
            else if (event.strStatus?.includes('Cancelled')) internalStatus = 'Cancelled';
            else if (event.intHomeScore !== null && event.intAwayScore !== null) internalStatus = 'LIVE'; // Basic check if scores exist but not finished


            // Get Ranks & Form
            const homeIdStr = String(event.idHomeTeam);
            const awayIdStr = String(event.idAwayTeam);
            const leagueIdStr = String(event.idLeague);

            const homeRank = rankings?.[leagueIdStr]?.[homeIdStr];
            const awayRank = rankings?.[leagueIdStr]?.[awayIdStr];
            const homePrevRank = prevRankings?.[leagueIdStr]?.[homeIdStr];
            const awayPrevRank = prevRankings?.[leagueIdStr]?.[awayIdStr];
            const homeForm = calculateForm(homeIdStr, recentEventsMap?.[leagueIdStr] || []);
            const awayForm = calculateForm(awayIdStr, recentEventsMap?.[leagueIdStr] || []);

             // Calculate Synthetic Odds
             const syntheticOdds = calculateSyntheticOdds(homeRank, awayRank, homeForm, awayForm, homePrevRank, awayPrevRank);

            return {
                fixtureId: String(event.idEvent),
                competition: event.strLeague || leagueName, // Use league name from event or map
                country: leagueCountry || event.strCountry || "Unknown", // Try multiple sources
                kickOffTime: kickOffDate.toISOString(), // Use calculated ISO string
                status: internalStatus,
                homeTeam: { id: homeIdStr, name: event.strHomeTeam },
                awayTeam: { id: awayIdStr, name: event.strAwayTeam },
                odds: syntheticOdds, // Use calculated odds
                result: internalStatus === 'FINISHED' ? {
                    homeScore: parseInt(event.intHomeScore, 10),
                    awayScore: parseInt(event.intAwayScore, 10)
                } : null
            };
        } catch(mapError){ console.error("Error mapping TSB event:", mapError, "Event:", event); return null; }
    }).filter(fixture => fixture !== null);
}


// --- Firestore Saving Function ---
async function saveFixturesToFirestore(fixturesData) {
     if (!statusDiv) { console.error("Status div missing"); return; }
     if (!fixturesData || fixturesData.length === 0) { statusDiv.textContent = "No valid fixtures found/mapped to save."; statusDiv.className = ''; return; }
     statusDiv.textContent = "Processing fixtures for save..."; statusDiv.className = '';
     const fixturesByDate = {};
     fixturesData.forEach(fixture => { try { const d = getDateString(new Date(fixture.kickOffTime)); if(!d) return; if (!fixturesByDate[d]) fixturesByDate[d] = []; fixturesByDate[d].push(fixture); } catch (e) { console.error(e); }});
     console.log("Fixtures grouped by date:", Object.keys(fixturesByDate).length, "dates");
     if (Object.keys(fixturesByDate).length === 0) { statusDiv.textContent = "No fixtures with valid dates found."; return;}
     statusDiv.textContent = `Saving fixtures for ${Object.keys(fixturesByDate).length} dates...`;
     const batch = writeBatch(db); let operations = 0; const maxBatch = 490; // Keep below 500 limit
     let totalFixturesSaved = 0;

     for (const dateStr in fixturesByDate) {
         const docRef = doc(db, "fixturesByDate", dateStr);
         // Overwrite the entire day's fixtures with the newly calculated set
         batch.set(docRef, { fixtures: fixturesByDate[dateStr], fetchedAt: new Date().toISOString() });
         operations++;
         totalFixturesSaved += fixturesByDate[dateStr].length;
         if (operations >= maxBatch) { console.log(`Committing batch of ${operations} dates...`); await batch.commit(); batch = writeBatch(db); operations = 0; statusDiv.textContent = `Saving... (${totalFixturesSaved} fixtures...)`; }
     }
     try {
         if (operations > 0) { // Commit any remaining operations
            console.log(`Committing final batch of ${operations} dates...`);
            await batch.commit();
         }
         console.log("Firestore successfully updated!");
         statusDiv.textContent = `Successfully saved ${totalFixturesSaved} fixtures for ${Object.keys(fixturesByDate).length} dates.`; statusDiv.className = 'success';
     } catch (error) { console.error("Error writing final batch to Firestore: ", error); statusDiv.textContent = `Error saving: ${error.message}.`; statusDiv.className = 'error'; }
}


// --- Main Fetch Logic (Event Listener for Button) ---
if (fetchButton) {
    fetchButton.addEventListener('click', async () => {
        statusDiv.textContent = "Starting data fetch process..."; statusDiv.className = '';
        fetchButton.disabled = true; // Disable button during fetch

        try {
            const leagueIds = Object.values(DESIRED_LEAGUES);
            const leagueEntries = Object.entries(DESIRED_LEAGUES); // Get [name, id] pairs

            // --- 1. Fetch all required data concurrently ---
            statusDiv.textContent = "Fetching standings and results...";
            const promises = [];
            leagueIds.forEach(id => {
                promises.push(fetchTSDBData('lookuptable.php', { l: id, s: CURRENT_SEASON }));      // Current Standings
                promises.push(fetchTSDBData('lookuptable.php', { l: id, s: PREVIOUS_SEASON }));     // Previous Standings
                promises.push(fetchTSDBData('eventspastleague.php', { id: id })); // Last 15 Results
                promises.push(fetchTSDBData('eventsnextleague.php', { id: id })); // Next 15 Fixtures
            });

            const results = await Promise.allSettled(promises);
            console.log("API Fetch Results:", results);

            // --- 2. Process and Store Standings/Results ---
            statusDiv.textContent = "Processing fetched data...";
            const currentRanks = {}; // { leagueId: { teamId: rank, ... }, ... }
            const previousRanks = {};
            const recentEventsMap = {}; // { leagueId: [ event1, event2, ... ], ... }
            const allTeamsMap = {}; // { teamId: teamName }
            const combinedUpcomingEvents = []; // Raw upcoming events from all leagues
            let errorCount = 0;

            results.forEach((result, index) => {
                if (result.status !== 'fulfilled' || !result.value) {
                    console.error(`API call failed for index ${index}`); errorCount++; return;
                }
                const data = result.value;
                const requestIndex = index % 4; // 0=currRank, 1=prevRank, 2=pastEvents, 3=nextEvents
                const leagueIndex = Math.floor(index / 4);
                const [leagueName, leagueId] = leagueEntries[leagueIndex];
                const leagueIdStr = String(leagueId);

                if (requestIndex === 0 && data.table) { // Current Standings
                    currentRanks[leagueIdStr] = {};
                    data.table.forEach(t => {
                        currentRanks[leagueIdStr][String(t.idTeam)] = parseInt(t.intRank, 10);
                        if (t.idTeam && t.strTeam) allTeamsMap[String(t.idTeam)] = t.strTeam; // Store team name
                    });
                } else if (requestIndex === 1 && data.table) { // Previous Standings
                    previousRanks[leagueIdStr] = {};
                    data.table.forEach(t => {
                        previousRanks[leagueIdStr][String(t.idTeam)] = parseInt(t.intRank, 10);
                         if (t.idTeam && t.strTeam && !allTeamsMap[String(t.idTeam)]) allTeamsMap[String(t.idTeam)] = t.strTeam; // Add team if missed
                    });
                } else if (requestIndex === 2 && data.events) { // Recent Results
                    recentEventsMap[leagueIdStr] = data.events;
                } else if (requestIndex === 3 && data.events) { // Upcoming Fixtures
                    combinedUpcomingEvents.push(...data.events);
                }
            });

            if (errorCount > 0) {
                 statusDiv.textContent = `Completed with ${errorCount} fetch errors. Data may be incomplete. Check console.`;
                 statusDiv.className = 'error';
            } else {
                 statusDiv.textContent = "Data fetched successfully. Calculating odds...";
            }

            // --- 3. Calculate Odds and Map Fixtures ---
            const finalMappedFixtures = mapTheSportsDbToFixtures(
                combinedUpcomingEvents,
                null, // League Name will come from event object
                null, // Country will come from event object
                currentRanks,
                previousRanks,
                recentEventsMap
            );

            console.log(`Mapped ${finalMappedFixtures.length} fixtures with synthetic odds.`);

             // --- 4. Save to Firestore ---
            await saveFixturesToFirestore(finalMappedFixtures);

        } catch (overallError) {
            console.error("Error in overall admin fetch process:", overallError);
            statusDiv.textContent = `Error: ${overallError.message}`;
            statusDiv.className = 'error';
        } finally {
            fetchButton.disabled = false; // Re-enable button
        }
    });
} else {
    console.error("Fetch Button not found!");
}

// Remove single date fetch button listener if element removed from HTML
// if (fetchSingleButton) { fetchSingleButton.addEventListener(...); }
