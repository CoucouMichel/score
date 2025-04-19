// ranking.js - Simulates multi-player rankings using Firebase Init

// --- Firebase Initialization (ES Module Version) ---
// Import functions from the Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
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
  measurementId: "G-HCKHYJ0HZD"                  // Optional (keep if provided)
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized for ranking page (module mode)!");

// Get references to Firebase services (might be needed later)
const auth = getAuth(app);
const db = getFirestore(app);


// --- Constants (Copied/Adapted from script.js) ---
const now = new Date("2025-04-19T12:00:00Z"); // Use same reference date
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

// Helper to get date string
function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// --- Copy Fake Fixtures Data (Needed for scoring) ---
// IMPORTANT: This MUST match the fakeFixtures in your main script.js
// Consider moving this to a shared JSON file later for consistency.
const fakeFixtures = [ /* ... PASTE YOUR *ENTIRE* EXPANDED FAKE FIXTURES ARRAY HERE ... */
    // Example:
    { fixtureId: 304, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 5, name: "Mersey Reds" }, awayTeam: { id: 6, name: "Man Citizens" }, odds: { homeWin: 2.2, draw: 3.5, awayWin: 3.1 }, result: { homeScore: 3, awayScore: 1 } },
    { fixtureId: 305, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() - 1 * oneDay + 18.5 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 56, name: "Leipzig Bulls" }, awayTeam: { id: 57, name: "Hoffenheim Village" }, odds: { homeWin: 1.8, draw: 4.0, awayWin: 4.2 }, result: { homeScore: 2, awayScore: 2 } },
    // ... include ALL ~30 fixtures ...
    {
        fixtureId: 301, competition: "Europa League", country: "UEFA", kickOffTime: new Date(now.getTime() - 2 * oneDay + 17 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 50, name: "Roma Gladiators" }, awayTeam: { id: 51, name: "Leverkusen Works" }, odds: { homeWin: 2.8, draw: 3.5, awayWin: 2.5 }, result: { homeScore: 1, awayScore: 1 }
    },
    {
        fixtureId: 302, competition: "Europa League", country: "UEFA", kickOffTime: new Date(now.getTime() - 2 * oneDay + 19 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 52, name: "Marseille Port" }, awayTeam: { id: 53, name: "Atalanta Hills" }, odds: { homeWin: 2.6, draw: 3.3, awayWin: 2.7 }, result: { homeScore: 2, awayScore: 0 }
    },
    {
        fixtureId: 303, competition: "Pro League", country: "Belgium", kickOffTime: new Date(now.getTime() - 2 * oneDay + 18 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 54, name: "Club Brugge" }, awayTeam: { id: 55, name: "Anderlecht Royals" }, odds: { homeWin: 2.1, draw: 3.6, awayWin: 3.2 }, result: { homeScore: 3, awayScore: 1 }
    },
     {
        fixtureId: 306, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19.5 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 58, name: "Inter Serpents" }, awayTeam: { id: 59, name: "Lazio Eagles" }, odds: { homeWin: 1.6, draw: 4.2, awayWin: 5.0 }, result: { homeScore: 1, awayScore: 0 }
    },
    {
        fixtureId: 101, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() + 2 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 1, name: "Man Reds" }, awayTeam: { id: 2, name: "Lon Blues" }, odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.8 }, result: null
    },
    {
        fixtureId: 102, competition: "La Liga", country: "Spain", kickOffTime: new Date(now.getTime() + 4 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 3, name: "Madrid Whites" }, awayTeam: { id: 4, name: "Catalan Giants" }, odds: { homeWin: 1.9, draw: 3.8, awayWin: 4.0 }, result: null
    },
    {
        fixtureId: 105, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() + 5 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 11, name: "Dortmund Bees" }, awayTeam: { id: 7, name: "Bavarian Stars" }, odds: { homeWin: 2.9, draw: 3.6, awayWin: 2.4 }, result: null
    },
    {
        fixtureId: 307, competition: "Primeira Liga", country: "Portugal", kickOffTime: new Date(now.getTime() + 6 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 60, name: "Porto Dragons" }, awayTeam: { id: 61, name: "Sporting Lions" }, odds: { homeWin: 2.3, draw: 3.3, awayWin: 3.0 }, result: null
    },
     {
        fixtureId: 308, competition: "Eredivisie", country: "Netherlands", kickOffTime: new Date(now.getTime() + 7 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 62, name: "Ajax Masters" }, awayTeam: { id: 63, name: "PSV Lights" }, odds: { homeWin: 2.0, draw: 3.8, awayWin: 3.5 }, result: null
    },
     {
        fixtureId: 309, competition: "Ligue 1", country: "France", kickOffTime: new Date(now.getTime() + 8 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 64, name: "Monaco Princes" }, awayTeam: { id: 65, name: "Lille Dogs" }, odds: { homeWin: 1.9, draw: 3.5, awayWin: 4.1 }, result: null
    },
     {
        fixtureId: 201, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() + 1 * oneDay + 3 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 9, name: "Milan Devils" }, awayTeam: { id: 10, name: "Turin Zebras" }, odds: { homeWin: 3.1, draw: 3.3, awayWin: 2.3 }, result: null
    },
    {
        fixtureId: 202, competition: "Ligue 1", country: "France", kickOffTime: new Date(now.getTime() + 1 * oneDay + 5 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 8, name: "Paris Royals" }, awayTeam: { id: 12, name: "Lyon Lions" }, odds: { homeWin: 1.5, draw: 4.5, awayWin: 6.0 }, result: null
    },
     {
        fixtureId: 203, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() + 1 * oneDay + 6 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 6, name: "Man Citizens" }, awayTeam: { id: 5, name: "Mersey Reds" }, odds: { homeWin: 1.7, draw: 4.0, awayWin: 4.8 }, result: null
    },
    {
        fixtureId: 310, competition: "La Liga", country: "Spain", kickOffTime: new Date(now.getTime() + 1 * oneDay + 7 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 66, name: "Sevilla Rojos" }, awayTeam: { id: 67, name: "Betis Verdes" }, odds: { homeWin: 2.4, draw: 3.2, awayWin: 2.9 }, result: null
    },
    {
        fixtureId: 311, competition: "Süper Lig", country: "Turkey", kickOffTime: new Date(now.getTime() + 1 * oneDay + 4 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 68, name: "Galatasaray Lions" }, awayTeam: { id: 69, name: "Fenerbahce Canaries" }, odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.7 }, result: null
    },
    {
        fixtureId: 312, competition: "Scottish Premiership", country: "Scotland", kickOffTime: new Date(now.getTime() + 1 * oneDay + 1 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 70, name: "Celtic Hoops" }, awayTeam: { id: 71, name: "Rangers Gers" }, odds: { homeWin: 1.9, draw: 3.7, awayWin: 3.8 }, result: null
    },
    {
        fixtureId: 313, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() + 2 * oneDay + 18.75 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 72, name: "Napoli Blues" }, awayTeam: { id: 50, name: "Roma Gladiators" }, odds: { homeWin: 2.0, draw: 3.5, awayWin: 3.6 }, result: null
    },
     {
        fixtureId: 314, competition: "La Liga", country: "Spain", kickOffTime: new Date(now.getTime() + 2 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 73, name: "Athletic Bilbao" }, awayTeam: { id: 74, name: "Real Sociedad" }, odds: { homeWin: 2.6, draw: 3.1, awayWin: 2.8 }, result: null
    },
     {
        fixtureId: 315, competition: "Pro League", country: "Belgium", kickOffTime: new Date(now.getTime() + 2 * oneDay + 18 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 75, name: "Gent Buffalos" }, awayTeam: { id: 76, name: "Standard Liege" }, odds: { homeWin: 1.9, draw: 3.4, awayWin: 4.0 }, result: null
    },
    {
        fixtureId: 316, competition: "Champions League", country: "UEFA", kickOffTime: new Date(now.getTime() + 3 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 7, name: "Bavarian Stars" }, awayTeam: { id: 4, name: "Catalan Giants" }, odds: { homeWin: 1.7, draw: 4.0, awayWin: 4.5 }, result: null
    },
     {
        fixtureId: 317, competition: "Champions League", country: "UEFA", kickOffTime: new Date(now.getTime() + 3 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 6, name: "Man Citizens" }, awayTeam: { id: 3, name: "Madrid Whites" }, odds: { homeWin: 1.9, draw: 3.8, awayWin: 3.7 }, result: null
    },
     {
        fixtureId: 318, competition: "Süper Lig", country: "Turkey", kickOffTime: new Date(now.getTime() + 3 * oneDay + 17 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 77, name: "Besiktas Eagles" }, awayTeam: { id: 78, name: "Trabzonspor Storm" }, odds: { homeWin: 2.1, draw: 3.4, awayWin: 3.3 }, result: null
    },
      {
        fixtureId: 319, competition: "Scottish Premiership", country: "Scotland", kickOffTime: new Date(now.getTime() + 4 * oneDay + 18.5 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 79, name: "Hearts Jambos" }, awayTeam: { id: 80, name: "Hibernian Hibees" }, odds: { homeWin: 2.5, draw: 3.2, awayWin: 2.8 }, result: null
    },
      {
        fixtureId: 320, competition: "Eredivisie", country: "Netherlands", kickOffTime: new Date(now.getTime() + 4 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 81, name: "Feyenoord Port" }, awayTeam: { id: 82, name: "AZ Alkmaar" }, odds: { homeWin: 1.8, draw: 3.9, awayWin: 4.1 }, result: null
    },
];


