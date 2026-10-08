const wait = (ms) => new Promise((res) => setTimeout(res, ms));

// 1. Chuẩn hóa chuỗi giờ đa dạng: "09:30 - 12:10", "19:00 - 21:40", "8h - 17h", "7h45 - 8h45"
function extractTimeRange(raw) {
    if (!raw) return null;
    const str = raw.replace(/\s+(?:đến|to|~)\s+/gi, " - ");
    const match = str.match(/(\d{1,2})(?:[:h](\d{2}))?\s*h?\s*-\s*(\d{1,2})(?:[:h](\d{2}))?\s*h?/i);
    if (!match) return null;

    const startH = match[1].padStart(2, "0");
    const startM = match[2] ? match[2] : "00";
    const endH = match[3].padStart(2, "0");
    const endM = match[4] ? match[4] : "00";

    return {
        start: `${startH}:${startM}`,
        end: `${endH}:${endM}`
    };
}

// Chuyển ngày DD/MM/YYYY + HH:MM sang định dạng iCalendar YYYYMMDDTHHMMSS
function toIcsTimestamp(dateDDMMYYYY, timeHHMM) {
    const parts = dateDDMMYYYY.includes("/") ? dateDDMMYYYY.split("/") : [
        dateDDMMYYYY.slice(0, 2),
        dateDDMMYYYY.slice(2, 4),
        dateDDMMYYYY.slice(4, 8)
    ];
    const [d, m, y] = parts;
    const [hh, mm] = timeHHMM.split(":");
    return `${y}${m.padStart(2, "0")}${d.padStart(2, "0")}T${hh.padStart(2, "0")}${mm.padStart(2, "0")}00`;
}

// 2. Bóc tách dữ liệu lưới Lịch học của tuần đang xem
// 2. Bóc tách dữ liệu lưới Lịch học của tuần đang xem
function parseWeeklyGridSchedule() {
    const events = [];
    
    // SỬA LỖI 1: Xóa bỏ sự phụ thuộc vào khung .calendar-week-table cũ.
    // Chỉ tìm trực tiếp các cột có class .day-of-week để tránh lỗi khi web đổi giao diện vòng ngoài.
    const dayCols = document.querySelectorAll(".day-of-week");

    dayCols.forEach((col) => {
        const rawDateId = col.id.replace("row", ""); // VD: 19102026
        if (!rawDateId || rawDateId.length !== 8) return;

        const taskItems = col.querySelectorAll(".task");
        taskItems.forEach((task) => {
            const titleElem = task.querySelector(".task-header .title") || task.querySelector(".title");
            const dateElem = task.querySelector(".task-date") || task.querySelector(".task-header");
            const descElem = task.querySelector(".task-description");
            if (!titleElem || !dateElem) return;

            const title = titleElem.innerText.trim();
            const timeRange = extractTimeRange(dateElem.innerText);
            if (!timeRange) return;

            let location = "";
            let descText = "";
            if (descElem) {
                const lines = descElem.innerText
                    .split("\n")
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0 && !l.includes("thumbs-up"));
                descText = lines.join(" | ");
                if (lines.length >= 2) location = lines[lines.length - 2];
            }

            events.push({
                uid: `study_${task.id || Math.random().toString(36).slice(2)}_${rawDateId}@uni`,
                title: `[HỌC] ${title}`,
                location: location || "Trường",
                description: descText,
                start: toIcsTimestamp(rawDateId, timeRange.start),
                end: toIcsTimestamp(rawDateId, timeRange.end)
            });
        });
    });

    return events;
}



// 3. Bóc tách môn học không có lịch chi tiết (Đồ án, Khóa luận, Thực tập...)
function parseNoDetailSchedule() {
    const events = [];
    const rows = document.querySelectorAll("#tblTKBKhongLichChiTiet tbody tr");

    rows.forEach((row) => {
        if (row.classList.contains("empty-state-row")) return;
        const cells = row.querySelectorAll("td");
        if (cells.length < 5) return;

        const code = cells[0]?.innerText?.trim() || "";
        const name = cells[1]?.innerText?.trim() || "";
        const type = cells[2]?.innerText?.trim() || "";
        const startStr = cells[3]?.innerText?.trim() || "";
        const endStr = cells[4]?.innerText?.trim() || "";
        const note = cells[5]?.innerText?.trim() || "";

        if (!name || !startStr || !endStr) return;

        const toAllDayFmt = (dStr) => {
            const [d, m, y] = dStr.split("/");
            return `${y}${m.padStart(2, "0")}${d.padStart(2, "0")}`;
        };

        events.push({
            uid: `nondetail_${code}_${toAllDayFmt(startStr)}@uni`,
            title: `[${type || "HP"}] ${name}`,
            location: "Trường / Cơ sở thực tập",
            description: `Mã HP: ${code} | Ghi chú: ${note}`,
            isAllDay: true,
            startDate: toAllDayFmt(startStr),
            endDate: toAllDayFmt(endStr)
        });
    });

    return events;
}

