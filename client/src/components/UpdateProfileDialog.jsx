import React, { useState } from "react";
import { useHome } from "../contexts/HomeContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useUser } from "../contexts/UserContext";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Avatar,
  TextField,
  Box,
  styled,
} from "@mui/material";
import { useSnackbar } from "../contexts/SnackbarContext";
import { PhotoCamera } from "@mui/icons-material";
import { useChat } from "../contexts/ChatContext";

const Input = styled("input")({
  display: "none",
});

const UpdateProfileDialog = () => {
  const { isOpenChangeAvatarDialog, setIsOpenChangeAvatarDialog } = useHome();
  const clientInfo = useClientInfo();
  const userContext = useUser();
  const chatContext = useChat();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(clientInfo?.user?.avatar || "");
  const [name, setName] = useState(clientInfo?.user?.name || "");
  const { showSnackbar } = useSnackbar();

  const handleCloseUpdateProfileDialog = () => {
    setIsOpenChangeAvatarDialog(false);
    document.getElementById("root").removeAttribute("aria-hidden");
    setSelectedFile(null);
    setPreviewURL(clientInfo.user?.avatar || "");
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setPreviewURL(URL.createObjectURL(file));
      } else {
        setSelectedFile(null);
        setPreviewURL(clientInfo.user?.avatar || "");
        showSnackbar("Ảnh đại diện phải là một Image", "warning");
      }
    }
    event.target.value = null;
  };

  const handleSave = async () => {
    if (selectedFile) {
      const response = await chatContext.fetchUploadFile(selectedFile);

      if (response.success) {
        const updateAvatar = await userContext.fetchUpdateAvatar(response.data);

        if (updateAvatar.success) {
          clientInfo.setUser((prevUser) => ({
            ...prevUser,
            avatar: response.data,
          }));
        }
      }
    }
    handleCloseUpdateProfileDialog();
  };

  return (
    <Dialog
      open={isOpenChangeAvatarDialog}
      onClose={handleCloseUpdateProfileDialog}
      aria-labelledby="update-profile-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#f5f9ff",
          borderRadius: "12px",
          padding: "24px",
          width: "400px",
        },
      }}
    >
      <DialogTitle
        id="update-profile-dialog-title"
        sx={{
          color: "#1976d2",
          textAlign: "center",
          fontSize: "1.5rem",
          fontWeight: "bold",
          fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
        }}
      >
        {selectedFile
          ? "Cập nhật ảnh đại diện"
          : "Chọn ảnh đại diện mới để cập nhật"}
      </DialogTitle>
      <DialogContent
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
        }}
      >
        <Avatar
          src={previewURL}
          alt="Avatar"
          sx={{
            width: 120,
            height: 120,
            mb: 2,
            border: "3px solid #1976d2",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        />
        <label htmlFor="contained-button-file">
          <Input
            accept="image/*"
            id="contained-button-file"
            multiple={false}
            type="file"
            onChange={handleFileInputChange}
          />
          <IconButton
            component="span"
            color="primary"
            aria-label="upload picture"
            sx={{
              backgroundColor: "#e3f2fd",
              padding: "10px",
              "&:hover": { backgroundColor: "#d1e9fc" },
            }}
          >
            <PhotoCamera />
          </IconButton>
        </label>
        <Box
          sx={{
            fontSize: "0.9rem",
            color: "#616161",
            mt: 2,
            fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
          }}
        >
          {selectedFile
            ? "Bạn đã chọn ảnh, nhấn 'Lưu' để cập nhật."
            : "Nhấn vào biểu tượng máy ảnh để chọn ảnh."}
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          justifyContent: "center",
          paddingTop: "16px",
          backgroundColor: "#e3f2fd",
          borderTop: "1px solid #bbdefb",
        }}
      >
        <Button
          onClick={handleCloseUpdateProfileDialog}
          variant="outlined"
          color="primary"
          sx={{
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "0.875rem",
          }}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          sx={{
            marginLeft: "12px",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "0.875rem",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
          }}
        >
          Lưu
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateProfileDialog;