// --- Copy Scoring Function (Needed for calculation) ---
function calculateScore(selection, fixture) {
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result) return null;
    let score = 0;
    const selectedTeamIsHome = fixture.homeTeam.id === selection.teamId;
    const selectedTeamScore = selectedTeamIsHome ? fixture.result.homeScore : fixture.result.awayScore;
    const concededScore = selectedTeamIsHome ? fixture.result.awayScore : fixture.result.homeScore;
    if (selectedTeamScore > concededScore) score += selection.selectedWinOdd * 5;
    else if (selectedTeamScore === concededScore) score += selection.fixtureDrawOdd * 2;
    score += selectedTeamScore * 3; score -= concededScore * 1;
    return Math.max(0, score); // Min score is 0
}


// --- SIMULATED Multi-Player Data ---
// In a real app, this would come from a database/API via Firebase (db)
const allPlayersData = [
    {
        name: "Player One (You)",
        // Attempt to load your actual selections from localStorage for demo
        selections: JSON.parse(localStorage.getItem('footballGameSelections') || '{}')
    },
    {
        name: "CPU Player Alpha",
        selections: { // Fake past picks for Alpha
            "2025-04-18": { fixtureId: 304, teamId: 6, teamName: "Man Citizens", selectedWinOdd: 3.1, fixtureDrawOdd: 3.5 },
            "2025-04-17": { fixtureId: 301, teamId: 51, teamName: "Leverkusen Works", selectedWinOdd: 2.5, fixtureDrawOdd: 3.5 },
        }
    },
    {
        name: "Player Beta",
        selections: { // Fake past picks for Beta
            "2025-04-18": { fixtureId: 305, teamId: 56, teamName: "Leipzig Bulls", selectedWinOdd: 1.8, fixtureDrawOdd: 4.0 },
            "2025-04-17": { fixtureId: 303, teamId: 54, teamName: "Club Brugge", selectedWinOdd: 2.1, fixtureDrawOdd: 3.6 },
            "2025-04-19": { fixtureId: 101, teamId: 1, teamName: "Man Reds", selectedWinOdd: 2.5, fixtureDrawOdd: 3.4 } // Pick for today (not scored yet)
        }
    },
     {
        name: "Gamer Gamma",
        selections: { // Fake past picks for Gamma
            "2025-04-18": { fixtureId: 306, teamId: 59, teamName: "Lazio Eagles", selectedWinOdd: 5.0, fixtureDrawOdd: 4.2 },
             "2025-04-17": { fixtureId: 302, teamId: 52, teamName: "Marseille Port", selectedWinOdd: 2.6, fixtureDrawOdd: 3.3 }
        }
    },
    // Add more fake players as needed
];


