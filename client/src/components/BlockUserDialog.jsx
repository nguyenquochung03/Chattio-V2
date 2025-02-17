import React from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { useFriend } from "../contexts/FriendContext";
import { useHome } from "../contexts/HomeContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useSocket } from "../contexts/SocketContext";

const BlockUserDialog = ({ open, onClose }) => {
  const friendContext = useFriend();
  const { userToChat, setCheckBlocked, setIsShowChatInfo } = useHome();
  const clientInfo = useClientInfo();
  const socket = useSocket();

  const handleBlockUser = async () => {
    const result = await friendContext.fetchUpdateFriendStatus("blocked");

    if (result.success) {
      socket.emit("block-friend", {
        userId1: clientInfo.user._id,
        userId2: userToChat._id,
      });
      // Lấy thông tin quan hệ bạn bè
      const fetchCheckBlocked = await friendContext.fetchCheckBlock(
        clientInfo.user._id,
        userToChat._id
      );

      if (fetchCheckBlocked.success) {
        setIsShowChatInfo(false);
        setCheckBlocked(fetchCheckBlocked.data);
      }
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",
            position: "relative",
            textAlign: "center",
            fontSize: "18px",
          }}
        >
          Chặn {userToChat.username}?
        </Typography>
        <IconButton
          onClick={onClose}
          sx={{
            color: "#e6e8eb",
            "&:hover": { color: "#000" },
            p: 0.5,
            position: "absolute",
            right: 16,
            top: 16,
          }}
        >
          <Close
            sx={{
              color: "#333",
              bgcolor: "#f5f6f7",
              borderRadius: "50%",
              p: 0.5,
            }}
            fontSize="small"
          />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="textSecondary">
          Bạn sẽ không nhận được tin nhắn hay cuộc gọi của họ trên Chattio.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ display: "flex" }}>
        <Button
          onClick={onClose}
          color="black"
          sx={{
            flex: 1,
            borderRadius: 2,
            marginRight: 0.5,
            textTransform: "none",
            backgroundColor: "#ededed",
            "&:hover": {
              backgroundColor: "#e6e7e8",
            },
          }}
        >
          Hủy
        </Button>

        <Button
          color="primary"
          variant="contained"
          sx={{
            flex: 1,
            borderRadius: 2,
            marginLeft: 0.5,
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#1976d2",
            },
          }}
          onClick={() => handleBlockUser()}
        >
          Chặn
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlockUserDialog;
