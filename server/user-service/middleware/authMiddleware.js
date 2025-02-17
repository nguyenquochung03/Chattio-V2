const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return {
      success: true,
      message: "Giải mã token thành công",
      data: decoded.userId,
    };
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Token đã hết hạn"
        : "Token không hợp lệ";
    return { success: false, message: message };
  }
};

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({
        success: false,
        status: 401,
        message: "Vui lòng đăng nhập",
      });
    }

    const token = authHeader.replace(/Bearer\s+/gi, "").split(" ")[0];
    const verify = verifyToken(token);

    if (!verify.success) {
      return res.json({
        success: false,
        status: 401,
        message: verify.message,
      });
    }

    const user = await User.findById(verify.data);
    if (!user) {
      return res.json({
        success: false,
        status: 404,
        message: "Người dùng không tồn tại",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Lỗi server trong quá trình xác thực:", error.message);
    return res.json({
      success: false,
      status: 500,
      message: `Lỗi server trong quá trình xác thực: ${error.message}`,
    });
  }
};

module.exports = { authMiddleware, verifyToken };