// --- Ranking Logic ---

/**
 * Calculates stats for a single player.
 */
function calculatePlayerStats(playerData) {
    let totalPoints = 0;
    let scoredPicks = 0;

    for (const dateStr in playerData.selections) {
        const selection = playerData.selections[dateStr];
        const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);

        if (fixture && fixture.status === 'FINISHED' && fixture.result) {
            const score = calculateScore(selection, fixture);
            if (score !== null) {
                totalPoints += score;
                scoredPicks++;
            }
        }
    }
    const avgPoints = scoredPicks > 0 ? totalPoints / scoredPicks : 0;
    return { name: playerData.name, totalPoints: totalPoints, avgPoints: avgPoints, scoredPicks: scoredPicks };
}

/**
 * Sorts the calculated player stats.
 */
function sortRankings(statsArray, sortBy = 'total') {
    statsArray.sort((a, b) => {
        if (sortBy === 'average') {
            if (b.avgPoints !== a.avgPoints) return b.avgPoints - a.avgPoints;
        }
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        return b.avgPoints - a.avgPoints; // Tie-breaker
    });
    return statsArray.map((player, index) => ({ ...player, position: index + 1 }));
}

/**
 * Displays the rankings in the HTML table.
 */
function displayRankings(sortedPlayers) {
    const tableBody = document.getElementById('ranking-body');
    if (!tableBody) return;
    tableBody.innerHTML = ''; // Clear

    if (sortedPlayers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No player data available.</td></tr>';
        return;
    }

    sortedPlayers.forEach(player => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = player.position;
        row.insertCell().textContent = player.name;
        row.insertCell().textContent = player.avgPoints.toFixed(1); // 1 decimal
        const totalCell = row.insertCell();
        totalCell.textContent = player.totalPoints.toFixed(1); // 1 decimal
        totalCell.classList.add('highlight');
    });
}

