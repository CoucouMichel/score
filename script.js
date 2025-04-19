// script.js

// Set a fixed "now" for consistent testing relative to fake data dates
// Using April 19, 2025 as our reference "today"
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

// Helper function to get date string in YYYY-MM-DD format
function getDateString(date) {
    // Adjust for timezone offset to get the correct local date string
    // This prevents issues where morning UTC times might show the previous day locally
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}


// --- FAKE GAME DATA ---
// Reference "now" date remains: const now = new Date("2025-04-19T12:00:00Z");
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
let selectedCountry = 'ALL';
let selectedLeagueFilter = 'ALL'; // For league slicers
let userSelections = {}; // Stores user picks, keyed by date string "YYYY-MM-DD"
let scoreHistory = {}; // Could be used later for persisting scores


// --- DOM Element References ---
const weekViewContainer = document.getElementById('week-view');
const fixtureListDiv = document.getElementById('fixture-list');
const countryFilterSelect = document.getElementById('country-filter');
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
        // Calculate the date for the button
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);

        const button = document.createElement('button');
        let buttonText = `${dayNames[date.getDay()]}<br>${date.getDate()}`; // Default: "Mon<br>21"

        // Special labels for relative days
        if (i === 0) {
            buttonText = `<b>Today</b><br>${date.getDate()}`;
        } else if (i === -1) {
             buttonText = `Yesterday<br>${date.getDate()}`;
        } else if (i === 1) {
             buttonText = `Tomorrow<br>${date.getDate()}`;
        }
        button.innerHTML = buttonText;
        button.dataset.date = dateStr; // Store YYYY-MM-DD

        // Highlight the currently selected day
        if (getDateString(selectedDate) === dateStr) {
            button.classList.add('active');
        }

        // Add click listener to update state and UI
        button.addEventListener('click', () => {
            // Set selectedDate to the start of the clicked day
            selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            generateCalendar(); // Re-render calendar to update highlight
            updateSelectedDateDisplay();
            updateDisplayedFixtures();
            updateSelectionStatus();
        });

        weekViewContainer.appendChild(button);
    }
}

/**
 * Populates the country filter dropdown and league slicer buttons.
 */
