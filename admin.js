// admin.js - COMPLETE - Fetches TheSportsDB, Calculates Odds, Saves to Firestore

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
// TheSportsDB Free Test API Key
const theSportsDbApiKey = "874902";

// Define Leagues with ID and Country (Verify IDs!)
const DESIRED_LEAGUES = {
    "Premier League": { id: 4328, country: "England" },
    "La Liga":        { id: 4335, country: "Spain" },
    "Serie A":        { id: 4332, country: "Italy" },
    "Bundesliga":     { id: 4331, country: "Germany" },
    "Ligue 1":        { id: 4334, country: "France" },
    "Eredivisie":      { id: 4337, country: "Netherlands" },   
    "Ligue 2":        { id: 4401, country: "France" },
    "Süper Lig":      { id: 4339, country: "Turkey" },
    "Primeira Liga":  { id: 4344, country: "Portugal" },
    // Add UCL/UEL later if needed and IDs confirmed
};

const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

const leagueEntries = Object.entries(DESIRED_LEAGUES); // Array of [name, {id, country}]

// Define Seasons (Adjust years as needed based on API data for current date)
const CURRENT_SEASON = "2024-2025"; // Season string API expects
const PREVIOUS_SEASON = "2023-2024";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized for Admin page!");

// --- DOM Elements (Assigned AFTER DOM Loaded) ---
let fetchButton;
let statusDiv;
// let fetchSingleButton; // Uncomment if using single date fetch
// let singleDateInput; // Uncomment if using single date fetch

// --- Global Flag for Fetch Process ---
let isAdminFetchRunning = false;

// --- Helper Functions ---
function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

async function fetchTSDBData(endpoint, params) {
    const query = new URLSearchParams(params).toString();
    const url = `https://www.thesportsdb.com/api/v1/json/${theSportsDbApiKey}/${endpoint}?${query}`;
    // console.log("Fetching:", url); // Debug URL
    try {
        const response = await fetch(url);
        const responseText = await response.text();
        // console.log(`Raw response text for ${endpoint} (${params.l || params.id}):`, responseText.substring(0, 300) + "...");
        if (!response.ok) { throw new Error(`Workspace failed: ${response.status} - ${responseText}`); }
        // Check for empty responses which cause JSON errors
        if (!responseText) {
             console.warn(`Empty response received for ${endpoint} with params ${JSON.stringify(params)}`);
             return null; // Treat empty response like an error or no data
        }
        const data = JSON.parse(responseText);
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit delay
        return data;
    } catch (error) {
        console.error(`Error fetching/parsing ${endpoint} with params ${JSON.stringify(params)}:`, error);
        // Update status only if element exists
        if (statusDiv) {
             statusDiv.textContent = `Error fetching ${endpoint}: ${error.message}`;
             statusDiv.className = 'error';
        }
        return null; // Indicate failure
    }
}

// --- Data Processing Functions ---

function calculateForm(teamId, allRecentEvents, numGames = 5) {
    if (!teamId || !Array.isArray(allRecentEvents)) return 0;
    let formPoints = 0; let gamesCounted = 0;
    allRecentEvents.sort((a, b) => { // Sort by date descending
        try { return new Date(b.dateEvent + 'T' + b.strTime) - new Date(a.dateEvent + 'T' + a.strTime); }
        catch(e) { return 0;}
    });
    for (const event of allRecentEvents) {
        if (gamesCounted >= numGames) break;
        if (event.idHomeTeam === teamId || event.idAwayTeam === teamId) {
             const homeScore = parseInt(event.intHomeScore, 10);
             const awayScore = parseInt(event.intAwayScore, 10);
            if (!isNaN(homeScore) && !isNaN(awayScore)) {
                 gamesCounted++;
                 if (event.idHomeTeam === teamId) { if (homeScore > awayScore) formPoints += 3; else if (homeScore === awayScore) formPoints += 1; }
                 else { if (awayScore > homeScore) formPoints += 3; else if (awayScore === homeScore) formPoints += 1; }
            }
        }
    }
    return formPoints;
}

// admin.js

/**
 * Calculates SYNTHETIC Home Win and Away Win odds based on ranks, form, history,
 * and season progress. Increased weight on form and rank difference.
 * @param {number} leagueAvgGamesPlayed - Average games played in the league this season.
 */
