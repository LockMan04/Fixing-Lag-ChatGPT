# Universal AI Chat Optimizer v2.1.0

## Cấu trúc dự án

```
src/
├── shared/                  # Code dùng chung
│   └── constants.js         # Hằng số và cấu hình cho tất cả platforms
├── content/                 # Content scripts
│   └── main-universal.js    # Universal content script cho tất cả platforms
├── popup/                   # Popup UI
│   └── main.js              # Popup script với tab navigation và statistics
└── background/              # Background service worker
    └── main.js              # Background script chính

# Root files
manifest.json                # Extension manifest V3
popup.html                   # Popup HTML với tab navigation
popup.css                    # CSS cho popup với dark mode support
styles.css                   # CSS cho content script universal
icons/                       # Extension icons
```

## Lịch sử phát triển

### v2.1.0 - Statistics & Navigation Update (Current)
**Tính năng thống kê hoàn toàn mới**
- Tab statistics trong popup với thống kê chi tiết
- Click navigation để nhảy đến tin nhắn cụ thể
- CSV export với đầy đủ thông tin cuộc trò chuyện
- Smart reveal hiện tất cả tin nhắn từ đầu đến vị trí được click
- Message protection system để tránh re-hiding

**Cải tiến UI/UX**
- Tab navigation với 2 tab: Settings và Statistics
- Dark mode support đầy đủ
- Loading states và error handling
- Visual feedback với highlight và notifications

### v2.0.0 - Universal Multi-platform Support
- Multi-platform support thêm nền tảng mới
- Platform detection và switching tự động
- Kiến trúc universal content script
- Platform-specific settings

### v1.x.x - ChatGPT Only (Legacy)
- Hỗ trợ chỉ ChatGPT
- Single file structure
- Kiến trúc đơn giản

## Kiến trúc hiện tại

### **src/shared/constants.js**
- Cài đặt mặc định cho tất cả platforms
- Platform configurations với selectors riêng biệt
- CSS class names và constants chung

### **src/content/main-universal.js**
- Platform detection tự động 
- Universal content script cho 6 platforms
- Message Manager với analyzeMessage và getDetailedStats
- Statistics collection và storage
- Show more button management
- Click navigation system với smart reveal
- Message protection để tránh re-hiding tin nhắn

### **src/popup/main.js**
- Tab navigation giữa Settings và Statistics
- Statistics display với detailed breakdown
- CSV export với UTF-8 BOM support
- Click-to-scroll functionality
- Dark mode toggle và UI management
- Error handling và loading states

### **src/background/main.js**
- Background service worker đơn giản
- Extension lifecycle management
- Platform domain permissions

## Platform Support (v2.1.0)

Hiện tại hỗ trợ 3 AI chat platforms:
1. **ChatGPT** (chat.openai.com)
2. **Claude** (claude.ai) 
3. **Grok** (grok.com)
<!-- 4. **Gemini** (gemini.google.com)
5. **Perplexity** (perplexity.ai)
6. **Copilot** (copilot.microsoft.com) -->

Mỗi platform có:
- Platform-specific selectors
- Cấu hình riêng cho message và container detection
- CSS styling phù hợp

## Tính năng Statistics v2.1.0

### Thống kê cơ bản
- Tổng số tin nhắn theo platform
- Phân loại User và AI messages
- Timestamp của cuộc trò chuyện đầu và cuối

### Tính năng nâng cao
- **Click navigation**: Click vào tin nhắn trong statistics để nhảy đến vị trí đó
- **Smart reveal**: Tự động hiện tất cả tin nhắn từ đầu đến vị trí được click
- **CSV export**: Xuất toàn bộ conversation data với encoding UTF-8
- **Real-time updates**: Statistics cập nhật real-time khi có tin nhắn mới

## File Structure Details

### Content Script (`main-universal.js`)
```javascript
class PlatformDetector        // Phát hiện platform hiện tại
class MessageManager         // Quản lý tin nhắn và statistics
class ShowMoreButton         // Quản lý nút Show More
```

### Popup (`main.js`)  
```javascript
Tab Navigation              // Chuyển đổi giữa Settings/Statistics
Statistics Display          // Hiển thị thống kê chi tiết
CSV Export                  // Xuất dữ liệu ra file CSV
Click Navigation            // Nhảy đến tin nhắn được click
```

### Storage Structure
```javascript
{
  "chatStats": {
    "platformName": {
      "messages": [...],
      "totalCount": number,
      "userCount": number,
      "aiCount": number,
      "firstMessageTime": timestamp,
      "lastMessageTime": timestamp
    }
  }
}
```

## Lợi ích của kiến trúc v2.1.0

### **Maintainability**
- Universal content script đơn giản hóa codebase
- Platform detection tự động
- Modular structure dễ debug và maintain

### **Statistics & Navigation**  
- Real-time statistics tracking
- Click-to-navigate functionality
- CSV export với full conversation data
- Smart reveal system

### **Performance**
- Single universal script thay vì multiple platform-specific scripts
- Efficient message protection system
- Optimized DOM operations với platform-specific selectors

### **User Experience**
- Tab navigation trong popup
- Dark mode support
- Visual feedback và notifications
- Error handling và loading states

## Hướng dẫn sử dụng v2.1.0

### Cài đặt Extension
1. Load unpacked extension tại `chrome://extensions/`
2. Chọn folder chứa extension
3. Enable extension

### Sử dụng Statistics
1. Click vào extension icon
2. Chuyển sang tab "Statistics"
3. Xem thống kê chi tiết theo platform
4. Click vào tin nhắn để jump đến vị trí đó
5. Export CSV nếu cần backup data

### Settings
1. Enable/disable extension per platform
2. Toggle dark mode
3. Adjust auto-hide settings

## Migration từ v2.0.0

### Thay đổi chính
- Loại bỏ multiple content scripts, chuyển sang universal script
- Thêm tab navigation và statistics system
- CSS được cập nhật với dark mode support
- Storage structure được mở rộng cho statistics

### Compatibility
- Settings cũ được preserve
- Tự động migrate sang storage structure mới
- Không cần configuration thêm
