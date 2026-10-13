# PKA Calendar to Google Calendar & Apple Calendar

Tiện ích mở rộng Chrome giúp sinh viên trích xuất lịch học, lịch thi và các học phần không có lịch chi tiết từ cổng thông tin đào tạo thành tệp iCalendar (`.ics`). Tệp được tạo có thể nhập vào Google Calendar, Microsoft Outlook, Apple Calendar hoặc các ứng dụng lịch tương thích.

## 1. Tổng quan

### Mục tiêu

PKA Calendar giảm thao tác nhập lịch thủ công và hỗ trợ sinh viên quản lý lịch học tập tập trung trên ứng dụng lịch cá nhân.

### Đối tượng sử dụng

- Sinh viên sử dụng cổng thông tin đào tạo có giao diện lịch học và lịch thi tương thích.
- Cán bộ hỗ trợ sinh viên cần hướng dẫn quy trình xuất lịch.
- Đơn vị triển khai nội bộ muốn đóng gói tiện ích cho người dùng trong trường.

### Phạm vi hiện tại

- Đọc lịch học theo tuần trên trang lịch học.
- Đọc lịch thi từ bảng lịch thi trong trang hiện tại.
- Đọc các học phần không có lịch chi tiết, chẳng hạn đồ án, khóa luận hoặc thực tập.
- Quét lịch học trong tối đa 3 tháng theo các tháng được hiển thị trên cổng thông tin.
- Xuất sự kiện có thời gian và sự kiện cả ngày.
- Thiết lập múi giờ `Asia/Ho_Chi_Minh` cho sự kiện có thời gian.
- Tạo nhắc lịch trước 15 phút cho buổi học và 60 phút cho lịch thi.

## 2. Tính năng

| Chức năng | Mô tả | Tệp đầu ra |
| --- | --- | --- |
| Lịch học kỳ | Quét lịch học, lịch thi và học phần không có lịch chi tiết trong phạm vi học kỳ được hiển thị | `LichCaHocKy.ics` |
| Lịch tuần | Xuất lịch học và lịch thi của tuần đang xem | `Lich_TuanHienTai.ics` |
| Lịch thi | Xuất các lịch thi đang có trên trang hoặc trong bảng lịch thi đã mở | `LichThi.ics` |

## 3. Yêu cầu hệ thống

- Google Chrome hoặc trình duyệt Chromium hỗ trợ Chrome Extension Manifest V3.
- Quyền truy cập vào cổng thông tin đào tạo của nhà trường.
- Tài khoản sinh viên đã đăng nhập.
- Trang lịch học được tải đầy đủ trước khi xuất dữ liệu.

Tiện ích không yêu cầu máy chủ riêng, cơ sở dữ liệu hoặc bước build. Dữ liệu được đọc và chuyển đổi trực tiếp trong trình duyệt.

## 4. Cài đặt từ mã nguồn

1. Tải hoặc clone mã nguồn về máy.
2. Mở `chrome://extensions` trên Chrome.
3. Bật **Developer mode**.
4. Chọn **Load unpacked**.
5. Chọn thư mục gốc của project, nơi chứa `manifest.json`.
6. Ghim **PKA Calendar** vào thanh công cụ để truy cập nhanh.

Sau khi cập nhật mã nguồn, quay lại `chrome://extensions` và bấm **Reload** trên thẻ của tiện ích.

## 5. Hướng dẫn sử dụng

### Xuất lịch tuần

1. Đăng nhập cổng thông tin đào tạo.
2. Mở trang lịch học và chọn tuần cần xuất.
3. Bấm biểu tượng **PKA Calendar** trên trình duyệt.
4. Chọn **Lịch tuần**.
5. Lưu tệp `Lich_TuanHienTai.ics` vào máy.

### Xuất lịch thi

1. Mở bảng hoặc chức năng **Xem Lịch** để dữ liệu lịch thi xuất hiện trên trang.
2. Bấm biểu tượng **PKA Calendar**.
3. Chọn **Lịch thi**.
4. Lưu tệp `LichThi.ics`.

Nếu lịch thi chưa được tải, tiện ích sẽ thông báo yêu cầu mở hoặc xem lịch thi trước.

### Xuất lịch học kỳ

1. Mở trang lịch học sau khi đăng nhập.
2. Bấm biểu tượng **PKA Calendar**.
3. Chọn **Lịch học kỳ (3 tháng)**.
4. Chờ trạng thái trên popup hiển thị hoàn tất.
5. Lưu tệp `LichCaHocKy.ics`.

Trong quá trình quét, tiện ích lần lượt chuyển qua các tuần và tháng đang có trên giao diện. Không nên đóng tab hoặc thao tác chuyển trang cho đến khi quá trình hoàn tất.

## 6. Nhập tệp vào ứng dụng lịch

### Google Calendar

1. Mở Google Calendar trên máy tính.
2. Chọn **Cài đặt** rồi vào **Nhập và xuất**.
3. Chọn tệp `.ics` đã tải xuống.
4. Chọn lịch đích và bấm **Nhập**.

### Microsoft Outlook