function calculateSyntheticOdds(homeRank, awayRank, homeForm, awayForm, homePrevRank, awayPrevRank, leagueAvgGamesPlayed) {
    // Use fallbacks if data is missing
    const prevRankH = homePrevRank ?? homeRank ?? 10;
    const prevRankA = awayPrevRank ?? awayRank ?? 10;
    const rankH = homeRank ?? 10;
    const rankA = awayRank ?? 10;
    const formH = homeForm ?? 7; // Default to average form (7/15)
    const formA = awayForm ?? 7;
    const avgGames = leagueAvgGamesPlayed ?? 10; // Assume 10 games played if data missing

    // --- Calculate Differences ---
    const rankDiff = rankA - rankH; // Positive if home team is better ranked
    const formDiff = formH - formA; // Positive if home team form is better
    const prevRankDiff = prevRankA - prevRankH;

    // --- Define Weights and Caps ---
    const baseHome = 2.35; // Slightly lower base home odd
    const baseAway = 2.65; // Slightly lower base away odd
    const rankScale = 0.08; // Increased rank impact slightly
    const formScale = 0.04; // Increased form impact significantly (was 0.025)
    const prevRankScale = 0.005; // Reduced previous season impact (was 0.01)
    const rankCap = 14; // Max rank difference to consider (was 12)
    const maxGamesForFactor = 25; // Point where season progress factor reaches 1

    // --- Calculate Season Progress Factor (0 to 1) ---
    // Rank matters less early in the season
    const seasonProgressFactor = Math.min(1.0, Math.max(0, avgGames) / maxGamesForFactor);
    // console.log(`League Avg Games: ${avgGames}, Season Progress Factor: ${seasonProgressFactor.toFixed(2)}`); // Optional Debug

    // --- Calculate Adjustments ---
    const cappedRankDiff = Math.max(-rankCap, Math.min(rankCap, rankDiff));
    // Apply season progress factor to rank-based adjustments
    const rankAdj = cappedRankDiff * rankScale * seasonProgressFactor;
    const formAdj = formDiff * formScale; // Form impact is immediate
    const prevRankAdj = prevRankDiff * prevRankScale * seasonProgressFactor;

    // Calculate Raw Odds
    let homeOdd = baseHome - rankAdj - formAdj - prevRankAdj;
    let awayOdd = baseAway + rankAdj + formAdj + prevRankAdj;

    // Apply Minimum Constraint
    homeOdd = Math.max(1.01, homeOdd);
    awayOdd = Math.max(1.01, awayOdd);

    // Return calculated odds
    return {
        homeWin: parseFloat(homeOdd.toFixed(2)),
        awayWin: parseFloat(awayOdd.toFixed(2))
    };
}

// --- Mapping Function (Updated to include Logos) ---
/**
 * Maps data from TheSportsDB events endpoints to our internal fixture format.
 * Includes calculated synthetic odds and logo URLs.
 * @param {Array} apiEvents - Raw event objects for a specific league.
 * @param {string} leagueName - Name of the league for context.
 * @param {string} leagueCountry - Country of the league for context.
 * @param {object} leagueInfoMap - Map of { leagueId: { name, country, logo } }.
 * @param {object} teamLogoMap - Map of { teamId: logoUrl }.
 * @param {object} rankings - Map of current season rankings { leagueId: { teamId: rank } }.
 * @param {object} prevRankings - Map of previous season rankings { leagueId: { teamId: rank } }.
 * @param {object} recentEventsMap - Map of recent events { leagueId: [event1, event2...] }.
 * @param {number} avgGamesPlayed - Average games played in the league this season.
 * @returns {Array} Array of fixtures in our internal format.
 */
