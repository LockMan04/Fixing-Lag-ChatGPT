// Các dịch vụ nền cho Universal AI Optimizer

// Import shared constants
importScripts('../shared/constants.js');

const DEFAULT_SETTINGS = self.UNIVERSAL_AI_CONSTANTS.DEFAULT_SETTINGS;

const SUPPORTED_DOMAINS = [
  'chatgpt.com',
  'claude.ai',
  'grok.com',
  'aistudio.google.com'
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
      
      case 'getActiveTab':
        this.getActiveTab(sendResponse);
        break;
      
      case 'saveActiveTab':
        this.saveActiveTab(request.activeTab || request.tabName, sendResponse);
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

  getActiveTab(sendResponse) {
    chrome.storage.sync.get(['activeTab'], (result) => {
      if (chrome.runtime.lastError) {
        sendResponse('settings'); // default tab
      } else {
        sendResponse(result.activeTab || 'settings');
      }
    });
  }

  saveActiveTab(tabName, sendResponse) {
    chrome.storage.sync.set({ activeTab: tabName }, () => {
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
