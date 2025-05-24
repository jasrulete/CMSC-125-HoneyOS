// Custom Bee-Themed Alert System
class BeeAlert {
    constructor() {
        this.currentAlert = null;
        this.createOverlay();
    }

    createOverlay() {
        // Create overlay if it doesn't exist
        if (!document.getElementById('bee-alert-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'bee-alert-overlay';
            overlay.className = 'bee-alert-overlay';
            document.body.appendChild(overlay);
        }
    }

    show(message, title = 'Buzz! 🐝', type = 'info', showCancel = false) {
        return new Promise((resolve) => {
            this.createOverlay();
            const overlay = document.getElementById('bee-alert-overlay');
            
            // Create alert box
            const alertBox = document.createElement('div');
            alertBox.className = `bee-alert-box ${type}`;
            
            // Create title
            const titleElement = document.createElement('div');
            titleElement.className = 'bee-alert-title';
            titleElement.textContent = title;
            
            // Create message
            const messageElement = document.createElement('div');
            messageElement.className = 'bee-alert-message';
            messageElement.textContent = message;
            
            // Create buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'bee-alert-buttons';
            
            // Create OK button
            const okButton = document.createElement('button');
            okButton.className = 'bee-button bee-button-ok';
            okButton.textContent = 'Sweet! 🍯';
            okButton.onclick = () => {
                this.hide();
                resolve(true);
            };
            
            buttonsContainer.appendChild(okButton);
            
            // Create Cancel button if needed
            if (showCancel) {
                const cancelButton = document.createElement('button');
                cancelButton.className = 'bee-button bee-button-cancel';
                cancelButton.textContent = 'Buzz Off! 🐝';
                cancelButton.onclick = () => {
                    this.hide();
                    resolve(false);
                };
                buttonsContainer.appendChild(cancelButton);
            }
            
            // Assemble the alert box
            alertBox.appendChild(titleElement);
            alertBox.appendChild(messageElement);
            alertBox.appendChild(buttonsContainer);
            
            // Clear previous content and add new alert
            overlay.innerHTML = '';
            overlay.appendChild(alertBox);
            
            // Show the overlay
            overlay.classList.add('show');
            this.currentAlert = overlay;
            
            // Close on ESC key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    this.hide();
                    resolve(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    hide() {
        if (this.currentAlert) {
            this.currentAlert.classList.remove('show');
            setTimeout(() => {
                if (this.currentAlert) {
                    this.currentAlert.innerHTML = '';
                }
            }, 300);
        }
    }

    // Specific alert types with predefined styling
    info(message, title = 'Honey Info 🍯') {
        return this.show(message, title, 'info');
    }

    success(message, title = 'Sweet Success! 🐝') {
        return this.show(message, title, 'info');
    }

    warning(message, title = 'Buzzing Warning! ⚠️') {
        return this.show(message, title, 'validation');
    }

    error(message, title = 'Oops! Something went wrong 🐝') {
        return this.show(message, title, 'file-error');
    }

    confirm(message, title = 'Are you sure? 🤔') {
        return this.show(message, title, 'app-state', true);
    }

    // Specific alert methods for different categories
    shutdownConfirm(message = 'Are you sure you want to shut down Honey OS?') {
        return this.show(message, 'Shutdown Confirmation 🐝', 'shutdown', true);
    }

    fileError(message, title = 'File Buzzing Issue! 📁') {
        return this.show(message, title, 'file-error');
    }

    validationError(message, title = 'Invalid Input! ⚠️') {
        return this.show(message, title, 'validation');
    }

    browserCompatibility(message, title = 'Browser Compatibility 🌐') {
        return this.show(message, title, 'compatibility');
    }

    appState(message, title = 'Application State ℹ️') {
        return this.show(message, title, 'app-state');
    }
}

// Create global instance
window.beeAlert = new BeeAlert();

// Replace standard alert function (optional - for backward compatibility)
window.originalAlert = window.alert;
window.alert = function(message) {
    return window.beeAlert.info(message);
};

// Enhanced replacement function that returns a promise
window.beeConfirm = function(message, title) {
    return window.beeAlert.confirm(message, title);
};

// Export for module use if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BeeAlert;
} 