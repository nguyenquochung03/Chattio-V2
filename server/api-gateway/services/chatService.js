const axios = require("axios");

const fetchCreateMessage = async (consersationId, message) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/chats/message/create`,
      {
        consersationId: consersationId,
        senderId: message.sender,
        receiverId: message.receiver,
        messageContent: message.message,
        status: message.status,
        createdAt: message.createdAt,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        status: response.data.status,
        message: response.data.message,
        data: response.data.data,
      };
    } else {
      return {
        sucess: false,
        status: response.data.status,
        message: response.data.message,
      };
    }
  } catch (err) {
    console.error(`Có lỗi xảy ra khi tạo tin nhắn:`, err);
    return {
      sucess: false,
      status: 500,
      message: `Có lỗi xảy ra khi tạo tin nhắn: ${err}`,
    };
  }
};

const fetchGetConversation = async (senderId, receiverId) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/chats/conversation/get`,
      {
        senderId,
        receiverId,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        status: response.data.status,
        message: response.data.message,
        data: response.data.data,
      };
    } else {
      return {
        sucess: false,
        status: response.data.status,
        message: response.data.message,
      };
    }
  } catch (err) {
    console.error(`Có lỗi xảy ra khi lấy thông tin cuộc hội thoại:`, err);
    return {
      sucess: false,
      status: 500,
      message: `Có lỗi xảy ra khi lấy thông tin cuộc hội thoại: ${err}`,
    };
  }
};

const fetchCheckMute = async (conversationId, userId) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/chats/conversation/checkMute`,
      {
        conversationId,
        userId,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        status: response.data.status,
        message: response.data.message,
        data: response.data.data,
      };
    } else {
      return {
        sucess: false,
        status: response.data.status,
        message: response.data.message,
      };
    }
  } catch (err) {
    console.error(`Có lỗi xảy ra khi kiểm tra thông báo cuộc hội thoại:`, err);
    return {
      sucess: false,
      status: 500,
      message: `Có lỗi xảy ra khi kiểm tra thông báo cuộc hội thoại: ${err}`,
    };
  }
};

const fetchCheckMessageIsFile = async (message) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/chats/file/checkMessageIsFile`,
      {
        message,
      }
    );

    if (response.data.success) {
      return {
        success: true,
        status: response.data.status,
        message: response.data.message,
        data: response.data.data,
      };
    } else {
      return {
        sucess: false,
        status: response.data.status,
        message: response.data.message,
      };
    }
  } catch (err) {
    console.error(
      `Có lỗi xảy ra khi kiểm tra tin nhắn có phải là tập tin:`,
      err
    );
    return {
      sucess: false,
      status: 500,
      message: `Có lỗi xảy ra khi kiểm tra tin nhắn có phải là tập tin: ${err}`,
    };
  }
};

module.exports = {
  fetchCreateMessage,
  fetchGetConversation,
  fetchCheckMute,
  fetchCheckMessageIsFile,
};
