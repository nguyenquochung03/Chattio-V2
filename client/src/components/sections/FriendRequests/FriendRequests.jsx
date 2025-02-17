import React, { useRef, useState, useEffect, useCallback } from "react";
import { Box, Grid, Card, CardContent, Typography } from "@mui/material";
import { GroupAdd } from "@mui/icons-material";
import { useClientInfo } from "../../../contexts/ClientInfoContext";
import { useResponsive } from "../../../contexts/ResponsiveContext";
import { useLoading } from "../../../contexts/LoadingContext";
import { useFriend } from "../../../contexts/FriendContext";
import { useHome } from "../../../contexts/HomeContext";
import { useSocket } from "../../../contexts/SocketContext";

const FriendRequests = () => {
  // Sử dụng hook/context
  const clientInfo = useClientInfo();
  const { ResponsiveButton } = useResponsive();
  const boxRef = useRef();
  const { isLoading } = useLoading();
  const friendContext = useFriend();
  const {
    friendRequests,
    setFriendRequests,
    friendRequestsPage,
    setFriendRequestsPage,
    isLoadedFriendRequests,
    setIsLoadedFriendRequests,
    friends,
    setFriends,
    setListFriends,
  } = useHome();
  const socket = useSocket();

  // Xử lý khi người dùng cuộn danh sách
  const [scrollState, setScrollState] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const boxElement = boxRef.current;

    boxElement.addEventListener("scroll", handleScroll);

    return () => {
      boxElement.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      const result = await friendContext.fetchFriendRequests(1);

      if (result.success) {
        setFriendRequests(result.data);
        setIsLoadedFriendRequests(true);
      }
    };

    if (clientInfo.user._id && !isLoadedFriendRequests) {
      fetchFriendRequests();
    }
  }, [clientInfo.user._id]);

  const loadMoreFriendRequests = async () => {
    const result = await friendContext.fetchFriendRequests(friendRequestsPage);

    if (result.success) {
      if (result.data.length < 18) {
        setHasMore(false);
      }
      setFriendRequests((prev) => [...prev, ...result.data]);
      setFriendRequestsPage((prev) => prev + 1);
    }
  };

  const handleScroll = useCallback(async () => {
    if (boxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = boxRef.current;

      setScrollState(boxRef.current.scrollTop > 0);

      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        hasMore &&
        !isLoading
      ) {
        await loadMoreFriendRequests();
      }
    }
  }, [hasMore, isLoading]);

  const handleAccept = async (user) => {
    try {
      // Gửi chấp nhận lời mời kết bạn
      const result = await friendContext.fetchAcceptFriendRequest(user._id);

      if (!result.success) {
        console.error("Lỗi khi chấp nhận lời mời kết bạn:", result.message);
        return;
      }

      // Cập nhật số lượng lời mời đã nhận
      const friendRequestCountResult =
        await friendContext.fetchFriendRequestCount();
      if (friendRequestCountResult.success) {
        clientInfo.setFriendRequestCount(friendRequestCountResult.data);
      } else {
        console.error(
          "Lỗi khi lấy số lượng lời mời đã nhận:",
          friendRequestCountResult.message
        );
      }

      // Cập nhật danh sách lời mời đã nhận
      const updatedFriendRequests = friendRequests.filter(
        (request) => request._id.toString() !== user._id.toString()
      );
      setFriendRequests(updatedFriendRequests);

      // Cập nhật danh sách bạn bè
      setFriends([...friends, user]);
      setListFriends((prev) => [...prev, user]);
      if (socket) {
        socket.emit("friend-request-accepted", {
          friend: clientInfo.user,
          to: user._id,
        });
      }
    } catch (error) {
      console.error(
        "Đã xảy ra lỗi khi chấp nhận lời mời kết bạn:",
        error.message
      );
    }
  };

  const handleDecline = async (user) => {
    try {
      // Gửi từ chối lời mời kết bạn
      const result = await friendContext.fetchRejectFriendRequest(user._id);

      if (!result.success) {
        console.error("Lỗi khi từ chối lời mời kết bạn:", result.message);
        return;
      }

      // Cập nhật số lượng lời mời đã nhận
      const friendRequestCountResult =
        await friendContext.fetchFriendRequestCount();
      if (friendRequestCountResult.success) {
        clientInfo.setFriendRequestCount(friendRequestCountResult.data);
      } else {
        console.error(
          "Lỗi khi lấy số lượng lời mời đã nhận:",
          friendRequestCountResult.message
        );
      }

      // Cập nhật danh sách lời mời đã nhận
      const updatedFriendRequests = friendRequests.filter(
        (request) => request._id.toString() !== user._id.toString()
      );
      setFriendRequests(updatedFriendRequests);
    } catch (error) {
      console.error(
        "Đã xảy ra lỗi khi từ chối lời mời kết bạn:",
        error.message
      );
    }
  };

  return (
    <Box sx={{ width: "100%", padding: 2 }}>
      {/* Tiêu đề */}
      <Typography
        variant="h5"
        fontWeight="bold"
        mb={3}
        display="flex"
        alignItems="center"
      >
        <GroupAdd sx={{ marginRight: 1 }} color="primary" />
        Lời mời kết bạn
      </Typography>

      {friendRequests.length === 0 && (
        <Typography
          color="gray"
          align="center"
          style={{
            fontStyle: "italic",
            marginTop: "20px",
            fontSize: "15px",
          }}
        >
          Hiện không có lời mời kết bạn nào
        </Typography>
      )}
      <Box
        ref={boxRef}
        sx={{
          height: "calc(100vh - 125px)",
          overflowY: "auto",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "6px",
          },
          borderTop: scrollState ? "1px solid #e8e9eb" : "none",
          padding: 1,
        }}
      >
        <Grid container spacing={1}>
          {friendRequests.map((user, index) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={index}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                    width: "90%",
                    padding: 2,
                  }}
                >
                  {/* Avatar */}
                  {clientInfo.getAvatarStyle(user)}

                  {/* Username */}
                  <Typography
                    variant="body2"
                    sx={{
                      textAlign: "center",
                      fontWeight: "bold",
                      marginBottom: 1,
                      color: "#333",
                      "&:hover": {
                        textDecoration: "underline",
                        cursor: "pointer",
                      },
                    }}
                    onClick={() => handleViewProfile(user)}
                  >
                    {user.username}
                  </Typography>

                  <Box display="flex" gap={1} width="100%" flexWrap="wrap">
                    <ResponsiveButton
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAccept(user)}
                      sx={{
                        flex: "1 1 auto",
                        minWidth: "100px",
                        padding: "8px 0",
                        textTransform: "none",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        "&:hover": {
                          backgroundColor: "#1976d2",
                        },
                      }}
                    >
                      Chấp nhận
                    </ResponsiveButton>

                    <ResponsiveButton
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDecline(user)}
                      sx={{
                        flex: "1 1 auto", // Linh hoạt theo nội dung
                        minWidth: "100px", // Độ rộng tối thiểu
                        padding: "8px 0",
                        textTransform: "none",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        "&:hover": {
                          backgroundColor: "#fdd",
                        },
                      }}
                    >
                      Từ chối
                    </ResponsiveButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
};

export default FriendRequests;
