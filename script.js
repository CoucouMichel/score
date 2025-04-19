// script.js - Consolidated Version

// Set a fixed "now" for consistent testing relative to fake data dates
// Using April 19, 2025 as our reference "today"
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

// Helper function to get date string in YYYY-MM-DD format (local time)
function getDateString(date) {
    // Adjust for timezone offset to get the correct local date string
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}


// --- FAKE GAME DATA (EXPANDED) ---
const fakeFixtures = [
    // --- Thursday, Apr 17, 2025 (2 days ago) ---
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

    // --- Friday, Apr 18, 2025 (Yesterday) ---
    {
        fixtureId: 304, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 5, name: "Mersey Reds" }, awayTeam: { id: 6, name: "Man Citizens" }, odds: { homeWin: 2.2, draw: 3.5, awayWin: 3.1 }, result: { homeScore: 3, awayScore: 1 }
    },
    {
        fixtureId: 305, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() - 1 * oneDay + 18.5 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 56, name: "Leipzig Bulls" }, awayTeam: { id: 57, name: "Hoffenheim Village" }, odds: { homeWin: 1.8, draw: 4.0, awayWin: 4.2 }, result: { homeScore: 2, awayScore: 2 }
    },
     {
        fixtureId: 306, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19.5 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 58, name: "Inter Serpents" }, awayTeam: { id: 59, name: "Lazio Eagles" }, odds: { homeWin: 1.6, draw: 4.2, awayWin: 5.0 }, result: { homeScore: 1, awayScore: 0 }
    },

    // --- Saturday, Apr 19, 2025 (Today) ---
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

    // --- Sunday, Apr 20, 2025 (Tomorrow) ---
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

    // --- Monday, Apr 21, 2025 (In 2 days) ---
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

    // --- Tuesday, Apr 22, 2025 (In 3 days) ---
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
     // --- Wednesday, Apr 23, 2025 (In 4 days - Might not show with default 7-day view) ---
      {
        fixtureId: 319, competition: "Scottish Premiership", country: "Scotland", kickOffTime: new Date(now.getTime() + 4 * oneDay + 18.5 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 79, name: "Hearts Jambos" }, awayTeam: { id: 80, name: "Hibernian Hibees" }, odds: { homeWin: 2.5, draw: 3.2, awayWin: 2.8 }, result: null
    },
      {
        fixtureId: 320, competition: "Eredivisie", country: "Netherlands", kickOffTime: new Date(now.getTime() + 4 * oneDay + 19 * oneHour).toISOString(), status: 'SCHEDULED',
        homeTeam: { id: 81, name: "Feyenoord Port" }, awayTeam: { id: 82, name: "AZ Alkmaar" }, odds: { homeWin: 1.8, draw: 3.9, awayWin: 4.1 }, result: null
    },
];


// --- State Variables ---
// Initialize selectedDate to the start of "today" based on the 'now' variable
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
// let selectedCountry = 'ALL'; // REMOVED Country state
let selectedLeagueFilter = 'ALL'; // For league slicers
let userSelections = {}; // Stores user picks, keyed by date string "YYYY-MM-DD"
let scoreHistory = {}; // Could be used later for persisting scores


// --- DOM Element References ---
const weekViewContainer = document.getElementById('week-view');
const fixtureListDiv = document.getElementById('fixture-list');
// const countryFilterSelect = document.getElementById('country-filter'); // REMOVED Country dropdown reference
const leagueSlicerContainer = document.getElementById('league-slicer-container');
const selectedDateDisplay = document.getElementById('selected-date-display');
const selectionStatusP = document.getElementById('selection-status');
const fixtureListTitle = document.getElementById('fixture-list-title');
const scoreListUl = document.getElementById('score-list');


// --- Core Functions ---

/**
 * Generates the weekly calendar navigation buttons.
 */
function generateCalendar() {
    weekViewContainer.innerHTML = ''; // Clear previous calendar
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Display 7 days: 3 past, today, 3 future relative to 'now'
    for (let i = -3; i <= 3; i++) {
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);

        const button = document.createElement('button');
        let buttonText = `${dayNames[date.getDay()]}<br>${date.getDate()}`;

        if (i === 0) buttonText = `<b>Today</b><br>${date.getDate()}`;
        else if (i === -1) buttonText = `Yesterday<br>${date.getDate()}`;
        else if (i === 1) buttonText = `Tomorrow<br>${date.getDate()}`;

        button.innerHTML = buttonText;
        button.dataset.date = dateStr;

        if (getDateString(selectedDate) === dateStr) {
            button.classList.add('active');
        }

        button.addEventListener('click', () => {
            selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            generateCalendar();
            updateSelectedDateDisplay();
            updateDisplayedFixtures();
            updateSelectionStatus();
        });

        weekViewContainer.appendChild(button);
    }
}

/**
 * Populates the league slicer buttons. (Country filter removed)
 */