// 4. Bóc tách Lịch Thi từ mọi nguồn khả dụng trên trang (Modal ở tab Lịch học hoặc Bảng ở tab Lịch thi)
function parseAllPossibleExamData() {
    const examEvents = [];

    // Nguồn A: Bảng trong Modal lịch thi nằm ngay tại tab Lịch học (#tblLichThi)
    const modalRows = document.querySelectorAll("#tblLichThi tbody tr");
    modalRows.forEach((row, i) => {
        const td = row.querySelectorAll("td");
        // Cột: [0] STT, [1] Hình thức, [2] Ngày thi, [3] Giờ thi, [4] Phòng thi, [5] Tên học phần
        if (td.length >= 6) {
            const type = td[1]?.innerText?.trim() || "";
            const dateStr = td[2]?.innerText?.trim() || "";
            const timeStr = td[3]?.innerText?.trim() || "";
            const room = td[4]?.innerText?.trim() || "Chưa xếp phòng";
            const subject = td[5]?.innerText?.trim() || "";

            const timeRange = extractTimeRange(timeStr);
            if (subject && dateStr && timeRange) {
                examEvents.push({
                    uid: `modal_exam_${i}_${dateStr.replace(/\//g, "")}@uni`,
                    title: `[THI] ${subject}`,
                    location: room,
                    description: `Hình thức: ${type} | Phòng: ${room} | Giờ: ${timeStr}`,
                    start: toIcsTimestamp(dateStr, timeRange.start),
                    end: toIcsTimestamp(dateStr, timeRange.end)
                });
            }
        }
    });

    // Nguồn B: Bảng lịch thi cá nhân nếu đang đứng ở tab Lịch thi (#tblLichThiCaNhan)
    const personalRows = document.querySelectorAll("#tblLichThiCaNhan tbody tr");
    personalRows.forEach((row, i) => {
        const td = row.querySelectorAll("td");
        // Cột: [0] STT, [1] Mã HP, [2] Tên HP, [3] Lần thi, [4] Ngày thi, [5] Thời gian, [6] Hình thức, [7] Phòng, [8] SBD
        if (td.length >= 8) {
            const code = td[1]?.innerText?.trim() || "";
            const subject = td[2]?.innerText?.trim() || "";
            const dateStr = td[4]?.innerText?.trim() || "";
            const timeStr = td[5]?.innerText?.trim() || "";
            const type = td[6]?.innerText?.trim() || "";
            const room = td[7]?.innerText?.trim() || "Chưa xếp phòng";
            const sbd = td[8]?.innerText?.trim() || "";

            const timeRange = extractTimeRange(timeStr);
            if (subject && dateStr && timeRange) {
                examEvents.push({
                    uid: `personal_exam_${code}_${dateStr.replace(/\//g, "")}_${i}@uni`,
                    title: `[THI] ${subject}`,
                    location: room,
                    description: `Mã HP: ${code} | SBD: ${sbd} | Hình thức: ${type} | Phòng: ${room}`,
                    start: toIcsTimestamp(dateStr, timeRange.start),
                    end: toIcsTimestamp(dateStr, timeRange.end)
                });
            }
        }
    });

    return examEvents;
}

// 5. Quét toàn bộ học kỳ (3 tháng) kết hợp gom cả Lịch học và Lịch thi
async function crawlFullSemesterAndExams() {
    const allEvents = new Map();

    // BƯỚC 1: Lấy trước toàn bộ lịch thi và môn không lịch chi tiết hiện có
    parseAllPossibleExamData().forEach((ev) => allEvents.set(ev.uid, ev));
    parseNoDetailSchedule().forEach((ev) => allEvents.set(ev.uid, ev));

    // BƯỚC 2: Quét lần lượt 3 tháng trên bảng lưới
    for (let m = 1; m <= 3; m++) {
        const monthName = document.getElementById("thang")?.innerText || `Tháng ${m}`;
        const dayItems = Array.from(document.querySelectorAll(".calendar-block-cover ul.days li.poiter"));
        const uniqueWeeks = [];
        const seen = new Set();

        dayItems.forEach((li) => {
            const wId = li.getAttribute("name");
            if (wId && !seen.has(wId)) {
                seen.add(wId);
                uniqueWeeks.push(li);
            }
        });

        for (let i = 0; i < uniqueWeeks.length; i++) {
            const weekLi = uniqueWeeks[i];
            chrome.runtime.sendMessage({
                type: "PROGRESS",
                message: `[${m}/3] ${monthName}: Đang quét tuần ${i + 1}/${uniqueWeeks.length}...`
            });

            if (!weekLi.classList.contains("active")) {
                weekLi.click();
                // SỬA LỖI 2: Tăng thời gian chờ dữ liệu tải xong từ 280ms lên 800ms
                // Việc này giúp đảm bảo web kịp render ra các ô môn học (.task) trước khi quét
                await wait(800); 
            }

            parseWeeklyGridSchedule().forEach((ev) => allEvents.set(ev.uid, ev));
            parseAllPossibleExamData().forEach((ev) => allEvents.set(ev.uid, ev));
        }

        // Chuyển tháng tiếp theo
        if (m < 3) {
            const nextBtn = document.querySelector(".next-prev-month.month a.next");
            const oldMonth = document.getElementById("thang")?.getAttribute("title");
            if (nextBtn) {
                nextBtn.click();
                let retry = 0;
                while (retry < 15) { // SỬA LỖI 3: Tăng thời gian retry khi chuyển tháng
                    await wait(100);
                    const currentMonth = document.getElementById("thang")?.getAttribute("title");
                    if (currentMonth && currentMonth !== oldMonth) break;
                    retry++;
                }
                await wait(500); // Chờ thêm chút cho an toàn sau khi chuyển tháng
            } else {
                break;
            }
        }
    }

    if (allEvents.size > 0) {
        downloadIcs(Array.from(allEvents.values()), "LichCaHocKy.ics");
        chrome.runtime.sendMessage({
            type: "PROGRESS",
            message: `Hoàn tất! Đã xuất tổng cộng ${allEvents.size} sự kiện.`
        });
    } else {
        chrome.runtime.sendMessage({
            type: "PROGRESS",
            message: "Không tìm thấy dữ liệu học hoặc thi nào!"
        });
    }
}

