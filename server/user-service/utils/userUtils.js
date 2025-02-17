const User = require("../models/User");

const loginWithGoogle = async (profile) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });

    if (user) {
      user.lastActiveAt = Date.now();
      user.isActive = true;
      await user.save();
    } else {
      user = new User({
        username: profile.displayName,
        email: profile.emails[0].value,
        password: "@12345Google",
        isActive: true,
      });

      await user.save();
    }

    return { success: true, data: user };
  } catch (error) {
    console.error(
      "Xảy ra lỗi server trong quá trình đăng nhập bằng Google:",
      error
    );
    return {
      success: false,
      message: `Xảy ra lỗi server trong quá trình đăng nhập bằng Google: ${error}`,
    };
  }
};

const loginWithFacebook = async (profile) => {
  try {
    const facebookId = profile.id;

    if (!facebookId) {
      return {
        success: false,
        message: "Không thể lấy ID Facebook từ tài khoản của bạn.",
      };
    }

    let user = await User.findOne({ facebookId });

    if (user) {
      user.lastActiveAt = Date.now();
      user.isActive = true;
      await user.save();
    } else {
      user = new User({
        username: profile.displayName,
        facebookId: facebookId,
        password: "@12345Facebook",
        isActive: true,
      });

      await user.save();
    }

    return { success: true, data: user };
  } catch (error) {
    console.error(
      "Xảy ra lỗi server trong quá trình đăng nhập bằng Facebook:",
      error
    );
    return {
      success: false,
      message: `Xảy ra lỗi server trong quá trình đăng nhập bằng Facebook: ${error}`,
    };
  }
};

const getUsersByName = async (username, userId) => {
  try {
    const users = await User.find({
      username: { $regex: username, $options: "i" },
      _id: { $ne: userId },
    });

    if (users.length === 0) {
      return {
        success: false,
        status: 404,
        message: "Không tìm thấy người dùng nào với tên này",
      };
    }

    return {
      success: true,
      status: 200,
      message: "Tìm kiếm người dùng thành công",
      data: users,
    };
  } catch (error) {
    console.error(
      `Xảy ra lỗi khi tìm kiếm người dùng bằng tên: ${error.message}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi khi tìm kiếm người dùng bằng tên: ${error.message}`,
    };
  }
};

module.exports = {
  loginWithGoogle,
  loginWithFacebook,
  getUsersByName,
};
