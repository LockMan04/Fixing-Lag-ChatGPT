// Lớp phát hiện nền tảng cho Universal AI Optimizer
// Chức năng: xác định nền tảng trò chuyện AI hiện tại dựa trên tên miền và cung cấp cấu hình tương ứng

// Platform Detector class for Universal AI Chat Optimizer
// Functionality: detect the current AI chat platform based on domain and provide corresponding configuration

(function() {
  'use strict';
  
  // Export to global scope
  window.PlatformDetector = class PlatformDetector {
    static getCurrentPlatform() {
      const hostname = window.location.hostname;

      const SUPPORTED_SITES = window.UNIVERSAL_AI_CONSTANTS.SUPPORTED_SITES;
      
      for (const [key, site] of Object.entries(SUPPORTED_SITES)) {
        if (site.domains.some(domain => hostname.includes(domain))) {
          return {
            key: key.toLowerCase(),
            name: site.name,
            config: site
          };
        }
      }
      return null;
    }
    
    static isSupportedSite() {
      return this.getCurrentPlatform() !== null;
    }
    
    static getPlatformConfig() {
      const platform = this.getCurrentPlatform();
      return platform ? platform.config : null;
    }
  };
})();
