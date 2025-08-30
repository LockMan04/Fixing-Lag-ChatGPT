// Optimized Message Manager với IntersectionObserver
import { CSS_CLASSES } from '../shared/constants.js';

export class MessageManagerV2 {
  constructor(settings) {
    this.settings = settings;
    this.hiddenMessages = new Set();
    this.observer = null;
    this.messageMap = new WeakMap();
    this.initObserver();
  }

  initObserver() {
    // IntersectionObserver để track messages trong viewport
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const message = entry.target;
          const messageData = this.messageMap.get(message) || {};
          
          // Track vị trí và visibility
          messageData.isInViewport = entry.isIntersecting;
          messageData.intersectionRatio = entry.intersectionRatio;
          this.messageMap.set(message, messageData);
        });
      },
      {
        root: null,
        rootMargin: '100px', // Buffer area
        threshold: [0, 0.1, 0.5, 1.0]
      }
    );
  }

  processMessages() {
    if (!this.settings.isEnabled) return 0;

    const messages = this.getMessages();
    const totalMessages = messages.length;
    
    if (totalMessages <= this.settings.maxMessages) {
      this.showAllMessages();
      return 0;
    }

    // Tính toán messages cần ẩn
    const keepCount = this.settings.maxMessages;
    const hideCount = totalMessages - keepCount;
    
    messages.forEach((message, index) => {
      if (index < hideCount) {
        this.hideMessage(message);
      } else {
        this.showMessage(message);
      }
      
      // Start observing cho performance tracking
      this.observer.observe(message);
    });

    return this.hiddenMessages.size;
  }

  hideMessage(message) {
    if (!message || this.hiddenMessages.has(message)) return;
    
    // Dùng CSS transforms thay vì display:none để performance tốt hơn
    message.style.cssText = `
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      visibility: hidden !important;
      pointer-events: none !important;
      height: 0 !important;
      overflow: hidden !important;
    `;
    
    message.classList.add(CSS_CLASSES.HIDDEN);
    message.setAttribute('aria-hidden', 'true');
    this.hiddenMessages.add(message);
  }

  showMessage(message) {
    if (!message || !this.hiddenMessages.has(message)) return;
    
    // Reset styles
    message.style.cssText = '';
    message.classList.remove(CSS_CLASSES.HIDDEN);
    message.removeAttribute('aria-hidden');
    this.hiddenMessages.delete(message);
  }

  showMoreMessages() {
    const hiddenArray = Array.from(this.hiddenMessages);
    const toShow = hiddenArray.slice(-this.settings.showMoreCount);
    
    toShow.forEach(message => this.showMessage(message));
    
    return this.hiddenMessages.size;
  }

  showAllMessages() {
    this.hiddenMessages.forEach(message => this.showMessage(message));
    this.hiddenMessages.clear();
  }

  getMessages() {
    // Selector đơn giản và robust hơn
    const selectors = [
      '[data-testid^="conversation-turn-"]',
      'article[data-turn-id]',
      '.group.w-full' // Fallback selector ChatGPT hay dùng
    ];

    for (const selector of selectors) {
      const messages = document.querySelectorAll(selector);
      if (messages.length > 0) {
        // Filter chỉ lấy messages thực sự, skip UI elements
        return Array.from(messages).filter(el => {
          // Skip nếu là input area
          if (el.querySelector('textarea, [contenteditable="true"]')) return false;
          // Skip nếu quá ngắn (loading states)
          const text = el.textContent?.trim() || '';
          return text.length > 2;
        });
      }
    }
    
    return [];
  }

  hideEmptyMessages() {
    if (!this.settings.hideEmpty) return;
    
    const messages = this.getMessages();
    messages.forEach(message => {
      const text = message.textContent?.trim() || '';
      // Pattern cho empty/loading messages
      const emptyPatterns = [
        /^(typing|loading|thinking|generating)\.{0,3}$/i,
        /^\.{3,}$/,
        /^\s*$/
      ];
      
      if (emptyPatterns.some(pattern => pattern.test(text))) {
        message.classList.add(CSS_CLASSES.EMPTY_HIDDEN);
        message.style.display = 'none';
      }
    });
  }

  getStats() {
    const allMessages = this.getMessages();
    const visibleCount = allMessages.length - this.hiddenMessages.size;
    
    return {
      total: allMessages.length,
      hidden: this.hiddenMessages.size,
      visible: visibleCount,
      performance: {
        memoryUsage: this.hiddenMessages.size * 100, // Estimate bytes
        observing: this.messageMap.size
      }
    };
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.processMessages();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.showAllMessages();
    this.messageMap = new WeakMap();
  }
}