// Lớp Storage Utilities cho Universal AI Optimizer
// Chức năng: cung cấp các phương thức tiện ích để lưu trữ và truy xuất cài đặt người dùng từ bộ nhớ mở rộng trình duyệt

// Storage Utilities class for Universal AI Chat Optimizer
// Functionality: provide utility methods to save and retrieve user settings from browser extension storage

(function() {
  'use strict';
  
  // Export to global scope
  window.StorageUtils = class StorageUtils {
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

    // Save current active tab
    static async saveActiveTab(tabName) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: 'saveActiveTab', 
          tabName 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Save active tab error:', chrome.runtime.lastError);
            resolve(false);
            return;
          }
          resolve(response);
        });
      });
    }

    // Load current active tab
    static async loadActiveTab() {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getActiveTab' }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Load active tab error:', chrome.runtime.lastError);
            resolve('settings'); // default tab
            return;
          }
          resolve(response || 'settings');
        });
      });
    }
  };
})();
