// Lớp DOM Utilities cho Universal AI Optimizer
// Chức năng: cung cấp các phương thức tiện ích để tương tác với DOM của các nền tảng trò chuyện AI khác nhau

// DOM Utilities class for Universal AI Chat Optimizer
// Functionality: provide utility methods to interact with the DOM of various AI chat platforms

(function() {
  'use strict';
  
  // Export to global scope
  window.DOMUtils = class DOMUtils {
    static getChatContainer() {
      const platform = window.PlatformDetector.getPlatformConfig();
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
      const platform = window.PlatformDetector.getPlatformConfig();
      if (!platform) {
        return [];
      }

      const { selectors } = platform;
      const protectedSel = selectors.protectedElements;

      // Cho AI Studio, ưu tiên messages thay vì turns để quản lý ẩn/hiện
      let querySelectors;
      if (platform.name === 'Google AI Studio') {
        querySelectors = selectors.messages; // Luôn dùng messages cho AI Studio
      } else {
        // Use 'turns' selectors if available, otherwise use 'messages' selectors
        querySelectors = (selectors.turns && selectors.turns.length) ? selectors.turns : selectors.messages;
      }
      
      if (!querySelectors || querySelectors.length === 0) {
        return [];
      }

      // Combine all selectors into a single query for efficiency
      const combinedSelector = querySelectors.join(', ');

      const allMessages = Array.from(document.querySelectorAll(combinedSelector));

      // Using a Set to automatically handle duplicates from overlapping selectors
      const uniqueMessages = new Set(allMessages);

      const filtered = Array.from(uniqueMessages).filter(message => {
        // Pass platform to avoid re-detecting it
        const isValid = window.MessageValidator.isValidMessage(message, platform);
        const isProtected = protectedSel && (message.querySelector(protectedSel) || message.closest(protectedSel));
        
        return isValid && !isProtected;
      });

      return filtered;
    }
  };
})();
