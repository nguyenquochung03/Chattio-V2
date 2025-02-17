import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import { useResponsive } from "../contexts/ResponsiveContext";
import { useHome } from "../contexts/HomeContext";
import { useSocket } from "../contexts/SocketContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useFriend } from "../contexts/FriendContext";
import { useChat } from "../contexts/ChatContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { urlBase64ToUint8Array } from "../utils/stringUtils";
import { useUser } from "../contexts/UserContext";
import IncomingCallDialog from "../components/IncomingCallDialog";
import IncomingNormalCallDialog from "../components/IncomingNormalCallDialog";
import ImageViewer from "../components/ImageViewer";
import { getFileFromMessage } from "../utils/File";
import UpdateProfileDialog from "../components/UpdateProfileDialog";

const HomePage = () => {
  const clientInfo = useClientInfo();
  const responsive = useResponsive();
  const {
    isSidebarHidden,
    friendRequests,
    setFriendRequests,
    sentRequests,
    setSentRequests,
    acceptedConfirms,
    setAcceptedConfirms,
    friends,
    setFriends,
    userToChat,
    setUserToChat,
    isLoadUserToChat,
    setIsLoadUserToChat,
    listFriends,
    setListFriends,
    listChats,
    setListChats,
    setConversation,
    setLastMessagesMap,
    setCheckBlocked,
    setIsShowChatInfo,
    setIsShowIncomingCall,
    setIsShowNormalIncomingCall,
    setUserToCall,
    setCallStatus,
    setListMediaFile,
    setListRawFile,
  } = useHome();
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const friendContext = useFriend();
  const chatContext = useChat();
  const userContext = useUser();
  const socket = useSocket();
  const [isLargeMobile, setIsLargeMobile] = useState(responsive.isLargeMobile);

  useEffect(() => {
    if (clientInfo.user._id) {
      socket.emit("register", { userId: clientInfo.user._id });
      socket.emit("user-online", { userId: clientInfo.user._id });

      if ("serviceWorker" in navigator) {
        // Đăng ký Service Worker
        registerServiceWorker();
      } else {
        alert("Không thể gửi thông báo đẩy trên trình duyệt này");
      }

      if (clientInfo.user.inCall) {
        setIsShowIncomingCall(true);
      }
    }
  }, [clientInfo.user._id]);

  useEffect(() => {
    // Đăng ký sự kiện beforeunload
    const handleBeforeUnload = async () => {
      if (socket && clientInfo.user._id) {
        socket.emit("user-offline", { userId: clientInfo.user._id });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [socket, clientInfo.user._id]);

  useEffect(() => {
    const fetchMessage = async () => {
      const result = await chatContext.fetchMessages(listFriends[0]._id, 1);

      if (result.success) {
        setListChats(result.data);
      }
    };

    const fetchConversation = async () => {
      const result = await chatContext.fetchConversation(listFriends[0]._id);

      if (result.success) {
        setConversation(result.data);

        // Tham gia vào phòng chat
        socket.emit("join", { conversationId: result.data._id.toString() });
      }
    };

    if (listFriends.length > 0 && !isLoadUserToChat) {
      // Cập nhật người dùng sẽ nhắn ở vị trí đầu danh sách
      setUserToChat(listFriends[0]);
      setIsLoadUserToChat(true);
      // Tải tin nhắn với người dùng đó
      fetchMessage();

      // Tải thông tin đoạn chat ở vị trí đầu tiên
      fetchConversation();
    }
  }, [listFriends, isLoadUserToChat]);

  useEffect(() => {
    if (socket) {
      socket.on("add-friend", async (data) => {
        if (clientInfo.user._id) {
          await fetchFriendRequestCount();

          const updatedFriendRequests = [...friendRequests, data.sender];
          setFriendRequests(updatedFriendRequests);
        }
      });

      socket.on("cancel-request", async (data) => {
        if (clientInfo.user._id) {
          await fetchFriendRequestCount();

          const updatedFriendRequests = friendRequests.filter(
            (request) => request._id !== data.sender._id
          );
          setFriendRequests(updatedFriendRequests);
        }
      });

      socket.on("reject-friend-request", async (data) => {
        if (clientInfo.user._id) {
          await fetchSentRequestCount();

          const updatedSentRequests = sentRequests.filter(
            (request) => request._id !== data.receiver._id
          );

          setSentRequests(updatedSentRequests);
        }
      });

      socket.on("accept-friend-request", async (data) => {
        if (clientInfo.user._id) {
          await fetchSentRequestCount();
          await fetchAcceptedRequestCount();

          setAcceptedConfirms([...acceptedConfirms, data.receiver]);

          const updatedSentRequests = sentRequests.filter(
            (request) => request._id !== data.receiver._id
          );

          setSentRequests(updatedSentRequests);

          // Cập nhật danh sách bạn bè
          setFriends([...friends, data.receiver]);
        }
      });

      socket.on("user-online", (data) => {
        if (data.userId === userToChat._id) {
          setUserToChat((prevUser) => ({
            ...prevUser,
            isActive: true,
          }));
        }

        setListFriends((prevFriends) =>
          prevFriends.map((friend) =>
            friend._id === data.userId ? { ...friend, isActive: true } : friend
          )
        );
      });

      socket.on("user-offline", (data) => {
        if (data.userId === userToChat._id) {
          setUserToChat((prevUser) => ({
            ...prevUser,
            isActive: false,
            lastActiveAt: new Date().toISOString(),
          }));
        }

        setListFriends((prevFriends) =>
          prevFriends.map((friend) =>
            friend._id === data.userId ? { ...friend, isActive: false } : friend
          )
        );
      });

      socket.on("friend-request-accepted", (data) => {
        const { friend } = data;
        setListFriends((prev) => {
          const isExist = prev.some((item) => item._id === friend._id);

          if (isExist) return prev;

          return [...prev, friend];
        });
      });

      socket.on("receive-message", async (data) => {
        const { message } = data;

        const type = await getFileFromMessage(message.message);

        if (type && type.success) {
          if (type.type !== "Raw") {
            setListMediaFile((prev) => {
              if (prev.some((item) => item.createdAt === message.createdAt)) {
                return prev;
              }
              return [...prev, message];
            });
          } else if (type.type === "Raw") {
            setListRawFile((prev) => {
              if (prev.some((item) => item.createdAt === message.createdAt)) {
                return prev;
              }
              return [...prev, message];
            });
          }
        }

        setListChats((prev) => {
          const isDuplicate = prev.some(
            (msg) => msg.createdAt === message.createdAt
          );

          if (!isDuplicate) {
            return [message, ...prev];
          }

          return prev;
        });
      });

      socket.on("update-last-message", (data) => {
        const { message, sender } = data;
        setLastMessagesMap((prevMessages) =>
          prevMessages.map((item) =>
            item.friendId === sender
              ? { ...item, lastMessage: { ...item.lastMessage, ...message } }
              : item
          )
        );
      });

      socket.on("block-friend", async (data) => {
        const { userId1, userId2 } = data;

        if (userToChat._id === userId1) {
          // Lấy thông tin quan hệ bạn bè
          const fetchCheckBlocked = await friendContext.fetchCheckBlock(
            userId1,
            userId2
          );

          if (fetchCheckBlocked.success) {
            setIsShowChatInfo(false);
            setCheckBlocked(fetchCheckBlocked.data);
          }
        }
      });

      socket.on("cancel-block-friend", async (data) => {
        const { userId1, userId2 } = data;

        if (userToChat._id === userId1) {
          const fetchCheckBlocked = await friendContext.fetchCheckBlock(
            userId1,
            userId2
          );

          if (fetchCheckBlocked.success) {
            setCheckBlocked(fetchCheckBlocked.data);
          }
        }
      });

      socket.on("read-message", async (data) => {
        const { conversationId } = data;
        setListChats((prevMessages) => {
          return prevMessages.map((message) => {
            if (
              message.conversation === conversationId &&
              message.status === "sent"
            ) {
              return {
                ...message,
                status: "read",
              };
            }
            return message;
          });
        });
      });

      socket.on("init-video-call", (data) => {
        const { from } = data;
        setCallStatus("calling");
        setUserToCall(from);
        setIsShowIncomingCall(true);
      });

      socket.on("init-call", (data) => {
        const { from } = data;
        setCallStatus("calling");
        setUserToCall(from);
        setIsShowNormalIncomingCall(true);
      });

      socket.on("out-init-calling", () => {
        setCallStatus("");
        setUserToCall({});
        setIsShowIncomingCall(false);
        setIsShowNormalIncomingCall(false);
      });
    }
  }, [socket, clientInfo.user._id, sentRequests, userToChat, listChats]);

  useEffect(() => {
    if (clientInfo.user._id) {
      fetchFriendRequestCount();
      fetchSentRequestCount();
      fetchAcceptedRequestCount();
    }
  }, [clientInfo.user._id]);

  useEffect(() => {
    setIsLargeMobile(responsive.isLargeMobile);
  }, [responsive.isLargeMobile]);

  const fetchFriendRequestCount = async () => {
    const result = await friendContext.fetchFriendRequestCount();

    if (result.success) {
      clientInfo.setFriendRequestCount(result.data);
    }
  };

  const fetchSentRequestCount = async () => {
    const result = await friendContext.fetchSentRequestCount();

    if (result.success) {
      clientInfo.setSentRequestCount(result.data);
    }
  };

  const fetchAcceptedRequestCount = async () => {
    const result = await friendContext.fetchAcceptedRequestCount();

    if (result.success) {
      clientInfo.setAcceptedRequestCount(result.data);
    }
  };

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      if ("Notification" in window) {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
          registerPush(registration);
        }
      }
    } catch (error) {
      console.error("Đăng ký Service Worker thất bại:", error);
      showSnackbar(`Đăng ký Service Worker thất bại: ${error}`, "error");
    }
  }

  async function registerPush(registration) {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          clientInfo.PUBLIC_VAPID_KEY
        ),
      });

      await userContext.fetchSaveSubscription(subscription);
    } catch (error) {
      console.error("Failed to subscribe:", error);
      showSnackbar(`Đăng ký Service Worker thất bại: ${error}`, "error");
    }
  }

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f0f4f8",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      <Box
        sx={{
          margin: "10px",
          boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.2)",
          backgroundColor: "white",
          borderRadius: 3,
          position: "absolute",
          top: isLargeMobile ? 0 : 2,
          bottom: isLargeMobile ? 0 : 2,
          left: isLargeMobile ? 0 : 2,
          right: isLargeMobile ? 0 : 2,
          display: "flex",
          flexDirection: "row",
        }}
      >
        {isLargeMobile && !isSidebarHidden && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 998,
              borderRadius: 3,
            }}
          />
        )}

        {/* Sidebar cố định */}
        <Sidebar />

        {/* Nội dung động */}
        <Outlet />

        {/* Hiển thị thông báo cuộc gọi đến */}
        <IncomingCallDialog />
        <IncomingNormalCallDialog />

        {/* Hiển thị hình ảnh khi người dùng nhấn vào một ảnh */}
        <ImageViewer />

        {/* Dialog cập nhật ảnh đại diện người dùng */}
        <UpdateProfileDialog />
      </Box>
    </Box>
  );
};

export default HomePage;
