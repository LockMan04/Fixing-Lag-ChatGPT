// Shared constants for Universal AI Chat Optimizer extension

export const DEFAULT_SETTINGS = {
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

export const SUPPORTED_SITES = {
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
  
// Comming soon
// DEEPSEEK: {
//   name: 'DeepSeek',
//   domains: ['chat.deepseek.com'],
//   selectors: {
//     messages: [
//       '.message-item',
//       '.chat-message',
//       '[data-message-id]'
//     ],
//     chatContainer: [
//       '.chat-container',
//       '.messages-container',
//       'main'
//     ],
//     protectedElements: 'form, input, textarea, [contenteditable="true"], .input-container'
//   }
// },
  
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

// Comming soon
//   PERPLEXITY: {
//     name: 'Perplexity',
//     domains: ['perplexity.ai'],
//     selectors: {
//       messages: [
//         '[data-testid="chat-message"]',
//         '.message-container',
//         '.chat-item'
//       ],
//       chatContainer: [
//         '.chat-container',
//         '[data-testid="chat-container"]',
//         'main'
//       ],
//       protectedElements: 'form, input, textarea, [contenteditable="true"], .search-bar'
//     }
//   }
};

export const CSS_CLASSES = {
  FLOATING_BTN: 'universal-ai-fixer-floating-btn',
  FLOATING_SHOW_MORE: 'universal-ai-floating-show-more',
  HIDDEN: 'universal-ai-fixer-hidden',
  EMPTY_HIDDEN: 'universal-ai-fixer-empty-hidden'
};

export const TIMINGS = {
  DEBOUNCE_DELAY: 500,
  URL_CHANGE_DELAY: 1000
};
