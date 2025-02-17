import React, { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";

import { useHome } from "../contexts/HomeContext";
import { useLoading } from "../contexts/LoadingContext";
import { useChat } from "../contexts/ChatContext";
import { getTimeAgoInVietnamese } from "../utils/Time";
import { Avatar, Box, Typography } from "@mui/material";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { checkCallStream, checkCallVideoStream } from "../utils/CheckStream";
import { useUser } from "../contexts/UserContext";
import { useSocket } from "../contexts/SocketContext";
import MessageBox from "./MessageBox";

const ChatSearchList = () => {
  // Biến tạm lưu sender trước đó
  let previousSender = null;
  // Ẩn/hiện đã xem hoặc đã gửi
  const [showStatus, setShowStatus] = useState(-1);

  // Sử dụng hook
  const messageListRef = useRef(null);
  const { isLoading } = useLoading();
  const {
    listMessageToSeach,
    setListMessageToSeach,
    userToChat,
    conversation,
    searchQuery,
    searchMessagePages,
    setSearchMessagePages,
    messageToSearch,
    hasMoreNext,
    setHasMoreNext,
    hasMorePrev,
    setHasMorePrev,
    messageRef,
    setCallStatus,
    popupWindow,
    setPopupWindow,
  } = useHome();
  const chatContext = useChat();
  const clientInfo = useClientInfo();
  const userContext = useUser();
  const socket = useSocket();
  const reversedList = listMessageToSeach.slice().reverse();

  useEffect(() => {
    // Focus vào tin nhắn cần tìm sau khi render
    if (messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [messageToSearch]);

  useEffect(() => {
    const boxMessageElement = messageListRef.current;

    if (boxMessageElement) {
      boxMessageElement.addEventListener("scroll", handleChatsScroll);

      return () => {
        boxMessageElement.removeEventListener("scroll", handleChatsScroll);
      };
    }
  }, [hasMoreNext, hasMorePrev, isLoading]);

  const loadMoreChats = async (direction) => {
    // Lưu vị trí cuộn hiện tại
    const chatListContainer = messageListRef.current;
    const previousScrollHeight = chatListContainer.scrollHeight;
    const previousScrollTop = chatListContainer.scrollTop;

    // Xác định hướng tải dữ liệu (cuộn lên hoặc xuống)
    let nextPage;
    if (direction === "up") {
      nextPage = searchMessagePages + 1; // Trang tiếp theo khi cuộn lên
    } else {
      nextPage = searchMessagePages - 1; // Trang trước đó khi cuộn xuống
    }

    const result = await chatContext.fetchFindMessages(
      conversation._id,
      nextPage
    );

    if (result.success) {
      setSearchMessagePages(nextPage);
      if (result.data.length < 20) {
        if (direction === "up") {
          setHasMoreNext((prev) => !prev);
        } else {
          setHasMorePrev((prev) => !prev);
        }
      }

      setListMessageToSeach((prev) => {
        const merged =
          direction === "up"
            ? [...prev, ...result.data]
            : [...result.data, ...prev];

        return Array.from(new Set(merged.map((msg) => msg._id))).map((id) =>
          merged.find((msg) => msg._id === id)
        );
      });

      setTimeout(() => {
        if (direction === "up") {
          chatListContainer.scrollTop =
            chatListContainer.scrollHeight -
            previousScrollHeight +
            previousScrollTop;
        }
      }, 10);
    }
  };

  const handleChatsScroll = useCallback(() => {
    if (messageListRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
      if (scrollTop === 0 && hasMoreNext && !isLoading) {
        loadMoreChats("up");
      }
      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        hasMorePrev &&
        !isLoading
      ) {
        loadMoreChats("down");
      }
    }
  }, [hasMoreNext, hasMorePrev, isLoading]);

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

      // Mở cửa sổ cho cuộc gọi
      if (!popupWindow || popupWindow.closed) {
        // Mở cửa sổ mới nếu nó chưa tồn tại hoặc đã bị đóng
        let popupWindow = window.open(
          `${clientInfo.clientUrl}/videoCall`,
          "mozillaWindow",
          "popup"
        );

        setPopupWindow(popupWindow);
      } else {
        // Kiểm tra xem popupWindow có phải đúng đường dẫn hiện tại
        if (popupWindow.location.href === `${clientInfo.clientUrl}/videoCall`) {
          // Gửi thông điệp "reset" đến popup nếu đường dẫn đúng
          popupWindow.postMessage({ action: "reset" }, "*");
          popupWindow.focus();
        } else {
          // Thay đổi đường dẫn hiện tại thành videoCall nếu đường dẫn không đúng
          popupWindow.location.href = `${clientInfo.clientUrl}/videoCall`;
          popupWindow.focus();
        }
      }

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

      // Mở cửa sổ cho cuộc gọi
      if (!popupWindow || popupWindow.closed) {
        // Mở cửa sổ mới nếu nó chưa tồn tại hoặc đã bị đóng
        let popupWindow = window.open(
          `${clientInfo.clientUrl}/call`,
          "mozillaWindow",
          "popup"
        );

        setPopupWindow(popupWindow);
      } else {
        // Kiểm tra xem popupWindow có phải đúng đường dẫn hiện tại
        if (popupWindow.location.href === `${clientInfo.clientUrl}/call`) {
          // Gửi thông điệp "reset" đến popup nếu đường dẫn đúng
          popupWindow.postMessage({ action: "reset" }, "*");
          popupWindow.focus();
        } else {
          // Thay đổi đường dẫn hiện tại thành videoCall nếu đường dẫn không đúng
          popupWindow.location.href = `${clientInfo.clientUrl}/call`;
          popupWindow.focus();
        }
      }

      socket.emit("init-call", {
        userCall: clientInfo.user,
        userToCall: userToChat,
      });
    }
  };

  return (
    <Box
      sx={{ flexGrow: 1, overflowY: "auto", padding: "10px" }}
      ref={messageListRef}
    >
      {listMessageToSeach
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
                    mb: 1,
                    fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
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
                    mb: 2,
                    fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
                  }}
                >
                  {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm")}
                </Box>
              )}

              <Box
                sx={{
                  display: "flex",
                  flexDirection:
                    msg.sender === clientInfo.user._id ? "row-reverse" : "row",
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
                    marginLeft: msg.sender === clientInfo.user._id ? 0 : "10px",
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
                    !listMessageToSeach[index + 1] &&
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

                  {!listMessageToSeach[index + 1] &&
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
        })}
    </Box>
  );
};

export default ChatSearchList;