Mở chức năng nhập lịch của Outlook và chọn tệp `.ics`. Tên menu có thể khác nhau giữa Outlook trên web, Windows và macOS.

### Apple Calendar

Mở ứng dụng Calendar, chọn **File > Import** và chọn tệp `.ics`.

## 7. Kiến trúc và luồng dữ liệu

```text
Trang cổng thông tin đào tạo
		  |
		  v
content.js: đọc DOM, chuẩn hóa ngày/giờ, tạo sự kiện
		  ^
		  | chrome.runtime.sendMessage
		  |
popup.html + popup.js: nhận thao tác người dùng và hiển thị trạng thái
		  |
		  v
Tệp iCalendar (.ics) được tải xuống từ trình duyệt
```

Các thành phần chính:

- `manifest.json`: khai báo metadata, quyền và content script của extension.
- `popup.html`: giao diện các thao tác xuất lịch.
- `popup.js`: gửi lệnh đến tab đang hoạt động và hiển thị tiến trình.
- `content.js`: trích xuất dữ liệu, quét các tuần/tháng, tạo và tải tệp `.ics`.

## 8. Quyền truy cập và quyền riêng tư

Extension khai báo các quyền:

- `activeTab`: tương tác với tab đang được người dùng chọn.
- `scripting`: inject lại `content.js` khi trang sử dụng điều hướng SPA hoặc content script chưa được nạp.

Extension không có backend và không gửi lịch lên máy chủ bên ngoài. Dữ liệu được xử lý trong tab trình duyệt và tệp `.ics` được tạo cục bộ. Người triển khai vẫn nên kiểm tra lại chính sách quyền của trình duyệt và hệ thống đào tạo trước khi phân phối nội bộ.

## 9. Xử lý sự cố

| Hiện tượng | Cách xử lý |
| --- | --- |
| Popup báo không tìm thấy trang web | Chuyển sang đúng tab cổng thông tin đào tạo rồi mở lại popup |
| Popup yêu cầu tải lại trang | Nhấn `F5`, chờ trang tải xong rồi thử lại |
| Không tìm thấy lịch thi | Mở bảng hoặc bấm **Xem Lịch** trước khi chọn **Lịch thi** |
| Không có sự kiện được xuất | Kiểm tra tài khoản, tháng/tuần đang chọn và dữ liệu đã hiển thị đầy đủ |
| Thiếu tuần hoặc tháng | Không chuyển tab hoặc đóng trang trong lúc quét; thử tải lại trang và chạy lại |
| Sự kiện sai giờ | Kiểm tra dữ liệu giờ trên cổng thông tin và múi giờ của ứng dụng lịch đích |
| Tệp bị nhập trùng | Xóa các sự kiện đã nhập trước đó hoặc nhập vào một lịch riêng cho từng lần đồng bộ |

## 10. Giới hạn và lưu ý vận hành

- Extension phụ thuộc vào cấu trúc HTML và tên class của cổng thông tin đào tạo. Khi giao diện website thay đổi, bộ phân tích có thể cần được cập nhật.
- Extension chỉ đọc dữ liệu đang có trong DOM; dữ liệu chưa tải hoặc bị ẩn sau thao tác khác sẽ không được xuất.
- Phạm vi quét học kỳ hiện được thiết kế cho tối đa 3 tháng hiển thị trên giao diện.
- Nên kiểm tra nhanh số lượng và thời gian sự kiện sau mỗi lần nhập vào ứng dụng lịch.
- Không nên chạy nhiều lần liên tiếp trong khi một phiên quét học kỳ vẫn đang hoạt động.

## 11. Phát triển và kiểm thử thủ công

Project hiện không có bước build hoặc bộ kiểm thử tự động. Quy trình kiểm tra đề xuất:

1. Cài extension bằng **Load unpacked**.
2. Mở cổng thông tin đào tạo với dữ liệu lịch thật hoặc môi trường kiểm thử.
3. Kiểm tra lần lượt ba nút xuất lịch.
4. Mở tệp `.ics` bằng trình soạn thảo để kiểm tra `DTSTART`, `DTEND`, `SUMMARY` và `UID`.
5. Nhập tệp vào ứng dụng lịch đích và xác nhận múi giờ, nhắc lịch, địa điểm và mô tả.
6. Kiểm tra Console của tab nếu quá trình trích xuất không cho kết quả mong muốn.

Khi thay đổi selector hoặc logic phân tích dữ liệu, cần kiểm tra tối thiểu các trường hợp: giờ dạng `09:30 - 12:10`, giờ dạng `8h - 17h`, sự kiện cả ngày, lịch thi và dữ liệu trống.

## 12. Bảo trì và phát hành

Trước mỗi lần phát hành nội bộ:

1. Xác nhận version trong `manifest.json`.
2. Kiểm tra trên Chrome phiên bản được tổ chức hỗ trợ.
3. Kiểm thử ba luồng xuất lịch trên dữ liệu đại diện.
4. Kiểm tra tệp `.ics` bằng ít nhất một ứng dụng lịch đích.
5. Ghi lại thay đổi và vấn đề tương thích trong lịch sử phát hành.



` Cre: Internet & Cải tiến Update `