function populateFilters() {
    const leagues = new Set();
    fakeFixtures.forEach(fixture => leagues.add(fixture.competition));

    leagueSlicerContainer.innerHTML = ''; // Clear previous slicers

    // Create "All Leagues" slicer
    const allButton = document.createElement('button');
    allButton.textContent = 'All Leagues';
    allButton.classList.add('league-slicer');
    if (selectedLeagueFilter === 'ALL') allButton.classList.add('active');
    allButton.dataset.league = 'ALL';
    allButton.addEventListener('click', handleSlicerClick);
    leagueSlicerContainer.appendChild(allButton);

    // Create slicers for each league
    [...leagues].sort().forEach(league => {
        const button = document.createElement('button');
        button.textContent = league;
        button.classList.add('league-slicer');
        if (selectedLeagueFilter === league) button.classList.add('active');
        button.dataset.league = league;
        button.addEventListener('click', handleSlicerClick);
        leagueSlicerContainer.appendChild(button);
    });
}

/**
 * Handles clicks on league slicer buttons.
 * @param {Event} event - The click event.
 */
function handleSlicerClick(event) {
    const clickedButton = event.target;
    selectedLeagueFilter = clickedButton.dataset.league; // Update state

    // Update active class
    document.querySelectorAll('.league-slicer').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');

    updateDisplayedFixtures(); // Re-filter
}

/**
 * Filters fixtures based on current state (date, league) and calls displayFixtures.
 */
function updateDisplayedFixtures() {
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date(); // Actual time for disabling buttons

    // Filter the master list
    const filteredFixtures = fakeFixtures.filter(fixture => {
        const fixtureDate = new Date(fixture.kickOffTime);
        const fixtureDateStr = getDateString(fixtureDate);

        // Check date and league
        if (fixtureDateStr !== selectedDateStr) return false;
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        // Country filter removed

        return true; // Passes checks
    });

    // Sort by time
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));

    // Log for debugging (Optional - can be removed)
    // console.log(`Showing ${filteredFixtures.length} fixtures for ${selectedDateStr} (League: ${selectedLeagueFilter})`, filteredFixtures);

    // Display
    displayFixtures(filteredFixtures, realCurrentTime);
    updateFixtureListTitle(selectedDateStr);
    updateSelectionStatus();
}

/**
 * Renders the list of fixtures onto the page.
 * @param {Array} fixtures - Array of fixture objects to display.
 * @param {Date} currentTime - The current time, used to disable buttons for past/ongoing games.
 */
function displayFixtures(fixtures, currentTime) {
    fixtureListDiv.innerHTML = ''; // Clear previous list

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p>No matches found for the selected day/filters.</p>';
        return;
    }

    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach(fixture => {
        const fixtureElement = document.createElement('div');
        fixtureElement.classList.add('fixture');

        const kickOff = new Date(fixture.kickOffTime);
        const canSelect = fixture.status === 'SCHEDULED' && kickOff > currentTime;
        const timeString = kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

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

        if (fixture.status === 'SCHEDULED') {
            const buttonContainer = document.createElement('div');
            const dayHasSelection = !!currentDaySelection;
            const isThisFixtureSelected = dayHasSelection && currentDaySelection.fixtureId === fixture.fixtureId;

            // Home Team Button
            const homeButton = document.createElement('button');
            homeButton.textContent = `Pick ${fixture.homeTeam.name}`;
            homeButton.disabled = !canSelect || (dayHasSelection && !isThisFixtureSelected);
            homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
            if (isThisFixtureSelected && currentDaySelection.teamId === fixture.homeTeam.id) {
                homeButton.classList.add('selected-team');
                homeButton.textContent = `Selected: ${fixture.homeTeam.name}`;
            }

            // Away Team Button
            const awayButton = document.createElement('button');
            awayButton.textContent = `Pick ${fixture.awayTeam.name}`;
            awayButton.disabled = !canSelect || (dayHasSelection && !isThisFixtureSelected);
            awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
            if (isThisFixtureSelected && currentDaySelection.teamId === fixture.awayTeam.id) {
                awayButton.classList.add('selected-team');
                awayButton.textContent = `Selected: ${fixture.awayTeam.name}`;
            }

            buttonContainer.appendChild(homeButton);
            buttonContainer.appendChild(awayButton);
            fixtureElement.appendChild(buttonContainer);

        } else if (fixture.status === 'FINISHED') {
             const selectionForThisGameDay = userSelections[getDateString(kickOff)];
             if (selectionForThisGameDay && selectionForThisGameDay.fixtureId === fixture.fixtureId) {
                 const score = calculateScore(selectionForThisGameDay, fixture);
                 const scoreDiv = document.createElement('div');
                 scoreDiv.innerHTML = `<em style="color: var(--primary-color-dark); margin-top: 8px; display: block;">Your score for this pick: ${score !== null ? score.toFixed(2) + ' points' : 'Score unavailable'}</em>`;
                 fixtureElement.appendChild(scoreDiv);
             }
        }
        fixtureListDiv.appendChild(fixtureElement);
    });
}

