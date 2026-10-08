const statusDiv = document.getElementById("status");

function setStatus(msg) {
    statusDiv.innerText = msg;
}

async function sendAction(actionName) {
    setStatus("Đang kết nối trang...");
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
        setStatus("Không tìm thấy trang web!");
        return;
    }

    const payload = { action: actionName };

    chrome.tabs.sendMessage(tab.id, payload, async (res) => {
        // Tự động inject script nếu trang chưa nạp content.js (SPA navigation)
        if (chrome.runtime.lastError) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content.js"]
                });

                setTimeout(() => {
                    chrome.tabs.sendMessage(tab.id, payload, (retryRes) => {
                        if (retryRes?.status) setStatus(retryRes.status);
                        else setStatus("Đã kết nối! Vui lòng bấm lại nút lần nữa.");
                    });
                }, 250);
            } catch (e) {
                setStatus("Vui lòng nhấn F5 lại trang!");
            }
            return;
        }

        if (res?.status) setStatus(res.status);
    });
}

document.getElementById("btnAllInOne").addEventListener("click", () => sendAction("EXPORT_ALL_IN_ONE"));
document.getElementById("btnWeekOnly").addEventListener("click", () => sendAction("EXPORT_WEEK_ONLY"));
document.getElementById("btnExamOnly").addEventListener("click", () => sendAction("EXPORT_EXAM_ONLY"));

chrome.runtime.onMessage.addListener((req) => {
    if (req.type === "PROGRESS") setStatus(req.message);
});