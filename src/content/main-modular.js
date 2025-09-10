// Universal AI Optimizer - Main Content Script
// Modular version with separated classes
// Handles initialization, settings, and communication with popup
// Chức năng: khởi tạo, quản lý cài đặt và giao tiếp với popup

(function() {
  'use strict';
  
  // Use shared constants from global scope
  const DEFAULT_SETTINGS = window.UNIVERSAL_AI_CONSTANTS.DEFAULT_SETTINGS;

  // Main Universal AI Optimizer
  class UniversalAIChatOptimizer {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.platform = null;
      this.messageManager = null;
      this.showMoreButton = null;
      this.scrollTopButton = null;
      this.observer = null;
      
      this.init();
    }

    async init() {
      // Detect current platform
      this.platform = window.PlatformDetector.getCurrentPlatform();
      
      if (!this.platform) {
        return;
      }
      
      await this.loadSettings();
      
      // Check if this platform is enabled
      if (!this.settings.enabledSites || !this.settings.enabledSites[this.platform.key]) {
        return;
      }
      
      this.initializeComponents();
      this.startObserving();
      
      // Process messages after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.processMessages();
      }, 1000);
    }

    initializeComponents() {
      this.messageManager = new window.MessageManager(this.settings);
      
      // AI Studio handles its own lazy-loading, so no "Show More" button is needed
      if (this.platform.key !== 'aistudio') {
        this.showMoreButton = new window.ShowMoreButton(() => this.handleShowMore());
      }
      
      // Initialize scroll to top button for AI Studio
      if (this.platform.key === 'aistudio') {
        this.scrollTopButton = new window.ScrollToTop(['.hide-scrollbar']);
      }
      
      this.observer = new window.ChatObserver(
        () => this.handleMessagesChange(),
        () => this.handleUrlChange()
      );
    }

    startObserving() {
      if (this.showMoreButton) {
        this.showMoreButton.create();
      }
      if (this.scrollTopButton) {
        console.log('[Main] Creating scroll buttons');
        this.scrollTopButton.create();
        console.log('[Main] Scroll buttons created');
      } else {
        console.log('[Main] No scrollTopButton to create');
      }
      this.observer.startMessageObserver();
      this.observer.startUrlObserver();
    }

    async loadSettings() {
      try {
        const settings = await window.StorageUtils.loadSettings();
        this.settings = { ...this.settings, ...settings };
      } catch (error) {
        console.warn('Failed to load settings:', error);
      }
    }

    handleShowMore() {
      if (!this.showMoreButton) return;
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
      const newPlatform = window.PlatformDetector.getCurrentPlatform();
      
      if (newPlatform && newPlatform.key !== this.platform?.key) {
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

      const messages = window.DOMUtils.getMessages();
      const hiddenCount = this.messageManager.processMessages();
      
      if (this.showMoreButton) {
        this.showMoreButton.updateCount(hiddenCount);
      }
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
      
      console.log('[Main] Detailed stats received:', {
        totalUser: detailedStats.totalUser,
        totalAi: detailedStats.totalAi,
        totalAll: detailedStats.totalAll,
        messagesCount: detailedStats.messages?.length,
        platform: this.platform.name
        });
      
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
      if (this.scrollTopButton) {
        this.scrollTopButton.destroy();
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
    if (window.PlatformDetector.isSupportedSite()) {
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
    console.log('[Main] Message received from popup:', request.action);

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
      console.log('[Main] Getting basic stats');
      console.log('[Main] Basic stats:', stats);
      sendResponse(stats);
      return;
    }
    
    // Handler cho getDetailedStats - QUAN TRỌNG cho Statistics tab
    if (request.action === 'getDetailedStats' && aiOptimizer) {
        const detailedStats = aiOptimizer.getDetailedStats();
        console.log('[Main] Getting detailed stats for popup');
        console.log('[Main] Sending detailed stats to popup:', detailedStats);
      sendResponse(detailedStats);
      return;
    }

    if (request.action === 'scrollToMessage') {
      console.log('[Main] ScrollToMessage request:', request.messageId);
      
      const messageElement = document.querySelector(`[data-ai-optimizer-id="${request.messageId}"]`);
      console.log('[Main] Found message element:', !!messageElement);
      
      if (!messageElement) {
        console.log('[Main] Message element not found');
        sendResponse({ success: false, found: false });
        return true;
      }

      if (!aiOptimizer || !aiOptimizer.messageManager) {
        console.log('[Main] Optimizer not ready');
        sendResponse({ success: false, found: false });
        return true;
      }

      console.log('[Main] Revealing messages and scrolling...');
      const revealedCount = aiOptimizer.messageManager.hiddenMessages.size;
      aiOptimizer.messageManager.showAllMessages();
      
      // Update the "Show More" button count
      if (aiOptimizer.showMoreButton) {
        aiOptimizer.showMoreButton.updateCount(0);
      }
      
      // Step 2: Scroll to target message after a brief delay for rendering
      setTimeout(() => {
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