/**
 * Handles the logic when a user clicks a team selection button.
 * Allows changing picks freely before kickoff for the selected day.
 * @param {number} fixtureId - The ID of the fixture.
 * @param {number} teamId - The ID of the selected team.
 * @param {string} teamName - The name of the selected team.
 * @param {number} teamWinOdd - The win odd for the selected team.
 * @param {number} drawOdd - The draw odd for the fixture.
 */
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    const selectedDateStr = getDateString(selectedDate);
    const fixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
    if (!fixture) return;

    const kickOff = new Date(fixture.kickOffTime);
    const realCurrentTime = new Date(); // Use actual current time for checks

    if (kickOff <= realCurrentTime) {
        alert("This match has already started, you cannot select it.");
        return;
    }

    const existingSelection = userSelections[selectedDateStr];

    // If clicking the same selected team again, DESELECT it.
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        console.log(`Deselecting team ${teamId} for ${selectedDateStr}`);
        delete userSelections[selectedDateStr];
    }
    // Otherwise, OVERWRITE/SET the selection for the day.
    else {
        userSelections[selectedDateStr] = {
            fixtureId: fixtureId,
            teamId: teamId,
            teamName: teamName,
            selectedWinOdd: teamWinOdd,
            fixtureDrawOdd: drawOdd,
            selectionTime: realCurrentTime.toISOString()
        };
        console.log(`Selected team ${teamId} (Fixture ${fixtureId}) for ${selectedDateStr}`);
    }

    saveUserData();
    updateDisplayedFixtures();
    updateSelectionStatus();
}

/**
 * Updates the H2 title above the selection status based on the selected date.
 */
function updateSelectedDateDisplay() {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = getDateString(today);
    const selectedDateStr = getDateString(selectedDate);

    if (selectedDateStr === todayStr) {
        selectedDateDisplay.textContent = 'Today';
    } else {
        selectedDateDisplay.textContent = selectedDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
     fixtureListTitle.textContent = `Matches for ${selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`; // Shorter title for match list
}

/**
 * Updates the paragraph indicating the user's selection status and score
 * for the currently viewed day.
 */
function updateSelectionStatus() {
    const selectedDateStr = getDateString(selectedDate);
    const selection = userSelections[selectedDateStr];

    if (selection) {
        const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
        if (fixture) {
            const opponent = fixture.homeTeam.id === selection.teamId ? fixture.awayTeam.name : fixture.homeTeam.name;
            let statusText = `Your pick: <b>${selection.teamName}</b> (vs ${opponent})`;

            if (fixture.status === 'FINISHED' && fixture.result) {
                const score = calculateScore(selection, fixture);
                statusText += (score !== null) ? ` - Score: <b>${score.toFixed(2)} pts</b>` : ` - Score pending`;
            } else if (fixture.status !== 'SCHEDULED') {
                statusText += ` - (${fixture.status})`;
            }
            selectionStatusP.innerHTML = statusText;
        } else {
            selectionStatusP.textContent = 'Error: Selected fixture details not found.';
            delete userSelections[selectedDateStr]; // Clean up bad data
            saveUserData();
        }
    } else {
        selectionStatusP.textContent = `No pick made for this day.`;
    }
}

/**
 * Calculates the score for a finished fixture based on the user's selection.
 * @param {object} selection - The user's selection object for that day.
 * @param {object} fixture - The fixture object (must be finished with result).
 * @returns {number | null} The calculated score, or null if score cannot be calculated.
 */
function calculateScore(selection, fixture) {
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result) {
        return null;
    }

    let score = 0;
    const selectedTeamIsHome = fixture.homeTeam.id === selection.teamId;
    const selectedTeamScore = selectedTeamIsHome ? fixture.result.homeScore : fixture.result.awayScore;
    const concededScore = selectedTeamIsHome ? fixture.result.awayScore : fixture.result.homeScore;

    // Result points
    if (selectedTeamScore > concededScore) score += selection.selectedWinOdd * 5; // Win
    else if (selectedTeamScore === concededScore) score += selection.fixtureDrawOdd * 2; // Draw

    // Goal points
    score += selectedTeamScore * 3; // Scored
    score -= concededScore * 1; // Conceded

    return score;
}


/**
 * Loads user selections from localStorage.
 */
function loadUserData() {
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) {
        try {
            userSelections = JSON.parse(savedSelections);
        } catch (e) {
            console.error("Error parsing saved selections:", e);
            userSelections = {};
        }
    } else {
        userSelections = {};
    }
}

/**
 * Saves the current userSelections object to localStorage.
 */
function saveUserData() {
    try {
        localStorage.setItem('footballGameSelections', JSON.stringify(userSelections));
    } catch (e) {
        console.error("Error saving selections to localStorage:", e);
    }
}

// --- Initialization ---
// Runs when the page's HTML is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();             // Load saved data first
    generateCalendar();         // Build calendar UI
    populateFilters();          // Build league slicer UI
    updateSelectedDateDisplay(); // Set initial text based on selected date
    updateDisplayedFixtures();  // Filter and show initial fixtures
    updateSelectionStatus();    // Show initial selection status
    // displayScoreHistory(); // Optional: Implement and call if needed
});
