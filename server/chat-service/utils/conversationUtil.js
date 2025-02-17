const Conversation = require("../models/Conversation");

// Hàm cập nhật lastMessage cho cuộc trò chuyện
const updateLastMessage = async (conversationId, lastMessageId) => {
  try {
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessage: lastMessageId },
      { new: true }
    );

    if (!updatedConversation) {
      return {
        success: false,
        status: 404,
        message: "Không tìm thấy cuộc trò truyện",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Cập nhật lastMessage thành công",
      data: updatedConversation,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật lastMessage:", error);
    return {
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi cập nhật lastMessage: ${error}`,
    };
  }
};

module.exports = { updateLastMessage };