// 6. Tạo file .ics hỗ trợ cả sự kiện có giờ (Timezone Asia/Ho_Chi_Minh) và sự kiện cả ngày
function downloadIcs(events, filename) {
    let ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//SinhVienTools//UniScheduleSync//VN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VTIMEZONE",
        "TZID:Asia/Ho_Chi_Minh",
        "X-LIC-LOCATION:Asia/Ho_Chi_Minh",
        "BEGIN:STANDARD",
        "TZOFFSETFROM:+0700",
        "TZOFFSETTO:+0700",
        "TZNAME:+07",
        "DTSTART:19700101T000000",
        "END:STANDARD",
        "END:VTIMEZONE"
    ];

    events.forEach((ev) => {
        if (ev.isAllDay) {
            ics.push(
                "BEGIN:VEVENT",
                `UID:${ev.uid}`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
                `DTSTART;VALUE=DATE:${ev.startDate}`,
                `DTEND;VALUE=DATE:${ev.endDate}`,
                `SUMMARY:${ev.title}`,
                `LOCATION:${ev.location}`,
                `DESCRIPTION:${ev.description}`,
                "STATUS:CONFIRMED",
                "END:VEVENT"
            );
        } else {
            const isExam = ev.title.includes("[THI]");
            ics.push(
                "BEGIN:VEVENT",
                `UID:${ev.uid}`,
                `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
                `DTSTART;TZID=Asia/Ho_Chi_Minh:${ev.start}`,
                `DTEND;TZID=Asia/Ho_Chi_Minh:${ev.end}`,
                `SUMMARY:${ev.title}`,
                `LOCATION:${ev.location}`,
                `DESCRIPTION:${ev.description}`,
                "STATUS:CONFIRMED",
                "BEGIN:VALARM",
                `TRIGGER:${isExam ? "-PT60M" : "-PT15M"}`, // Báo trước 60p cho lịch thi, 15p cho buổi học
                `DESCRIPTION:${isExam ? "Nhắc nhở giờ thi" : "Nhắc nhở vào lớp"}`,
                "ACTION:DISPLAY",
                "END:VALARM",
                "END:VEVENT"
            );
        }
    });

    ics.push("END:VCALENDAR");

    const blob = new Blob([ics.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// 7. Nhận lệnh từ Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXPORT_ALL_IN_ONE") {
        sendResponse({ status: "Bắt đầu quét tổng hợp Học & Thi..." });
        crawlFullSemesterAndExams();
    } else if (request.action === "EXPORT_WEEK_ONLY") {
        const list = [...parseWeeklyGridSchedule(), ...parseAllPossibleExamData()];
        if (list.length === 0) {
            sendResponse({ status: "Tuần này không có lịch học/thi!" });
        } else {
            downloadIcs(list, "Lich_TuanHienTai.ics");
            sendResponse({ status: `Đã xuất ${list.length} sự kiện tuần này!` });
        }
    } else if (request.action === "EXPORT_EXAM_ONLY") {
        const exams = parseAllPossibleExamData();
        if (exams.length === 0) {
            sendResponse({ status: "Chưa thấy lịch thi! (Hãy bấm Xem Lịch trước)" });
        } else {
            downloadIcs(exams, "LichThi.ics");
            sendResponse({ status: `Đã xuất ${exams.length} môn thi!` });
        }
    }
    return true;
});