// --- Initialization and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const btnTotal = document.getElementById('sort-total-btn');
    const btnAvg = document.getElementById('sort-avg-btn');
    const tableBody = document.getElementById('ranking-body'); // Added check

    // Ensure table body exists before proceeding
    if (!tableBody || !btnTotal || !btnAvg) {
        console.error("Ranking table elements not found!");
        return;
    }

    // 1. Calculate stats
    const playerStats = allPlayersData.map(player => calculatePlayerStats(player));

    // 2. Initial sort & display
    let currentSort = 'total';
    let sortedRankings = sortRankings(playerStats, currentSort);
    displayRankings(sortedRankings);

    // 3. Add listeners
    btnTotal.addEventListener('click', () => {
        if (currentSort !== 'total') {
            currentSort = 'total';
            btnTotal.classList.add('active');
            btnAvg.classList.remove('active');
            // Re-use already calculated stats, just re-sort
            sortedRankings = sortRankings(playerStats, currentSort);
            displayRankings(sortedRankings);
        }
    });

    btnAvg.addEventListener('click', () => {
        if (currentSort !== 'average') {
            currentSort = 'average';
            btnAvg.classList.add('active');
            btnTotal.classList.remove('active');
             // Re-use already calculated stats, just re-sort
            sortedRankings = sortRankings(playerStats, currentSort);
            displayRankings(sortedRankings);
        }
    });
});
