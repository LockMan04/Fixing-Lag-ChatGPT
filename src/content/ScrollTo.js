// Lớp Scroll To Top/Bottom cho Universal AI Optimizer
// Hiển thị 2 nút: ↑ (về đầu) và ↓ (xuống cuối) — gắn vào body

(function () {
  'use strict';

  window.ScrollToTop = class ScrollToTop {
    constructor(scrollContainerSelectors) {
      this.btnTop = null;
      this.btnBottom = null;
      this.visibleTop = false;
      this.visibleBottom = false;
      this.scrollContainer = null;

      this.scrollContainerSelectors =
        scrollContainerSelectors && scrollContainerSelectors.length > 0
          ? scrollContainerSelectors
          : ['.hide-scrollbar', 'body', 'html'];

      this.scrollListener = this.handleScroll.bind(this);
    }

    findScrollContainer() {
      for (const selector of this.scrollContainerSelectors) {
        const el = document.querySelector(selector);
        if (el) return el;
      }
      return window; // fallback
    }

    create() {
      if (this.btnTop || this.btnBottom) return;

      // Chọn container để lắng nghe scroll
      this.scrollContainer = this.findScrollContainer();
      const isWindow = this.scrollContainer === window;

      // Nút ↑
      this.btnTop = document.createElement('div');
      this.btnTop.className = 'universal-ai-scroll-to-top';
      this.btnTop.style.cssText = `
        position: fixed;
        top: 60px;
        right: 20px;
        z-index: 999;
        background: #333;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: opacity .2s ease;
        opacity: 1;
        pointer-events: auto;
      `;
      this.btnTop.textContent = '↑';
      this.btnTop.addEventListener('click', (e) => {
        e.stopPropagation();

        const targets = document.querySelectorAll('.hide-scrollbar');
        if (targets.length > 0) {
          targets.forEach(el => el.scrollTo({ top: 0, behavior: 'smooth' }));
        } else {
          const doc = document.scrollingElement || document.documentElement || document.body;
          doc.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });

      // Nút ↓
      this.btnBottom = document.createElement('div');
      this.btnBottom.className = 'universal-ai-scroll-to-bottom';
      this.btnBottom.style.cssText = `
        position: fixed;
        top: 112px;
        right: 20px;
        z-index: 999;
        background: #333;
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: opacity .2s ease;
        opacity: 1;
        pointer-events: auto;
      `;
      this.btnBottom.textContent = '↓';
      this.btnBottom.addEventListener('click', (e) => {
        e.stopPropagation();

        const targets = document.querySelectorAll('.hide-scrollbar');
        if (targets.length > 0) {
          targets.forEach(el =>
            el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
          );
        } else {
          const doc = document.scrollingElement || document.documentElement || document.body;
          doc.scrollTo({ top: doc.scrollHeight, behavior: 'smooth' });
        }
      });

      // Gắn vào body
      document.body.appendChild(this.btnTop);
      document.body.appendChild(this.btnBottom);

      // Lắng nghe scroll
      this.scrollContainer.addEventListener('scroll', this.scrollListener, { passive: true });

      // Trạng thái ban đầu
      this.handleScroll();
    }

    handleScroll() {
      const isWindow = this.scrollContainer === window;
      const scrollTop = isWindow
        ? window.scrollY
        : this.scrollContainer.scrollTop;

      // Kiểm tra cuối trang/container
      let atBottom = false;
      if (isWindow) {
        const doc = document.scrollingElement || document.documentElement || document.body;
        atBottom = doc.scrollHeight - (window.scrollY + window.innerHeight) <= 2;
      } else {
        const el = this.scrollContainer;
        atBottom = el.scrollHeight - (el.scrollTop + el.clientHeight) <= 2;
      }

      // Hiện/ẩn ↑
      const showTop = scrollTop > 200;
      if (showTop !== this.visibleTop) {
        this.visibleTop = showTop;
        this.btnTop.style.opacity = showTop ? '1' : '0';
        this.btnTop.style.pointerEvents = showTop ? 'auto' : 'none';
      }

      // Hiện/ẩn ↓
      const showBottom = !atBottom;
      if (showBottom !== this.visibleBottom) {
        this.visibleBottom = showBottom;
        this.btnBottom.style.opacity = showBottom ? '1' : '0';
        this.btnBottom.style.pointerEvents = showBottom ? 'auto' : 'none';
      }
    }

    destroy() {
      if (this.btnTop?.parentNode) this.btnTop.parentNode.removeChild(this.btnTop);
      if (this.btnBottom?.parentNode) this.btnBottom.parentNode.removeChild(this.btnBottom);
      if (this.scrollContainer && this.scrollListener) {
        this.scrollContainer.removeEventListener('scroll', this.scrollListener);
      }
      this.btnTop = null;
      this.btnBottom = null;
      this.scrollContainer = null;
    }
  };
})();
