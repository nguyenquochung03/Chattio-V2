const Conversation = require("../models/Conversation");
const axios = require("axios");
const { getUsersByIds } = require("../services/userService");
const Message = require("../models/Message");

const createConversation = async (req, res) => {
  const { userId1, userId2 } = req.body;
  const userIds = [userId1, userId2];

  try {
    const usersData = await getUsersByIds(userIds);

    if (!usersData.success) {
      return res.json({
        success: false,
        status: usersData.status,
        message: usersData.message,
      });
    }

    // Kiểm tra xem cuộc trò chuyện đã tồn tại giữa hai người này chưa
    const existingConversation = await Conversation.findOne({
      participants: { $size: 2, $all: [userId1, userId2] },
    });

    if (existingConversation) {
      return res.json({
        success: false,
        status: 400,
        message: "Cuộc trò chuyện đã tồn tại giữa hai người dùng này",
      });
    }

    // Tạo một cuộc trò chuyện mới
    const newConversation = new Conversation({
      participants: [userId1, userId2],
    });

    // Lưu cuộc trò chuyện vào cơ sở dữ liệu
    const savedConversation = await newConversation.save();

    return res.json({
      success: true,
      status: 201,
      message: "Tạo cuộc trò chuyện mới thành công",
      data: savedConversation,
    });
  } catch (error) {
    console.error(`Lỗi khi tạo cuộc trò chuyện mới: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi khi tạo cuộc trò chuyện mới: ${error.message}`,
    });
  }
};

const getConversation = async (req, res) => {
  const { senderId, receiverId } = req.body;
  const userIds = [senderId, receiverId];

  try {
    const usersData = await getUsersByIds(userIds);

    if (!usersData.success) {
      return res.json({
        success: false,
        status: usersData.status,
        message: usersData.message,
      });
    }

    // Kiểm tra xem cuộc trò chuyện đã tồn tại giữa hai người này chưa
    const existingConversation = await Conversation.findOne({
      participants: { $size: 2, $all: [senderId, receiverId] },
    });

    if (!existingConversation) {
      return res.json({
        success: false,
        status: 400,
        message: "Cuộc trò chuyện chưa tồn tại giữa hai người dùng này",
      });
    }

    return res.json({
      success: true,
      status: 201,
      message: "Lấy thông tin cuộc trò chuyện thành công",
      data: existingConversation,
    });
  } catch (error) {
    console.error(`Lỗi khi lấy thông tin cuộc trò chuyện: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi khi lấy thông tin cuộc trò chuyện: ${error.message}`,
    });
  }
};

const getLastMessageFromConversation = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findById(conversationId).populate(
      "lastMessage"
    );

    if (!conversation) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy cuộc trò chuyện",
      });
    }

    if (conversation.lastMessage) {
      const lastMessage = await Message.findById(conversation.lastMessage);

      return res.json({
        success: true,
        status: 200,
        message: "Lấy tin nhắn cuối cùng thành công",
        data: lastMessage,
      });
    } else {
      return res.json({
        success: false,
        status: 404,
        message: "Cuộc trò chuyện không có tin nhắn nào",
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy lastMessage:", error);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi lấy tin nhắn cuối cùng: ${error}`,
    });
  }
};

const muteConversation = async (req, res) => {
  try {
    const { conversationId, userId, duration } = req.body;

    let durationInMinutes =
      duration === "indefinite" ? -1 : parseInt(duration, 10);

    // Kiểm tra xem thời lượng có hợp lệ không
    if (![15, 60, 480, 1440, -1].includes(durationInMinutes)) {
      return res.json({
        success: false,
        status: 400,
        message: "Thời lượng không hợp lệ",
        data: null,
      });
    }

    // Tính thời điểm khi nào thông báo sẽ tự động bật lại (nếu duration không phải là vô thời hạn)
    const muteUntil =
      durationInMinutes !== -1
        ? new Date(Date.now() + durationInMinutes * 60 * 1000)
        : null;

    // Cập nhật trạng thái tắt thông báo cho người dùng trong cuộc hội thoại
    const updatedConversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $set: {
          [`muteNotifications.${userId}`]: {
            duration: durationInMinutes,
            muteUntil: muteUntil,
          },
        },
      },
      { new: true }
    );

    if (!updatedConversation) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy cuộc hội thoại",
        data: null,
      });
    }

    res.json({
      success: true,
      status: 200,
      message: "Đã tắt thông báo thành công",
      data: {
        muteUntil: muteUntil,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tắt thông báo:", error);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ, vui lòng thử lại: ${error.message}`,
      data: null,
    });
  }
};

const checkMuteConversation = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    // Tìm cuộc hội thoại theo ID
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy cuộc hội thoại",
        data: null,
      });
    }

    // Kiểm tra xem có thông tin tắt thông báo của người dùng trong cuộc hội thoại không
    const muteInfo = conversation.muteNotifications.get(userId);
    if (!muteInfo) {
      return res.json({
        success: true,
        status: 200,
        message: "Người dùng có thể nhận thông báo",
        data: {
          isMuted: false,
          muteUntil: null,
          duration: null,
        },
      });
    }

    // Kiểm tra xem thông báo có đang bị tắt hay không và thời gian tắt thông báo còn lại
    const isMuted = muteInfo.muteUntil && muteInfo.muteUntil > Date.now();
    const muteUntil = isMuted ? muteInfo.muteUntil : null;
    const duration = muteInfo.duration;

    res.json({
      success: true,
      status: 200,
      message: isMuted ? "Thông báo đang tắt" : "Thông báo chưa tắt",
      data: {
        isMuted,
        muteUntil,
        duration,
      },
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra trạng thái tắt thông báo:", error);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ, vui lòng thử lại: ${error.message}`,
      data: null,
    });
  }
};

const unmuteConversation = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;

    // Tìm cuộc hội thoại theo ID
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy cuộc hội thoại",
      });
    }

    // Kiểm tra xem có thông tin tắt thông báo của người dùng trong cuộc hội thoại không
    const muteInfo = conversation.muteNotifications.get(userId);
    if (!muteInfo) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy thông tin tắt thông báo cho người dùng này",
      });
    }

    // Xóa thông tin tắt thông báo (bật lại thông báo)
    await Conversation.updateOne(
      { _id: conversationId },
      { $unset: { [`muteNotifications.${userId}`]: "" } }
    );

    res.json({
      success: true,
      status: 200,
      message: "Đã bật lại thông báo thành công",
    });
  } catch (error) {
    console.error("Lỗi khi bật lại thông báo:", error);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ, vui lòng thử lại: ${error.message}`,
      data: null,
    });
  }
};

module.exports = {
  createConversation,
  getConversation,
  getLastMessageFromConversation,
  muteConversation,
  checkMuteConversation,
  unmuteConversation,
};
