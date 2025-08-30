// Optimized Show More Button với z-index handling tốt hơn
export class ShowMoreButtonV2 {
  constructor(onShowMore) {
    this.element = null;
    this.onShowMore = onShowMore;
    this.hiddenCount = 0;
    this.targetContainer = null;
  }

  create() {
    if (this.element) return;

    // Tìm container phù hợp thay vì append vào body
    this.targetContainer = this.findBestContainer();
    
    this.element = document.createElement('div');
    this.element.className = 'lag-fixer-show-more-container';
    
    // Wrapper để control z-index tốt hơn
    this.element.innerHTML = `
      <div class="lag-fixer-show-more-wrapper">
        <button class="lag-fixer-show-more-btn" aria-label="Show more hidden messages">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <span class="btn-text">Show More</span>
          <span class="btn-count">(${this.hiddenCount})</span>
        </button>
      </div>
    `;
    
    // Event delegation
    this.element.addEventListener('click', (e) => {
      if (e.target.closest('.lag-fixer-show-more-btn')) {
        this.handleClick();
      }
    });

    // Insert vào đúng vị trí
    this.insertButton();
    
    // Observe DOM changes để re-position nếu cần
    this.observePosition();
  }

  findBestContainer() {
    // Tìm container tốt nhất cho button
    const candidates = [
      // ChatGPT main area
      document.querySelector('main > div > div'),
      document.querySelector('[role="main"]'),
      document.querySelector('.relative.flex.h-full'),
      // Fallback
      document.querySelector('main'),
      document.body
    ];

    for (const container of candidates) {
      if (container && this.isValidContainer(container)) {
        return container;
      }
    }
    
    return document.body;
  }

  isValidContainer(container) {
    // Check xem container có phù hợp không
    const rect = container.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && 
           !container.querySelector('form, input, textarea');
  }

  insertButton() {
    if (!this.element || !this.targetContainer) return;
    
    // Tính toán z-index phù hợp
    const maxZIndex = this.calculateMaxZIndex();
    this.element.style.setProperty('--max-z-index', maxZIndex + 1);
    
    // Insert theo vị trí phù hợp
    if (this.targetContainer === document.body) {
      document.body.appendChild(this.element);
    } else {
      // Insert as first child để không bị che bởi content
      this.targetContainer.insertBefore(
        this.element, 
        this.targetContainer.firstChild
      );
    }
  }

  calculateMaxZIndex() {
    // Tìm z-index cao nhất trong page
    const elements = document.querySelectorAll('*');
    let maxZ = 0;
    
    elements.forEach(el => {
      const z = window.getComputedStyle(el).zIndex;
      if (z !== 'auto') {
        const value = parseInt(z, 10);
        if (!isNaN(value) && value > maxZ) {
          maxZ = value;
        }
      }
    });
    
    // ChatGPT thường dùng z-index ~1000-2000 cho modals
    return Math.max(maxZ, 9999);
  }

  observePosition() {
    // Monitor container changes
    const observer = new MutationObserver(() => {
      if (!document.body.contains(this.element)) {
        // Re-insert nếu bị remove
        this.insertButton();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  updateCount(count) {
    this.hiddenCount = count;
    
    if (!this.element) return;
    
    const countSpan = this.element.querySelector('.btn-count');
    const wrapper = this.element.querySelector('.lag-fixer-show-more-wrapper');
    
    if (count > 0) {
      if (countSpan) {
        countSpan.textContent = `(${count})`;
      }
      wrapper.style.display = 'flex';
      
      // Animate entrance
      wrapper.classList.add('show');
    } else {
      wrapper.style.display = 'none';
      wrapper.classList.remove('show');
    }
  }

  handleClick() {
    if (this.onShowMore) {
      // Add click feedback
      const btn = this.element.querySelector('.lag-fixer-show-more-btn');
      btn.classList.add('clicking');
      
      setTimeout(() => {
        btn.classList.remove('clicking');
      }, 200);
      
      this.onShowMore();
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      this.element = null;
    }
    this.targetContainer = null;
  }
}