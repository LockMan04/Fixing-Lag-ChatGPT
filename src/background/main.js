// Background service worker for Fixing lag ChatGPT extension

// Constants
const DEFAULT_SETTINGS = {
  isEnabled: true,
  hideEmpty: true,
  maxMessages: 50,
  showMoreCount: 20
};

const DOMAINS = {
  OPENAI: 'chat.openai.com',
  CHATGPT: 'chatgpt.com'
};

class BackgroundService {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Set default settings on install
    chrome.runtime.onInstalled.addListener(() => {
      this.setDefaultSettings();
    });

    // Listen for tab updates to inject extension on ChatGPT pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Handle messages from content script and popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });
  }

  setDefaultSettings() {
    chrome.storage.sync.set(DEFAULT_SETTINGS);
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      if (tab.url.includes(DOMAINS.OPENAI) || tab.url.includes(DOMAINS.CHATGPT)) {
        chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' }).catch(() => {
          // Ignore errors - content script might not be ready yet
        });
      }
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'getSettings':
        this.getSettings(sendResponse);
        break;
      
      case 'saveSettings':
        this.saveSettings(request.settings, sendResponse);
        break;
      
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  getSettings(sendResponse) {
    chrome.storage.sync.get(
      ['isEnabled', 'hideEmpty', 'maxMessages', 'showMoreCount'], 
      (result) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          sendResponse(result);
        }
      }
    );
  }

  saveSettings(settings, sendResponse) {
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        sendResponse({ success: true });
      }
    });
  }
}

// Initialize background service
new BackgroundService();
