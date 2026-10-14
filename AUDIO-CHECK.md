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
