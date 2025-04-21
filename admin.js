// admin.js - Revised Fetch/Map Logic for TheSportsDB

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
// Use TheSportsDB Test API Key "3" (Free)
const theSportsDbApiKey = "3";

// Define Leagues with ID and Country (Verify IDs!)
const DESIRED_LEAGUES = {
    // Format: { "League Name": { id: TSBDB_League_ID, country: "Country Name" } }
    "Premier League": { id: 4328, country: "England" },
    "La Liga": { id: 4335, country: "Spain" },
    "Serie A": { id: 4332, country: "Italy" },
    "Bundesliga": { id: 4331, country: "Germany" },
    "Ligue 1": { id: 4334, country: "France" },
    // Add Champions League / Europa League if IDs are confirmed and data structure is compatible
    // "Champions League": { id: 4480, country: "UEFA"}, // Example
};
const leagueEntries = Object.entries(DESIRED_LEAGUES); // Array of [name, {id, country}]

// Define Seasons (Adjust years as needed based on API data for current date)
const CURRENT_SEASON = "2024-2025"; // Or dynamically determine
const PREVIOUS_SEASON = "2023-2024";

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized for Admin page!");

// --- DOM Elements ---
const fetchButton = document.getElementById('fetch-button');
const statusDiv = document.getElementById('status');
// Removed single date elements for simplicity now

// --- Helper Functions ---
function getDateString(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) return null;
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

async function fetchTSDBData(endpoint, params) {
    const query = new URLSearchParams(params).toString();
    const url = `https://www.thesportsdb.com/api/v1/json/<span class="math-inline">\{theSportsDbApiKey\}/</span>{endpoint}?${query}`;
    console.log("Attempting to fetch:", url); // Log URL
    try {
        const response = await fetch(url);
        const responseText = await response.text(); // Get raw text first
        console.log(`Raw response text for <span class="math-inline">\{endpoint\} \(</span>{params.l || params.id}):`, responseText.substring(0, 500) + "..."); // Log first 500 chars

        if (!response.ok) {
            throw new Error(`Workspace failed: ${response.status} - ${responseText}`);
        }
        const data = JSON.parse(responseText); // Parse text
         await new Promise(resolve => setTimeout(resolve, 300));
        return data;
    } catch (error) { // ... error handling ...
        return null;
    }
}

// --- Data Processing Functions ---

function calculateForm(teamId, allRecentEvents, numGames = 5) {
    if (!teamId || !Array.isArray(allRecentEvents)) return 0;
    let formPoints = 0; let gamesCounted = 0;
    // Ensure events are sorted newest first (API might do this, but good to be sure)
    allRecentEvents.sort((a, b) => new Date(b.dateEvent + 'T' + b.strTime) - new Date(a.dateEvent + 'T' + a.strTime));

    for (const event of allRecentEvents) {
        if (gamesCounted >= numGames) break;
        if (event.idHomeTeam === teamId || event.idAwayTeam === teamId) {
            const homeScore = parseInt(event.intHomeScore, 10);
            const awayScore = parseInt(event.intAwayScore, 10);
            if (!isNaN(homeScore) && !isNaN(awayScore)) {
                gamesCounted++;
                if (event.idHomeTeam === teamId) { // Team played Home
                    if (homeScore > awayScore) formPoints += 3; else if (homeScore === awayScore) formPoints += 1;
                } else { // Team played Away
                    if (awayScore > homeScore) formPoints += 3; else if (awayScore === homeScore) formPoints += 1;
                }
            }
        }
    }
    return formPoints;
}

function calculateSyntheticOdds(homeRank, awayRank, homeForm, awayForm, homePrevRank, awayPrevRank) {
    // Use defaults if rank/form data is missing (treat as mid-table avg form)
    homeRank = homeRank ?? 10; awayRank = awayRank ?? 10;
    homeForm = homeForm ?? 7; awayForm = awayForm ?? 7;
    homePrevRank = homePrevRank ?? 10; awayPrevRank = awayPrevRank ?? 10;
    const rankDiff = awayRank - homeRank; const formDiff = homeForm - awayForm; const prevRankDiff = awayPrevRank - homePrevRank;
    const baseHome = 2.40; const baseAway = 2.70; const rankScale = 0.07; const formScale = 0.025; const prevRankScale = 0.01; const rankCap = 12;
    const cappedRankDiff = Math.max(-rankCap, Math.min(rankCap, rankDiff));
    const rankAdj = cappedRankDiff * rankScale; const formAdj = formDiff * formScale; const prevRankAdj = prevRankDiff * prevRankScale;
    let homeOdd = baseHome - rankAdj - formAdj - prevRankAdj; let awayOdd = baseAway + rankAdj + formAdj + prevRankAdj;
    homeOdd = Math.max(1.01, homeOdd); awayOdd = Math.max(1.01, awayOdd);
    return { homeWin: parseFloat(homeOdd.toFixed(2)), awayWin: parseFloat(awayOdd.toFixed(2)) };
}

