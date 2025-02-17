const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const passport = require("passport");
const User = require("../models/User");
const {
  sendVerificationEmail,
  verifyUser,
  sendPasswordResetEmail,
} = require("../utils/emailUtils");
const { verifyToken } = require("../middleware/authMiddleware");

const validateToken = (req, res) => {
  const token = req.query.token;
  if (!token) {
    return res.json({
      success: false,
      status: 400,
      message: "Không tìm thấy token",
    });
  }

  const verify = verifyToken(token);
  if (!verify.success) {
    return res.json({ success: false, status: 401, message: verify.message });
  }

  res.json({
    success: true,
    status: 200,
    message: "Token hợp lệ",
    data: verify.data,
  });
};

const register = async (req, res) => {
  const { username, email, password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(", ");

    return res.json({ success: false, status: 400, message: message });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.json({
        success: false,
        status: 400,
        message: "Email đã được sử dụng bởi người dùng khác",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.json({
      success: true,
      status: 201,
      message: "Đăng ký tài khoản thành công",
      data: newUser,
    });
  } catch (error) {
    console.error(
      `Lỗi server trong quá trình đăng ký tài khoản: ${error.message}`
    );
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình đăng ký tài khoản, vui lòng thử lại.`,
    });
  }
};

const login = async (req, res) => {
  const { email, password, isRemember, ipAddress, deviceInfo, loggedAt } =
    req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(". ");

    return res.json({ success: false, status: 400, message: message });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        success: false,
        status: 400,
        message: `Không tìm thấy người dùng có email là ${email}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        success: false,
        status: 400,
        message: "Mật khẩu không chính xác",
      });
    }

    user.isRemember = isRemember;
    user.lastActiveAt = Date.now();
    user.isActive = true;

    user.loginHistory.push({
      ipAddress,
      device: deviceInfo,
      loggedAt,
    });

    await user.save();

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    const result = await sendVerificationEmail(user.email);

    if (result.success) {
      return res.json({
        success: true,
        status: 200,
        message:
          "Đăng nhập thành công, vui lòng thực hiện thêm việc xác minh qua email",
        data: token,
      });
    } else {
      return res.json({ success: false, status: 400, message: result.message });
    }
  } catch (error) {
    console.error(`Lỗi server trong quá trình đăng nhập: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình đăng nhập, vui lòng thử lại.`,
    });
  }
};

const fetchSendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        status: 400,
        message: `Không tìm thấy người dùng có email là ${email}`,
      });
    }

    const result = await sendVerificationEmail(email);

    if (result.success) {
      return res.json({ success: true, status: 200, message: result.message });
    } else {
      return res.json({ success: false, status: 400, message: result.message });
    }
  } catch (error) {
    console.error(
      `Lỗi server trong quá trình gửi mã xác nhận đến ${email}: ${error.message}`
    );
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình gửi mã xác nhận đến ${email}, vui lòng thử lại.`,
    });
  }
};

const confirmEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(". ");

    return res.json({ success: false, status: 400, message: message });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        status: 400,
        message: `Không tìm thấy người dùng có email là ${email}`,
      });
    }

    const result = await verifyUser(email, verificationCode);

    if (result.success) {
      return res.json({
        success: true,
        status: 200,
        message: result.message,
        data: result.data,
      });
    } else {
      return res.json({
        success: false,
        status: 400,
        message: result.message,
      });
    }
  } catch (error) {
    console.error(`Lỗi server trong quá trình xác nhận: ${error.message}`);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình gửi xác nhận, vui lòng thử lại.`,
    });
  }
};

const fetchSendPasswordResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        status: 400,
        message: `Không tìm thấy người dùng có email là ${email}`,
      });
    }

    const result = await sendPasswordResetEmail(email);

    if (result.success) {
      return res.json({ success: true, status: 200, message: result.message });
    } else {
      return res.json({ success: false, status: 400, message: result.message });
    }
  } catch (error) {
    console.error(
      `Lỗi server trong quá trình gửi link đổi mật khẩu đến ${email}: ${error.message}`
    );
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình gửilink đổi mật khẩu đến ${email}, vui lòng thử lại.`,
    });
  }
};

async function updatePassword(req, res) {
  const userId = req.params.userId;
  const { password } = req.body;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(". ");

    return res.json({ success: false, status: 400, message: message });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    );

    if (!result) {
      return res.json({
        success: false,
        status: 400,
        message: "Người dùng không tồn tại",
      });
    }

    return res.json({
      success: true,
      status: 200,
      message:
        "Cập nhật mật khẩu thành công, bạn có thể truy cập tài khoản bằng mật khẩu mới",
    });
  } catch (error) {
    console.log(
      `Lỗi server trong quá trình cập nhật mật khẩu: ${error.message}`
    );
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình cập nhật mật khẩu: ${error.message}`,
    });
  }
}