function mapTheSportsDbToFixtures(apiEvents, leagueName, leagueCountry, leagueInfoMap, teamLogoMap, rankings, prevRankings, recentEventsMap, avgGamesPlayed) {
    if (!Array.isArray(apiEvents)) {
        console.warn("mapTheSportsDbToFixtures received non-array:", apiEvents);
        return [];
    }
    const leagueIdStr = String(apiEvents[0]?.idLeague); // Get league ID from first event assume all are same league
    const leagueLogo = leagueInfoMap?.[leagueIdStr]?.logo || null; // Get league logo from map

    return apiEvents.map(event => {
        try {
            // Basic validation
            if (!event || !event.idEvent || !event.strHomeTeam || !event.strAwayTeam || !event.idHomeTeam || !event.idAwayTeam || !event.dateEvent || !event.strTime || !event.idLeague) {
                console.warn("Skipping TSB event mapping: missing core data:", event); return null;
            }
            // Ensure league matches (should already be grouped, but safety check)
            if (String(event.idLeague) !== leagueIdStr) {
                 console.warn("Skipping event from unexpected league:", event); return null;
            }

            // Date/Time Parsing
            const timePart = event.strTime.split('+')[0].trim();
            const validTime = /^\d{2}:\d{2}:\d{2}$/.test(timePart);
            if (!validTime) {console.warn("Skipping TSB event: invalid time format:", event.strTime); return null;}
            const kickOffIso = `${event.dateEvent}T${timePart}Z`;
            const kickOffDate = new Date(kickOffIso);
            if (isNaN(kickOffDate.getTime())) { console.warn("Skipping TSB event: invalid date parse:", kickOffIso); return null; }

            // Status Mapping
            let internalStatus = 'SCHEDULED'; const statusDesc = event.strStatus;
            if (statusDesc === 'Match Finished') internalStatus = 'FINISHED';
            else if (statusDesc?.includes('Postponed')) internalStatus = 'Postponed';
            else if (statusDesc?.includes('Cancelled')) internalStatus = 'Cancelled';
            else if (event.intHomeScore !== null && event.intAwayScore !== null && statusDesc !== 'Not Started' && statusDesc !== 'Time to be defined') internalStatus = 'LIVE';

            // Get Ranks & Form
            const homeIdStr = String(event.idHomeTeam); const awayIdStr = String(event.idAwayTeam);
            const homeRank = rankings?.[leagueIdStr]?.[homeIdStr]; const awayRank = rankings?.[leagueIdStr]?.[awayIdStr];
            const homePrevRank = prevRankings?.[leagueIdStr]?.[homeIdStr]; const awayPrevRank = prevRankings?.[leagueIdStr]?.[awayIdStr];
            const homeForm = calculateForm(homeIdStr, recentEventsMap?.[leagueIdStr] || []);
            const awayForm = calculateForm(awayIdStr, recentEventsMap?.[leagueIdStr] || []);

            // Calculate Synthetic Odds (using function defined elsewhere in admin.js)
            const syntheticOdds = calculateSyntheticOdds(homeRank, awayRank, homeForm, awayForm, homePrevRank, awayPrevRank, avgGamesPlayed);

            // Get Logos from maps
            const homeLogo = teamLogoMap?.[homeIdStr] || null;
            const awayLogo = teamLogoMap?.[awayIdStr] || null;

            // Create final object
            return {
                fixtureId: String(event.idEvent),
                competition: event.strLeague || leagueName,
                country: leagueCountry || "Unknown",
                leagueLogo: leagueLogo, // Add league logo
                kickOffTime: kickOffDate.toISOString(),
                status: internalStatus,
                homeTeam: { id: homeIdStr, name: event.strHomeTeam, logo: homeLogo }, // Add team logo
                awayTeam: { id: awayIdStr, name: event.strAwayTeam, logo: awayLogo }, // Add team logo
                odds: syntheticOdds, // Use calculated odds
                result: internalStatus === 'FINISHED' ? { homeScore: parseInt(event.intHomeScore, 10), awayScore: parseInt(event.intAwayScore, 10) } : null
            };
        } catch(mapError){ console.error("Error mapping TSB event:", mapError, "Event:", event); return null; }
    }).filter(fixture => fixture !== null); // Filter out any nulls from skipped/error items
}


