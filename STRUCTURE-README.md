# Fixing lag ChatGPT Extension v2.0.0

## Cấu trúc dự án

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

# Root files
manifest.json         # Extension manifest (cũ)
manifest-new.json     # Extension manifest (mới, modular)
popup.html           # Popup HTML (cũ)
popup-new.html       # Popup HTML (mới, sử dụng modules)
styles.css           # CSS cho content script
popup.css            # CSS cho popup
icons/               # Extension icons
```

## So sánh phiên bản

### Phiên bản cũ (v1.x):
- **1 file content.js** - 350+ dòng code
- **1 file popup.js** - 240+ dòng code
- **1 file background.js** - 35+ dòng code
- Khó bảo trì và debug

### Phiên bản mới (v2.0):
- **Chia thành 8 modules** nhỏ
- **Separation of concerns** rõ ràng
- **JavaScript modules** với import/export
- **Dễ test và bảo trì**

## Tính năng từng module

### **shared/constants.js**
- Cài đặt mặc định
- CSS selectors
- Tên miền
- Cấu hình thời gian

### **shared/utils.js**  
- DOMUtils: Thao tác DOM
- MessageValidator: Logic validate tin nhắn
- StorageUtils: Thao tác Chrome storage

### **content/main.js**
- Content script chính
- Điều phối tất cả chức năng content

### **content/message-manager.js**
- Logic ẩn/hiện tin nhắn
- Theo dõi thống kê
- Quản lý cài đặt

### **content/show-more-button.js**
- Component nút floating
- Xử lý sự kiện
- Cập nhật UI

### **content/chat-observer.js**
- DOM mutation observer
- Phát hiện thay đổi URL
- Xử lý sự kiện debounced

### **popup/popup-manager.js**
- Logic UI popup
- Validate cài đặt
- Giao tiếp với content script

### **background/main.js**
- Logic service worker
- Quản lý storage
- Giao tiếp tab

## Lợi ích của cấu trúc mới

### **Maintainability**
- Mỗi file có trách nhiệm rõ ràng
- Dễ tìm và sửa lỗi
- Tái sử dụng code tốt hơn

### **Scalability**  
- Dễ thêm tính năng mới
- Không ảnh hưởng code khác
- Modular testing

### **Performance**
- Tree shaking với JavaScript modules
- Lazy loading components
- Quản lý bộ nhớ tốt hơn

### **Developer Experience**
- IntelliSense tốt hơn
- Type safety với JSDoc
- Debug dễ hơn

## Cách chuyển đổi

### Bước 1: Sao lưu phiên bản cũ
```bash
# Sao lưu files hiện tại
cp manifest.json manifest-old.json
cp popup.html popup-old.html
cp content.js content-old.js
cp popup.js popup-old.js
cp background.js background-old.js
```

### Bước 2: Sử dụng files mới
```bash
# Thay thế bằng files mới
mv manifest-new.json manifest.json
mv popup-new.html popup.html
```

### Bước 3: Test và triển khai
1. Reload extension tại `chrome://extensions/`
2. Test tất cả chức năng
3. Kiểm tra console để tìm lỗi
4. Xác minh hiệu suất

## Ghi chú Migration

- **JavaScript Modules**: Yêu cầu `"type": "module"` trong manifest
- **Import/Export**: Tất cả shared code sử dụng JavaScript modules
- **Error Handling**: Cải thiện với try/catch blocks
- **Type Safety**: JSDoc comments cho IDE support tốt hơn

## Triển khai

Extension mới sẽ hoạt động với:
- Chrome Manifest V3
- JavaScript modules support
- Tính năng JavaScript hiện đại
- Xử lý lỗi tốt hơn
