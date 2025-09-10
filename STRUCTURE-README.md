# Universal AI Optimizer v2.2.0

## Cấu trúc dự án

```
src/
├── shared/                  # Code dùng chung
│   └── constants.js         # Hằng số và cấu hình cho tất cả platforms
├── content/                 # Content scripts
│   ├── main-modular.js      # Main content script với modular architecture
│   ├── ChatObserver.js      # Observer theo dõi thay đổi DOM
│   ├── DOMUtils.js          # Utilities cho DOM manipulation
│   ├── MessageManager.js    # Quản lý tin nhắn và thống kê
│   ├── MessageValidator.js  # Validation tin nhắn theo platform
│   ├── PlatformDetector.js  # Phát hiện platform hiện tại
│   ├── ScrollToTop.js       # Nút scroll to top/bottom
│   ├── ShowMoreButton.js    # Nút "Show More" cho tin nhắn ẩn
│   └── StorageUtils.js      # Utilities cho Chrome Storage
├── popup/                   # Popup UI
│   └── main.js              # Popup script với tab navigation và tab memory
└── background/              # Background service worker
    └── main.js              # Background script với tab persistence

# Root files
manifest.json                # Extension manifest V3
popup.html                   # Popup HTML với tab navigation
popup.css                    # CSS cho popup với dark mode
color.css                    # Color scheme và dark mode
styles.css                   # CSS cho content script universal
icons/                       # Extension icons (16, 48, 128px)
```

## Lịch sử phát triển

### v2.2.0 - Google AI Studio & Scroll Controls (Current)
**Google AI Studio Support**
- Hỗ trợ đầy đủ aistudio.google.com
- Platform detection cho AI Studio
- Message validation cho AI Studio format

**Scroll Controls**
- Scroll to top/bottom buttons cho AI Studio
- Container positioning logic
- Fallback positioning cho các layout khác nhau

**Tab Memory**
- Ghi nhớ tab đang mở trong popup (Settings/Statistics)
- Persistence qua Chrome Storage API
- Background script handling cho tab state

**Modular Architecture**
- Refactor thành modular components
- Separation of concerns cho từng chức năng
- Improved maintainability và debugging

### v2.1.0 - Statistics & Navigation
- Tab statistics với thống kê chi tiết
- Click navigation và CSV export
- Message protection system

### v2.0.0 - Universal Multi-platform
- Multi-platform support
- Platform detection tự động
- Universal content script

## Kiến trúc v2.2.0

### **src/shared/constants.js**
- Cài đặt mặc định cho 4 platforms
- Platform configurations với selectors
- AI Studio specific constants

### **src/content/main-modular.js**
- Main orchestrator cho tất cả components
- Platform detection và initialization
- Component lifecycle management
- AI Studio scroll button integration

### **src/content/PlatformDetector.js**
```javascript
class PlatformDetector {
  static detectPlatform()     // Phát hiện platform từ URL
  static getPlatformConfig()  // Lấy config theo platform
}
```

### **src/content/ScrollToTop.js**
```javascript
class ScrollToTop {
  constructor()               // Initialize scroll buttons
  create()                   // Tạo nút scroll top/bottom
  getChatContainer()         // Tìm container phù hợp
  show()/hide()              # Toggle visibility
}
```

### **src/content/MessageManager.js**
```javascript
class MessageManager {
  analyzeMessage()           // Phân tích tin nhắn theo platform
  getDetailedStats()         // Thống kê chi tiết
  updateStats()              // Cập nhật thống kê real-time
}
```

### **src/popup/main.js**
- Tab navigation với memory persistence
- Statistics display với platform breakdown  
- Tab state saving/loading
- StorageUtils integration cho popup context

### **src/background/main.js**
- Tab persistence handlers (getActiveTab/saveActiveTab)
- Cross-component message handling
- Storage operations cho popup

## Platform Support v2.2.0

Hiện tại hỗ trợ 4 AI chat platforms:
1. **ChatGPT** (chatgpt.com)
2. **Claude** (claude.ai) 
3. **Grok** (grok.com)
4. **Google AI Studio** (aistudio.google.com) ⭐ NEW

### AI Studio Features
- Message hiding/showing
- Scroll to top/bottom controls
- Container-based positioning
- Platform-specific message detection

## Component Details

### **ScrollToTop.js** ⭐ NEW
```javascript
Features:
- Dual buttons (top ↑ / bottom ↓)
- Container positioning (.chat-container priority)
- Fixed positioning fallback
- Auto show/hide based on scroll
- Smooth scrolling behavior
```

### **StorageUtils.js**
```javascript
Methods:
- loadSettings() / saveSettings()
- loadActiveTab() / saveActiveTab()  ⭐ NEW
- Background script communication
- Popup context compatibility
```

### **Tab Memory System** ⭐ NEW
```javascript
Flow:
1. Popup opens → loadActiveTab()
2. User switches tab → saveActiveTab()
3. Background stores → Chrome Storage
4. Next popup open → restores last tab
```

## Storage Structure v2.2.0

```javascript
{
  "activeTab": "settings" | "statistics",  // ⭐ NEW
  "chatStats": {
    "chatgpt": { messages: [...], ... },
    "claude": { messages: [...], ... },
    "grok": { messages: [...], ... },
    "aistudio": { messages: [...], ... }   // ⭐ NEW
  },
  "settings": {
    "enabledSites": {
      "aistudio": true                      // ⭐ NEW
    }
  }
}
```

## File Dependencies

```
main-modular.js
├── PlatformDetector.js
├── MessageManager.js
├── ShowMoreButton.js
├── ScrollToTop.js          ⭐ NEW (AI Studio only)
├── ChatObserver.js
└── StorageUtils.js

popup/main.js
├── StorageUtils (local)    ⭐ NEW (popup-specific)
└── Background messages

background/main.js
├── Storage handlers
└── Tab persistence        ⭐ NEW
```

## Lợi ích v2.2.0

### **Enhanced Platform Support**
- Google AI Studio integration
- Improved platform detection
- Platform-specific features (scroll controls)

### **Better User Experience**
- Tab memory cho popup consistency
- Scroll controls cho navigation dễ dàng
- Improved positioning logic

### **Modular Architecture**
- Separated concerns cho maintenance
- Component-based structure
- Easier debugging và testing

### **Performance**
- Container-based positioning
- Efficient scroll handling
- Optimized component loading

## Migration từ v2.1.0

### Thay đổi chính
- Modular component structure
- AI Studio platform support
- Tab memory system
- Scroll controls cho AI Studio

### Compatibility
- Settings được preserve
- Statistics data tương thích
- Auto-migration cho activeTab storage

## Usage Guidelines v2.2.0

### Cho Developers
1. Thêm platform mới: Update PlatformDetector.js + constants.js
2. Thêm feature mới: Tạo component trong src/content/
3. Popup changes: Update popup/main.js + background handlers

### Cho Users
1. AI Studio: Scroll buttons tự động xuất hiện
2. Tab memory: Popup nhớ tab cuối cùng được mở
3. Settings: Enable/disable AI Studio trong popup
