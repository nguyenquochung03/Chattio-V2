const express = require("express");
const authRouter = express.Router();
const passport = require("passport");
const {
  register,
  login,
  fetchSendVerificationEmail,
  confirmEmail,
  updatePassword,
  validateToken,
  fetchSendPasswordResetEmail,
  googleAuth,
  googleAuthCallback,
  facebookAuth,
  facebookAuthCallback,
  logoutUser,
} = require("../controllers/authController.js");
const { body } = require("express-validator");

authRouter.get("/validateToken", validateToken);

authRouter.post(
  "/register",
  [
    body("email").isEmail().withMessage("Email không hợp lệ"),
    body("password")
      .isLength({ min: 10 })
      .withMessage(
        "Mật khẩu phải có ít nhất 10 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      )
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/
      )
      .withMessage(
        "Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      ),
    body("username")
      .isLength({ min: 3 })
      .withMessage("Tên người dùng phải có ít nhất 3 ký tự")
      .isLength({ max: 30 })
      .withMessage("Tên tài khoản không thể dài quá 30 ký tự"),
  ],
  register
);

authRouter.post(
  "/login",
  [body("email").isEmail().withMessage("Email không hợp lệ")],
  login
);

authRouter.post("/sendVerificationEmail", fetchSendVerificationEmail);

authRouter.post("/confirmEmail", confirmEmail);

authRouter.post("/sendPasswordResetEmail", fetchSendPasswordResetEmail);

authRouter.put(
  "/updatePassword/:userId",
  [
    body("password")
      .isLength({ min: 10 })
      .withMessage(
        "Mật khẩu phải có ít nhất 10 ký tự và bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      )
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/
      )
      .withMessage(
        "Mật khẩu phải bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
      ),
  ],
  updatePassword
);

authRouter.get("/google", googleAuth);

authRouter.get("/facebook", facebookAuth);

authRouter.get("/google/callback", googleAuthCallback);

authRouter.get("/facebook/callback", facebookAuthCallback);

authRouter.post("/logout", logoutUser);

module.exports = authRouter;
