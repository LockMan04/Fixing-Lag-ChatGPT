// Popup script for Fixing lag ChatGPT extension

class PopupManager {
    constructor() {
        this.settings = {
            isEnabled: true,
            hideEmpty: true,
            maxMessages: 50,
            showMoreCount: 20
        };
        
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.updateUI();
        this.checkExtensionStatus();
        this.updatePerformanceStats();
    }

    async loadSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Connection error:', chrome.runtime.lastError);
                    resolve(); // Continue with default settings
                    return;
                }
                
                if (response) {
                    this.settings = { ...this.settings, ...response };
                }
                resolve();
            });
        });
    }

    async saveSettings() {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({ 
                action: 'saveSettings', 
                settings: this.settings 
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn('Save settings error:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                resolve(response);
            });
        });
    }

    setupEventListeners() {
        // Auto Hide toggle
        const autoHideToggle = document.getElementById('autoHideToggle');
        autoHideToggle.addEventListener('change', (e) => {
            this.settings.isEnabled = e.target.checked;
            this.updateExtensionStatus();
        });

        // Hide Empty toggle
        const hideEmptyToggle = document.getElementById('hideEmptyToggle');
        hideEmptyToggle.addEventListener('change', (e) => {
            this.settings.hideEmpty = e.target.checked;
        });

        // Max messages input
        const maxMessagesInput = document.getElementById('maxMessages');
        maxMessagesInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 10 && value <= 200) {
                this.settings.maxMessages = value;
            }
        });

        // Show more count input
        const showMoreCountInput = document.getElementById('showMoreCount');
        showMoreCountInput.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (value >= 5 && value <= 50) {
                this.settings.showMoreCount = value;
            }
        });

        // Save button
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.addEventListener('click', () => {
            this.handleSave();
        });

        // Reset button
        const resetBtn = document.getElementById('resetBtn');
        resetBtn.addEventListener('click', () => {
            this.handleReset();
        });
    }

    updateUI() {
        // Update toggles
        document.getElementById('autoHideToggle').checked = this.settings.isEnabled;
        document.getElementById('hideEmptyToggle').checked = this.settings.hideEmpty;
        
        // Update inputs
        document.getElementById('maxMessages').value = this.settings.maxMessages;
        document.getElementById('showMoreCount').value = this.settings.showMoreCount;
        
        this.updateExtensionStatus();
    }

    updateExtensionStatus() {
        const statusElement = document.getElementById('extensionStatus');
        if (this.settings.isEnabled) {
            statusElement.textContent = 'Đang hoạt động';
            statusElement.className = 'stat-value active';
        } else {
            statusElement.textContent = 'Đã tắt';
            statusElement.className = 'stat-value inactive';
        }
    }

    async handleSave() {
        const saveBtn = document.getElementById('saveBtn');
        const status = document.getElementById('status');
        
        // Validate inputs
        const maxMessages = parseInt(document.getElementById('maxMessages').value);
        const showMoreCount = parseInt(document.getElementById('showMoreCount').value);
        
        if (maxMessages < 10 || maxMessages > 200) {
            this.showStatus('Số tin nhắn hiển thị phải từ 10-200', 'error');
            return;
        }
        
        if (showMoreCount < 5 || showMoreCount > 50) {
            this.showStatus('Số tin nhắn "Show More" phải từ 5-50', 'error');
            return;
        }

        // Update settings
        this.settings.maxMessages = maxMessages;
        this.settings.showMoreCount = showMoreCount;

        try {
            saveBtn.textContent = 'Đang lưu...';
            saveBtn.disabled = true;

            await this.saveSettings();
            
            // Send update to content script
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
                    chrome.tabs.sendMessage(tab.id, { 
                        action: 'updateSettings', 
                        settings: this.settings 
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn('Content script not ready:', chrome.runtime.lastError);
                            // This is OK - content script might not be loaded yet
                        }
                    });
                }
            } catch (tabError) {
                console.warn('Tab communication error:', tabError);
                // This is OK - we still saved the settings
            }

            this.showStatus('Cài đặt đã được lưu!', 'success');
            
        } catch (error) {
            this.showStatus('Lỗi khi lưu cài đặt', 'error');
        } finally {
            setTimeout(() => {
                saveBtn.textContent = 'Lưu cài đặt';
                saveBtn.disabled = false;
            }, 1000);
        }
    }

    async handleReset() {
        if (confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
            this.settings = {
                isEnabled: true,
                hideEmpty: true,
                maxMessages: 50,
                showMoreCount: 20
            };
            
            await this.saveSettings();
            this.updateUI();
            this.showStatus('Đã đặt lại cài đặt mặc định', 'success');
            
            // Send update to content script
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'updateSettings', 
                    settings: this.settings 
                });
            }
        }
    }

    showStatus(message, type = '') {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
        
        setTimeout(() => {
            status.textContent = '';
            status.className = 'status';
        }, 3000);
    }

    async checkExtensionStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const statusElement = document.getElementById('extensionStatus');
            
            if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
                if (this.settings.isEnabled) {
                    statusElement.textContent = 'Hoạt động';
                    statusElement.className = 'stat-value active';
                } else {
                    statusElement.textContent = 'Đã tắt';
                    statusElement.className = 'stat-value inactive';
                }
            } else {
                statusElement.textContent = 'Không trên ChatGPT';
                statusElement.className = 'stat-value';
            }
        } catch (error) {
            console.error('Error checking extension status:', error);
        }
    }

    async updatePerformanceStats() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
                // Request stats from content script
                chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
                    if (chrome.runtime.lastError) {
                        // Content script not ready, show default values
                        document.getElementById('hiddenCount').textContent = '0';
                        document.getElementById('visibleCount').textContent = this.settings.maxMessages;
                        return;
                    }
                    
                    if (response) {
                        document.getElementById('hiddenCount').textContent = response.hiddenCount || '0';
                        document.getElementById('visibleCount').textContent = response.visibleCount || this.settings.maxMessages;
                    }
                });
            } else {
                document.getElementById('hiddenCount').textContent = '0';
                document.getElementById('visibleCount').textContent = this.settings.maxMessages;
            }
        } catch (error) {
            console.warn('Error updating performance stats:', error);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupManager();
});
