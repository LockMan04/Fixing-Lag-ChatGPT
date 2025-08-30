// Shared constants for Fixing lag ChatGPT extension

export const DEFAULT_SETTINGS = {
  isEnabled: true,
  hideEmpty: true,
  maxMessages: 50,
  showMoreCount: 20
};

export const SELECTORS = {
  // ChatGPT message selectors
  CONVERSATION_TURN: 'article[data-testid*="conversation-turn"]',
  CONVERSATION_TURN_SAFE: 'article[data-testid*="conversation-turn"]:not([data-testid*="input"]):not([data-testid*="form"])',
  TURN_ID: 'article[data-turn-id]',
  
  // Chat container selectors
  CHAT_CONTAINERS: [
    '[data-testid="conversation-turn"]',
    '.flex.flex-col.gap-2',
    'main [role="main"]',
    '.conversation',
    '[class*="conversation"]'
  ],
  
  // UI elements to protect
  PROTECTED_ELEMENTS: 'form, input, textarea, button[type="submit"], [contenteditable="true"], [role="textbox"], nav, header, aside, .top-bar, .sidebar'
};

export const CSS_CLASSES = {
  FLOATING_BTN: 'lag-fixer-floating-btn',
  FLOATING_SHOW_MORE: 'floating-show-more',
  HIDDEN: 'lag-fixer-hidden',
  EMPTY_HIDDEN: 'lag-fixer-empty-hidden'
};

export const DOMAINS = {
  OPENAI: 'chat.openai.com',
  CHATGPT: 'chatgpt.com'
};

export const TIMINGS = {
  DEBOUNCE_DELAY: 500,
  URL_CHANGE_DELAY: 1000
};