// --- Firestore Saving Function ---
async function saveFixturesToFirestore(fixturesData) {
    if (!statusDiv) { console.error("Status div missing"); return; }
     if (!fixturesData || fixturesData.length === 0) { statusDiv.textContent = "No valid fixtures found/mapped to save."; statusDiv.className = ''; return; }
     statusDiv.textContent = "Processing fixtures for save..."; statusDiv.className = '';
     const fixturesByDate = {};
     fixturesData.forEach(fixture => { try { const d = getDateString(new Date(fixture.kickOffTime)); if(!d) return; if (!fixturesByDate[d]) fixturesByDate[d] = []; fixturesByDate[d].push(fixture); } catch (e) { console.error("Error grouping fixture:", fixture, e); }});
     const dateCount = Object.keys(fixturesByDate).length;
     if (dateCount === 0) { statusDiv.textContent = "No fixtures with valid dates found after grouping."; return;}
     console.log("Fixtures grouped by date:", dateCount, "dates");
     statusDiv.textContent = `Saving ${fixturesData.length} fixtures across ${dateCount} dates...`;
     const batch = writeBatch(db); let operations = 0; const maxBatch = 490;
     let totalFixturesSaved = 0;
     for (const dateStr in fixturesByDate) {
         const docRef = doc(db, "fixturesByDate", dateStr);
         batch.set(docRef, { fixtures: fixturesByDate[dateStr], fetchedAt: new Date().toISOString() }, { merge: true }); // Use merge to update existing dates
         operations++; totalFixturesSaved += fixturesByDate[dateStr].length;
         if (operations >= maxBatch) { console.log(`Committing batch of ${operations} dates...`); await batch.commit(); batch = writeBatch(db); operations = 0; statusDiv.textContent = `Saving... (${totalFixturesSaved} fixtures...)`; }
     }
     try {
         if (operations > 0) { console.log(`Committing final batch of ${operations} dates...`); await batch.commit(); }
         console.log("Firestore successfully updated!");
         statusDiv.textContent = `Successfully saved/merged ${totalFixturesSaved} fixtures for ${dateCount} dates.`; statusDiv.className = 'success';
     } catch (error) { console.error("Error writing final batch to Firestore: ", error); statusDiv.textContent = `Error saving: ${error.message}. Check Firestore Rules.`; statusDiv.className = 'error'; }
}


