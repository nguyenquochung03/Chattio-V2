import React, { useEffect, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Card,
  CardMedia,
  Grid,
  IconButton,
  Typography,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  Description as WordIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
  TableChart as ExcelIcon,
  ArrowBack,
  InsertPhoto,
  InsertPhotoOutlined,
  InsertDriveFileOutlined,
} from "@mui/icons-material";
import { useHome } from "../contexts/HomeContext";
import { downloadFileFromGoogleDrive, getFileFromMessage } from "../utils/File";
import { extractAndFormat } from "../utils/stringUtils";
import { useResponsive } from "../contexts/ResponsiveContext";

export default function ViewAllFile({ handleOpenImage }) {
  const [mediaFileComponents, setMediaFileComponents] = useState([]);

  const { listRawFile, listMediaFile, setIsViewAll, activeTab, setActiveTab } =
    useHome();
  const { isTablet, isLargeMobile } = useResponsive();

  useEffect(() => {
    renderMediaFiles();
  }, [listMediaFile]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Hàm lấy icon tương ứng loại file
  const getFileIcon = (mimeType) => {
    if (mimeType.includes("pdf"))
      return <PdfIcon sx={{ fontSize: 30, color: "#FF0000" }} />;
    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return <ArchiveIcon sx={{ fontSize: 30, color: "#FFA500" }} />;
    if (mimeType.includes("word") || mimeType.includes("doc"))
      return <WordIcon sx={{ fontSize: 30, color: "#0078D4" }} />;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return <ExcelIcon sx={{ fontSize: 30, color: "#1D6F42" }} />;
    if (mimeType.includes("text") || mimeType.includes("plain"))
      return <TextIcon sx={{ fontSize: 30, color: "#4CAF50" }} />;
    return <FileIcon sx={{ fontSize: 30, color: "#808080" }} />;
  };

  const renderRawFiles = () => (
    <Box>
      {!listRawFile && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            color: "text.secondary",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              opacity: 0.6,
            }}
          >
            <InsertDriveFileOutlined
              sx={{ fontSize: 150, color: "primary.main" }}
            />
            <Typography
              variant="body1"
              sx={{
                color: "text.primary",
                textAlign: "center",
                fontSize: "16px",
              }}
            >
              Hiện không có tập tin nào
            </Typography>
          </Box>
        </Box>
      )}

      {listRawFile &&
        listRawFile.length !== 0 &&
        listRawFile.map((fileDetails, index) => (
          <Card
            sx={{
              mt: 0.5,
              mb: 0.5,
              boxShadow: 3,
              display: "flex",
              alignItems: "center",
              padding: 1,
              cursor: "pointer",
              maxWidth: "100%",
            }}
            onClick={() => downloadFileFromGoogleDrive(fileDetails.fileId)}
            key={index}
          >
            <div style={{ marginRight: "10px" }}>
              {fileDetails?.fileType ? (
                getFileIcon(fileDetails.fileType)
              ) : (
                <FileIcon size={30} color="#808080" />
              )}
            </div>
            <div
              style={{
                textAlign: "left",
                maxWidth: "calc(100% - 50px)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {fileDetails?.name || "Unknown File"}
              </div>
              <div style={{ fontSize: "12px", color: "gray" }}>
                {fileDetails?.size || "Unknown Size"}
              </div>
            </div>
          </Card>
        ))}
    </Box>
  );

  const handleCheckMediaFiles = async (message) => {
    const checkFile = await getFileFromMessage(message);

    if (checkFile && checkFile.success && checkFile.type === "Image") {
      return "Image";
    } else if (checkFile && checkFile.success && checkFile.type === "Video") {
      return "Video";
    } else {
      return "";
    }
  };

  const renderMediaFiles = async () => {
    const results = await Promise.all(
      listMediaFile.map(async (msg, index) => {
        const checkFile = await handleCheckMediaFiles(msg.message);
        const fileUrl = extractAndFormat(msg.message);

        if (checkFile === "Image" && fileUrl.success) {
          return (
            <Grid item xs={12} sm={4} key={index}>
              <Card
                sx={{
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                  borderRadius: "8px",
                  maxWidth: "100%",
                  background: "#fff",
                  display: "inline-block",
                  cursor: "pointer",
                  border: "2px solid #007BFF",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.2)",
                  },
                }}
                onClick={() => handleOpenImage(fileUrl.remaining)}
              >
                <CardMedia
                  component="img"
                  image={fileUrl.remaining}
                  alt="cloudinary file"
                  sx={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </Card>
            </Grid>
          );
        }
      })
    );

    const filteredResults = results.filter((item) => item !== null);

    if (filteredResults.length === 0) {
      setMediaFileComponents(
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            color: "text.secondary",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              opacity: 0.6,
            }}
          >
            <InsertPhotoOutlined
              sx={{ fontSize: 150, color: "primary.main" }}
            />
            <Typography
              variant="body1"
              sx={{
                color: "text.primary",
                textAlign: "center",
                fontSize: "16px",
              }}
            >
              Hiện không có phương tiện nào
            </Typography>
          </Box>
        </Box>
      );
    } else {
      setMediaFileComponents(filteredResults);
    }
  };

  return (
    <Box sx={{ width: "100%", typography: "body1" }}>
      {/* Header với nút quay lại và tiêu đề */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        {/* Nút quay lại */}
        <IconButton
          sx={{
            color: "primary.main",
            position: "absolute",
            left: 5,
            top: 16,
          }}
          onClick={() => setIsViewAll(false)}
        >
          <ArrowBack />
        </IconButton>

        {/* Tiêu đề trung tâm */}
        <Typography
          variant="h6"
          sx={{
            textAlign: "center",
            flexGrow: 1,
            color: "primary.main",
            letterSpacing: "0.5px",
          }}
        >
          Kho lưu trữ
        </Typography>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="File tabs"
        sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: "primary.main",
            height: "3px",
            borderRadius: "2px",
          },
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            color: "text.secondary",
            "&.Mui-selected": {
              color: "primary.main",
            },
            "&:hover": {
              color: "primary.dark",
            },
            fontSize: "16px",
          },
          "& .MuiTabs-flexContainer": {
            justifyContent: "center",
          },
        }}
      >
        <Tab label="File phương tiện" />
        <Tab label="File tập tin" />
      </Tabs>

      {/* Nội dung bên dưới tabs */}
      {activeTab === 1 && <Box sx={{ mt: 2 }}>{renderRawFiles()}</Box>}
      {activeTab === 0 && (
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            {mediaFileComponents}
          </Grid>
        </Box>
      )}
    </Box>
  );
}