const googleAuth = async (req, res) => {
  const { isRemember, ipAddress, deviceInfo, loggedAt } = req.query;

  req.session.isRemember = isRemember;
  req.session.ipAddress = ipAddress;
  req.session.deviceInfo = JSON.parse(deviceInfo);
  req.session.loggedAt = loggedAt;

  passport.authenticate("google", { scope: ["profile", "email"] })(req, res);
};

const facebookAuth = async (req, res, next) => {
  const { isRemember, ipAddress, deviceInfo, loggedAt } = req.query;

  req.session.isRemember = isRemember;
  req.session.ipAddress = ipAddress;
  req.session.deviceInfo = JSON.parse(deviceInfo);
  req.session.loggedAt = loggedAt;

  passport.authenticate("facebook", { scope: ["email"] })(req, res, next);
};

const googleAuthCallback = async (req, res) => {
  const accessToken = jwt.sign(
    { secret: process.env.SECRET_KEY },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );

  passport.authenticate("google", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=false&message=Đăng nhập bằng Google thất bại: ${err}&accessToken=${accessToken}`
      );
    }

    try {
      // Cập nhật isRemember và lưu lịch sử đăng nhập
      const userUpdateRemember = await User.findByIdAndUpdate(
        user._id,
        {
          isRemember: req.session.isRemember,
          $push: {
            loginHistory: {
              ipAddress: req.session.ipAddress,
              device: req.session.deviceInfo,
              loggedAt: req.session.loggedAt,
            },
          },
          lastActiveAt: Date.now(),
          isActive: true,
        },
        { new: true }
      );

      if (!userUpdateRemember) {
        return res.redirect(
          `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=false&message=Không tìm thấy người dùng để cập nhật&accessToken=${accessToken}`
        );
      }

      const payload = { userId: user._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      return res.redirect(
        `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=true&message=Đăng nhập thành công&data=${token}&accessToken=${accessToken}`
      );
    } catch (error) {
      console.error("Lỗi khi tạo JWT token:", error);
      return res.redirect(
        `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=false&message=Xảy ra lỗi server khi tạo token&accessToken=${accessToken}`
      );
    }
  })(req, res);
};

const facebookAuthCallback = async (req, res) => {
  const accessToken = jwt.sign(
    { secret: process.env.SECRET_KEY },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );

  passport.authenticate("facebook", { session: false }, async (err, user) => {
    if (err || !user) {
      return res.redirect(
        `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=false&message=Đăng nhập bằng Facebook thất bại: ${err}&accessToken=${accessToken}`
      );
    }

    try {
      // Cập nhật isRemember và lưu lịch sử đăng nhập
      const userUpdateRemember = await User.findByIdAndUpdate(
        user._id,
        {
          isRemember: req.session.isRemember,
          $push: {
            loginHistory: {
              ipAddress: req.session.ipAddress,
              device: req.session.deviceInfo,
              loggedAt: req.session.loggedAt,
            },
          },
          lastActiveAt: Date.now(),
          isActive: true,
        },
        { new: true }
      );

      if (!userUpdateRemember) {
        return res.redirect(
          `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=false&message=Không tìm thấy người dùng để cập nhật&accessToken=${accessToken}`
        );
      }

      const payload = { userId: user._id };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });

      return res.redirect(
        `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=true&message=Đăng nhập thành công&data=${token}&accessToken=${accessToken}`
      );
    } catch (error) {
      console.error("Lỗi khi tạo JWT token:", error);
      return res.redirect(
        `${process.env.CLIENT_URL}/handleLoginWithFacebookAndGoogle?success=false&message=Xảy ra lỗi server khi tạo token&accessToken=${accessToken}`
      );
    }
  })(req, res);
};

const logoutUser = async (req, res) => {
  try {
    const { userId } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        lastActiveAt: Date.now(),
        isActive: false,
        inCall: false,
        callWith: null,
      },
      { new: true }
    );

    return res.json({
      success: true,
      status: 200,
      message: "Thông tin người dùng được cập nhật. Đăng xuất thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.json({
      success: false,
      status: 500,
      message: `Đã xảy ra lỗi server khi đăng xuất, vui lòng thử lại sau: ${error.message}`,
    });
  }
};

module.exports = {
  validateToken,
  register,
  login,
  fetchSendVerificationEmail,
  confirmEmail,
  fetchSendPasswordResetEmail,
  updatePassword,
  googleAuth,
  facebookAuth,
  googleAuthCallback,
  facebookAuthCallback,
  logoutUser,
};
