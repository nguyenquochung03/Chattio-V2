import React, { useState, useEffect } from "react";
import { TextField, Button, Typography, Box, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import CancelIcon from "@mui/icons-material/Cancel";
import { useUser } from "../contexts/UserContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useNavigate } from "react-router-dom";

const TwoStepVerification = () => {
  // Thông tin mã xác nhận
  const [verificationCode, setVerificationCode] = useState("");
  // Hiển thị lỗi của mã xác nhận
  const [verificationCodeError, setVerificationCodeError] = useState("");
  const [message, setMessage] = useState("");
  // Đếm ngược thời gian hết hạn của mã xác nhận
  const [countdown, setCountdown] = useState(60);
  // Sử dụng hook
  const navigate = useNavigate();
  const userContext = useUser();
  const clientInfo = useClientInfo();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      setMessage("Mã xác minh đã hết hạn, vui lòng nhấn gửi lại mã!");
    } else {
      setMessage("");
    }
  }, [countdown]);

  const handleVerify = async () => {
    setVerificationCodeError("");

    if (verificationCode.length === 0) {
      setVerificationCodeError("Mã xác nhận không được để trống!");
    } else {
      const result = await userContext.fetchVerifyUser(
        clientInfo.emailLogin,
        verificationCode
      );

      if (result) {
        clientInfo.saveToken(clientInfo.tempToken);
        navigate("/home");
      }
    }
  };

  const handleResendCode = async () => {
    const result = await userContext.fetchSendVerificationEmail(
      clientInfo.emailLogin
    );

    if (result) {
      setCountdown(60);
    }
  };

  const handleCancel = () => {
    navigate("/");
    clientInfo.setEmailLogin("");
    clientInfo.setTempToken("");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f4f6f9",
        padding: 2,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: "450px",
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          padding: 4,
          "@media (max-width: 600px)": {
            padding: 2,
            maxWidth: "90%",
          },
          "@media (max-width: 360px)": {
            padding: 2,
            maxWidth: "100%",
          },
        }}
      >
        <Typography
          variant="h5"
          align="center"
          sx={{
            fontWeight: "bold",
            marginBottom: 2,
            color: "primary.dark",
            fontSize: {
              xs: "1.4rem",
              sm: "1.6rem",
            },
          }}
        >
          Xác minh email
        </Typography>
        <Typography
          variant="body1"
          align="center"
          color="textSecondary"
          sx={{
            marginBottom: 3,
            fontSize: {
              xs: "0.9rem",
              sm: "1rem",
            },
          }}
        >
          Một mã xác minh đã được gửi đến email của bạn:{" "}
          <Typography component="span" color="primary" fontWeight="bold">
            {clientInfo.emailLogin}
          </Typography>
        </Typography>
        <TextField
          fullWidth
          label="Nhập mã xác minh"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          variant="outlined"
          inputProps={{ maxLength: 5 }}
          error={!!verificationCodeError}
          helperText={verificationCodeError}
          sx={{
            marginBottom: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
            "& .MuiInputBase-input": {
              fontSize: {
                xs: "0.9rem",
                sm: "1rem",
              },
            },
          }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleVerify}
          startIcon={<CheckCircleIcon />}
          sx={{
            paddingY: 1.5,
            marginBottom: 3,
            fontWeight: "bold",
            textTransform: "capitalize",
            fontSize: {
              xs: "0.9rem",
              sm: "1rem",
            },
          }}
        >
          Xác nhận
        </Button>
        <Divider sx={{ marginY: 2 }} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCancel}
            startIcon={<CancelIcon />}
            sx={{
              color: "error.main",
              borderColor: "error.main",
              textTransform: "capitalize",
              fontSize: {
                xs: "0.8rem",
                sm: "0.9rem",
              },
              flex: 1,
              "&:hover": {
                backgroundColor: "error.light",
                color: "white",
              },
            }}
          >
            Hủy
          </Button>
          <Button
            variant="text"
            onClick={handleResendCode}
            startIcon={<ReplayIcon />}
            sx={{
              color: "primary.main",
              textTransform: "capitalize",
              fontSize: {
                xs: "0.8rem",
                sm: "0.9rem",
              },
              flex: 1,
              "&:hover": {
                color: "primary.dark",
              },
            }}
          >
            Gửi lại mã
          </Button>
        </Box>
        {message.length === 0 && (
          <Typography
            variant="body2"
            align="center"
            color="textSecondary"
            sx={{
              marginTop: 2,
              fontSize: {
                xs: "0.8rem",
                sm: "0.9rem",
              },
            }}
          >
            Mã sẽ hết hạn sau{" "}
            <Typography component="span" fontWeight="bold" color="primary">
              {countdown} giây
            </Typography>
          </Typography>
        )}
        {message && (
          <Typography
            variant="body2"
            align="center"
            color="error"
            sx={{
              marginTop: 2,
              fontSize: {
                xs: "0.8rem",
                sm: "0.9rem",
              },
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default TwoStepVerification;
