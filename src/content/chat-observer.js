// Observer for DOM changes and URL navigation

import { DOMUtils } from '../shared/utils.js';
import { TIMINGS } from '../shared/constants.js';

export class ChatObserver {
  constructor(onMessagesChange, onUrlChange) {
    this.onMessagesChange = onMessagesChange;
    this.onUrlChange = onUrlChange;
    this.observer = null;
    this.urlObserver = null;
    this.debounceTimeout = null;
  }

  startMessageObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const chatContainer = DOMUtils.getChatContainer();
    if (!chatContainer) return;

    this.observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldCheck = true;
        }
      });

      if (shouldCheck) {
        // Debounce to avoid excessive calls
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = setTimeout(() => {
          if (this.onMessagesChange) {
            this.onMessagesChange();
          }
        }, TIMINGS.DEBOUNCE_DELAY);
      }
    });

    this.observer.observe(chatContainer, {
      childList: true,
      subtree: true
    });
  }

  startUrlObserver() {
    let lastUrl = location.href;
    
    this.urlObserver = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        if (this.onUrlChange) {
          setTimeout(() => {
            this.onUrlChange();
          }, TIMINGS.URL_CHANGE_DELAY);
        }
      }
    });

    this.urlObserver.observe(document, { 
      subtree: true, 
      childList: true 
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.urlObserver) {
      this.urlObserver.disconnect();
      this.urlObserver = null;
    }
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
  }
}
