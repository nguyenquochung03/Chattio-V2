import React, { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
  Avatar,
  Box,
  Typography,
  IconButton,
  TextField,
  Button,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useResponsive } from "../contexts/ResponsiveContext";
import {
  ArrowBack,
  Close,
  Lock,
  Mic,
  NotificationsOff,
  Security,
  Send,
} from "@mui/icons-material";
import { useHome } from "../contexts/HomeContext";
import { getTimeAgoInVietnamese } from "../utils/Time";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useChat } from "../contexts/ChatContext";
import { useSocket } from "../contexts/SocketContext";
import Spinner from "./display/spinner/Spinner";
import { useLoading } from "../contexts/LoadingContext";
import { useFriend } from "../contexts/FriendContext";
import ChatSearchList from "./ChatSearchList";
import { useUser } from "../contexts/UserContext";
import { playRingtone } from "../utils/Ringtone";
import { checkCallStream, checkCallVideoStream } from "../utils/CheckStream";
import { usePermissionDialog } from "../contexts/PermissionDialogContext";
import MessageBox from "./MessageBox";
import FileUploader from "./FileUploader";
import { getFileFromMessage } from "../utils/File";
import VoiceRecorder from "./VoiceRecorder";
import LinearBuffer from "./LinearBuffer";

const ChatUI = ({ setIsShowChat, setIsShowList }) => {
  // Có hiển thị dialog bỏ chặn không
  const [openDialog, setOpenDialog] = useState(false);
  // Có hiển thị nút back arrow không
  const [isShowbackArrow, setIsShowbackArrow] = useState(false);
  // Dữ liệu cho textfield nhập tin nhắn
  const [newMessage, setNewMessage] = useState("");

  const messageEndRef = useRef(null);
  const messageListRef = useRef(null);
  const {
    isSmallMobile,
    isMobile,
    isTablet,
    isLargeMobile,
    isSmallerLaptop,
    isSmallLaptop,
    isLaptop,
  } = useResponsive();
  const {
    isSidebarHidden,
    userToChat,
    listChats,
    setListChats,
    listChatsPage,
    setListChatsPage,
    isTyping,
    setIsTyping,
    conversation,
    setLastMessagesMap,
    hasMoreChats,
    setHasMoreChats,
    setIsShowChatInfo,
    checkBlocked,
    setCheckBlocked,
    isMuteConversation,
    listMessageToSeach,
    isSearching,
    setIsSearching,
    setCallStatus,
    popupWindow,
    setPopupWindow,
    callStatus,
    selectedFile,
    setSelectedFile,
    imagePreviewUrl,
    setImagePreviewUrl,
    setListMediaFile,
    setListRawFile,
    isRecording,
    setIsRecording,
  } = useHome();
  const clientInfo = useClientInfo();
  const chatContext = useChat();
  const friendContext = useFriend();
  const userContext = useUser();
  const socket = useSocket();
  // Ẩn/hiện đã xem hoặc đã gửi
  const [showStatus, setShowStatus] = useState(-1);
  // Biến tạm lưu sender trước đó
  let previousSender = null;
  // Quản lý trạng thái của danh sách sẽ tải thêm
  const { isLoading } = useLoading();
  const { open } = usePermissionDialog();
  const reversedList = listChats.slice().reverse();

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [listChats]);

  useEffect(() => {
    setIsShowbackArrow(isLargeMobile);
  }, [isLargeMobile]);

  useEffect(() => {
    if (isSmallerLaptop) {
      setIsShowbackArrow(false);
    }
  }, [isSmallerLaptop]);

  useEffect(() => {
    if (isTablet && !isSidebarHidden) {
      setIsShowbackArrow(true);
    }
    if (isTablet && isSidebarHidden) {
      setIsShowbackArrow(false);
    }
  }, [isTablet, isSidebarHidden]);

  useEffect(() => {
    const boxMessageElement = messageListRef.current;

    if (boxMessageElement) {
      boxMessageElement.addEventListener("scroll", handleChatsScroll);

      return () => {
        boxMessageElement.removeEventListener("scroll", handleChatsScroll);
      };
    }
  }, [hasMoreChats, isLoading]);

  useEffect(() => {
    if (socket) {
      socket.on("typing", (data) => {
        setIsTyping(data.status);
      });

      socket.on("load-to-list", (data) => {
        const { newMsg } = data;

        setListChats((prev) => {
          return [newMsg, ...prev];
        });
        setLastMessagesMap((prevMessages) =>
          prevMessages.map((item) =>
            item.friendId === userToChat._id
              ? { ...item, lastMessage: { ...item.lastMessage, ...newMsg } }
              : item
          )
        );
      });

      socket.on("update-message-status", (data) => {
        const { messageKey, status } = data;

        setListChats((prevMessages) =>
          prevMessages.map((msg) =>
            msg.messageKey && msg.messageKey === messageKey
              ? { ...msg, status: status }
              : msg
          )
        );
      });
    }
  }, [socket]);

  const handleSendMessage = async () => {
    if (selectedFile) {
      const response = await chatContext.fetchUploadFile(selectedFile);
      const fileId = `${clientInfo.fileSecret}-${response.data}`;

      if (response.success) {
        // Sau khi file được tải lên thành công, tạo tin nhắn đính kèm file
        const createdAt = Date.now();
        const newMsg = {
          messageKey: createdAt,
          sender: clientInfo.user._id,
          receiver: userToChat._id,
          conversation: conversation._id,
          message: fileId, // URL của file từ Cloudinary
          createdAt: createdAt,
          status: "sending",
        };

        const type = await getFileFromMessage(fileId);

        if (type && type.success && type.type !== "Raw") {
          setListMediaFile((prev) =>
            Array.isArray(prev) ? [...prev, newMsg] : [newMsg]
          );
        } else if (type && type.success && type.type === "Raw") {
          setListRawFile((prev) =>
            Array.isArray(prev) ? [...prev, newMsg] : [newMsg]
          );
        }

        setListChats((prev) => [newMsg, ...prev]);
        setLastMessagesMap((prevMessages) =>
          prevMessages.map((item) =>
            item.friendId === userToChat._id
              ? { ...item, lastMessage: { ...item.lastMessage, ...newMsg } }
              : item
          )
        );

        socket.emit("send-message", {
          conversation: conversation,
          message: newMsg,
          sender: clientInfo.user._id,
          receiver: userToChat._id,
        });
      }

      setSelectedFile(null); // Xóa file sau khi gửi thành công
    }

    if (newMessage.trim()) {
      if (isSearching) {
        setListChatsPage(2);
        setHasMoreChats(true);

        const fetchMessages = await chatContext.fetchMessages(
          userToChat._id,
          1
        );

        if (!fetchMessages.success) {
          return;
        }

        setListChats(fetchMessages.data);
        setIsSearching(false);
      }
      socket.emit("typing", {
        conversationId: conversation._id,
        status: false,
      });

      const createdAt = Date.now();

      const newMsg = {
        messageKey: createdAt,
        sender: clientInfo.user._id,
        receiver: userToChat._id,
        conversation: conversation._id,
        message: newMessage,
        createdAt: createdAt,
        status: "sending",
      };

      setListChats((prev) => {
        return [newMsg, ...prev];
      });
      setLastMessagesMap((prevMessages) =>
        prevMessages.map((item) =>
          item.friendId === userToChat._id
            ? { ...item, lastMessage: { ...item.lastMessage, ...newMsg } }
            : item
        )
      );
      setNewMessage("");
      socket.emit("send-message", {
        conversation: conversation,
        message: newMsg,
        sender: clientInfo.user._id,
        receiver: userToChat._id,
      });
    }
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim()) {
      socket.emit("typing", {
        conversationId: conversation._id,
        status: true,
      }); // Phát "typing" khi nhập
    }

    // Ngừng gõ sau 2 giây
    setTimeout(() => {
      socket.emit("typing", {
        conversationId: conversation._id,
        status: false,
      }); // Phát "stopTyping"
    }, 2000);
  };

  const loadMoreChats = async () => {
    // Lưu vị trí cuộn hiện tại
    const chatListContainer = messageListRef.current;
    const previousScrollHeight = chatListContainer.scrollHeight;
    const previousScrollTop = chatListContainer.scrollTop;

    const result = await chatContext.fetchMessages(
      userToChat._id,
      listChatsPage
    );

    if (result.success) {
      if (result.data.length < 15) {
        setHasMoreChats(false);
      }

      setListChats((prev) => [...prev, ...result.data]);
      setListChatsPage((prev) => prev + 1);

      // Sau khi danh sách được cập nhật, cuộn lại đến vị trí cuối cùng
      setTimeout(() => {
        chatListContainer.scrollTop =
          chatListContainer.scrollHeight -
          previousScrollHeight +
          previousScrollTop;
      }, 10);
    }
  };

  const handleChatsScroll = useCallback(() => {
    if (messageListRef.current) {
      const { scrollTop } = messageListRef.current;

      // Kiểm tra nếu người dùng kéo lên trên cùng và còn dữ liệu để tải
      if (scrollTop === 0 && hasMoreChats && !isLoading) {
        loadMoreChats();
      }
    }
  }, [hasMoreChats, isLoading]);

  const handleCancelChat = () => {
    setIsShowChat(false);
    setIsShowList(true);
  };

  const handleShowChatInfo = () => {
    if (isLaptop) {
      setIsShowChatInfo((prev) => !prev);
    }

    if (isSmallLaptop && !isSidebarHidden) {
      setIsShowChat(false);
      setIsShowChatInfo(true);
    } else if (isSmallLaptop && isSidebarHidden) {
      setIsShowChat(true);
      setIsShowChatInfo((prev) => !prev);
    }

    if (isSmallerLaptop || isTablet) {
      setIsShowChat(false);
      setIsShowChatInfo(true);
    }

    if (isLargeMobile) {
      setIsShowChat(false);
      setIsShowChatInfo(true);
    }
  };

  const handleUnblockClick = () => {
    setOpenDialog(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    document.getElementById("root").removeAttribute("aria-hidden");
  };

  const handleUnBlockUser = async () => {
    const result = await friendContext.fetchUpdateFriendStatus("accepted");

    if (result.success) {
      socket.emit("cancel-block-friend", {
        userId1: clientInfo.user._id,
        userId2: userToChat._id,
      });
      // Lấy thông tin quan hệ bạn bè
      const fetchCheckBlocked = await friendContext.fetchCheckBlock(
        clientInfo.user._id,
        userToChat._id
      );

      if (fetchCheckBlocked.success) {
        setCheckBlocked(fetchCheckBlocked.data);
      }
      handleCloseDialog();
    }
  };

  const handleCallVideo = async () => {
    const resultCheckVideoCallStream = await checkCallVideoStream();

    if (resultCheckVideoCallStream.status === 400) {
      open();
      return;
    }

    if (userToChat._id && clientInfo.user._id) {
      // Kiểm tra người dùng có đang thực hiện cuộc gọi chưa
      const checkCallStatusOfUserToChat =
        await userContext.fetchCheckCallStatus(clientInfo.user._id);
      const checkCallStatusOfUser = await userContext.fetchCheckCallStatus(
        userToChat._id
      );

      if (checkCallStatusOfUser.data.inCall) {
        alert(
          "Bạn hiện đang thực hiện một cuộc gọi. Không thể thực hiện cuộc gọi khác."
        );
        return;
      }

      if (checkCallStatusOfUserToChat.data.inCall) {
        alert("Người mà bạn đang muốn gọi đã trong cuộc gọi khác.");
        return;
      }

      // Cập nhật trạng thái cuộc gọi
      setCallStatus("calling");

      // Cập nhật lại trang thái cuộc gọi ngay khi người dùng thực hiện cuộc gọi
      await userContext.fetchUpdateCallStatus(
        userToChat._id,
        true,
        clientInfo.user._id
      );
      await userContext.fetchUpdateCallStatus(
        clientInfo.user._id,
        true,
        userToChat._id
      );

      window.open(
        `${clientInfo.clientUrl}/videoCall`,
        "mozillaWindow",
        "popup"
      );

      socket.emit("init-video-call", {
        userCall: clientInfo.user,
        userToCall: userToChat,
      });
    }
  };

  const handleCall = async () => {
    const resultCheckCallStream = await checkCallStream();

    if (resultCheckCallStream.status === 400) {
      open();
      return;
    }

    if (userToChat._id && clientInfo.user._id) {
      // Kiểm tra người dùng có đang thực hiện cuộc gọi chưa
      const checkCallStatusOfUserToChat =
        await userContext.fetchCheckCallStatus(clientInfo.user._id);
      const checkCallStatusOfUser = await userContext.fetchCheckCallStatus(
        userToChat._id
      );

      if (checkCallStatusOfUser.data.inCall) {
        console.log(checkCallStatusOfUser.data.inCall);
        alert(
          "Bạn hiện đang thực hiện một cuộc gọi. Không thể thực hiện cuộc gọi khác."
        );
        return;
      }

      if (checkCallStatusOfUserToChat.data.inCall) {
        alert("Người mà bạn đang muốn gọi đã trong cuộc gọi khác.");
        return;
      }

      // Cập nhật trạng thái cuộc gọi
      setCallStatus("calling");

      // Cập nhật lại trang thái cuộc gọi ngay khi người dùng thực hiện cuộc gọi
      await userContext.fetchUpdateCallStatus(
        userToChat._id,
        true,
        clientInfo.user._id
      );
      await userContext.fetchUpdateCallStatus(
        clientInfo.user._id,
        true,
        userToChat._id
      );

      window.open(`${clientInfo.clientUrl}/call`, "mozillaWindow", "popup");

      socket.emit("init-call", {
        userCall: clientInfo.user,
        userToCall: userToChat,
      });
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
  };

  return (
    <React.Fragment>
      <Box
        sx={{
          p: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          borderLeft: "1.6px solid #f2f0f0",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            padding: isMobile ? "2px" : "5px",
            borderBottom: "1.6px solid #f2f0f0",
          }}
        >
          {isShowbackArrow && (
            <IconButton
              onClick={handleCancelChat}
              sx={{ color: "primary.main", mr: isSmallMobile ? 0 : 1 }}
            >
              <ArrowBack fontSize="medium" />
            </IconButton>
          )}
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
                  width: 48,
                  height: 48,
                }}
                alt={userToChat.username}
                src={userToChat.avatar}
              />
            </Badge>
          ) : (
            <Avatar
              sx={{
                width: 48,
                height: 48,
              }}
              alt={userToChat.username}
              src={userToChat.avatar}
            />
          )}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: isSmallMobile
                ? "calc(100vw - 175px)"
                : isMobile
                ? "calc(100vw - 190px)"
                : "100%",
            }}
          >
            <Box
              sx={{
                marginLeft: "10px",
                flex: 1,
                minWidth: 0,
              }}
            >
              <Typography
                variant="body1"
                noWrap
                sx={{
                  fontWeight: 600,
                  letterSpacing: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userToChat.username}
              </Typography>

              <Typography
                variant="body2"
                noWrap
                color="gray"
                sx={{
                  letterSpacing: 0.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {userToChat.isActive
                  ? "Đang hoạt động"
                  : `Hoạt động ${getTimeAgoInVietnamese(
                      userToChat.lastActiveAt
                    )}`}
                {isMuteConversation && (
                  <NotificationsOff
                    sx={{
                      fontSize: "16px",
                      color: "lightgray",
                      marginLeft: "5px",
                    }}
                  />
                )}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 0.5, sm: 1 },
                flexWrap: "wrap",
                justifyContent: { xs: "flex-end", sm: "flex-start" },
              }}
            >
              <Tooltip title="Bắt đầu gọi thoại" arrow>
                <IconButton
                  color="primary"
                  disabled={checkBlocked.isBlocked ? true : false}
                  sx={{
                    fontSize: { xs: "18px", sm: "24px" },
                    padding: { xs: "5px", sm: "8px" },
                  }}
                  onClick={() => handleCall()}
                >
                  <CallIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bắt đầu gọi video" arrow>
                <IconButton
                  color="primary"
                  disabled={checkBlocked.isBlocked ? true : false}
                  sx={{
                    fontSize: { xs: "18px", sm: "24px" },
                    padding: { xs: "5px", sm: "8px" },
                  }}
                  onClick={() => handleCallVideo()}
                >
                  <VideocamIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Thông tin về cuộc trò chuyện" arrow>
                <IconButton
                  color="primary"
                  disabled={checkBlocked.isBlocked ? true : false}
                  onClick={() => handleShowChatInfo()}
                  sx={{
                    fontSize: { xs: "18px", sm: "24px" },
                    padding: { xs: "5px", sm: "8px" },
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* list Chats */}
        {isSearching && listMessageToSeach.length > 0 ? (
          <ChatSearchList />
        ) : (
          <Box
            sx={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}
            ref={messageListRef}
          >
            {listChats.length === 0 ? (
              <Box
                sx={{
                  textAlign: "center",
                  padding: "40px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <img
                  src="https://cdn.pixabay.com/animation/2023/03/29/06/48/06-48-15-574_512.gif"
                  alt="No messages"
                  style={{
                    width: 150,
                    height: 150,
                    objectFit: "cover",
                    marginBottom: "20px",
                  }}
                />
                <Typography
                  variant="h5"
                  color="textSecondary"
                  sx={{ marginBottom: "10px" }}
                >
                  Không có tin nhắn nào
                </Typography>
                <Typography
                  variant="body1"
                  color="gray"
                  sx={{ marginBottom: "20px" }}
                >
                  Hãy bắt đầu cuộc trò chuyện với bạn bè hoặc đồng nghiệp của
                  bạn.
                </Typography>
              </Box>
            ) : (
              listChats
                .slice()
                .reverse()
                .map((msg, index) => {
                  const isNewSender = msg.sender !== previousSender;
                  previousSender = msg.sender;

                  return (
                    <Box key={index}>
                      {showStatus === index && !isNewSender && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "gray",
                            width: "100%",
                            mt: 2,
                            mb: 1,
                            fontFamily:
                              "'Google Sans', 'Helvetica Neue', sans-serif",
                          }}
                        >
                          {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                        </Box>
                      )}

                      {isNewSender && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            fontSize: "12px",
                            color: "gray",
                            width: "100%",
                            mt: 2,
                            mb: 2,
                            fontFamily:
                              "'Google Sans', 'Helvetica Neue', sans-serif",
                          }}
                        >
                          {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                        </Box>
                      )}

                      <Box
                        sx={{
                          display: "flex",
                          flexDirection:
                            msg.sender === clientInfo.user._id
                              ? "row-reverse"
                              : "row",
                          marginBottom: "3px",
                          position: "relative",
                        }}
                      >
                        {isNewSender ? (
                          <Avatar
                            alt={
                              msg.sender === clientInfo.user._id
                                ? clientInfo.user.username
                                : userToChat.username
                            }
                            src={
                              msg.sender === clientInfo.user._id
                                ? clientInfo.user.avatar
                                : userToChat.avatar
                            }
                            sx={{ width: 30, height: 30 }}
                          />
                        ) : (
                          <Box sx={{ width: 30 }} />
                        )}

                        <Box
                          sx={{
                            marginLeft:
                              msg.sender === clientInfo.user._id ? 0 : "10px",
                            marginRight:
                              msg.sender === clientInfo.user._id ? "10px" : 0,
                            position: "relative",
                          }}
                        >
                          <MessageBox
                            prevMsg={reversedList[index - 1]}
                            msg={msg}
                            clientInfo={clientInfo}
                            index={index}
                            showStatus={showStatus}
                            setShowStatus={setShowStatus}
                            handleCall={handleCall}
                            handleCallVideo={handleCallVideo}
                          />

                          {!(
                            !listChats[index + 1] &&
                            msg.sender === clientInfo.user._id
                          ) &&
                            showStatus === index &&
                            msg.receiver !== clientInfo.user._id && (
                              <Typography
                                variant="caption"
                                color="gray"
                                sx={{
                                  display: "block",
                                  textAlign:
                                    msg.sender === clientInfo.user._id
                                      ? "right"
                                      : "left",
                                }}
                              >
                                {msg.status === "read"
                                  ? "Đã xem"
                                  : msg.status === "sent"
                                  ? "Đã gửi"
                                  : "Đang gửi"}
                              </Typography>
                            )}

                          {!listChats[index + 1] &&
                            msg.sender === clientInfo.user._id && (
                              <Typography
                                variant="caption"
                                color="gray"
                                sx={{
                                  display: "block",
                                  textAlign:
                                    msg.sender === clientInfo.user._id
                                      ? "right"
                                      : "left",
                                }}
                              >
                                {msg.status === "read"
                                  ? "Đã xem"
                                  : msg.status === "sent"
                                  ? "Đã gửi"
                                  : "Đang gửi"}
                              </Typography>
                            )}
                        </Box>
                      </Box>
                    </Box>
                  );
                })
            )}

            <div ref={messageEndRef} />
            {isTyping && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <Avatar
                  alt={userToChat.username}
                  src={userToChat.avatar}
                  sx={{ width: { xs: 20, sm: 30 }, height: { xs: 20, sm: 30 } }}
                />
                <Box
                  sx={{
                    backgroundColor: "#f7f7f7",
                    borderRadius: "10px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                    height: { xs: 20, sm: 25 },
                  }}
                >
                  <Spinner />
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Input Field */}
        {!checkBlocked?.isBlocked ? (
          isRecording ? (
            <VoiceRecorder handleSendMessage={handleSendMessage} />
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "5px 0px",
                borderTop: "1.6px solid #f2f0f0",
                position: "relative",
                width: isSmallMobile ? "95%" : "100%",
                justifyContent: "space-between",
              }}
            >
              {selectedFile && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    maxWidth: "70%",
                  }}
                >
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      style={{
                        maxWidth: "100px",
                        maxHeight: "100px",
                        borderRadius: "8px",
                        marginRight: "10px",
                      }}
                    />
                  ) : (
                    <Typography
                      sx={{
                        fontSize: { xs: "12px", sm: "14px" },
                        color: "#333",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "80%",
                      }}
                    >
                      {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(2)} KB)
                    </Typography>
                  )}
                  <IconButton
                    size="small"
                    onClick={handleRemoveFile}
                    sx={{
                      marginLeft: "10px",
                      color: "#f44336",
                      "&:hover": {
                        color: "#d32f2f",
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px",
                  width: isSmallMobile ? "95%" : "100%",
                }}
              >
                <FileUploader />

                <Tooltip title="Ghi âm" placement="top" arrow>
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
                      ml: 1,
                    }}
                    onClick={() => setIsRecording(true)}
                  >
                    <Mic sx={{ fontSize: { sx: 25, sm: 30 } }} />
                  </IconButton>
                </Tooltip>

                <TextField
                  fullWidth
                  variant="outlined"
                  size="small"
                  placeholder="Nhập tin nhắn..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  sx={{
                    marginRight: "10px",
                    marginLeft: "10px",
                    fontSize: { xs: "12px", sm: "14px" },
                    maxWidth: { xs: "70%", sm: "100%" },
                  }}
                />

                <IconButton
                  onClick={() => handleSendMessage()}
                  sx={{
                    color: "#1976d2",
                    padding: "8px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      color: "#1565c0",
                      boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.2)",
                      transform: "scale(1.1)",
                    },
                  }}
                >
                  <Send sx={{ fontSize: { xs: "20px", sm: "24px" } }} />
                </IconButton>
              </Box>
            </Box>
          )
        ) : checkBlocked.blockedBy === clientInfo.user._id ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body1" fontWeight="bold" mb={1}>
              Bạn đã chặn tin nhắn và cuộc gọi từ tài khoản Chattio của{" "}
              {userToChat.username}
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Các bạn sẽ không thể nhắn tin hay gọi điện cho nhau trong đoạn
              chat này
            </Typography>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleUnblockClick}
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              Bỏ chặn
            </Button>

            {/* Dialog Bỏ chặn */}
            <Dialog
              open={openDialog}
              onClose={handleCloseDialog}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle
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
                <Typography sx={{ fontSize: "18px" }} fontWeight="bold">
                  Bỏ chặn {userToChat.username}?
                </Typography>
                <IconButton
                  onClick={() => handleCloseDialog()}
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
                  Tài khoản Chattio của bạn sẽ bắt đầu nhận được tin nhắn hoặc
                  cuộc gọi từ tài khoản Chattio của {userToChat.username}
                </Typography>
              </DialogContent>
              <DialogActions sx={{ display: "flex" }}>
                <Button
                  onClick={() => handleCloseDialog()}
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
                  onClick={() => handleUnBlockUser()}
                >
                  Bỏ chặn
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="textSecondary"
            align="center"
            sx={{
              fontWeight: 500,
              color: "grey.500",
              mt: 2,
            }}
          >
            Hiện không thể liên lạc với người dùng này trên Chattio
          </Typography>
        )}
      </Box>
    </React.Fragment>
  );
};

export default ChatUI;
