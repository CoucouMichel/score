// script.js - Final Dark Mode Only Version (Corrected Pick Logic)

// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z"); // Keep fixed date for demo consistency
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;
function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// --- Fake Data (Expanded version needed here) ---
const fakeFixtures = [ /* ... PASTE EXPANDED FAKE FIXTURES ARRAY HERE ... */
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
     // --- Wednesday, Apr 23, 2025 (In 4 days - Will not show with 5-day view) ---
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
let selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let selectedLeagueFilter = 'ALL';
let userSelections = {};
let scoreHistory = {};

// --- DOM Element References ---
const weekViewContainer = document.getElementById('week-view');
const fixtureListDiv = document.getElementById('fixture-list');
const leagueSlicerContainer = document.getElementById('league-slicer-container');
const scoreListUl = document.getElementById('score-list');


// --- Core Functions ---

/**
 * Generates calendar navigation (Yesterday, Today, +3 Days) with pick status.
 */
function generateCalendar() {
    weekViewContainer.innerHTML = '';
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = -1; i <= 3; i++) { // Loop for 5 days
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);
        const dayContainer = document.createElement('div');
        dayContainer.classList.add('calendar-day-container');
        const button = document.createElement('button');
        let buttonText = `${dayNames[date.getDay()]}<br>${date.getDate()}`;
        if (i === 0) buttonText = `<b>Today</b><br>${date.getDate()}`;
        else if (i === -1) buttonText = `Yesterday<br>${date.getDate()}`;
        button.innerHTML = buttonText;
        button.dataset.date = dateStr;
        if (getDateString(selectedDate) === dateStr) button.classList.add('active');

        button.addEventListener('click', () => {
            // Check if already selected to prevent unnecessary re-renders
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL'; // Reset league filter when changing day
                generateCalendar(); // Re-render calendar (updates highlights & statuses)
                populateDailyLeagueSlicers(); // Re-populate slicers for the NEW day
                updateDisplayedFixtures();    // Update fixture list for the new day (with 'ALL' leagues)
            }
        });

        const statusDiv = document.createElement('div');
        statusDiv.classList.add('day-pick-status');
        const selection = userSelections[dateStr];
        let statusText = "No Pick"; // Default

        if (selection) {
            const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
            if (fixture) {
                statusText = `<b>${selection.teamName}</b>`; // No "Picked:" prefix
                if (fixture.status === 'FINISHED' && fixture.result) {
                    const score = calculateScore(selection, fixture);
                    statusText += (score !== null) ? `<br>Score: <b>${score.toFixed(2)}</b>` : `<br>Score pending`;
                } else if (fixture.status !== 'SCHEDULED') {
                    statusText += `<br>(${fixture.status})`;
                }
            } else { statusText = "Pick Error"; }
        }
        statusDiv.innerHTML = statusText;

        dayContainer.appendChild(button);
        dayContainer.appendChild(statusDiv);
        weekViewContainer.appendChild(dayContainer);
    }
}

/**
 * Populates league slicers based ONLY on leagues available for the selected day.
 */
function populateDailyLeagueSlicers() {
    const selectedDateStr = getDateString(selectedDate);
    const leaguesToday = new Set();

    fakeFixtures.forEach(fixture => {
        if (getDateString(new Date(fixture.kickOffTime)) === selectedDateStr) {
            leaguesToday.add(fixture.competition);
        }
    });

    leagueSlicerContainer.innerHTML = ''; // Clear

    // Create "All Leagues" button only if there are leagues today
    if (leaguesToday.size > 0) {
        const allButton = document.createElement('button');
        allButton.textContent = 'All Leagues';
        allButton.classList.add('league-slicer');
        if (selectedLeagueFilter === 'ALL') allButton.classList.add('active');
        allButton.dataset.league = 'ALL';
        allButton.addEventListener('click', handleSlicerClick);
        leagueSlicerContainer.appendChild(allButton);
    }

    [...leaguesToday].sort().forEach(league => {
        const button = document.createElement('button');
        button.textContent = league;
        button.classList.add('league-slicer');
        if (selectedLeagueFilter === league) button.classList.add('active');
        button.dataset.league = league;
        button.addEventListener('click', handleSlicerClick);
        leagueSlicerContainer.appendChild(button);
    });

    // Hide the whole slicer area if no leagues are available for the day
    const slicerArea = document.getElementById('daily-league-slicers');
    if (slicerArea) { // Ensure element exists
        slicerArea.style.display = leaguesToday.size > 0 ? 'flex' : 'none';
    }
}

/**
 * Handles clicks on league slicer buttons.
 */
function handleSlicerClick(event) {
    const clickedButton = event.target;
    // Prevent re-filtering if the already active slicer is clicked
    if (clickedButton.dataset.league === selectedLeagueFilter) {
        return;
    }
    selectedLeagueFilter = clickedButton.dataset.league; // Update state

    // Update active class
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');

    updateDisplayedFixtures(); // Re-filter fixture list only
}

/**
 * Filters fixtures based on current state (date, league) and calls displayFixtures.
 */
function updateDisplayedFixtures() {
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();

    const filteredFixtures = fakeFixtures.filter(fixture => {
        const fixtureDateStr = getDateString(new Date(fixture.kickOffTime));
        if (fixtureDateStr !== selectedDateStr) return false;
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        return true;
    });

    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime);
    // updateFixtureListTitle(); // REMOVED Call
}

/**
 * Renders the list of fixtures using the condensed layout. (Includes pick logic fix)
 */
