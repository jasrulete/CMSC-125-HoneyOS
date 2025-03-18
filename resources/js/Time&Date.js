function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('time');
    const dateElement = document.getElementById('date');

    // Format the time
    const formattedTime = now.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        // second: 'numeric'
    });

    // Format the date
    const formattedDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });

    // Update the content of time and date elements
    timeElement.textContent = formattedTime;
    dateElement.textContent = formattedDate;
}

// Call updateTime function initially
updateTime();

// Update time every second
setInterval(updateTime, 1000);