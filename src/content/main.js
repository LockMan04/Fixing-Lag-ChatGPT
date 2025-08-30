// Main content script for Fixing lag ChatGPT extension

// Constants
const DEFAULT_SETTINGS = {
  isEnabled: true,
  hideEmpty: true,
  maxMessages: 50,
  showMoreCount: 20
};

const SELECTORS = {
  CONVERSATION_TURN: 'article[data-testid*="conversation-turn"]',
  CONVERSATION_TURN_SAFE: 'article[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
  TURN_ID: 'article[data-turn-id]',
  CHAT_CONTAINERS: [
    '[data-testid="conversation-turn"]',
    '.flex.flex-col.gap-2',
    'main [role="main"]',
    '.conversation',
    '[class*="conversation"]'
  ],
  PROTECTED_ELEMENTS: 'form, input, textarea, button[type="submit"], [contenteditable="true"], [role="textbox"], nav, header, aside, .top-bar, .sidebar, footer, [data-testid*="composer"], [data-testid*="input"], [data-testid*="prompt"], [data-testid*="send"], div[contenteditable], [style*="sticky"], [style*="fixed"]'
};

const CSS_CLASSES = {
  FLOATING_BTN: 'lag-fixer-floating-btn',
  FLOATING_SHOW_MORE: 'floating-show-more',
  HIDDEN: 'lag-fixer-hidden',
  EMPTY_HIDDEN: 'lag-fixer-empty-hidden'
};

// Utils
const DOMUtils = {
  isOnChatGPT() {
    const hostname = window.location.hostname;
    return hostname === 'chat.openai.com' || hostname === 'chatgpt.com';
  },

  isVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0' &&
           element.offsetHeight > 0;
  },

  createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
  }
};

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

// Message Manager
class MessageManager {
  constructor(settings) {
    this.settings = settings;
    this.hiddenMessages = [];
  }

  updateSettings(settings) {
    this.settings = settings;
  }

  getMessageElements() {
    const selectors = [
      SELECTORS.CONVERSATION_TURN,
      SELECTORS.TURN_ID,
      ...SELECTORS.CHAT_CONTAINERS
    ];

    let messages = [];
    for (const selector of selectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length > 0) {
        messages = elements;
        break;
      }
    }

    const filteredMessages = messages.filter(msg => {
      if (!DOMUtils.isVisible(msg)) return false;
      if (msg.matches(SELECTORS.PROTECTED_ELEMENTS)) return false;
      if (msg.querySelector(SELECTORS.PROTECTED_ELEMENTS)) return false;
      
      // Extra protection for input areas
      if (msg.querySelector('form, textarea, input, [role="textbox"], [contenteditable]')) return false;
      if (msg.closest('form')) return false;
      
      // Don't hide elements in footer or bottom area
      if (msg.closest('footer')) return false;
      
      return true;
    });
    
    return filteredMessages;
  }

  hideOldMessages() {
    if (!this.settings.isEnabled) return 0;

    const messages = this.getMessageElements();
    const maxVisible = this.settings.maxMessages;

    if (messages.length <= maxVisible) return 0;

    const toHide = messages.slice(0, -maxVisible);
    let hiddenCount = 0;

    toHide.forEach(message => {
      if (!message.classList.contains(CSS_CLASSES.HIDDEN)) {
        const isEmpty = this.settings.hideEmpty && this.isEmptyMessage(message);
        
        if (isEmpty) {
          message.classList.add(CSS_CLASSES.EMPTY_HIDDEN);
        } else {
          message.classList.add(CSS_CLASSES.HIDDEN);
        }
        
        this.hiddenMessages.push(message);
        hiddenCount++;
      }
    });

    return this.hiddenMessages.length; // Return total hidden, not just newly hidden
  }

  showMoreMessages() {
    const showCount = this.settings.showMoreCount;
    const toShow = this.hiddenMessages.slice(-showCount);
    
    toShow.forEach(message => {
      message.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);
    });

    this.hiddenMessages = this.hiddenMessages.slice(0, -showCount);
    return this.hiddenMessages.length;
  }

  showAllMessages() {
    this.hiddenMessages.forEach(message => {
      message.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);
    });
    this.hiddenMessages = [];
    return 0;
  }

  isEmptyMessage(message) {
    const text = message.textContent?.trim();
    return !text || text.length < 10;
  }

  getStats() {
    const total = this.getMessageElements().length;
    const hidden = this.hiddenMessages.length;
    return {
      total,
      hidden,
      visible: total - hidden
    };
  }
}

