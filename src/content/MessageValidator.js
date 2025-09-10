// Lớp Message Validator cho Universal AI Optimizer
// Chức năng: xác thực các phần tử tin nhắn để đảm bảo chúng là tin nhắn hợp lệ trong cuộc trò chuyện AI

// Message Validator class for Universal AI Chat Optimizer
// Functionality: validate message elements to ensure they are legitimate messages in the AI chat conversation

(function() {
  'use strict';
  
  // Export to global scope
  window.MessageValidator = class MessageValidator {
    static isValidMessage(message, platformConfig) {
      if (!message || !message.textContent) return false;
      
      // Use passed platform config, or detect it if not provided
      const platform = platformConfig || window.PlatformDetector.getPlatformConfig();
      if (!platform) return false;
      
      // Đặc biệt xử lý cho Google AI Studio
      if (platform.name === 'Google AI Studio') {
        return this.validateAIStudioMessage(message);
      }
      
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

    // Validation riêng cho AI Studio
    static validateAIStudioMessage(message) {
      // Kiểm tra xem có phải là user hoặc model message container không
      const isUserMessage = message.classList.contains('user-prompt-container') && 
                           message.getAttribute('data-turn-role') === 'User';
      const isModelMessage = message.classList.contains('model-prompt-container') && 
                            message.getAttribute('data-turn-role') === 'Model';
      
      if (!isUserMessage && !isModelMessage) {
        return false;
      }
      
      // Kiểm tra có content thực sự không (trong .turn-content)
      const turnContent = message.querySelector('.turn-content');
      if (!turnContent) return false;
      
      // Lấy text từ ms-prompt-chunk content
      const promptChunk = turnContent.querySelector('ms-prompt-chunk');
      const textContent = promptChunk ? promptChunk.textContent?.trim() : '';
      
      if (!textContent || textContent.length < 2) {
        return false;
      }
      
      // Skip loading states
      const loadingPatterns = ['loading', 'typing', 'thinking', 'generating'];
      if (loadingPatterns.some(pattern => textContent.toLowerCase().includes(pattern))) {
        return false;
      }
      
      return true;
    }
  };
})();