/**
 * Maps data from TheSportsDB events endpoints to our internal fixture format.
 */
function mapTheSportsDbToFixtures(apiEvents, leagueName, leagueCountry, rankings, prevRankings, recentEventsMap) {
    if (!Array.isArray(apiEvents)) return [];
    return apiEvents.map(event => {
        try {
            if (!event || !event.idEvent || !event.strHomeTeam || !event.strAwayTeam || !event.idHomeTeam || !event.idAwayTeam || !event.dateEvent || !event.strTime || !event.idLeague) {
                console.warn("Skipping TSB event mapping due to missing core data:", event); return null;
            }
            const timePart = event.strTime.split('+')[0].trim(); // Handle potential timezone offset
            const validTime = /^\d{2}:\d{2}:\d{2}$/.test(timePart); // Check format HH:MM:SS
            if (!validTime) {console.warn("Skipping TSB event due to invalid time format:", event.strTime); return null;}
            const kickOffIso = `${event.dateEvent}T${timePart}Z`; // Assume UTC
            const kickOffDate = new Date(kickOffIso);
            if (isNaN(kickOffDate.getTime())) { console.warn("Skipping TSB event due to invalid date/time parse:", kickOffIso); return null; }

            let internalStatus = 'SCHEDULED';
            if (event.strStatus === 'Match Finished') internalStatus = 'FINISHED';
            else if (event.strStatus?.includes('Postponed')) internalStatus = 'Postponed';
            else if (event.strStatus?.includes('Cancelled')) internalStatus = 'Cancelled';
            else if (event.intHomeScore !== null && event.intAwayScore !== null && event.strStatus !== 'Not Started' && event.strStatus !== 'Time to be defined') internalStatus = 'LIVE'; // Basic live check

            const homeIdStr = String(event.idHomeTeam);
            const awayIdStr = String(event.idAwayTeam);
            const leagueIdStr = String(event.idLeague);

            const homeRank = rankings?.[leagueIdStr]?.[homeIdStr]; const awayRank = rankings?.[leagueIdStr]?.[awayIdStr];
            const homePrevRank = prevRankings?.[leagueIdStr]?.[homeIdStr]; const awayPrevRank = prevRankings?.[leagueIdStr]?.[awayIdStr];
            const homeForm = calculateForm(homeIdStr, recentEventsMap?.[leagueIdStr] || []);
            const awayForm = calculateForm(awayIdStr, recentEventsMap?.[leagueIdStr] || []);
            const syntheticOdds = calculateSyntheticOdds(homeRank, awayRank, homeForm, awayForm, homePrevRank, awayPrevRank);

            return {
                fixtureId: String(event.idEvent),
                competition: event.strLeague || leagueName,
                country: leagueCountry || event.strCountry || "Unknown",
                kickOffTime: kickOffDate.toISOString(),
                status: internalStatus,
                homeTeam: { id: homeIdStr, name: event.strHomeTeam },
                awayTeam: { id: awayIdStr, name: event.strAwayTeam },
                odds: syntheticOdds,
                result: internalStatus === 'FINISHED' ? { homeScore: parseInt(event.intHomeScore, 10), awayScore: parseInt(event.intAwayScore, 10) } : null
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
     fixturesData.forEach(fixture => { /* ... Keep grouping logic ... */ });
     if (Object.keys(fixturesByDate).length === 0) { statusDiv.textContent = "No fixtures with valid dates found."; return;}
     statusDiv.textContent = `Saving fixtures for ${Object.keys(fixturesByDate).length} dates...`;
     const batch = writeBatch(db); let operations = 0; const maxBatch = 490;
     let totalFixturesSaved = 0;
     for (const dateStr in fixturesByDate) { /* ... Keep batching logic using setDoc with merge:true ... */ }
     try {
         if (operations > 0) { await batch.commit(); }
         console.log("Firestore successfully updated!");
         statusDiv.textContent = `Successfully saved/merged ${totalFixturesSaved} fixtures for ${Object.keys(fixturesByDate).length} dates.`; statusDiv.className = 'success';
     } catch (error) { console.error("Error writing final batch: ", error); statusDiv.textContent = `Error saving: ${error.message}.`; statusDiv.className = 'error'; }
}


// --- Main Fetch Logic (Event Listener for Button) ---
if (fetchButton) {
    fetchButton.addEventListener('click', async () => {
        statusDiv.textContent = "Starting data fetch process for all leagues..."; statusDiv.className = '';
        fetchButton.disabled = true;

        try {
            const promises = [];
            // Create all fetch promises first
            leagueEntries.forEach(([name, leagueInfo]) => {
                const id = leagueInfo.id;
                promises.push(fetchTSDBData('lookuptable.php', { l: id, s: CURRENT_SEASON }));      // 0: Current Standings
                promises.push(fetchTSDBData('lookuptable.php', { l: id, s: PREVIOUS_SEASON }));     // 1: Previous Standings
                promises.push(fetchTSDBData('eventspastleague.php', { id: id })); // 2: Last 15 Results
                promises.push(fetchTSDBData('eventsnextleague.php', { id: id })); // 3: Next 15 Fixtures
            });

            statusDiv.textContent = `Workspaceing data for ${leagueEntries.length} leagues (4 calls each)...`;
            const results = await Promise.allSettled(promises);
            console.log("API Fetch Results:", results);

            // Process results
            statusDiv.textContent = "Processing fetched data...";
            const currentRanks = {}; const previousRanks = {};
            const recentEventsMap = {}; const allTeamsMap = {};
            const upcomingEventsByLeague = {};
            let errorCount = 0;

            results.forEach((result, index) => {
                const requestTypeIndex = index % 4; // 0, 1, 2, or 3
                const leagueIndex = Math.floor(index / 4);
                const [leagueName, leagueInfo] = leagueEntries[leagueIndex];
                const leagueIdStr = String(leagueInfo.id);

                if (result.status !== 'fulfilled' || !result.value) {
                    console.error(`API call failed for ${leagueName}, type ${requestTypeIndex}:`, result.reason || "No value"); errorCount++; return;
                }
                const data = result.value;
                // console.log(`Processing result index ${index}: League=${leagueName}(${leagueIdStr}), Type=${requestTypeIndex}, Status=${result.status}`); // Verbose log

                try { // Add try/catch around processing each result type
                    if (requestTypeIndex === 0 && data.table) { // Current Standings
                        currentRanks[leagueIdStr] = {};
                        data.table.forEach(t => { currentRanks[leagueIdStr][String(t.idTeam)] = parseInt(t.intRank, 10); if (t.idTeam && t.strTeam) allTeamsMap[String(t.idTeam)] = t.strTeam; });
                    } else if (requestTypeIndex === 1 && data.table) { // Previous Standings
                        previousRanks[leagueIdStr] = {};
                        data.table.forEach(t => { previousRanks[leagueIdStr][String(t.idTeam)] = parseInt(t.intRank, 10); if (t.idTeam && t.strTeam && !allTeamsMap[String(t.idTeam)]) allTeamsMap[String(t.idTeam)] = t.strTeam; });
                    } else if (requestTypeIndex === 2 && data.events) { // Recent Results
                        recentEventsMap[leagueIdStr] = data.events;
                    } else if (requestTypeIndex === 3 && data.events) { // Upcoming Fixtures
                         if (!upcomingEventsByLeague[leagueIdStr]) upcomingEventsByLeague[leagueIdStr] = [];
                         upcomingEventsByLeague[leagueIdStr].push(...data.events);
                    } else if (!data.table && !data.events) {
                         console.warn(`No 'table' or 'events' array found in successful response for index ${index} (League: ${leagueName}, Type: ${requestTypeIndex})`);
                    }
                } catch (procError) {
                     console.error(`Error processing result index ${index} (League: ${leagueName}, Type: ${requestTypeIndex}):`, procError, data); errorCount++;
                }
            });


            if (errorCount > 0) { statusDiv.textContent = `Completed with ${errorCount} fetch/processing errors. Check console.`; statusDiv.className = 'error'; }
            else { statusDiv.textContent = "Data fetched successfully. Mapping fixtures & calculating odds..."; }

            // Map Fixtures PER League and Combine
            const finalMappedFixtures = [];
            for (const [leagueName, leagueInfo] of leagueEntries) {
                 const leagueIdStr = String(leagueInfo.id);
                 const leagueCountry = leagueInfo.country;
                 const eventsToMap = upcomingEventsByLeague[leagueIdStr] || [];
                 if (eventsToMap.length > 0) {
                      const mapped = mapTheSportsDbToFixtures( eventsToMap, leagueName, leagueCountry, currentRanks, previousRanks, recentEventsMap );
                      finalMappedFixtures.push(...mapped);
                 }
            }
            console.log(`Mapped ${finalMappedFixtures.length} fixtures total with synthetic odds.`);

            // Filter for next 14 days (inclusive of today)
            const twoWeeksFromNow = new Date(now.getTime() + 14 * oneDay);
            const filteredForDateRange = finalMappedFixtures.filter(f => {
                 const fixtureDate = new Date(f.kickOffTime);
                 return fixtureDate >= now && fixtureDate <= twoWeeksFromNow;
            });
            console.log(`Filtered down to ${filteredForDateRange.length} fixtures within the next 14 days.`);

            // Save to Firestore
            await saveFixturesToFirestore(filteredForDateRange);

        } catch (overallError) {
            console.error("Error in overall admin fetch process:", overallError);
            statusDiv.textContent = `Error: ${overallError.message}`; statusDiv.className = 'error';
        } finally {
            fetchButton.disabled = false; // Re-enable button
        }
    });
} else { console.error("Fetch Button not found!"); }

// Initial check
if (!fetchButton || !statusDiv) { console.error("One or more admin page elements are missing!"); }
