// script.js - Using flagcdn.com Images (Map inside script)

// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z"); // Keep fixed date for demo consistency
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// --- Flag Mapping & URL Generation (Using flagcdn.com) ---
const flagCodeMap = { // Maps Country Name to lowercase 2-letter ISO code
    "England": "gb-eng",
    "Spain": "es",
    "Germany": "de",
    "Italy": "it",
    "France": "fr",
    "Portugal": "pt",
    "Netherlands": "nl",
    "Belgium": "be",
    "Turkey": "tr",
    "Scotland": "gb", // Using UK flag code for Scotland with flagcdn
    "UEFA": "eu" // flagcdn supports 'eu'
    // Add other countries if needed based on your data
};

/**
 * Gets the flag image URL from flagcdn.com based on country name.
 * @param {string} countryName - The name of the country (e.g., "England").
 * @returns {string} The image URL or an empty string if no code found.
 */
function getFlagUrl(countryName) {
    const code = flagCodeMap[countryName];
    if (code) {
        // Use w20 for 20px width PNGs
        return `https://flagcdn.com/w20/${code}.png`;
    }
    return ""; // Return empty string if no code found
}


// --- Fake Data (Expanded version) ---
const fakeFixtures = [ /* ... PASTE YOUR EXPANDED FAKE FIXTURES ARRAY HERE ... */
    // Make sure this array is pasted here, otherwise the page will be empty!
    // Example structure:
    { fixtureId: 101, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() + 2 * oneHour).toISOString(), status: 'SCHEDULED', homeTeam: { id: 1, name: "Man Reds" }, awayTeam: { id: 2, name: "Lon Blues" }, odds: { homeWin: 2.5, draw: 3.4, awayWin: 2.8 }, result: null },
    { fixtureId: 305, competition: "Bundesliga", country: "Germany", kickOffTime: new Date(now.getTime() - 1 * oneDay + 18.5 * oneHour).toISOString(), status: 'FINISHED', homeTeam: { id: 56, name: "Leipzig Bulls" }, awayTeam: { id: 57, name: "Hoffenheim Village" }, odds: { homeWin: 1.8, draw: 4.0, awayWin: 4.2 }, result: { homeScore: 2, awayScore: 2 } },
    // ... (Include all ~30 fixtures)
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
        fixtureId: 304, competition: "Premier League", country: "England", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 5, name: "Mersey Reds" }, awayTeam: { id: 6, name: "Man Citizens" }, odds: { homeWin: 2.2, draw: 3.5, awayWin: 3.1 }, result: { homeScore: 3, awayScore: 1 }
    },
     {
        fixtureId: 306, competition: "Serie A", country: "Italy", kickOffTime: new Date(now.getTime() - 1 * oneDay + 19.5 * oneHour).toISOString(), status: 'FINISHED',
        homeTeam: { id: 58, name: "Inter Serpents" }, awayTeam: { id: 59, name: "Lazio Eagles" }, odds: { homeWin: 1.6, draw: 4.2, awayWin: 5.0 }, result: { homeScore: 1, awayScore: 0 }
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
 * Generates calendar navigation (Yesterday, Today, +3 Days), displaying info across three lines.
 */
function generateCalendar() {
    weekViewContainer.innerHTML = ''; // Clear previous calendar
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']; // Using uppercase abbreviations

    // Loop for 5 days: Yesterday (i=-1) to Day+3 (i=3)
    for (let i = -1; i <= 3; i++) {
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);

        // Create the main clickable element for the day
        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day'); // Use this class for styling
        dayButton.dataset.date = dateStr;

        // --- Determine content for each line (Now 3 lines) ---

        // Line 1: Combined Day Name + Date Number
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`; // e.g., "FRI 18"
        if (i === 0) {
            line1Text = `<b>TODAY ${date.getDate()}</b>`; // Bold Today + Date
        }
        // "Yesterday" mention removed

        // Line 2: Pick Status
        let line2Text = "No Pick";
        const selection = userSelections[dateStr];
        if (selection) {
            line2Text = `<b>${selection.teamName}</b>`; // Show selected team
        }

        // Line 3: Odd / Score / Status
        let line3Text = "&nbsp;"; // Default Bottom line (empty)
        if (selection) { // Only show line 3 info if there's a pick
            const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
            if (fixture) {
                if (fixture.status === 'FINISHED' && fixture.result) {
                    const score = calculateScore(selection, fixture);
                    line3Text = score !== null ? `Score: <b>${score.toFixed(2)}</b>` : "Score Pend.";
                } else if (fixture.status === 'SCHEDULED') {
                    line3Text = `Odd: ${selection.selectedWinOdd.toFixed(2)}`;
                } else {
                    line3Text = `(${fixture.status})`;
                }
            } else {
                line3Text = "Error"; // Should not happen if selection exists
            }
        }

        // --- Create span elements for each line ---
        const line1Span = document.createElement('span');
        line1Span.classList.add('cal-line', 'cal-line-1');
        line1Span.innerHTML = line1Text; // Combined Day/Date

        const line2Span = document.createElement('span');
        line2Span.classList.add('cal-line', 'cal-line-2'); // Was line 3
        line2Span.innerHTML = line2Text; // Pick Status

        const line3Span = document.createElement('span');
        line3Span.classList.add('cal-line', 'cal-line-3'); // Was line 4
        line3Span.innerHTML = line3Text; // Odd/Score/Status

        // Append lines to the button
        dayButton.appendChild(line1Span);
        dayButton.appendChild(line2Span);
        dayButton.appendChild(line3Span);

        // Set active state
        if (getDateString(selectedDate) === dateStr) {
            dayButton.classList.add('active');
        }

        // Click listener
        dayButton.addEventListener('click', () => {
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL';
                generateCalendar();
                populateDailyLeagueSlicers();
                updateDisplayedFixtures();
            }
        });

        weekViewContainer.appendChild(dayButton);
    }
}

/**
 * Populates league slicers based ONLY on leagues available for the selected day. (Uses flagcdn)
 */
function populateDailyLeagueSlicers() {
    const selectedDateStr = getDateString(selectedDate);
    const leaguesToday = new Map(); // Map: leagueName -> countryName

    fakeFixtures.forEach(fixture => {
        if (getDateString(new Date(fixture.kickOffTime)) === selectedDateStr) {
            if (!leaguesToday.has(fixture.competition)) {
                leaguesToday.set(fixture.competition, fixture.country);
            }
        }
    });

    leagueSlicerContainer.innerHTML = ''; // Clear

    if (leaguesToday.size > 0) {
         const allButton = document.createElement('button');
         allButton.textContent = 'All Leagues';
         allButton.classList.add('league-slicer');
         if (selectedLeagueFilter === 'ALL') allButton.classList.add('active');
         allButton.dataset.league = 'ALL';
         allButton.addEventListener('click', handleSlicerClick);
         leagueSlicerContainer.appendChild(allButton);
    }

    const sortedLeagues = [...leaguesToday.entries()].sort((a, b) => a[0].localeCompare(b[0]));

    sortedLeagues.forEach(([league, country]) => {
        const button = document.createElement('button');
        const flagUrl = getFlagUrl(country); // Use flagcdn URL function
        let flagHtml = '';
        if (flagUrl) {
            // Create img tag if URL exists
            flagHtml = `<img src="${flagUrl}" alt="${country} flag" class="inline-flag">&nbsp;`;
        }
        // Use innerHTML to add the image (or nothing) and the league name
        button.innerHTML = `${flagHtml}${league}`;

        button.classList.add('league-slicer');
        if (selectedLeagueFilter === league) button.classList.add('active');
        button.dataset.league = league;
        button.addEventListener('click', handleSlicerClick);
        leagueSlicerContainer.appendChild(button);
    });

    const slicerArea = document.getElementById('daily-league-slicers');
     if (slicerArea) {
         slicerArea.style.display = leaguesToday.size > 0 ? 'flex' : 'none';
     }
}

/**
 * Handles clicks on league slicer buttons.
 */
function handleSlicerClick(event) {
    const clickedButton = event.target.closest('button.league-slicer');
    if (!clickedButton || clickedButton.dataset.league === selectedLeagueFilter) return;
    selectedLeagueFilter = clickedButton.dataset.league;
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => {
        btn.classList.remove('active');
    });
    clickedButton.classList.add('active');
    updateDisplayedFixtures();
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
}

/**
 * Renders the list of fixtures. Shows Pick button OR calculated points based on game status/time.
 */
function displayFixtures(fixtures, currentTime) {
    fixtureListDiv.innerHTML = ''; // Clear previous list

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">No matches found for the selected day/filters.</p>';
        return;
    }

    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach(fixture => {
        const fixtureElement = document.createElement('div');
        fixtureElement.classList.add('fixture');

        const kickOff = new Date(fixture.kickOffTime);
        const canSelect = fixture.status === 'SCHEDULED' && kickOff > currentTime;
        const timeString = kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        // --- Build Internal Structure ---

        // Top Details
        const detailsTop = document.createElement('div');
        detailsTop.classList.add('fixture-details-top');
        const flagUrl = getFlagUrl(fixture.country);
        let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${fixture.country} flag" class="inline-flag">&nbsp;` : '';
        detailsTop.innerHTML = `${flagHtml}${fixture.competition} - ${timeString}`;
        fixtureElement.appendChild(detailsTop);

        // --- Home Team Row ---
        const homeRow = document.createElement('div'); homeRow.classList.add('team-row');
        const homeName = document.createElement('span'); homeName.classList.add('team-name'); homeName.textContent = fixture.homeTeam.name; homeRow.appendChild(homeName);
        const homeScoreSpan = document.createElement('span'); homeScoreSpan.classList.add('team-score');
        if (fixture.status === 'FINISHED' && fixture.result !== null) { homeScoreSpan.textContent = fixture.result.homeScore; homeScoreSpan.classList.add('has-score'); } else { homeScoreSpan.textContent = ''; } homeRow.appendChild(homeScoreSpan);
        const homeOdd = document.createElement('span'); homeOdd.classList.add('team-odd'); homeOdd.textContent = fixture.odds.homeWin.toFixed(2); homeRow.appendChild(homeOdd);
        // *** Conditionally add Button OR Points Span ***
        if (canSelect) {
            // Add PICK button if selectable
            const homeButton = document.createElement('button');
            homeButton.classList.add('pick-button'); homeButton.textContent = "Pick";
            homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
            if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.homeTeam.id) { homeButton.classList.add('selected-team'); homeButton.textContent = "Picked"; }
            homeRow.appendChild(homeButton);
        } else if (fixture.status === 'FINISHED' && fixture.result) {
            // Add POINTS span if finished and not selectable
            const tempHomeSelection = { teamId: fixture.homeTeam.id, selectedWinOdd: fixture.odds.homeWin, fixtureDrawOdd: fixture.odds.draw };
            const points = calculateScore(tempHomeSelection, fixture); // Calculate potential points
            const pointsSpan = document.createElement('span');
            pointsSpan.classList.add('fixture-points');
            if (points !== null) {
                pointsSpan.textContent = `${points >= 0 ? '+' : ''}${points.toFixed(1)} pts`; // Format points with sign
                pointsSpan.classList.add(points >= 0 ? 'positive' : 'negative'); // Add class for color styling
            } else {
                pointsSpan.textContent = '-'; // Fallback if score calculation fails
            }
            homeRow.appendChild(pointsSpan);
        } // Else (Started but not Finished): Append nothing in this slot
        fixtureElement.appendChild(homeRow);

        // --- Away Team Row ---
        const awayRow = document.createElement('div'); awayRow.classList.add('team-row');
        const awayName = document.createElement('span'); awayName.classList.add('team-name'); awayName.textContent = fixture.awayTeam.name; awayRow.appendChild(awayName);
        const awayScoreSpan = document.createElement('span'); awayScoreSpan.classList.add('team-score');
        if (fixture.status === 'FINISHED' && fixture.result !== null) { awayScoreSpan.textContent = fixture.result.awayScore; awayScoreSpan.classList.add('has-score'); } else { awayScoreSpan.textContent = ''; } awayRow.appendChild(awayScoreSpan);
        const awayOdd = document.createElement('span'); awayOdd.classList.add('team-odd'); awayOdd.textContent = fixture.odds.awayWin.toFixed(2); awayRow.appendChild(awayOdd);
        // *** Conditionally add Button OR Points Span ***
        if (canSelect) {
             // Add PICK button if selectable
            const awayButton = document.createElement('button');
            awayButton.classList.add('pick-button'); awayButton.textContent = "Pick";
            awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
            if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.awayTeam.id) { awayButton.classList.add('selected-team'); awayButton.textContent = "Picked"; }
            awayRow.appendChild(awayButton);
        } else if (fixture.status === 'FINISHED' && fixture.result) {
             // Add POINTS span if finished and not selectable
            const tempAwaySelection = { teamId: fixture.awayTeam.id, selectedWinOdd: fixture.odds.awayWin, fixtureDrawOdd: fixture.odds.draw };
            const points = calculateScore(tempAwaySelection, fixture); // Calculate potential points
            const pointsSpan = document.createElement('span');
            pointsSpan.classList.add('fixture-points');
             if (points !== null) {
                pointsSpan.textContent = `${points >= 0 ? '+' : ''}${points.toFixed(1)} pts`; // Format points with sign
                pointsSpan.classList.add(points >= 0 ? 'positive' : 'negative'); // Add class for color styling
            } else {
                pointsSpan.textContent = '-'; // Fallback
            }
            awayRow.appendChild(pointsSpan);
        } // Else (Started but not Finished): Append nothing
        fixtureElement.appendChild(awayRow);

        // --- Bottom Details (Status only, if needed) ---
        const detailsBottom = document.createElement('div');
        detailsBottom.classList.add('fixture-details-bottom');
        let bottomText = ''; // Start empty
        if (fixture.status !== 'SCHEDULED' && fixture.status !== 'FINISHED') {
            bottomText = `<span style="font-style:italic; color:var(--error-text-color)">(${fixture.status})</span>`;
        }
        if (bottomText) { detailsBottom.innerHTML = bottomText; fixtureElement.appendChild(detailsBottom); }

        fixtureListDiv.appendChild(fixtureElement);
    });
}

