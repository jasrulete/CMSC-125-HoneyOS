document.addEventListener('DOMContentLoaded', function() {
    const drawer = document.getElementById('drawer');
    const additionalContainer = document.getElementById('additional-container');
    const content = document.getElementById('content');
    let isCursorOnLeft = false; // Variable to track cursor position
    let isCursorOnDrawer = false; // Variable to track cursor position on drawer

    // Function to toggle additional container
    function toggleAdditionalContainer() {
        additionalContainer.classList.toggle('active');
    }

    // Function to show the drawer
    function showDrawer() {
        drawer.style.left = '0px';
        content.style.marginLeft = '250px';
    }

    // Function to hide the drawer
    function hideDrawer() {
        drawer.style.left = '-250px';
        content.style.marginLeft = '0';
    }

    // Add event listener to the document to toggle the drawer
    document.addEventListener('mousemove', function(event) {
        const clickX = event.clientX; // X-coordinate of the cursor
        const screenWidth = window.innerWidth; // Width of the screen

        // Check if the cursor is on the very left side of the screen
        isCursorOnLeft = clickX <= (screenWidth / 150); // Adjust the ratio as needed

        // Show or hide the drawer based on cursor position
        if (isCursorOnLeft || isCursorOnDrawer) {
            showDrawer();
        } else {
            hideDrawer();
        }
    });

    // Add event listener to track cursor position on drawer
    drawer.addEventListener('mousemove', function(event) {
        isCursorOnDrawer = true;
    });

    // Add event listener to reset cursor position on drawer exit
    drawer.addEventListener('mouseleave', function(event) {
        isCursorOnDrawer = false;
    });

    // Function to toggle voice recognition
    function toggleVoiceRecognition() {
        // Your logic for toggling voice recognition here
        console.log('Voice recognition toggled');
    }

    // Add event listener to the voice recognition button within the drawer
    const voiceToggleButton = document.getElementById('voice-toggle');
    voiceToggleButton.addEventListener('click', toggleVoiceRecognition);
});
