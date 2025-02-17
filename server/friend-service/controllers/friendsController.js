const Friend = require("../models/Friend");
const { getUsersByIds } = require("../services/userService");

const getFriends = async (req, res) => {
  try {
    const userId = req.query.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 18;
    const skip = (page - 1) * limit;
    const friends = await Friend.find({
      $or: [
        { sender: userId, status: { $in: ["accepted", "blocked"] } },
        { receiver: userId, status: { $in: ["accepted", "blocked"] } },
      ],
    })
      .skip(skip)
      .limit(limit);

    // Nếu không có bạn bè
    if (friends.length === 0) {
      return res.json({
        success: true,
        status: 200,
        message: "Không có người bạn nào",
        data: [],
      });
    }

    // Lấy danh sách các userId từ sender và receiver
    const friendIds = friends.map((item) =>
      item.sender.toString() === userId
        ? item.receiver.toString()
        : item.sender.toString()
    );

    // Lấy thông tin người dùng từ các ID bạn bè
    const friendData = await getUsersByIds(friendIds);

    if (friendData.success) {
      return res.json({
        success: true,
        status: 200,
        message: "Lấy danh sách bạn bè thành công",
        data: friendData.data,
        pagination: {
          page,
          limit,
          total: friendIds.length,
        },
      });
    } else {
      return res.json({
        success: false,
        status: friendData.status,
        message: friendData.message,
      });
    }
  } catch (error) {
    console.error("Lỗi lấy danh sách bạn bè:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: "Đã xảy ra lỗi khi lấy danh sách bạn bè",
    });
  }
};

const getFriendIds = async (req, res) => {
  try {
    const { userId } = req.params;

    const friends = await Friend.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: { $in: ["accepted", "blocked"] },
    });

    const friendIds = friends.map((friend) =>
      friend.sender.toString() === userId ? friend.receiver : friend.sender
    );

    return res.json({
      success: true,
      message: "Lấy danh sách id bạn bè thành công",
      status: 200,
      data: friendIds,
    });
  } catch (error) {
    console.log(`Lỗi khi lấy danh sách id bạn bè: ${error}`);
    res.json({
      success: false,
      message: `Lỗi khi lấy danh sách id bạn bè: ${error}`,
      status: 500,
    });
  }
};

const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.params;

    // Lấy danh sách bạn bè đã kết nối
    const friendsAndRequests = await Friend.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    const connectedUserIds = friendsAndRequests.map((item) =>
      item.sender.equals(userId) ? item.receiver : item.sender
    );

    // Tìm bạn chung (mutual friends)
    const mutualFriends = await Friend.find({
      $or: [
        {
          sender: { $in: connectedUserIds },
          receiver: { $nin: [...connectedUserIds, userId] },
          status: { $in: ["accepted", "blocked"] },
        },
        {
          receiver: { $in: connectedUserIds },
          sender: { $nin: [...connectedUserIds, userId] },
          status: { $in: ["accepted", "blocked"] },
        },
      ],
    }).select("sender receiver");

    const mutualFriendIds = mutualFriends.map((f) =>
      f.sender.equals(userId) ? f.receiver : f.sender
    );

    res.json({
      success: true,
      status: 200,
      message: "Lấy danh sách ID người dùng liên quan thành công",
      data: {
        connectedUserIds,
        mutualFriendIds,
      },
    });
  } catch (error) {
    console.log(
      `Lỗi server khi lấy danh sách người dùng liên quan: ${error.message}`
    );
    res.json({
      success: false,
      status: 500,
      message: `Lỗi server khi lấy danh sách người dùng liên quan: ${error.message}`,
    });
  }
};

const getFriendsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const friends = await Friend.find({
      $or: [{ sender: userId }, { receiver: userId }],
    });

    const relatedUserIds = friends.map((friend) => {
      return friend.sender.toString() === userId
        ? friend.receiver
        : friend.sender;
    });

    res.json({
      success: true,
      status: 200,
      message: "Lấy danh sách ID người dùng liên quan thành công",
      data: relatedUserIds,
    });
  } catch (error) {
    console.log(
      `Lỗi server khi lấy danh sách người dùng liên quan: ${error.message}`
    );
    res.json({
      success: false,
      status: 500,
      message: `Lỗi server khi lấy danh sách người dùng liên quan: ${error.message}`,
    });
  }
};

const getAcceptedOrBlockFriendsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const friends = await Friend.find({
      $or: [
        { sender: userId, status: { $in: ["accepted", "blocked"] } },
        { receiver: userId, status: { $in: ["accepted", "blocked"] } },
      ],
    });

    const relatedUserIds = friends.map((friend) => {
      return friend.sender.toString() === userId
        ? friend.receiver
        : friend.sender;
    });

    res.json({
      success: true,
      status: 200,
      message: "Lấy danh sách ID bạn bè thành công",
      data: relatedUserIds,
    });
  } catch (error) {
    console.log(`Lỗi server khi lấy danh sách bạn bè: ${error.message}`);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi server khi lấy danh sách bạn bè: ${error.message}`,
    });
  }
};

const updateFriendStatus = async (req, res) => {
  try {
    const { userId1, userId2, status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ["pending", "accepted", "rejected", "blocked"];
    if (!validStatuses.includes(status)) {
      return res.json({
        success: false,
        status: 400,
        message: "Trạng thái không hợp lệ",
        data: null,
      });
    }

    // Tìm mối quan hệ bạn bè giữa sender và receiver
    const friendRequest = await Friend.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    });

    if (!friendRequest) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy mối quan hệ bạn bè giữa hai người này",
        data: null,
      });
    }

    // Cập nhật trạng thái mối quan hệ bạn bè
    friendRequest.status = status;

    // Nếu trạng thái là 'accepted', đánh dấu là đã xác nhận
    if (status === "accepted") {
      friendRequest.isConfirmed = true;
    }

    // Nếu trạng thái là 'blocked', xác định người đã block
    if (status === "blocked") {
      friendRequest.blockedBy = userId1;
    } else {
      friendRequest.blockedBy = null;
    }

    await friendRequest.save();

    res.json({
      success: true,
      status: 200,
      message: "Cập nhật trạng thái bạn bè thành công",
      data: friendRequest,
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái bạn bè:", error);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ, vui lòng thử lại: ${error.message}`,
      data: null,
    });
  }
};

const checkIfBlocked = async (req, res) => {
  try {
    const { userId1, userId2 } = req.body;

    // Tìm mối quan hệ bạn bè giữa sender và receiver
    const friendRequest = await Friend.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    });

    if (!friendRequest) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy mối quan hệ bạn bè giữa hai người này",
        data: null,
      });
    }

    // Kiểm tra nếu trạng thái là blocked và trả về người đã block
    if (friendRequest.status === "blocked") {
      return res.json({
        success: true,
        status: 200,
        message: "Một trong hai người đã block",
        data: {
          isBlocked: true,
          blockedBy: friendRequest.blockedBy,
        },
      });
    }

    // Trả về thông báo nếu không bị block
    return res.json({
      success: true,
      status: 200,
      message: "Không có block trong mối quan hệ này",
      data: {
        isBlocked: false,
        blockedBy: null,
      },
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra block:", error);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ, vui lòng thử lại: ${error.message}`,
      data: null,
    });
  }
};

const getFriendship = async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const friendship = await Friend.findOne({
      $or: [
        { sender: userId1, receiver: userId2 },
        { sender: userId2, receiver: userId1 },
      ],
    });

    if (!friendship) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy mối quan hệ bạn bè",
      });
    }

    res.json({
      success: true,
      status: 200,
      message: "Đã tìm thấy mối quan hệ bạn bè",
      data: friendship,
    });
  } catch (error) {
    console.error("Lỗi khi tìm kiếm mối quan hệ bạn bè:", error);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ nội bộ: ${error.message}`,
    });
  }
};

module.exports = {
  getFriends,
  getFriendIds,
  getUserConnections,
  getFriendsByUserId,
  getAcceptedOrBlockFriendsByUserId,
  updateFriendStatus,
  checkIfBlocked,
  getFriendship,
};
