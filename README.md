# NESTORA – Web thương mại điện tử bán gối (demo giao diện)

Bản demo front-end thuần HTML/CSS/JavaScript, **không cần server**. Dữ liệu sản phẩm nằm trong `assets/js/data.js`; giỏ hàng, yêu thích và đơn hàng được lưu trong `localStorage` của trình duyệt.

## Chạy thử
Chạy bằng một web server tĩnh (cần thiết để tải mô hình 3D):

```bash
python3 -m http.server 8000
```

rồi truy cập http://localhost:8000.

## Tính năng
- Trang chủ, Our Story, Discover NESTORA
- Shop: Sleep / Move Collection, bộ lọc theo dòng sản phẩm, kiểu dáng, chất liệu, cảm giác, chiều cao, độ đầy đặn, giá; sắp xếp; tìm kiếm
- Trang chi tiết sản phẩm (12 sản phẩm N01–N12) với thông số, đặc điểm nổi bật, lý do nên chọn
- Pillow Quiz 7 câu hỏi + hệ thống chấm điểm đề xuất (mục đích 5, cảm giác 4, chiều cao 3, độ đầy đặn 2, tư thế 1, mỗi tiêu chí chất lượng 2)
- Góc kiến thức (Journal)
- Giỏ hàng, mã giảm giá demo (`NESTORA10`), thanh toán (COD / chuyển khoản / trực tuyến – mô phỏng), xác nhận và theo dõi trạng thái đơn hàng
- Hỗ trợ khách hàng: chatbox FAQ, nút Zalo, hướng dẫn mua hàng, chính sách giao hàng, đổi trả & bảo hành, liên hệ
- Xem gối 3D & AR trên trang chi tiết sản phẩm (Google model-viewer): xoay, phóng to; nút “Xem trong phòng của bạn” đặt gối vào không gian thật với kích thước thật
  - AR hoạt động trên Android (ARCore, Chrome) và iPhone/iPad (Safari, AR Quick Look); website cần chạy trên HTTPS
  - Mô hình được tạo bằng `tools/gen_models.py` theo kích thước trong bảng thông số; có thể thay bằng file GLB chụp/quét từ sản phẩm thật cùng tên trong `assets/models/`

## Cấu trúc
```
index.html
assets/css/style.css
assets/js/data.js   # sản phẩm, quiz, bài viết, FAQ
assets/js/app.js    # router, giao diện, giỏ hàng, quiz, checkout
assets/img/         # logo, ảnh sản phẩm & hero
assets/models/      # mô hình 3D (GLB) n01–n12
assets/vendor/      # model-viewer 3.5.0 (BSD-3-Clause)
tools/gen_models.py # script tạo mô hình 3D
```
