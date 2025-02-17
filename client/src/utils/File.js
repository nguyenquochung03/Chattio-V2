import axios from "axios";
import { extractAndFormat } from "./stringUtils";

const formatFileSize = (size) => {
  if (size >= 1024 * 1024) {
    // Nếu kích thước lớn hơn hoặc bằng 1 MB
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    // Nếu kích thước nhỏ hơn 1 MB, hiển thị KB
    return `${(size / 1024).toFixed(2)} KB`;
  }
};

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), timeout)
    ),
  ]);
};

export const getFileFromMessage = async (message) => {
  if (!message || typeof message !== "string" || message.trim() === "") {
    return { success: false, type: "Unknown" };
  }

  if (message.length < 35) {
    return { success: false, type: "Unknown" };
  }

  const checkMsg = extractAndFormat(message);

  if (
    checkMsg.success &&
    checkMsg.secret === "file_secret_asdhas9dhasdhasudbasdasdasd"
  ) {
    if (!isValidUrl(checkMsg.remaining)) {
      return getFileTypeFromGoogleDriveUrl(checkMsg.remaining);
    } else {
      return getFileTypeFromCloudinaryUrl(checkMsg.remaining);
    }
  } else {
    return { success: false, message: "Đây không phải là file" };
  }
};

export const getFileTypeFromCloudinaryUrl = async (url) => {
  try {
    const response = await fetchWithTimeout(url, { method: "HEAD" }, 5000);

    if (!response.ok) {
      return { success: false, type: "Unknown" };
    }

    const extension = url.split(".").pop().toLowerCase();

    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    const videoExtensions = ["mp4", "mov", "avi", "mkv", "flv", "wmv"];
    const audioExtensions = [
      "mp3",
      "wav",
      "aac",
      "flac",
      "ogg",
      "m4a",
      "wma",
      "webm",
    ];

    if (imageExtensions.includes(extension)) {
      return { success: true, type: "Image" };
    } else if (videoExtensions.includes(extension)) {
      return { success: true, type: "Video" };
    } else if (audioExtensions.includes(extension)) {
      return { success: true, type: "Audio" };
    } else {
      return { success: true, type: "Unknown" };
    }
  } catch (error) {
    console.error("Error when fetching the URL:", error.message);
    return { success: false, type: "Unknown" };
  }
};

export const getFileTypeFromGoogleDriveUrl = async (fileId) => {
  const rawExtensions = ["pdf", "zip", "rar", "doc", "docx", "txt", "xlsx"];

  try {
    // Kiểm tra nếu fileId rỗng
    if (!fileId) {
      return { success: false, message: "File ID không được để trống" };
    }

    // Gửi yêu cầu đến Google Drive API
    const response = await axios.get(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,name,size&key=AIzaSyBMN67tHz6qYw6LGymlYTRpA0-bqS9FA0k`
    );

    // Kiểm tra mã trạng thái phản hồi
    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        message: `API trả về lỗi: ${response.status} - ${response.statusText}`,
      };
    }

    // Lấy dữ liệu từ phản hồi
    const { mimeType, name, size } = response.data;

    // Nếu không có tên file hoặc mimeType, trả về lỗi
    if (!name || !mimeType) {
      return { success: false, message: "Thiếu thông tin file từ API" };
    }

    // Lấy phần mở rộng file
    const fileExtension = name.split(".").pop().toLowerCase();

    if (rawExtensions.includes(fileExtension)) {
      // Xử lý loại file Raw
      let fileType;
      switch (fileExtension) {
        case "pdf":
          fileType = "pdf";
          break;
        case "zip":
        case "rar":
          fileType = "zip";
          break;
        case "doc":
        case "docx":
          fileType = "word";
          break;
        case "txt":
          fileType = "text";
          break;
        case "xlsx":
          fileType = "excel";
          break;
        default:
          fileType = "Unknown";
      }

      return {
        success: true,
        type: "Raw",
        data: {
          name,
          fileExtension,
          fileType,
          size: formatFileSize(size),
          fileId,
        },
      };
    }
  } catch (error) {
    // Kiểm tra lỗi
    if (error.response && error.response.status === 404) {
      return {
        success: false,
        message: `Lỗi khi lấy thông tin file từ Google Drive: ${error.message}`,
      };
    } else {
      return {
        success: false,
        message: `Lỗi khi lấy thông tin file từ Google Drive: ${error.message}`,
      };
    }
  }
};

export const downloadImageFile = async (url) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok.");
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = url.split("/").pop();
    link.click();
  } catch (error) {
    console.error("Error downloading the file:", error);
  }
};

export const downloadFileFromGoogleDrive = async (fileId) => {
  const url = `http://localhost:3000/api/chats/file/dowloadFileFromGoogleDrive/${fileId}`;
  const link = document.createElement("a");
  link.href = url;
  link.click();
};
