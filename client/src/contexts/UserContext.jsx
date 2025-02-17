import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { UAParser } from "ua-parser-js";
import { useLoading } from "./LoadingContext";
import { useClientInfo } from "./ClientInfoContext";
import { useSnackbar } from "./SnackbarContext";
import { data, useLocation } from "react-router-dom";

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const { showSnackbar, hideSnackbar } = useSnackbar();
  const { showLoading, hideLoading } = useLoading();
  const clientInfo = useClientInfo();
  const location = useLocation();

  useEffect(() => {
    const checkLastLogin = async () => {
      if (clientInfo.token.length !== 0) {
        const result = await fetchMe();

        if (result.success) {
          if (!result.data.isRemember) {
            clientInfo.removeToken();
          } else {
            clientInfo.setUser(result.data);
          }
        } else {
          clientInfo.removeToken();
        }
      }
    };

    checkLastLogin();
  }, []);

  useEffect(() => {
    const fetchTokenFromGoogleCallback = async () => {
      if (!location.search.includes("code")) {
        return;
      }

      showLoading();
      try {
        const response = await axios.get(
          `${clientInfo.serverName}/api/users/auth/google/callback${location.search}`
        );

        if (response.data.success) {
          clientInfo.saveToken(response.data.data);
          showSnackbar(response.data.message, "success");
        } else {
          showSnackbar(response.data.message, "error");
        }
      } catch (error) {
        console.error("Lỗi khi xử lý callback:", error);
        showSnackbar("Lỗi khi xử lý callback", "error");
      } finally {
        hideLoading();
      }
    };

    fetchTokenFromGoogleCallback();
  }, [location]);

  const fetchRegister = async (username, email, password) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/users/auth/register`,
        {
          username,
          email,
          password,
        }
      );

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi đăng ký. Vui lòng thử lại ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi đăng ký:", err);
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchLogin = async (email, password, isRemember) => {
    showLoading();
    try {
      // Lấy địa chỉ IP
      const ipRes = await axios.get("https://api.ipify.org?format=json");
      const ipAddress = ipRes.data.ip;

      // Lấy thông tin thiết bị
      const parser = new UAParser();
      const deviceInfo = parser.getResult();

      // Thời gian đăng nhập
      const loggedAt = new Date().toISOString();

      const response = await axios.post(
        `${clientInfo.serverName}/api/users/auth/login`,
        {
          email,
          password,
          isRemember,
          ipAddress,
          deviceInfo,
          loggedAt,
        }
      );

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        clientInfo.setEmailLogin(email);
        clientInfo.setTempToken(response.data.data);

        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi đăng nhập:", err);
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchSendVerificationEmail = async (email) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/users/auth/sendVerificationEmail`,
        {
          email,
        }
      );

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi gửi mã xác nhận đến email. Vui lòng thử lại ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi gửi mã xác nhận đến email:", err);
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchVerifyUser = async (email, verificationCode) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/users/auth/confirmEmail`,
        {
          email,
          verificationCode,
        }
      );

      if (response.data.success) {
        clientInfo.setUser(response.data.data);
        showSnackbar(response.data.message, "success");
        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi xác nhận. Vui lòng thử lại ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi gửi xác nhận:", err);
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchValidateToken = async (token) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/auth/validateToken?token=${token}`
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi kiểm tra token ${err}`, "error");
      console.error("Có lỗi xảy ra khi kiểm tra token:", err);
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchSendPasswordResetEmail = async (email) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/users/auth/sendPasswordResetEmail`,
        { email }
      );

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi gửi link đổi mật khẩu đến ${email}: ${err}`,
        "error"
      );
      console.error(
        `Có lỗi xảy ra khi gửi link đổi mật khẩu đến ${email}:`,
        err
      );
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchUpdatePassword = async (userId, password) => {
    showLoading();
    try {
      const response = await axios.put(
        `${clientInfo.serverName}/api/users/auth/updatePassword/${userId}`,
        { password }
      );

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi gửi link đổi mật khẩu đến ${email}: ${err}`,
        "error"
      );
      console.error(
        `Có lỗi xảy ra khi gửi link đổi mật khẩu đến ${email}:`,
        err
      );
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchGoogleLogin = async (rememberMe) => {
    showLoading();
    try {
      // Lấy địa chỉ IP
      const ipRes = await axios.get("https://api.ipify.org?format=json");
      const ipAddress = ipRes.data.ip;

      // Lấy thông tin thiết bị
      const parser = new UAParser();
      const deviceInfo = parser.getResult();

      // Thời gian đăng nhập
      const loggedAt = new Date().toISOString();

      // Chuyển hướng đến Google OAuth với dữ liệu đính kèm
      window.location.href = `${
        clientInfo.serverName
      }/api/users/auth/google?isRemember=${rememberMe}&ipAddress=${ipAddress}&deviceInfo=${encodeURIComponent(
        JSON.stringify(deviceInfo)
      )}&loggedAt=${loggedAt}`;

      showSnackbar("Đang chuyển hướng để đăng nhập với Google...", "info");
      return true;
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi đăng nhập bằng Google: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi đăng nhập bằng Google: ${err}`, "error");
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchFacebookLogin = async (rememberMe) => {
    showLoading();
    try {
      // Lấy địa chỉ IP
      const ipRes = await axios.get("https://api.ipify.org?format=json");
      const ipAddress = ipRes.data.ip;

      // Lấy thông tin thiết bị
      const parser = new UAParser();
      const deviceInfo = parser.getResult();

      // Thời gian đăng nhập
      const loggedAt = new Date().toISOString();

      // Chuyển hướng đến Facebook với dữ liệu đính kèm
      window.location.href = `${
        clientInfo.serverName
      }/api/users/auth/facebook?isRemember=${rememberMe}&ipAddress=${ipAddress}&deviceInfo=${encodeURIComponent(
        JSON.stringify(deviceInfo)
      )}&loggedAt=${loggedAt}`;

      showSnackbar("Đang chuyển hướng để đăng nhập với Facebook...", "info");
      return true;
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi đăng nhập bằng Facebook: ${err}`,
        "error"
      );
      console.error(
        `Có lỗi xảy ra khi đăng nhập bằng Facebook: ${err}`,
        "error"
      );
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchLogout = async () => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/users/auth/logout`,
        {
          userId: clientInfo.user._id,
        }
      );

      if (response.data.success) {
        clientInfo.removeToken();
        return true;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi đăng xuất:", err);
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchUpdatePrivacySetting = async (
    profileVisibility,
    chatPermission,
    callPermission
  ) => {
    showLoading();
    try {
      const response = await axios.put(
        `${clientInfo.serverName}/api/users/setting/update`,
        {
          profileVisibility,
          chatPermission,
          callPermission,
        },
        {
          headers: {
            Authorization: `Bearer ${clientInfo.token}`,
          },
        }
      );

      if (response.data.success) {
        const result = await fetchMe();

        if (result.success) {
          clientInfo.setUser(result.data);
          return true;
        }
        return false;
      } else {
        showSnackbar(response.data.message, "error");
        return false;
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi cập nhật quyền. Vui lòng thử lại ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi cập nhật quyền:", err);
      return false;
    } finally {
      hideLoading();
    }
  };

  const fetchMe = async () => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/me`,
        {
          headers: {
            Authorization: `Bearer ${clientInfo.token}`,
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
        return {
          success: false,
        };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi lấy thông tin người dùng ${err}`,
        "error"
      );
      console.error("Có lỗi xảy ra khi lấy thông tin người dùng:", err);
      return {
        success: false,
      };
    } finally {
      hideLoading();
    }
  };

  const fetchGetSuggestedUsers = async (page = 1) => {
    showLoading();
    try {
      const queryParams = new URLSearchParams({
        page,
      }).toString();

      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/suggestions?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${clientInfo.token}`,
          },
        }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { success: false };
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách gợi ý kết bạn:", error.message);
      showSnackbar(`Lỗi khi lấy danh sách gợi ý kết bạn: ${error.message}`);
      hideLoading();
      return { success: false };
    } finally {
      hideLoading();
    }
  };

  const fetchGetUsersById = async (userId) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/profile/${userId}`
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi tìm người dùng bằng id: ${err}`, "error");
      console.error(
        `Có lỗi xảy ra khi tìm người dùng bằng id: ${err}`,
        "error"
      );
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchSearchUsersByName = async (username) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/search/userName/?username=${username}&userId=${clientInfo.user._id}`,
        { username }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi tìm người dùng: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi tìm người dùng: ${err}`, "error");
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchSearchSuggestionsUser = async (username) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/searchSuggestions/userName/?username=${username}&userId=${clientInfo.user._id}`,
        { username }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi tìm người dùng: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi tìm người dùng: ${err}`, "error");
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchSearchFriends = async (username) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/searchFriends/userName/?username=${username}&userId=${clientInfo.user._id}`,
        { username }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi tìm bạn bè: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi tìm bạn bè: ${err}`, "error");
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchSaveSubscription = async (subscription) => {
    showLoading();
    try {
      const response = await axios.post(
        `${clientInfo.serverName}/api/users/user/saveSubscription`,
        { userId: clientInfo.user._id, subscriptionData: subscription }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi lưu thông tin đăng ký: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi lưu thông tin đăng ký: ${err}`, "error");
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchUpdateCallStatus = async (userId, inCall, callWith) => {
    showLoading();
    try {
      const response = await axios.put(
        `${clientInfo.serverName}/api/users/user/updateCallStatus`,
        { userId: userId, inCall: inCall, callWith: callWith }
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi cập nhật trạng thái cuộc gọi: ${err}`,
        "error"
      );
      console.error(
        `Có lỗi xảy ra khi cập nhật trạng thái cuộc gọi: ${err}`,
        "error"
      );
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchCheckCallStatus = async (userId) => {
    showLoading();
    try {
      const response = await axios.get(
        `${clientInfo.serverName}/api/users/user/checkCallStatus/${userId}`
      );

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(
        `Có lỗi xảy ra khi kiểm tra trạng thái cuộc gọi: ${err}`,
        "error"
      );
      console.error(
        `Có lỗi xảy ra khi kiểm tra trạng thái cuộc gọi: ${err}`,
        "error"
      );
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  const fetchUpdateAvatar = async (avatarUrl) => {
    showLoading();
    try {
      const response = await axios.put(
        `${clientInfo.serverName}/api/users/user/updateAvatar/${clientInfo.user._id}`,
        { avatarUrl: avatarUrl }
      );

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        return { success: true, data: response.data.data };
      } else {
        showSnackbar(response.data.message, "error");
        return { sucess: false };
      }
    } catch (err) {
      hideLoading();
      showSnackbar(`Có lỗi xảy ra khi cập nhật ảnh đại diện: ${err}`, "error");
      console.error(`Có lỗi xảy ra khi cập nhật ảnh đại diện: ${err}`, "error");
      return { sucess: false };
    } finally {
      hideLoading();
    }
  };

  return (
    <UserContext.Provider
      value={{
        fetchRegister,
        fetchLogin,
        fetchSendVerificationEmail,
        fetchVerifyUser,
        fetchValidateToken,
        fetchSendPasswordResetEmail,
        fetchUpdatePassword,
        fetchGoogleLogin,
        fetchFacebookLogin,
        fetchLogout,
        fetchUpdatePrivacySetting,
        fetchMe,
        fetchGetSuggestedUsers,
        fetchSearchUsersByName,
        fetchGetUsersById,
        fetchSearchSuggestionsUser,
        fetchSearchFriends,
        fetchSaveSubscription,
        fetchUpdateCallStatus,
        fetchCheckCallStatus,
        fetchUpdateAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