function displayFixtures(fixtures, currentTime) {
    fixtureListDiv.innerHTML = '';

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center;">No matches found for the selected day/filters.</p>';
        return;
    }

    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach(fixture => {
        const fixtureElement = document.createElement('div');
        fixtureElement.classList.add('fixture');

        const kickOff = new Date(fixture.kickOffTime);
        const canSelect = fixture.status === 'SCHEDULED' && kickOff > currentTime;
        const timeString = kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        // Optional Top Details
        const detailsTop = document.createElement('div');
        detailsTop.classList.add('fixture-details-top');
        detailsTop.textContent = `${fixture.competition} (${fixture.country}) - ${timeString}`;
        fixtureElement.appendChild(detailsTop);

        // Home Team Row
        const homeRow = document.createElement('div');
        homeRow.classList.add('team-row');
        const homeName = document.createElement('span');
        homeName.classList.add('team-name');
        homeName.textContent = fixture.homeTeam.name;
        const homeOdd = document.createElement('span');
        homeOdd.classList.add('team-odd');
        homeOdd.textContent = fixture.odds.homeWin.toFixed(2);
        const homeButton = document.createElement('button');
        homeButton.classList.add('pick-button');
        homeButton.textContent = "Pick";
        homeButton.disabled = !canSelect; // Corrected logic
        homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
        if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.homeTeam.id) {
            homeButton.classList.add('selected-team');
            homeButton.textContent = "Picked";
        }
        homeRow.appendChild(homeName); homeRow.appendChild(homeOdd); homeRow.appendChild(homeButton);
        fixtureElement.appendChild(homeRow);

        // Away Team Row
        const awayRow = document.createElement('div');
        awayRow.classList.add('team-row');
        const awayName = document.createElement('span');
        awayName.classList.add('team-name');
        awayName.textContent = fixture.awayTeam.name;
        const awayOdd = document.createElement('span');
        awayOdd.classList.add('team-odd');
        awayOdd.textContent = fixture.odds.awayWin.toFixed(2);
        const awayButton = document.createElement('button');
        awayButton.classList.add('pick-button');
        awayButton.textContent = "Pick";
        awayButton.disabled = !canSelect; // Corrected logic
        awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
        if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.awayTeam.id) {
            awayButton.classList.add('selected-team');
            awayButton.textContent = "Picked";
        }
        awayRow.appendChild(awayName); awayRow.appendChild(awayOdd); awayRow.appendChild(awayButton);
        fixtureElement.appendChild(awayRow);

         // Bottom Details (Draw Odd / Score / Status)
        const detailsBottom = document.createElement('div');
        detailsBottom.classList.add('fixture-details-bottom');
        let bottomText = `Draw: ${fixture.odds.draw.toFixed(2)}`;
        if (fixture.status === 'FINISHED') {
           bottomText = `Final Score: ${fixture.result.homeScore} - ${fixture.result.awayScore}`;
            const selectionForThisGameDay = userSelections[getDateString(kickOff)];
            if (selectionForThisGameDay && selectionForThisGameDay.fixtureId === fixture.fixtureId) {
                const score = calculateScore(selectionForThisGameDay, fixture);
                bottomText += (score !== null) ? ` | <em>Day's score: ${score.toFixed(2)} pts</em>` : '';
            }
        } else if (fixture.status !== 'SCHEDULED') {
            bottomText = `<span style="color:var(--error-text-color); font-style:italic;">(${fixture.status})</span>`;
        }
        detailsBottom.innerHTML = bottomText;
        fixtureElement.appendChild(detailsBottom);

        fixtureListDiv.appendChild(fixtureElement);
    });
}

/**
 * Handles the logic when a user clicks a team selection button.
 */
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    const selectedDateStr = getDateString(selectedDate);
    const fixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
    if (!fixture) return;
    const kickOff = new Date(fixture.kickOffTime);
    const realCurrentTime = new Date();
    if (kickOff <= realCurrentTime) {
        alert("This match has already started, you cannot select it.");
        return;
    }
    const existingSelection = userSelections[selectedDateStr];
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        delete userSelections[selectedDateStr]; // Deselect
    } else {
        userSelections[selectedDateStr] = { // Select or Overwrite
            fixtureId: fixtureId, teamId: teamId, teamName: teamName,
            selectedWinOdd: teamWinOdd, fixtureDrawOdd: drawOdd,
            selectionTime: realCurrentTime.toISOString()
        };
    }
    saveUserData();
    generateCalendar(); // Update calendar status immediately
    updateDisplayedFixtures(); // Update list button states
}


/**
 * Calculates the score for a finished fixture based on the user's selection.
 */
function calculateScore(selection, fixture) {
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result) return null;
    let score = 0;
    const selectedTeamIsHome = fixture.homeTeam.id === selection.teamId;
    const selectedTeamScore = selectedTeamIsHome ? fixture.result.homeScore : fixture.result.awayScore;
    const concededScore = selectedTeamIsHome ? fixture.result.awayScore : fixture.result.homeScore;
    if (selectedTeamScore > concededScore) score += selection.selectedWinOdd * 5;
    else if (selectedTeamScore === concededScore) score += selection.fixtureDrawOdd * 2;
    score += selectedTeamScore * 3; score -= concededScore * 1;
    return score;
}

/**
 * Loads user selections from localStorage.
 */
function loadUserData() {
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) {
        try { userSelections = JSON.parse(savedSelections); }
        catch (e) { console.error("Error parsing saved selections:", e); userSelections = {}; }
    } else { userSelections = {}; }
}

/**
 * Saves the current userSelections object to localStorage.
 */
function saveUserData() {
    try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
    catch (e) { console.error("Error saving selections to localStorage:", e); }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    generateCalendar();
    populateDailyLeagueSlicers();
    // updateFixtureListTitle(); // REMOVED call
    updateDisplayedFixtures();
    // displayScoreHistory(); // Optional
});
