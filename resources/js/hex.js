window.onload = function() {
    const container = document.getElementById('hexagon-container7');
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const hexWidth = 100; // Width of hexagon
    const hexHeight = 78; // Height of hexagon
    const hexMarginX = 0; // Horizontal margin between hexagons
    const hexMarginY = 20; // Vertical margin between hexagons
    const sideLength = hexHeight / 2;
    let isDarkMode = false; // Flag to track the mode

    // Function to toggle mode
    // Function to toggle mode
    function toggleMode() {
        const body = document.body;
        const drawer = document.querySelector('.drawer');
        isDarkMode = !isDarkMode;
        body.classList.toggle('light-mode', !isDarkMode); // Add light-mode class if not in dark mode
        body.classList.toggle('dark-mode', isDarkMode); // Add dark-mode class if in dark mode
    
        // Update hexagon colors based on mode
        const hexagons = document.querySelectorAll('.hexagon7');
        hexagons.forEach(hexagon => {
            hexagon.classList.toggle('light-mode-hexagon', !isDarkMode);
            hexagon.classList.toggle('dark-mode-hexagon', isDarkMode);
        });
    
        // Update button text
        const modeToggleButton = document.getElementById('mode-toggle-button');
        modeToggleButton.textContent = isDarkMode ? '' : 'Light Mode';

    }
    

    // function shutdown() {
    //     Neutralino.app.exit();
    // }

    // Update drawer background color based on mode
    if (isDarkMode) {
        drawer.style.setProperty('background-color', '#1f1f1f');
    } else {
        drawer.style.removeProperty('background-color');
    }


    // Calculate the number of hexagons in a row and column
    const hexagonsPerRow = Math.ceil(screenWidth / (sideLength * 3 + hexMarginX)) + 1;
    const numRows = Math.ceil(screenHeight / (hexHeight + hexMarginY)) + 1;

    // Calculate the number of hexagons to fill the left side of the screen
    const numHexagonsLeft = Math.ceil(screenWidth / (hexWidth + hexMarginX));

    // Calculate the number of hexagons to fill the top of the screen
    const numHexagonsTop = Math.ceil(screenHeight / (hexHeight + hexMarginY));

    // Generate hexagons
    for (let row = 0; row < numRows + numHexagonsTop; row++) {
        for (let col = 0; col < hexagonsPerRow + numHexagonsLeft; col++) {
            const hexagon = document.createElement('div');
            hexagon.classList.add('hexagon7');
            const x = col * (sideLength * 3 + hexMarginX) - numHexagonsLeft * (hexWidth + hexMarginX) + (row % 2) * (sideLength * 1.5 + hexMarginX);
            const y = row * (hexHeight + hexMarginY) - numHexagonsTop * (hexHeight + hexMarginY);
            hexagon.style.left = `${x}px`;
            hexagon.style.top = `${y}px`;
            container.appendChild(hexagon);
        }
    }

    // Call toggleMode function initially
    // toggleMode();

    // Event listener for button click to toggle mode
    const toggleButton = document.getElementById('toggle-button');
    toggleButton.addEventListener('click', toggleMode);

    const shutdownButton = document.getElementById('shutdown-button');
    shutdownButton.addEventListener('click', shutdown);
};
