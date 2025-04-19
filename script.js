// script.js

const now = new Date("2025-04-19T12:00:00Z"); // Set a fixed "now" for consistency in testing
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

// Helper function to get date string (YYYY-MM-DD)
function getDateString(date) {
    return date.toISOString().split('T')[0];
}

// --- FAKE GAME DATA ---
const fakeFixtures = [
    // --- Today (Sat, Apr 19, 2025) ---
    {
        fixtureId: 101, competition: "Premier League", country: "England",
        kickOffTime: new Date(now.getTime() + 2 * oneHour).toISOString(), // 14:00 UTC
        status: 'SCHEDULED', homeTeam: { id: 1, name: "Man Reds" }, awayTeam: { id: 2, name: "Lon Blues" },
        odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.8 }, result: null
    },
    {
        fixtureId: 102, competition: "La Liga", country: "Spain",
        kickOffTime: new Date(now.getTime() + 4 * oneHour).toISOString(), // 16:00 UTC
        status: 'SCHEDULED', homeTeam: { id: 3, name: "Madrid Whites" }, awayTeam: { id: 4, name: "Catalan Giants" },
        odds: { homeWin: 1.9, draw: 3.8, awayWin: 4.0 }, result: null
    },
    {
        fixtureId: 105, competition: "Bundesliga", country: "Germany",
        kickOffTime: new Date(now.getTime() + 5 * oneHour).toISOString(), // 17:00 UTC
        status: 'SCHEDULED', homeTeam: { id: 11, name: "Dortmund Bees" }, awayTeam: { id: 7, name: "Bavarian Stars" },
        odds: { homeWin: 2.9, draw: 3.6, awayWin: 2.4 }, result: null
    },
    // --- Tomorrow (Sun, Apr 20, 2025) ---
     {
        fixtureId: 201, competition: "Serie A", country: "Italy",
        kickOffTime: new Date(now.getTime() + 1 * oneDay + 3 * oneHour).toISOString(), // Sun 15:00 UTC
        status: 'SCHEDULED', homeTeam: { id: 9, name: "Milan Devils" }, awayTeam: { id: 10, name: "Turin Zebras" },
        odds: { homeWin: 3.1, draw: 3.3, awayWin: 2.3 }, result: null
    },
    {
        fixtureId: 202, competition: "Ligue 1", country: "France",
        kickOffTime: new Date(now.getTime() + 1 * oneDay + 5 * oneHour).toISOString(), // Sun 17:00 UTC
        status: 'SCHEDULED', homeTeam: { id: 8, name: "Paris Royals" }, awayTeam: { id: 12, name: "Lyon Lions" },
        odds: { homeWin: 1.5, draw: 4.5, awayWin: 6.0 }, result: null
    },
    // --- Yesterday (Fri, Apr 18, 2025) ---
     {
        fixtureId: 10, competition: "Premier League", country: "England",
        kickOffTime: new Date(now.getTime() - 1 * oneDay + 18 * oneHour).toISOString(), // Fri 18:00 UTC
        status: 'FINISHED', homeTeam: { id: 5, name: "Mersey Reds" }, awayTeam: { id: 6, name: "Man Citizens" },
        odds: { homeWin: 2.2, draw: 3.5, awayWin: 3.1 }, result: { homeScore: 3, awayScore: 1 }
    },
    {
        fixtureId: 11, competition: "Champions League", country: "UEFA",
        kickOffTime: new Date(now.getTime() - 1 * oneDay + 20 * oneHour).toISOString(), // Fri 20:00 UTC
        status: 'FINISHED', homeTeam: { id: 7, name: "Bavarian Stars" }, awayTeam: { id: 3, name: "Madrid Whites" },
        odds: { homeWin: 2.0, draw: 3.6, awayWin: 3.5 }, result: { homeScore: 2, awayScore: 2 }
    },
     // --- Two Days Ago (Thu, Apr 17, 2025) ---
      {
        fixtureId: 5, competition: "Europa League", country: "UEFA",
        kickOffTime: new Date(now.getTime() - 2 * oneDay + 19 * oneHour).toISOString(), // Thu 19:00 UTC
        status: 'FINISHED', homeTeam: { id: 2, name: "Lon Blues" }, awayTeam: { id: 9, name: "Milan Devils" },
        odds: { homeWin: 1.8, draw: 3.5, awayWin: 4.5 }, result: { homeScore: 1, awayScore: 0 }
    },
];

