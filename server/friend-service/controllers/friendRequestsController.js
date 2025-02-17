const Friend = require("../models/Friend");
const { getUsersByIds } = require("../services/userService");
const { createConversation } = require("../services/chatService");

const addFriend = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    // Kiểm tra nếu sender và receiver là giống nhau, không thể kết bạn với chính mình
    if (senderId === receiverId) {
      return res.json({
        success: false,
        status: 400,
        message: "Bạn không thể kết bạn với chính mình",
      });
    }

    // Kiểm tra nếu đã có kết bạn (2 người không thể kết bạn nhiều lần)
    const existingFriendRequest = await Friend.findOne({
      $or: [
        {
          sender: senderId,
          receiver: receiverId,
        },
        {
          sender: receiverId,
          receiver: senderId,
        },
      ],
    });

    if (existingFriendRequest) {
      return res.json({
        success: false,
        status: 400,
        message: "Đã gửi yêu cầu kết bạn đến người dùng này. Không thể gửi lại",
      });
    }

    // Tạo yêu cầu kết bạn mới
    const newFriendRequest = new Friend({
      sender: senderId,
      receiver: receiverId,
    });

    // Lưu yêu cầu kết bạn
    await newFriendRequest.save();

    return res.json({
      success: true,
      status: 200,
      message: "Yêu cầu kết bạn đã được gửi",
      data: newFriendRequest,
    });
  } catch (error) {
    console.error("Xảy ra lỗi khi gửi yêu cầu kết bạn: ", error.message);
    return res.json({
      success: false,
      status: 500,
      message: "Xảy ra lỗi khi gửi yêu cầu kết bạn: " + error.message,
    });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 18;
    const skip = (page - 1) * limit;

    // Tìm tất cả các yêu cầu kết bạn mà receiver là userId
    const friendRequests = await Friend.find({
      receiver: userId,
      status: "pending",
    })
      .skip(skip)
      .limit(limit);

    // Kiểm tra nếu không có yêu cầu nào
    if (friendRequests.length === 0) {
      return res.json({
        success: true,
        status: 200,
        message: "Không có yêu cầu kết bạn nào",
        data: [],
      });
    }

    // Lấy thông tin người muốn kết bạn đến người dùng từ danh sách yêu cầu kết bạn thông qua các id của họ
    const sender = friendRequests.map((request) => request.sender.toString());
    const dataOfSender = await getUsersByIds(sender);

    if (dataOfSender.success) {
      return res.json({
        success: true,
        status: 200,
        message: "Danh sách yêu cầu kết bạn",
        data: dataOfSender.data,
      });
    } else {
      return res.json({
        success: false,
        status: dataOfSender.status,
        message: dataOfSender.message,
      });
    }
  } catch (error) {
    console.error("Lỗi lấy danh sách yêu cầu kết bạn:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi lấy danh sách yêu cầu kết bạn ${error.message}`,
    });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 18;
    const skip = (page - 1) * limit;

    // Tìm tất cả các yêu cầu kết bạn mà receiver là userId
    const sentRequests = await Friend.find({
      sender: userId,
      status: "pending",
    })
      .skip(skip)
      .limit(limit);

    // Kiểm tra nếu không có yêu cầu nào
    if (sentRequests.length === 0) {
      return res.json({
        success: true,
        status: 200,
        message: "Chưa gửi yêu cầu kết bạn nào",
        data: [],
      });
    }

    const receiver = sentRequests.map((request) => request.receiver.toString());

    const dataOfReceiver = await getUsersByIds(receiver);

    if (dataOfReceiver.success) {
      return res.json({
        success: true,
        status: 200,
        message: "Danh sách yêu cầu kết bạn đã gửi",
        data: dataOfReceiver.data,
      });
    } else {
      return res.json({
        success: false,
        status: dataOfSender.status,
        message: dataOfSender.message,
      });
    }
  } catch (error) {
    console.error("Lỗi lấy danh sách yêu cầu kết bạn đã gửi:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi lấy danh sách yêu cầu kết bạn đã gửi ${error.message}`,
    });
  }
};

const getFriendRequestCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm số lượng yêu cầu kết bạn mà người dùng này đã nhận hoặc đã gửi
    const pendingRequestsCount = await Friend.countDocuments({
      receiver: userId,
      status: "pending",
    });

    return res.json({
      success: true,
      status: 200,
      message: "Số lượng yêu cầu kết bạn đang chờ xử lý",
      data: pendingRequestsCount,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra yêu cầu kết bạn:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi kiểm tra yêu cầu kết bạn: ${error.message}`,
    });
  }
};

const getSentRequestCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Tìm số lượng yêu cầu kết bạn mà người dùng này đã nhận hoặc đã gửi
    const sentRequestCount = await Friend.countDocuments({
      sender: userId,
      status: "pending",
    });

    return res.json({
      success: true,
      status: 200,
      message: "Số lượng yêu cầu kết bạn đã gửi",
      data: sentRequestCount,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra yêu cầu kết bạn đã gửi:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi kiểm tra yêu cầu kết bạn đã gửi: ${error.message}`,
    });
  }
};

