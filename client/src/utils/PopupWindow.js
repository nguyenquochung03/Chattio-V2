import { useClientInfo } from "../contexts/ClientInfoContext";

let popupWindow = null;

export function openPopup() {
  if (!popupWindow || popupWindow.closed) {
    // Mở cửa sổ mới nếu nó chưa tồn tại hoặc đã bị đóng
    popupWindow = window.open(
      `${clientInfo.clientUrl}/videoCall`,
      "mozillaWindow",
      "popup"
    );
  } else {
    // Nếu cửa sổ tồn tại, tập trung vào cửa sổ đó và cập nhật URL nếu cần
    popupWindow.focus();
    popupWindow.location.href = `${clientInfo.clientUrl}/videoCall`;
  }
}
