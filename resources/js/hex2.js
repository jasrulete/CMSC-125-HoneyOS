
window.onload = function() {
    const container = document.getElementById('hexagon-containerSplash');
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const hexWidth = 100; // Width of hexagon
    const hexHeight = 78; // Height of hexagon
    const hexMarginX = 0; // Horizontal margin between hexagons
    const hexMarginY = 20; // Vertical margin between hexagons
    const sideLength = hexHeight / 2;

    // Calculate the number of hexagons in a row and column
    const hexagonsPerRow = Math.ceil(screenWidth / (sideLength * 3 + hexMarginX)) + 1;
    const numRows = Math.ceil(screenHeight / (hexHeight + hexMarginY)) + 1;

    // Calculate the number of hexagons to fill the left side of the screen
    const numHexagonsLeft = Math.ceil(screenWidth / (hexWidth + hexMarginX));

    // Calculate the number of hexagons to fill the top of the screen
    const numHexagonsTop = Math.ceil(screenHeight / (hexHeight + hexMarginY));

    // Calculate the center of the screen
    const centerX = screenWidth / 2;
    const centerY = screenHeight / 2;

    // Generate hexagons
    for (let row = 0; row < numRows + numHexagonsTop; row++) {
        for (let col = 0; col < hexagonsPerRow + numHexagonsLeft; col++) {
            const hexagon = document.createElement('div');
            hexagon.classList.add('hexagonSplash');

            // Calculate position relative to the center of the screen
            const x = centerX + col * (sideLength * 3 + hexMarginX) - numHexagonsLeft * (hexWidth + hexMarginX) + (row % 2) * (sideLength * 1.5 + hexMarginX);
            const y = centerY + row * (hexHeight + hexMarginY) - numHexagonsTop * (hexHeight + hexMarginY);

            hexagon.style.left = `${x}px`;
            hexagon.style.top = `${y}px`;

            // Calculate delay based on distance to the center
            const distanceToCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            const maxDistance = Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(screenHeight, 2));
            const delayPercentage = distanceToCenter / maxDistance;
            hexagon.style.animationDelay = `${delayPercentage * 5}s`;

            container.appendChild(hexagon);
        }
    }

    // After a delay, add radial fade-out animation to hexagons
    setTimeout(function() {
        const hexagons = document.querySelectorAll('.hexagonSplash');
        hexagons.forEach(hexagon => {
            hexagon.style.animation = 'radialFadeOut 10s forwards'; // Apply radial fade-out animation
        });
    }, 10000); // Adjust the delay as needed
}
