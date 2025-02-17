import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { useUser } from "../contexts/UserContext";

const ChangePassword = () => {
  // Thông tin mật khẩu cần cập nhật
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Lỗi khi thực hiện gửi thông tin mật khẩu mới
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  // Ẩn hoặc hiển thông tin mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Kiểm tra token có hợp lệ không để tiến hành đổi mật khẩu
  const [isValidToken, setIsValidToken] = useState(false);
  // Mã người dùng cần đổi mật khẩu
  const [userId, setUserId] = useState("");
  // Sử dụng hook
  const navigate = useNavigate();
  const location = useLocation();
  const userContext = useUser();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get("token");

    if (token) {
      validateToken(token);
    }
  }, [location]);

  const validateToken = async (token) => {
    const result = await userContext.fetchValidateToken(token);

    setIsValidToken(result.success);

    if (result.success) {
      setUserId(result.data);
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setConfirmPasswordError("");
    let isValid = true;

    // Kiểm tra mật khẩu và xác nhận mật khẩu
    let passwordError = "";
    let passwordValid = true;

    const errors = [];

    if (!/[a-z]/.test(password)) {
      errors.push("1 chữ thường");
      passwordValid = false;
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("1 chữ hoa");
      passwordValid = false;
    }
    if (!/\d/.test(password)) {
      errors.push("1 số");
      passwordValid = false;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("1 ký tự đặc biệt");
      passwordValid = false;
    }

    if (password.length < 10) {
      errors.push("ít nhất 10 ký tự");
      passwordValid = false;
    }

    if (!passwordValid) {
      passwordError = `Mật khẩu phải chứa ${errors.join(", ")}!`;
      setPasswordError(passwordError);
      isValid = false;
    }

    // Kiểm tra mật khẩu và xác nhận mật khẩu
    if (password !== confirmPassword) {
      setPasswordError("Mật khẩu không khớp với mật khẩu nhập lại!");
      setConfirmPasswordError("Mật khẩu nhập lại không khớp với mật khẩu!");
      isValid = false;
    }

    if (isValid && userId.length > 0) {
      const result = await userContext.fetchUpdatePassword(userId, password);
      if (result) {
        setPassword("");
        setConfirmPassword("");
      }
    }
  };

  if (!isValidToken) {
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
        <Typography variant="h6" color="error">
          Token không hợp lệ hoặc đã hết hạn.
        </Typography>
      </Box>
    );
  }

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
        <Card sx={{ width: "100%", boxShadow: 3 }}>
          <CardContent>
            <Typography
              variant="h4"
              gutterBottom
              color="primary.dark"
              sx={{ textAlign: "center", letterSpacing: "0.5px" }}
            >
              Đổi Mật Khẩu
            </Typography>

            <form onSubmit={handleSubmit} noValidate>
              <TextField
                label="Mật khẩu mới"
                variant="outlined"
                type={showPassword ? "text" : "password"}
                fullWidth
                required
                value={password}
                onChange={handlePasswordChange}
                error={!!passwordError}
                helperText={passwordError}
                sx={{
                  mb: 2,
                  bgcolor: "#f5f5f5",
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                }}
                InputProps={{
                  endAdornment: (
                    <Button
                      sx={{ p: 0 }}
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ color: "#888" }} />
                      ) : (
                        <Visibility sx={{ color: "#888" }} />
                      )}
                    </Button>
                  ),
                }}
              />
              <TextField
                label="Xác nhận mật khẩu"
                variant="outlined"
                type={showConfirmPassword ? "text" : "password"}
                fullWidth
                required
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
                sx={{
                  mb: 2,
                  bgcolor: "#f5f5f5",
                  "& .MuiOutlinedInput-root": { borderRadius: 3 },
                }}
                InputProps={{
                  endAdornment: (
                    <Button
                      sx={{ p: 0 }}
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? (
                        <VisibilityOff sx={{ color: "#888" }} />
                      ) : (
                        <Visibility sx={{ color: "#888" }} />
                      )}
                    </Button>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                color="primary"
                sx={{ mt: 2, letterSpacing: "0.5px" }}
                startIcon={<Lock />}
              >
                Đổi Mật Khẩu
              </Button>
            </form>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ChangePassword;
