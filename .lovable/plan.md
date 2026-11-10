# Kietz AI dữ liệu shop và quy trình giao đơn

## Mục tiêu
- Kietz AI trả lời theo sản phẩm, danh mục, hotline và thông báo bảo trì đang được lưu trong shop.
- Đơn mua xuất hiện tự động trong trang quản trị với trạng thái đã thanh toán, đang xử lý hoặc đã giao; admin có thể xác nhận và giao thông tin hàng.

## Cách thực hiện
- Bổ sung cho chức năng chat một bản tóm tắt dữ liệu shop đang hoạt động: sản phẩm, giá, kho, danh mục, hotline và cài đặt bảo trì. Chỉ đưa dữ liệu công khai vào ngữ cảnh, không đưa thông tin khách hàng hoặc bí mật cấu hình.
- Đổi trạng thái mặc định của đơn mới thành “Đã thanh toán”. Sau khi admin xác nhận, chuyển sang “Đang xử lý”; khi admin giao thông tin tài khoản và xác nhận, chuyển thành “Đã giao”.
- Giữ hàng đã giữ gắn với đơn để admin có thể giao đúng hàng; không hiển thị thông tin giao hàng cho khách trước khi đơn được giao.
- Cập nhật danh sách đơn admin theo thời gian thực, hiển thị trạng thái và các thao tác xác nhận/giao; cập nhật trang chi tiết đơn hàng theo trạng thái.
- Đồng bộ `supabase/schema.sql` và thêm kiểm thử cho các quy tắc trạng thái/giao hàng.

## Kỹ thuật
- Dùng bảng `products`, `categories`, `shop_settings`, `orders` và `product_accounts` hiện có, cùng quyền admin hiện có; không tạo bảng mới.
- Dùng migration Lovable Cloud cho thay đổi mặc định trạng thái và logic mua hàng; cập nhật Edge Function AI để tải ngữ cảnh trực tiếp từ dữ liệu hiện hành.
