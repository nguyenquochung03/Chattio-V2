const Message = require("../models/Message");
const { getFileFromMessage } = require("../utils/File");
const {
  uploadFileWithCloudinary,
} = require("../utils/uploadFileUseCloudinary");
const {
  uploadFileWithGoogleDrive,
  downloadFileFromGoogleDrive,
} = require("../utils/uploadFileUseGoogleDrive");

const uploadFile = async (req, res) => {
  const file = req.file;

  // Kiểm tra nếu không có file tải lên
  if (!file) {
    return {
      success: false,
      status: 404,
      message: "Không có tập tin nào được tải lên",
    };
  }

  // Xác định loại file là image/video/audio
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("video/") ||
    file.mimetype.startsWith("audio/")
  ) {
    const uploadImageVideoAudio = await uploadFileWithCloudinary(file);

    if (uploadImageVideoAudio.success) {
      return res.json({
        success: true,
        status: 200,
        data: uploadImageVideoAudio.data,
        message: uploadImageVideoAudio.message,
      });
    } else {
      return res.json({
        success: false,
        status: uploadImageVideoAudio.status,
        message: uploadImageVideoAudio.message,
      });
    }
  } else {
    const uploadRawFile = await uploadFileWithGoogleDrive(file);

    if (uploadRawFile.success) {
      return res.json({
        success: true,
        status: 200,
        data: uploadRawFile.data,
        message: uploadRawFile.message,
      });
    } else {
      return res.json({
        success: false,
        status: uploadRawFile.status,
        message: uploadRawFile.message,
      });
    }
  }
};

const getMessagesWithMediaFile = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Tìm các message trong conversation
    const messages = await Message.find({ conversation: conversationId });

    // Lọc các message mà getFileFromMessage trả về success = true và type !== "Raw"
    const filteredMessages = await Promise.all(
      messages.map(async (message) => {
        const fileResult = await getFileFromMessage(message.message);
        return fileResult && fileResult.success && fileResult.type === "Image";
      })
    );

    const filteredMessagesResults = messages.filter(
      (_, index) => filteredMessages[index]
    );

    // Nếu không có message nào thỏa mãn điều kiện
    if (filteredMessagesResults.length === 0) {
      return res.json({
        success: true,
        status: 200,
        message: "Không tìm thấy tập tin hợp lệ",
        data: [],
      });
    }

    // Trả về kết quả thành công với danh sách message lọc
    return res.json({
      success: true,
      status: 200,
      message: "Tập tin được truy xuất thành công",
      data: filteredMessagesResults,
    });
  } catch (error) {
    console.error(`Xảy ra lỗi server khi truy xuất tập tin: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Xảy ra lỗi server khi truy xuất tập tin: ${error.message}`,
    });
  }
};

const getMessagesWithRawFile = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Tìm các message trong conversation
    const messages = await Message.find({ conversation: conversationId });

    const filteredMessages = await Promise.all(
      messages.map(async (message) => {
        const fileResult = await getFileFromMessage(message.message);
        // Điều kiện lọc: success = true và type === "Raw"
        if (fileResult && fileResult.success && fileResult.type === "Raw") {
          return fileResult.data; // Trả về data nếu thỏa mãn điều kiện
        }
        return null; // Nếu không thỏa mãn, trả về null
      })
    );

    // Lọc bỏ những giá trị null trong mảng filteredMessages
    const filteredMessagesResults = filteredMessages.filter(
      (result) => result !== null
    );

    // Nếu không có message nào thỏa mãn điều kiện
    if (filteredMessagesResults.length === 0) {
      return res.json({
        success: false,
        status: 200,
        message: "Không tìm thấy tập tin hợp lệ",
        data: [],
      });
    }

    // Trả về kết quả thành công với danh sách message lọc
    return res.json({
      success: true,
      status: 200,
      message: "Tập tin được truy xuất thành công",
      data: filteredMessagesResults,
    });
  } catch (error) {
    console.error(`Xảy ra lỗi server khi truy xuất tập tin: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Xảy ra lỗi server khi truy xuất tập tin: ${error.message}`,
    });
  }
};

const checkMessageIsFile = async (req, res) => {
  const { message } = req.body;

  const isFile = await getFileFromMessage(message);

  if (isFile && isFile.success) {
    return res.json({
      success: true,
      status: 200,
      message: "Tin nhắn này là tập tin",
      data: isFile.type,
    });
  } else {
    return res.json({
      success: false,
      status: 400,
      message: "Tin nhắn này không phải là tập tin",
    });
  }
};

module.exports = {
  uploadFile,
  getMessagesWithMediaFile,
  getMessagesWithRawFile,
  downloadFileFromGoogleDrive,
  checkMessageIsFile,
};