const getAcceptedUnconfirmedRequestsCount = async (req, res) => {
  try {
    const { userId } = req.params;

    // Đếm các bản ghi thỏa điều kiện
    const count = await Friend.countDocuments({
      sender: userId,
      status: "accepted",
      isConfirmed: false,
    });

    return res.json({
      success: true,
      status: 200,
      message: "Số lượng yêu cầu kết bạn đã gửi",
      data: count,
    });
  } catch (error) {
    console.error("Lỗi kiểm tra yêu cầu kết bạn đã chấp nhận:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi khi kiểm tra yêu cầu kết bạn đã chấp nhận: ${error.message}`,
    });
  }
};

const acceptFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    // Tìm mối quan hệ kết bạn giữa sender và receiver
    const friendRequest = await Friend.findOne({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (!friendRequest || friendRequest.status !== "pending") {
      return res.json({
        success: false,
        status: 404,
        message: "Yêu cầu kết bạn không tồn tại hoặc đã được xử lý",
      });
    }

    // Tạo cuộc họp thoại mới giữa hai người dùng
    const newConversation = await createConversation(senderId, receiverId);

    if (newConversation.success) {
      // Cập nhật trạng thái của yêu cầu kết bạn thành "accepted"
      friendRequest.status = "accepted";
      await friendRequest.save();

      return res.json({
        success: true,
        status: 200,
        message: "Đã đồng ý kết bạn",
        data: friendRequest,
      });
    } else {
      return res.json({
        success: false,
        status: newConversation.status,
        message: newConversation.message,
      });
    }
  } catch (error) {
    console.error(`Lỗi máy chủ khi xử lý yêu cầu kết bạn: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ khi xử lý yêu cầu kết bạn: ${error.message}`,
    });
  }
};

const rejectFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    // Tìm mối quan hệ kết bạn giữa sender và receiver
    const deleteFriendRequest = await Friend.findOneAndDelete({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (!deleteFriendRequest) {
      return res.json({
        success: false,
        status: 404,
        message: "Yêu cầu kết bạn không tồn tại hoặc đã được xử lý",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: "Đã từ chối kết bạn",
      data: deleteFriendRequest,
    });
  } catch (error) {
    console.error(`Lỗi máy chủ khi xử lý yêu cầu kết bạn: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ khi xử lý yêu cầu kết bạn: ${error.message}`,
    });
  }
};

const cancelFriendRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    const deletedRequest = await Friend.findOneAndDelete({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    if (!deletedRequest) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy lời mời kết bạn hoặc lời mời đã được xử lý.",
      });
    }

    res.json({
      success: true,
      status: 200,
      message: "Hủy lời mời kết bạn thành công.",
      data: deletedRequest,
    });
  } catch (error) {
    console.error(`Lỗi khi hủy lời mời kết bạn: ${error.message}`);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi server: ${error.message}`,
    });
  }
};

const confirmForAcceptedRequest = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    const result = await Friend.findOneAndUpdate(
      {
        sender: senderId,
        receiver: receiverId,
      },
      {
        $set: { isConfirmed: true },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!result) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy yêu cầu kết bạn cần cập nhật.",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: "Cập nhật thành công yêu cầu kết bạn.",
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật isConfirmed:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: "Đã xảy ra lỗi khi cập nhật yêu cầu kết bạn.",
    });
  }
};

const getAcceptedFriendRequestsBySender = async (req, res) => {
  const userId = req.query.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const skip = (page - 1) * limit;

  try {
    const friendRequests = await Friend.find({
      sender: userId,
      status: { $in: ["accepted", "blocked"] },
      isConfirmed: false,
    })
      .skip(skip)
      .limit(limit);

    if (friendRequests.length === 0) {
      return res.json({
        success: true,
        status: 200,
        message: "Không có yêu cầu kết bạn nào thỏa mãn điều kiện",
        data: [],
      });
    }

    const sender = friendRequests.map((request) => request.receiver.toString());
    const dataOfSender = await getUsersByIds(sender);

    if (dataOfSender.success) {
      return res.json({
        success: true,
        status: 200,
        message: "Danh sách yêu cầu kết bạn đã được chấp nhận",
        data: dataOfSender.data,
      });
    } else {
      return res.json({
        success: false,
        status: dataOfSender.status,
        message: dataOfSender.message,
      });
    }
  } catch (error) {
    console.error("Lỗi khi lấy yêu cầu kết bạn đã chấp nhận:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: "Đã xảy ra lỗi khi lấy yêu cầu kết bạn đã chấp nhận",
    });
  }
};

module.exports = {
  addFriend,
  getFriendRequests,
  getSentRequests,
  getFriendRequestCount,
  getSentRequestCount,
  getAcceptedUnconfirmedRequestsCount,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  confirmForAcceptedRequest,
  getAcceptedFriendRequestsBySender,
};
