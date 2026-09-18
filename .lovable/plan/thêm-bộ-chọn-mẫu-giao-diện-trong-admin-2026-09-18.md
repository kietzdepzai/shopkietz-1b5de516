# Thêm bộ chọn mẫu giao diện trong Admin

## Phạm vi
- Thêm mục **Giao diện** riêng trong trang Admin, chỉ tài khoản admin truy cập và thay đổi được.
- Cung cấp 3 mẫu để chọn: **Cyber Neon** (hiện tại), **Compact Gaming** (gọn, ưu tiên tìm sản phẩm), và **Showcase** (ảnh lớn, nổi bật danh mục).
- Mỗi mẫu có thẻ xem trước trực quan, trạng thái đang dùng và nút áp dụng rõ ràng.
- Lưu mẫu được chọn vào cài đặt shop để mọi khách truy cập đều thấy đúng bố cục; khách không có quyền chỉnh sửa.

## Áp dụng ngoài shop
- Tải cài đặt giao diện khi mở website và gắn mẫu vào lớp bao ngoài toàn bộ ứng dụng.
- Điều chỉnh bố cục trang chủ, khoảng cách, kích thước danh mục và các khu vực nội dung theo mẫu đã chọn mà không làm thay đổi dữ liệu hay chức năng mua hàng.
- Giữ nguyên màu neon gaming và hệ thống sáng/tối hiện tại; mỗi mẫu chỉ thay đổi cách sắp xếp và mật độ hiển thị.

## Tối ưu điện thoại
- Khóa chiều rộng toàn trang, ngăn mọi nội dung gây cuộn ngang.
- Các thanh điều hướng, bảng, biểu mẫu và thẻ nội dung co đúng màn hình; phần dài chỉ cuộn dọc hoặc cuộn trong vùng riêng khi thực sự cần.
- Menu Admin trên điện thoại hiển thị theo chiều dọc, không tạo dải tab kéo ngang.

## Kiểm tra
- Kiểm tra quyền chỉ admin mới thấy và lưu được lựa chọn.
- Kiểm tra đổi cả 3 mẫu cập nhật đúng ngoài trang chủ.
- Kiểm tra màn hình điện thoại không tràn viền và không kéo trái/phải.
- Cập nhật `schema.sql` với khóa cài đặt mẫu giao diện.