function populateFilters() {
    const countries = new Set();
    const leagues = new Set();

    // Extract unique countries and leagues from all fixtures
    fakeFixtures.forEach(fixture => {
        countries.add(fixture.country);
        leagues.add(fixture.competition);
    });

    // --- Populate Countries Dropdown ---
    countryFilterSelect.innerHTML = '<option value="ALL">All Countries</option>'; // Reset
    [...countries].sort().forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilterSelect.appendChild(option);
    });
    // Add event listener for country selection changes
    countryFilterSelect.addEventListener('change', (e) => {
        selectedCountry = e.target.value;
        updateDisplayedFixtures(); // Re-filter fixtures
    });

    // --- Populate League Slicers ---
    leagueSlicerContainer.innerHTML = ''; // Clear previous slicers

    // Create "All Leagues" slicer button
    const allButton = document.createElement('button');
    allButton.textContent = 'All Leagues';
    allButton.classList.add('league-slicer');
    if (selectedLeagueFilter === 'ALL') {
        allButton.classList.add('active'); // Activate if 'ALL' is selected
    }
    allButton.dataset.league = 'ALL'; // Store value
    allButton.addEventListener('click', handleSlicerClick);
    leagueSlicerContainer.appendChild(allButton);

    // Create slicer buttons for each unique league
    [...leagues].sort().forEach(league => {
        const button = document.createElement('button');
        button.textContent = league;
        button.classList.add('league-slicer');
        if (selectedLeagueFilter === league) {
            button.classList.add('active'); // Activate if this league is selected
        }
        button.dataset.league = league; // Store league name
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
    selectedLeagueFilter = clickedButton.dataset.league; // Update league filter state

    // Update the visual 'active' state on slicer buttons
    document.querySelectorAll('.league-slicer').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');

    // Re-filter and display fixtures
    updateDisplayedFixtures();
}


/**
 * Filters fixtures based on current state (date, country, league) and calls displayFixtures.
 */
function updateDisplayedFixtures() {
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date(); // Get the actual current time for enabling/disabling

    // Filter the master list of fixtures
    const filteredFixtures = fakeFixtures.filter(fixture => {
        const fixtureDate = new Date(fixture.kickOffTime);
        const fixtureDateStr = getDateString(fixtureDate);

        // Check if fixture date matches selected date
        if (fixtureDateStr !== selectedDateStr) return false;
        // Check country filter
        if (selectedCountry !== 'ALL' && fixture.country !== selectedCountry) return false;
        // Check league filter (slicer)
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;

        return true; // Fixture passes all filters
    });

    // Sort the filtered fixtures by kick-off time
    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));

    // Display the filtered and sorted fixtures
    displayFixtures(filteredFixtures, realCurrentTime);
    updateFixtureListTitle(selectedDateStr); // Update the title above the list
    updateSelectionStatus(); // Update the text about user's pick for the day
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

    // Get the current selection for the *selected day* to manage button states
    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach(fixture => {
        const fixtureElement = document.createElement('div');
        fixtureElement.classList.add('fixture'); // Card style

        const kickOff = new Date(fixture.kickOffTime);
        // Determine if the user can still select this game
        const canSelect = fixture.status === 'SCHEDULED' && kickOff > currentTime;
        // Format time string nicely (e.g., "14:00")
        const timeString = kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        // Display result if finished, or status if not scheduled
        let resultHtml = '';
        if (fixture.status === 'FINISHED' && fixture.result) {
            resultHtml = ` <span style="font-weight:bold;">(${fixture.result.homeScore} - ${fixture.result.awayScore})</span>`;
        } else if (fixture.status !== 'SCHEDULED') {
             resultHtml = ` <span style="color:red; font-style:italic;">(${fixture.status})</span>`; // e.g., (POSTPONED)
        }

        // Basic fixture info
        fixtureElement.innerHTML = `
            <div class="teams">${fixture.homeTeam.name} vs ${fixture.awayTeam.name}${resultHtml}</div>
            <div class="details">
                ${fixture.competition} (${fixture.country}) - ${timeString}
                <br>
                Odds: H: ${fixture.odds.homeWin.toFixed(2)} | D: ${fixture.odds.draw.toFixed(2)} | A: ${fixture.odds.awayWin.toFixed(2)}
            </div>
        `;

        // Add selection buttons only for scheduled games
        if (fixture.status === 'SCHEDULED') {
            const buttonContainer = document.createElement('div');

            // Determine if *any* selection exists for this day
            const dayHasSelection = !!currentDaySelection;
            // Determine if *this specific* fixture is the one selected
            const isThisFixtureSelected = dayHasSelection && currentDaySelection.fixtureId === fixture.fixtureId;

            // Home Team Button
            const homeButton = document.createElement('button');
            homeButton.textContent = `Pick ${fixture.homeTeam.name}`;
            // Disable if game cannot be selected OR if another game is already selected today
            homeButton.disabled = !canSelect || (dayHasSelection && !isThisFixtureSelected);
            homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
            // Highlight if this team is the selected one for the day
            if (isThisFixtureSelected && currentDaySelection.teamId === fixture.homeTeam.id) {
                homeButton.classList.add('selected-team');
                homeButton.textContent = `Selected: ${fixture.homeTeam.name}`;
            }

            // Away Team Button
            const awayButton = document.createElement('button');
            awayButton.textContent = `Pick ${fixture.awayTeam.name}`;
             // Disable if game cannot be selected OR if another game is already selected today
            awayButton.disabled = !canSelect || (dayHasSelection && !isThisFixtureSelected);
            awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
            // Highlight if this team is the selected one for the day
            if (isThisFixtureSelected && currentDaySelection.teamId === fixture.awayTeam.id) {
                awayButton.classList.add('selected-team');
                awayButton.textContent = `Selected: ${fixture.awayTeam.name}`;
            }

            buttonContainer.appendChild(homeButton);
            buttonContainer.appendChild(awayButton);
            fixtureElement.appendChild(buttonContainer);

        } else if (fixture.status === 'FINISHED') {
             // Display score if this finished game was selected on its day
             const selectionForThisGameDay = userSelections[getDateString(kickOff)];
             if (selectionForThisGameDay && selectionForThisGameDay.fixtureId === fixture.fixtureId) {
                 const score = calculateScore(selectionForThisGameDay, fixture);
                 const scoreDiv = document.createElement('div');
                 // Ensure score is not null before trying toFixed
                 scoreDiv.innerHTML = `<em style="color: var(--primary-color-dark); margin-top: 8px; display: block;">Your score for this pick: ${score !== null ? score.toFixed(2) + ' points' : 'Score unavailable'}</em>`;
                 fixtureElement.appendChild(scoreDiv);
             }
        }

        fixtureListDiv.appendChild(fixtureElement);
    });
}

