const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateRandomNumber } = require("./randomUtils");

const sendVerificationEmail = async (userEmail) => {
  try {
    const verificationCode = generateRandomNumber();

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: `Không tìm thấy người dùng có email là ${userEmail}`,
      };
    }

    const token = jwt.sign({ verificationCode }, process.env.JWT_SECRET, {
      expiresIn: "1m",
    });

    user.twoFactorSecret = token;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "Xác nhận tài khoản của bạn",
      html: `
    <html>
      <body style="font-family: Arial, sans-serif; color: #1976d2;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f0f4f8; border-radius: 10px;">
          <h2 style="text-align: center; color: #1976d2;">Xác nhận tài khoản của bạn</h2>
          <p style="font-size: 16px; line-height: 1.6;">Xin chào,</p>
          <p style="font-size: 16px; line-height: 1.6;">
            Mã xác nhận của bạn là: 
            <strong style="font-size: 18px; color: #1976d2;">${verificationCode}</strong>
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Vui lòng nhập mã này để xác nhận tài khoản của bạn. Nếu bạn không yêu cầu mã xác nhận này, vui lòng bỏ qua email này.
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 14px; color: #888;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>
          </div>
        </div>
      </body>
    </html>
  `,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return {
          success: false,
          message: `Xảy ra lỗi trong quá trình gửi mã xác nhận đến ${userEmail}: ${error}`,
        };
      } else {
        console.log("Email đã được gửi: " + info.response);
      }
    });

    return {
      success: true,
      message: `Gửi mã xác nhận đến ${userEmail} thành công`,
    };
  } catch (error) {
    console.error(
      `Xảy ra lỗi trong quá trình gửi mã xác nhận đến ${userEmail}:`,
      error
    );
    return {
      success: false,
      message: `Xảy ra lỗi trong quá trình gửi mã xác nhận đến ${userEmail}: ${error}`,
    };
  }
};

const verifyUser = async (userEmail, code) => {
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return {
        success: false,
        message: `Không tìm thấy người dùng có email là ${userEmail}`,
      };
    }

    if (!user.twoFactorSecret) {
      return { success: false, message: "Người dùng không có mã xác nhận" };
    }

    const decoded = jwt.verify(user.twoFactorSecret, process.env.JWT_SECRET);

    if (decoded.exp < Date.now() / 1000) {
      return {
        success: false,
        message: "Mã xác nhận đã hết hạn",
      };
    }

    if (decoded.verificationCode === code) {
      user.twoFactorSecret = "";
      await user.save();

      return { success: true, message: "Mã xác nhận hợp lệ", data: user };
    } else {
      return { success: false, message: "Mã xác nhận không đúng" };
    }
  } catch (error) {
    console.error(`Xảy ra lỗi trong quá trình xác nhận:`, error);
    return {
      success: false,
      message: `Xảy ra lỗi trong quá trình xác nhận: ${error}`,
    };
  }
};

async function sendPasswordResetEmail(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return {
        success: false,
        message: `Không tìm thấy người dùng với email ${email}`,
      };
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    // Tạo URL đổi mật khẩu
    const resetUrl = `${process.env.CLIENT_URL}/passwordReset?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      service: process.env.SERVICE,
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Yêu cầu đổi mật khẩu",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2c3e50;">Xin chào ${user.username},</h2>
          <p>Bạn đã yêu cầu đổi mật khẩu cho tài khoản của mình. Vui lòng nhấp vào nút bên dưới để tiến hành đổi mật khẩu:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Đổi mật khẩu
            </a>
          </div>
          <p style="margin-top: 20px;">Nếu nút trên không hoạt động, bạn có thể sao chép và dán liên kết sau vào trình duyệt:</p>
          <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; color: #555; word-break: break-all;">
            ${resetUrl}
          </p>
          <p style="margin-top: 20px;">Liên kết này sẽ hết hạn sau <strong>10 phút</strong>.</p>
          <p>Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn sẽ không bị thay đổi.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #777;">Đây là email tự động, vui lòng không trả lời email này.</p>
        </div>
      `,
    };

    // Gửi email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        return {
          success: false,
          message: `Xảy ra lỗi trong quá trình gửi link đổi mật khẩu đến ${email}: ${error}`,
        };
      } else {
        console.log("Email đã được gửi: " + info.response);
      }
    });

    return {
      success: true,
      message: `Đã gửi một link đổi mật khẩu đến ${email}`,
    };
  } catch (error) {
    console.error(
      `Xảy ra lỗi trong quá trình gửi link đổi mật khẩu đến ${userEmail}:`,
      error
    );
    return {
      success: false,
      message: `Xảy ra lỗi trong quá trình gửi link đổi mật khẩu đến ${userEmail}: ${error}`,
    };
  }
}

module.exports = { sendVerificationEmail, verifyUser, sendPasswordResetEmail };
