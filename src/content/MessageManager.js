// Message Manager (optimized) for Universal AI Chat Optimizer
// - Faster DOM ops (batching, fewer queries)
// - Safer state (WeakSet/WeakMap, GC-friendly)
// - Smarter de-duplication (content hashing + role-aware)
// - Robust platform detection (one-time per pass)
// - Defensive settings, stale-node cleanup, deterministic showMore

// Quản lý tin nhắn (tối ưu) cho Universal AI Chat Optimizer
// - Tối ưu thao tác DOM (gộp, giảm truy vấn)
// - Trạng thái an toàn hơn (WeakSet/WeakMap, thân thiện với GC)
// - Loại bỏ trùng lặp thông minh hơn (băm nội dung + nhận biết vai trò)
// - Phát hiện nền tảng vững chắc (một lần mỗi lượt)
// - Cài đặt phòng thủ, dọn dẹp nút lỗi thời, hiển thị showMore xác định

(function () {
  'use strict';

  const DEFAULTS = Object.freeze({
    isEnabled: true,
    maxMessages: 30,
    hideEmpty: true,
    showMoreCount: 10,
  });

  // Small, fast string hash (djb2)
  const hashStr = (s) => {
    let h = 5381, i = s.length;
    while (i) h = (h * 33) ^ s.charCodeAt(--i);
    return (h >>> 0).toString(36);
  };

  // Read once per pass to avoid repeated global lookups
  const getGlobals = () => ({
    CSS_CLASSES: window.UNIVERSAL_AI_CONSTANTS?.CSS_CLASSES || {
      HIDDEN: 'aiopt-hidden',
      EMPTY_HIDDEN: 'aiopt-empty-hidden',
    },
    DOMUtils: window.DOMUtils,
    PlatformDetector: window.PlatformDetector,
  });

  // Stable index cache to ensure deterministic showMore order
  const getDomIndex = (el) => {
    const parent = el?.parentNode;
    if (!parent) return -1;
    let i = 0, n = parent.firstElementChild;
    while (n) { if (n === el) return i; i++; n = n.nextElementSibling; }
    return -1;
  };

  // Safely get trimmed text content with a cheap fast path
  const getTrimText = (el) => (el && el.textContent ? el.textContent.trim() : '');

  // Role constants
  const ROLE = Object.freeze({ user: 'user', assistant: 'assistant' });

  // Per-element auto-unprotect timers
  const protectTimers = new WeakMap();

  // GC-friendly sets
  const makeWeakSet = () => new WeakSet();

  class MessageManager {
    constructor(settings) {
      this.settings = this.#mergeSettings(settings);
      this.hiddenMessages = makeWeakSet();
      this.protectedMessages = makeWeakSet();
      this._lastIdCounter = 0; // cheaper than Date.now() per message
    }

    #mergeSettings(s) {
      const merged = { ...DEFAULTS, ...(s || {}) };
      merged.maxMessages = this.#clampInt(merged.maxMessages, 1, 10_000, DEFAULTS.maxMessages);
      merged.showMoreCount = this.#clampInt(merged.showMoreCount, 1, 5_000, DEFAULTS.showMoreCount);
      merged.isEnabled = !!merged.isEnabled;
      merged.hideEmpty = !!merged.hideEmpty;
      return merged;
    }

    #clampInt(v, min, max, d) {
      v = Number.isFinite(+v) ? Math.floor(+v) : d;
      return Math.min(max, Math.max(min, v));
    }

    updateSettings(settings) { this.settings = this.#mergeSettings(settings); }

    // ====== De-dup for Google AI Studio ======
    deduplicateAIStudioMessages() {
      const { PlatformDetector } = getGlobals();
      const platform = PlatformDetector?.getCurrentPlatform();
      if (!platform || platform.name !== 'Google AI Studio') return;

      // 1) remove duplicate turns by id
      const allTurns = document.querySelectorAll('ms-chat-turn[id^="turn-"]');
      const seenTurnIds = new Set();
      const dupTurns = [];
      for (const t of allTurns) {
        const id = t.id;
        if (!id) continue;
        (seenTurnIds.has(id) ? dupTurns : seenTurnIds).add?.(id) || dupTurns.push(t);
      }
      for (const t of dupTurns) t.remove();

      // 2) remove duplicate content within user/model groups (role-aware hashing)
      const groups = [
        { sel: '.user-prompt-container[data-turn-role="User"]', role: ROLE.user },
        { sel: '.model-prompt-container[data-turn-role="Model"]', role: ROLE.assistant },
      ];

      for (const g of groups) {
        const els = document.querySelectorAll(g.sel);
        this.#removeDuplicatesByContent(els, g.role);
      }
    }

    #extractAISContent(el) {
      // AI Studio content path: .turn-content > ms-prompt-chunk ms-text-chunk
      const contentEl = el?.querySelector?.('.turn-content ms-prompt-chunk ms-text-chunk');
      return getTrimText(contentEl || el);
    }

    #removeDuplicatesByContent(nodeList, role) {
      const seen = new Set();
      const toRemove = [];
      for (const el of nodeList) {
        const content = this.#extractAISContent(el);
        if (content && content.length > 10) {
          const key = role + ':' + hashStr(content);
          if (seen.has(key)) toRemove.push(el); else seen.add(key);
        }
      }
      for (const el of toRemove) {
        const turn = el.closest?.('ms-chat-turn');
        (turn || el).remove();
      }
    }

    // ====== Core processing ======
    processMessages() {
      const s = this.settings;
      if (!s.isEnabled) return 0;

      this.deduplicateAIStudioMessages();

      const { CSS_CLASSES, DOMUtils } = getGlobals();
      const messages = DOMUtils.getMessages(); // Assume returns Node[] newest last
      const total = messages.length;

      // Clean hidden set from stale nodes to avoid counting removed ones
      this.#pruneHidden(messages);

      if (total <= s.maxMessages) {
        this.showAllMessages();
        return 0;
      }

      const keep = s.maxMessages;
      const hideCount = total - keep; // hide oldest first

      // Single read phase finished; write phase in a frame for smoother UX
      // If rAF not needed, we can apply immediately; keeping direct apply for simplicity
      for (let i = 0; i < total; i++) {
        const msg = messages[i];
        if (!msg?.isConnected) continue;

        const isProtected = this.protectedMessages.has(msg);
        if (i < hideCount && !isProtected) {
          // hide
          if (!msg.classList.contains(CSS_CLASSES.HIDDEN) && !msg.classList.contains(CSS_CLASSES.EMPTY_HIDDEN)) {
            const isEmpty = s.hideEmpty && this.isEmptyMessage(msg);
            msg.classList.add(isEmpty ? CSS_CLASSES.EMPTY_HIDDEN : CSS_CLASSES.HIDDEN);
            this.hiddenMessages.add(msg);
          }
        } else {
          // show
          if (msg.classList.contains(CSS_CLASSES.HIDDEN) || msg.classList.contains(CSS_CLASSES.EMPTY_HIDDEN)) {
            msg.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);
            // removing from WeakSet not needed; WeakSet has no delete, but GC will collect if unreachable.
          }
        }
      }

      return this.getStats().hidden;
    }

    #pruneHidden(currentList) {
      // WeakSet cannot be iterated; instead, we rely on class presence for accurate counts
      // Nothing to do here other than ensure later getStats() computes from DOM, not WeakSet size.
    }

    showMoreMessages() {
      const s = this.settings;
      const { CSS_CLASSES, DOMUtils } = getGlobals();
      const messages = DOMUtils.getMessages();

      // Collect currently hidden in DOM order
      const hidden = [];
      for (const m of messages) {
        if (m.classList.contains(CSS_CLASSES.HIDDEN) || m.classList.contains(CSS_CLASSES.EMPTY_HIDDEN)) hidden.push(m);
      }

      const toShow = hidden.slice(-s.showMoreCount); // newest hidden first
      for (const m of toShow) m.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN);

      return Math.max(0, hidden.length - toShow.length);
    }

    showAllMessages() {
      const { CSS_CLASSES } = getGlobals();
      const hiddenNow = document.querySelectorAll(`.${CSS_CLASSES.HIDDEN}, .${CSS_CLASSES.EMPTY_HIDDEN}`);
      hiddenNow.forEach((m) => m.classList.remove(CSS_CLASSES.HIDDEN, CSS_CLASSES.EMPTY_HIDDEN));
      return 0;
    }

    isEmptyMessage(message) {
      const t = getTrimText(message);
      return !t || t.length < 3;
    }

    // ====== Protection API ======
    protectMessage(messageElement, ms = 30_000) {
      if (!messageElement) return;
      this.protectedMessages.add(messageElement);
      messageElement.setAttribute('data-ai-optimizer-protected', 'true');

      // clear previous timer (if any)
      const prev = protectTimers.get(messageElement);
      if (prev) clearTimeout(prev);

      const tid = setTimeout(() => {
        this.unprotectMessage(messageElement);
      }, ms);
      protectTimers.set(messageElement, tid);
    }

    unprotectMessage(messageElement) {
      if (!messageElement) return;
      const tid = protectTimers.get(messageElement);
      if (tid) clearTimeout(tid);
      protectTimers.delete(messageElement);
      messageElement.removeAttribute('data-ai-optimizer-protected');
      // WeakSet has no delete; using a shadow CSS marker to indicate state removal
      // Consumers should check attribute instead of WeakSet membership.
    }

    clearProtectedMessages() {
      // Remove attribute and timers from any currently marked nodes
      const marked = document.querySelectorAll('[data-ai-optimizer-protected="true"]');
      marked.forEach((el) => this.unprotectMessage(el));
    }

    // ====== Stats ======
    getStats() {
      const { DOMUtils, CSS_CLASSES } = getGlobals();
      const all = DOMUtils.getMessages();
      let hidden = 0;
      for (const m of all) if (m.classList.contains(CSS_CLASSES.HIDDEN) || m.classList.contains(CSS_CLASSES.EMPTY_HIDDEN)) hidden++;
      return { total: all.length, hidden, visible: all.length - hidden };
    }

    getDetailedStats() {
      const { DOMUtils, PlatformDetector } = getGlobals();
      const messages = DOMUtils.getMessages();
      const platform = PlatformDetector?.getCurrentPlatform?.();

      if (!platform) return { totalUser: 0, totalAi: 0, totalAll: 0, messages: [] };

      const data = [];
      let userCount = 0, aiCount = 0;

      for (let i = 0; i < messages.length; i++) {
        const info = this.analyzeMessage(messages[i], platform, i);
        if (!info) continue;
        data.push({ ...info, index: i + 1, timestamp: new Date().toISOString() });
        info.isUser ? userCount++ : aiCount++;
      }

      return { totalUser: userCount, totalAi: aiCount, totalAll: messages.length, messages: data };
    }

    analyzeMessage(messageElement, platform, messageIndex) {
      if (!messageElement) return null;
      const text = getTrimText(messageElement);
      if (!text) return null;

      // Generate stable-ish ID per run
      const messageId = `ai-optimizer-msg-${++this._lastIdCounter}`;
      messageElement.setAttribute('data-ai-optimizer-id', messageId);

      // Role detection (platform-specific, one pass per message)
      let isUser = false;
      let senderName = 'AI';

      switch (platform?.key) {
        case 'chatgpt': {
          const isU = (
            messageElement.querySelector('[data-message-author-role="user"]') ||
            messageElement.querySelector('[data-testid*="user"]') ||
            messageElement.closest('[data-message-author-role="user"]')
          );
          isUser = !!isU; senderName = isU ? 'Bạn' : 'ChatGPT';
          break;
        }
        case 'claude': {
          const isU = (
            messageElement.querySelector('[data-testid="user-message"]') ||
            messageElement.closest('[data-testid="user-message"]') ||
            messageElement.querySelector('.human-message')
          );
          isUser = !!isU; senderName = isU ? 'Bạn' : 'Claude';
          break;
        }
        case 'grok': {
          const align = this.guessByAlignment(messageElement);
          if (align === ROLE.user) { isUser = true; senderName = 'Bạn'; break; }
          if (align === ROLE.assistant) { isUser = false; senderName = 'Grok'; break; }

          const testid = this.guessByDataTestid(messageElement);
          if (testid === ROLE.user) { isUser = true; senderName = 'Bạn'; break; }
          if (testid === ROLE.assistant) { isUser = false; senderName = 'Grok'; break; }

          const aria = this.guessByAria(messageElement);
          if (aria === ROLE.user) { isUser = true; senderName = 'Bạn'; break; }
          if (aria === ROLE.assistant) { isUser = false; senderName = 'Grok'; break; }

          // Fallback: position in DOM (odd/even)
          isUser = messageIndex % 2 === 0; senderName = isUser ? 'Bạn' : 'Grok';
          break;
        }
        case 'aistudio': {
          const isU = (
            messageElement.matches?.('.user-prompt-container[data-turn-role="User"]') ||
            messageElement.querySelector?.('.user-prompt-container[data-turn-role="User"]')
          );
          const isM = (
            messageElement.matches?.('.model-prompt-container[data-turn-role="Model"]') ||
            messageElement.querySelector?.('.model-prompt-container[data-turn-role="Model"]')
          );
          if (isU) { isUser = true; senderName = 'Bạn'; }
          else if (isM) { isUser = false; senderName = 'Model'; }
          else { isUser = !!messageElement.querySelector?.('.user-prompt-container'); senderName = isUser ? 'Bạn' : 'Model'; }
          break;
        }
        default: {
          const lower = text.toLowerCase();
          if (
            messageElement.querySelector('[role="user"]') ||
            messageElement.classList.contains('user') ||
            lower.includes('human:') || lower.includes('user:')
          ) { isUser = true; senderName = 'Bạn'; }
          break;
        }
      }

      const maxLen = 100;
      const display = text.length > maxLen ? text.slice(0, maxLen) + '...' : text;

      return { isUser, sender: senderName, content: text, displayContent: display, length: text.length, messageId, element: messageElement };
    }

    // ====== Helper methods for Grok detection ======
    guessByAlignment(el) {
      // Walk up a few levels to find alignment hints
      let host = el, depth = 0;
      while (host && depth < 3) { // limit walk to avoid perf cost
        const cls = host.className || '';
        if (typeof cls === 'string') {
          if (/items-end|self-end|justify-end/.test(cls)) return ROLE.user;
          if (/items-start|self-start|justify-start/.test(cls)) return ROLE.assistant;
        }
        host = host.parentElement; depth++;
      }
      return null;
    }

    guessByDataTestid(el) {
      const own = (el.getAttribute?.('data-testid') || '').toLowerCase();
      const up = el.closest?.('[data-testid]')?.getAttribute?.('data-testid')?.toLowerCase?.() || '';
      const attrs = own + ' ' + up;
      if (/assistant|bot|ai|grok/.test(attrs)) return ROLE.assistant;
      if (/user|me|you/.test(attrs)) return ROLE.user;
      return null;
    }

    guessByAria(el) {
      const parts = [
        el.getAttribute?.('aria-label'),
        el.getAttribute?.('aria-roledescription'),
        el.closest?.('[aria-label]')?.getAttribute?.('aria-label'),
        el.closest?.('[aria-roledescription]')?.getAttribute?.('aria-roledescription')
      ].filter(Boolean).join(' ').toLowerCase();
      if (/assistant|bot|ai|grok/.test(parts)) return ROLE.assistant;
      if (/user|you|me|my message/.test(parts)) return ROLE.user;
      return null;
    }

    // ====== Lifecycle ======
    destroy() {
      this.showAllMessages();
      this.clearProtectedMessages();
    }
  }

  // Export
  window.MessageManager = MessageManager;
})();