/**
 * Handles the logic when a user clicks a team selection button.
 */
function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    const selectedDateStr = getDateString(selectedDate);
    // Use the REAL current time for all checks related to locking/starting
    const realCurrentTime = new Date();

    // --- Check if the pick for the selectedDate is already locked ---
    const existingSelection = userSelections[selectedDateStr];
    if (existingSelection) {
        // Find the fixture data for the currently selected pick
        const existingFixture = fakeFixtures.find(f => f.fixtureId === existingSelection.fixtureId);

        // Check if that selected fixture exists and its kickoff time has passed
        if (existingFixture && new Date(existingFixture.kickOffTime) <= realCurrentTime) {
            // If the selected game has started, prevent ANY changes for this day
            alert(`Your pick (${existingSelection.teamName}) for ${selectedDateStr} is locked because the match has started.`);
            return; // Exit the function, no changes allowed
        }
    }

    // --- If the day is not locked, proceed to check the CLICKED game ---
    const clickedFixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
    if (!clickedFixture) return; // Safety check

    const clickedKickOff = new Date(clickedFixture.kickOffTime);

    // Prevent selecting the *clicked* game if IT has already started
    // (This prevents selecting a game that's already live, even if the day wasn't locked yet)
    if (clickedKickOff <= realCurrentTime) {
        alert("This match has already started, you cannot select it.");
        return;
    }

    // --- If checks pass, handle the Select / Deselect / Overwrite logic ---
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        // Clicking the exact same pick again: Deselect
        console.log(`Deselecting team ${teamId} for ${selectedDateStr}`);
        delete userSelections[selectedDateStr];
    } else {
        // Selecting a new team/fixture (or first pick): Set/Overwrite
        console.log(`Selected/Changed to team ${teamId} (Fixture ${fixtureId}) for ${selectedDateStr}`);
        userSelections[selectedDateStr] = {
            fixtureId: fixtureId, teamId: teamId, teamName: teamName,
            selectedWinOdd: teamWinOdd, fixtureDrawOdd: drawOdd,
            selectionTime: realCurrentTime.toISOString() // Log the time of the actual selection
        };
    }

    // Update data and UI
    saveUserData();
    generateCalendar(); // Update calendar status immediately
    updateDisplayedFixtures(); // Update list button states reflecting the new pick/deselection
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
    updateDisplayedFixtures();
});
