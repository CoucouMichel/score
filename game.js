// Wait until the HTML is fully loaded before running the script
window.onload = function() {
    // Get the canvas element from the HTML
    const canvas = document.getElementById('gameCanvas');
    // Get the 2D drawing context for the canvas
    const ctx = canvas.getContext('2d');

    // --- Your Game Code Will Go Here ---

    // Example: Draw a simple blue rectangle
    ctx.fillStyle = 'blue'; // Set the color to blue
    ctx.fillRect(50, 50, 100, 80); // Draw rectangle at (x=50, y=50) with width=100, height=80

    console.log("Game script loaded and drew a rectangle!");
};

// --- More game functions can be added below ---
// For example: functions for player movement, game loop, collision detection etc.
