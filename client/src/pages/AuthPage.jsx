import React, { useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Google,
  Facebook,
  Close,
  Send,
} from "@mui/icons-material";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  // Quản lý tab
  const [activeTab, setActiveTab] = useState(0);
  // Hiển thị hoặc ẩn mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Thông tin tài khoản trang đăng ký
  const [emailRegister, setEmailRegister] = useState("");
  const [usernameRegister, setUsernameRegister] = useState("");
  const [passwordRegister, setPasswordRegister] = useState("");
  const [confirmPasswordRegister, setConfirmPasswordRegister] = useState("");
  // Thông tin tài khoản trang đăng nhập
  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  // Thông tin email của dialog quên mật khẩu
  const [emailForgot, setEmailForgot] = useState("");
  // Hiển thị lỗi khi gửi email để lấy lại mật khẩu
  const [emailForgotError, setEmailForgotError] = useState("");
  // Hiển thị lỗi khi gửi thông tin trang đăng ký
  const [emailRegisterError, setEmailRegisterError] = useState("");
  const [nameRegisterError, setNameRegisterError] = useState("");
  const [passwordRegisterError, setPasswordRegisterError] = useState("");
  const [confirmPasswordRegisterError, setConfirmPasswordRegisterError] =
    useState("");
  // Hiển thị lỗi khi gửi thông tin trang đăng nhập
  const [emailLoginError, setEmailLoginError] = useState("");
  const [passwordLoginError, setPasswordLoginError] = useState("");
  // Ẩn hoặc hiển thị dialog quên mật khẩu
  const [openForgotPassword, setOpenForgotPassword] = useState(false);
  // Ghi nhớ đăng nhập
  const [rememberMe, setRememberMe] = useState(false);
  // Sử dụng context để fetch API
  const userContext = useUser();
  // Sử dụng hook
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleCheckboxChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const handleRegister = async () => {
    setEmailRegisterError("");
    setNameRegisterError("");
    setPasswordRegisterError("");
    setConfirmPasswordRegisterError("");
    let isValid = true;

    // Kiểm tra email hợp lệ
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailRegister)) {
      setEmailRegisterError("Email không hợp lệ!");
      isValid = false;
    }

    // Kiểm tra tên tài khoản
    if (usernameRegister.length < 3) {
      setNameRegisterError("Tên tài khoản phải có ít nhất 3 ký tự!");
      isValid = false;
    }
    if (usernameRegister.length > 30) {
      setNameRegisterError("Tên tài khoản chỉ có tối đa 30 ký tự!");
      isValid = false;
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu
    let passwordError = "";
    let passwordValid = true;

    const errors = [];

    if (!/[a-z]/.test(passwordRegister)) {
      errors.push("1 chữ thường");
      passwordValid = false;
    }
    if (!/[A-Z]/.test(passwordRegister)) {
      errors.push("1 chữ hoa");
      passwordValid = false;
    }
    if (!/\d/.test(passwordRegister)) {
      errors.push("1 số");
      passwordValid = false;
    }
    if (!/[!@#$%^&*]/.test(passwordRegister)) {
      errors.push("1 ký tự đặc biệt");
      passwordValid = false;
    }

    if (passwordRegister.length < 10) {
      errors.push("ít nhất 10 ký tự");
      passwordValid = false;
    }

    if (!passwordValid) {
      passwordError = `Mật khẩu phải chứa ${errors.join(", ")}!`;
      setPasswordRegisterError(passwordError);
      isValid = false;
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu
    if (passwordRegister !== confirmPasswordRegister) {
      setPasswordRegisterError("Mật khẩu không khớp với mật khẩu nhập lại!");
      setConfirmPasswordRegisterError(
        "Mật khẩu nhập lại không khớp với mật khẩu!"
      );
      isValid = false;
    }

    // Nếu có lỗi, hiển thị lỗi trên các TextField
    if (isValid) {
      const result = await userContext.fetchRegister(
        usernameRegister,
        emailRegister,
        passwordRegister
      );

      if (result) {
        setUsernameRegister("");
        setEmailRegister("");
        setPasswordRegister("");
        setConfirmPasswordRegister("");
      }
    }
  };

  const handleLogin = async () => {
    setEmailLoginError("");
    setPasswordLoginError("");
    let isValid = true;

    if (emailLogin.length === 0) {
      setEmailLoginError("Email không được để trống!");
      isValid = false;
    }

    if (passwordLogin.length === 0) {
      setPasswordLoginError("Mật khẩu không được để trống!");
      isValid = false;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailLogin)) {
      setEmailLoginError("Email không hợp lệ!");
      isValid = false;
    }

    if (isValid) {
      const result = await userContext.fetchLogin(
        emailLogin,
        passwordLogin,
        rememberMe
      );

      if (result) {
        navigate("/verification");
      }
    }
  };

  const handleForgotPassword = async () => {
    setEmailForgotError("");
    let isValid = true;

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(emailForgot)) {
      setEmailForgotError("Email không hợp lệ!");
      isValid = false;
    }

    if (isValid) {
      const result = await userContext.fetchSendPasswordResetEmail(emailForgot);
      if (result) setEmailForgot("");
    }
  };

  const handleGoogleLogin = async (isRegister) => {
    if (isRegister) {
      await userContext.fetchGoogleLogin(true);
    } else {
      await userContext.fetchGoogleLogin(rememberMe);
    }
  };

  const handleFacebookLogin = async (isRegister) => {
    if (isRegister) {
      await userContext.fetchFacebookLogin(true);
    } else {
      await userContext.fetchFacebookLogin(rememberMe);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f0f4f8",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "450px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
          "@media (max-width: 472px)": {
            margin: "20px",
          },
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          indicatorColor="primary"
          textColor="primary"
          sx={{
            "& .MuiTab-root": {
              fontSize: "16px",
              fontWeight: 500,
              textTransform: "none",
            },
            "@media (max-width: 600px)": {
              fontSize: "14px",
            },
          }}
        >
          <Tab label="Đăng nhập" />
          <Tab label="Đăng ký" />
        </Tabs>

        {/* Hiển thị tab danh cho việc Đăng nhập */}

        <Box sx={{ padding: "30px" }}>
          {activeTab === 0 ? (
            <Box component="form">
              <Typography
                variant="h5"
                align="center"
                color="primary"
                sx={{
                  textTransform: "capitalize",
                  fontWeight: 500,
                  letterSpacing: "0.2px",
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                Chào mừng bạn quay lại với <b>Chattio</b>
              </Typography>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                error={!!emailLoginError}
                helperText={emailLoginError}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  marginBottom: "16px",
                }}
                required
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                variant="outlined"
                margin="normal"
                type={showPassword ? "text" : "password"}
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                error={!!passwordLoginError}
                helperText={passwordLoginError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  marginBottom: "16px",
                }}
                required
              />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 1,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={rememberMe}
                      onChange={handleCheckboxChange}
                    />
                  }
                  label="Ghi nhớ tôi"
                />
                <Typography
                  variant="body1"
                  color="primary"
                  sx={{
                    cursor: "pointer",
                    "&:hover": { textDecoration: "underline" },
                  }}
                  onClick={() => setOpenForgotPassword(true)}
                >
                  Quên mật khẩu?
                </Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  marginTop: 2,
                  borderRadius: "8px",
                  padding: "10px 0",
                  fontSize: "16px",
                  textTransform: "none",
                }}
                onClick={handleLogin}
              >
                Đăng nhập
              </Button>
              <Divider sx={{ margin: "20px 0" }}>HOẶC</Divider>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexDirection: "column",
                  "@media (min-width: 500px)": {
                    flexDirection: "row",
                  },
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                  onClick={() => handleGoogleLogin(false)}
                >
                  Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Facebook />}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#1877f2",
                    color: "white",
                    "&:hover": { backgroundColor: "#145dbb" },
                    marginBottom: "8px",
                  }}
                  onClick={() => handleFacebookLogin(false)}
                >
                  Facebook
                </Button>
              </Box>
            </Box>
          ) : (
            // {/* Hiển thị tab danh cho việc Đăng ký */}

            <Box component="form">
              <Typography
                variant="h5"
                gutterBottom
                align="center"
                color="primary"
                sx={{
                  textTransform: "capitalize",
                  fontWeight: 500,
                  letterSpacing: "0.2px",
                  fontFamily: "'Roboto', sans-serif",
                }}
              >
                Tham gia <b>Chattio</b> ngay hôm nay
              </Typography>
              <TextField
                fullWidth
                label="Tên người dùng"
                variant="outlined"
                margin="normal"
                value={usernameRegister}
                onChange={(e) => setUsernameRegister(e.target.value)}
                error={!!nameRegisterError}
                helperText={nameRegisterError}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                required
              />
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                margin="normal"
                value={emailRegister}
                onChange={(e) => setEmailRegister(e.target.value)}
                error={!!emailRegisterError}
                helperText={emailRegisterError}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                required
              />
              <TextField
                fullWidth
                label="Mật khẩu"
                variant="outlined"
                margin="normal"
                type={showPassword ? "text" : "password"}
                value={passwordRegister}
                onChange={(e) => setPasswordRegister(e.target.value)}
                error={!!passwordRegisterError}
                helperText={passwordRegisterError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  marginBottom: "16px",
                }}
                required
              />
              <TextField
                fullWidth
                label="Nhập lại mật khẩu"
                variant="outlined"
                margin="normal"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPasswordRegister}
                onChange={(e) => setConfirmPasswordRegister(e.target.value)}
                error={!!confirmPasswordRegisterError}
                helperText={confirmPasswordRegisterError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={toggleConfirmPasswordVisibility}>
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "8px" },
                  marginBottom: "16px",
                }}
                required
              />
              <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  marginTop: 2,
                  borderRadius: "8px",
                  padding: "10px 0",
                  fontSize: "16px",
                  textTransform: "none",
                }}
                onClick={handleRegister}
              >
                Đăng ký
              </Button>
              <Divider sx={{ margin: "20px 0" }}>HOẶC</Divider>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexDirection: "column",
                  "@media (min-width: 500px)": {
                    flexDirection: "row",
                  },
                }}
              >
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Google />}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                  onClick={() => handleGoogleLogin(true)}
                >
                  Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Facebook />}
                  sx={{
                    textTransform: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: "#1877f2",
                    color: "white",
                    "&:hover": { backgroundColor: "#145dbb" },
                    marginBottom: "8px",
                  }}
                  onClick={() => handleFacebookLogin(true)}
                >
                  Facebook
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Dialog hiển thị Forgot Password */}
      <Dialog
        open={openForgotPassword}
        onClose={() => setOpenForgotPassword(false)}
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
            padding: "24px",
            minWidth: "400px",
            boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.1)",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "16px",
          }}
        >
          <Typography variant="h6" sx={{ color: "#1976d2", fontWeight: "500" }}>
            Quên mật khẩu
          </Typography>
          <IconButton
            onClick={() => setOpenForgotPassword(false)}
            edge="end"
            sx={{ color: "#1976d2" }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nhập email của bạn"
            variant="outlined"
            margin="normal"
            value={emailForgot}
            onChange={(e) => setEmailForgot(e.target.value)}
            error={!!emailForgotError}
            helperText={emailForgotError}
            sx={{
              marginBottom: "16px",
            }}
          />
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "center",
            padding: "16px 24px",
          }}
        >
          <Button
            onClick={handleForgotPassword}
            color="primary"
            variant="contained"
            sx={{
              borderRadius: "8px",
              padding: "10px 20px",
              textTransform: "none",
              fontSize: "14px",
              fontWeight: "500",
              "&:hover": {
                backgroundColor: "#1565c0",
              },
            }}
            fullWidth
            endIcon={<Send />}
          >
            Gửi
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AuthPage;
