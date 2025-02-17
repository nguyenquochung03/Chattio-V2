import {
  Avatar,
  Badge,
  Box,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import moment from "moment";
import { Group, Search } from "@mui/icons-material";
import { useResponsive } from "../contexts/ResponsiveContext";
import { useHome } from "../contexts/HomeContext";
import { useFriend } from "../contexts/FriendContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useLoading } from "../contexts/LoadingContext";
import { useUser } from "../contexts/UserContext";
import { useChat } from "../contexts/ChatContext";
import { useSocket } from "../contexts/SocketContext";
import { getTimeAgoInVietnamese } from "../utils/Time";
import { splitStringByDash } from "../utils/stringUtils";

const ListFriends = ({ setIsShowChat, setIsShowList, setUserToChat }) => {
  // Thông tin tìm kiếm
  const [searchFriend, setSearchFriend] = useState("");
  // Xử lý khi kéo danh sách xuống
  const [scrollState, setScrollState] = useState(false);
  // Lưu lại để lấy thêm người dùng
  const [hasMoreFriends, setHasMoreFriends] = useState(true);

  // Sử dụng hook
  const {
    listFriends,
    setListFriends,
    listFriendsPage,
    setListFriendsPage,
    isLoadedListFriends,
    setIsLoadedListFriends,
    selectedFriendId,
    setSelectedFriendId,
    lastMessagesMap,
    setLastMessagesMap,
    isLoadedLastMessagesMap,
    setIsLoadedLastMessagesMap,
    setListChats,
    setConversation,
    setselectedChat,
    isSearchFriend,
    setIsSearchFriend,
    searchFriendsData,
    setSearchFriendsData,
    setListChatsPage,
    setHasMoreChats,
    setIsShowChatInfo,
    setIsMuteConversation,
    setMuteNotificationValue,
    isLoadedConversationForFirstTime,
    setIsLoadedConversationForFirstTime,
    setCheckBlocked,
    isLoadedCheckBlocked,
    setIsLoadedCheckBlocked,
    isSearching,
    setIsSearching,
    setListMediaFile,
    setListRawFile,
  } = useHome();

  const friendRef = useRef(null);
  const { isLargeMobile, isTablet, isSmallMobile } = useResponsive();
  const { isSidebarHidden } = useHome();
  const friendContext = useFriend();
  const chatContext = useChat();
  const clientInfo = useClientInfo();
  const { isLoading } = useLoading();
  const userContext = useUser();
  const socket = useSocket();

  useEffect(() => {
    const fetchListFriends = async () => {
      const result = await friendContext.fetchFriends(1);

      if (result.success) {
        setListFriends(result.data);
      }
    };

    if (clientInfo.user._id && !isLoadedListFriends) {
      setIsLoadedListFriends(true);
      fetchListFriends();
    }
  }, [clientInfo.user._id]);

  useEffect(() => {
    const fetchConversation = async () => {
      // Tải cuộc hội thoại và đoạn chat với người dùng này
      const fetchConversation = await chatContext.fetchConversation(
        listFriends[0]._id
      );

      if (!fetchConversation.success) {
        return;
      }
      setConversation(fetchConversation.data);

      // Kiểm tra thông báo của cuộc hội thoại
      const checkMute = await chatContext.fetchCheckMuteConversation(
        fetchConversation.data._id
      );

      if (checkMute.success) {
        if (checkMute.data.duration === -1) {
          setMuteNotificationValue("indefinite");
          setIsMuteConversation(true);
        } else {
          setMuteNotificationValue(checkMute.data.duration);
          setIsMuteConversation(checkMute.data.isMuted);
        }
      } else {
        setMuteNotificationValue(15);
        setIsMuteConversation(false);
      }

      const fetchGetMediaFile = await chatContext.fetchGetMediaFile(
        fetchConversation.data._id
      );

      if (!fetchGetMediaFile.success) {
        return;
      }

      setListMediaFile(fetchGetMediaFile.data);

      const fetchGetRawFile = await chatContext.fetchGetRawFile(
        fetchConversation.data._id
      );

      if (!fetchGetRawFile.success) {
        setListRawFile([]);
        return;
      }
      setListRawFile(fetchGetRawFile.data);
    };

    if (listFriends[0]?._id && !isLoadedConversationForFirstTime) {
      setIsLoadedConversationForFirstTime(true);
      fetchConversation();
    }
  }, [listFriends]);

  useEffect(() => {
    const fetchCheckBlocked = async () => {
      // Lấy thông tin quan hệ bạn bè
      const fetchCheckBlocked = await friendContext.fetchCheckBlock(
        clientInfo.user._id,
        listFriends[0]._id
      );

      if (fetchCheckBlocked.success) {
        setIsShowChatInfo(false);
        setCheckBlocked(fetchCheckBlocked.data);
      }
    };

    if (listFriends[0]?._id && clientInfo.user._id && !isLoadedCheckBlocked) {
      setIsLoadedCheckBlocked(true);
      fetchCheckBlocked();
    }
  }, [listFriends, clientInfo.user._id]);

  useEffect(() => {
    const fetchMessagesForAllFriends = async () => {
      const updatedFriendsList = [...listFriends];
      const updatedLastMessagesMap = [...lastMessagesMap];

      for (let i = 0; i < updatedFriendsList.length; i++) {
        const friend = updatedFriendsList[i];
        const receiverId = friend._id;

        // Lấy thông tin cuộc trò chuyện
        const conversationResult = await chatContext.fetchConversation(
          receiverId
        );

        if (conversationResult.success) {
          const conversationId = conversationResult.data._id;

          // Lấy tin nhắn cuối cùng
          const lastMessageResult =
            await chatContext.fetchLastMessageFromConversationById(
              conversationId
            );

          if (lastMessageResult.success) {
            const updatedFriend = {
              friendId: friend._id,
              lastMessage: lastMessageResult.data,
            };

            const existingFriendIndex = updatedLastMessagesMap.findIndex(
              (item) => item.friendId === friend._id
            );
            if (existingFriendIndex !== -1) {
              updatedLastMessagesMap[existingFriendIndex] = updatedFriend;
            } else {
              updatedLastMessagesMap.push(updatedFriend);
            }
          } else {
            const emptyFriend = {
              friendId: friend._id,
              lastMessage: null,
            };

            const existingFriendIndex = updatedLastMessagesMap.findIndex(
              (item) => item.friendId === friend._id
            );
            if (existingFriendIndex !== -1) {
              updatedLastMessagesMap[existingFriendIndex] = emptyFriend;
            } else {
              updatedLastMessagesMap.push(emptyFriend);
            }
          }
        }
      }

      setLastMessagesMap(updatedLastMessagesMap);
    };

    if (listFriends.length > 0 && !isLoadedLastMessagesMap) {
      fetchMessagesForAllFriends();
      setIsLoadedLastMessagesMap(true);
    }
  }, [listFriends, lastMessagesMap, isLoadedLastMessagesMap]);

  useEffect(() => {
    const boxFriendsElement = friendRef.current;

    if (boxFriendsElement) {
      boxFriendsElement.addEventListener("scroll", handleFriendsScroll);

      return () => {
        boxFriendsElement.removeEventListener("scroll", handleFriendsScroll);
      };
    }
  }, [hasMoreFriends, isLoading]);

  useEffect(() => {
    if (searchFriend.length === 0) {
      setSearchFriendsData([]);
      setIsSearchFriend(false);
    }
  }, [searchFriend]);

  const handleSearchFriend = async () => {
    if (searchFriend.length === 0) return;

    const result = await userContext.fetchSearchFriends(searchFriend);

    if (result.success) {
      setSearchFriendsData(result.data);
      setIsSearchFriend(true);
    } else {
      setSearchFriendsData([]);
      setIsSearchFriend(false);
    }
  };

  const handleKeyDown = async (e, type) => {
    if (e.key === "Enter") {
      await handleSearchFriend();
    }
  };

  const loadMoreFriends = async () => {
    const result = await friendContext.fetchFriends(listFriendsPage);

    if (result.success) {
      if (result.data.length < 18) {
        setHasMoreFriends((prev) => !prev);
      }
      setListFriends((prev) => [...prev, ...result.data]);
      setListFriendsPage((prev) => prev + 1);
    }
  };

  const handleFriendsScroll = useCallback(() => {
    if (friendRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = friendRef.current;

      setScrollState(scrollTop > 0);

      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        hasMoreFriends &&
        !isLoading
      ) {
        loadMoreFriends();
      }
    }
  }, [hasMoreFriends, isLoading]);

  const handleSelectFriendToChat = async (friend, index) => {
    // Cập nhật đoạn chat nào đã được chọn
    setselectedChat(friend._id);
    setListChatsPage(2);
    setHasMoreChats(true);
    // Tùy chỉnh giao diện
    if (isTablet && !isSidebarHidden) {
      setIsShowChat(true);
      setIsShowList(false);
      if (isSearching) {
        setIsShowChatInfo(false);
      }
    }
    if (isLargeMobile) {
      setIsShowChat(true);
      setIsShowChatInfo(false);
      setIsShowList(false);
    }

    // Nếu đang tìm kiếm thì ẩn đi
    if (isSearching) {
      setIsSearching(false);
    }

    // Cập nhật người dùng sẽ nhắn tin
    setSelectedFriendId(index);
    setUserToChat(friend);

    // Tải cuộc hội thoại và đoạn chat với người dùng này
    const fetchConversation = await chatContext.fetchConversation(friend._id);

    if (!fetchConversation.success) {
      return;
    }
    setConversation(fetchConversation.data);

    // Lấy thông tin quan hệ bạn bè
    const fetchCheckBlocked = await friendContext.fetchCheckBlock(
      clientInfo.user._id,
      friend._id
    );

    if (fetchCheckBlocked.success) {
      if (fetchCheckBlocked.data.isBlocked) {
        setIsShowChatInfo(false);
      }
      setCheckBlocked(fetchCheckBlocked.data);
    }

    // Kiểm tra thông báo của cuộc hội thoại
    const checkMute = await chatContext.fetchCheckMuteConversation(
      fetchConversation.data._id
    );

    if (checkMute.success) {
      if (checkMute.data.duration === -1) {
        setMuteNotificationValue("indefinite");
        setIsMuteConversation(true);
      } else {
        setMuteNotificationValue(checkMute.data.duration);
        setIsMuteConversation(checkMute.data.isMuted);
      }
    } else {
      setMuteNotificationValue(15);
      setIsMuteConversation(false);
    }

    // Cập nhật những tin nhắn đã gửi thành đã xem
    await chatContext.fetchMarkAsRead(fetchConversation.data._id, friend._id);

    socket.emit("read-message", {
      user: friend._id,
      conversationId: fetchConversation.data._id,
    });

    setLastMessagesMap((prevMessages) =>
      prevMessages.map((item) =>
        item.friendId === friend._id
          ? { ...item, lastMessage: { ...item.lastMessage, status: "read" } }
          : item
      )
    );

    const fetchMessages = await chatContext.fetchMessages(friend._id, 1);

    if (!fetchMessages.success) {
      return;
    }

    setListChats(fetchMessages.data);

    const fetchGetMediaFile = await chatContext.fetchGetMediaFile(
      fetchConversation.data._id
    );

    if (!fetchGetMediaFile.success) {
      setListMediaFile([]);
    }

    setListMediaFile(fetchGetMediaFile.data);

    const fetchGetRawFile = await chatContext.fetchGetRawFile(
      fetchConversation.data._id
    );

    if (!fetchGetRawFile.success) {
      setListRawFile([]);
    }

    setListRawFile(fetchGetRawFile.data);

    // Tham gia phòng chat mới
    if (socket) {
      socket.emit("join", { conversationId: fetchConversation.data._id });
    }
  };

  const getLastMessageByFriendId = (friendId) => {
    const friendMessage = lastMessagesMap.find(
      (item) => item.friendId === friendId
    );

    return friendMessage ? friendMessage.lastMessage : null;
  };

  return (
    <Box
      sx={{
        width: isLargeMobile // 650
          ? !isSidebarHidden
            ? "calc(100vw - 50px)"
            : "calc(100vw - 110px)"
          : isTablet && !isSidebarHidden // 950
          ? "calc(100vw - 280px)"
          : "300px",
        maxWidth: "100%",
        bgcolor: "background.paper",
        borderRadius: 3,
        p: isSmallMobile ? 1 : 2,
      }}
    >
      <Typography
        variant="h5"
        component="div"
        sx={{
          fontWeight: "bold",
          color: "text.primary",
          flexGrow: 1,
          mb: 1.5,
        }}
      >
        Đoạn chat
      </Typography>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Tìm kiếm đoạn chat"
        value={searchFriend}
        onChange={(e) => setSearchFriend(e.target.value)}
        sx={{
          mb: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "13px",
            backgroundColor: "#f4f2f5",
            "& fieldset": {
              borderColor: "#fff",
            },
            "&:hover fieldset": {
              borderColor: "#fff",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#fff",
            },
          },
        }}
        onKeyDown={(e) => handleKeyDown(e)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" onClick={handleSearchFriend}>
              <IconButton>
                <Search />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {listFriends.length === 0 && (
        <React.Fragment>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              mt: 6,
              p: 2,
              gap: 2,
            }}
          >
            <Typography
              variant="h6"
              color="text.primary"
              sx={{
                fontSize: "20px",
                fontWeight: 600,
              }}
            >
              Bạn chưa có người bạn nào!
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: "16px",
                fontStyle: "italic",
              }}
            >
              Hãy truy cập vào mục{" "}
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: "#1976d2",
                  fontSize: "16px",
                }}
              >
                Mọi người
              </Typography>
              <Group sx={{ fontSize: 50, color: "#1976d2" }} />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: "15px",
                fontStyle: "italic",
              }}
            >
              để kết bạn nhé!
            </Typography>
          </Box>
        </React.Fragment>
      )}

      {listFriends.length !== 0 && (
        <List
          ref={friendRef}
          sx={{
            height: "calc(100vh - 165px)",
            minWidth: 250,
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#ccc",
              borderRadius: "6px",
            },
            borderTop: scrollState ? "1px solid #e8e9eb" : "none",
          }}
        >
          {isSearchFriend
            ? searchFriendsData.map((friend, index) => (
                <ListItem
                  key={index}
                  alignItems="flex-start"
                  component="li"
                  onClick={() => handleSelectFriendToChat(friend, index)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 3,
                    transition: "background-color 0.3s ease",
                    backgroundColor:
                      selectedFriendId === index ? "#e3f2fd" : "transparent",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  <ListItemAvatar>
                    {friend.isActive ? (
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
                            border: "2px solid white",
                            borderRadius: "50%",
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                          }}
                          alt={friend.username}
                          src={friend.avatar}
                        />
                      </Badge>
                    ) : (
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                        }}
                        alt={friend.username}
                        src={friend.avatar}
                      />
                    )}
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "15px",
                        }}
                        variant="subtitle1"
                        component="div"
                      >
                        {friend.username}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          fontSize: "14px",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: isLargeMobile
                              ? !isSidebarHidden
                                ? "calc(100vw - 50px)"
                                : "calc(100vw - 110px)"
                              : isTablet && !isSidebarHidden
                              ? "calc(100vw - 320px)"
                              : "fit-content",
                            fontSize: "15px",
                            fontWeight:
                              getLastMessageByFriendId(friend._id)?.receiver ===
                                clientInfo.user._id &&
                              getLastMessageByFriendId(friend._id)?.status !==
                                "sent"
                                ? "bold"
                                : "normal",
                          }}
                        >
                          {getLastMessageByFriendId(friend._id)?.message
                            ? (() => {
                                const lastMessage = getLastMessageByFriendId(
                                  friend._id
                                ).message;
                                const sender = getLastMessageByFriendId(
                                  friend._id
                                ).sender;

                                // Tách chuỗi bằng hàm splitStringByDash
                                const { success, data } =
                                  splitStringByDash(lastMessage);

                                // Nếu không tách được hoặc không có đủ dữ liệu
                                if (!success || !data || data.length === 0) {
                                  return sender === clientInfo.user._id
                                    ? `Bạn: ${lastMessage}`
                                    : lastMessage;
                                }

                                if (
                                  data[0] === clientInfo.audioCallSecret &&
                                  data[1] === "successed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi thoại đã được thực hiện"
                                    : "Bạn đã thực hiện cuộc gọi thoại";
                                }

                                if (
                                  data[0] === clientInfo.videoCallSecret &&
                                  data[1] === "successed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi video đã được thực hiện"
                                    : "Bạn đã thực hiện cuộc gọi video";
                                }

                                // Kiểm tra trường hợp audio call
                                if (
                                  data[0] === clientInfo.audioCallSecret &&
                                  data[1] === "failed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi thoại đã bị bỏ lỡ"
                                    : "Bạn đã bị bỏ lỡ cuộc gọi thoại";
                                }

                                // Kiểm tra trường hợp video call
                                if (
                                  data[0] === clientInfo.videoCallSecret &&
                                  data[1] === "failed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi video đã bị bỏ lỡ"
                                    : "Bạn đã bị bỏ lỡ cuộc gọi video";
                                }

                                // Kiểm tra trường hợp video call
                                if (data[0] === clientInfo.fileSecret) {
                                  return sender !== clientInfo.user._id
                                    ? "Bạn đã nhận một file"
                                    : "Bạn đã gửi một file";
                                }

                                // Trường hợp không liên quan đến cuộc gọi
                                return sender === clientInfo.user._id
                                  ? `Bạn: ${lastMessage}`
                                  : lastMessage;
                              })()
                            : "Chưa có tin nhắn"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1, flexShrink: 0, fontSize: "15px" }}
                        >
                          {getLastMessageByFriendId(friend._id)?.createdAt
                            ? getTimeAgoInVietnamese(
                                getLastMessageByFriendId(friend._id).createdAt
                              )
                            : ""}
                        </Typography>
                      </Typography>
                    }
                  />
                </ListItem>
              ))
            : listFriends.map((friend, index) => (
                <ListItem
                  key={index}
                  alignItems="flex-start"
                  component="li"
                  onClick={() => handleSelectFriendToChat(friend, index)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: 3,
                    transition: "background-color 0.3s ease",
                    backgroundColor:
                      selectedFriendId === index ? "#e3f2fd" : "transparent",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  <ListItemAvatar>
                    {friend.isActive ? (
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
                            border: "2px solid white",
                            borderRadius: "50%",
                          },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                          }}
                          alt={friend.username}
                          src={friend.avatar}
                        />
                      </Badge>
                    ) : (
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                        }}
                        alt={friend.username}
                        src={friend.avatar}
                      />
                    )}
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                          fontSize: "15px",
                        }}
                        variant="subtitle1"
                        component="div"
                      >
                        {friend.username}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          fontSize: "14px",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: isLargeMobile
                              ? !isSidebarHidden
                                ? "calc(100vw - 50px)"
                                : "calc(100vw - 110px)"
                              : isTablet && !isSidebarHidden
                              ? "calc(100vw - 320px)"
                              : "fit-content",
                            fontSize: "15px",
                            fontWeight:
                              getLastMessageByFriendId(friend._id)?.receiver ===
                                clientInfo.user._id &&
                              getLastMessageByFriendId(friend._id)?.status ===
                                "sent"
                                ? "bold"
                                : "normal",
                          }}
                        >
                          {getLastMessageByFriendId(friend._id)?.message
                            ? (() => {
                                const lastMessage = getLastMessageByFriendId(
                                  friend._id
                                ).message;
                                const sender = getLastMessageByFriendId(
                                  friend._id
                                ).sender;

                                // Tách chuỗi bằng hàm splitStringByDash
                                const { success, data } =
                                  splitStringByDash(lastMessage);

                                // Nếu không tách được hoặc không có đủ dữ liệu
                                if (!success || !data || data.length === 0) {
                                  return sender === clientInfo.user._id
                                    ? `Bạn: ${lastMessage}`
                                    : lastMessage;
                                }

                                if (
                                  data[0] === clientInfo.audioCallSecret &&
                                  data[1] === "successed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi thoại đã được thực hiện"
                                    : "Bạn đã thực hiện cuộc gọi thoại";
                                }

                                if (
                                  data[0] === clientInfo.videoCallSecret &&
                                  data[1] === "successed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi video đã được thực hiện"
                                    : "Bạn đã thực hiện cuộc gọi video";
                                }

                                // Kiểm tra trường hợp audio call
                                if (
                                  data[0] === clientInfo.audioCallSecret &&
                                  data[1] === "failed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi thoại đã bị bỏ lỡ"
                                    : "Bạn đã bị bỏ lỡ cuộc gọi thoại";
                                }

                                // Kiểm tra trường hợp video call
                                if (
                                  data[0] === clientInfo.videoCallSecret &&
                                  data[1] === "failed"
                                ) {
                                  return sender !== clientInfo.user._id
                                    ? "Cuộc gọi video đã bị bỏ lỡ"
                                    : "Bạn đã bị bỏ lỡ cuộc gọi video";
                                }

                                // Kiểm tra trường hợp video call
                                if (data[0] === clientInfo.fileSecret) {
                                  return sender !== clientInfo.user._id
                                    ? "Bạn đã nhận một file"
                                    : "Bạn đã gửi một file";
                                }

                                // Trường hợp không liên quan đến cuộc gọi
                                return sender === clientInfo.user._id
                                  ? `Bạn: ${lastMessage}`
                                  : lastMessage;
                              })()
                            : "Chưa có tin nhắn"}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 1, flexShrink: 0, fontSize: "15px" }}
                        >
                          {getLastMessageByFriendId(friend._id)?.createdAt
                            ? getTimeAgoInVietnamese(
                                getLastMessageByFriendId(friend._id).createdAt
                              )
                            : ""}
                        </Typography>
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
        </List>
      )}
    </Box>
  );
};

export default ListFriends;
