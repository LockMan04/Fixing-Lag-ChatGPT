// Background service worker for Fixing lag ChatGPT extension
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.sync.set({
    isEnabled: true,
    hideEmpty: true,
    maxMessages: 20,
    showMoreCount: 20
  });
});

// Listen for tab updates to inject the extension on ChatGPT pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('chat.openai.com') || tab.url.includes('chatgpt.com')) {
      chrome.tabs.sendMessage(tabId, { action: 'pageLoaded' });
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['isEnabled', 'hideEmpty', 'maxMessages', 'showMoreCount'], (result) => {
      sendResponse(result);
    });
    return true;
  }
  
  if (request.action === 'saveSettings') {
    chrome.storage.sync.set(request.settings, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
