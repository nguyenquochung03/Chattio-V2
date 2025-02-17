const axios = require("axios");

const createConversation = async (senderId, receiverId) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/chats/conversation/create`,
      {
        userId1: senderId,
        userId2: receiverId,
      }
    );

    if (!response.data.success) {
      return {
        success: false,
        status: response.data.status,
        message: response.data.message,
      };
    }

    return {
      success: true,
      status: 200,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    console.log(
      `Xảy ra lỗi server trong quá trình tạo cuộc hội thoại: ${error.message}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server trong quá trình tạo cuộc hội thoại: ${error.message}`,
    };
  }
};

module.exports = { createConversation };
