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
- Chọn vòng và bấm **Hiện tên vòng**. Với Chướng ngại vật, lúc này chỉ có ảnh che, chưa có câu hỏi.
- **Bộ đề 01 có sẵn 52 mục chơi**, không có form nhập câu hỏi, nhập JSON bộ đề hay URL media. Chọn vòng và câu trong danh sách; xem trước chỉ MC thấy. **Mở câu đã chọn** đưa câu lên năm máy, **Bắt đầu** chạy đồng hồ. Câu đã mở được đánh dấu và khóa để tránh lặp. Khởi động riêng trả lời miệng, không có ô nhập hoặc chuông. Khởi động chung chỉ bấm chuông, đội đầu trả lời miệng. Về đích chỉ đội được chỉ định gửi đáp án.
- Chỉ đáp án đầu tiên của mỗi đội được nhận; hết giờ hoặc MC khóa thì máy chủ từ chối gửi thêm. Form hiện ngay khi mở câu, nhưng chưa được nhập/gửi trước hiệu lệnh.
- Chuông: máy chủ gán thứ tự xử lý, luôn có duy nhất một đội đầu tiên. Cả ba đội đều thấy thứ tự; ở Khởi động chung đội đầu trả lời miệng, các vòng khác chỉ đội đầu được gửi đáp án. Không dùng thời gian do người chơi gửi. Độ trễ mạng vẫn ảnh hưởng khi bấm sát nhau.
- Đáp án gửi về chỉ MC và chính đội đó thấy nội dung. Màn chiếu hiện trạng thái đã gửi. Sau khi khóa, **Công bố đáp án các đội** hiển thị đồng thời, tránh đội sau đọc đáp án đội trước.
- MC nhập điểm ở **Điểm các đội** và bấm Lưu. Không có tự cộng, trừ, thưởng sao hay chuyển điểm.
- **Mở ô ảnh** là quyết định của MC sau khi xác định câu đúng; không sửa điểm. **Chờ câu tiếp** giữ các mảnh ảnh đã mở và ẩn câu cũ.
- Bộ đề kiến thức phổ thông tự biên soạn: 18 câu Khởi động riêng (6/đội), 12 chung, 4 hàng ngang + 1 ô trung tâm + 1 mục đoán CNV, 4 Tăng tốc, 9 Về đích (3/đội, gói 20–20–30), 3 câu phụ. Đủ câu hỏi, đáp án, lựa chọn, thời gian, hình và video 6 giây tự tạo. Câu chung cho 3 giây giành chuông rồi 3 giây trả lời từ chuông đầu tiên. Video do màn chiếu bấm phát; chưa đồng bộ vị trí phát media.
- Đáp án và toàn bộ catalog chỉ gửi tới vai trò MC qua WebSocket; người chơi chỉ nhận câu đang mở. Bộ đề nằm trong repo công khai nên dùng cho sân chơi giao lưu, không phải đề bí mật chống tra cứu.

Màn chiếu dùng bảng điểm dọc bên trái và tiêu đề vòng lớn hơn. MC có bố cục hai cột trên máy tính: điều khiển/chọn câu/sửa điểm bên cạnh câu đang chơi và đáp án; liên kết, sao lưu, hướng dẫn mặc định thu gọn, bấm tiêu đề để mở.

## Mất mạng và sao lưu

- WebSocket tự kết nối lại; khi máy chủ còn chạy, thiết bị nhận trạng thái hiện tại, chuông và đáp án cũ không bị xóa.
- Máy chủ hiện giữ phòng trong RAM, chạy **một instance**. Khởi động lại/deploy/spin-down sẽ mất phòng. Render Free có thể tự khởi động lại; đây là cấu hình chạy thử, chưa phải hạ tầng lưu bền cho sự kiện quan trọng.
- MC được tự sao lưu trạng thái vào localStorage thiết bị. Dùng **Tải bản sao trận** để lưu tệp riêng. Mục **Bản sao trận trên thiết bị này** ở cuối trang cho tải bản sao ngay cả khi phòng cũ không còn tồn tại.
- Sau khi máy chủ mất phòng: tạo phòng mới, nhập bản sao để khôi phục tên, điểm, ô hình và hàng đã chọn. Bắt đầu ở trạng thái chờ câu mới; đáp án/chuông cũ chỉ để đối chiếu trong tệp, không tự diễn lại. Gửi lại năm link của phòng mới.
- Không gửi dữ liệu nhạy cảm vào câu hỏi/đáp án. Các link vai trò là quyền truy cập; không đăng công khai link MC.

## Kiểm thử

`npm ci && npm test`. Có kiểm thử bằng năm kết nối WebSocket độc lập và năm giao diện jsdom: câu hỏi mở đồng thời, nhập/trắc nghiệm, không mất nội dung đang soạn khi đội khác gửi, ẩn/công bố đáp án, sửa điểm, thứ tự chuông, phân quyền, timeout, chống gửi lặp/câu cũ, kết nối lại và khôi phục sao lưu. Chưa có browser kết nối trong phiên để xác minh hình thức bằng screenshot.

Nguồn nền tảng: [Render WebSockets](https://render.com/docs/websocket), [Blueprint](https://render.com/docs/blueprint-spec), [giới hạn Free](https://render.com/docs/free).

## Render CLI đã kết nối trên terminal dự án

CLI chính thức v2.28.0 tại `.render-local/render`, đã xác minh SHA256 bản phát hành. Wrapper `./scripts/render.sh` dùng config đăng nhập riêng `.render-local/cli.yaml`. Toàn bộ `.render-local/` bị Git bỏ qua; không đọc/in/chia sẻ config chứa token.

Workspace: `Mino` (`tea-db0mrdc9v7es73c4sm80`). Service: `olympia-arena-live` (`srv-db0n277avr4c738f95hg`).

```sh
./scripts/render.sh services --output json
./scripts/render.sh deploys list srv-db0n277avr4c738f95hg --output json
./scripts/deploy-render.sh --commit <full-git-sha-da-push>
```

Deploy script chờ kết quả và báo lỗi nếu deploy thất bại. Xem bản đang live trước để tránh restart không cần thiết. CLI token có thể hết hạn; khi đó chạy `./scripts/render.sh login --output text` và chủ tài khoản Authorize CLI lại. Đây là phiên xác thực được lưu, không phải thiết lập tự deploy mỗi push.
