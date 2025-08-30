# Fixing lag ChatGPT v2.0.0

Chrome extension để tăng tốc ChatGPT bằng cách tự động ẩn tin nhắn cũ, giảm lag và cải thiện hiệu suất cuộn trang.

## Tính năng

- **Auto Hide**: Tự động ẩn tin nhắn cũ, chỉ giữ lại số lượng tin nhắn được cấu hình
- **Hide Empty Messages**: Ẩn các tin nhắn trống hoặc không có nội dung
- **Show More Button**: Nút floating để hiển thị thêm tin nhắn đã ẩn
- **Configurable Settings**: Popup setting để tùy chỉnh số lượng tin nhắn
- **Performance Stats**: Hiển thị thống kê real-time về tin nhắn đã ẩn/hiển thị
- **Dark Mode Support**: Tự động detect và hỗ trợ chế độ tối của ChatGPT

## Kiến trúc modular

Extension sử dụng kiến trúc modular với các file JavaScript độc lập:

```
src/
├── shared/           # Code dùng chung
│   ├── constants.js  # Hằng số và cấu hình
│   └── utils.js      # Utility functions
├── content/          # Content scripts
│   ├── main.js              # Content script chính
│   ├── message-manager.js   # Quản lý tin nhắn
│   ├── show-more-button.js  # Component nút Show More
│   └── chat-observer.js     # Observer cho DOM changes
├── popup/            # Popup UI
│   ├── main.js              # Popup script chính
│   └── popup-manager.js     # Quản lý popup logic
└── background/       # Background service worker
    └── main.js       # Background script chính
```

## Cài đặt

1. Tải về hoặc clone repository này
2. Mở Chrome và truy cập `chrome://extensions/`
3. Bật "Developer mode"
4. Nhấn "Load unpacked" và chọn thư mục extension
5. Vào ChatGPT và extension sẽ tự động hoạt động

## Cấu hình

Nhấn vào icon extension để mở popup cài đặt:

- **Auto Hide**: Bật/tắt tính năng ẩn tin nhắn tự động
- **Hide Empty Messages**: Bật/tắt ẩn tin nhắn trống
- **Số tin nhắn hiển thị**: Số tin nhắn gần nhất được giữ lại (10-200)
- **Show More Count**: Số tin nhắn hiển thị thêm mỗi lần nhấn "Show More" (5-50)

## Hoạt động

1. Extension tự động nhận diện khi bạn truy cập ChatGPT
2. Ẩn tin nhắn cũ dựa trên cài đặt của bạn
3. Hiển thị nút "Show More" ở góc phải màn hình
4. Nhấn nút để hiển thị thêm tin nhắn cũ
5. Tự động hoạt động khi có tin nhắn mới

## Hiệu suất

- Giảm đáng kể lag khi cuộn trang với các cuộc trò chuyện dài
- Tiết kiệm bộ nhớ trình duyệt
- Tăng tốc độ phản hồi của giao diện ChatGPT
- Không ảnh hưởng đến chức năng chat

## Phát triển

Extension sử dụng các công nghệ:
- **Manifest V3** - Định dạng Chrome extension hiện đại
- **JavaScript ES6** - Kiến trúc modular sạch sẽ
- **Chrome Storage API** - Lưu trữ cài đặt bền vững
- **MutationObserver** - Giám sát DOM hiệu quả
- **CSS tối ưu** - Tối ưu hóa hiệu suất

## Lịch sử thay đổi

### v2.0.0 - Viết lại hoàn toàn
- Kiến trúc modular với JavaScript modules
- Cải thiện giao diện popup với thống kê hiệu suất
- Xử lý lỗi tốt hơn
- Thống kê thời gian thực
- Dễ bảo trì và phát triển hơn

### v1.x - Phiên bản cũ
- Chức năng cơ bản
- Cấu trúc đơn khối
- Xem thư mục `backup/` cho các file cũ

## Đóng góp

Chào mừng các đóng góp! Kiến trúc extension giờ đây dễ bảo trì và mở rộng hơn nhiều.

## Giấy phép

MIT License - Tự do sử dụng và chỉnh sửa!
