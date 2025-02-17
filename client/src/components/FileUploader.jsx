import React, { useRef } from "react";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import { useHome } from "../contexts/HomeContext";
import { UploadFile } from "@mui/icons-material";
import { Tooltip } from "@mui/material";

const FileUploader = () => {
  const fileInputRef = useRef(null);
  const { setSelectedFile, setImagePreviewUrl } = useHome();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setImagePreviewUrl(URL.createObjectURL(file));
      } else {
        setImagePreviewUrl(null);
      }
    }
    event.target.value = null;
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
      }}
    >
      {/* Input file ẩn */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      {/* IconButton */}
      <Tooltip title="Tải File" placement="top" arrow>
        <IconButton
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            backgroundColor: "#E3F2FD",
            color: "primary.main",
            borderRadius: "50%",
            transition: "all 0.5s ease",
            "&:hover": {
              backgroundColor: "#BBDEFB",
            },
          }}
          onClick={handleButtonClick}
        >
          <UploadFile sx={{ fontSize: { sx: 25, sm: 30 } }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default FileUploader;
