import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Avatar,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import { Phone, PhoneDisabled } from "@mui/icons-material";
import { useHome } from "../contexts/HomeContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useSocket } from "../contexts/SocketContext";
import { useUser } from "../contexts/UserContext";
import { checkCallVideoStream } from "../utils/CheckStream";
import { usePermissionDialog } from "../contexts/PermissionDialogContext";

const IncomingNormalCallDialog = () => {
  const {
    isShowNormalIncomingCall,
    setIsShowNormalIncomingCall,
    userToCall,
    setUserToCall,
    setCallStatus,
    popupWindow,
    setPopupWindow,
  } = useHome();
  const { open } = usePermissionDialog();
  const clientInfo = useClientInfo();
  const socket = useSocket();
  const userContext = useUser();

  useEffect(() => {
    const fetchFromUser = async () => {
      const from = await userContext.fetchGetUsersById(
        clientInfo.user.callWith
      );
      if (from.success) {
        setUserToCall(from.data);
      }
    };

    if (clientInfo.user.callWith && !userToCall._id) {
      fetchFromUser();
    }
  }, [clientInfo.user]);

  useEffect(() => {
    if (isShowNormalIncomingCall) {
      const timer = setTimeout(() => {
        if (socket) {
          socket.emit("decline-calling", {
            userId: clientInfo.user._id,
            callWithId: userToCall._id,
          });
          setCallStatus("");
          setIsShowNormalIncomingCall(false);
          setUserToCall({});
        }
      }, 60000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isShowNormalIncomingCall, setIsShowNormalIncomingCall]);

  const handleAccept = async () => {
    setIsShowNormalIncomingCall(false);
    const resultCheckVideoCallStream = await checkCallVideoStream();

    if (resultCheckVideoCallStream.status === 400) {
      open();
      if (socket) {
        socket.emit("permission-not-allowed", {
          from: clientInfo.user._id,
          to: userToCall._id,
        });
      }
      return;
    }

    window.open(`${clientInfo.clientUrl}/call`, "mozillaWindow", "popup");
    // Đóng dialog và mở cuộc gọi video
    if (socket) {
      socket.emit("call-accepted", {
        callerId: userToCall._id,
      });
    }
    setIsShowNormalIncomingCall(false);
  };

  const handleDecline = () => {
    // Đóng dialog
    if (socket) {
      socket.emit("decline-calling", {
        userId: clientInfo.user._id,
        callWithId: userToCall._id,
      });
      setCallStatus("");
      setUserToCall({});
      setIsShowNormalIncomingCall(false);
    }
  };

  return (
    <Dialog
      open={isShowNormalIncomingCall}
      onClose={(e, reason) => reason !== "backdropClick" && handleDecline()}
      maxWidth="xs"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          background:
            "linear-gradient(135deg, rgba(0, 0, 255, 0.8) 0%, rgba(0, 0, 255, 0.4) 100%)",
          backdropFilter: "blur(5px)",
          borderRadius: "16px",
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
          padding: "20px",
        },
      }}
    >
      <DialogContent>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          textAlign="center"
        >
          <Avatar
            src={userToCall?.avatar || ""}
            alt={userToCall?.username || "User"}
            sx={{
              width: 120,
              height: 120,
              mb: 3,
              border: "6px solid #2196F3",
              boxShadow: 4,
            }}
          />
          <Typography variant="h4" sx={{ fontWeight: "bold", color: "white" }}>
            {userToCall?.username || "Người dùng"}
          </Typography>
          <Typography variant="h6" sx={{ color: "white", mb: 3 }}>
            Đang gọi...
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center", gap: 4, pb: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <IconButton
            onClick={handleDecline}
            sx={{
              bgcolor: "#f44336",
              color: "white",
              p: 3,
              borderRadius: "50%",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              "&:hover": { bgcolor: "#d32f2f", transform: "translateY(-5px)" },
              transition: "transform 0.3s ease",
            }}
          >
            <PhoneDisabled sx={{ fontSize: 40 }} />
          </IconButton>
          <Typography variant="caption" sx={{ color: "white", mt: 1 }}>
            Từ chối
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" alignItems="center">
          <IconButton
            onClick={handleAccept}
            sx={{
              bgcolor: "#2196F3",
              color: "white",
              p: 3,
              borderRadius: "50%",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
              "&:hover": { bgcolor: "#1976D2", transform: "translateY(-5px)" },
              transition: "transform 0.3s ease",
            }}
          >
            <Phone sx={{ fontSize: 40 }} />
          </IconButton>
          <Typography variant="caption" sx={{ color: "white", mt: 1 }}>
            Chấp nhận
          </Typography>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default IncomingNormalCallDialog;
