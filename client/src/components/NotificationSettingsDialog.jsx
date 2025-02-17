import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import { Close, Notifications, NotificationsOff } from "@mui/icons-material";
import { useChat } from "../contexts/ChatContext";
import { useHome } from "../contexts/HomeContext";

const NotificationSettingsDialog = () => {
  const [open, setOpen] = useState(false);

  // Sử dụng hook
  const {
    conversation,
    isMuteConversation,
    setIsMuteConversation,
    muteNotificationValue,
    setMuteNotificationValue,
  } = useHome();
  const chatContext = useChat();

  const handleOpen = () => {
    setOpen(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };
  const handleClose = () => {
    setOpen(false);
    document.getElementById("root").removeAttribute("aria-hidden");
  };
  const handleChange = (event) => setMuteNotificationValue(event.target.value);

  const handleMute = async () => {
    const result = await chatContext.fetchMuteConversation(
      conversation._id,
      muteNotificationValue
    );

    if (result.success) {
      setIsMuteConversation(true);
    }
    handleClose();
  };

  const handleUnMute = async () => {
    const result = await chatContext.fetchUnMuteConversation(
      conversation._id,
      muteNotificationValue
    );

    if (result.success) {
      setIsMuteConversation(false);
      setMuteNotificationValue(15);
    }
    handleClose();
  };

  return (
    <>
      {isMuteConversation ? (
        <IconButton
          sx={{
            color: "#333",
            bgcolor: "#f2f4f5",
          }}
          onClick={() => handleUnMute()}
        >
          <NotificationsOff fontSize="medium" />
        </IconButton>
      ) : (
        <IconButton
          sx={{
            color: "#333",
            bgcolor: "#f2f4f5",
          }}
          onClick={handleOpen}
        >
          <Notifications fontSize="medium" />
        </IconButton>
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        sx={{ "& .MuiDialog-paper": { borderRadius: 3, maxWidth: 400 } }}
      >
        <DialogTitle
          sx={{
            fontSize: "17px",
            fontWeight: "bold",
            textAlign: "center",
            bgcolor: "#f2f4f5",
            color: "#333",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
          }}
        >
          Tắt thông báo về cuộc trò chuyện
          <IconButton
            onClick={handleClose}
            sx={{
              color: "#666",
              "&:hover": { color: "#000" },
              p: 0.5,
            }}
          >
            <Close
              sx={{
                color: "#333",
                bgcolor: "#e3e2e1",
                borderRadius: "50%",
                p: 0.5,
              }}
              fontSize="small"
            />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <RadioGroup value={muteNotificationValue} onChange={handleChange}>
            {[
              { value: "15", label: "Trong 15 phút" },
              { value: "60", label: "Trong 1 giờ" },
              { value: "480", label: "Trong 8 giờ" },
              { value: "1440", label: "Trong 24 giờ" },
              { value: "indefinite", label: "Đến khi tôi bật lại" },
            ].map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio sx={{ color: "#1976d2" }} />}
                label={option.label}
                sx={{
                  "& .MuiTypography-root": { fontSize: "0.95rem" },
                  "&:hover": { bgcolor: "#f9f9f9", borderRadius: 1 },
                }}
              />
            ))}
          </RadioGroup>

          <Typography
            variant="body2"
            color="text.secondary"
            mt={2}
            sx={{ lineHeight: 1.6 }}
          >
            Cửa sổ chat vẫn đóng và bạn sẽ không nhận được thông báo đẩy trên
            thiết bị.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "flex-end", p: 2 }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            color="primary"
            sx={{
              textTransform: "none",
              fontSize: "0.9rem",
              borderRadius: 2,
              px: 2,
              py: 1,
              "&:hover": { bgcolor: "#c6e2f7" },
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={() => handleMute()}
            color="error"
            variant="contained"
            sx={{
              textTransform: "none",
              fontSize: "0.9rem",
              borderRadius: 2,
              px: 3,
              py: 1,
              ml: 2,
              boxShadow: 2,
              "&:hover": { bgcolor: "#d32f2f" },
            }}
          >
            Tắt thông báo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NotificationSettingsDialog;
