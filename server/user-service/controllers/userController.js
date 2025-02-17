const User = require("../models/User");
const {
  fetchConnectFriends,
  fetchGetFriendsByUserId,
  fetchGetAcceptedOrBlockedFriendsByUserId,
} = require("../services/friendService");
const { getUsersByName } = require("../utils/userUtils");

const fetchUserProfileByToken = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: "Lấy thông tin người dùng thành công",
      data: user,
    });
  } catch (error) {
    console.error("Lỗi server khi lấy thông tin người dùng:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: "Lỗi server khi lấy thông tin người dùng, vui lòng thử lại",
    });
  }
};

const fetchUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: "Người dùng đã được tìm thấy",
      data: user,
    });
  } catch (error) {
    console.error(
      "Xảy ra lỗi trong quá trình tìm kiếm người dùng qua ID:",
      error
    );
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình tìm kiếm người dùng qua ID: ${error.message}`,
    });
  }
};

const fetchUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.json({
        success: false,
        status: 400,
        message: "Danh sách ID không hợp lệ",
      });
    }

    const users = await User.find({ _id: { $in: userIds } });

    return res.json({
      success: true,
      status: 200,
      message: "Lấy thông tin người dùng thành công",
      data: users,
    });
  } catch (error) {
    console.error(
      `Lỗi máy chủ khi thực hiện lấy thông tin người dùng: ${error.message}`
    );
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi máy chủ khi thực hiện lấy thông tin người dùng: ${error.message}`,
    });
  }
};

const searchUsersByUsername = async (req, res) => {
  const { username, userId } = req.query;

  const result = await getUsersByName(username, userId);

  if (result.success) {
    return res.json({
      success: true,
      status: result.status,
      message: result.message,
      data: result.data,
    });
  } else {
    return res.json({
      success: false,
      status: result.status,
      message: result.message,
    });
  }
};

const searchUsersByUsernameInSuggestions = async (req, res) => {
  const { username, userId } = req.query;

  try {
    const userByName = await getUsersByName(username, userId);

    if (!userByName.success) {
      return res.json({
        success: false,
        status: userByName.status,
        message: userByName.message,
      });
    }

    const friends = await fetchGetFriendsByUserId(userId);

    if (!friends.success) {
      return res.json({
        success: false,
        status: friends.status,
        message: friends.message,
      });
    }

    const friendIds = friends.data.map((id) => id.toString());

    const suggestedUsers = userByName.data.filter(
      (user) =>
        !friendIds.includes(user._id.toString()) &&
        user._id.toString() !== userId
    );

    if (suggestedUsers.length === 0) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng nào với tên này",
      });
    }

    res.json({
      success: true,
      status: 200,
      message: "Gợi ý người dùng thành công",
      data: suggestedUsers,
    });
  } catch (error) {
    console.error(`Lỗi server khi tìm kiếm người dùng: ${error.message}`);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi server khi tìm kiếm người dùng: ${error.message}`,
    });
  }
};

const searchUsersByUsernameInFriends = async (req, res) => {
  const { username, userId } = req.query;

  try {
    const userByName = await getUsersByName(username);

    if (!userByName.success) {
      return res.json({
        success: false,
        status: userByName.status,
        message: userByName.message,
      });
    }

    const friends = await fetchGetAcceptedOrBlockedFriendsByUserId(userId);

    if (!friends.success) {
      return res.json({
        success: false,
        status: friends.status,
        message: friends.message,
      });
    }

    const friendIds = friends.data.map((id) => id.toString());

    const acceptedOrBlockedFriends = userByName.data.filter((user) =>
      friendIds.includes(user._id.toString())
    );

    if (acceptedOrBlockedFriends.length === 0) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy bạn bè nào với tên này",
      });
    }

    res.json({
      success: true,
      status: 200,
      message: "Tìm bạn bè thành công",
      data: acceptedOrBlockedFriends,
    });
  } catch (error) {
    console.error(`Lỗi server khi tìm bạn bè: ${error.message}`);
    res.json({
      success: false,
      status: 500,
      message: `Lỗi server khi tìm bạn bè: ${error.message}`,
    });
  }
};

const updateUserStatusById = async (req, res) => {
  const { status } = req.body;
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: status },
      { new: true }
    );

    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: `Trạng thái người dùng ${user.username} đã được cập nhật thành công`,
      data: user.status,
    });
  } catch (error) {
    console.error("Không thể cập nhật trạng thái người dùng:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Xảy ra lỗi trên server trong quá trình cập nhật trạng thái người dùng ${error.message}`,
      error: error.message,
    });
  }
};

const updateUserConversationId = async (req, res) => {
  try {
    const user = req.user;

    user.conversationId = req.body.conversationId;

    await user.save();

    return res.json({
      success: true,
      status: 200,
      message: "Cập nhật conversationStatus thành công.",
      data: user,
    });
  } catch (error) {
    console.error("Đã xảy ra lỗi khi cập nhật conversationId:", error);
    return res.json({
      success: false,
      status: 500,
      message: "Đã xảy ra lỗi khi cập nhật conversationId.",
    });
  }
};

