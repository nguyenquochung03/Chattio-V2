import React from "react";
import { Dialog, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GetAppIcon from "@mui/icons-material/GetApp";
import { useHome } from "../contexts/HomeContext";
import { downloadImageFile } from "../utils/File";

export default function ImageViewer() {
  const {
    selectedImage,
    setSelectedImage,
    openImageViewer,
    setOpenImageViewer,
  } = useHome();

  const handleCloseImage = () => {
    setOpenImageViewer(false);
    setSelectedImage("");
    document.getElementById("root").removeAttribute("aria-hidden");
  };

  const handleInstall = () => {
    downloadImageFile(selectedImage);
  };

  return (
    <Dialog
      open={openImageViewer}
      onClose={handleCloseImage}
      PaperProps={{
        sx: {
          backdropFilter: "blur(5px)", // Làm mờ nền phía sau
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Tăng độ tối của background overlay
          transition: "all 0.3s ease-in-out",
          boxShadow: "none",
          borderRadius: "16px", // Làm mềm các góc của dialog
        },
      }}
      sx={{
        backdropFilter: "blur(5px)",
        backgroundColor: "transparent", // Không có màu nền bên ngoài
        overflow: "hidden",
      }}
    >
      {/* Thanh điều hướng */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        sx={{
          color: "white",
          position: "absolute",
          top: 0,
          width: "93.5%",
          zIndex: 2,
        }}
      >
        <Box>
          <IconButton
            onClick={handleInstall}
            sx={{
              color: "white",
              "&:hover": { color: "#2196f3" },
              "&:active": { color: "#1e88e5" },
              transition: "color 0.3s ease",
              marginRight: 1,
            }}
          >
            <GetAppIcon fontSize="large" />
          </IconButton>
        </Box>

        <IconButton
          onClick={handleCloseImage}
          sx={{
            color: "white",
            "&:hover": { color: "#2196f3" },
            "&:active": { color: "#1e88e5" },
            transition: "color 0.3s ease",
          }}
        >
          <CloseIcon fontSize="large" />
        </IconButton>
      </Box>

      {/* Hình ảnh */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
        sx={{
          transition: "all 0.3s ease-in-out",
        }}
      >
        <img
          src={selectedImage}
          alt="Selected"
          style={{
            maxHeight: "90%",
            maxWidth: "85%",
            objectFit: "contain",
            borderRadius: "16px",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.6)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        />
      </Box>
    </Dialog>
  );
}