/**
 * Handles the logic when a user clicks a team selection button.
 * @param {number} fixtureId - The ID of the fixture.
 * @param {number} teamId - The ID of the selected team.
 * @param {string} teamName - The name of the selected team.
 * @param {number} teamWinOdd - The win odd for the selected team.
 * @param {number} drawOdd - The draw odd for the fixture.
 */
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
     const selectedDateStr = getDateString(selectedDate);
     const fixture = fakeFixtures.find(f => f.fixtureId === fixtureId);

     // Double-check if fixture exists (should always unless data issue)
     if (!fixture) return;

     const kickOff = new Date(fixture.kickOffTime);
     const realCurrentTime = new Date();

     // Prevent selection if match has started
     if (kickOff <= realCurrentTime) {
         alert("This match has already started, you cannot select it.");
         return;
     }

     const existingSelection = userSelections[selectedDateStr];

     // If clicking the *same* team in the *same* fixture again, deselect it.
     if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
         console.log(`Deselecting team ${teamId} for ${selectedDateStr}`);
         delete userSelections[selectedDateStr]; // Remove selection for the day
     }
     // If selecting a team when *another* fixture is already selected for the day, prevent it.
     else if (existingSelection && existingSelection.fixtureId !== fixtureId) {
         alert(`You have already selected ${existingSelection.teamName} for ${selectedDateStr}. You can only pick one team per day.`);
         return;
     }
     // Otherwise, this is a new selection or changing selection within the same fixture (implicitly handled by setting new value)
     else {
         userSelections[selectedDateStr] = {
             fixtureId: fixtureId,
             teamId: teamId,
             teamName: teamName,
             selectedWinOdd: teamWinOdd, // Odd for the selected team winning
             fixtureDrawOdd: drawOdd,   // Draw odd for the whole fixture
             selectionTime: realCurrentTime.toISOString()
         };
         console.log(`Selected team ${teamId} for ${selectedDateStr}`);
     }

    // Save the updated selections and refresh the UI
    saveUserData();
    updateDisplayedFixtures(); // Re-render fixtures to show selection/disable others
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
        // Format date nicely, e.g., "Sunday, April 20, 2025"
        selectedDateDisplay.textContent = selectedDate.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
     fixtureListTitle.textContent = `Matches for ${selectedDate.toLocaleDateString()}`; // Update lower title too
}

/**
 * Updates the paragraph indicating the user's selection for the currently viewed day.
 */
function updateSelectionStatus() {
    const selectedDateStr = getDateString(selectedDate);
    const selection = userSelections[selectedDateStr];

    if (selection) {
        const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
         if(fixture) {
             selectionStatusP.innerHTML = `Your pick: <b>${selection.teamName}</b> (vs ${fixture.homeTeam.id === selection.teamId ? fixture.awayTeam.name : fixture.homeTeam.name})`;
         } else {
             // Should not happen with fake data, but good practice
             selectionStatusP.textContent = 'Error finding selected fixture details.';
             delete userSelections[selectedDateStr]; // Clear invalid selection
             saveUserData();
         }
    } else {
        selectionStatusP.textContent = `Select a team to back for this day!`;
    }
}