// --- State Variables ---
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start with today (ignore time)
let selectedCountry = 'ALL';
let selectedLeague = 'ALL';
let userSelections = {}; // Store user selections, keyed by date string e.g., "2025-04-19"
let scoreHistory = {}; // Store scores, keyed by date string


// --- DOM Elements ---
const weekViewContainer = document.getElementById('week-view');
const fixtureListDiv = document.getElementById('fixture-list');
const countryFilterSelect = document.getElementById('country-filter');
const leagueFilterSelect = document.getElementById('league-filter');
const selectedDateDisplay = document.getElementById('selected-date-display');
const selectionStatusP = document.getElementById('selection-status');
const fixtureListTitle = document.getElementById('fixture-list-title');
const scoreListUl = document.getElementById('score-list');


// --- Core Functions ---

// Function to generate calendar navigation
function generateCalendar() {
    weekViewContainer.innerHTML = ''; // Clear previous calendar
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today without time
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Show 7 days: 3 past, today, 3 future (adjust as needed)
    for (let i = -3; i <= 3; i++) {
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);

        const button = document.createElement('button');
        let buttonText = `${dayNames[date.getDay()]}<br>${date.getDate()}`;
        if (i === 0) {
            buttonText = `<b>Today</b><br>${date.getDate()}`;
        } else if (i === -1) {
             buttonText = `Yesterday<br>${date.getDate()}`;
        } else if (i === 1) {
             buttonText = `Tomorrow<br>${date.getDate()}`;
        }
        button.innerHTML = buttonText;
        button.dataset.date = dateStr; // Store YYYY-MM-DD in data attribute

        if (getDateString(selectedDate) === dateStr) {
            button.classList.add('active'); // Highlight selected day
        }

        button.addEventListener('click', () => {
            selectedDate = date; // Update selected date state
            generateCalendar(); // Re-render calendar to show selection
            updateSelectedDateDisplay(); // Update H2 title
            updateDisplayedFixtures(); // Update the fixture list
            updateSelectionStatus(); // Update the selection status text
        });

        weekViewContainer.appendChild(button);
    }
}

// Function to populate filter dropdowns
function populateFilters() {
    const countries = new Set();
    const leagues = new Set();

    fakeFixtures.forEach(fixture => {
        countries.add(fixture.country);
        leagues.add(fixture.competition);
    });

    // Populate Countries
    countryFilterSelect.innerHTML = '<option value="ALL">All Countries</option>'; // Reset
    [...countries].sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilterSelect.appendChild(option);
    });

    // Populate Leagues
    leagueFilterSelect.innerHTML = '<option value="ALL">All Leagues</option>'; // Reset
    [...leagues].sort().forEach(league => {
        const option = document.createElement('option');
        option.value = league;
        option.textContent = league;
        leagueFilterSelect.appendChild(option);
    });

    // Add event listeners
    countryFilterSelect.addEventListener('change', (e) => {
        selectedCountry = e.target.value;
        updateDisplayedFixtures();
    });
    leagueFilterSelect.addEventListener('change', (e) => {
        selectedLeague = e.target.value;
        updateDisplayedFixtures();
    });
}

// Function to filter and display fixtures based on state
function updateDisplayedFixtures() {
    const selectedDateStr = getDateString(selectedDate);
    const currentTime = new Date(); // Use real current time for disabling buttons

    // Filter logic
    const filteredFixtures = fakeFixtures.filter(fixture => {
        const fixtureDate = new Date(fixture.kickOffTime);
        const fixtureDateStr = getDateString(fixtureDate);

        // Date check
        if (fixtureDateStr !== selectedDateStr) {
            return false;
        }
        // Country check
        if (selectedCountry !== 'ALL' && fixture.country !== selectedCountry) {
            return false;
        }
        // League check
        if (selectedLeague !== 'ALL' && fixture.competition !== selectedLeague) {
            return false;
        }
        return true; // Passed all checks
    });

    // Sort by kick-off time
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));

    // Pass to the display function
    displayFixtures(filteredFixtures, currentTime);
    updateFixtureListTitle(selectedDateStr); // Update title above list
    updateSelectionStatus(); // Check selection status for this day
}