// Show More Button
class ShowMoreButton {
  constructor(onClickCallback, messageManager) {
    this.onClickCallback = onClickCallback;
    this.messageManager = messageManager;
    this.container = null;
    this.wrapper = null;
    this.button = null;
  }

  create() {
    this.destroy();

    this.container = DOMUtils.createElement('div', 'lag-fixer-floating-btn');
    
    this.button = DOMUtils.createElement('button', 'floating-show-more', `
      Hiện thêm tin nhắn
    `);

    this.button.addEventListener('click', () => {
      this.onClickCallback();
    });

    this.container.appendChild(this.button);
    document.body.appendChild(this.container);
  }

  updateCount(newlyHidden = 0) {
    if (!this.container || !this.button) return;

    // Luôn hiển thị button
    this.container.style.display = 'block';
    
    // Đếm tổng số tin nhắn thực sự bị ẩn
    const actuallyHidden = document.querySelectorAll('.lag-fixer-hidden, .lag-fixer-empty-hidden').length;
    
    if (actuallyHidden > 0) {
      this.button.textContent = `Hiện thêm tin nhắn (${actuallyHidden})`;
    } else {
      this.button.textContent = `Không có tin nhắn ẩn`;
    }
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.button = null;
  }
}

// Chat Observer
class ChatObserver {
  constructor(onMessagesChange, onUrlChange) {
    this.onMessagesChange = onMessagesChange;
    this.onUrlChange = onUrlChange;
    this.messageObserver = null;
    this.urlObserver = null;
    this.currentUrl = window.location.href;
    this.debounceTimer = null;
  }

  startMessageObserver() {
    this.stopMessageObserver();

    const targetNode = document.querySelector('main') || document.body;
    
    this.messageObserver = new MutationObserver(() => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.onMessagesChange();
      }, 500);
    });

    this.messageObserver.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  startUrlObserver() {
    this.urlObserver = setInterval(() => {
      if (window.location.href !== this.currentUrl) {
        this.currentUrl = window.location.href;
        setTimeout(() => {
          this.onUrlChange();
        }, 1000);
      }
    }, 1000);
  }

  stopMessageObserver() {
    if (this.messageObserver) {
      this.messageObserver.disconnect();
      this.messageObserver = null;
    }
  }

  stop() {
    this.stopMessageObserver();
    if (this.urlObserver) {
      clearInterval(this.urlObserver);
      this.urlObserver = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

// Main ChatGPT Lag Fixer Class
class ChatGPTLagFixer {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.messageManager = new MessageManager(this.settings);
    this.showMoreButton = new ShowMoreButton(() => this.handleShowMore(), this.messageManager);
    this.observer = new ChatObserver(
      () => this.handleMessagesChange(),
      () => this.handleUrlChange()
    );
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.showMoreButton.create();
    this.observer.startMessageObserver();
    this.observer.startUrlObserver();
    this.processMessages();
  }

  async loadSettings() {
    try {
      const settings = await StorageUtils.loadSettings();
      this.settings = { ...this.settings, ...settings };
      this.messageManager.updateSettings(this.settings);
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  handleShowMore() {
    const hiddenCount = this.messageManager.showMoreMessages();
    this.showMoreButton.updateCount(hiddenCount);
  }

  handleMessagesChange() {
    this.processMessages();
  }

  handleUrlChange() {
    // Reset state on navigation
    this.messageManager.hiddenMessages = [];
    this.showMoreButton.create();
    this.observer.startMessageObserver();
    this.processMessages();
  }

  processMessages() {
    const hiddenCount = this.messageManager.hideOldMessages();
    this.showMoreButton.updateCount(hiddenCount);
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.messageManager.updateSettings(this.settings);
    
    // Show all messages first
    this.messageManager.showAllMessages();
    
    // Apply new settings
    setTimeout(() => {
      this.processMessages();
    }, 100);
  }

  getStats() {
    return this.messageManager.getStats();
  }

  destroy() {
    this.observer.stop();
    this.showMoreButton.destroy();
  }
}

// Initialize the lag fixer
let lagFixer = null;

const initLagFixer = () => {
  if (lagFixer) return;
  
  // Check if we're on ChatGPT
  if (DOMUtils.isOnChatGPT()) {
    lagFixer = new ChatGPTLagFixer();
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLagFixer);
} else {
  initLagFixer();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'pageLoaded') {
    initLagFixer();
  }
  
  if (request.action === 'updateSettings' && lagFixer) {
    lagFixer.updateSettings(request.settings);
  }
  
  if (request.action === 'getStats' && lagFixer) {
    const stats = lagFixer.getStats();
    sendResponse(stats);
    return;
  }
  
  sendResponse({ success: true });
});
