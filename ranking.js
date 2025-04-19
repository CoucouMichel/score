// ranking.js - Simulates multi-player rankings

// --- Constants (Copied/Adapted from script.js) ---
// IMPORTANT: Need the same 'now' reference if comparing dates.
const now = new Date("2025-04-19T12:00:00Z");
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
    // ... include ALL fixtures ...
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
// In a real app, this would come from a database/API
const allPlayersData = [
    {
        name: "Player One (You)",
        // We can try loading *your* actual selections from localStorage
        // Or just use fake selections for everyone
        selections: JSON.parse(localStorage.getItem('footballGameSelections') || '{}')
    },
    {
        name: "CPU Player Alpha",
        selections: { // Fake past picks for Alpha
            "2025-04-18": { fixtureId: 304, teamId: 6, teamName: "Man Citizens", selectedWinOdd: 3.1, fixtureDrawOdd: 3.5 },
            "2025-04-17": { fixtureId: 301, teamId: 51, teamName: "Leverkusen Works", selectedWinOdd: 2.5, fixtureDrawOdd: 3.5 },
            "2025-04-16": { fixtureId: 999, teamId: 1, teamName: "Old Pick (No Fixture)"} // Example of an old pick without matching fixture
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
 * @param {object} playerData - Object with name and selections.
 * @returns {object} Object with name, totalPoints, avgPoints, scoredPicks.
 */
function calculatePlayerStats(playerData) {
    let totalPoints = 0;
    let scoredPicks = 0;

    for (const dateStr in playerData.selections) {
        const selection = playerData.selections[dateStr];
        // Find the corresponding fixture in our master list
        const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);

        // Calculate score only if fixture found and is finished
        if (fixture && fixture.status === 'FINISHED' && fixture.result) {
            const score = calculateScore(selection, fixture);
            if (score !== null) {
                totalPoints += score;
                scoredPicks++;
            }
        }
    }

    const avgPoints = scoredPicks > 0 ? totalPoints / scoredPicks : 0;

    return {
        name: playerData.name,
        totalPoints: totalPoints,
        avgPoints: avgPoints,
        scoredPicks: scoredPicks
    };
}

/**
 * Sorts the calculated player stats.
 * @param {Array} statsArray - Array of player stats objects.
 * @param {string} sortBy - 'total' or 'average'.
 * @returns {Array} The sorted array with position added.
 */
function sortRankings(statsArray, sortBy = 'total') {
    statsArray.sort((a, b) => {
        if (sortBy === 'average') {
            // Sort by Avg Pts desc, then Total Pts desc as tie-breaker
            if (b.avgPoints !== a.avgPoints) {
                return b.avgPoints - a.avgPoints;
            }
        }
        // Default sort by Total Pts desc, then Avg Pts desc as tie-breaker
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        return b.avgPoints - a.avgPoints; // Tie-breaker for total points
    });

    // Add position number
    return statsArray.map((player, index) => ({
        ...player,
        position: index + 1
    }));
}

/**
 * Displays the rankings in the HTML table.
 * @param {Array} sortedPlayers - Array of sorted player stats objects with position.
 */
function displayRankings(sortedPlayers) {
    const tableBody = document.getElementById('ranking-body');
    if (!tableBody) return; // Exit if table body not found

    tableBody.innerHTML = ''; // Clear previous rankings

    if (sortedPlayers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4">No player data available.</td></tr>';
        return;
    }

    sortedPlayers.forEach(player => {
        const row = tableBody.insertRow();

        const posCell = row.insertCell();
        posCell.textContent = player.position;

        const nameCell = row.insertCell();
        nameCell.textContent = player.name;

        const avgCell = row.insertCell();
        avgCell.textContent = player.avgPoints.toFixed(1); // Format to 1 decimal

        const totalCell = row.insertCell();
        totalCell.textContent = player.totalPoints.toFixed(1); // Format to 1 decimal
        totalCell.classList.add('highlight'); // Highlight total points column
    });
}

// --- Initialization and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const btnTotal = document.getElementById('sort-total-btn');
    const btnAvg = document.getElementById('sort-avg-btn');

    // 1. Calculate stats for all players
    const playerStats = allPlayersData.map(player => calculatePlayerStats(player));

    // 2. Initial sort and display (by Total Points)
    let currentSort = 'total';
    let sortedRankings = sortRankings(playerStats, currentSort);
    displayRankings(sortedRankings);

    // 3. Add listeners to sort buttons
    btnTotal.addEventListener('click', () => {
        if (currentSort !== 'total') {
            currentSort = 'total';
            btnTotal.classList.add('active');
            btnAvg.classList.remove('active');
            sortedRankings = sortRankings(playerStats, currentSort);
            displayRankings(sortedRankings);
        }
    });

    btnAvg.addEventListener('click', () => {
        if (currentSort !== 'average') {
            currentSort = 'average';
            btnAvg.classList.add('active');
            btnTotal.classList.remove('active');
            sortedRankings = sortRankings(playerStats, currentSort);
            displayRankings(sortedRankings);
        }
    });
});
