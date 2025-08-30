// Main popup script for Fixing lag ChatGPT extension

// Constants
const DEFAULT_SETTINGS = {
  isEnabled: true,
  hideEmpty: true,
  maxMessages: 50,
  showMoreCount: 20
};

// Storage Utils
const StorageUtils = {
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        resolve(settings);
      });
    });
  },

  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        resolve();
      });
    });
  }
};

// Popup Manager
class PopupManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
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
    try {
      const settings = await StorageUtils.loadSettings();
      this.settings = { ...this.settings, ...settings };
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      return await StorageUtils.saveSettings(this.settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
      return false;
    }
  }

  setupEventListeners() {
    // Auto Hide toggle
    const autoHideToggle = document.getElementById('autoHideToggle');
    autoHideToggle?.addEventListener('change', (e) => {
      this.settings.isEnabled = e.target.checked;
      this.updateExtensionStatus();
    });

    // Hide Empty toggle
    const hideEmptyToggle = document.getElementById('hideEmptyToggle');
    hideEmptyToggle?.addEventListener('change', (e) => {
      this.settings.hideEmpty = e.target.checked;
    });

    // Max messages input
    const maxMessagesInput = document.getElementById('maxMessages');
    maxMessagesInput?.addEventListener('input', (e) => {
      this.settings.maxMessages = parseInt(e.target.value) || 50;
    });

    // Show more count input
    const showMoreCountInput = document.getElementById('showMoreCount');
    showMoreCountInput?.addEventListener('input', (e) => {
      this.settings.showMoreCount = parseInt(e.target.value) || 20;
    });

    // Save button
    const saveBtn = document.getElementById('saveBtn');
    saveBtn?.addEventListener('click', () => this.handleSave());

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    resetBtn?.addEventListener('click', () => this.handleReset());
  }

  updateUI() {
    // Update toggles
    const autoHideToggle = document.getElementById('autoHideToggle');
    const hideEmptyToggle = document.getElementById('hideEmptyToggle');
    const maxMessagesInput = document.getElementById('maxMessages');
    const showMoreCountInput = document.getElementById('showMoreCount');

    if (autoHideToggle) autoHideToggle.checked = this.settings.isEnabled;
    if (hideEmptyToggle) hideEmptyToggle.checked = this.settings.hideEmpty;
    if (maxMessagesInput) maxMessagesInput.value = this.settings.maxMessages;
    if (showMoreCountInput) showMoreCountInput.value = this.settings.showMoreCount;

    this.updateExtensionStatus();
  }

  updateExtensionStatus() {
    const statusElement = document.getElementById('extensionStatus');
    if (!statusElement) return;

    if (this.settings.isEnabled) {
      statusElement.textContent = 'Hoạt động';
      statusElement.className = 'stat-value active';
    } else {
      statusElement.textContent = 'Đã tắt';
      statusElement.className = 'stat-value inactive';
    }
  }

  async handleSave() {
    const saveBtn = document.getElementById('saveBtn');
    
    // Validate inputs
    const maxMessages = parseInt(document.getElementById('maxMessages')?.value || 50);
    const showMoreCount = parseInt(document.getElementById('showMoreCount')?.value || 20);
    
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
      if (saveBtn) {
        saveBtn.textContent = 'Đang lưu...';
        saveBtn.disabled = true;
      }

      await this.saveSettings();
      
      // Send update to content script
      this.updateContentScript();

      this.showStatus('Cài đặt đã được lưu!', 'success');
      
    } catch (error) {
      this.showStatus('Lỗi khi lưu cài đặt', 'error');
    } finally {
      setTimeout(() => {
        if (saveBtn) {
          saveBtn.textContent = '💾 Lưu cài đặt';
          saveBtn.disabled = false;
        }
      }, 1000);
    }
  }

  async updateContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com'))) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateSettings', 
          settings: this.settings 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Content script not ready:', chrome.runtime.lastError);
          }
        });
      }
    } catch (error) {
      console.warn('Tab communication error:', error);
    }
  }

  async handleReset() {
    if (confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
      this.settings = { ...DEFAULT_SETTINGS };
      
      try {
        await this.saveSettings();
        this.updateUI();
        this.updateContentScript();
        this.showStatus('Đã đặt lại cài đặt mặc định!', 'success');
      } catch (error) {
        this.showStatus('Lỗi khi đặt lại cài đặt', 'error');
      }
    }
  }

  showStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = `status ${type}`;
    statusElement.style.display = 'block';

    setTimeout(() => {
      statusElement.style.display = 'none';
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
        chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
          if (chrome.runtime.lastError) {
            document.getElementById('hiddenCount').textContent = '0';
            document.getElementById('visibleCount').textContent = this.settings.maxMessages;
            return;
          }
          
          if (response) {
            document.getElementById('hiddenCount').textContent = response.hidden || '0';
            document.getElementById('visibleCount').textContent = response.visible || this.settings.maxMessages;
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
