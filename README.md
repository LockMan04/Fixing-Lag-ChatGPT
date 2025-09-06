# Universal AI Chat Optimizer v2.1.0

Chrome extension hỗ trợ đa nền tảng để tăng tốc các AI chat như ChatGPT, Claude, Gemini, DeepSeek, Grok và Perplexity bằng cách tự động ẩn tin nhắn cũ và cung cấp thống kê chi tiết.

## Các nền tảng được hỗ trợ

- **ChatGPT** (chatgpt.com)
- **Claude AI** (claude.ai)
- **Grok (X.AI)** (grok.com)

## Các nền tảng sắp được phát triển trong thời gian tới
- **DeepSeek** (chat.deepseek.com)
- **Google Gemini** (gemini.google.com, bard.google.com)
- **Perplexity** (perplexity.ai)

## Tính năng

### Tối ưu hiệu suất
- **Universal Support**: Tự động phát hiện và hỗ trợ nhiều nền tảng AI chat
- **Auto Hide**: Tự động ẩn tin nhắn cũ, chỉ giữ lại số lượng tin nhắn được cấu hình
- **Show More Button**: Nút floating để hiển thị thêm tin nhắn đã ẩn
- **Smart Protection**: Bảo vệ tạm thời tin nhắn đã được navigate đến

### Thống kê và phân tích
- **Statistics Tab**: Tab thống kê hoàn toàn mới trong popup
- **Message Statistics**: Đếm số tin nhắn từ người dùng và AI
- **Message List**: Danh sách tất cả tin nhắn với preview ngắn gọn
- **Click Navigation**: Click tin nhắn để nhảy đến vị trí đó trên trang
- **CSV Export**: Xuất toàn bộ cuộc trò chuyện ra file CSV
- **Real-time Updates**: Thống kê cập nhật theo thời gian thực

### Giao diện người dùng
- **Tab Navigation**: Giao diện popup với 2 tab: Settings và Statistics
- **Dark Mode Support**: Hỗ trợ dark mode đầy đủ
- **Performance Stats**: Hiển thị thống kê real-time về tin nhắn đã ẩn/hiển thị
- **Platform Detection**: Hiển thị nền tảng hiện tại trong popup
- **Responsive Design**: Giao diện thích ứng với kích thước popup

## Kiến trúc modular

Extension sử dụng kiến trúc modular với các file JavaScript độc lập:

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
```
## Cài đặt

1. Tải về hoặc clone repository này
2. Mở Chrome và truy cập `chrome://extensions/`
3. Bật "Developer mode"
4. Nhấn "Load unpacked" và chọn thư mục extension
5. Vào bất kỳ AI chat platform nào được hỗ trợ và extension sẽ tự động hoạt động

## Cấu hình

Nhấn vào icon extension để mở popup cài đặt với 2 tab chính:

### Tab Settings
**Platform Settings**
- **Bật/tắt từng platform**: Chọn AI chat platforms bạn muốn sử dụng extension

**General Settings**
- **Auto Hide**: Bật/tắt tính năng ẩn tin nhắn tự động
- **Hide Empty Messages**: Bật/tắt ẩn tin nhắn trống
- **Số tin nhắn hiển thị**: Số tin nhắn gần nhất được giữ lại (10-200)
- **Show More Count**: Số tin nhắn hiển thị thêm mỗi lần nhấn "Show More" (5-50)

### Tab Statistics
**Thống kê cuộc trò chuyện**
- **Tổng quan**: Số lượng tin nhắn từ người dùng, AI và tổng cộng
- **Danh sách tin nhắn**: Xem tất cả tin nhắn với preview ngắn
- **Click navigation**: Click tin nhắn để nhảy đến vị trí đó trên trang
- **Xuất CSV**: Tải về toàn bộ cuộc trò chuyện dưới dạng file CSV

## Hoạt động

### Tối ưu hiệu suất
1. Extension tự động nhận diện AI chat platform bạn đang sử dụng
2. Áp dụng thuật toán ẩn tin nhắn phù hợp với từng platform
3. Ẩn tin nhắn cũ dựa trên cài đặt của bạn
4. Hiển thị nút "Show More" ở góc phải màn hình
5. Nhấn nút để hiển thị thêm tin nhắn cũ
6. Tự động hoạt động khi có tin nhắn mới hoặc chuyển platform

