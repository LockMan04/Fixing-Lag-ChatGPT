// Chia sẻ các hằng số cho tiện ích mở rộng Universal AI Optimizer
// Tương thích với cả content script và background script

// Shared constants for Universal AI Optimizer extension
// Compatible with both content scripts and background scripts

// Detect environment: service worker vs web page
const globalScope = (typeof window !== 'undefined') ? window : self;

globalScope.UNIVERSAL_AI_CONSTANTS = {
  DEFAULT_SETTINGS: {
    isEnabled: true,
    hideEmpty: true,
    maxMessages: 10,
    showMoreCount: 5,
    enabledSites: {
      chatgpt: true,
      claude: true,
      grok: true,
      aistudio: true
    }
  },

  SUPPORTED_SITES: {
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
          '[data-test-render-count] > div',
          'main div.group.relative'
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

    AISTUDIO: {
      name: 'Google AI Studio',
      domains: ['aistudio.google.com'],
      selectors: {
        // Chính xác theo DOM structure thực tế của AI Studio
        messages: [
          '.user-prompt-container[data-turn-role="User"]',  // User messages
          '.model-prompt-container[data-turn-role="Model"]'  // Model messages
        ],
        // Chat turn containers - mỗi turn là 1 conversation unit
        turns: [
          'ms-chat-turn[id^="turn-"]'  // Mỗi turn có unique ID
        ],
        // Container chính để observe lazy loading
        chatContainer: [
          'ms-chat-conversation',
          '.chat-container',
          '[role="main"]',
          'body'
        ],
        // Lazy load observer targets
        lazyLoadObserver: [
          'ms-chat-turn',
          '.chat-turn-container',
          '.ng-star-inserted'
        ],
        protectedElements: 'form, input, textarea, [contenteditable="true"], [role="textbox"], .input-container, .compose-area, button, .actions-container'
      }
    }
  },

  CSS_CLASSES: {
    FLOATING_BTN: 'universal-ai-fixer-floating-btn',
    FLOATING_SHOW_MORE: 'universal-ai-floating-show-more',
    HIDDEN: 'universal-ai-fixer-hidden',
    EMPTY_HIDDEN: 'universal-ai-fixer-empty-hidden'
  },

  TIMINGS: {
    DEBOUNCE_DELAY: 500,
    URL_CHANGE_DELAY: 1000
  }
};
