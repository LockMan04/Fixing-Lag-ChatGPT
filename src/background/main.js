// Background service worker for Universal AI Chat Optimizer

// Constants
const DEFAULT_SETTINGS = {
  isEnabled: true,
  hideEmpty: true,
  maxMessages: 10,
  showMoreCount: 5,
  enabledSites: {
    chatgpt: true,
    claude: true,
    gemini: true,
    deepseek: true,
    grok: true,
    perplexity: true
  }
};

const SUPPORTED_DOMAINS = [
  'chat.openai.com',
  'chatgpt.com',
  'claude.ai',
  'gemini.google.com',
  'bard.google.com',
  'chat.deepseek.com',
  'grok.com',
  'perplexity.ai'
];

class BackgroundService {
  constructor() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Set default settings on install
    chrome.runtime.onInstalled.addListener(() => {
      this.setDefaultSettings();
    });

    // Listen for tab updates to inject extension on supported AI platforms
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

  isSupportedURL(url) {
    return SUPPORTED_DOMAINS.some(domain => url.includes(domain));
  }

  handleTabUpdate(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      if (this.isSupportedURL(tab.url)) {
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
