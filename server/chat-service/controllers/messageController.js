const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const { updateLastMessage } = require("../utils/conversationUtil");

const getMessagesByConversation = async (req, res) => {
  const { userId1, userId2 } = req.body;
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  try {
    // Tìm cuộc hội thoại dựa trên participants
    const conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] },
    });

    if (!conversation) {
      return res.json({
        success: false,
        status: 404,
        message: "Cuộc trò chuyện không được tìm thấy",
      });
    }

    // Lấy tất cả tin nhắn thuộc về cuộc hội thoại
    const messages = await Message.find({
      conversation: conversation._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      status: 200,
      message: "Lấy tin nhắn trong cuộc trò chuyện thành công",
      data: messages,
    });
  } catch (error) {
    console.error("Xảy ra lỗi khi tải tin nhắn:", error);
    res.json({
      success: false,
      status: 500,
      message: "Xảy ra lỗi khi tải tin nhắn",
    });
  }
};

const createMessage = async (req, res) => {
  const {
    consersationId,
    senderId,
    receiverId,
    messageContent,
    status,
    createdAt,
  } = req.body;

  try {
    // Tạo đối tượng tin nhắn mới
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      conversation: consersationId,
      message: messageContent,
      status: status,
      createdAt: createdAt,
    });

    const savedMessage = await newMessage.save();

    await updateLastMessage(consersationId, savedMessage._id);

    return res.json({
      success: true,
      status: 200,
      message: "Tin nhắn đã được tạo",
      data: savedMessage,
    });
  } catch (error) {
    console.error("Lỗi khi tạo tin nhắn:", error);
    return res.json({
      success: true,
      status: 500,
      message: `Lỗi khi tạo tin nhắn: ${error}`,
    });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { receiver } = req.body;

    const result = await Message.updateMany(
      { conversation: conversationId, status: "sent", receiver: receiver },
      { $set: { status: "read" } }
    );

    // Kiểm tra xem có tin nhắn nào được cập nhật không
    if (result.nModified > 0) {
      return res.json({
        success: true,
        message: "Đã đánh dấu tất cả tin nhắn là đã đọc thành công.",
        status: 200,
        data: { updatedCount: result.nModified },
      });
    } else {
      return res.json({
        success: false,
        message:
          "Không có tin nhắn nào được cập nhật. Có thể tất cả tin nhắn đã được đọc hoặc không có tin nhắn nào.",
        status: 200,
      });
    }
  } catch (error) {
    console.error("Lỗi khi đánh dấu tin nhắn là đã đọc:", error);
    return res.json({
      success: false,
      message: "Đã xảy ra lỗi trong quá trình cập nhật tin nhắn.",
      status: 500,
    });
  }
};

const getMessageById = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.json({
        success: false,
        status: 404,
        message: "Tin nhắn không tồn tại",
      });
    }

    // Trả về thông tin tin nhắn
    return res.json({
      success: true,
      status: 200,
      message: "Lấy tin nhắn thành công",
      data: message,
    });
  } catch (error) {
    console.error("Lỗi khi lấy tin nhắn:", error);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi lấy tin nhắn: ${error}`,
    });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { conversationId, keyword, page = 1 } = req.query;
    const limit = 15;
    const skip = (parseInt(page) - 1) * limit;

    if (!conversationId || !keyword) {
      return res.json({
        success: false,
        status: 400,
        message: "Vui lòng cung cấp đầy đủ thông tin.",
      });
    }

    const messages = await Message.aggregate([
      { $match: { $text: { $search: keyword } } },
      { $match: { conversation: new mongoose.Types.ObjectId(conversationId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Đếm tổng số tin nhắn phù hợp (không phân trang)
    const totalMessages = await Message.countDocuments({
      conversation: conversationId,
      message: { $regex: keyword, $options: "i" },
    });

    if (messages.length === 0) {
      return res.json({
        success: true,
        status: 200,
        message: "Không tìm thấy tin nhắn nào phù hợp.",
        data: [],
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: `Tìm thấy ${totalMessages} tin nhắn phù hợp.`,
      data: messages,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm tin nhắn:", error);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi, vui lòng thử lại sau: ${error.message}`,
    });
  }
};

const findMessagePage = async (req, res) => {
  try {
    const { conversationId, messageId } = req.query;
    const limit = 20; // Số lượng tin nhắn mỗi trang

    if (!conversationId || !messageId) {
      return res.json({
        success: false,
        status: 400,
        message: "Vui lòng cung cấp conversationId và messageId.",
      });
    }

    // Kiểm tra tin nhắn có tồn tại không
    const messageExists = await Message.exists({
      _id: messageId,
      conversation: conversationId,
    });

    if (!messageExists) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy tin nhắn.",
      });
    }

    // Lấy danh sách ID tin nhắn để tìm vị trí của messageId
    const allMessages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean();

    // Tìm vị trí của messageId trong danh sách
    const messageIndex = allMessages.findIndex(
      (msg) => msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy tin nhắn.",
      });
    }

    // Xác định trang hiện tại của tin nhắn
    const currentPage = Math.max(1, Math.floor(messageIndex / limit) + 1);
    const skip = Math.max(0, (currentPage - 1) * limit);

    // Lấy dữ liệu của trang chứa messageId
    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Tổng số tin nhắn
    const totalMessages = allMessages.length;

    // Kiểm tra còn dữ liệu để tải thêm không
    const hasMoreNext = skip + limit < totalMessages;
    const hasMorePrev = skip > 0;

    return res.json({
      success: true,
      status: 200,
      message: `Tin nhắn nằm ở trang ${currentPage}.`,
      data: messages,
      pagination: {
        currentPage,
        hasMoreNext,
        hasMorePrev,
      },
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm trang tin nhắn:", error);
    return res.status(500).json({
      success: false,
      message: `Đã xảy ra lỗi, vui lòng thử lại sau: ${error.message}`,
    });
  }
};

const findMessages = async (req, res) => {
  try {
    let { conversationId, currentPage = 1 } = req.query;
    const limit = 20;
    currentPage = Math.max(1, parseInt(currentPage) || 1);
    const skip = (currentPage - 1) * limit;

    if (!conversationId) {
      return res.json({
        success: false,
        status: 400,
        message: "Vui lòng cung cấp đầy đủ thông tin.",
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      status: 200,
      message: messages.length
        ? `Tìm thấy ${messages.length} tin nhắn.`
        : "Không còn tin nhắn để tải.",
      data: messages,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm tin nhắn:", error);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi, vui lòng thử lại sau: ${error.message}`,
    });
  }
};

module.exports = {
  getMessagesByConversation,
  createMessage,
  markMessagesAsRead,
  getMessageById,
  searchMessages,
  findMessagePage,
  findMessages,
};