const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 18;
    const skip = (page - 1) * limit;

    // Gọi API lấy danh sách bạn bè và bạn chung
    const connectedResponse = await fetchConnectFriends(userId);

    if (!connectedResponse.success) {
      return res.json({
        success: false,
        status: connectedResponse.status,
        message: connectedResponse.message,
      });
    }

    const { connectedUserIds, mutualFriendIds } = connectedResponse.data;

    const suggestedUsers = await User.find({
      _id: { $nin: [...connectedUserIds, userId] },
    })
      .sort({
        _id: { $in: mutualFriendIds } ? -1 : 1,
      })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      status: 200,
      message: "Lấy danh sách gợi ý kết bạn thành công",
      data: suggestedUsers,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách gợi ý kết bạn:", error.message);
    res.json({
      success: false,
      status: 500,
      message: "Lỗi server khi lấy danh sách gợi ý kết bạn",
      error: error.message,
    });
  }
};

const updateLastActiveAt = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.json({
      success: false,
      status: 400,
      message: "Thiếu userId trong yêu cầu.",
    });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { lastActiveAt: Date.now() },
      { new: true }
    );

    if (!updatedUser) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng để cập nhật.",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message: "Cập nhật thời gian hoạt động thành công.",
      data: {
        userId: updatedUser._id,
        lastActiveAt: updatedUser.lastActiveAt,
      },
    });
  } catch (error) {
    console.error(
      `Lỗi cập nhật thời gian hoạt động cho người dùng ${userId}:`,
      error
    );
    return res.json({
      success: false,
      status: 500,
      message: "Đã xảy ra lỗi máy chủ khi cập nhật.",
    });
  }
};

async function saveSubscription(req, res) {
  const { userId, subscriptionData } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng",
      });
    }

    // Kiểm tra nếu subscription đã tồn tại và giống với cái mới không
    if (
      user.subscription &&
      JSON.stringify(user.subscription) === JSON.stringify(subscriptionData)
    ) {
      return res.json({
        success: true,
        status: 200,
        message: "Subscription không thay đổi",
        data: user.subscription,
      });
    }

    // Lưu subscription vào User document
    user.subscription = subscriptionData;
    await user.save();

    return res.json({
      success: true,
      status: 200,
      message: "Đã lưu thông tin đăng ký thành công",
      data: user.subscription,
    });
  } catch (error) {
    console.error("Lỗi khi lưu thông tin đăng ký:", error);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi khi lưu thông tin đăng ký: ${error}`,
    });
  }
}

const updateCallStatus = async (req, res) => {
  const { userId, inCall, callWith } = req.body;

  try {
    if (!userId) {
      return res.json({
        success: false,
        status: 400,
        message: "Thiếu userId.",
      });
    }

    // Tìm và cập nhật thông tin `inCall` và `callWith`
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { inCall, callWith },
      { new: true }
    );

    // Kiểm tra nếu người dùng không tồn tại
    if (!updatedUser) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng.",
      });
    }

    // Phản hồi thành công
    return res.json({
      success: true,
      status: 200,
      message: "Cập nhật trạng thái cuộc gọi thành công.",
      data: updatedUser,
    });
  } catch (error) {
    console.log(`Đã xảy ra lỗi trong quá trình cập nhật: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi trong quá trình cập nhật: ${error.message}`,
    });
  }
};

const checkCallStatus = async (req, res) => {
  const { userId } = req.params;

  try {
    if (!userId) {
      return res.json({
        success: false,
        status: 400,
        message: "Thiếu userId.",
      });
    }

    // Tìm người dùng
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng.",
      });
    }

    // Phản hồi trạng thái cuộc gọi
    return res.json({
      success: true,
      status: 200,
      message: "Trạng thái cuộc gọi của người dùng.",
      data: {
        inCall: user.inCall,
        callWith: user.callWith,
      },
    });
  } catch (error) {
    console.log(`Đã xảy ra lỗi trong quá trình kiểm tra: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi trong quá trình kiểm tra: ${error.message}`,
    });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const { userId } = req.params;
    const { avatarUrl } = req.body;

    // Kiểm tra tính hợp lệ của URL
    const urlRegex = /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i;
    if (!avatarUrl || !urlRegex.test(avatarUrl)) {
      return res.json({
        success: false,
        status: 400,
        message: "URL không hợp lệ hoặc thiếu thông tin.",
      });
    }

    // Tìm user và cập nhật avatar
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng.",
      });
    }

    // Trả về kết quả thành công
    return res.json({
      success: true,
      status: 200,
      message: "Cập nhật ảnh đại diện thành công.",
      data: { avatar: user.avatar },
    });
  } catch (error) {
    console.error("Lỗi cập nhật ảnh đại diện:", error);
    // Xử lý lỗi server
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server khi cập nhật ảnh đại diện. Vui lòng thử lại sau: ${error.message}`,
    });
  }
};

module.exports = {
  fetchUserProfileByToken,
  fetchUserById,
  searchUsersByUsername,
  fetchUsersByIds,
  updateUserStatusById,
  updateUserConversationId,
  getSuggestedUsers,
  searchUsersByUsernameInSuggestions,
  searchUsersByUsernameInFriends,
  updateLastActiveAt,
  saveSubscription,
  updateCallStatus,
  checkCallStatus,
  updateAvatar,
};
