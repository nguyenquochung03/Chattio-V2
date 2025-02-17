import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HomeIcon from "@mui/icons-material/Home";

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/");
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
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          flexDirection: "column",
          "@media (max-width: 500px)": {
            padding: "30px",
          },
        }}
      >
        <ErrorOutlineIcon
          sx={{
            fontSize: "120px",
            color: "#ff6b6b",
            marginBottom: "20px",
          }}
        />
        <Typography
          variant="h4"
          color="primary"
          fontWeight="bold"
          sx={{ marginBottom: "10px", fontSize: "24px" }}
        >
          404 - Trang không tìm thấy
        </Typography>
        <Typography
          variant="body1"
          color="textSecondary"
          sx={{
            marginBottom: "20px",
            fontSize: "16px",
            maxWidth: "600px",
            marginX: "auto",
          }}
        >
          Trang bạn yêu cầu không tồn tại. Vui lòng quay lại trang chủ để tiếp
          tục duyệt.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleGoHome}
          sx={{
            paddingX: 5,
            paddingY: 2,
            borderRadius: 25,
            textTransform: "none",
            boxShadow: 3,
            display: "flex",
            alignItems: "center",
            "&:hover": {
              backgroundColor: "#1976d2",
              boxShadow: 6,
            },
          }}
          startIcon={<HomeIcon />}
        >
          Quay lại trang chủ
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundPage;
