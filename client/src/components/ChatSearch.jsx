import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Avatar,
  Button,
  ListItem,
  ListItemAvatar,
  ListItemText,
  List,
} from "@mui/material";
import { Search, Close, ArrowBack } from "@mui/icons-material";
import { useHome } from "../contexts/HomeContext";
import { useChat } from "../contexts/ChatContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { getTimeAgoInVietnamese } from "../utils/Time";
import { useLoading } from "../contexts/LoadingContext";
import { useResponsive } from "../contexts/ResponsiveContext";

const ChatSearch = () => {
  // Dữ liệu tìm kiếm
  const [searchResults, setSearchResults] = useState([]);
  // Số trang đã load đến
  const [searchPages, setSearchPages] = useState(1);
  // Có tải thêm dữ liệu nữa không
  const [hasMoreSearchData, setHasMoreSearchData] = useState(true);
  // Đang chọn tìm tin nhắn nào
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);

  // Kiểm tra đã tìm kiếm chưa
  const [isSearched, setIsSearched] = useState(false);

  // Sử dụng hook
  const searchRef = useRef(null);
  const {
    isSidebarHidden,
    setIsSearching,
    conversation,
    userToChat,
    setIsShowChat,
    setIsShowChatInfo,
    setListMessageToSeach,
    searchQuery,
    setSearchQuery,
    setSearchMessagePages,
    setHasMoreNext,
    setHasMorePrev,
    setMessageToSearch,
    setListChats,
    setHasMoreChats,
    setListChatsPage,
  } = useHome();
  const chatContext = useChat();
  const clientInfo = useClientInfo();
  const { isLoading } = useLoading();
  const { isSmallLaptop, isLaptop } = useResponsive();

  useEffect(() => {
    setListMessageToSeach([]);
    setSearchQuery("");
  }, []);

  useEffect(() => {
    const boxSearchElement = searchRef.current;

    if (boxSearchElement) {
      boxSearchElement.addEventListener("scroll", handleSearchScroll);

      return () => {
        boxSearchElement.removeEventListener("scroll", handleSearchScroll);
      };
    }
  }, [hasMoreSearchData, isLoading]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setIsSearched(false);
    }
  }, [searchQuery]);

  const handleSearch = async () => {
    if (searchQuery.trim().length === 0) return;

    setIsSearched(true);

    const result = await chatContext.fetchSeachMessages(
      conversation._id,
      searchQuery,
      searchPages
    );

    if (result.success) {
      setSearchResults(result.data);
    }
  };

  const loadMoreSearchData = async () => {
    const result = await chatContext.fetchSeachMessages(
      conversation._id,
      searchQuery,
      searchPages
    );

    if (result.success) {
      if (result.data.length < 15) {
        setHasMoreSearchData((prev) => !prev);
      }
      setSearchResults((prev) => [...prev, ...result.data]);
      setSearchPages((prev) => prev + 1);
    }
  };

  const handleSearchScroll = useCallback(() => {
    if (searchRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = searchRef.current;

      if (
        scrollTop + clientHeight >= scrollHeight - 50 &&
        hasMoreSearchData &&
        !isLoading
      ) {
        loadMoreSearchData();
      }
    }
  }, [hasMoreSearchData, isLoading]);

  const handleSelectToSearchMessage = async (result, index) => {
    setMessageToSearch(result);
    setSelectedMessageIndex(index);
    const searchRe = await chatContext.fetchFindMessagePage(
      conversation._id,
      result._id
    );
    if (searchRe.success) {
      // Lưu lại trang đã load
      setSearchMessagePages(searchRe.pagination.currentPage);
      setHasMoreNext(searchRe.pagination.hasMoreNext);
      setHasMorePrev(searchRe.pagination.hasMorePrev);

      // Lưu lại dữ liệu
      setListMessageToSeach(searchRe.data);

      // Tùy chỉnh giao diện
      if (!(isLaptop || (isSmallLaptop && isSidebarHidden))) {
        setIsShowChatInfo(false);
        setIsShowChat(true);
      }
    }
  };

  const handleClearSearch = async () => {
    setSearchQuery("");
    setSearchResults([]);
    setListMessageToSeach([]);

    setListChatsPage(2);
    setHasMoreChats(true);

    const fetchMessages = await chatContext.fetchMessages(userToChat._id, 1);

    if (!fetchMessages.success) {
      return;
    }

    setListChats(fetchMessages.data);
  };

  const handleCancelSearchMessage = async () => {
    setIsSearching(false);
    setListMessageToSeach([]);
    setSearchQuery("");

    setListChatsPage(2);
    setHasMoreChats(true);

    const fetchMessages = await chatContext.fetchMessages(userToChat._id, 1);

    if (!fetchMessages.success) {
      return;
    }

    setListChats(fetchMessages.data);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton
          onClick={() => handleCancelSearchMessage()}
          size="small"
          sx={{
            "&:hover": {
              bgcolor: "#f2f4f5",
            },
          }}
        >
          <Close />
        </IconButton>

        <Typography
          fontWeight={550}
          ml={1.5}
          sx={{
            letterSpacing: "0.5px",
            fontSize: "18px",
          }}
        >
          Tìm kiếm
        </Typography>
      </Box>

      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Tìm kiếm trong cuộc trò chuyện"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
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
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment
              position="end"
              sx={{
                marginRight: 0,
                padding: 0,
              }}
            >
              <IconButton
                onClick={handleClearSearch}
                sx={{
                  padding: 0.5,
                  marginRight: "-4px",
                }}
              >
                <Close />
              </IconButton>
            </InputAdornment>
          ),
        }}
        helperText={searchQuery && !isSearched && 'Nhấn "Enter" để tìm kiếm'}
        FormHelperTextProps={{
          sx: {
            textAlign: "center",
            mt: 1,
            fontSize: "13px",
            color: "gray",
          },
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
      />

      {isSearched && (
        <>
          {searchResults.length === 0 ? (
            <Typography mt={1}>
              {searchResults.length > 0
                ? `${
                    searchResults.length > 50 ? "Hơn 50" : searchResults.length
                  } kết quả`
                : "Không tìm thấy kết quả nào"}
            </Typography>
          ) : (
            <List
              ref={searchRef}
              mt={2}
              sx={{
                width: "100%",
                height: "calc(100vh - 160px)",
                overflowY: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  overflowY: "auto",
                },
                "&::-webkit-scrollbar": {
                  width: "8px",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                },
                "&:hover::-webkit-scrollbar": {
                  opacity: 1,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#ccc",
                  borderRadius: "6px",
                },
              }}
            >
              {searchResults.map((result, index) => (
                <ListItem
                  key={index}
                  alignItems="flex-start"
                  sx={{
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
                    padding: "5px 10px",
                    cursor: "pointer",
                    backgroundColor:
                      selectedMessageIndex === index ? "#f0f0f0" : "#fff",
                    borderRadius: "8px",
                    transition:
                      "background-color 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                    "&:active": {
                      backgroundColor:
                        selectedMessageIndex !== index ? "#d9d8d7" : "#f0f0f0",
                    },
                  }}
                  onClick={() => handleSelectToSearchMessage(result, index)}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={
                        result.sender === clientInfo.user._id
                          ? clientInfo.user.avatar
                          : userToChat.avatar
                      }
                      alt={
                        result.sender === clientInfo.user._id
                          ? clientInfo.user.username
                          : userToChat.username
                      }
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography fontWeight="bold">
                        {result.sender === clientInfo.user._id
                          ? clientInfo.user.username
                          : userToChat.username}
                      </Typography>
                    }
                    secondary={
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        component={"span"}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          component="span"
                        >
                          {result.message.split(" ").map((word, index) => {
                            if (
                              searchQuery &&
                              word
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            ) {
                              return (
                                <span
                                  key={index}
                                  style={{
                                    fontWeight: "bold",
                                    color: "#52504c",
                                  }}
                                >
                                  {word}{" "}
                                </span>
                              );
                            }
                            return word + " ";
                          })}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          component="span"
                        >
                          {getTimeAgoInVietnamese(result.createdAt)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );
};

export default ChatSearch;
