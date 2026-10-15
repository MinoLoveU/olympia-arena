# Cân bằng âm lượng — 13/10/2026

Sáu video Về đích được chuẩn hóa hai lượt bằng FFmpeg loudnorm, mục tiêu −16 LUFS, true peak −2 dBTP, LRA 11 LU. Âm thanh AAC 192 kb/s, 48 kHz; video stream copy, hash luồng hình trước/sau giống nhau. Đo lại trên tệp AAC cuối cùng (sai số peak nhỏ do mã hóa).

| Video | Trước (LUFS) | Sau (LUFS) | True peak sau (dBTP) |
|---|---:|---:|---:|
| finish-1-15.mp4 | -11.81 | -16.01 | -4.55 |
| finish-1-3.mp4 | -16.33 | -16.02 | -2.54 |
| finish-2-16.mp4 | -19.18 | -16.00 | -1.91 |
| finish-2-6.mp4 | -10.01 | -16.02 | -5.61 |
| finish-3-12.mp4 | -24.50 | -16.10 | -5.43 |
| finish-3-13.mp4 | -10.23 | -16.01 | -5.28 |

Hiệu ứng Web Audio: master gain 0,30 → 0,45, tương đương +3,52 dB; giữ giai điệu, dạng sóng và mute. Video Tăng tốc speed-motion.mp4 không có luồng âm thanh. Client thêm phiên bản URL video Về đích để tải tệp mới thay vì dùng cache cũ.

70 kiểm thử đạt. Chưa nghe kiểm tra qua loa của buổi thi; âm lượng thực tế còn phụ thuộc máy và hệ thống loa.


## Bộ Về đích mới — 15/10/2026

Ba video mới được chuyển từ HEVC 8K sang H.264/yuv420p tối đa 1280×720, 30 fps, AAC 48 kHz. Loudnorm hai lượt giữ mục tiêu −16 LUFS, −2 dBTP, LRA 11. Kiểm tra giải mã toàn bộ ba tệp không báo lỗi; chưa nghe bằng loa thực tế.

| Video | Trước LUFS | Sau LUFS | Peak dBTP |
|---|---:|---:|---:|
| finish-compact-1-3.mp4 | -9.56 | -16.00 | -5.81 |
| finish-compact-2-3.mp4 | -11.55 | -16.00 | -4.11 |
| finish-compact-3-1.mp4 | -9.83 | -16.02 | -4.54 |


## Sáu video Cổ vũ — 15/10/2026

Nguồn: Google Docs 1Ol5m_6xGHH-ACBXETOBE8TPQTFwJAxfg8j7cb_b6rcg, tab t.0. H.264/yuv420p 1080p, 30 fps, AAC 48 kHz. Cân loudnorm hai lượt về −16 LUFS, true peak −2 dBTP; đo lại AAC và chỉnh gain còn lệch. Giải mã toàn bộ video không báo lỗi. Chưa nghe thử bằng loa thực tế.

| Mục | Đội | Trước LUFS | Sau LUFS | Peak dBTP |
|---|---|---:|---:|---:|
| Trước Khởi động | Cầu truyền hình | -15.59 | -16.00 | -2.60 |
| Trước Khởi động | Chủ nghĩa tư bản | -16.76 | -16.01 | -2.60 |
| Trước Khởi động | Chủ nghĩa xã hội | -14.98 | -16.00 | -3.72 |
| Trước Về đích | Cầu truyền hình | -12.35 | -16.03 | -3.70 |
| Trước Về đích | Chủ nghĩa tư bản | -15.12 | -16.05 | -4.41 |
| Trước Về đích | Chủ nghĩa xã hội | -15.52 | -16.00 | -3.53 |

Mapping nguồn (section-team → Drive ID):
- 1-1: 1ojEEi899D_1MQ19ejRyHkwuxQGe8IE4m
- 2-1: 1jFa8JU-8CWED7FVliJ1YHbeinRyS_tLQ
- 1-3: 1r-7HismQ27zo1LtBbvLQTlceSYaOJR9X
- 2-3: 1uIrSOOcraE0ha9qMcy-39Xtvch8ovEh-
- 1-2: 1yToPCRgGvjVRMwOiAT7CLN86H0catvSO
- 2-2: 1askYmxjCla6v4yjl5ws4qA_C_zvCcc7p
