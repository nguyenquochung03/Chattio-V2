import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Tab,
  Tabs,
  Tooltip,
  Badge,
  Grid,
  Card,
  CardMedia,
} from "@mui/material";
import {
  Notifications,
  AccountCircle,
  Search,
  ArrowBack,
  ExpandMore,
  RemoveCircle,
} from "@mui/icons-material";
import {
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  Description as WordIcon,
  TextSnippet as TextIcon,
  InsertDriveFile as FileIcon,
  TableChart as ExcelIcon,
} from "@mui/icons-material";
import { useResponsive } from "../contexts/ResponsiveContext";
import { useHome } from "../contexts/HomeContext";
import { getTimeAgoInVietnamese } from "../utils/Time";
import NotificationSettingsDialog from "./NotificationSettingsDialog";
import BlockUserDialog from "./BlockUserDialog";
import ChatSearch from "./ChatSearch";
import { extractAndFormat } from "../utils/stringUtils";
import { downloadFileFromGoogleDrive, getFileFromMessage } from "../utils/File";
import ViewAllFile from "./ViewAllFile";

const ChatInfo = ({ setIsShowChat, setIsShowList, setIsShowChatInfo }) => {
  // Quản lý trạng thái tab
  const [value, setValue] = useState(0);
  // Có hiển thị nút back arrow không
  const [isShowbackArrow, setIsShowbackArrow] = useState(false);
  // Đóng mở dialog chặn
  const [isDialogOpen, setDialogOpen] = useState(false);

  // Sử dụng hook
  const {
    isLaptop,
    isMobile,
    isSmallerLaptop,
    isSmallLaptop,
    isTablet,
    isLargeMobile,
    isSmallMobile,
  } = useResponsive();
  const {
    isSidebarHidden,
    userToChat,
    isMuteConversation,
    isSearching,
    setIsSearching,
    listMediaFile,
    listRawFile,
    setSelectedImage,
    setOpenImageViewer,
    isViewAll,
    setIsViewAll,
    setActiveTab,
  } = useHome();
  const [expanded, setExpanded] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    if (value === 0) {
      handleFiles(listMediaFile);
    }
  }, [value, listMediaFile]);

  useEffect(() => {
    if (isLaptop) {
      setIsShowbackArrow(false);
    }
  }, [isLaptop]);

  useEffect(() => {
    if (isSmallLaptop && !isSidebarHidden) {
      setIsShowbackArrow(true);
    }

    if (isSmallLaptop && isSidebarHidden) {
      setIsShowbackArrow(false);
    }
  }, [isSmallLaptop, isSidebarHidden]);

  useEffect(() => {
    if (isSmallerLaptop) {
      setIsShowbackArrow(true);
    }
  }, [isSmallerLaptop]);

  useEffect(() => {
    if (isTablet) {
      setIsShowbackArrow(true);
    }
  }, [isTablet]);

  useEffect(() => {
    if (isLaptop) {
      setIsShowbackArrow(false);
    }
  }, [isLaptop]);

  useEffect(() => {
    if (isLargeMobile) {
      setIsShowbackArrow(true);
    }
  }, [isLargeMobile]);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCancelChat = () => {
    setIsShowChatInfo(false);
    setIsShowChat(true);
  };

  const handleAccordionChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  const handleOpen = () => {
    setDialogOpen(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };
  const handleClose = () => {
    setDialogOpen(false);
    document.getElementById("root").removeAttribute("aria-hidden");
  };

  const handleOpenImage = (imgUrl) => {
    setSelectedImage(imgUrl);
    setOpenImageViewer(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
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

  const handleFiles = async (listMediaFile) => {
    const results = await Promise.all(
      listMediaFile.map(async (msg, index) => {
        const checkFile = await handleCheckMediaFiles(msg.message);
        const fileUrl = extractAndFormat(msg.message);

        return (
          <Grid item xs={12} sm={4} key={index}>
            {checkFile === "Image" && fileUrl.success && (
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
            )}
          </Grid>
        );
      })
    );

    // Chỉ lấy tối đa 6 phần tử
    const limitedResults = results.slice(0, 6);

    // Kiểm tra nếu danh sách gốc có hơn 6 phần tử, thêm nút "Xem tất cả"
    if (results.length > 6) {
      limitedResults.push(
        <Grid item xs={12} key="view-all">
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleViewAll(0)}
            sx={{
              display: "block",
              width: "100%",
              textTransform: "none",
              fontSize: "16px",
              fontWeight: "600",
              padding: "5px 16px",
              borderRadius: "8px",
              background: "linear-gradient(90deg, #007BFF 0%, #0056B3 100%)",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
              transition: "transform 0.3s ease, box-shadow 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
              },
            }}
          >
            Xem tất cả
          </Button>
        </Grid>
      );
    }
    setMediaFiles(limitedResults);
  };

  const handleViewAll = (tab) => {
    setIsViewAll(true);
    setActiveTab(tab);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="start"
      textAlign="center"
      alignItems="center"
      p={isSmallMobile ? 1 : 2}
      position="relative"
      maxWidth={
        isMobile || isTablet
          ? "100%"
          : isLargeMobile
          ? "100%"
          : isSmallerLaptop
          ? "100%"
          : isSmallLaptop && !isSidebarHidden
          ? "100%"
          : "280px"
      }
      sx={{
        borderLeft: "1.6px solid #f2f0f0",
        width: "100%",
        overflowY: !isSearching ? "auto" : "none",
      }}
    >
      {isViewAll ? (
        <ViewAllFile handleOpenImage={handleOpenImage} />
      ) : isSearching ? (
        <ChatSearch />
      ) : (
        <>
          {isShowbackArrow && (
            <IconButton
              onClick={handleCancelChat}
              sx={{
                color: "primary.main",
                position: "absolute",
                left: 5,
                top: 16,
              }}
            >
              <ArrowBack fontSize="medium" />
            </IconButton>
          )}

          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            width="100%"
            mt={2}
          >
            {userToChat.isActive ? (
              <Badge
                color="success"
                variant="dot"
                overlap="circular"
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                sx={{
                  "& .MuiBadge-badge": {
                    width: 14,
                    height: 14,
                    backgroundColor: "#4caf50",
                    border: "1px solid white",
                    borderRadius: "50%",
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: isSmallMobile ? 60 : 90,
                    height: isSmallMobile ? 60 : 90,
                    border: "2px solid #1976d2",
                  }}
                  alt={userToChat.username}
                  src={userToChat.avatar}
                />
              </Badge>
            ) : (
              <Avatar
                sx={{
                  width: isSmallMobile ? 60 : 90,
                  height: isSmallMobile ? 60 : 90,
                  border: "2px solid #c7c8c9",
                }}
                alt={userToChat.username}
                src={userToChat.avatar}
              />
            )}

            <Typography
              variant={isSmallMobile ? "body2" : "body1"}
              mt={1}
              fontWeight={"bold"}
            >
              {userToChat.username}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {userToChat.isActive
                ? "Đang hoạt động"
                : `Hoạt động ${getTimeAgoInVietnamese(
                    userToChat.lastActiveAt
                  )}`}
            </Typography>

            {/* Các nút chức năng */}
            <Box display="flex" justifyContent="center" mt={2} gap={2}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Tooltip title="Hồ sơ" arrow placement="top">
                  <IconButton sx={{ color: "black", bgcolor: "#f2f4f5" }}>
                    <AccountCircle fontSize="medium" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="textSecondary" mt={0.2}>
                  Hồ sơ
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" alignItems="center">
                <Tooltip title="Thông báo" arrow placement="top">
                  <span>
                    <NotificationSettingsDialog />
                  </span>
                </Tooltip>
                {isMuteConversation ? (
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    mt={0.2}
                    sx={{
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    Bật thông báo
                  </Typography>
                ) : (
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    mt={0.2}
                    sx={{
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                    }}
                  >
                    Tắt thông báo
                  </Typography>
                )}
              </Box>

              <Box display="flex" flexDirection="column" alignItems="center">
                <Tooltip title="Tìm kiếm" arrow placement="top">
                  <IconButton
                    sx={{ color: "black", bgcolor: "#f2f4f5" }}
                    onClick={() => setIsSearching(true)}
                  >
                    <Search fontSize="medium" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" color="textSecondary" mt={0.2}>
                  Tìm kiếm
                </Typography>
              </Box>
            </Box>

            {/* Thông tin cuộc trò chuyện */}
            <Accordion
              sx={{
                width: isMobile ? "calc(100vw - 110px)" : "100%",
                mt: 2,
                boxShadow: "none",
                border: "none",
              }}
              expanded={expanded}
              onChange={handleAccordionChange}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMore
                    sx={{
                      backgroundColor: expanded ? "#c6e2f7" : "#f0f0f0",
                      borderRadius: "6px",
                      fontSize: 25,
                      color: expanded ? "primary.main" : "black",
                    }}
                  />
                }
              >
                <Typography
                  variant={isSmallMobile ? "caption" : "body1"}
                  fontWeight={550}
                  sx={{ letterSpacing: 0.3 }}
                >
                  File phương tiện & file
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 1, paddingTop: 0 }}>
                <Tabs
                  value={value}
                  onChange={handleTabChange}
                  aria-label="chat-tabs"
                  centered
                  sx={{
                    "& .MuiTabs-indicator": {
                      display: "none",
                    },
                  }}
                >
                  <Tab
                    label="Phương tiện"
                    sx={{
                      flex: 1,
                      minHeight: "36px",
                      padding: "6px 16px",
                      borderRadius: "30px",
                      bgcolor: value === 0 ? "#c6e2f7" : "#e9edf0",
                      color: value === 0 ? "primary.main" : "black",
                      textTransform: "capitalize",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: value === 0 ? "#95ccf5" : "#d6d6d6",
                      },
                    }}
                  />
                  <Tab
                    label="Tập tin"
                    sx={{
                      flex: 1,
                      minHeight: "36px",
                      padding: "6px 16px",
                      borderRadius: "30px",
                      bgcolor: value === 1 ? "#c6e2f7" : "#e9edf0",
                      color: value === 1 ? "primary.main" : "black",
                      textTransform: "capitalize",
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: value === 1 ? "#95ccf5" : "#d6d6d6",
                      },
                    }}
                  />
                </Tabs>

                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  mt={1}
                >
                  {/* Hiển thị nội dung của tab "Phương tiện" */}
                  {value === 0 && (
                    <Grid container spacing={1}>
                      {listMediaFile.length === 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            width: "100%",
                            textAlign: "center",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#888",
                            mt: 1,
                          }}
                        >
                          Chưa có phương tiện nào
                        </Box>
                      ) : Array.isArray(mediaFiles) ? (
                        mediaFiles
                      ) : (
                        []
                      )}
                    </Grid>
                  )}

                  {/* Hiển thị nội dung của tab "Tập tin" */}
                  {value === 1 &&
                    (listRawFile && listRawFile.length === 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          width: "100%",
                          textAlign: "center",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#888",
                          mt: 1,
                        }}
                      >
                        Chưa có tập tin nào
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          width: "100%",
                          flexDirection: "column",
                        }}
                      >
                        {listRawFile &&
                          listRawFile.slice(0, 2).map((fileDetails, index) => (
                            <Card
                              sx={{
                                mt: 0.5,
                                mb: 0.5,
                                boxShadow: 3,
                                maxWidth: "100%",
                                display: "flex",
                                alignItems: "center",
                                padding: 1,
                                cursor: "pointer",
                                transition:
                                  "transform 0.3s ease, box-shadow 0.3s ease",
                                "&:hover": {
                                  transform: "scale(1.02)",
                                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
                                },
                              }}
                              onClick={() =>
                                downloadFileFromGoogleDrive(fileDetails.fileId)
                              }
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
                                    display: "block",
                                    fontWeight: "bold",
                                    fontSize: "14px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    fontFamily:
                                      "'Google Sans', 'Helvetica Neue', sans-serif",
                                  }}
                                >
                                  {fileDetails?.name || "Unknown File"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "gray",
                                    fontFamily:
                                      "'Google Sans', 'Helvetica Neue', sans-serif",
                                  }}
                                >
                                  {fileDetails?.size || "Unknown Size"}
                                </div>
                              </div>
                            </Card>
                          ))}

                        {listRawFile && listRawFile.length > 2 && (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleViewAll(1)}
                            sx={{
                              mt: 1,
                              display: "block",
                              width: "100%",
                              textTransform: "none",
                              fontSize: "16px",
                              fontWeight: "600",
                              padding: "5px 16px",
                              borderRadius: "8px",
                              background:
                                "linear-gradient(90deg, #007BFF 0%, #0056B3 100%)",
                              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                              transition:
                                "transform 0.3s ease, box-shadow 0.3s ease",
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                              },
                            }}
                          >
                            Xem tất cả
                          </Button>
                        )}
                      </Box>
                    ))}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Tùy chọn chặn */}
            <Button
              fullWidth
              variant="text"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                mt: 1,
                gap: 1,
                color: "black",
                textTransform: "none",
                py: 1,
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "#f2f4f5",
                },
              }}
              onClick={() => handleOpen()}
            >
              <Box
                sx={{
                  bgcolor: "#f0efed",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 35,
                  height: 35,
                }}
              >
                <RemoveCircle fontSize="small" />
              </Box>
              <Typography variant="body2" color="black" fontWeight={600}>
                Chặn
              </Typography>
            </Button>

            {/* Hiển thị Dialog */}
            <BlockUserDialog
              open={isDialogOpen}
              onClose={() => handleClose()}
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ChatInfo;
