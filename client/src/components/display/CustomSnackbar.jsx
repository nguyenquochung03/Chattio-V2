import React, { useState, useEffect } from "react";
import { Snackbar, Alert, Slide, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

function TransitionUp(props) {
  return <Slide {...props} direction="up" />;
}

const CustomSnackbar = ({
  open,
  message,
  severity = "info",
  onClose,
  autoHideDuration = 3000,
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 472);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 472);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const anchorOrigin = isMobile
    ? { vertical: "bottom", horizontal: "center" }
    : { vertical: "bottom", horizontal: "left" };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      TransitionComponent={TransitionUp}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          backgroundColor:
            severity === "error"
              ? "error.light"
              : severity === "info"
              ? "info"
              : "success.light",
          color: "white",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          fontSize: "16px",
          borderRadius: "12px", // Thêm góc bo mềm mại
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.2)", // Đổ bóng nhẹ
          fontWeight: 500,
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
