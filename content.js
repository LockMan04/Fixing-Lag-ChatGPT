// Content script for Fixing lag ChatGPT extension
class ChatGPTLagFixer {
  constructor() {
    this.settings = {
      isEnabled: true,
      hideEmpty: true,
      maxMessages: 10,
      showMoreCount: 20
    };
    this.hiddenMessages = [];
    this.showMoreButton = null;
    this.observer = null;
    this.lastMessageCount = 0;
    
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.createShowMoreButton();
    this.observeMessages();
    this.hideOldMessages();
    
    // Listen for SPA navigation
    this.observeUrlChanges();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response) {
          this.settings = { ...this.settings, ...response };
        }
        resolve();
      });
    });
  }

  createShowMoreButton() {
    if (this.showMoreButton) return;

    this.showMoreButton = document.createElement('div');
    this.showMoreButton.className = 'lag-fixer-floating-btn';
    this.showMoreButton.innerHTML = `
      <button id="showMoreBtn" class="floating-show-more">
        Show More (<span id="hiddenCount">${this.hiddenMessages.length}</span>)
      </button>
    `;
    
    this.showMoreButton.addEventListener('click', () => {
      this.showMoreMessages();
    });

    // Thêm vào body thay vì chat container
    document.body.appendChild(this.showMoreButton);
  }

  getChatContainer() {
    // Try different selectors for ChatGPT chat container
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

  getMessages() {
    // Try different selectors for ChatGPT messages - chỉ lấy tin nhắn thực sự
    const selectors = [
      'article[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
      '[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
      'article[data-turn-id]'
    ];

    for (const selector of selectors) {
      const messages = document.querySelectorAll(selector);
      if (messages.length > 0) {
        return Array.from(messages).filter(message => {
          // Đảm bảo không ẩn input areas hoặc form elements
          if (message.querySelector('form, input, textarea') ||
              message.closest('form') ||
              message.getAttribute('role') === 'textbox') {
            return false; // Không xử lý các element này
          }
          return this.isValidMessage(message);
        });
      }
    }

    return [];
  }

  isValidMessage(message) {
    // Bỏ qua các element không phải tin nhắn thực sự
    if (!message || !message.textContent) return false;
    
    // Bỏ qua input areas, buttons, headers
    if (message.querySelector('input, textarea, button') || 
        message.closest('form, header, nav, aside')) {
      return true; // Không ẩn các element UI quan trọng
    }
    
    // Kiểm tra xem tin nhắn có nội dung thực sự không
    const textContent = message.textContent?.trim() || '';
    
    // Cho phép tin nhắn có độ dài hợp lý
    if (textContent.length === 0) return false;
    if (textContent.length >= 3) return true; // Tin nhắn có ít nhất 3 ký tự là hợp lệ
    
    // Tìm nội dung chính trong các div con
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
    
    // Chỉ bỏ qua tin nhắn loading rất ngắn
    const loadingPatterns = [
      'typing...',
      'loading...',
      'thinking...',
      'generating...'
    ];
    
    if (loadingPatterns.some(pattern => textContent.toLowerCase() === pattern.toLowerCase())) {
      return false;
    }
    
    return true;
  }

  hideOldMessages() {
    if (!this.settings.isEnabled) return;

    // Đầu tiên ẩn tất cả tin nhắn trống (nếu bật setting)
    if (this.settings.hideEmpty) {
      this.hideEmptyMessages();
    }

    // Sau đó ẩn tin nhắn cũ theo logic gốc
    const messages = this.getMessages();
    
    if (messages.length <= this.settings.maxMessages) return;

    const messagesToHide = messages.slice(0, messages.length - this.settings.maxMessages);
    
    messagesToHide.forEach(message => {
      if (!message.classList.contains('lag-fixer-hidden')) {
        message.classList.add('lag-fixer-hidden');
        message.style.display = 'none';
        this.hiddenMessages.push(message);
      }
    });

    this.updateShowMoreButton();
  }

  hideEmptyMessages() {
    // Chỉ ẩn tin nhắn trong conversation, không động vào UI elements
    const allSelectors = [
      'article[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
      'article[data-turn-id]'
    ];

    for (const selector of allSelectors) {
      const allMessages = document.querySelectorAll(selector);
      if (allMessages.length > 0) {
        Array.from(allMessages).forEach(message => {
          // Đảm bảo không ẩn chat input hoặc UI elements
          if (message.querySelector('form, input, textarea, button[type="submit"]') ||
              message.closest('form') ||
              message.querySelector('[contenteditable="true"]')) {
            return; // Không xử lý
          }
          
          // Kiểm tra xem có phải tin nhắn trống không
          if (!this.isValidMessage(message) && !message.classList.contains('lag-fixer-empty-hidden')) {
            message.classList.add('lag-fixer-empty-hidden');
            message.style.display = 'none';
          }
        });
        break;
      }
    }
  }

  showMoreMessages() {
    const messagesToShow = this.hiddenMessages.splice(-this.settings.showMoreCount);
    
    messagesToShow.forEach(message => {
      message.style.display = '';
      message.classList.remove('lag-fixer-hidden');
    });

    this.updateShowMoreButton();
  }

  updateShowMoreButton() {
    if (!this.showMoreButton) return;

    const hiddenCountSpan = this.showMoreButton.querySelector('#hiddenCount');
    const button = this.showMoreButton.querySelector('#showMoreBtn');
    
    if (this.hiddenMessages.length > 0) {
      if (hiddenCountSpan) {
        hiddenCountSpan.textContent = this.hiddenMessages.length;
      }
      button.textContent = `Show More (${this.hiddenMessages.length})`;
      this.showMoreButton.style.display = 'block';
    } else {
      this.showMoreButton.style.display = 'none';
    }
  }

  observeMessages() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const chatContainer = this.getChatContainer();
    if (!chatContainer) return;

    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });

      if (shouldCheck) {
        // Debounce to avoid excessive calls
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
          this.hideOldMessages();
        }, 500);
      }
    });

    this.observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }

  observeUrlChanges() {
    // Watch for SPA navigation
    let lastUrl = location.href;
    
    const urlObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // Reinitialize on navigation
        setTimeout(() => {
          this.hiddenMessages = [];
          this.lastMessageCount = 0;
          this.createShowMoreButton();
          this.observeMessages();
          this.hideOldMessages();
        }, 1000);
      }
    });

    urlObserver.observe(document, { subtree: true, childList: true });
  }

  async updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    // Show all hidden messages first (cả tin nhắn cũ và tin nhắn trống)
    this.hiddenMessages.forEach(message => {
      message.style.display = '';
      message.classList.remove('lag-fixer-hidden');
    });
    this.hiddenMessages = [];
    
    // Show all empty messages
    document.querySelectorAll('.lag-fixer-empty-hidden').forEach(message => {
      message.style.display = '';
      message.classList.remove('lag-fixer-empty-hidden');
    });
    
    // Apply new settings
    setTimeout(() => {
      this.hideOldMessages();
    }, 100);
  }
}

// Initialize the lag fixer
let lagFixer = null;

// Wait for page to load
const initLagFixer = () => {
  if (lagFixer) return;
  
  // Check if we're on ChatGPT
  if (location.hostname.includes('openai.com') || location.hostname.includes('chatgpt.com')) {
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
    const stats = {
      hiddenCount: lagFixer.hiddenMessages.length,
      visibleCount: lagFixer.getMessages().length,
      totalMessages: lagFixer.getMessages().length + lagFixer.hiddenMessages.length
    };
    sendResponse(stats);
    return;
  }
  
  sendResponse({ success: true });
});
