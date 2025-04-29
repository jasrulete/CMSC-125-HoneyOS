let currentDate = new Date();
let selectedDate = null;
let events = {};

function openCalendar() {
    const modal = document.getElementById('calendar-modal');
    modal.classList.remove('hidden');
    updateCalendar();
}

function closeCalendar() {
    const modal = document.getElementById('calendar-modal');
    modal.classList.add('hidden');
}

function updateCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('current-month').textContent = currentDate.toLocaleString('default', { month: 'long' });
    document.getElementById('current-year').textContent = year;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const firstDayIndex = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayIndex; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = new Date(year, month, 0 - (firstDayIndex - i - 1)).getDate();
        calendarDays.appendChild(dayElement);
    }
    
    // Add days of the current month
    for (let i = 1; i <= totalDays; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = i;
        
        // Highlight today
        if (i === new Date().getDate() && 
            month === new Date().getMonth() && 
            year === new Date().getFullYear()) {
            dayElement.classList.add('today');
        }
        
        // Highlight selected date
        if (selectedDate && 
            i === selectedDate.getDate() && 
            month === selectedDate.getMonth() && 
            year === selectedDate.getFullYear()) {
            dayElement.classList.add('selected');
        }
        
        dayElement.onclick = () => selectDate(new Date(year, month, i));
        calendarDays.appendChild(dayElement);
    }
    
    // Add empty cells for days after the last day of the month
    const remainingCells = 42 - (firstDayIndex + totalDays); // 42 = 6 rows * 7 days
    for (let i = 1; i <= remainingCells; i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day other-month';
        dayElement.textContent = i;
        calendarDays.appendChild(dayElement);
    }
}

function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    updateCalendar();
}

function toggleYearSelector() {
    const yearSelector = document.getElementById('year-selector');
    yearSelector.classList.toggle('hidden');
}

function selectYear(year) {
    currentDate.setFullYear(year);
    document.getElementById('year-selector').classList.add('hidden');
    updateCalendar();
}

function selectDate(date) {
    selectedDate = date;
    updateCalendar();
    
    // Update the selected date display
    document.getElementById('selected-date').textContent = 
        date.toLocaleDateString('default', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    
    // Update events list
    updateEventsList();
}

function showEventInput() {
    document.querySelector('.event-input-container').classList.remove('hidden');
    document.getElementById('event-input').focus();
}

function cancelEventInput() {
    document.querySelector('.event-input-container').classList.add('hidden');
    document.getElementById('event-input').value = '';
}

function addEvent() {
    if (!selectedDate) {
        alert('Please select a date first');
        return;
    }

    const input = document.getElementById('event-input');
    const eventText = input.value.trim();
    
    if (!eventText) {
        alert('Please enter event details');
        return;
    }

    const dateKey = selectedDate.toISOString().split('T')[0];
    if (!events[dateKey]) {
        events[dateKey] = [];
    }
    
    events[dateKey].push({
        id: Date.now(), // unique ID for the event
        text: eventText
    });

    // Clear input and hide container
    input.value = '';
    document.querySelector('.event-input-container').classList.add('hidden');
    
    // Update the events list
    updateEventsList();
}

function deleteEvent(dateKey, eventId) {
    events[dateKey] = events[dateKey].filter(event => event.id !== eventId);
    if (events[dateKey].length === 0) {
        delete events[dateKey];
    }
    updateEventsList();
}

function updateEventsList() {
    const eventsList = document.getElementById('events-list');
    if (!selectedDate) {
        eventsList.innerHTML = '<div class="no-events">Select a date to add events</div>';
        return;
    }

    const dateKey = selectedDate.toISOString().split('T')[0];
    const dateEvents = events[dateKey] || [];

    if (dateEvents.length === 0) {
        eventsList.innerHTML = '<div class="no-events">No events for this date</div>';
        return;
    }

    eventsList.innerHTML = dateEvents.map(event => `
        <div class="event-item">
            <span class="event-text">${event.text}</span>
            <span class="delete-event" onclick="deleteEvent('${dateKey}', ${event.id})">
                <i class="fas fa-times"></i>
            </span>
        </div>
    `).join('');
}

// Add event listener for Enter key in event input
document.addEventListener('DOMContentLoaded', function() {
    const eventInput = document.getElementById('event-input');
    eventInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addEvent();
        }
    });
});

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('calendar-modal');
    if (event.target == modal) {
        closeCalendar();
    }
} 