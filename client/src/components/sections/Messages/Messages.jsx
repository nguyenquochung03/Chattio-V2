import React, { useEffect, useState } from "react";
import { Box } from "@mui/material";
import ListFriends from "../../ListFriends";
import ChatUI from "../../ChatUI";
import { useHome } from "../../../contexts/HomeContext";
import { useResponsive } from "../../../contexts/ResponsiveContext";
import ChatInfo from "../../ChatInfo";
import ChatSearch from "../../ChatSearch";

const Messages = () => {
  // Sử dụng hook hỗ trợ
  const {
    isLargeMobile,
    isMobile,
    isTablet,
    isSmallerLaptop,
    isSmallLaptop,
    isLaptop,
  } = useResponsive();
  const {
    isSidebarHidden,
    setUserToChat,
    isShowChat,
    setIsShowChat,
    isShowList,
    setIsShowList,
    isShowChatInfo,
    setIsShowChatInfo,
    setIsSearching,
  } = useHome();

  useEffect(() => {
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (isLaptop) {
      setIsShowChat(true);
      setIsShowList(true);
    }
  }, [isLaptop]);

  useEffect(() => {
    if (isSmallLaptop) {
      setIsShowChat(true);
      setIsShowList(true);
    }
  }, [isSmallLaptop]);

  useEffect(() => {
    if (isSmallerLaptop) {
      setIsShowChat(true);
    }
  }, [isSmallerLaptop]);

  useEffect(() => {
    if (isSmallLaptop && !isSidebarHidden) {
      if (isShowChatInfo) {
        setIsShowChat(false);
      }
    }

    if (isSmallLaptop && isSidebarHidden) {
      if (!isShowChat) {
        setIsShowChat(true);
      }
    }
  }, [isSmallLaptop, isSidebarHidden]);

  useEffect(() => {
    if (isSmallerLaptop) {
      if (isShowChatInfo) {
        setIsShowChat(false);
      }
      setIsShowList(true);
    }
  }, [isSmallerLaptop, isSidebarHidden]);

  useEffect(() => {
    if (isTablet && !isSidebarHidden) {
      if (isShowChatInfo) {
        setIsShowList(false);
        setIsShowChat(false);
      } else if (isShowChat) {
        setIsShowList(false);
        setIsShowChatInfo(false);
      } else {
        setIsShowChatInfo(false);
        setIsShowChat(false);
      }
    }
    if (isTablet && isSidebarHidden) {
      setIsShowChat(true);
      setIsShowList(true);
    }

    if (isTablet) {
      if (isShowChatInfo) {
        setIsShowChat(false);
      }
    }
  }, [isTablet, isSidebarHidden]);

  useEffect(() => {
    if (isLargeMobile) {
      setIsShowChat(true);
    }
  }, [isLargeMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsShowChatInfo(false);
      setIsShowChat(false);
      setIsShowList(true);
    }
  }, [isMobile]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
      }}
    >
      {isShowList && (
        <ListFriends
          setIsShowChat={setIsShowChat}
          setIsShowList={setIsShowList}
          setUserToChat={setUserToChat}
        />
      )}
      {isShowChat && (
        <ChatUI setIsShowChat={setIsShowChat} setIsShowList={setIsShowList} />
      )}
      {isShowChatInfo && (
        <ChatInfo
          setIsShowChat={setIsShowChat}
          setIsShowList={setIsShowList}
          setIsShowChatInfo={setIsShowChatInfo}
        />
      )}
    </Box>
  );
};

export default Messages;
