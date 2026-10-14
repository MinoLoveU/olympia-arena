# Olympia trực tuyến — 5 thiết bị

Bản này chạy bằng `npm start`, thay cho server tĩnh `npm run dev`. Giao diện theo ảnh mẫu Olympia: nền cyan–xanh dương, bảng navy, viền cyan/bạc, nút nổi bóng và ô hình Chướng ngại vật, tách quyền cho **1 MC, 1 màn trình chiếu, 3 người chơi**. Khởi động, Tăng tốc và câu Về đích dùng Ngôi sao hy vọng tự tính điểm khi MC chấm; các câu khác vẫn nhập điểm thủ công.

## Triển khai Render

[Deploy lên Render](https://render.com/deploy?repo=https://github.com/MinoLoveU/olympia-arena)

1. Đăng nhập Render và kết nối GitHub MinoLoveU nếu được yêu cầu.
2. Dùng Blueprint `render.yaml` trong repo. Dịch vụ `olympia-arena-live`, Node, `npm ci --omit=dev`, `npm start`, health `/health`, plan `free`.
3. Bấm Deploy và đợi trạng thái Live. Mở URL `https://…onrender.com` Render cấp. Cả giao diện và máy chủ dùng URL này, không nhập thêm URL backend.
4. Auto-deploy tắt để push code không tự khởi động lại máy chủ giữa trận. Sau các thay đổi cần chủ động deploy lúc không thi.

Repo/Blueprint đã sẵn sàng; chỉ đăng nhập GitHub không cấp quyền triển khai Render. Cần chủ tài khoản hoàn thành kết nối Render. Không gửi token hay mật khẩu trong chat.

## Nguồn Khởi động — cập nhật 11/10/2026

[Google Docs của chủ tài khoản](https://docs.google.com/document/d/1Ol5m_6xGHH-ACBXETOBE8TPQTFwJAxfg8j7cb_b6rcg/edit): nhập 57 câu đã điền, lấy đáp án in đậm sau mũi tên/ngoặc; giữ phần nhấn mạnh in đậm nằm trong câu hỏi. Giữ nguyên nội dung/đáp án nguồn, không tự hiệu đính kiến thức. Câu 15 Đội Cầu truyền hình (warm-27) đã bổ sung theo Hazei ngày 14/10: Lang Liêu dâng lễ vật → Bánh chưng và bánh dày. Không đưa ba câu bổ sung cuối tài liệu vào. Câu chung 5 dùng ảnh JPEG nguyên bản, giữ ảnh có sẵn và đáp án riêng MC. IDs/đội/thứ tự các vị trí vẫn giữ để tương thích sao lưu.

## Nguồn Về đích — cập nhật 13/10/2026

[Tab Về đích của chủ tài khoản](https://docs.google.com/document/d/1G6_FyhlkHjh543TJqjwKIXD_q5fx5iWnE1geqKsCwos/edit?tab=t.d565as2bnh7u): 60 câu chia đúng 20 câu/đội, giữ số câu và IDs cũ; 20 điểm/15 giây và 3 sao/đội. Nội dung/đáp án chép theo tài liệu, chưa hiệu đính kiến thức. Sáu câu tiếng Anh chỉ hiện “Xin mời các bạn trả lời câu hỏi sau bằng Tiếng Anh”, không hiện kịch bản tiếng Anh phía sau. Tám câu có ảnh, gồm hệ phương trình và bộ ba hình; câu 5 đội Chủ nghĩa xã hội giữ hai phương trình dạng chữ.

Sáu video được lưu cùng ứng dụng, chuyển sang H.264/AAC để trình duyệt phát trực tiếp. Khi mở câu có video, MC có nút **Bật / phát lại video** và **Dừng video**. Màn trình chiếu và ba màn đội chơi phát hình/tiếng; nút video không khởi động đồng hồ. Xem xong, MC bấm **Bắt đầu** để tính 15 giây trả lời. Nếu trình duyệt chặn tự phát có tiếng, bấm biểu tượng **▶** trên video. Âm lượng video điều chỉnh bằng thanh điều khiển của video, độc lập nút hiệu ứng âm thanh.

Lệnh video được máy chủ kiểm tra quyền MC và câu hiện tại; đồng bộ lặp không phát lại. Khi tải lại trang đang phát, màn chiếu cố tiếp tục theo thời điểm máy chủ, có thể cần bấm cho phép phát tiếng lại. Video được truyền theo từng phần (HTTP Range), không đọc toàn bộ tệp vào RAM cho mỗi lượt xem.

## Điều khiển trận

- Mở URL Render → **Tạo phòng thi mới** → nhập mật khẩu. Máy này nhận vai trò MC.
- Chỉ màn MC yêu cầu nhập lại mật khẩu mỗi lần tải lại trang. Màn trình chiếu và người chơi chỉ cần link riêng, không nhập mật khẩu. Máy chủ kiểm tra mật khẩu trước khi gửi trạng thái hoặc link vai trò, kể cả kết nối WebSocket trực tiếp. Không lưu mật khẩu vào cookie/localStorage/sessionStorage; mất mạng tạm thời có thể kết nối lại trong cùng lần mở trang.
- Trong **Liên kết cho 5 thiết bị**, sao chép link trình chiếu và ba link người chơi. Mỗi link mang quyền riêng; giữ kín link MC. MC cũng có thể mở link của mình trên máy khác, các link vai trò được máy chủ gửi lại cho MC.
- Chọn vòng và bấm **Hiện tên vòng**. Với Chướng ngại vật, lúc này chỉ có ảnh che, chưa có câu hỏi.
- **Bộ đề 01 có sẵn 263 câu đã điền**, không có form nhập câu hỏi, nhập JSON bộ đề hay URL media. Chọn vòng và câu trong danh sách; xem trước chỉ MC thấy. **Mở câu đã chọn** đưa câu lên năm máy, **Bắt đầu** chạy đồng hồ. Câu đã mở được đánh dấu và khóa để tránh lặp. Khởi động riêng trả lời miệng, không có ô nhập hoặc chuông. Khởi động chung chỉ bấm chuông, đội đầu trả lời miệng. Về đích chỉ đội được chỉ định gửi đáp án.
- Chỉ đáp án đầu tiên của mỗi đội được nhận; hết giờ hoặc MC khóa thì máy chủ từ chối gửi thêm. Form hiện ngay khi mở câu, nhưng chưa được nhập/gửi trước hiệu lệnh.
- Chuông: máy chủ gán thứ tự xử lý, luôn có duy nhất một đội đầu tiên. Cả ba đội đều thấy thứ tự; ở Khởi động chung đội đầu trả lời miệng, các vòng khác chỉ đội đầu được gửi đáp án. Không dùng thời gian do người chơi gửi. Độ trễ mạng vẫn ảnh hưởng khi bấm sát nhau.
- Đáp án gửi về chỉ MC và chính đội đó thấy nội dung. Màn chiếu hiện trạng thái đã gửi. Sau khi khóa, **Công bố đáp án các đội** hiển thị đồng thời, tránh đội sau đọc đáp án đội trước.
- Trong **Chấm và sửa điểm**, sau khi hết giờ hoặc bấm **Khóa trả lời**, MC chọn **Đúng / Sai / Không trả lời** cho đội có quyền trả lời. Khởi động riêng: đúng +10, sai/không trả lời 0. Khởi động chung: đúng +10, sai/không trả lời −5, chỉ chấm đội giành chuông đầu tiên. MC xác nhận không trả lời miệng bằng nút **Không trả lời**; hết giờ không tự suy đoán kết quả. Không ai bấm chuông thì không trừ đội nào.
- Máy chủ chống chấm lặp. Đổi kết quả hoặc **Bỏ chấm** điều chỉnh lại phần điểm của câu hiện tại (ví dụ +10 đổi sang −5 làm tổng điểm giảm 15). Mở câu tiếp theo giữ tổng điểm và xóa trạng thái chấm câu cũ. Có thể sửa tổng điểm bằng ô số và **Lưu**.
- Ngoài Khởi động, Tăng tốc và câu Về đích dùng sao, nút chấm chỉ ghi nhận; MC nhập điểm thủ công. Không tự mở ô ảnh. Chấm và tổng điểm đồng bộ lên cả 5 thiết bị.
- **Mở ô ảnh** là quyết định của MC sau khi xác định câu đúng; không sửa điểm. **Chờ câu tiếp** giữ các mảnh ảnh đã mở và ẩn câu cũ.
- Khởi động theo tài liệu của chủ tài khoản: 60 vị trí gồm 45 câu riêng (15/đội, chỉ câu 15 Đội Cầu truyền hình còn trống) + 15 câu chung. Các vòng còn lại: 8 bộ CNV (64 gợi ý ngoài + 8 trung tâm + 8 lượt đoán), 60 Tăng tốc, 60 Về đích (20 câu/đội, tất cả 20 điểm và 15 giây), 3 câu phụ. Các câu đã điền có đáp án; hình câu 5 Khởi động chung lấy nguyên từ tài liệu. Các media khác giữ nguyên. Câu chung cho 3 giây giành chuông. Khi có đội giành quyền, đồng hồ và tiếng đếm ngược dừng; không tự hết giờ trả lời miệng. MC bấm Khóa trả lời rồi chấm. Video do màn chiếu bấm phát; chưa đồng bộ vị trí phát media.
- Đáp án và toàn bộ catalog chỉ gửi tới vai trò MC qua WebSocket; người chơi chỉ nhận câu đang mở. Bộ đề nằm trong repo công khai nên dùng cho sân chơi giao lưu, không phải đề bí mật chống tra cứu.

Màn chiếu dùng bảng điểm dọc bên trái và tiêu đề vòng lớn hơn. MC có bố cục hai cột trên máy tính: điều khiển/chọn câu/sửa điểm bên cạnh câu đang chơi và đáp án; liên kết, sao lưu, hướng dẫn mặc định thu gọn, bấm tiêu đề để mở.

## Mất mạng và sao lưu

- WebSocket tự kết nối lại; khi máy chủ còn chạy, thiết bị nhận trạng thái hiện tại, chuông và đáp án cũ không bị xóa.
- Máy chủ hiện giữ phòng trong RAM, chạy **một instance**. Khởi động lại/deploy/spin-down sẽ mất phòng. Render Free có thể tự khởi động lại; đây là cấu hình chạy thử, chưa phải hạ tầng lưu bền cho sự kiện quan trọng.
- MC được tự sao lưu trạng thái vào localStorage thiết bị. Dùng **Tải bản sao trận** để lưu tệp riêng. Mục **Bản sao trận trên thiết bị này** ở cuối trang cho tải bản sao ngay cả khi phòng cũ không còn tồn tại.
- Sau khi máy chủ mất phòng: tạo phòng mới, nhập bản sao để khôi phục tên, điểm, ô hình và hàng đã chọn. Bắt đầu ở trạng thái chờ câu mới; đáp án/chuông cũ chỉ để đối chiếu trong tệp, không tự diễn lại. Gửi lại năm link của phòng mới.
- Không gửi dữ liệu nhạy cảm vào câu hỏi/đáp án. Các link vai trò là quyền truy cập; không đăng công khai link MC.

## Ngôi sao hy vọng — Về đích

Mỗi đội có 20 câu Về đích (20 điểm/câu) và 3 ngôi sao trong toàn trận. MC mở câu của đội đó, bấm **★ Ngôi sao hy vọng** trước **Bắt đầu**. Dùng sao tiêu hao ngay một lượt; mỗi câu tối đa một sao, không hoàn lượt khi bỏ câu hoặc bỏ chấm. Bảng điểm hiện số sao còn lại của cả ba đội.

Màn trình chiếu có sao vàng lướt qua và giai điệu riêng (cần bật âm thanh). Nhãn sao ở câu hiện tại đồng bộ cả năm thiết bị; hiệu ứng không phát lại khi sync/tải lại/kết nối lại. MC khóa trả lời rồi chấm: đúng **+40**, sai hoặc không trả lời **−40**. Sửa kết quả áp dụng chênh lệch; bỏ chấm hoàn điểm câu, không hoàn sao. Câu không dùng sao vẫn nhập điểm thủ công. Backup giữ số sao đã dùng, không phát lại hiệu ứng hay lần chấm khi khôi phục; backup cũ mặc định chưa dùng sao.

## Âm thanh và đội giành quyền

Trên **màn trình chiếu**, bấm **Bật âm thanh** một lần sau khi mở trang. Có chuông cho đội giành quyền đầu tiên (theo máy chủ), tick đếm ngược từng giây (ba giây cuối cao hơn), âm hết giờ, giai điệu khi MC chấm đúng và ba nốt mềm đi xuống khi MC chấm sai ở mọi vòng. Âm đúng giữ giai điệu sáng đi lên; âm sai gồm ba nốt sin 494–392–294 Hz đi xuống. Mức khuếch đại chung hiện là 0,45 (+3,52 dB so với 0,30 trước đây). Chỉ nút Sai phát âm sai; Không trả lời/Bỏ chấm không phát. Bấm lại để tắt. Chỉ màn trình chiếu phát; nếu mở nhiều màn chiếu, chỉ bật một máy. Không phát lại chuông/kết quả cũ khi tải trang hoặc nối lại mạng. Hiệu ứng tổng hợp riêng bằng Web Audio, không cần tải file nhạc.

Khởi động chung: thẻ điểm đội bấm đầu tiên đổi nền/viền vàng, hiện nhãn **GIÀNH QUYỀN** ở cả năm vai trò; giữ đến khi đổi câu hoặc về màn chờ.

## Màn người chơi trên máy tính

Cả ba vai trò người chơi dùng toàn bộ cửa sổ từ 761px ngang: câu hỏi bên trái, nhập/chọn đáp án hoặc chuông bên phải, bảng điểm ở trên và kết quả ở dưới. Chiều cao bám visualViewport/innerHeight, tự cập nhật khi resize; chữ câu hỏi/đáp án dài tự thu để vừa khung. Màn nhỏ hơn vẫn dùng bố cục dọc.

## Kiểm thử

Máy chủ cần `OLYMPIA_ACCESS_HASH` chứa verifier scrypt do `hashPassword` trong `multiplayer/access.js` tạo. Không đưa mật khẩu hoặc verifier vào Git. Thiếu cấu hình thì tạo phòng và truy cập MC bị từ chối. Render hiện cấu hình biến này qua lệnh khởi động riêng của service; giữ cấu hình đó khi cập nhật triển khai. Giới hạn 10 lần nhập sai/phút theo phòng/vai trò; tạo phòng giới hạn theo địa chỉ kết nối máy chủ.

`npm ci && npm test`. Có kiểm thử bằng năm kết nối WebSocket độc lập và năm giao diện jsdom: câu hỏi mở đồng thời, nhập/trắc nghiệm, đổi 8 bộ và khôi phục tiến độ độc lập, kiểm tra đủ 263 câu đã điền, hình JPEG và đếm hình SVG, không mất nội dung đang soạn khi đội khác gửi, ẩn/công bố đáp án, sửa điểm, thứ tự chuông, phân quyền, timeout, chống gửi lặp/câu cũ, kết nối lại và khôi phục sao lưu. Chưa có browser kết nối trong phiên để xác minh hình thức bằng screenshot.

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

Tăng tốc có 60 câu: nhìn nhanh, sắp xếp, suy luận và câu video có sẵn; thời gian theo từng câu: 20, 25 hoặc 30 giây. Các câu ngoài Khởi động, Tăng tốc và câu Về đích có Ngôi sao hy vọng vẫn nhập điểm thủ công.


## Tăng tốc — cập nhật 12/10/2026
Cả 60 câu đều nhập đáp án, không đặt giới hạn ký tự và không cắt ngắn nội dung gửi lên. Giữ đáp án đầu tiên, khóa sau hạn như cũ. Câu sắp xếp số đã đưa các số vào đề để người chơi tự nhập thứ tự.

Khi MC công bố, màn chiếu ẩn khung câu hỏi và dùng toàn vùng bên phải bảng điểm cho ba câu trả lời, xếp từ trên xuống theo thứ tự máy chủ nhận; đội chưa gửi nằm cuối. Ẩn đáp án hoặc chuyển câu sẽ hiện lại khung câu hỏi. Góc mỗi câu ghi số giây với ba chữ số thập phân, tính từ Bắt đầu đến lúc máy chủ nhận; có bao gồm độ trễ mạng. Nếu cùng mili giây, dùng thứ tự nhận để phân hạng. Hiển thị thời gian không đồng nghĩa đo riêng thời gian suy nghĩ với độ chính xác tuyệt đối.

MC khóa trả lời rồi tích Đúng theo thứ tự muốn trao điểm: 40–30–20–10. Hiện có ba đội nên dùng ba mức đầu. Thứ tự điểm là thứ tự MC tích Đúng, độc lập với thứ tự gửi. Sai/Không trả lời được 0; đội chưa gửi không thể tích Đúng. Bấm lặp không cộng lại. Sửa hoặc Bỏ chấm sẽ tự xếp lại mức điểm các đội còn đúng và áp dụng chênh lệch vào tổng; tích Đúng lại sau khi bỏ/sửa đưa đội về cuối thứ tự chấm. Điều chỉnh điểm thủ công vẫn được giữ.

59 kiểm thử đạt, gồm năm giao diện/WebSocket, gửi văn bản Unicode dài hơn giới hạn cũ, giữ kín trước công bố, thời gian và thứ tự nhận, chấm theo thứ tự khác thứ tự gửi, sửa/bỏ chấm và sao lưu. Chưa kiểm tra bố cục bằng trình duyệt thực tế.

## Buổi chơi dài — bảo vệ kết nối
Máy chủ kiểm tra ping/pong mỗi 30 giây để dọn kết nối bị treo. Trình duyệt kiểm tra trạng thái mỗi 5 giây; nếu không có phản hồi hơn 20 giây, nó mở lại kết nối và đồng bộ trạng thái từ máy chủ. Khi mất kết nối thông thường, khoảng thử lại tăng từ 1,5 lên tối đa 15 giây. Không gửi lại thao tác chấm hoặc đáp án cũ tự động.

Nếu trạng thái không đổi, máy chủ chỉ gửi tín hiệu xác nhận nhỏ, không gửi lại toàn bộ bộ đề và dựng lại giao diện. Kết nối nhận quá chậm bị đóng khi hàng đợi gửi vượt 4 MiB để tránh tích tụ bộ nhớ; các máy khác và điểm trong phòng vẫn được giữ. Trường hợp trình duyệt MC không cho lưu bản sao, màn MC hiện cảnh báo dùng nút Tải bản sao trận.

Các cơ chế này không bảo đảm phòng tồn tại sau khi máy chủ khởi động lại: hiện vẫn lưu RAM. Render Free có thể restart bất kỳ lúc nào; lưu tệp vào ổ tạm cũng không giải quyết được. Với buổi thi cần độ tin cậy cao, cần dịch vụ luôn hoạt động và lưu trạng thái bền vững (cơ sở dữ liệu hoặc persistent disk). Chưa tự chuyển gói trả phí hay thêm dịch vụ. Nguồn: https://render.com/docs/free và https://render.com/docs/websocket .

Trước buổi thi, giữ các máy có nguồn điện và mạng ổn định, tắt chế độ ngủ; bật âm thanh trên màn chiếu. MC tải bản sao sau mỗi vòng. Không deploy hoặc restart trong trận. Nếu máy chủ mất phòng, tạo phòng mới, phục hồi bản sao rồi chia lại liên kết.

Chạy `node --expose-gc scripts/check-stability.js` để thử 10.800 lượt đồng bộ của 5 kết nối (lượng tương đương 3 giờ với chu kỳ 5 giây), nén trong khoảng 2 phút. Đây là thử lượng thông điệp và bộ nhớ; không phải chứng nhận chạy thực tế liên tục 3 giờ hoặc kiểm tra toàn bộ hạ tầng Internet/Render.

Kết quả 12/10/2026: 63 kiểm thử đạt. Thử lượng đồng bộ đạt 10.800 phản hồi trong 120 giây, giữ đủ 5 kết nối; heap giữ lại sau GC tăng 0,53 MiB, tổng dữ liệu nhận 971.284 byte, điểm cuối đồng bộ đầy đủ. Kết quả đo cục bộ, chưa phải độ bền ba giờ thực tế trên Render.


Cập nhật luật 12/10/2026: mỗi đội có 3 sao Về đích, mọi câu Về đích 15 giây và Tăng tốc mặc định 25 giây (các ngoại lệ mới ghi bên dưới). Backup giữ số sao đã dùng; bản sao cũ vẫn hợp lệ và đội có thêm lượt còn lại theo giới hạn mới. Điểm sao vẫn đúng +40, sai/không trả lời −40.

## Tên đội và chọn lượt Về đích — 12/10/2026
Ba đội mặc định: **Đội Cầu truyền hình**, **Đội Chủ nghĩa tư bản**, **Đội Chủ nghĩa xã hội**. Tên xuất hiện trên bảng điểm, màn người chơi, liên kết chia sẻ và nhãn câu hỏi. Khi khôi phục bản sao cũ, tên mặc định Đội 1/2/3 được chuyển sang tên mới; tên MC tự đặt vẫn giữ nguyên.

Trên màn MC, chọn vòng **Về đích** → **Đội chơi Về đích** → chọn câu → **Mở câu đã chọn**. Có thể chọn bất kỳ đội nào chơi đầu tiên, rồi đổi đội tùy ý khi câu trước đã khóa; không bắt buộc thứ tự 1–2–3. Danh sách chỉ hiện 20 câu thuộc đội đã chọn, ghi số câu còn lại; câu đã chơi bị khóa. Đổi lựa chọn đội chưa làm đổi câu đang chiếu, cần bấm Mở câu đã chọn. Điểm, 3 sao/đội và tiến độ được giữ riêng. Bộ chọn đội bị khóa trong lúc nhận đáp án.

66 kiểm thử đạt, gồm năm giao diện, chọn đội Chủ nghĩa xã hội trước rồi đổi sang Cầu truyền hình, bảo toàn số câu/sao và quyền trả lời, cùng khôi phục tên từ bản sao.


Ngày 13/10/2026 bổ sung theo lời nhắn chủ tài khoản: câu 15 Khởi động riêng Đội Chủ nghĩa tư bản (warm-36) hỏi phương thức dựa trên lòng nhân, đáp án **Nhân trị**; câu 15 Đội Chủ nghĩa xã hội (warm-45) hỏi mục đích chung của Khổng Tử, Giêsu, Mác và Tôn Trung Sơn, đáp án **Hạnh phúc**. Khởi động hiện có 59 câu đã điền, 1 vị trí trống.

## Cân bằng âm lượng — 13/10/2026

Sáu video Về đích đã chuẩn hóa về khoảng −16 LUFS (đo lại: −16,10 đến −16,00), true peak tối đa −1,91 dBTP. Giữ nguyên luồng hình. Hiệu ứng tăng từ gain 0,30 lên 0,45; giữ âm đúng/sai hiện tại. Xem [kết quả đo](AUDIO-CHECK.md). Tải lại màn trình chiếu để nhận bản âm thanh mới.

## Bộ Tăng tốc theo tài liệu — 14/10/2026

Đã thay 60 câu theo [tab Tăng tốc của chủ tài khoản](https://docs.google.com/document/d/1G6_FyhlkHjh543TJqjwKIXD_q5fx5iWnE1geqKsCwos/edit?tab=t.a63d1diym0ik), giữ thứ tự 1–60 và IDs speed-1…speed-60. Đáp án lấy từ chữ đỏ và chỉ gửi riêng MC trước khi công bố. Cả 60 câu vẫn nhập đáp án tự do, thời gian theo từng câu; xếp đáp án theo thời gian nhận và tính điểm theo thứ tự MC tích Đúng như trước.

Có 28 video và 17 ảnh nằm trong 6 câu có hình. Quốc kỳ ở câu 7 và bìa sách ở câu 11 được xếp thành bảng có nhãn chữ cái; giữ đủ hình nguồn. Các lựa chọn dạng danh sách ở câu 20/50 giữ nhãn A–H/A–D. Ảnh sơ đồ câu 22 hiển thị vùng sơ đồ, không bỏ thông tin. Hazei đã thay câu 35 bằng câu hỏi số điều kiện xây dựng khối đại đoàn kết toàn dân tộc, đáp án 4; câu 49 có đáp án B.

Tất cả video Tăng tốc đã bỏ luồng âm thanh (`-an`), đồng thời đặt thuộc tính muted trên màn chiếu. Video Về đích giữ tiếng đã cân bằng. MC dùng Bật/phát lại video và Dừng video; nút Bắt đầu tính thời gian trả lời riêng. Video dài hơn 25 giây không bị cắt; MC có thể phát trước khi bắt đầu tính giờ.

73 kiểm thử đạt: đủ 60 câu, tách/giữ kín đáp án, hình có nhãn, cả 28 tệp chỉ có luồng video, điều khiển MC/mute và năm giao diện WebSocket. Chưa kiểm tra bố cục qua trình duyệt thật.

## Điều chỉnh Tăng tốc — 14/10/2026

- **30 giây:** câu 3, 10, 21, 23, 30, 33, 39, 46.
- **20 giây:** câu 17, 19, 27, 32, 36, 48, 51, 55, 58, 60.
- **25 giây:** các câu còn lại.

Thời gian trong danh sách MC, đồng hồ và thời hạn máy chủ nhận đáp án khớp nhau. Câu 11 đổi thành “Cho danh sách 7 tác phẩm sau đây, các tác phẩm nào có chung một tác giả?”. Câu 14 tách hai cột dọc: 1–4 bên trái, A–D bên phải, trên MC/màn chiếu/người chơi; không vẽ sẵn các cặp đáp án. Người chơi vẫn nhập các cặp nối trong ô trả lời. 74 kiểm thử đạt, gồm hạn nhận đáp án của toàn bộ 60 câu và hai cột trên năm giao diện.

## Thay video Tăng tốc — 14/10/2026

Theo danh sách video mới, đã thay video câu **37, 38, 47, 48, 51, 53, 55, 58, 60**. Cả chín video mới đều không tiếng. **Câu 42 đã có video mới** từ Drive do Hazei bổ sung, không tiếng; giữ câu hỏi, đáp án và thời gian 25 giây. Tổng hiện có 28 câu Tăng tốc gắn video. Dùng tên tệp mới để trình duyệt không lấy bản cũ từ cache. Thời gian riêng từng câu, câu 11 và hai cột câu 14 giữ nguyên.

## Hiển thị media ở đội chơi — 14/10/2026
Ảnh và video hiển thị trên cả ba màn đội chơi. Video đồng bộ lệnh phát/phát lại/dừng từ MC với màn chiếu; Tăng tốc tiếp tục không tiếng. Bỏ dòng “Nhấn để phát video”; nếu trình duyệt chặn tự phát, dùng biểu tượng ▶ hoặc điều khiển video. Nhãn chấm điểm dùng dấu chấm câu cùng hàng: “Đúng. +40 điểm”, “Sai. 0 điểm”.

## Bộ Vượt chướng ngại vật — nhập lại 14/10/2026
Nguồn: [Google Docs, tab Vượt chướng ngại vật](https://docs.google.com/document/d/1G6_FyhlkHjh543TJqjwKIXD_q5fx5iWnE1geqKsCwos/edit?tab=t.kovd9clnlkxe). Nhập đủ 72 gợi ý/câu trung tâm, lấy chữ in đậm sau mũi tên làm đáp án; không bỏ câu theo màu. Giữ câu chữ bản mới, thống nhất cặp ngoặc kép câu Karl Marx.

Thứ tự tám bộ mới: **Thuế máu → Cách mạng tháng 10 → Bảo hộ → Quốc tế Cộng Sản → Thuộc địa → Chia để trị → Bản án chế độ thực dân Pháp → Chủ nghĩa tư bản**. Các câu trung tâm lần lượt có đáp án: Lính tình nguyện; Quốc tế cộng sản; Dùng người Việt trị người Việt; Đoàn kết quốc tế; Cai trị trực tiếp; Phân hóa; Nguyễn Ái Quốc; Tư hữu. Mỗi bộ vẫn 8 gợi ý ngoài và 1 trung tâm; chỉ chọn trung tâm sau đủ tám gợi ý. MC tự mở/che ô.

Có đủ **8 ảnh chính và 4 ảnh gợi ý**. Ảnh chính hiển thị trọn trong khung vuông, giữ tỷ lệ; ảnh ngang/dọc có khoảng nền để không cắt thông tin. Giữ tám ô ngoài bằng nhau, trung tâm 38% nằm đè lên giữa. Tên tệp -r2 tránh cache bản cũ. Ảnh bộ “Thuộc địa” đã bổ sung theo tài liệu.

Bộ 1 câu 2 có liên kết [Cnv thuế máu.m4a](https://drive.google.com/file/d/1mpL5H_Jj5I4UBqxl2_vfEmIte_4HOKLq/view), nhưng Drive đang yêu cầu đăng nhập khi tải. Chưa gắn audio vào web; cần chủ tài khoản mở quyền “Bất kỳ ai có đường liên kết – Người xem”. Câu hỏi/đáp án vẫn có sẵn.

Sao lưu từ lần nhập nguồn trước được chuyển bộ và số gợi ý theo đúng nội dung, đồng thời đổi ảnh mới; giữ điểm và tiến độ các vòng khác. Bản sao mới có obstacleBankVersion=2 để không chuyển hai lần. 78 kiểm thử đạt; đối chiếu 72 gợi ý/câu trung tâm và 8 đáp án/ảnh chính với nguồn. Chưa kiểm tra bố cục bằng trình duyệt thật.
