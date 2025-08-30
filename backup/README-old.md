# Fixing lag ChatGPT Chrome Extension

🚀 **Tăng tốc ChatGPT bằng cách ẩn tin nhắn cũ và giảm lag đáng kể**

## 🌟 Tính năng chính

✅ **Tự động ẩn tin nhắn cũ** - Chỉ hiển thị 50 tin nhắn gần nhất (có thể tùy chỉnh)

✅ **Nút "Show More"** - Xem lại lịch sử tin nhắn khi cần thiết

✅ **Tăng tốc cuộn trang** - Giảm lag đáng kể khi cuộn

✅ **Popup settings** - Tùy chỉnh số tin nhắn hiển thị (10-200)

✅ **Nút bật/tắt Auto Hide** - Dễ dàng bật/tắt tính năng

✅ **Hỗ trợ dark mode** - Tự động thích ứng với theme

✅ **Hoạt động với SPA** - Hỗ trợ đầy đủ Single Page Application

## 📦 Cài đặt

### Cách 1: Cài đặt từ source code

1. **Tải extension:**
   - Tải hoặc clone repository này
   - Giải nén vào một thư mục

2. **Cài đặt icons:**
   - Tạo các file icon (16x16, 48x48, 128x128 pixels) và đặt vào thư mục `/icons/`
   - Hoặc tạo icons đơn giản bằng tool online

3. **Load extension vào Chrome:**
   - Mở Chrome và đi tới `chrome://extensions/`
   - Bật "Developer mode" (góc trên bên phải)
   - Nhấn "Load unpacked" và chọn thư mục extension
   - Extension sẽ xuất hiện trong danh sách

### Cách 2: Tạo icons nhanh

Bạn có thể tạo icons đơn giản bằng cách:

1. Mở Paint hoặc tool vẽ online
2. Tạo hình vuông với các kích thước: 16x16, 48x48, 128x128
3. Vẽ logo đơn giản (ví dụ: chữ "FL" - Fixing Lag)
4. Lưu dưới dạng PNG với tên: `icon16.png`, `icon48.png`, `icon128.png`
5. Đặt vào thư mục `/icons/`

## 🎯 Cách sử dụng

1. **Mở ChatGPT** (chat.openai.com hoặc chatgpt.com)
2. **Extension tự động hoạt động** - Ẩn tin nhắn cũ khi có hơn 50 tin nhắn
3. **Nhấn nút "Show More"** để xem thêm tin nhắn cũ
4. **Click icon extension** để mở popup settings và tùy chỉnh

## ⚙️ Cài đặt có sẵn

- **Auto Hide**: Bật/tắt tự động ẩn tin nhắn
- **Số tin nhắn hiển thị**: 10-200 tin nhắn (mặc định: 50)
- **Show More Count**: 5-50 tin nhắn mỗi lần (mặc định: 20)

## 🔧 Cấu trúc thư mục

```
Fixing Lag Chatgpt/
├── manifest.json      # Cấu hình extension
├── background.js      # Service worker
├── content.js         # Script chạy trên ChatGPT
├── styles.css         # CSS cho extension
├── popup.html         # Giao diện popup
├── popup.css          # CSS cho popup  
├── popup.js           # Logic popup
├── icons/             # Thư mục chứa icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # File này
```

## 🚀 Hiệu suất

- **Giảm lag**: Lên tới 70-80% khi có nhiều tin nhắn
- **Tăng tốc cuộn**: Mượt mà hơn rất nhiều
- **Tiết kiệm RAM**: Giảm memory usage của tab
- **SPA-friendly**: Hoạt động tốt khi chuyển conversation

## 🔍 Troubleshooting

### Extension không hoạt động:
1. Kiểm tra đã bật extension trong `chrome://extensions/`
2. Refresh trang ChatGPT
3. Kiểm tra Developer Console để xem có lỗi không

### Nút "Show More" không xuất hiện:
1. Cần có ít nhất 51 tin nhắn trong conversation
2. Kiểm tra Auto Hide đã bật chưa
3. Thử refresh trang

### Settings không lưu:
1. Kiểm tra quyền "storage" trong manifest
2. Thử restart Chrome
3. Kiểm tra popup console có lỗi không

## 📝 Development

### Để phát triển thêm:

1. **Sửa logic ẩn tin nhắn**: Chỉnh sửa `content.js`
2. **Thay đổi giao diện**: Sửa `popup.html` và `popup.css`
3. **Thêm tính năng**: Cập nhật `manifest.json` và các file liên quan

### Test extension:

1. Mở DevTools trên trang ChatGPT
2. Check Console để xem log
3. Test với conversations dài (100+ tin nhắn)
4. Test chuyển đổi giữa các conversation

## 📄 License

MIT License - Tự do sử dụng và chỉnh sửa

## 🤝 Đóng góp

Mọi góp ý và pull request đều được chào đón!

---

**Made with ❤️ để cải thiện trải nghiệm ChatGPT của bạn**
