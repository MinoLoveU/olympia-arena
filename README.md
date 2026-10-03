# Olympia Arena

Website tiếng Việt tổ chức cuộc thi theo format Đường lên đỉnh Olympia. Công cụ cộng đồng, không phải sản phẩm chính thức của VTV.

## Chạy

```sh
npm run dev
# http://localhost:4173
```

Website tĩnh, không cần backend hay cài dependency để sử dụng. `npm ci && npm test` chạy kiểm thử phát triển.

## Tổ chức thi

- Bốn đội dùng chung máy MC, các phím 1–4 là chuông. Space bắt đầu đồng hồ sau khi MC đọc xong.
- MC chấm đúng/sai. Tăng tốc: nhấn phím đội lúc nhận đáp án, sau khi hết giờ bỏ chọn đáp án sai và chấm theo thứ tự nộp đúng.
- Thiết lập: tên đội, chỉnh điểm, sửa/nhập/xuất JSON bộ câu hỏi, sao lưu/khôi phục trận.
- Dữ liệu lưu localStorage của trình duyệt; không có đồng bộ giữa các máy.
- Trình chiếu ẩn bàn MC và đáp án. Đây không phải cơ chế bảo mật đáp án; bộ câu hỏi nằm trong mã phía trình duyệt.
- Media hỗ trợ URL HTTP(S) tới hình, audio, video; video phải là URL tệp phát trực tiếp, không phải trang YouTube. Máy phát cần truy cập được URL và trình duyệt hỗ trợ định dạng.
- Bộ câu hỏi mẫu chỉ để thử. Câu đoạn băng mặc định dùng văn bản thay thế; thêm video riêng trước khi thi thật.

## Luật

Áp dụng luật chi tiết trong yêu cầu người dùng, được ghi đầy đủ trong nút **Luật cuộc thi**. Quy ước bổ sung: 4 đội; 3 câu Về đích mỗi đội; mỗi đội dùng sao một lần; đoán sai chướng ngại vật dừng tham gia vòng đó. Vòng câu phụ chỉ dành cho các đội bằng điểm cao nhất. MC chuyển câu/vòng thủ công và có thể hoàn tác.

Giành điểm Về đích không có thời gian riêng được nêu trong yêu cầu nên MC mở và kết thúc lượt thủ công. Phần riêng và Về đích cho MC chấm sau khi hết giờ, để chấm đáp án đã nói trước hạn. Chuông ghi nhận đầu tiên, sai không cho sửa đáp án.

## Nhận diện và nguồn

- [VTV: Chung kết năm thứ 25](https://vtv.vn/big-story/truc-tiep-chung-ket-duong-len-dinh-olympia-nam-thu-25-8h30-vtv3-100251025210950692.htm): cấu trúc vòng thi.
- [VTV: luật mới mùa 22](https://vtv.vn/truyen-hinh/luat-choi-moi-cua-duong-len-dinh-olympia-co-gi-dac-biet-20210926004846313.htm): luật thay đổi theo mùa; bộ luật người dùng là căn cứ tính điểm.
- [Olympia Wiki](https://duong-len-dinh-olympia.fandom.com/vi/wiki/Olympia_25): ảnh titlecard `assets/olympia-title.webp`, logo/nhận diện chương trình thuộc VTV. Ảnh được lưu cục bộ để không phụ thuộc hotlink.
- Giao diện lấy cảm hứng từ nền xanh/tím sân khấu, ánh cyan, logo/vòng nguyệt quế vàng. Font Be Vietnam Pro tải từ Google Fonts, có sans-serif dự phòng.

## Xuất bản

GitHub Pages phục vụ trực tiếp thư mục gốc nhánh `main`. Không có API key, dữ liệu tài khoản hay dữ liệu trận đấu nào trong repo. Repo và website công khai theo yêu cầu triển khai.
