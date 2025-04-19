// script.js - FINAL CORRECTED VERSION with DOMContentLoaded Fix

// --- Firebase Initialization (ES Module Version) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Your web app's Firebase configuration (PASTE YOUR OBJECT HERE)
const firebaseConfig = {
  apiKey: "AIzaSyAi_qvjnZlDo6r0Nu14JPs1XAvu_bRQmoM", // Use YOUR actual key
  authDomain: "oddscore-5ed5e.firebaseapp.com",    // Use YOUR domain
  projectId: "oddscore-5ed5e",                    // Use YOUR ID
  storageBucket: "oddscore-5ed5e.firebasestorage.app", // Use YOUR bucket
  messagingSenderId: "582289870654",              // Use YOUR sender ID
  appId: "1:582289870654:web:bb025764a8d37f697f266f",  // Use YOUR App ID
  measurementId: "G-HCKHYJ0HZD"                  // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase initialized (module mode)!");
const auth = getAuth(app);
const db = getFirestore(app);

// --- Constants and Helpers ---
const now = new Date("2025-04-19T12:00:00Z");
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

const flagCodeMap = {
    "England": "gb-eng", "Spain": "es", "Germany": "de", "Italy": "it",
    "France": "fr", "Portugal": "pt", "Netherlands": "nl", "Belgium": "be",
    "Turkey": "tr", "Scotland": "gb", "UEFA": "eu"
};

function getFlagUrl(countryName) {
    const code = flagCodeMap[countryName];
    if (code) return `https://flagcdn.com/w20/${code}.png`;
    return "";
}

// --- Fake Fixtures Data ---
// !! IMPORTANT: PASTE YOUR EXPANDED fakeFixtures ARRAY HERE !!
// --- Fake Data (Expanded version) ---
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
    // --- Wednesday, Apr 23, 2025 (In 4 days - Might not show with 5-day view) ---
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
let userSelections = {}; // Holds picks loaded for the CURRENT user
let currentUserId = null; // Store the logged-in user's ID

// --- DOM Element References (Will be assigned in DOMContentLoaded) ---
let weekViewContainer, fixtureListDiv, leagueSlicerContainer, scoreListUl;
let authSection, loginForm, signupForm, userInfo;
let loginEmailInput, loginPasswordInput, loginButton, loginErrorP;
let showSignupButton, signupEmailInput, signupPasswordInput, signupButton, signupErrorP;
let showLoginButton, userEmailSpan, logoutButton;


// --- Auth State Listener (Updates UI based on login state) ---
onAuthStateChanged(auth, user => {
    // Ensure elements exist before manipulating
    if (loginErrorP) loginErrorP.textContent = '';
    if (signupErrorP) signupErrorP.textContent = '';

    if (user) { // User is signed in
        console.log("User logged in:", user.email, user.uid);
        currentUserId = user.uid;
        if(userEmailSpan) userEmailSpan.textContent = user.email;
        if(loginForm) loginForm.style.display = 'none';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'block';
        if(authSection) { // Optional UI cleanup
             authSection.style.border = 'none'; authSection.style.boxShadow = 'none';
             authSection.style.background = 'none'; authSection.style.padding = '0 0 1.5rem 0';
        }
        loadUserPicksFromFirestore(user.uid); // Placeholder call
    } else { // User is signed out
        console.log("User logged out");
        currentUserId = null;
        if(userEmailSpan) userEmailSpan.textContent = '';
        if(loginForm) loginForm.style.display = 'block';
        if(signupForm) signupForm.style.display = 'none';
        if(userInfo) userInfo.style.display = 'none';
         if(authSection) { // Restore section styling
             authSection.style.border = '1px solid var(--divider-color)';
             authSection.style.boxShadow = 'var(--elevation-1)';
             authSection.style.background = 'var(--card-background-color)';
             authSection.style.padding = '1.5rem';
         }
        userSelections = {}; // Clear local state
        localStorage.removeItem('footballGameSelections');
        // Refresh UI after clearing data
        setTimeout(() => {
             if(typeof generateCalendar === 'function') generateCalendar();
             if(typeof populateDailyLeagueSlicers === 'function') populateDailyLeagueSlicers();
             if(typeof updateDisplayedFixtures === 'function') updateDisplayedFixtures();
        }, 0);
    }
});

// --- Core Game Functions ---

function generateCalendar() {
    if (!weekViewContainer) return; // Ensure container exists
    weekViewContainer.innerHTML = '';
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (let i = -1; i <= 3; i++) {
        const date = new Date(today.getTime() + i * oneDay);
        const dateStr = getDateString(date);
        const dayButton = document.createElement('button');
        dayButton.classList.add('calendar-day');
        dayButton.dataset.date = dateStr;
        let line1Text = `${dayNames[date.getDay()]} ${date.getDate()}`;
        if (i === 0) line1Text = `<b>TODAY ${date.getDate()}</b>`;
        let line2Text = "No Pick"; let line3Text = "&nbsp;";
        const selection = userSelections[dateStr];
        if (selection) {
            line2Text = `<b>${selection.teamName}</b>`;
            const fixture = fakeFixtures.find(f => f.fixtureId === selection.fixtureId);
            if (fixture) {
                if (fixture.status === 'FINISHED' && fixture.result) {
                    const score = calculateScore(selection, fixture);
                    line3Text = score !== null ? `Score: <b>${score.toFixed(1)}</b>` : "Score Pend."; // Use 1 decimal
                } else if (fixture.status === 'SCHEDULED') {
                    line3Text = `Odd: ${selection.selectedWinOdd.toFixed(2)}`;
                } else { line3Text = `(${fixture.status})`; }
            } else { line3Text = "Error"; }
        }
        const line1Span = document.createElement('span'); line1Span.classList.add('cal-line', 'cal-line-1'); line1Span.innerHTML = line1Text;
        const line2Span = document.createElement('span'); line2Span.classList.add('cal-line', 'cal-line-2'); line2Span.innerHTML = line2Text;
        const line3Span = document.createElement('span'); line3Span.classList.add('cal-line', 'cal-line-3'); line3Span.innerHTML = line3Text;
        dayButton.appendChild(line1Span); dayButton.appendChild(line2Span); dayButton.appendChild(line3Span);
        if (getDateString(selectedDate) === dateStr) dayButton.classList.add('active');
        dayButton.addEventListener('click', () => {
            if (getDateString(selectedDate) !== dateStr) {
                selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                selectedLeagueFilter = 'ALL'; generateCalendar(); populateDailyLeagueSlicers(); updateDisplayedFixtures();
            }
        });
        weekViewContainer.appendChild(dayButton);
    }
}

function populateDailyLeagueSlicers() {
    if (!leagueSlicerContainer) return; // Ensure container exists
    const selectedDateStr = getDateString(selectedDate);
    const leaguesToday = new Map();
    fakeFixtures.forEach(fixture => { /* ... keep logic ... */ });
    leagueSlicerContainer.innerHTML = '';
    if (leaguesToday.size > 0) { /* ... create 'All Leagues' button ... */ }
    const sortedLeagues = [...leaguesToday.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    sortedLeagues.forEach(([league, country]) => { /* ... create league buttons with flags ... */ });
    const slicerArea = document.getElementById('daily-league-slicers');
    if (slicerArea) slicerArea.style.display = leaguesToday.size > 0 ? 'flex' : 'none';
}

function handleSlicerClick(event) {
    const clickedButton = event.target.closest('button.league-slicer');
    if (!clickedButton || clickedButton.dataset.league === selectedLeagueFilter) return;
    selectedLeagueFilter = clickedButton.dataset.league;
    document.querySelectorAll('#league-slicer-container .league-slicer').forEach(btn => btn.classList.remove('active'));
    clickedButton.classList.add('active');
    updateDisplayedFixtures();
}

function updateDisplayedFixtures() {
    if (!fixtureListDiv) return; // Ensure element exists
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    // Add console log here:
    console.log(`Filtering fixtures for Date: ${selectedDateStr}, League: ${selectedLeagueFilter}`);

    const filteredFixtures = fakeFixtures.filter(fixture => {
        const fixtureDateStr = getDateString(new Date(fixture.kickOffTime));
        if (fixtureDateStr !== selectedDateStr) return false;
        if (selectedLeagueFilter !== 'ALL' && fixture.competition !== selectedLeagueFilter) return false;
        return true;
    });

    // Add console log here:
    console.log(`Found ${filteredFixtures.length} fixtures to display:`, filteredFixtures);

    filteredFixtures.sort((a, b) => new Date(a.kickOffTime) - new Date(b.kickOffTime));
    displayFixtures(filteredFixtures, realCurrentTime);
}

/**
 * Renders the list of fixtures. Shows Pick button OR calculated points based on game status/time.
 */
function displayFixtures(fixtures, currentTime) {
    fixtureListDiv.innerHTML = ''; // Clear previous list

    // console.log(`--- displayFixtures: Attempting to display ${fixtures ? fixtures.length : 0} fixtures ---`); // DEBUG REMOVED

    if (!fixtures || fixtures.length === 0) {
        fixtureListDiv.innerHTML = '<p style="color: var(--text-secondary-color); text-align: center; grid-column: 1 / -1;">No matches found for the selected day/filters.</p>';
        return;
    }

    const currentDaySelection = userSelections[getDateString(selectedDate)];

    fixtures.forEach((fixture, index) => {
        // console.log(`Loop ${index}: Processing fixture ${fixture.fixtureId}`); // DEBUG REMOVED
        try { // Keep try...catch for safety during development if you like
            const fixtureElement = document.createElement('div');
            fixtureElement.classList.add('fixture');

            const kickOff = new Date(fixture.kickOffTime);
            const canSelect = fixture.status === 'SCHEDULED' && kickOff > currentTime;
            const timeString = kickOff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            // Top Details
            const detailsTop = document.createElement('div');
            detailsTop.classList.add('fixture-details-top');
            const flagUrl = getFlagUrl(fixture.country);
            let flagHtml = flagUrl ? `<img src="${flagUrl}" alt="${fixture.country} flag" class="inline-flag">&nbsp;` : '';
            detailsTop.innerHTML = `${flagHtml}${fixture.competition} - ${timeString}`;
            fixtureElement.appendChild(detailsTop);

            // Home Team Row
            const homeRow = document.createElement('div'); homeRow.classList.add('team-row');
            const homeName = document.createElement('span'); homeName.classList.add('team-name'); homeName.textContent = fixture.homeTeam.name; homeRow.appendChild(homeName);
            const homeScoreSpan = document.createElement('span'); homeScoreSpan.classList.add('team-score');
            if (fixture.status === 'FINISHED' && fixture.result !== null) { homeScoreSpan.textContent = fixture.result.homeScore; homeScoreSpan.classList.add('has-score'); } else { homeScoreSpan.textContent = ''; } homeRow.appendChild(homeScoreSpan);
            const homeOdd = document.createElement('span'); homeOdd.classList.add('team-odd'); homeOdd.textContent = fixture.odds.homeWin.toFixed(2); homeRow.appendChild(homeOdd);
            if (canSelect) {
                const homeButton = document.createElement('button'); homeButton.classList.add('pick-button'); homeButton.textContent = "Pick";
                homeButton.onclick = () => handleSelection(fixture.fixtureId, fixture.homeTeam.id, fixture.homeTeam.name, fixture.odds.homeWin, fixture.odds.draw);
                if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.homeTeam.id) { homeButton.classList.add('selected-team'); homeButton.textContent = "Picked"; }
                homeRow.appendChild(homeButton);
            } else if (fixture.status === 'FINISHED' && fixture.result) {
                const tempHomeSelection = { teamId: fixture.homeTeam.id, selectedWinOdd: fixture.odds.homeWin, fixtureDrawOdd: fixture.odds.draw };
                const points = calculateScore(tempHomeSelection, fixture);
                const pointsSpan = document.createElement('span'); pointsSpan.classList.add('fixture-points');
                if (points !== null) { pointsSpan.textContent = `${points.toFixed(1)} pts`; if (points > 0) pointsSpan.classList.add('positive');} else { pointsSpan.textContent = '-'; }
                homeRow.appendChild(pointsSpan);
            }
            fixtureElement.appendChild(homeRow);

            // Away Team Row
            const awayRow = document.createElement('div'); awayRow.classList.add('team-row');
            const awayName = document.createElement('span'); awayName.classList.add('team-name'); awayName.textContent = fixture.awayTeam.name; awayRow.appendChild(awayName);
            const awayScoreSpan = document.createElement('span'); awayScoreSpan.classList.add('team-score');
            if (fixture.status === 'FINISHED' && fixture.result !== null) { awayScoreSpan.textContent = fixture.result.awayScore; awayScoreSpan.classList.add('has-score'); } else { awayScoreSpan.textContent = ''; } awayRow.appendChild(awayScoreSpan);
            const awayOdd = document.createElement('span'); awayOdd.classList.add('team-odd'); awayOdd.textContent = fixture.odds.awayWin.toFixed(2); awayRow.appendChild(awayOdd);
            if (canSelect) {
                const awayButton = document.createElement('button'); awayButton.classList.add('pick-button'); awayButton.textContent = "Pick";
                awayButton.onclick = () => handleSelection(fixture.fixtureId, fixture.awayTeam.id, fixture.awayTeam.name, fixture.odds.awayWin, fixture.odds.draw);
                if (currentDaySelection && currentDaySelection.fixtureId === fixture.fixtureId && currentDaySelection.teamId === fixture.awayTeam.id) { awayButton.classList.add('selected-team'); awayButton.textContent = "Picked"; }
                awayRow.appendChild(awayButton);
            } else if (fixture.status === 'FINISHED' && fixture.result) {
                const tempAwaySelection = { teamId: fixture.awayTeam.id, selectedWinOdd: fixture.odds.awayWin, fixtureDrawOdd: fixture.odds.draw };
                const points = calculateScore(tempAwaySelection, fixture);
                const pointsSpan = document.createElement('span'); pointsSpan.classList.add('fixture-points');
                 if (points !== null) { pointsSpan.textContent = `${points.toFixed(1)} pts`; if (points > 0) pointsSpan.classList.add('positive'); } else { pointsSpan.textContent = '-'; }
                awayRow.appendChild(pointsSpan);
            }
            fixtureElement.appendChild(awayRow);

            // Bottom Details
            const detailsBottom = document.createElement('div'); detailsBottom.classList.add('fixture-details-bottom');
            let bottomText = '';
            if (fixture.status !== 'SCHEDULED' && fixture.status !== 'FINISHED') { bottomText = `<span style="font-style:italic; color:var(--error-text-color)">(${fixture.status})</span>`; }
            if (bottomText) { detailsBottom.innerHTML = bottomText; fixtureElement.appendChild(detailsBottom); }

            fixtureListDiv.appendChild(fixtureElement);
            // console.log(`Loop ${index}: Successfully appended element for fixture ${fixture.fixtureId}`); // DEBUG REMOVED

        } catch (error) {
            console.error(`Error processing fixture ${fixture.fixtureId} in displayFixtures loop (Index ${index}):`, error);
        }
    });
     // console.log(`--- displayFixtures: Finished loop ---`); // DEBUG REMOVED
}

function handleSelection(fixtureId, teamId, teamName, teamWinOdd, drawOdd) {
    if (!auth.currentUser) { alert("Please log in or sign up to make a pick!"); return; }
    const selectedDateStr = getDateString(selectedDate);
    const realCurrentTime = new Date();
    const existingSelection = userSelections[selectedDateStr];
    if (existingSelection) { /* ... check if locked ... */ }
    const clickedFixture = fakeFixtures.find(f => f.fixtureId === fixtureId);
    if (!clickedFixture) return;
    const clickedKickOff = new Date(clickedFixture.kickOffTime);
    if (clickedKickOff <= realCurrentTime) { alert("This match has already started..."); return; }
    if (existingSelection && existingSelection.fixtureId === fixtureId && existingSelection.teamId === teamId) {
        delete userSelections[selectedDateStr];
        // TODO: Delete from Firestore
    } else {
        const newSelection = { /* ... create selection object including userId ... */ };
        userSelections[selectedDateStr] = newSelection;
        // TODO: Save to Firestore
    }
    saveUserDataToLocal(); // Temp save
    generateCalendar();
    updateDisplayedFixtures();
}

function calculateScore(selection, fixture) { /* ... Keep function from response #59 (with Math.max) ... */ }

// Loads data initially from local storage
function loadUserDataFromLocal() {
    console.log("Loading selections from Local Storage (temporary)");
    const savedSelections = localStorage.getItem('footballGameSelections');
    if (savedSelections) { try { userSelections = JSON.parse(savedSelections); } catch (e) { console.error(e); userSelections = {}; } }
    else { userSelections = {}; }
    // Don't update UI here, let DOMContentLoaded or onAuthStateChanged handle it
}

// Saves data temporarily to local storage
function saveUserDataToLocal() {
    console.log("Saving selections to Local Storage (temporary)");
    try { localStorage.setItem('footballGameSelections', JSON.stringify(userSelections)); }
    catch (e) { console.error(e); }
}

// Placeholder for Firestore loading
function loadUserPicksFromFirestore(userId) {
    console.log(`TODO: Load picks for user ${userId} from Firestore and update userSelections object.`);
    userSelections = {}; // Clear local state on login trigger
    console.log("Cleared local userSelections, waiting for Firestore load (not implemented yet).");
    generateCalendar(); // Refresh UI to show 'No Pick'
    updateDisplayedFixtures();
}

// Helper for friendlier error messages
function getFriendlyAuthError(error) { /* ... Keep function from response #59 ... */ }


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded, assigning elements and adding listeners...");

    // Assign DOM Elements *after* DOM is loaded
    weekViewContainer = document.getElementById('week-view');
    fixtureListDiv = document.getElementById('fixture-list');
    leagueSlicerContainer = document.getElementById('league-slicer-container');
    scoreListUl = document.getElementById('score-list');
    authSection = document.getElementById('auth-section');
    loginForm = document.getElementById('login-form');
    signupForm = document.getElementById('signup-form');
    userInfo = document.getElementById('user-info');
    loginEmailInput = document.getElementById('login-email');
    loginPasswordInput = document.getElementById('login-password');
    loginButton = document.getElementById('login-button');
    loginErrorP = document.getElementById('login-error');
    showSignupButton = document.getElementById('show-signup');
    signupEmailInput = document.getElementById('signup-email');
    signupPasswordInput = document.getElementById('signup-password');
    signupButton = document.getElementById('signup-button');
    signupErrorP = document.getElementById('signup-error');
    showLoginButton = document.getElementById('show-login');
    userEmailSpan = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');

    // Attach Auth Event Listeners *after* elements are assigned
    if (showSignupButton) { showSignupButton.addEventListener('click', () => { /* ... show/hide logic ... */ }); }
    if (showLoginButton) { showLoginButton.addEventListener('click', () => { /* ... show/hide logic ... */ }); }
    if (loginButton) { loginButton.addEventListener('click', () => { /* ... signIn call ... */ }); }
    if (signupButton) { signupButton.addEventListener('click', () => { /* ... createUser call ... */ }); }
    if (logoutButton) { logoutButton.addEventListener('click', () => { /* ... signOut call ... */ }); }

    // Initial Load and Display
    loadUserDataFromLocal(); // Load any existing local data
    generateCalendar(); // Initial calendar draw
    populateDailyLeagueSlicers(); // Initial slicer draw
    updateDisplayedFixtures(); // Initial fixture draw

    console.log("Initial setup complete.");
});
