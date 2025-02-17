import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Tooltip,
  Card,
  CardMedia,
  Skeleton,
  LinearProgress,
  IconButton,
} from "@mui/material";
import {
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  Description as WordIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
  TableChart as ExcelIcon,
  PlayCircleOutline,
  PauseCircleOutline,
} from "@mui/icons-material";
import { extractAndFormat, splitStringByDash } from "../utils/stringUtils";
import { format } from "date-fns";
import {
  MissedVideoCall,
  Phone,
  PhoneMissed,
  VideoCall,
} from "@mui/icons-material";
import { useHome } from "../contexts/HomeContext";
import { convertSecondsToReadableTime } from "../utils/Time";
import { downloadFileFromGoogleDrive, getFileFromMessage } from "../utils/File";
import { useResponsive } from "../contexts/ResponsiveContext";

const MessageBox = ({
  prevMsg,
  msg,
  clientInfo,
  index,
  showStatus,
  setShowStatus,
  handleCall,
  handleCallVideo,
}) => {
  const {
    isSearching,
    listMessageToSeach,
    messageToSearch,
    messageRef,
    searchQuery,
    selectedImage,
    setSelectedImage,
    openImageViewer,
    setOpenImageViewer,
  } = useHome();
  const { isMobile } = useResponsive();
  const checkMsg = splitStringByDash(msg.message);
  const [fileType, setFileType] = useState("Checking...");
  const [prevFileType, setPrevFileType] = useState(null);
  const [isSameFileType, setIsSameFileType] = useState(false);
  const [fileDetails, setFileDetails] = useState(null);
  // Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Kiểm tra loại file khi component được render hoặc khi URL thay đổi
    const checkFileType = async () => {
      const type = await getFileFromMessage(msg.message);

      if (type?.success) {
        setFileType(type.type);
        if (type.type === "Raw") {
          setFileDetails(type.data);
        }
      } else {
        setFileType("");
      }
    };

    if (msg.message) {
      checkFileType();
    } else {
      setFileType("No URL provided");
    }
  }, [msg]);

  useEffect(() => {
    // Kiểm tra loại file khi component được render hoặc khi URL thay đổi
    const checkFileType = async () => {
      const type = await getFileFromMessage(prevMsg.message);

      if (type?.success) {
        setPrevFileType(type.type);
      }
    };

    if (prevMsg?.message) {
      checkFileType();
    } else {
      setFileType("No URL provided");
    }
  }, [prevMsg]);

  useEffect(() => {
    setIsSameFileType(prevFileType === fileType);
  }, [prevFileType, fileType]);

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

  const handleOpenImage = (imgUrl) => {
    setSelectedImage(imgUrl);
    setOpenImageViewer(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };

  // Xử lý phát/dừng âm thanh
  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Cập nhật tiến trình âm thanh
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress =
        (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  return (
    <React.Fragment>
      {fileType === "Image" ? (
        <Card
          sx={{
            mt: isSameFileType ? 0 : 0.5,
            mb: 0.5,
            boxShadow: 3,
            maxWidth: "100%",
            display: "inline-block",
            cursor: "pointer",
          }}
          onClick={() =>
            handleOpenImage(extractAndFormat(msg.message).remaining)
          }
        >
          <CardMedia
            component="img"
            image={extractAndFormat(msg.message).remaining}
            alt="cloudinary file"
            sx={{
              maxWidth: "100%",
              maxHeight: "150px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </Card>
      ) : fileType === "Video" ? (
        <Card
          sx={{
            mt: isSameFileType ? 0 : 0.5,
            mb: 0.5,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            borderRadius: "12px",
            padding: "8px",
            maxWidth: "300px",
            background: "#fff",
            border: "1px solid #e0e0e0",
          }}
        >
          <video
            src={extractAndFormat(msg.message).remaining}
            controls
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: "8px",
              objectFit: "cover",
              border: "1px solid #ddd",
            }}
          />
        </Card>
      ) : fileType === "Audio" ? (
        <Box>
          <audio
            ref={audioRef}
            src={extractAndFormat(msg.message).remaining}
            controls
            onTimeUpdate={handleTimeUpdate}
            style={{
              width: "100%",
              minWidth: isMobile ? "250px" : "280px",
              borderRadius: "8px",
              marginBottom: "8px",
              display: "block",
              fontWeight: "bold",
              fontSize: "14px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          />
        </Box>
      ) : fileType === "Raw" ? (
        <Card
          sx={{
            mt: isSameFileType ? 0 : 0.5,
            mb: 0.5,
            boxShadow: 3,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            padding: 1,
            cursor: "pointer",
            mt: 0.5,
          }}
          onClick={() => downloadFileFromGoogleDrive(fileDetails.fileId)}
        >
          <div
            style={{
              textAlign: "left",
              maxWidth: "calc(100% - 50px)",
              overflow: "hidden",
            }}
          >
            {fileDetails?.fileType ? (
              getFileIcon(fileDetails.fileType)
            ) : (
              <FileIcon size={30} color="#808080" />
            )}
          </div>
          <div>
            <div
              style={{
                fontWeight: "bold",
                fontSize: "14px",
                fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
              }}
            >
              {fileDetails?.name || "Unknown File"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "gray",
                fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
              }}
            >
              {fileDetails?.size || "Unknown Size"}
            </div>
          </div>
        </Card>
      ) : checkMsg.success &&
        checkMsg.data[0] === clientInfo.audioCallSecret &&
        checkMsg.data[1] === "failed" ? (
        // Nếu splitStringByDash trả về true, hiển thị nội dung đã tách
        <Tooltip
          title="Nhấn để gọi lại"
          arrow
          placement={msg.sender === clientInfo.user._id ? "left" : "right"}
        >
          <Box
            sx={{
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: "#f8d7da",
              color: "#5a0e14",
              mt: index === 0 ? 2 : 0,
              maxWidth: "70vw",
              width: "fit-content",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              margin: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#f5c6cb",
              },
            }}
            onClick={() => handleCall()}
          >
            <PhoneMissed sx={{ fontSize: "28px", color: "#d32f2f" }} />
            <Box>
              <Typography
                sx={{
                  fontWeight: "bold",
                  marginBottom: "2px",
                  fontSize: "14px",
                  color: "#721c24",
                }}
              >
                Cuộc gọi thoại đã bị bỏ lỡ
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#495057" }}>
                {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ) : checkMsg.success &&
        checkMsg.data[0] === clientInfo.videoCallSecret &&
        checkMsg.data[1] === "failed" ? (
        // Nếu splitStringByDash trả về true, hiển thị nội dung đã tách
        <Tooltip
          title="Nhấn để gọi lại"
          arrow
          placement={msg.sender === clientInfo.user._id ? "left" : "right"}
        >
          <Box
            sx={{
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: "#f8d7da",
              color: "#5a0e14",
              mt: index === 0 ? 2 : 0,
              maxWidth: "70vw",
              width: "fit-content",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              margin: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#f5c6cb",
              },
            }}
            onClick={() => handleCallVideo()}
          >
            <MissedVideoCall sx={{ fontSize: "25px", color: "#d32f2f" }} />
            <Box>
              <Typography
                sx={{
                  fontWeight: "bold",
                  marginBottom: "2px",
                  fontSize: "14px",
                  color: "#721c24",
                }}
              >
                Cuộc gọi video đã bị bỏ lỡ
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#495057" }}>
                {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ) : checkMsg.success &&
        checkMsg.data[0] === clientInfo.audioCallSecret &&
        checkMsg.data[1] === "successed" ? (
        <Tooltip
          title="Nhấn để gọi lại"
          arrow
          placement={msg.sender === clientInfo.user._id ? "left" : "right"}
        >
          <Box
            sx={{
              padding: "10px",
              borderRadius: "8px",
              backgroundColor: "#d1ecf1",
              color: "#0c5460",
              mt: index === 0 ? 2 : 0,
              maxWidth: "70vw",
              width: "fit-content",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              margin: "auto",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#bee5eb",
              },
            }}
            onClick={() => handleCall()}
          >
            <Phone sx={{ fontSize: "28px", color: "#007bff" }} />{" "}
            <Box>
              <Typography
                sx={{
                  fontWeight: "bold",
                  marginBottom: "4px",
                  fontSize: "14px",
                  color: "#0c5460",
                }}
              >
                Cuộc gọi thoại
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#495057" }}>
                {convertSecondsToReadableTime(checkMsg.data[2])}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ) : checkMsg.success &&
        checkMsg.data[0] === clientInfo.videoCallSecret &&
        checkMsg.data[1] === "successed" ? (
        <Tooltip
          title="Nhấn để gọi lại"
          arrow
          placement={msg.sender === clientInfo.user._id ? "left" : "right"}
        >
          <Box
            sx={{
              padding: "8px",
              borderRadius: "8px",
              backgroundColor: "#d0e8f2",
              color: "#0c5460",
              mt: index === 0 ? 1 : 0,
              mb: 2,
              maxWidth: "70vw",
              width: "fit-content",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              margin: "auto",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              cursor: "pointer",
              "&:hover": {
                backgroundColor: "#b3d9f0",
              },
            }}
            onClick={() => handleCallVideo()}
          >
            <VideoCall sx={{ fontSize: "32px", color: "#0d6efd" }} />{" "}
            <Box>
              <Typography
                sx={{
                  fontWeight: "bold",
                  marginBottom: "2px",
                  fontSize: "14px",
                  color: "#0c5460",
                }}
              >
                Cuộc gọi video
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#495057" }}>
                {convertSecondsToReadableTime(checkMsg.data[2])}
              </Typography>
            </Box>
          </Box>
        </Tooltip>
      ) : checkMsg.success && checkMsg?.data?.[0] === clientInfo.fileSecret ? (
        <Card
          sx={{
            mt: isSameFileType ? 0 : 0.5,
            mb: 0.5,
            boxShadow: 2,
            maxWidth: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 50,
            width: 200,
            borderRadius: 2,
          }}
        >
          <Skeleton
            variant="rectangular"
            width={"90%"}
            height={"40%"}
            animation="wave"
            sx={{ borderRadius: 1 }}
          />
        </Card>
      ) : (
        <Box
          sx={{
            padding: "10px",
            borderRadius: "10px",
            backgroundColor:
              msg.sender === clientInfo.user._id ? "#6ec6ff" : "#f7f7f7",
            color: msg.sender === clientInfo.user._id ? "#ffffff" : "#000000",
            cursor: "pointer",
            mt: index === 0 ? 2 : 0,
            maxWidth: "70vw",
            width: "fit-content",
            overflowWrap: "break-word",
            wordBreak: "break-word",
            whiteSpace: "pre-wrap",
            marginLeft: msg.sender === clientInfo.user._id ? "auto" : "0",
            marginRight: msg.sender === clientInfo.user._id ? "0" : "auto",
            border:
              isSearching &&
              listMessageToSeach.length > 0 &&
              msg._id === messageToSearch._id
                ? "2px solid #ff9800"
                : "none",
          }}
          onClick={() => {
            showStatus === index ? setShowStatus(-1) : setShowStatus(index);
          }}
        >
          {isSearching && listMessageToSeach.length > 0 ? (
            <Typography
              ref={msg._id === messageToSearch._id ? messageRef : null}
            >
              {msg._id === messageToSearch._id
                ? msg.message
                    .split(new RegExp(`(${searchQuery})`, "gi"))
                    .map((part, i) =>
                      part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <span
                          key={i}
                          style={{
                            backgroundColor: "#ff9800",
                            fontWeight: "bold",
                          }}
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      )
                    )
                : msg.message}
            </Typography>
          ) : (
            <Typography>{msg.message}</Typography>
          )}
        </Box>
      )}
    </React.Fragment>
  );
};

export default MessageBox;
