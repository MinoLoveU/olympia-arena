# Kiểm tra video Tăng tốc — 14/10/2026

Nguồn: tab t.a63d1diym0ik của Google Docs 1G6_FyhlkHjh543TJqjwKIXD_q5fx5iWnE1geqKsCwos. Mỗi tệp chuyển H.264/yuv420p, giới hạn 1280×720, giữ tỷ lệ, `-an` và faststart. Không cắt thời lượng.

| Câu | Giây sau chuyển | Nguồn có tiếng | Âm thanh sau chuyển |
|---|---:|---|---|
| 3 | 30.133 | Có | Không |
| 6 | 23.500 | Không | Không |
| 10 | 30.633 | Có | Không |
| 17 | 21.500 | Không | Không |
| 19 | 14.000 | Không | Không |
| 21 | 29.500 | Không | Không |
| 23 | 31.200 | Có | Không |
| 27 | 15.733 | Không | Không |
| 29 | 30.967 | Có | Không |
| 30 | 30.083 | Có | Không |
| 32 | 20.500 | Không | Không |
| 33 | 30.383 | Có | Không |
| 36 | 18.500 | Không | Không |
| 37 | 16.533 | Có | Không |
| 38 | 18.867 | Có | Không |
| 39 | 30.500 | Có | Không |
| 40 | 25.233 | Không | Không |
| 42 | 18.300 | Có | Không |
| 46 | 29.059 | Có | Không |
| 47 | 17.333 | Có | Không |
| 48 | 17.467 | Có | Không |
| 51 | 18.433 | Có | Không |
| 52 | 33.800 | Có | Không |
| 53 | 17.267 | Có | Không |
| 55 | 17.467 | Có | Không |
| 56 | 34.767 | Có | Không |
| 58 | 17.200 | Có | Không |
| 60 | 17.367 | Có | Không |

Tổng 28 video, 20 tệp nguồn có âm thanh. Kiểm tra MP4 track handlers xác nhận chỉ có `vide`, không có `soun`. Thời lượng chênh dưới 1 giây so với nguồn (do container/frame timing); không chủ động cắt nội dung.

## Thay video ngày 14/10/2026

Nguồn mới: https://docs.google.com/document/d/1Ol5m_6xGHH-ACBXETOBE8TPQTFwJAxfg8j7cb_b6rcg/edit. Chín video dưới đây thay bản nhập ban đầu; toàn bộ đều có tiếng trong nguồn và đã loại bỏ audio. Dùng URL -v2 để tránh cache video cũ. Câu 42 tạm gỡ media khỏi bộ đề, còn 27 câu có video.

| Câu | Video mới (giây) | Audio sau chuyển |
|---|---:|---|
| 37 | 23.033 | Không |
| 38 | 24.633 | Không |
| 47 | 22.033 | Không |
| 48 | 19.033 | Không |
| 51 | 18.467 | Không |
| 53 | 22.667 | Không |
| 55 | 17.900 | Không |
| 58 | 18.000 | Không |
| 60 | 21.167 | Không |

Đã giải mã hết cả chín video mới, không lỗi.

## Bổ sung video câu 42 — 14/10/2026
Nguồn Drive: 1VYmt00bSnwZLmDxO290QYzAspTwsV4gD. Tệp speed-source-42-v2.mp4: H.264/yuv420p, 23,167 giây, 895.136 byte; nguồn có audio, bản dùng trong web bỏ audio. Giữ nguyên thời lượng, faststart; bộ đề hiện có 28 video không tiếng.