// --- Initialization & Main Fetch Logic ---
document.addEventListener('DOMContentLoaded', () => {
    // Assign elements now that DOM is ready
    fetchButton = document.getElementById('fetch-button');
    statusDiv = document.getElementById('status');
    // fetchSingleButton = document.getElementById('fetch-single-button'); // Uncomment if using
    // singleDateInput = document.getElementById('single-date-input'); // Uncomment if using

     if (!fetchButton || !statusDiv) {
         console.error("Required admin page elements (fetch button or status div) are missing!");
         if(statusDiv) statusDiv.textContent = "Error: Page elements missing.";
         return; // Stop if critical elements missing
     }

    // Attach the main fetch listener
    fetchButton.addEventListener('click', async () => {
        if (isAdminFetchRunning) {
            console.log("Admin fetch already in progress."); statusDiv.textContent = "Fetch already running..."; return;
        }
        isAdminFetchRunning = true; fetchButton.disabled = true;
        statusDiv.textContent = "Starting data fetch process for all leagues..."; statusDiv.className = '';

        try {
            const promises = [];
            leagueEntries.forEach(([name, leagueInfo]) => {
                const id = leagueInfo.id;
                promises.push(fetchTSDBData('lookuptable.php', { l: id, s: CURRENT_SEASON }));      // 0: Current Standings
                promises.push(fetchTSDBData('lookuptable.php', { l: id, s: PREVIOUS_SEASON }));     // 1: Previous Standings
                promises.push(fetchTSDBData('eventspastleague.php', { id: id })); // 2: Last 15 Results
                promises.push(fetchTSDBData('eventsnextleague.php', { id: id })); // 3: Next 15 Fixtures
            });

            statusDiv.textContent = `Workspaceing data for ${leagueEntries.length} leagues (4 calls each)...`;
            const results = await Promise.allSettled(promises);
            console.log("--- API Fetch Results ---");
            results.forEach((r, i) => console.log(`Result ${i}: ${r.status}`));

 statusDiv.textContent = "Processing fetched data...";
    const currentRanks = {}; const previousRanks = {};
    const recentEventsMap = {}; const allTeamsMap = {};
    const upcomingEventsByLeague = {};
    // *** NEW: Store average games played per league ***
    const leagueAvgGamesPlayed = {};
    let errorCount = 0;

    results.forEach((result, index) => {
        const requestTypeIndex = index % 6; // Now 6 requests per league if logos added, adjust if not
        const leagueIndex = Math.floor(index / reqTypesPerLeague); // Use reqTypesPerLeague var
        const [leagueName, leagueInfo] = leagueEntries[leagueIndex];
        const leagueIdStr = String(leagueInfo.id);

        if (result.status !== 'fulfilled' || !result.value) { /* ... error handling ... */ return; }
        const data = result.value;

        try {
            if (requestTypeIndex === 0 && data.table) { // Current Standings
                currentRanks[leagueIdStr] = {};
                let totalGames = 0;
                let teamCount = 0;
                data.table.forEach(t => {
                    const teamIdStr = String(t.idTeam);
                    currentRanks[leagueIdStr][teamIdStr] = parseInt(t.intRank, 10);
                    if (t.idTeam && t.strTeam) allTeamsMap[teamIdStr] = t.strTeam;
                    // Accumulate games played for average calculation
                    if (t.intPlayed) {
                         totalGames += parseInt(t.intPlayed, 10);
                         teamCount++;
                    }
                });
                // *** Calculate and store average games played ***
                leagueAvgGamesPlayed[leagueIdStr] = teamCount > 0 ? totalGames / teamCount : 0;
            }
            else if (requestTypeIndex === 1 && data.table) { /* Process prev ranks */ }
            else if (requestTypeIndex === 2 && data.events) { recentEventsMap[leagueIdStr] = data.events; }
            else if (requestTypeIndex === 3 && data.events) { /* Process upcoming events */ }
            // Add processing for logo fetches if you kept them (Indices 4 & 5)
            // else if (requestTypeIndex === 4 && data.leagues) { ... leagueInfoMap[leagueIdStr].logo = ... }
            // else if (requestTypeIndex === 5 && data.teams) { ... teamLogoMap[String(team.idTeam)] = ... }
            else { /* ... warning for unexpected data ... */ }
        } catch (procError) { /* ... error handling ... */ }
    });

            if (errorCount > 0) { statusDiv.textContent = `Completed with ${errorCount} fetch/processing errors. Check console.`; statusDiv.className = 'error'; }
            else { statusDiv.textContent = "Data fetched successfully. Mapping fixtures & calculating odds..."; }

            const finalMappedFixtures = [];
            for (const [leagueName, leagueInfo] of leagueEntries) {
                 const leagueIdStr = String(leagueInfo.id); const leagueCountry = leagueInfo.country;
                 const eventsToMap = upcomingEventsByLeague[leagueIdStr] || [];
                 if (eventsToMap.length > 0) {
                      const mapped = mapTheSportsDbToFixtures( eventsToMap, leagueName, leagueCountry, currentRanks, previousRanks, recentEventsMap );
                      finalMappedFixtures.push(...mapped);
                 }
            }
            console.log(`Mapped ${finalMappedFixtures.length} fixtures total with synthetic odds.`);

            const today = new Date(); // Use actual today for filtering range
            const twoWeeksFromNow = new Date(today.getTime() + 14 * oneDay);
            const filteredForDateRange = finalMappedFixtures.filter(f => {
                try { const fixtureDate = new Date(f.kickOffTime); return fixtureDate >= today && fixtureDate <= twoWeeksFromNow; }
                catch(e){ return false;} // Filter out if date is invalid
            });
            console.log(`Filtered down to ${filteredForDateRange.length} fixtures within the next 14 days.`);

            await saveFixturesToFirestore(filteredForDateRange);

        } catch (overallError) {
            console.error("Error in overall admin fetch process:", overallError);
            statusDiv.textContent = `Error: ${overallError.message}`; statusDiv.className = 'error';
        } finally {
            isAdminFetchRunning = false; // Reset flag
            fetchButton.disabled = false; // Re-enable button
            console.log("Fetch process finished.");
        }
    });

    // Add listener for single date fetch if button exists
    // if (fetchSingleButton) { fetchSingleButton.addEventListener('click', async () => { ... }); }

}); // End DOMContentLoaded
