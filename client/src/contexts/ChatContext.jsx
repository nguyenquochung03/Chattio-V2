import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useClientInfo } from "./ClientInfoContext";
import { useSnackbar } from "./SnackbarContext";
import { useLoading } from "./LoadingContext";

const ChatContext = createContext();

export const useChat = () => {
  return useContext(ChatContext);
};

export const ChatProvider = ({ children }) => {
  const clientInfo = useClientInfo();
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const { showLoading, hideLoading } = useLoading();

  const fetchMessages = async (userId2, page) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/chats/message/getMessagesFromConversation?page=${page}`,
        {
          userId1: clientInfo.user._id,
          userId2: userId2,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi lấy danh sách tin nhắn: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi lấy danh sách tin nhắn:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchConversation = async (receiverId) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/chats/conversation/get`,
        {
          senderId: clientInfo.user._id,
          receiverId: receiverId,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi lấy thông tin cuộc hội thoại: ${err}`,
        "error"
      );
      console.error(`Có lỗi xảy ra khi lấy thông tin cuộc hội thoại:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchMarkAsRead = async (conversationId, user) => {
    showLoading();
    try {
      const response = await axios.put(
        `${clientInfo.serverName}/api/chats/message/maskAsRead/${conversationId}`,
        {
          receiver: clientInfo.user._id,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi trong quá trình cập nhật tin nhắn: ${err}`,
        "error"
      );
      console.error(`Đã xảy ra lỗi trong quá trình cập nhật tin nhắn:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchLastMessageFromConversationById = async (conversationId) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/chats/conversation/getLastMessage/${conversationId}`
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi trong quá trình lấy tin nhắn cuối cùng: ${err}`,
        "error"
      );
      console.error(
        `Đã xảy ra lỗi trong quá trình lấy tin nhắn cuối cùng:`,
        err
      );
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchMuteConversation = async (conversationId, duration) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/chats/conversation/mute`,
        {
          conversationId,
          userId: clientInfo.user._id,
          duration,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi trong quá trình tắt thông báo: ${err}`,
        "error"
      );
      console.error(`Đã xảy ra lỗi trong quá trình tắt thông báo:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchCheckMuteConversation = async (conversationId) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/chats/conversation/checkMute`,
        {
          conversationId,
          userId: clientInfo.user._id,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi trong quá trình thông tin tắt thông báo: ${err}`,
        "error"
      );
      console.error(
        `Đã xảy ra lỗi trong quá trình thông tin tắt thông báo:`,
        err
      );
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchUnMuteConversation = async (conversationId) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/chats/conversation/unMute`,
        {
          conversationId,
          userId: clientInfo.user._id,
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi trong quá trình thông tin tắt thông báo: ${err}`,
        "error"
      );
      console.error(
        `Đã xảy ra lỗi trong quá trình thông tin tắt thông báo:`,
        err
      );
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchSeachMessages = async (conversationId, keyword, page = 1) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/chats/message/searchMessages?conversationId=${conversationId}&keyword=${keyword}&page=${page}`
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi khi tìm tin nhắn trong cuộc hội thoại: ${err}`,
        "error"
      );
      console.error(
        `Đã xảy ra lỗi khi tìm tin nhắn trong cuộc hội thoại:`,
        err
      );
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchFindMessagePage = async (conversationId, messageId) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/chats/message/findMessagePage?conversationId=${conversationId}&messageId=${messageId}`
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi khi tìm tin nhắn trong cuộc hội thoại: ${err}`,
        "error"
      );
      console.error(
        `Đã xảy ra lỗi khi tìm tin nhắn trong cuộc hội thoại:`,
        err
      );
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchFindMessages = async (conversationId, currentPage) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/chats/message/findMessages?conversationId=${conversationId}&currentPage=${currentPage}`
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          pagination: response.data.pagination,
        };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Đã xảy ra lỗi khi tìm tin nhắn trong cuộc hội thoại: ${err}`,
        "error"
      );
      console.error(
        `Đã xảy ra lỗi khi tìm tin nhắn trong cuộc hội thoại:`,
        err
      );
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchUploadFile = async (file) => {
    showLoading();
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${clientInfo.serverName}/api/chats/file/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Đã xảy ra lỗi khi tải tập tin: ${err}`, "error");
      console.error(`Đã xảy ra lỗi khi tải tập tin:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchGetMediaFile = async (conversationId) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/chats/file/getMediaFile/${conversationId}`
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Đã xảy ra lỗi khi tải tập tin: ${err}`, "error");
      console.error(`Đã xảy ra lỗi khi tải tập tin:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchGetRawFile = async (conversationId) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/chats/file/getRawFile/${conversationId}`
      );

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Đã xảy ra lỗi khi tải tập tin: ${err}`, "error");
      console.error(`Đã xảy ra lỗi khi tải tập tin:`, err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  return (
    <ChatContext.Provider
      value={{
        fetchMessages,
        fetchConversation,
        fetchMarkAsRead,
        fetchLastMessageFromConversationById,
        fetchMuteConversation,
        fetchCheckMuteConversation,
        fetchUnMuteConversation,
        fetchSeachMessages,
        fetchFindMessagePage,
        fetchFindMessages,
        fetchUploadFile,
        fetchGetMediaFile,
        fetchGetRawFile,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
