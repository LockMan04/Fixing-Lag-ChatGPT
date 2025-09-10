// Lớp Show More Button cho Universal AI Optimizer
// Chức năng: hiển thị nút "Show More" để người dùng có thể tải thêm tin nhắn ẩn trong cuộc trò chuyện AI

// Show More Button class for Universal AI Chat Optimizer
// Functionality: display a "Show More" button to allow users to load more hidden messages in the AI chat conversation

(function() {
  'use strict';
  
  // Export to global scope
  window.ShowMoreButton = class ShowMoreButton {
    constructor(onShowMore) {
      this.element = null;
      this.onShowMore = onShowMore;
      this.hiddenCount = 0;
    }

    create() {
      if (this.element) return;

      const CSS_CLASSES = window.UNIVERSAL_AI_CONSTANTS.CSS_CLASSES;
      
      this.element = document.createElement('div');
      this.element.className = CSS_CLASSES.FLOATING_BTN;
      this.element.style.cssText = `
        position: fixed;
        top: 55px;
        right: 20px;
        z-index: 10000;
        background: white;
        color: black;
        border: none;
        border-radius: 8px;
        padding: 12px 10px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        transition: all 0.2s ease;
        display: none;
      `;
      
      this.element.innerHTML = `
        <button style="background: none; border: none; color: inherit; cursor: pointer; font: inherit;">
          Show More (0)
        </button>
      `;
      
      this.element.addEventListener('click', () => this.onShowMore());
      document.body.appendChild(this.element);
    }

    updateCount(hiddenCount) {
      this.hiddenCount = hiddenCount;

      if (!this.element) return;

      const button = this.element.querySelector('button');
      if (button) button.textContent = `Show More (${hiddenCount})`;

      // Show/hide button based on hidden count
      this.element.style.display = hiddenCount > 0 ? 'block' : 'none';
    }

    destroy() {
      if (this.element?.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
    }
  };
})();
