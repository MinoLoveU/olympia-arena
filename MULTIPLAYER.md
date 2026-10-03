# Olympia trực tuyến — 5 thiết bị

Bản này chạy bằng `npm start`, thay cho server tĩnh `npm run dev`. Giữ giao diện xanh/cyan/vàng và ô hình Chướng ngại vật, tách quyền cho **1 MC, 1 màn trình chiếu, 3 người chơi**. Không tự tính điểm.

## Triển khai Render

[Deploy lên Render](https://render.com/deploy?repo=https://github.com/MinoLoveU/olympia-arena)

1. Đăng nhập Render và kết nối GitHub MinoLoveU nếu được yêu cầu.
2. Dùng Blueprint `render.yaml` trong repo. Dịch vụ `olympia-arena-live`, Node, `npm ci --omit=dev`, `npm start`, health `/health`, plan `free`.
3. Bấm Deploy và đợi trạng thái Live. Mở URL `https://…onrender.com` Render cấp. Cả giao diện và máy chủ dùng URL này, không nhập thêm URL backend.
4. Auto-deploy tắt để push code không tự khởi động lại máy chủ giữa trận. Sau các thay đổi cần chủ động deploy lúc không thi.

Repo/Blueprint đã sẵn sàng; chỉ đăng nhập GitHub không cấp quyền triển khai Render. Cần chủ tài khoản hoàn thành kết nối Render. Không gửi token hay mật khẩu trong chat.

## Điều khiển trận

- Mở URL Render → **Tạo phòng thi mới**. Máy này nhận vai trò MC.
- Trong **Liên kết cho 5 thiết bị**, sao chép link trình chiếu và ba link người chơi. Mỗi link mang quyền riêng; giữ kín link MC. MC cũng có thể mở link của mình trên máy khác, các link vai trò được máy chủ gửi lại cho MC.
- Chọn vòng và bấm **Đưa vòng lên màn chiếu**. Với Chướng ngại vật, lúc này chỉ có ảnh che, chưa có câu hỏi.
- Soạn câu, chọn Điền / Trắc nghiệm / Chuông. Với Chướng ngại vật, chọn hàng đội yêu cầu. **Mở câu hỏi** đưa câu lên cả năm máy; **Bắt đầu nhận đáp án** mở form và đồng hồ chung sau khi đọc xong.
- Chỉ đáp án đầu tiên của mỗi đội được nhận; hết giờ hoặc MC khóa thì máy chủ từ chối gửi thêm. Form hiện ngay khi mở câu, nhưng chưa được nhập/gửi trước hiệu lệnh.
- Chuông: máy chủ gán thứ tự xử lý, luôn có duy nhất một đội đầu tiên. Cả ba đội đều thấy thứ tự; chỉ đội đầu được gửi đáp án. Không dùng thời gian do người chơi gửi. Độ trễ mạng vẫn ảnh hưởng khi bấm sát nhau.
- Đáp án gửi về chỉ MC và chính đội đó thấy nội dung. Màn chiếu hiện trạng thái đã gửi. Sau khi khóa, **Công bố đáp án các đội** hiển thị đồng thời, tránh đội sau đọc đáp án đội trước.
- MC nhập điểm ở **Điểm do MC quyết định** và bấm Lưu. Không có tự cộng, trừ, thưởng sao hay chuyển điểm.
- **Mở ô ảnh tương ứng** là quyết định của MC sau khi xác định câu đúng; không sửa điểm. **Chờ chọn câu tiếp theo** giữ các mảnh ảnh đã mở và ẩn câu cũ.
- Bộ câu hỏi JSON từ bản cũ có thể nhập, nạp từng câu vào bản nháp rồi mở. Nội dung bản nháp không gửi cho người chơi. Video/audio do từng thiết bị bấm phát, chưa đồng bộ vị trí phát media.

## Mất mạng và sao lưu

- WebSocket tự kết nối lại; khi máy chủ còn chạy, thiết bị nhận trạng thái hiện tại, chuông và đáp án cũ không bị xóa.
- Máy chủ hiện giữ phòng trong RAM, chạy **một instance**. Khởi động lại/deploy/spin-down sẽ mất phòng. Render Free có thể tự khởi động lại; đây là cấu hình chạy thử, chưa phải hạ tầng lưu bền cho sự kiện quan trọng.
- MC được tự sao lưu trạng thái vào localStorage thiết bị. Dùng **Tải bản sao trận** để lưu tệp riêng. Mục **Bản sao trận trên thiết bị này** ở cuối trang cho tải bản sao ngay cả khi phòng cũ không còn tồn tại.
- Sau khi máy chủ mất phòng: tạo phòng mới, nhập bản sao để khôi phục tên, điểm, ô hình và hàng đã chọn. Bắt đầu ở trạng thái chờ câu mới; đáp án/chuông cũ chỉ để đối chiếu trong tệp, không tự diễn lại. Gửi lại năm link của phòng mới.
- Không gửi dữ liệu nhạy cảm vào câu hỏi/đáp án. Các link vai trò là quyền truy cập; không đăng công khai link MC.

## Kiểm thử

`npm ci && npm test`. Có kiểm thử bằng năm kết nối WebSocket độc lập và năm giao diện jsdom: câu hỏi mở đồng thời, nhập/trắc nghiệm, không mất nội dung đang soạn khi đội khác gửi, ẩn/công bố đáp án, sửa điểm, thứ tự chuông, phân quyền, timeout, chống gửi lặp/câu cũ, kết nối lại và khôi phục sao lưu. Chưa có browser kết nối trong phiên để xác minh hình thức bằng screenshot.

Nguồn nền tảng: [Render WebSockets](https://render.com/docs/websocket), [Blueprint](https://render.com/docs/blueprint-spec), [giới hạn Free](https://render.com/docs/free).
