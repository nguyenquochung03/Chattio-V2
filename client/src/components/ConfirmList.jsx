import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import { CheckCircle, CheckCircleOutline, Close } from "@mui/icons-material";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useUser } from "../contexts/UserContext";
import { useFriend } from "../contexts/FriendContext";
import { useLoading } from "../contexts/LoadingContext";
import { useHome } from "../contexts/HomeContext";

const ConfirmList = () => {
  const [openDialog, setOpenDialog] = useState(false);

  // Sử dụng hook/context
  const {
    acceptedConfirms,
    setAcceptedConfirms,
    acceptedConfirmsPage,
    setAcceptedConfirmsPage,
  } = useHome();

  const boxAcceptedRef = useRef(null);
  const clientInfo = useClientInfo();
  const userContext = useUser();
  const friendContext = useFriend();
  const { isLoading } = useLoading();

  // Hiển thị tối đa 2 người dùng
  const displayedConfirms = acceptedConfirms.slice(0, 2);

  // Còn dữ liệu để tải hay không
  const [hasMoreAccepted, setHasMoreAccepted] = useState(true);

  useEffect(() => {
    if (boxAcceptedRef.current) {
      const boxAcceptedElement = boxAcceptedRef.current;

      boxAcceptedElement.addEventListener("scroll", boxAcceptedElement);

      return () => {
        boxAcceptedElement.removeEventListener(
          "scroll",
          handleAcceptedRequestScroll
        );
      };
    }
  }, [hasMoreAccepted, isLoading]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    document.getElementById("root").removeAttribute("aria-hidden");
  };

  const loadMoreAcceptedRequests = async () => {
    const result = await friendContext.fetchAcceptedRequests(
      acceptedConfirmsPage
    );

    if (result.success) {
      if (result.data.length < 8) {
        setHasMoreAccepted((prev) => !prev);
      }
      setAcceptedConfirms((prev) => [...prev, ...result.data]);
      setAcceptedConfirmsPage((prev) => prev + 1);
    }
  };

  const handleAcceptedRequestScroll = useCallback(() => {
    if (boxAcceptedRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = boxAcceptedRef.current;

      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        hasMoreAccepted &&
        !isLoading
      ) {
        loadMoreAcceptedRequests();
      }
    }
  }, [hasMoreAccepted, isLoading]);

  const handleConfirmAcceptedRequests = async (userId) => {
    const result = await friendContext.fetchConfirmAcceptedRequest(userId);

    if (result) {
      await fetchAcceptedRequestCount();
      const updatedConfirmAcceptedRequests = acceptedConfirms.filter(
        (request) => request._id !== userId
      );

      setAcceptedConfirms(updatedConfirmAcceptedRequests);
    }
  };

  const fetchAcceptedRequestCount = async () => {
    const result = await friendContext.fetchAcceptedRequestCount();

    if (result.success) {
      clientInfo.setAcceptedRequestCount(result.data);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="body1"
        sx={{
          marginBottom: 1,
          color: "gray",
          display: "flex",
          alignItems: "center",
        }}
      >
        <CheckCircleOutline
          sx={{ fontSize: "1.6rem", marginRight: 1, color: "gray" }}
        />
        Yêu cầu kết bạn đã được chấp nhận
      </Typography>
      {/* Hiển thị tối đa 2 thẻ */}
      {displayedConfirms.map((user, index) => (
        <Card
          key={index}
          sx={{
            display: "flex",
            alignItems: "center",
            padding: "10px",
            boxShadow: 1,
            borderRadius: "10px",
            flexDirection: { xs: "column", sm: "row" },
            textAlign: { xs: "center", sm: "left" },
            mb: 2,
          }}
        >
          {/* Avatar */}
          <Box sx={{ mb: { xs: 1, sm: 0 } }}>{clientInfo.getAvatar(user)}</Box>

          {/* Nội dung */}
          <Box sx={{ flexGrow: 1, ml: { xs: 0, sm: 2 } }}>
            <Typography variant="body2" sx={{ color: "#777" }}>
              Yêu cầu kết bạn của bạn đã được chấp nhận bởi{" "}
              <b>{user.username}</b>
            </Typography>
          </Box>

          {/* Nút Xác Nhận */}
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            sx={{
              textTransform: "none",
              padding: "6px 12px",
              whiteSpace: "nowrap",
              minWidth: "110px",
              alignSelf: { xs: "stretch", sm: "center" },
              mt: { xs: 1 },
              backgroundColor: "#4caf50",
              "&:hover": {
                backgroundColor: "#43a047",
              },
            }}
            onClick={() => handleConfirmAcceptedRequests(user._id)}
          >
            Xác nhận
          </Button>
        </Card>
      ))}

      {/* Nút Xem Thêm */}
      {acceptedConfirms.length > 2 && (
        <Button
          variant="text"
          onClick={handleOpenDialog}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            color: "#1976d2",
            textTransform: "none",
            width: "fit-content",
            marginLeft: "auto",
          }}
        >
          Xem thêm...
        </Button>
      )}

      {/* Dialog Hiển Thị Danh Sách */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            fontWeight: "bold",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          Danh sách đã chấp nhận
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent
          ref={boxAcceptedRef}
          dividers
          sx={{
            backgroundColor: "#fafafa",
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#ccc",
              borderRadius: "6px",
            },
          }}
        >
          {acceptedConfirms.map((user, index) => (
            <Card
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                boxShadow: 1,
                borderRadius: "10px",
                flexDirection: { xs: "column", sm: "row" },
                textAlign: { xs: "center", sm: "left" },
                mb: 1,
                gap: 2,
              }}
            >
              {/* Avatar */}
              {clientInfo.getAvatar(user)}

              {/* Nội dung */}
              <Box
                sx={{
                  flexGrow: 1,
                  textAlign: { xs: "center", sm: "left" },
                }}
              >
                <Typography variant="body2" sx={{ color: "#777" }}>
                  Yêu cầu kết bạn của bạn đã được chấp nhận bởi{" "}
                  <b>{user.username}</b>
                </Typography>
              </Box>

              {/* Nút Xác Nhận */}
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                sx={{
                  textTransform: "none",
                  padding: "6px 12px",
                  whiteSpace: "nowrap",
                  minWidth: "110px",
                  alignSelf: { xs: "stretch", sm: "center" },
                  backgroundColor: "#4caf50",
                  "&:hover": {
                    backgroundColor: "#43a047",
                  },
                }}
                onClick={() => handleConfirmAcceptedRequests(user._id)}
              >
                Xác nhận
              </Button>
            </Card>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ConfirmList;