### Thống kê và navigation
1. Mở popup extension và chuyển sang tab "Statistics"
2. Xem thống kê chi tiết về cuộc trò chuyện hiện tại
3. Click vào bất kỳ tin nhắn nào để nhảy đến vị trí đó
4. Extension sẽ tự động hiện tất cả tin nhắn từ đầu đến vị trí được click
5. Tin nhắn được bảo vệ tạm thời 30 giây để không bị ẩn lại
6. Xuất toàn bộ cuộc trò chuyện ra file CSV với đầy đủ thông tin

## Hiệu suất

- Giảm đáng kể lag khi cuộn trang với các cuộc trò chuyện dài
- Tiết kiệm bộ nhớ trình duyệt trên tất cả platforms  
- Tăng tốc độ phản hồi của giao diện AI chat
- Không ảnh hưởng đến chức năng chat gốc
- Hỗ trợ real-time platform detection
- Thống kê chi tiết giúp theo dõi hiệu quả sử dụng

## Phát triển

Extension sử dụng các công nghệ:
- **Manifest V3** - Định dạng Chrome extension hiện đại
- **JavaScript ES6** - Kiến trúc modular universal với async/await
- **Chrome Storage API** - Lưu trữ cài đặt đa platform
- **Chrome Runtime Messaging** - Giao tiếp giữa popup và content script
- **MutationObserver** - Giám sát DOM hiệu quả cho nhiều platform
- **CSS Universal** - Tối ưu hóa hiệu suất đa platform với dark mode
- **CSV Export** - Xuất dữ liệu với UTF-8 BOM support
- **Platform Detection** - Nhận diện thông minh các AI chat platform

## Lịch sử thay đổi

### v2.1.0 - Statistics & Navigation Update
**Tính năng thống kê hoàn toàn mới**
- **Statistics Tab**: Tab thống kê trong popup với đầy đủ thông tin
- **Message Analysis**: Phân tích và đếm tin nhắn từ người dùng và AI
- **Message List**: Danh sách tin nhắn với preview ngắn gọn (100 ký tự + "...")
- **Click Navigation**: Click tin nhắn để nhảy đến vị trí đó trên trang
- **CSV Export**: Xuất toàn bộ cuộc trò chuyện với thông tin chi tiết

**Cải tiến UI/UX**
- **Tab Navigation**: Giao diện popup với 2 tab chính
- **Loading States**: Hiển thị trạng thái loading khi tải dữ liệu
- **Error Handling**: Xử lý lỗi và thông báo user-friendly
- **Responsive Design**: Tối ưu cho kích thước popup extension
- **Visual Feedback**: Highlight tin nhắn khi navigate, notification khi export

**Tối ưu kỹ thuật**
- **Platform-specific Detection**: Nhận diện chính xác tin nhắn user/AI cho từng platform
- **Improved Grok Support**: Cải thiện nhận diện tin nhắn cho Grok
- **Sync Show More Button**: Đồng bộ chính xác nút Show More sau mọi thao tác
- **Memory Management**: Quản lý bộ nhớ tốt hơn với protected messages
- **Console Logging**: Debug logging chi tiết cho development

### v2.0.0 - Universal Multi-platform Support
- **Multi-platform support**: ChatGPT, Claude, Grok
- **Platform Detection**: Tự động phát hiện và chuyển đổi platform
- **Platform Selection**: Bật/tắt từng platform riêng biệt
- **Universal Architecture**: Kiến trúc mở rộng cho các AI platform khác
- **Enhanced UI**: Popup hiển thị platform hiện tại và cài đặt chi tiết

### v1.x.x - ChatGPT Only (Legacy)
- Hỗ trợ chỉ ChatGPT
- Kiến trúc đơn giản
- Xem thư mục `backup/` cho các file cũ

## Đóng góp

Chào mừng các đóng góp! Kiến trúc extension giờ đây dễ bảo trì và mở rộng hơn nhiều.

## Giấy phép

MIT License - Tự do sử dụng và chỉnh sửa!
