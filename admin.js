// admin.js - Fetches from API-Football and saves to Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// --- Configuration ---
// Paste the SAME firebaseConfig object you use in script.js
const firebaseConfig = {
    apiKey: "AIzaSyAi_qvjnZlDo6r0Nu14JPs1XAvu_bRQmoM", // Use YOUR actual key
    authDomain: "oddscore-5ed5e.firebaseapp.com",    // Use YOUR domain
    projectId: "oddscore-5ed5e",                    // Use YOUR ID
    storageBucket: "oddscore-5ed5e.firebasestorage.app", // Use YOUR bucket
    messagingSenderId: "582289870654",              // Use YOUR sender ID
    appId: "1:582289870654:web:bb025764a8d37f697f266f",  // Use YOUR App ID
    measurementId: "G-HCKHYJ0HZD"                  // Optional
};
const apiFootballKey = "059a4068b815413430d82f026d549d2f"; // <<< YOUR API-FOOTBALL KEY

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
console.log("Firebase initialized for Admin page!");

// --- DOM Elements ---
const fetchButton = document.getElementById('fetch-button');
const fetchSingleButton = document.getElementById('fetch-single-button');
const singleDateInput = document.getElementById('single-date-input');
const statusDiv = document.getElementById('status');

// Set default date for single fetch input
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
const dd = String(today.getDate()).padStart(2, '0');
singleDateInput.value = `${yyyy}-${mm}-${dd}`;


// --- Helper: getDateString ---
function getDateString(date) {
    const adjustedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return adjustedDate.toISOString().split('T')[0];
}

// --- API Fetch Function (Slightly modified for date range) ---
async function fetchApiFootballRange(fromDateStr, toDateStr) {
    console.log(`Workspaceing from API-Football for ${fromDateStr} to ${toDateStr}...`);
const currentSeason = 2024; // Or adjust if needed for the API
const url = `https://v3.football.api-sports.io/fixtures?from=<span class="math-inline">\{fromDateStr\}&to\=</span>{toDateStr}&season=${currentSeason}`;
    // Add &season=YYYY if needed
    try {
        const response = await fetch(url, { method: 'GET', headers: { 'x-apisports-key': apiFootballKey }});
        if (!response.ok) { /* ... Error handling ... */ throw new Error(`API Request Failed: ${response.status}`); }
        const apiResult = await response.json();
        if (!apiResult || !Array.isArray(apiResult.response) || apiResult.results === 0) {
             console.log(`No fixtures found for ${fromDateStr} to ${toDateStr}.`); return [];
        }
        // Use the SAME mapping function (you might want to put this in a shared file later)
        const mappedFixtures = mapApiFootballToFixtures(apiResult.response);
        return mappedFixtures;
    } catch (error) {
        console.error("Error fetching API-Football data:", error);
        statusDiv.textContent = `Error fetching: ${error.message}`;
        statusDiv.className = 'error';
        return null; // Indicate failure
    }
}

// --- Mapping Function (Copy from script.js or shared file) ---
const DESIRED_LEAGUE_IDS = [ 39, 140, 135, 78, 61, 2, 3 ]; // EPL, LaLiga, SerieA, Bund, L1, UCL, UEL
function mapApiFootballToFixtures(apiFixtures) {
    // *** PASTE THE mapApiFootballToFixtures function code from script.js here ***
    // Make sure it includes the DESIRED_LEAGUE_IDS filter and odds placeholders/logic
     if (!Array.isArray(apiFixtures)) return [];
     return apiFixtures.map(item => { /* ... mapping logic ... */ }).filter(f => f !== null);
}

// --- Firestore Saving Function ---
async function saveFixturesToFirestore(fixturesData) {
    if (!fixturesData || fixturesData.length === 0) {
        statusDiv.textContent = "No valid fixtures found to save.";
        statusDiv.className = '';
        return;
    }
    statusDiv.textContent = "Processing fixtures...";
    statusDiv.className = '';

    // Group fixtures by date
    const fixturesByDate = {};
    fixturesData.forEach(fixture => {
        try {
            const dateStr = getDateString(new Date(fixture.kickOffTime));
            if (!fixturesByDate[dateStr]) {
                fixturesByDate[dateStr] = [];
            }
            fixturesByDate[dateStr].push(fixture);
        } catch (e) {
            console.error("Error processing kickoff time for fixture:", fixture, e);
        }
    });

    console.log("Fixtures grouped by date:", fixturesByDate);
    statusDiv.textContent = `Saving fixtures for ${Object.keys(fixturesByDate).length} dates...`;

    // Use WriteBatch for potentially many updates
    const batch = writeBatch(db);
    let operations = 0;

    for (const dateStr in fixturesByDate) {
        const docRef = doc(db, "fixturesByDate", dateStr); // Document ID = YYYY-MM-DD
        // Store the array of fixtures for that date
        // Using setDoc will OVERWRITE existing data for that date
        batch.set(docRef, { fixtures: fixturesByDate[dateStr] });
        operations++;
        // Firestore batch limit is 500 operations
        if (operations >= 490) { // Commit batch early if near limit
             console.log("Committing partial batch...");
             await batch.commit();
             batch = writeBatch(db); // Start new batch
             operations = 0;
             statusDiv.textContent = `Saving... (batch ${operations}...)`;
        }
    }

    try {
        await batch.commit(); // Commit any remaining operations
        console.log("Firestore successfully updated!");
        statusDiv.textContent = `Successfully saved fixtures for ${Object.keys(fixturesByDate).length} dates.`;
        statusDiv.className = 'success';
    } catch (error) {
        console.error("Error writing batch to Firestore: ", error);
        statusDiv.textContent = `Error saving to Firestore: ${error.message}`;
        statusDiv.className = 'error';
    }
}


// --- Event Listeners ---
fetchButton.addEventListener('click', async () => {
    statusDiv.textContent = "Fetching next 14 days...";
    statusDiv.className = '';
    fetchButton.disabled = true;
    fetchSingleButton.disabled = true;

    const today = new Date();
    const fromDateStr = getDateString(today);
    const toDate = new Date(today);
    toDate.setDate(today.getDate() + 14);
    const toDateStr = getDateString(toDate);

    const fixtures = await fetchApiFootballRange(fromDateStr, toDateStr);
    if (fixtures) { // Check if fetch succeeded (returned array, not null)
        await saveFixturesToFirestore(fixtures);
    }

    fetchButton.disabled = false;
    fetchSingleButton.disabled = false;
});

fetchSingleButton.addEventListener('click', async () => {
    const dateToFetch = singleDateInput.value;
    if (!dateToFetch) {
        statusDiv.textContent = "Please select a date.";
        statusDiv.className = 'error';
        return;
    }
    statusDiv.textContent = `Workspaceing single date: ${dateToFetch}...`;
    statusDiv.className = '';
    fetchButton.disabled = true;
    fetchSingleButton.disabled = true;

    // Fetch only one day (from=date, to=date)
    const fixtures = await fetchApiFootballRange(dateToFetch, dateToFetch);
     if (fixtures) { // Check if fetch succeeded
        await saveFixturesToFirestore(fixtures); // Save just this day's fixtures
    }

    fetchButton.disabled = false;
    fetchSingleButton.disabled = false;
});
