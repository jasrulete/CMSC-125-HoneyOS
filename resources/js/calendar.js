class Calendar {
  constructor() {
    this.currentDate = new Date();
    this.events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    this.initializeElements();
    this.setupEventListeners();
    this.renderCalendar();
    this.updateEventsList();
  }

  initializeElements() {
    this.calendarContainer = document.getElementById('calendar-container');
    this.calendarDays = document.getElementById('calendar-days');
    this.currentMonthYear = document.getElementById('current-month-year');
    this.prevMonthBtn = document.getElementById('prev-month');
    this.nextMonthBtn = document.getElementById('next-month');
    this.newEventBtn = document.getElementById('new-event');
    this.eventModal = document.getElementById('event-modal');
    this.eventForm = document.getElementById('event-form');
    this.cancelEventBtn = document.getElementById('cancel-event');
    this.eventsList = document.getElementById('events-list');
    this.calendarMicButton = document.getElementById('calendar-micButton');
    this.calendarCloseBtn = document.getElementById('calendar-close');
  }

  setupEventListeners() {
    this.prevMonthBtn.addEventListener('click', () => this.navigateMonth(-1));
    this.nextMonthBtn.addEventListener('click', () => this.navigateMonth(1));
    this.newEventBtn.addEventListener('click', () => this.showEventModal());
    this.cancelEventBtn.addEventListener('click', () => this.hideEventModal());
    this.eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
    this.calendarCloseBtn.addEventListener('click', () => this.closeCalendar());
    this.calendarMicButton.addEventListener('click', () => this.toggleVoiceRecognition());
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    this.currentMonthYear.textContent = new Date(year, month).toLocaleDateString('default', {
      month: 'long',
      year: 'numeric'
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    this.calendarDays.innerHTML = '';

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'calendar-day empty';
      this.calendarDays.appendChild(emptyCell);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.textContent = day;

      const date = new Date(year, month, day);
      if (this.isToday(date)) {
        cell.classList.add('today');
      }

      if (this.hasEvents(date)) {
        cell.classList.add('has-event');
      }

      cell.addEventListener('click', () => this.showDayEvents(date));
      this.calendarDays.appendChild(cell);
    }
  }

  navigateMonth(direction) {
    this.currentDate.setMonth(this.currentDate.getMonth() + direction);
    this.renderCalendar();
    this.updateEventsList();
  }

  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  hasEvents(date) {
    return this.events.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  }

  showEventModal() {
    this.eventModal.classList.remove('hidden');
  }

  hideEventModal() {
    this.eventModal.classList.add('hidden');
    this.eventForm.reset();
  }

  handleEventSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('event-title').value;
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;

    const event = {
      id: Date.now(),
      title,
      date,
      description
    };

    this.events.push(event);
    this.saveEvents();
    this.renderCalendar();
    this.updateEventsList();
    this.hideEventModal();
  }

  showDayEvents(date) {
    const dayEvents = this.events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });

    this.eventsList.innerHTML = '';
    if (dayEvents.length === 0) {
      this.eventsList.innerHTML = '<p>No events for this day</p>';
      return;
    }

    dayEvents.forEach(event => {
      const eventElement = document.createElement('div');
      eventElement.className = 'event-item';
      eventElement.innerHTML = `
        <h4>${event.title}</h4>
        <p>${new Date(event.date).toLocaleString()}</p>
        ${event.description ? `<p>${event.description}</p>` : ''}
        <button onclick="calendar.deleteEvent(${event.id})">Delete</button>
      `;
      this.eventsList.appendChild(eventElement);
    });
  }

  updateEventsList() {
    const today = new Date();
    this.showDayEvents(today);
  }

  deleteEvent(eventId) {
    this.events = this.events.filter(event => event.id !== eventId);
    this.saveEvents();
    this.renderCalendar();
    this.updateEventsList();
  }

  saveEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(this.events));
  }

  closeCalendar() {
    this.calendarContainer.classList.add('hidden');
  }

  toggleVoiceRecognition() {
    // Voice recognition functionality will be implemented here
    console.log('Voice recognition toggled');
  }
}

// Initialize calendar when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.calendar = new Calendar();
}); 