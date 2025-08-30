// Utility functions for Fixing lag ChatGPT extension

export class DOMUtils {
  static getChatContainer() {
    const selectors = [
      '[data-testid="conversation-turn"]',
      '.flex.flex-col.gap-2',
      'main [role="main"]',
      '.conversation',
      '[class*="conversation"]'
    ];

    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container && container.parentElement) {
        return container.parentElement;
      }
    }

    return document.querySelector('main') || document.body;
  }

  static getMessages() {
    const selectors = [
      'article[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
      '[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
      'article[data-turn-id]'
    ];

    for (const selector of selectors) {
      const messages = document.querySelectorAll(selector);
      if (messages.length > 0) {
        return Array.from(messages).filter(message => {
          // Ensure we don't hide input areas or form elements
          if (message.querySelector('form, input, textarea') ||
              message.closest('form') ||
              message.getAttribute('role') === 'textbox') {
            return false;
          }
          return MessageValidator.isValidMessage(message);
        });
      }
    }

    return [];
  }

  static isOnChatGPT() {
    return location.hostname.includes('openai.com') || 
           location.hostname.includes('chatgpt.com');
  }
}

export class MessageValidator {
  static isValidMessage(message) {
    if (!message || !message.textContent) return false;
    
    // Skip input areas, buttons, headers
    if (message.querySelector('input, textarea, button') || 
        message.closest('form, header, nav, aside')) {
      return true; // Don't hide important UI elements
    }
    
    const textContent = message.textContent?.trim() || '';
    
    // Allow messages with reasonable length
    if (textContent.length === 0) return false;
    if (textContent.length >= 3) return true;
    
    // Check for real content in child divs
    const contentDivs = message.querySelectorAll('.whitespace-pre-wrap, [data-message-author-role] div, .user-message-bubble-color, .assistant-message');
    let hasRealContent = false;
    
    for (const div of contentDivs) {
      const divText = div.textContent?.trim() || '';
      if (divText.length > 0) {
        hasRealContent = true;
        break;
      }
    }
    
    if (!hasRealContent) return false;
    
    // Skip very short loading messages
    const loadingPatterns = [
      'typing...',
      'loading...',
      'thinking...',
      'generating...'
    ];
    
    if (loadingPatterns.some(pattern => 
        textContent.toLowerCase() === pattern.toLowerCase())) {
      return false;
    }
    
    return true;
  }
}

export class StorageUtils {
  static async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Storage error:', chrome.runtime.lastError);
          resolve({});
          return;
        }
        resolve(response || {});
      });
    });
  }

  static async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ 
        action: 'saveSettings', 
        settings 
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('Save error:', chrome.runtime.lastError);
          resolve(false);
          return;
        }
        resolve(response);
      });
    });
  }
}
