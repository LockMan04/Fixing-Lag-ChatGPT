// Lớp chat observe cho Universal AI Optimizer
// Chức năng: quan sát các thay đổi trong cuộc trò chuyện và URL để kích hoạt các hành động tương ứng

// Chat Observer class for Universal AI Chat Optimizer
// Functionality: observe changes in chat and URL to trigger corresponding actions

(function() {
  'use strict';
  
  // Export to global scope
  window.ChatObserver = class ChatObserver {
    constructor(onMessagesChange, onUrlChange) {
      this.onMessagesChange = onMessagesChange;
      this.onUrlChange = onUrlChange;
      this.observer = null;
      this.lazyLoadObserver = null;
      this.urlObserver = null;
      this.debounceTimeout = null;
      this.currentUrl = window.location.href;
      this.processedElements = new Set(); // Track đã xử lý để tránh duplicate
    }

    startMessageObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }

      const chatContainer = window.DOMUtils.getChatContainer();
      if (!chatContainer) return;

      // Khởi tạo lazy load observer cho Google AI Studio
      this.initLazyLoadObserver();

      this.observer = new MutationObserver((mutations) => {
        let shouldCheck = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Chỉ kiểm tra khi có node mới được thêm vào (tin nhắn mới)
            const addedNodes = Array.from(mutation.addedNodes);
            const hasNewMessage = addedNodes.some(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Kiểm tra unique để tránh duplicate
                const elementId = this.getElementId(node);
                if (!this.processedElements.has(elementId) && 
                    node.textContent && 
                    node.textContent.trim().length > 0) {
                  this.processedElements.add(elementId);
                  return true;
                }
              }
              return false;
            });
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

    // Khởi tạo Intersection Observer cho lazy loading (Google AI Studio)
    initLazyLoadObserver() {
      const platformConfig = window.PlatformDetector.getCurrentPlatform();
      if (!platformConfig || platformConfig.name !== 'Google AI Studio') return;

      // Tạo Intersection Observer để detect lazy loaded content
      this.lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Element xuất hiện trong viewport, trigger check messages
            const element = entry.target;
            
            // Chỉ trigger nếu element có content mới (không rỗng)
            if (element.textContent?.trim().length > 0) {
              setTimeout(() => {
                if (this.onMessagesChange) {
                  this.onMessagesChange();
                }
              }, 300); // Giảm delay cho responsive hơn
            }
          }
        });
      }, {
        root: null,
        rootMargin: '100px', // Tăng margin để detect sớm hơn
        threshold: 0.1
      });

      // Observe các ms-chat-turn elements khi chúng được tạo
      this.observeExistingTurns();
      
      // Setup observer để watch cho turns mới được thêm vào
      this.setupNewTurnObserver();
    }

    // Observe các turn hiện có
    observeExistingTurns() {
      const existingTurns = document.querySelectorAll('ms-chat-turn[id^="turn-"]');
      existingTurns.forEach(turn => {
        if (this.lazyLoadObserver) {
          this.lazyLoadObserver.observe(turn);
        }
      });
    }

    // Setup observer để watch cho turns mới
    setupNewTurnObserver() {
      const chatContainer = document.querySelector('ms-chat-conversation') || 
                          document.querySelector('[role="main"]') || 
                          document.body;

      if (chatContainer && this.lazyLoadObserver) {
        const newTurnObserver = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Nếu là ms-chat-turn mới, observe nó
                if (node.tagName === 'MS-CHAT-TURN' && node.id?.startsWith('turn-')) {
                  this.lazyLoadObserver.observe(node);
                }
                
                // Hoặc tìm ms-chat-turn trong subtree
                const newTurns = node.querySelectorAll?.('ms-chat-turn[id^="turn-"]');
                newTurns?.forEach(turn => {
                  this.lazyLoadObserver.observe(turn);
                });
              }
            });
          });
        });

        newTurnObserver.observe(chatContainer, {
          childList: true,
          subtree: true
        });

        // Store reference để có thể disconnect sau
        this.newTurnObserver = newTurnObserver;
      }
    }

    // Tạo unique ID cho element để track đã xử lý
    getElementId(element) {
      return element.id || 
             element.getAttribute('data-turn-id') || 
             element.getAttribute('data-message-id') ||
             `${element.tagName}-${element.textContent?.substring(0, 50).replace(/\s+/g, '')}`;
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
      
      if (this.lazyLoadObserver) {
        this.lazyLoadObserver.disconnect();
        this.lazyLoadObserver = null;
      }
      
      if (this.newTurnObserver) {
        this.newTurnObserver.disconnect();
        this.newTurnObserver = null;
      }
      
      if (this.urlObserver) {
        clearInterval(this.urlObserver);
        this.urlObserver = null;
      }
      
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
      }
      
      // Clear processed elements set
      this.processedElements.clear();
    }
  };
})();