// Modified displayFixtures to accept currentTime for disabling buttons
function displayFixtures(fixtures, currentTime) {
    fixtureListDiv.innerHTML = ''; // Clear existing list

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p>No matches found for the selected day/filters.</p>';
        return;
    }

    // Get the current selection for the selected day
    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach(fixture => {
        const fixtureElement = document.createElement('div');
        fixtureElement.classList.add('fixture'); // Add class for styling

        const kickOff = new Date(fixture.kickOffTime);
        const canSelect = fixture.status === 'SCHEDULED' && kickOff > currentTime;
        const timeString = kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let resultHtml = '';
        if (fixture.status === 'FINISHED' && fixture.result) {
            resultHtml = ` <span style="font-weight:bold;">(${fixture.result.homeScore} - ${fixture.result.awayScore})</span>`;
        } else if (fixture.status !== 'SCHEDULED') {
             resultHtml = ` <span style="color:red; font-style:italic;">(${fixture.status})</span>`;
        }

        fixtureElement.innerHTML = `
            <div class="teams">${fixture.homeTeam.name} vs ${fixture.awayTeam.name}${resultHtml}</div>
            <div class="details">
                ${fixture.competition} (${fixture.country}) - ${timeString}
                <br>
                Odds: H: ${fixture.odds.homeWin.toFixed(2)} | D: ${fixture.odds.draw.toFixed(2)} | A: ${fixture.odds.awayWin.toFixed(2)}
            </div>
        `;

        // Add selection buttons only if game hasn't started
        if (fixture.status === 'SCHEDULED') {
            const buttonContainer = document.createElement('div');

            // Home Team Button
            const homeButton = document.createElement('button');
            homeButton.textContent = `Pick ${fixture.homeTeam.name}`;
            homeButton.disabled = !canSelect || (currentDaySelection && currentDaySelection.fixtureId !== fixture.fixtureId); // Disable if cannot select OR if another game is already selected today
            homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
            if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.homeTeam.id) {
                homeButton.classList.add('selected-team'); // Highlight if selected
                 homeButton.textContent = `Selected: ${fixture.homeTeam.name}`;
            }


            // Away Team Button
            const awayButton = document.createElement('button');
            awayButton.textContent = `Pick ${fixture.awayTeam.name}`;
            awayButton.disabled = !canSelect || (currentDaySelection && currentDaySelection.fixtureId !== fixture.fixtureId); // Disable if cannot select OR if another game is already selected today
            awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
             if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.awayTeam.id) {
                awayButton.classList.add('selected-team'); // Highlight if selected
                awayButton.textContent = `Selected: ${fixture.awayTeam.name}`;
            }


            buttonContainer.appendChild(homeButton);
            buttonContainer.appendChild(awayButton);
            fixtureElement.appendChild(buttonContainer);

        } else if (fixture.status === 'FINISHED') {
             // Optionally show score calculation if this was the selected game for its day
             const selectionForThisGameDay = userSelections[getDateString(kickOff)];
             if (selectionForThisGameDay && selectionForThisGameDay.fixtureId === fixture.fixtureId) {
                 const score = calculateScore(selectionForThisGameDay, fixture);
                 const scoreDiv = document.createElement('div');
                 scoreDiv.innerHTML = `<em>Your score for this pick: ${score !== null ? score.toFixed(2) + ' points' : 'Pending...'}</em>`;
                 fixtureElement.appendChild(scoreDiv);
             }
        }


        fixtureListDiv.appendChild(fixtureElement);
    });
}

