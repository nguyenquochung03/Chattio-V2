import { Avatar } from "@mui/material";
import React, { createContext, useContext, useEffect, useState } from "react";

const ClientInfoContext = createContext();

export const useClientInfo = () => {
  return useContext(ClientInfoContext);
};

export const ClientInfoProvider = ({ children }) => {
  const clientUrl =
    "https://chattio-v2-fpz5bx9e9-nguyen-hungs-projects-dbff807a.vercel.app";
  const [serverName] = useState("https://chattio-api-gateway.onrender.com");
  const secret =
    "ansdijqwnd12uej128dj12d812jd128dj12dj2j2jd812jd812jd218dj218dj128dj128dj128dj218dj128dj198dhwuidhkhdbjashdasghdashdv";
  const PUBLIC_VAPID_KEY =
    "BN5S4ZYyVj0d7Qb3yeeR2h4XDoQ0Td3pAsFDgCKSKY29VUwb6tQ1Z8kTmnl_ziaE844ABUq8NPOHK65tspSSrZk";
  const [emailLogin, setEmailLogin] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [isVerified, setIsVerified] = useState(false);
  const [user, setUser] = useState({});
  // Số người dùng đã gửi lời mời kết bạn
  const [friendRequestCount, setFriendRequestCount] = useState(0);
  // Số lời mời kết bạn đã gửi
  const [sentRequestCount, setSentRequestCount] = useState(0);
  // Số lời mời kết bạn đã gửi và được chấp nhận
  const [acceptedRequestCount, setAcceptedRequestCount] = useState(0);
  // Secret key cho message của audio và video call
  const audioCallSecret =
    "audio_secret_ahd12hd127dh1d27haw7dhasd7asdhas7dhasd7sahd";
  const videoCallSecret =
    "video_secret_asd9uas8dhas8dhasdas89dhas9d8hasdhasd8ashds";
  const fileSecret = "file_secret_asdhas9dhasdhasudbasdasdasd";

  const saveToken = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const removeToken = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  const getAvatar = (user) => {
    if (user.avatar?.length > 0) {
      return (
        <Avatar
          src={user.avatar}
          sx={{
            borderRadius: "50%",
            marginBottom: 1,
            border: "2px solid #fff",
            boxShadow: 2,
          }}
        />
      );
    } else {
      return (
        <Avatar
          sx={{
            bgcolor: "primary.light",
            color: "white",
            fontWeight: 600,
            borderRadius: "50%",
            marginBottom: 1,
            border: "2px solid #fff",
            boxShadow: 2,
          }}
          src={"https://www.flaticon.com/free-icon/user_3177440"}
        />
      );
    }
  };

  const getAvatarStyle = (user) => {
    if (user.avatar?.length > 0) {
      return (
        <Avatar
          src={user.avatar}
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            marginBottom: 1,
            border: "2px solid #fff",
            boxShadow: 2,
          }}
        />
      );
    } else {
      return (
        <Avatar
          sx={{
            bgcolor: "primary.light",
            color: "white",
            fontWeight: 600,
            width: 80,
            height: 80,
            borderRadius: "50%",
            marginBottom: 1,
            border: "2px solid #fff",
            boxShadow: 2,
          }}
          src={"https://www.flaticon.com/free-icon/user_3177440"}
        />
      );
    }
  };

  return (
    <ClientInfoContext.Provider
      value={{
        clientUrl,
        serverName,
        secret,
        PUBLIC_VAPID_KEY,
        getAvatar,
        getAvatarStyle,
        emailLogin,
        setEmailLogin,
        token,
        saveToken,
        tempToken,
        setTempToken,
        removeToken,
        user,
        setUser,
        isVerified,
        setIsVerified,
        friendRequestCount,
        setFriendRequestCount,
        sentRequestCount,
        setSentRequestCount,
        acceptedRequestCount,
        setAcceptedRequestCount,
        audioCallSecret,
        videoCallSecret,
        fileSecret,
      }}
    >
      {children}
    </ClientInfoContext.Provider>
  );
};
