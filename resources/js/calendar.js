function openCalendar() {
    const modal = document.getElementById('calendar-modal');
    modal.classList.remove('hidden');
}

function closeCalendar() {
    const modal = document.getElementById('calendar-modal');
    modal.classList.add('hidden');
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('calendar-modal');
    if (event.target == modal) {
        closeCalendar();
    }
} 