// Modified handleSelection to store against selected date
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
     const selectedDateStr = getDateString(selectedDate);
     const fixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
     const kickOff = new Date(fixture.kickOffTime);
     const currentTime = new Date();

     if (kickOff <= currentTime) {
         alert("This match has already started, you cannot select it.");
         return;
     }

     // Check if already selected for the day
     if (userSelections[selectedDateStr]) {
         // Allow changing selection only if it's the same game clicked again (effectively deselecting)
         if (userSelections[selectedDateStr].fixtureId === fixtureId && userSelections[selectedDateStr].teamId === teamId) {
             console.log(`Deselecting team ${teamId} for ${selectedDateStr}`);
             delete userSelections[selectedDateStr];
         } else {
            alert(`You have already selected a team for ${selectedDateStr}.`);
            return;
         }
     } else {
        // Store new selection
        userSelections[selectedDateStr] = {
            fixtureId: fixtureId,
            teamId: teamId,
            teamName: teamName,
            selectedWinOdd: teamWinOdd, // Store the odd for the specific team winning
            fixtureDrawOdd: drawOdd,   // Store the draw odd for the fixture
            selectionTime: currentTime.toISOString()
        };
        console.log(`Selected team ${teamId} for ${selectedDateStr}`);
     }


    // Update UI immediately
    saveUserData(); // Save to localStorage
    updateDisplayedFixtures(); // Re-render fixtures to show selection/disable others
    updateSelectionStatus(); // Update the status message
}

// Function to update the H2 title based on selected date
function updateSelectedDateDisplay() {
    const todayStr = getDateString(new Date());
    const selectedDateStr = getDateString(selectedDate);

    if (selectedDateStr === todayStr) {
        selectedDateDisplay.textContent = 'Today';
    } else {
        selectedDateDisplay.textContent = selectedDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
     fixtureListTitle.textContent = `Available Matches for ${selectedDate.toLocaleDateString()}`;
}


// Function to update the selection status message
function updateSelectionStatus() {
    const selectedDateStr = getDateString(selectedDate);
    const selection = userSelections[selectedDateStr];

    if (selection) {
        const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
         if(fixture) {
             selectionStatusP.innerHTML = `Your pick: <b>${selection.teamName}</b> (in ${fixture.homeTeam.name} vs ${fixture.awayTeam.name})`;
         } else {
             selectionStatusP.textContent = 'Error finding selected fixture details.';
         }
    } else {
        selectionStatusP.textContent = `You haven't made a selection for this day yet.`;
    }
}

// Placeholder for scoring logic
function calculateScore(selection, fixture) {
    if (!fixture || fixture.status !== 'FINISHED' || !fixture.result) {
        return null; // Match not finished
    }

    let score = 0;
    const selectedTeam = fixture.homeTeam.id === selection.teamId ? fixture.homeTeam : fixture.awayTeam;
    const opponentTeam = fixture.homeTeam.id === selection.teamId ? fixture.awayTeam : fixture.homeTeam;

    const selectedTeamScore = fixture.homeTeam.id === selection.teamId ? fixture.result.homeScore : fixture.result.awayScore;
    const concededScore = fixture.homeTeam.id === selection.teamId ? fixture.result.awayScore : fixture.result.homeScore;

    // Result points
    if (selectedTeamScore > concededScore) { // Selected team won
        score += selection.selectedWinOdd * 5;
    } else if (selectedTeamScore === concededScore) { // Draw
        score += selection.fixtureDrawOdd * 2;
    } else { // Selected team lost
        // 0 points for loss
    }

    // Goal points
    score += selectedTeamScore * 3;
    score -= concededScore * 1;

    return score;
}


// Function to load/save user data (using localStorage for now)
function loadUserData() {
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) {
        userSelections = JSON.parse(savedSelections);
    } else {
        userSelections = {};
    }
     // We might load scoreHistory similarly if we persist it
     // For now, scores are calculated dynamically when viewing finished games
}

function saveUserData() {
    localStorage.setItem('footballGameSelections', JSON.stringify(userSelections));
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserData(); // Load selections first
    generateCalendar(); // Generate calendar view
    populateFilters(); // Populate filter options
    updateSelectedDateDisplay(); // Set initial date display
    updateDisplayedFixtures(); // Display fixtures for the initial selected day
    // TODO: Implement score history display update if needed
});
