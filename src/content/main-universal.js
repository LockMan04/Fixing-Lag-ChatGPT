// Universal AI Chat Optimizer - Main Content Script
// No ES6 modules version for Chrome extension compatibility

(function() {
  'use strict';
  
  // Constants
  const DEFAULT_SETTINGS = {
    isEnabled: true,
    hideEmpty: true,
    maxMessages: 10,
    showMoreCount: 5,
    enabledSites: {
      chatgpt: true,
      claude: true,
      grok: true
    }
  };

  const SUPPORTED_SITES = {
    CHATGPT: {
      name: 'ChatGPT',
      domains: ['chat.openai.com', 'chatgpt.com'],
      selectors: {
        messages: [
          'article[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
          '[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
          'article[data-turn-id]'
        ],
        chatContainer: [
          '[data-testid="conversation-turn"]',
          'main [role="main"]',
          '.conversation'
        ],
        protectedElements: 'form, input, textarea, [contenteditable="true"], [role="textbox"]'
      }
    },
    
    CLAUDE: {
        name: 'Claude',
        domains: ['claude.ai'],
        selectors: {
            turns: [
            '[data-test-render-count] > div',             // mỗi turn nằm trong div con của data-test-render-count
            'main div.group.relative'                     // fallback
            ],
            messages: [
            'div.group.relative:has([data-testid="user-message"])',
            'div.group.relative:has(.font-claude-response)',
            'div.group.relative:has(.prose)',
            'main div.group.relative'
            ],
            chatContainer: [
            '[data-testid="conversation"]',
            'main',
            '.flex.flex-col.gap-3'
            ],
            protectedElements: 'form, input, textarea, [contenteditable="true"], [role="textbox"], .composer'
        }
    },

    GROK: {
      name: 'Grok (X AI)',
      domains: ['grok.com'],
      selectors: {
        messages: [
          '[data-testid*="conversation-turn"]',
          '.conversation-turn',
          '.message-pair',
          '.chat-message',
          '[class*="message"]',
          '[class*="turn"]'
        ],
        chatContainer: [
          '[data-testid="conversation"]',
          '.conversation-container',
          '.chat-container',
          'main .container',
          'main',
          '.main-content'
        ],
        protectedElements: 'form, input, textarea, [contenteditable="true"], .compose-area, .composer, [role="textbox"], .input-area'
      }
    },
  };

  const CSS_CLASSES = {
    FLOATING_BTN: 'universal-ai-fixer-floating-btn',
    FLOATING_SHOW_MORE: 'universal-ai-floating-show-more',
    HIDDEN: 'universal-ai-fixer-hidden',
    EMPTY_HIDDEN: 'universal-ai-fixer-empty-hidden'
  };

  // Platform Detection
  class PlatformDetector {
    static getCurrentPlatform() {
      const hostname = window.location.hostname;
      console.log(`[Universal AI Optimizer] Checking hostname: ${hostname}`);
      
      for (const [key, site] of Object.entries(SUPPORTED_SITES)) {
        if (site.domains.some(domain => hostname.includes(domain))) {
          console.log(`[Universal AI Optimizer] Platform detected: ${site.name} (${key})`);
          return {
            key: key.toLowerCase(),
            name: site.name,
            config: site
          };
        }
      }
      
      console.log('[Universal AI Optimizer] No supported platform detected');
      return null;
    }
    
    static isSupportedSite() {
      return this.getCurrentPlatform() !== null;
    }
    
    static getPlatformConfig() {
      const platform = this.getCurrentPlatform();
      return platform ? platform.config : null;
    }
  }

  // DOM Utils
  class DOMUtils {
    static getChatContainer() {
      const platform = PlatformDetector.getPlatformConfig();
      if (!platform) return document.body;
      
      const selectors = platform.selectors.chatContainer;
      
      for (const selector of selectors) {
        const container = document.querySelector(selector);
        if (container && container.parentElement) {
          return container.parentElement;
        }
      }

      return document.querySelector('main') || document.body;
    }

    static getMessages() {
        const platform = PlatformDetector.getPlatformConfig();
        if (!platform) {
            console.log('[Universal AI Optimizer] No platform config available');
            return [];
        }

        const { selectors } = platform;
        const protectedSel = selectors.protectedElements;

        // Use 'turns' selectors if available, otherwise use 'messages' selectors
        const querySelectors = (selectors.turns && selectors.turns.length) ? selectors.turns : selectors.messages;
        
        if (!querySelectors || querySelectors.length === 0) {
            console.log('[Universal AI Optimizer] No message selectors found for this platform.');
            return [];
        }

        // Combine all selectors into a single query for efficiency
        const combinedSelector = querySelectors.join(', ');
        const allMessages = Array.from(document.querySelectorAll(combinedSelector));
        
        // Using a Set to automatically handle duplicates from overlapping selectors
        const uniqueMessages = new Set(allMessages);

        const filtered = Array.from(uniqueMessages).filter(message => {
            // Pass platform to avoid re-detecting it
            if (!MessageValidator.isValidMessage(message, platform)) return false;
            if (protectedSel && (message.querySelector(protectedSel) || message.closest(protectedSel))) return false;
            return true;
        });

        console.log(`[Universal AI Optimizer] Total found ${filtered.length} valid messages from ${uniqueMessages.size} unique elements`);
        return filtered;
    }
  }

  // Message Validator
  class MessageValidator {
    static isValidMessage(message, platformConfig) {
      if (!message || !message.textContent) return false;
      
      // Use passed platform config, or detect it if not provided
      const platform = platformConfig || PlatformDetector.getPlatformConfig();
      if (!platform) return false;
      
      // Skip protected elements
      if (message.querySelector(platform.selectors.protectedElements) || 
          message.closest(platform.selectors.protectedElements)) {
        return false;
      }
      
      const textContent = message.textContent?.trim() || '';
      
      // Allow messages with reasonable length
      if (textContent.length === 0) return false;
      if (textContent.length >= 3) return true;
      
      // Skip very short loading messages
      const loadingPatterns = [
        'typing...',
        'loading...',
        'thinking...',
        'generating...',
        'processing...',
        '...'
      ];
      
      if (loadingPatterns.some(pattern => 
          textContent.toLowerCase().includes(pattern.toLowerCase()))) {
        return false;
      }
      
      return true;
    }
  }

  // Storage Utils
  class StorageUtils {
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

  // Message Manager
  class MessageManager {
    constructor(settings) {
      this.settings = settings;
      this.hiddenMessages = new Set();
      this.protectedMessages = new Set(); // Messages that should stay visible
    }

    updateSettings(settings) {
      this.settings = settings;
    }

    processMessages() {
      if (!this.settings.isEnabled) return 0;

      const messages = DOMUtils.getMessages();
      const totalMessages = messages.length;

      if (totalMessages <= this.settings.maxMessages) {
        this.showAllMessages();
        return 0;
      }

      // Calculate messages to hide
      const keepCount = this.settings.maxMessages;
      const hideCount = totalMessages - keepCount;
      
      messages.forEach((message, index) => {
        // Check if this message is protected (should stay visible)
        const isProtected = this.protectedMessages.has(message);
        
        if (index < hideCount && !isProtected) {
          // Hide old messages by adding CSS classes.
          if (!message.classList.contains(CSS_CLASSES.HIDDEN) && !message.classList.contains(CSS_CLASSES.EMPTY_HIDDEN)) {
            const isEmpty = this.settings.hideEmpty && this.isEmptyMessage(message);
            message.classList.add(isEmpty ? CSS_CLASSES.EMPTY_HIDDEN : CSS_CLASSES.HIDDEN);
            this.hiddenMessages.add(message);
          }
        } else {
          // Ensure recent messages are visible by removing CSS classes.
          if (message.classList.contains(CSS_CLASSES.HIDDEN) || message.classList.contains(CSS_CLASSES.EMPTY_HIDDEN)) {
            message.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);
            this.hiddenMessages.delete(message);
          }
        }
      });

      console.log(`[MessageManager] processMessages: ${this.hiddenMessages.size} messages hidden out of ${messages.length} total`);
      return this.hiddenMessages.size;
    }

    showMoreMessages() {
      const showCount = this.settings.showMoreCount;
      const hiddenArray = Array.from(this.hiddenMessages);
      const toShow = hiddenArray.slice(-showCount);
      
      toShow.forEach(message => {
        message.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);
        this.hiddenMessages.delete(message);
      });

      return this.hiddenMessages.size;
    }

    showAllMessages() {
      this.hiddenMessages.forEach(message => {
        message.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);
      });
      this.hiddenMessages.clear();
      return 0;
    }

    isEmptyMessage(message) {
      const text = message.textContent?.trim();
      return !text || text.length < 3;
    }

    protectMessage(messageElement) {
      this.protectedMessages.add(messageElement);
      
      // Add visual indicator that message is protected
      messageElement.setAttribute('data-ai-optimizer-protected', 'true');
      
      // Auto-unprotect after a delay to prevent permanent protection
      setTimeout(() => {
        this.protectedMessages.delete(messageElement);
        messageElement.removeAttribute('data-ai-optimizer-protected');
      }, 30000); // 30 seconds protection
    }

    unprotectMessage(messageElement) {
      this.protectedMessages.delete(messageElement);
    }

    clearProtectedMessages() {
      this.protectedMessages.clear();
    }

    getStats() {
      const total = DOMUtils.getMessages().length;
      const hidden = this.hiddenMessages.size;
      return {
        total,
        hidden,
        visible: total - hidden
      };
    }

    getDetailedStats() {
      const messages = DOMUtils.getMessages();
      const platform = PlatformDetector.getCurrentPlatform();
      
      if (!platform) {
        return {
          totalUser: 0,
          totalAi: 0,
          totalAll: 0,
          messages: []
        };
      }

      const messageData = [];
      let userCount = 0;
      let aiCount = 0;

      messages.forEach((message, index) => {
        const messageInfo = this.analyzeMessage(message, platform, index);
        if (messageInfo) {
          messageData.push({
            ...messageInfo,
            index: index + 1,
            timestamp: new Date().toISOString()
          });
          
          if (messageInfo.isUser) {
            userCount++;
          } else {
            aiCount++;
          }
        }
      });

      return {
        totalUser: userCount,
        totalAi: aiCount,
        totalAll: messages.length,
        messages: messageData
      };
    }

    // Fixed analyzeMessage method - thay thế trong MessageManager class

    analyzeMessage(messageElement, platform, messageIndex) {
      if (!messageElement || !messageElement.textContent) return null;

      const text = messageElement.textContent.trim();
      if (!text) return null;

      // Generate unique ID for message
      const messageId = `ai-optimizer-msg-${messageIndex}-${Date.now()}`;
      messageElement.setAttribute('data-ai-optimizer-id', messageId);

      // Detect if message is from user or AI based on platform-specific patterns
      let isUser = false;
      let senderName = 'AI';

      switch (platform.key) {
        case 'chatgpt':
          // ChatGPT: Check for user indicators
          if (messageElement.querySelector('[data-message-author-role="user"]') ||
              messageElement.querySelector('[data-testid*="user"]') ||
              messageElement.closest('[data-message-author-role="user"]')) {
            isUser = true;
            senderName = 'Bạn';
          } else {
            senderName = 'ChatGPT';
          }
          break;

        case 'claude':
          // Claude: Check for user message indicators
          if (messageElement.querySelector('[data-testid="user-message"]') ||
              messageElement.closest('[data-testid="user-message"]') ||
              messageElement.querySelector('.human-message')) {
            isUser = true;
            senderName = 'Bạn';
          } else {
            senderName = 'Claude';
          }
          break;

        case 'grok':
          // Grok: Advanced detection using helper functions
          
          // Helper 1: Check alignment classes
          const alignmentRole = this.guessByAlignment(messageElement);
          if (alignmentRole === 'user') {
            isUser = true;
            senderName = 'Bạn';
          } else if (alignmentRole === 'assistant') {
            isUser = false;
            senderName = 'Grok';
          } else {
            // Helper 2: Check data-testid
            const testidRole = this.guessByDataTestid(messageElement);
            if (testidRole === 'user') {
              isUser = true;
              senderName = 'Bạn';
            } else if (testidRole === 'assistant') {các 
              isUser = false;
              senderName = 'Grok';
            } else {
              // Helper 3: Check aria attributes
              const ariaRole = this.guessByAria(messageElement);
              if (ariaRole === 'user') {
                isUser = true;
                senderName = 'Bạn';
              } else if (ariaRole === 'assistant') {
                isUser = false;
                senderName = 'Grok';
              } else {
                // Fallback: Check position in DOM (odd/even)
                // This is an efficient fallback that uses the message index from the already-queried list.
                isUser = messageIndex % 2 === 0;
                senderName = isUser ? 'Bạn' : 'Grok';
              }
            }
          }
          break;

        default:
          // Generic detection for other platforms
          const lowerText = text.toLowerCase();
          if (messageElement.querySelector('[role="user"]') ||
              messageElement.classList.contains('user') ||
              lowerText.includes('human:') ||
              lowerText.includes('user:')) {
            isUser = true;
            senderName = 'Bạn';
          }
          break;
      }

      // Truncate long messages for display
      const maxLength = 100;
      const truncatedText = text.length > maxLength ? 
        text.substring(0, maxLength) + '...' : text;

      return {
        isUser,
        sender: senderName,
        content: text,
        displayContent: truncatedText,
        length: text.length,
        messageId: messageId,
        element: messageElement
      };
    }

    // Helper methods for Grok detection
    guessByAlignment(el) {
      const alignSel = [
        '[class*="items-start"]', '[class*="items-end"]',
        '[class*="self-start"]', '[class*="self-end"]',
        '[class*="justify-start"]', '[class*="justify-end"]'
      ];
      const host = el.closest(alignSel.join(',')) || el.parentElement;
      if (!host) return null;
      const cls = host.className || '';
      if (/items-end|self-end|justify-end/.test(cls)) return 'user';
      if (/items-start|self-start|justify-start/.test(cls)) return 'assistant';
      return null;
    }

    guessByDataTestid(el) {
      const attrs = [
        el.getAttribute('data-testid'),
        el.closest('[data-testid]')?.getAttribute('data-testid')
      ].filter(Boolean).join(' ').toLowerCase();
      if (/assistant|bot|ai|grok/.test(attrs)) return 'assistant';
      if (/user|me|you/.test(attrs)) return 'user';
      return null;
    }

    guessByAria(el) {
      const aria = [
        el.getAttribute('aria-label'),
        el.getAttribute('aria-roledescription'),
        el.closest('[aria-label]')?.getAttribute('aria-label'),
        el.closest('[aria-roledescription]')?.getAttribute('aria-roledescription')
      ].filter(Boolean).join(' ').toLowerCase();
      if (/assistant|bot|ai|grok/.test(aria)) return 'assistant';
      if (/user|you|me|my message/.test(aria)) return 'user';
      return null;
    }

    destroy() {
      this.showAllMessages();
      this.clearProtectedMessages();
    }
  }

  // Show More Button
  class ShowMoreButton {
    constructor(onShowMore) {
      this.element = null;
      this.onShowMore = onShowMore;
      this.hiddenCount = 0;
    }

    create() {
      if (this.element) return;
      
      this.element = document.createElement('div');
      this.element.className = CSS_CLASSES.FLOATING_BTN;
      this.element.style.cssText = `
        position: fixed;
        top: 55px;
        right: 20px;
        z-index: 10000;
        background: white;
        color: black;
        border: none;
        border-radius: 8px;
        padding: 12px 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.2s ease;
        display: none;
      `;
      
      this.element.innerHTML = `
        <button style="background: none; border: none; color: inherit; cursor: pointer; font: inherit;">
          Show More (0)
        </button>
      `;
      
      this.element.addEventListener('click', () => {
        this.onShowMore();
      });

      document.body.appendChild(this.element);
    }

    updateCount(hiddenCount) {
      console.log(`[ShowMoreButton] Updating count to: ${hiddenCount}`);
      this.hiddenCount = hiddenCount;
      
      if (!this.element) {
        console.log(`[ShowMoreButton] No element found!`);
        return;
      }
      
      const button = this.element.querySelector('button');
      if (button) {
        button.textContent = `Show More (${hiddenCount})`;
        console.log(`[ShowMoreButton] Button text updated to: ${button.textContent}`);
      } else {
        console.log(`[ShowMoreButton] No button found in element!`);
      }
      
      // Show/hide button based on hidden count
      this.element.style.display = hiddenCount > 0 ? 'block' : 'none';
      console.log(`[ShowMoreButton] Button display: ${this.element.style.display}`);
    }

    destroy() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  }

  // Chat Observer
  class ChatObserver {
    constructor(onMessagesChange, onUrlChange) {
      this.onMessagesChange = onMessagesChange;
      this.onUrlChange = onUrlChange;
      this.observer = null;
      this.urlObserver = null;
      this.debounceTimeout = null;
      this.currentUrl = window.location.href;
    }

    startMessageObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }

      const chatContainer = DOMUtils.getChatContainer();
      if (!chatContainer) return;

      this.observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Chỉ kiểm tra khi có node mới được thêm vào (tin nhắn mới)
            const addedNodes = Array.from(mutation.addedNodes);
            const hasNewMessage = addedNodes.some(node => 
              node.nodeType === Node.ELEMENT_NODE && 
              node.textContent && 
              node.textContent.trim().length > 0
            );
            if (hasNewMessage) {
              shouldCheck = true;
            }
          }
        });

        if (shouldCheck) {
          // Debounce to avoid excessive calls
          clearTimeout(this.debounceTimeout);
          this.debounceTimeout = setTimeout(() => {
            if (this.onMessagesChange) {
              this.onMessagesChange();
            }
          }, 1000); // Tăng thời gian debounce
        }
      });

      this.observer.observe(chatContainer, {
        childList: true,
        subtree: true
      });
    }

    startUrlObserver() {
      this.urlObserver = setInterval(() => {
        if (window.location.href !== this.currentUrl) {
          this.currentUrl = window.location.href;
          setTimeout(() => {
            if (this.onUrlChange) {
              this.onUrlChange();
            }
          }, 1000);
        }
      }, 1000);
    }

    stop() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      
      if (this.urlObserver) {
        clearInterval(this.urlObserver);
        this.urlObserver = null;
      }
      
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
    }
  }

  // Main Universal AI Chat Optimizer
  class UniversalAIChatOptimizer {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.platform = null;
      this.messageManager = null;
      this.showMoreButton = null;
      this.observer = null;
      
      this.init();
    }

    async init() {
      // Detect current platform
      this.platform = PlatformDetector.getCurrentPlatform();
      
      if (!this.platform) {
        console.log('Universal AI Chat Optimizer: Unsupported platform');
        return;
      }
      
      console.log(`Universal AI Chat Optimizer: Initializing for ${this.platform.name}`);
      
      await this.loadSettings();
      
      // Check if this platform is enabled
      if (!this.settings.enabledSites || !this.settings.enabledSites[this.platform.key]) {
        console.log(`Universal AI Chat Optimizer: ${this.platform.name} is disabled in settings`);
        return;
      }
      
      console.log(`Universal AI Chat Optimizer: ${this.platform.name} is enabled, starting initialization`);
      
      this.initializeComponents();
      this.startObserving();
      
      // Process messages after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.processMessages();
      }, 1000);
    }

    initializeComponents() {
      this.messageManager = new MessageManager(this.settings);
      this.showMoreButton = new ShowMoreButton(() => this.handleShowMore());
      this.observer = new ChatObserver(
        () => this.handleMessagesChange(),
        () => this.handleUrlChange()
      );
    }

    startObserving() {
      this.showMoreButton.create();
      this.observer.startMessageObserver();
      this.observer.startUrlObserver();
    }

    async loadSettings() {
      try {
        const settings = await StorageUtils.loadSettings();
        this.settings = { ...this.settings, ...settings };
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    }

    handleShowMore() {
      const hiddenCount = this.messageManager.showMoreMessages();
      this.showMoreButton.updateCount(hiddenCount);
    }

    handleMessagesChange() {
      // Debounce để tránh gọi quá nhiều lần
      clearTimeout(this.processTimeout);
      this.processTimeout = setTimeout(() => {
        this.processMessages();
      }, 300);
    }

    handleUrlChange() {
      // Platform có thể thay đổi khi navigate
      const newPlatform = PlatformDetector.getCurrentPlatform();
      
      if (newPlatform && newPlatform.key !== this.platform?.key) {
        console.log(`Platform changed to: ${newPlatform.name}`);
        this.platform = newPlatform;
        
        // Reinitialize cho platform mới
        this.cleanup();
        setTimeout(() => {
          this.init();
        }, 1000);
      } else {
        // Cùng platform, chỉ reset state
        if (this.messageManager && this.messageManager.hiddenMessages) {
          this.messageManager.hiddenMessages.clear();
        }
        this.processMessages();
      }
    }

    processMessages() {
        if (!this.messageManager || !this.platform) return;
  
        const messages = DOMUtils.getMessages();
        console.log(`[${this.platform.name}] Found ${messages.length} messages`);
        
        const hiddenCount = this.messageManager.processMessages();
        console.log(`[${this.platform.name}] Hidden count: ${hiddenCount}`);
        
        this.showMoreButton.updateCount(hiddenCount);
    }

    async updateSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      
      if (this.messageManager) {
        this.messageManager.updateSettings(this.settings);
        
        // Show all messages first
        this.messageManager.showAllMessages();
        
        // Apply new settings
        setTimeout(() => {
          this.processMessages();
        }, 100);
      }
    }

    getStats() {
      if (!this.messageManager) {
        return { total: 0, hidden: 0, visible: 0, platform: this.platform?.name || 'Unknown' };
      }
      
      const stats = this.messageManager.getStats();
      return {
        ...stats,
        platform: this.platform.name
      };
    }

    getDetailedStats() {
      if (!this.messageManager) {
        return { 
          totalUser: 0, 
          totalAi: 0, 
          totalAll: 0, 
          messages: [], 
          platform: this.platform?.name || 'Unknown' 
        };
      }
      
      const detailedStats = this.messageManager.getDetailedStats();
      return {
        ...detailedStats,
        platform: this.platform.name
      };
    }

    cleanup() {
      if (this.observer) {
        this.observer.stop();
      }
      if (this.showMoreButton) {
        this.showMoreButton.destroy();
      }
      if (this.messageManager) {
        this.messageManager.destroy();
      }
      
      clearTimeout(this.processTimeout);
    }

    destroy() {
      this.cleanup();
    }
  }

  // Initialize the optimizer
  let aiOptimizer = null;

  const initOptimizer = () => {
    if (aiOptimizer) return;
    
    // Check if we're on a supported AI platform
    if (PlatformDetector.isSupportedSite()) {
      aiOptimizer = new UniversalAIChatOptimizer();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOptimizer);
  } else {
    initOptimizer();
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'pageLoaded') {
      initOptimizer();
      sendResponse({ success: true });
      return;
    }
    
    // Handler cho updateSettings
    if (request.action === 'updateSettings' && aiOptimizer) {
      aiOptimizer.updateSettings(request.settings);
      sendResponse({ success: true });
      return;
    }
    
    // Handler cho getStats
    if (request.action === 'getStats' && aiOptimizer) {
      const stats = aiOptimizer.getStats();
      sendResponse(stats);
      return;
    }
    
    // Handler cho getDetailedStats - QUAN TRỌNG cho Statistics tab
    if (request.action === 'getDetailedStats' && aiOptimizer) {
      const detailedStats = aiOptimizer.getDetailedStats();
      sendResponse(detailedStats);
      return;
    }

    if (request.action === 'scrollToMessage') {
      console.log('[ScrollToMessage] Starting with messageId:', request.messageId);
      
      const messageElement = document.querySelector(`[data-ai-optimizer-id="${request.messageId}"]`);
      
      if (!messageElement) {
        console.log('[ScrollToMessage] Message not found');
        sendResponse({ success: false, found: false });
        return true;
      }

      if (!aiOptimizer || !aiOptimizer.messageManager) {
        console.log('[ScrollToMessage] Optimizer not ready');
        sendResponse({ success: false, found: false });
        return true;
      }

      // Step 1: Show ALL messages using the optimized manager method
      console.log('[ScrollToMessage] Showing all messages...');
      const revealedCount = aiOptimizer.messageManager.hiddenMessages.size;
      aiOptimizer.messageManager.showAllMessages();
      
      // Update the "Show More" button count
      if (aiOptimizer.showMoreButton) {
        aiOptimizer.showMoreButton.updateCount(0);
      }
      
      // Step 2: Scroll to target message after a brief delay for rendering
      setTimeout(() => {
        console.log('[ScrollToMessage] Scrolling to target message...');
        
        messageElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Highlight the target message
        const originalStyle = {
          background: messageElement.style.background,
          border: messageElement.style.border,
          borderRadius: messageElement.style.borderRadius,
          boxShadow: messageElement.style.boxShadow,
          transition: messageElement.style.transition
        };
        
        messageElement.style.transition = 'all 0.3s ease';
        messageElement.style.background = '#fff3cd';
        messageElement.style.border = '2px solid #ffc107';
        messageElement.style.borderRadius = '8px';
        messageElement.style.boxShadow = '0 0 20px rgba(255, 193, 7, 0.5)';
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          messageElement.style.transition = 'all 0.5s ease';
          messageElement.style.background = originalStyle.background || '';
          messageElement.style.border = originalStyle.border || '';
          messageElement.style.borderRadius = originalStyle.borderRadius || '';
          messageElement.style.boxShadow = originalStyle.boxShadow || '';
        }, 3000);
      }, 500);
      
      sendResponse({ 
        success: true, 
        found: true, 
        revealedCount: revealedCount,
        newHiddenCount: 0
      });
      
      return true; // Indicate async response
    }
  });

})();
