// Main popup script for Universal AI Chat Optimizer

// Constants
const DEFAULT_SETTINGS = {
  isEnabled: true,
  hideEmpty: true,
  maxMessages: 10,
  showMoreCount: 5,
  enabledSites: {
    chatgpt: true,
    claude: true,
    grok: true
  }
};

// Storage Utils
const StorageUtils = {
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        resolve(settings);
      });
    });
  },

  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(settings, () => {
        resolve();
      });
    });
  }
};

// Popup Manager
class PopupManager {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.currentStatsData = null;
    this.dom = {}; // To cache DOM elements
    this.init();
  }

  async init() {
    this.cacheDOMElements();
    await this.loadSettings();
    this.setupTabNavigation();
    this.setupEventListeners();
    this.updateUI();
    this.updatePerformanceStats();
  }

  cacheDOMElements() {
    this.dom.tabBtns = document.querySelectorAll('.tab-btn');
    this.dom.tabContents = document.querySelectorAll('.tab-content');
    this.dom.saveBtn = document.getElementById('saveBtn');
    this.dom.resetBtn = document.getElementById('resetBtn');
    this.dom.exportCsvBtn = document.getElementById('exportCsvBtn');
    this.dom.autoHideToggle = document.getElementById('autoHideToggle');
    this.dom.maxMessagesInput = document.getElementById('maxMessages');
    this.dom.showMoreCountInput = document.getElementById('showMoreCount');
    this.dom.status = document.getElementById('status');
    this.dom.currentPlatform = document.getElementById('currentPlatform');
    this.dom.totalUserMessages = document.getElementById('totalUserMessages');
    this.dom.totalAiMessages = document.getElementById('totalAiMessages');
    this.dom.totalAllMessages = document.getElementById('totalAllMessages');
    this.dom.messagesList = document.getElementById('messagesList');
  }

  setupTabNavigation() {
    this.dom.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        
        this.dom.tabBtns.forEach(b => b.classList.remove('active'));
        this.dom.tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(`${targetTab}-tab`).classList.add('active');
        
        if (targetTab === 'statistics') {
          this.loadStatisticsData();
        }
      });
    });
  }

  async loadSettings() {
    try {
      const settings = await StorageUtils.loadSettings();
      this.settings = { ...this.settings, ...settings };
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      return await StorageUtils.saveSettings(this.settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
      return false;
    }
  }

  setupEventListeners() {
    this.dom.autoHideToggle?.addEventListener('change', (e) => {
      this.settings.isEnabled = e.target.checked;
    });

    this.dom.maxMessagesInput?.addEventListener('input', (e) => {
      this.settings.maxMessages = parseInt(e.target.value) || 10;
    });

    this.dom.showMoreCountInput?.addEventListener('input', (e) => {
      this.settings.showMoreCount = parseInt(e.target.value) || 5;
    });

    this.dom.saveBtn?.addEventListener('click', () => this.handleSave());
    this.dom.resetBtn?.addEventListener('click', () => this.handleReset());
    this.dom.exportCsvBtn?.addEventListener('click', () => this.handleExportCsv());
  }

  updateUI() {
    if (this.dom.autoHideToggle) this.dom.autoHideToggle.checked = this.settings.isEnabled;
    if (this.dom.maxMessagesInput) this.dom.maxMessagesInput.value = this.settings.maxMessages;
    if (this.dom.showMoreCountInput) this.dom.showMoreCountInput.value = this.settings.showMoreCount;
  }

  async handleSave() {
    const maxMessages = parseInt(this.dom.maxMessagesInput?.value || 10);
    const showMoreCount = parseInt(this.dom.showMoreCountInput?.value || 5);
    
    if (maxMessages < 10 || maxMessages > 200) {
      this.showStatus('Số tin nhắn hiển thị phải từ 10-200', 'error');
      return;
    }
    
    if (showMoreCount < 5 || showMoreCount > 50) {
      this.showStatus('Số tin nhắn "Show More" phải từ 5-50', 'error');
      return;
    }

    this.settings.maxMessages = maxMessages;
    this.settings.showMoreCount = showMoreCount;

    try {
      if (this.dom.saveBtn) {
        this.dom.saveBtn.textContent = 'Đang lưu...';
        this.dom.saveBtn.disabled = true;
      }

      await this.saveSettings();
      this.updateContentScript();
      this.showStatus('Cài đặt đã được lưu! Tải lại trang để áp dụng.', 'success');

    } catch (error) {
      this.showStatus('Lỗi khi lưu cài đặt', 'error');
    } finally {
      setTimeout(() => {
        if (this.dom.saveBtn) {
          this.dom.saveBtn.textContent = 'Lưu cài đặt';
          this.dom.saveBtn.disabled = false;
        }
      }, 1000);
    }
  }

  async updateContentScript() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url) {
        chrome.tabs.sendMessage(tab.id, { 
          action: 'updateSettings', 
          settings: this.settings 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.warn('Content script not ready:', chrome.runtime.lastError.message);
          }
        });
      }
    } catch (error) {
      console.warn('Tab communication error:', error);
    }
  }

  async handleReset() {
    if (confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
      this.settings = { ...DEFAULT_SETTINGS };
      
      try {
        await this.saveSettings();
        this.updateUI();
        this.updateContentScript();
        this.showStatus('Đã đặt lại cài đặt mặc định!', 'success');
      } catch (error) {
        this.showStatus('Lỗi khi đặt lại cài đặt', 'error');
      }
    }
  }

  showStatus(message, type = 'info') {
    if (!this.dom.status) return;
    this.dom.status.textContent = message;
    this.dom.status.className = `status ${type}`;
    this.dom.status.style.display = 'block';
    setTimeout(() => {
      this.dom.status.style.display = 'none';
    }, 3000);
  }

  async updatePerformanceStats() {
    this.dom.currentPlatform.textContent = 'Không xác định';

    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || !tab.url) {
          this.dom.currentPlatform.textContent = 'Tab không hợp lệ';
          return;
        }

        chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
          if (chrome.runtime.lastError) {
            this.dom.currentPlatform.textContent = 'Trang không được hỗ trợ';
            return;
          }
          this.dom.currentPlatform.textContent = response?.platform || 'Không xác định';
        });
      });
    } catch (error) {
      console.warn('Error updating performance stats:', error);
      this.dom.currentPlatform.textContent = 'Lỗi';
    }
  }

  async loadStatisticsData() {
    // Show loading state
    this.dom.totalUserMessages.textContent = '...';
    this.dom.totalAiMessages.textContent = '...';
    this.dom.totalAllMessages.textContent = '...';
    this.dom.messagesList.innerHTML = '<div class="loading-placeholder">Đang tải danh sách tin nhắn...</div>';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        this.showStatisticsError('Không thể truy cập tab hiện tại');
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: 'getDetailedStats' }, (response) => {
        if (chrome.runtime.lastError) {
          this.showStatisticsError('Không thể lấy dữ liệu, hãy thử tải lại trang và mở lại popup');
          return;
        }
        if (response && response.messages) {
          this.displayStatistics(response);
          this.currentStatsData = response; // Store for CSV export
        } else {
          this.showStatisticsError('Không có dữ liệu thống kê');
        }
      });
    } catch (error) {
      console.warn('Error loading statistics:', error);
      this.showStatisticsError('Có lỗi khi tải thống kê');
    }
  }

  displayStatistics(data) {
    this.dom.totalUserMessages.textContent = data.totalUser;
    this.dom.totalAiMessages.textContent = data.totalAi;
    this.dom.totalAllMessages.textContent = data.totalAll;

    if (data.messages.length === 0) {
      this.dom.messagesList.innerHTML = '<div class="loading-placeholder">Không có tin nhắn nào được tìm thấy</div>';
      return;
    }

    const messagesHtml = data.messages.map((message) => `
      <div class="message-item clickable" data-message-id="${message.messageId}" title="Click để nhảy đến tin nhắn này">
        <div class="message-header">
          <span class="message-sender ${message.isUser ? '' : 'ai'}">${message.sender}</span>
          <span class="message-time">#${message.index}</span>
        </div>
        <div class="message-content">${this.escapeHtml(message.displayContent)}</div>
      </div>
    `).join('');

    this.dom.messagesList.innerHTML = messagesHtml;
    
    this.dom.messagesList.querySelectorAll('.message-item.clickable').forEach(item => {
      item.addEventListener('click', () => {
        const messageId = item.getAttribute('data-message-id');
        this.scrollToMessage(messageId);
      });
    });
  }

  showStatisticsError(message) {
    this.dom.totalUserMessages.textContent = '0';
    this.dom.totalAiMessages.textContent = '0';
    this.dom.totalAllMessages.textContent = '0';
    this.dom.messagesList.innerHTML = `<div class="loading-placeholder">${message}</div>`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async handleExportCsv() {
    if (!this.currentStatsData || !this.currentStatsData.messages.length) {
      alert('Không có dữ liệu để xuất. Vui lòng đợi dữ liệu tải xong.');
      return;
    }

    try {
      const csvContent = this.generateCsvContent(this.currentStatsData);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `chat-messages-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const originalText = this.dom.exportCsvBtn.textContent;
      this.dom.exportCsvBtn.textContent = '✅ Đã tải về!';
      this.dom.exportCsvBtn.disabled = true;
      
      setTimeout(() => {
        this.dom.exportCsvBtn.textContent = originalText;
        this.dom.exportCsvBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Có lỗi khi xuất file CSV.');
    }
  }

  generateCsvContent(data) {
    const headers = ['STT', 'Người gửi', 'Nội dung', 'Độ dài', 'Thời gian'];
    const csvRows = [headers.join(',')];
    
    data.messages.forEach((message) => {
      const row = [
        message.index,
        `"${message.sender}"`, 
        `"${this.escapeCsv(message.content)}"`, 
        message.length,
        `"${new Date().toLocaleString('vi-VN')}"`
      ];
      csvRows.push(row.join(','));
    });
    
    csvRows.push('');
    csvRows.push(`"Tổng kết:","","","",""`);
    csvRows.push(`"Tin nhắn của bạn:","${data.totalUser}"`);
    csvRows.push(`"Tin nhắn AI:","${data.totalAi}"`);
    csvRows.push(`"Tổng cộng:","${data.totalAll}"`);
    csvRows.push(`"Platform:","${data.platform}"`);
    
    return '\uFEFF' + csvRows.join('\n'); // Add BOM for UTF-8
  }

  escapeCsv(text) {
    return text.replace(/"/g, '""').replace(/\n|\r/g, ' ');
  }

  async scrollToMessage(messageId) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        alert('Không thể truy cập tab hiện tại');
        return;
      }

      chrome.tabs.sendMessage(tab.id, { 
        action: 'scrollToMessage', 
        messageId: messageId 
      }, (response) => {
        if (chrome.runtime.lastError) {
          alert('Không thể nhảy đến tin nhắn. Vui lòng thử lại.');
          return;
        }
        
        if (response && response.found) {
          if (response.revealedCount > 0) {
            const message = `Đã hiện ${response.revealedCount} tin nhắn bị ẩn để xem.`;
            this.showTemporaryNotification(message);
          }
          setTimeout(() => window.close(), response.revealedCount > 0 ? 2000 : 500);
        } else {
          alert('Không tìm thấy tin nhắn này. Có thể trang đã được tải lại.');
        }
      });
    } catch (error) {
      console.error('Scroll to message error:', error);
      alert('Có lỗi khi nhảy đến tin nhắn');
    }
  }

  showTemporaryNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'temporary-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 2000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
