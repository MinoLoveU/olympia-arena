# Olympia trực tuyến — 5 thiết bị

Bản này chạy bằng `npm start`, thay cho server tĩnh `npm run dev`. Giao diện theo ảnh mẫu Olympia: nền cyan–xanh dương, bảng navy, viền cyan/bạc, nút nổi bóng và ô hình Chướng ngại vật, tách quyền cho **1 MC, 1 màn trình chiếu, 3 người chơi**. Khởi động tự tính điểm khi MC chấm; các vòng khác vẫn nhập điểm thủ công.

## Triển khai Render

[Deploy lên Render](https://render.com/deploy?repo=https://github.com/MinoLoveU/olympia-arena)

1. Đăng nhập Render và kết nối GitHub MinoLoveU nếu được yêu cầu.
2. Dùng Blueprint `render.yaml` trong repo. Dịch vụ `olympia-arena-live`, Node, `npm ci --omit=dev`, `npm start`, health `/health`, plan `free`.
3. Bấm Deploy và đợi trạng thái Live. Mở URL `https://…onrender.com` Render cấp. Cả giao diện và máy chủ dùng URL này, không nhập thêm URL backend.
4. Auto-deploy tắt để push code không tự khởi động lại máy chủ giữa trận. Sau các thay đổi cần chủ động deploy lúc không thi.

Repo/Blueprint đã sẵn sàng; chỉ đăng nhập GitHub không cấp quyền triển khai Render. Cần chủ tài khoản hoàn thành kết nối Render. Không gửi token hay mật khẩu trong chat.

## Điều khiển trận

- Mở URL Render → **Tạo phòng thi mới** → nhập mật khẩu. Máy này nhận vai trò MC.
- Chỉ màn MC yêu cầu nhập lại mật khẩu mỗi lần tải lại trang. Màn trình chiếu và người chơi chỉ cần link riêng, không nhập mật khẩu. Máy chủ kiểm tra mật khẩu trước khi gửi trạng thái hoặc link vai trò, kể cả kết nối WebSocket trực tiếp. Không lưu mật khẩu vào cookie/localStorage/sessionStorage; mất mạng tạm thời có thể kết nối lại trong cùng lần mở trang.
- Trong **Liên kết cho 5 thiết bị**, sao chép link trình chiếu và ba link người chơi. Mỗi link mang quyền riêng; giữ kín link MC. MC cũng có thể mở link của mình trên máy khác, các link vai trò được máy chủ gửi lại cho MC.
- Chọn vòng và bấm **Hiện tên vòng**. Với Chướng ngại vật, lúc này chỉ có ảnh che, chưa có câu hỏi.
- **Bộ đề 01 có sẵn 263 mục chơi**, không có form nhập câu hỏi, nhập JSON bộ đề hay URL media. Chọn vòng và câu trong danh sách; xem trước chỉ MC thấy. **Mở câu đã chọn** đưa câu lên năm máy, **Bắt đầu** chạy đồng hồ. Câu đã mở được đánh dấu và khóa để tránh lặp. Khởi động riêng trả lời miệng, không có ô nhập hoặc chuông. Khởi động chung chỉ bấm chuông, đội đầu trả lời miệng. Về đích chỉ đội được chỉ định gửi đáp án.
- Chỉ đáp án đầu tiên của mỗi đội được nhận; hết giờ hoặc MC khóa thì máy chủ từ chối gửi thêm. Form hiện ngay khi mở câu, nhưng chưa được nhập/gửi trước hiệu lệnh.
- Chuông: máy chủ gán thứ tự xử lý, luôn có duy nhất một đội đầu tiên. Cả ba đội đều thấy thứ tự; ở Khởi động chung đội đầu trả lời miệng, các vòng khác chỉ đội đầu được gửi đáp án. Không dùng thời gian do người chơi gửi. Độ trễ mạng vẫn ảnh hưởng khi bấm sát nhau.
- Đáp án gửi về chỉ MC và chính đội đó thấy nội dung. Màn chiếu hiện trạng thái đã gửi. Sau khi khóa, **Công bố đáp án các đội** hiển thị đồng thời, tránh đội sau đọc đáp án đội trước.
- Trong **Chấm và sửa điểm**, sau khi hết giờ hoặc bấm **Khóa trả lời**, MC chọn **Đúng / Sai / Không trả lời** cho đội có quyền trả lời. Khởi động riêng: đúng +10, sai/không trả lời 0. Khởi động chung: đúng +10, sai/không trả lời −5, chỉ chấm đội giành chuông đầu tiên. MC xác nhận không trả lời miệng bằng nút **Không trả lời**; hết giờ không tự suy đoán kết quả. Không ai bấm chuông thì không trừ đội nào.
- Máy chủ chống chấm lặp. Đổi kết quả hoặc **Bỏ chấm** điều chỉnh lại phần điểm của câu hiện tại (ví dụ +10 đổi sang −5 làm tổng điểm giảm 15). Mở câu tiếp theo giữ tổng điểm và xóa trạng thái chấm câu cũ. Có thể sửa tổng điểm bằng ô số và **Lưu**.
- Các vòng còn lại có nút chấm để ghi nhận, chưa tự cộng/trừ điểm hoặc mở ô ảnh. Chấm và tổng điểm đồng bộ lên cả 5 thiết bị.
- **Mở ô ảnh** là quyết định của MC sau khi xác định câu đúng; không sửa điểm. **Chờ câu tiếp** giữ các mảnh ảnh đã mở và ẩn câu cũ.
- Bộ đề kiến thức phổ thông tự biên soạn: 60 câu Khởi động: 45 câu riêng (15/đội) + 15 câu chung, 8 bộ CNV (64 gợi ý ngoài + 8 trung tâm + 8 lượt đoán), 60 Tăng tốc, 60 Về đích (20 câu/đội, tất cả 20 điểm và 15 giây), 3 câu phụ. Đủ câu hỏi, đáp án, lựa chọn, thời gian, hình và video 6 giây tự tạo. Câu chung cho 3 giây giành chuông. Khi có đội giành quyền, đồng hồ và tiếng đếm ngược dừng; không tự hết giờ trả lời miệng. MC bấm Khóa trả lời rồi chấm. Video do màn chiếu bấm phát; chưa đồng bộ vị trí phát media.
- Đáp án và toàn bộ catalog chỉ gửi tới vai trò MC qua WebSocket; người chơi chỉ nhận câu đang mở. Bộ đề nằm trong repo công khai nên dùng cho sân chơi giao lưu, không phải đề bí mật chống tra cứu.

Màn chiếu dùng bảng điểm dọc bên trái và tiêu đề vòng lớn hơn. MC có bố cục hai cột trên máy tính: điều khiển/chọn câu/sửa điểm bên cạnh câu đang chơi và đáp án; liên kết, sao lưu, hướng dẫn mặc định thu gọn, bấm tiêu đề để mở.

## Mất mạng và sao lưu

- WebSocket tự kết nối lại; khi máy chủ còn chạy, thiết bị nhận trạng thái hiện tại, chuông và đáp án cũ không bị xóa.
- Máy chủ hiện giữ phòng trong RAM, chạy **một instance**. Khởi động lại/deploy/spin-down sẽ mất phòng. Render Free có thể tự khởi động lại; đây là cấu hình chạy thử, chưa phải hạ tầng lưu bền cho sự kiện quan trọng.
- MC được tự sao lưu trạng thái vào localStorage thiết bị. Dùng **Tải bản sao trận** để lưu tệp riêng. Mục **Bản sao trận trên thiết bị này** ở cuối trang cho tải bản sao ngay cả khi phòng cũ không còn tồn tại.
- Sau khi máy chủ mất phòng: tạo phòng mới, nhập bản sao để khôi phục tên, điểm, ô hình và hàng đã chọn. Bắt đầu ở trạng thái chờ câu mới; đáp án/chuông cũ chỉ để đối chiếu trong tệp, không tự diễn lại. Gửi lại năm link của phòng mới.
- Không gửi dữ liệu nhạy cảm vào câu hỏi/đáp án. Các link vai trò là quyền truy cập; không đăng công khai link MC.

## Âm thanh và đội giành quyền

Trên **màn trình chiếu**, bấm **Bật âm thanh** một lần sau khi mở trang. Có chuông cho đội giành quyền đầu tiên (theo máy chủ), tick đếm ngược từng giây (ba giây cuối cao hơn), âm hết giờ giai điệu khi MC chấm đúng và hai nhịp ngắn, nhịp sau thấp hơn khi MC chấm sai ở mọi vòng. Chuông và âm đúng dùng nhiều lớp âm với phần mở đầu ngắn, rõ; âm đếm ngược giữ nguyên mức. Chỉ nút Sai phát âm sai; Không trả lời/Bỏ chấm không phát. Bấm lại để tắt. Chỉ màn trình chiếu phát; nếu mở nhiều màn chiếu, chỉ bật một máy. Không phát lại chuông/kết quả cũ khi tải trang hoặc nối lại mạng. Hiệu ứng tổng hợp riêng bằng Web Audio, không cần tải file nhạc.

Khởi động chung: thẻ điểm đội bấm đầu tiên đổi nền/viền vàng, hiện nhãn **GIÀNH QUYỀN** ở cả năm vai trò; giữ đến khi đổi câu hoặc về màn chờ.

## Màn người chơi trên máy tính

Cả ba vai trò người chơi dùng toàn bộ cửa sổ từ 761px ngang: câu hỏi bên trái, nhập/chọn đáp án hoặc chuông bên phải, bảng điểm ở trên và kết quả ở dưới. Chiều cao bám visualViewport/innerHeight, tự cập nhật khi resize; chữ câu hỏi/đáp án dài tự thu để vừa khung. Màn nhỏ hơn vẫn dùng bố cục dọc.

## Kiểm thử

Máy chủ cần `OLYMPIA_ACCESS_HASH` chứa verifier scrypt do `hashPassword` trong `multiplayer/access.js` tạo. Không đưa mật khẩu hoặc verifier vào Git. Thiếu cấu hình thì tạo phòng và truy cập MC bị từ chối. Render hiện cấu hình biến này qua lệnh khởi động riêng của service; giữ cấu hình đó khi cập nhật triển khai. Giới hạn 10 lần nhập sai/phút theo phòng/vai trò; tạo phòng giới hạn theo địa chỉ kết nối máy chủ.

`npm ci && npm test`. Có kiểm thử bằng năm kết nối WebSocket độc lập và năm giao diện jsdom: câu hỏi mở đồng thời, nhập/trắc nghiệm, đổi 8 bộ và khôi phục tiến độ độc lập, kiểm tra 263 câu và đếm hình SVG, không mất nội dung đang soạn khi đội khác gửi, ẩn/công bố đáp án, sửa điểm, thứ tự chuông, phân quyền, timeout, chống gửi lặp/câu cũ, kết nối lại và khôi phục sao lưu. Chưa có browser kết nối trong phiên để xác minh hình thức bằng screenshot.

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

Chướng ngại vật: trên máy MC chọn **Bộ chướng ngại vật** → **Đưa bộ lên màn chiếu**, sau đó chọn gợi ý. Có 8 bộ, mỗi bộ có ảnh và tiến độ mở ô riêng; đổi bộ hoặc đổi vòng rồi quay lại vẫn giữ các ô đã mở. Sao lưu giữ tiến độ cả 8 bộ. Ảnh chia 3 × 3: 8 ô gợi ý ngoài là các hình vuông bằng nhau (mỗi chiều bằng 1/3 ảnh). Ô trung tâm rộng/cao 38%, nằm chính giữa (cách mép trái/trên 31%) và đè lên cả 8 ô ngoài bằng lớp hiển thị cao hơn. MC chọn gợi ý 1–8 theo thứ tự đội yêu cầu; trung tâm chỉ chọn sau đủ 8 gợi ý. Bản sao cũ tự chuyển ô trung tâm cũ sang ô trung tâm mới.

Tăng tốc có 60 câu: nhìn nhanh, sắp xếp, suy luận và câu video có sẵn; các câu nhìn nhanh/sắp xếp 20 giây, suy luận/video 30 giây. Các vòng ngoài Khởi động vẫn chấm và nhập điểm thủ công theo phạm vi hiện tại.