/**
 * Calculates the score for a finished fixture based on the user's selection.
 * @param {object} selection - The user's selection object for that day.
 * @param {object} fixture - The fixture object (must be finished with result).
 * @returns {number | null} The calculated score, or null if score cannot be calculated.
 */
function calculateScore(selection, fixture) {
    // Ensure we have valid selection and a finished fixture with results
    if (!selection || !fixture || fixture.status !== 'FINISHED' || !fixture.result) {
        return null;
    }

    let score = 0;
    const selectedTeamIsHome = fixture.homeTeam.id === selection.teamId;

    const selectedTeamScore = selectedTeamIsHome ? fixture.result.homeScore : fixture.result.awayScore;
    const concededScore = selectedTeamIsHome ? fixture.result.awayScore : fixture.result.homeScore;

    // Result points (Win/Draw/Loss)
    if (selectedTeamScore > concededScore) { // Selected team won
        score += selection.selectedWinOdd * 5;
    } else if (selectedTeamScore === concededScore) { // Draw
        score += selection.fixtureDrawOdd * 2;
    } // Loss = 0 points from result

    // Goal points
    score += selectedTeamScore * 3; // Points for goals scored
    score -= concededScore * 1; // Points deducted for goals conceded

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
            userSelections = {}; // Reset if data is corrupted
        }
    } else {
        userSelections = {};
    }
     // Note: Score history isn't explicitly saved/loaded here,
     // scores are calculated and displayed dynamically when viewing finished games.
     // If persistent score history is needed, it would be loaded similarly.
}

/**
 * Saves the current userSelections object to localStorage.
 */
function saveUserData() {
    try {
        localStorage.setItem('footballGameSelections', JSON.stringify(userSelections));
    } catch (e) {
        console.error("Error saving selections to localStorage:", e);
        // Potentially alert the user if storage is full or unavailable
    }
}

// --- Initialization ---
// This runs when the HTML document is fully loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();             // Load any saved selections
    generateCalendar();         // Build the calendar navigation
    populateFilters();          // Build country dropdown and league slicers
    updateSelectedDateDisplay(); // Set the initial H2 text
    updateDisplayedFixtures();  // Filter and display fixtures for the initial view
    updateSelectionStatus();    // Update the initial selection status text
    // displayScoreHistory(); // Implement this if needed later
});


// --- Optional: Function to Display Score History ---
// (This is a basic example; could be improved)
/*
function displayScoreHistory() {
    scoreListUl.innerHTML = ''; // Clear previous history
    let scoresToShow = [];

    // Iterate through saved selections
    for (const dateStr in userSelections) {
        const selection = userSelections[dateStr];
        const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);

        // Only calculate for past, finished games
        if (fixture && fixture.status === 'FINISHED' && new Date(dateStr) < new Date(getDateString(now))) {
             const score = calculateScore(selection, fixture);
             if (score !== null) {
                 scoresToShow.push({
                     date: dateStr,
                     text: `${new Date(dateStr).toLocaleDateString()}: Picked ${selection.teamName} (${fixture.homeTeam.name} ${fixture.result.homeScore}-${fixture.result.awayScore} ${fixture.awayTeam.name}) - Score: ${score.toFixed(2)}`
                 });
             }
        }
    }

    // Sort scores by date, descending (most recent first)
    scoresToShow.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Limit to recent scores (e.g., last 5)
    const limitedScores = scoresToShow.slice(0, 5);

    if (limitedScores.length === 0) {
        scoreListUl.innerHTML = '<li>No scored picks yet.</li>';
    } else {
        limitedScores.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item.text;
            scoreListUl.appendChild(li);
        });
    }
}

// Call displayScoreHistory() in DOMContentLoaded if you want to show history on load
*/
