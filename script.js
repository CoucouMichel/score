// script.js

// Get the current date/time to make kick-off times relative
const now = new Date();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

// --- FAKE GAME DATA ---
const fakeFixtures = [
    {
        fixtureId: 101,
        competition: "Premier League",
        // Kick-off in 2 hours from now
        kickOffTime: new Date(now.getTime() + 2 * oneHour).toISOString(),
        status: 'SCHEDULED', // Game hasn't started
        homeTeam: { id: 1, name: "Manchester Reds" },
        awayTeam: { id: 2, name: "London Blues" },
        odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.8 },
        result: null // No result yet
    },
    {
        fixtureId: 102,
        competition: "La Liga",
         // Kick-off in 4 hours from now
        kickOffTime: new Date(now.getTime() + 4 * oneHour).toISOString(),
        status: 'SCHEDULED',
        homeTeam: { id: 3, name: "Madrid Whites" },
        awayTeam: { id: 4, name: "Catalan Giants" },
        odds: { homeWin: 1.9, draw: 3.8, awayWin: 4.0 },
        result: null
    },
    {
        fixtureId: 103,
        competition: "Premier League",
        // Kick-off was 2 days ago
        kickOffTime: new Date(now.getTime() - 2 * oneDay).toISOString(),
        status: 'FINISHED', // Game is finished
        homeTeam: { id: 5, name: "Merseyside Reds" },
        awayTeam: { id: 6, name: "Manchester Citizens" },
        odds: { homeWin: 2.2, draw: 3.5, awayWin: 3.1 },
        result: { homeScore: 3, awayScore: 1 } // Example result
    },
    {
        fixtureId: 104,
        competition: "Champions League",
         // Kick-off was yesterday
        kickOffTime: new Date(now.getTime() - 1 * oneDay).toISOString(),
        status: 'FINISHED',
        homeTeam: { id: 7, name: "Bavarian Stars" },
        awayTeam: { id: 8, name: "Paris Royals" },
        odds: { homeWin: 2.0, draw: 3.6, awayWin: 3.5 },
        result: { homeScore: 2, awayScore: 2 } // Example draw result
    },
     {
        fixtureId: 105,
        competition: "Serie A",
        // Kick-off in 30 minutes
        kickOffTime: new Date(now.getTime() + 0.5 * oneHour).toISOString(),
        status: 'SCHEDULED',
        homeTeam: { id: 9, name: "Milan Devils" },
        awayTeam: { id: 10, name: "Turin Zebras" },
        odds: { homeWin: 3.1, draw: 3.3, awayWin: 2.3 },
        result: null
    }
];

// --- GAME LOGIC WILL GO HERE ---

// Function to display fixtures (We will build this next)
function displayFixtures(fixtures) {
    const fixtureListDiv = document.getElementById('fixture-list');
    fixtureListDiv.innerHTML = ''; // Clear loading message or previous fixtures

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p>No matches available today.</p>';
        return;
    }

    // TODO: Loop through fixtures and create HTML elements
    // TODO: Add buttons for team selection
    // TODO: Disable buttons for games that have already started
}


// Function to handle team selection (We will build this)
function handleSelection(fixtureId, teamId, teamName, outcomeOdd) {
    // TODO: Check if selection is allowed (game hasn't started)
    // TODO: Store the selection (using localStorage)
    // TODO: Update the UI to show the current selection
}

// Function to calculate score (We will build this)
function calculateScore(selection, fixtureResult) {
    // TODO: Implement the scoring logic based on user rules
    // Win = Odd * 5
    // Draw = Odd * 2 (Need Draw Odd from fixture)
    // Goal Scored = +3
    // Goal Conceded = -1
}

// Function to load and display current selection and scores (We will build this)
function loadUserData() {
     // TODO: Get today's date string for storage key
     // TODO: Load selection from localStorage
     // TODO: Load score history from localStorage
     // TODO: Find results for past selections using fakeFixtures
     // TODO: Calculate and display scores
}


// --- INITIALIZATION ---
// When the page loads, display the fixtures and load user data
document.addEventListener('DOMContentLoaded', () => {
    const dateSpan = document.getElementById('current-date');
    dateSpan.textContent = new Date().toLocaleDateString(); // Show today's date

    // Filter to show only "today's" games for selection
    // For testing, we might show all scheduled games regardless of date for now
    const availableFixtures = fakeFixtures.filter(f => f.status === 'SCHEDULED');

    displayFixtures(availableFixtures);
    loadUserData(); // Load selection and scores
});
