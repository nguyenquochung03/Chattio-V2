const User = require("../models/User");

const updatePrivacySettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { profileVisibility, chatPermission, callPermission } = req.body;

    // Kiểm tra dữ liệu gửi lên có hợp lệ không
    const validProfileVisibilities = ["public", "friends", "private"];
    const validChatPermissions = ["everyone", "friends", "no one"];
    const validCallPermissions = ["everyone", "friends", "no one"];

    if (
      profileVisibility &&
      !validProfileVisibilities.includes(profileVisibility)
    ) {
      return res.json({
        success: false,
        status: 400,
        message: "Tùy chọn hiển thị hồ sơ không hợp lệ",
      });
    }

    if (chatPermission && !validChatPermissions.includes(chatPermission)) {
      return res.json({
        success: false,
        status: 400,
        message: "Tùy chọn cấp phép trò chuyện không hợp lệ",
      });
    }

    if (callPermission && !validCallPermissions.includes(callPermission)) {
      return res.json({
        success: false,
        status: 400,
        message: "Tùy chọn cấp phép cuộc gọi không hợp lệ",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "privacySettings.profileVisibility": profileVisibility,
          "privacySettings.chatPermission": chatPermission,
          "privacySettings.callPermission": callPermission,
        },
      },
      { new: true, fields: "privacySettings" }
    );

    if (!updatedUser) {
      return res.json({
        success: false,
        status: 404,
        message: "Cập nhật thông tin thất bại",
      });
    }

    res.json({
      success: true,
      status: 200,
      message: "Đã cập nhật cài đặt quyền riêng tư thành công",
      data: updatedUser.privacySettings,
    });
  } catch (error) {
    res.json({
      success: false,
      status: 500,
      message: `Xảy ra lỗi server khi cập nhật quyền riêng tư: ${error.message}`,
    });
  }
};

module.exports = {
  updatePrivacySettings,
};
