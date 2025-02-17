import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  ListItemIcon,
} from "@mui/material";
import { GppMaybe, Public, People, Lock } from "@mui/icons-material";
import { useUser } from "../../../contexts/UserContext";
import { useClientInfo } from "../../../contexts/ClientInfoContext";

const Settings = () => {
  // Sử dụng hook
  const userContext = useUser();
  const clientInfo = useClientInfo();
  // Thông tin cài đặt
  const [profileVisibility, setProfileVisibility] = useState("");
  const [chatPermission, setChatPermission] = useState("");
  const [callPermission, setCallPermission] = useState("");
  // Đánh dấu đã thay đổi
  const [isChanged, setIsChanged] = useState(false);

  const handleProfileVisibilityChange = (event) => {
    const value = event.target.value;
    setProfileVisibility(value);
    setIsChanged(true);
  };

  const handleChatPermissionChange = (event) => {
    const value = event.target.value;
    setChatPermission(value);
    setIsChanged(true);
  };

  const handleCallPermissionChange = (event) => {
    const value = event.target.value;
    setCallPermission(value);
    setIsChanged(true);
  };

  useEffect(() => {
    if (!isChanged) return;

    const updatePrivacySetting = async () => {
      await userContext.fetchUpdatePrivacySetting(
        profileVisibility,
        chatPermission,
        callPermission
      );

      setIsChanged(false);
    };

    updatePrivacySetting();
  }, [profileVisibility, chatPermission, callPermission]);

  useEffect(() => {
    if (clientInfo.user.privacySettings) {
      setProfileVisibility(clientInfo.user.privacySettings.profileVisibility);
      setChatPermission(clientInfo.user.privacySettings.chatPermission);
      setCallPermission(clientInfo.user.privacySettings.callPermission);
    }
  }, [clientInfo.user]);

  const renderOptions = (options, selectedValue, onChange) => (
    <FormControl component="fieldset" sx={{ width: "100%" }}>
      <RadioGroup
        value={selectedValue}
        onChange={onChange}
        sx={{
          display: "flex",
          gap: 1,
          ml: "-15px",
          mr: "8px",
        }}
      >
        {options.map(({ value, icon, title, desc }) => (
          <FormControlLabel
            key={value}
            value={value}
            control={<Radio />}
            labelPlacement="start"
            sx={{
              minWidth: "230px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1,
              border: "1px solid #ddd",
              borderRadius: 2,
              padding: 2,
            }}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    width: 40,
                    height: 40,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "primary.main",
                  }}
                >
                  {icon}
                </ListItemIcon>
                <Box>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    sx={{ letterSpacing: 0.5 }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ letterSpacing: 0.3 }}
                  >
                    {desc}
                  </Typography>
                </Box>
              </Box>
            }
          />
        ))}
      </RadioGroup>
    </FormControl>
  );

  return (
    <Box
      sx={{
        padding: 2,
        width: "1400px",
        overflowY: "scroll",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: "bold",
          letterSpacing: 0.5,
        }}
      >
        <GppMaybe sx={{ fontSize: 28, color: "primary.main" }} />
        Cài đặt quyền riêng tư
      </Typography>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 4, letterSpacing: 0.3 }}
      >
        Tìm hiểu thêm về cách thiết lập quyền riêng tư của bạn.
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Hiển thị hồ sơ */}
      <Typography
        variant="subtitle1"
        sx={{
          mb: 1,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Hiển thị hồ sơ
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 2, letterSpacing: 0.3 }}
      >
        Cài đặt này sẽ ảnh hưởng đến việc ai có thể nhìn thấy hồ sơ của bạn.
      </Typography>
      {renderOptions(
        [
          {
            value: "public",
            icon: <Public sx={{ color: "primary.main" }} />,
            title: "Công khai",
            desc: "Mọi người đều có thể xem hồ sơ của bạn.",
          },
          {
            value: "friends",
            icon: <People sx={{ color: "primary.main" }} />,
            title: "Bạn bè",
            desc: "Chỉ bạn bè mới có thể xem hồ sơ của bạn.",
          },
          {
            value: "private",
            icon: <Lock sx={{ color: "primary.main" }} />,
            title: "Riêng tư",
            desc: "Chỉ bạn mới có thể xem hồ sơ của bạn.",
          },
        ],
        profileVisibility,
        handleProfileVisibilityChange
      )}

      <Divider sx={{ my: 3 }} />

      {/* Cấp phép trò chuyện */}
      <Typography
        variant="subtitle1"
        sx={{
          mb: 1,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Cấp phép trò chuyện
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 2, letterSpacing: 0.3 }}
      >
        Cài đặt này sẽ ảnh hưởng đến việc ai có thể trò chuyện với bạn.
      </Typography>
      {renderOptions(
        [
          {
            value: "everyone",
            icon: <Public sx={{ color: "primary.main" }} />,
            title: "Mọi người",
            desc: "Mọi người đều có thể trò chuyện với bạn.",
          },
          {
            value: "friends",
            icon: <People sx={{ color: "primary.main" }} />,
            title: "Bạn bè",
            desc: "Chỉ bạn bè mới có thể trò chuyện với bạn.",
          },
          {
            value: "no one",
            icon: <Lock sx={{ color: "primary.main" }} />,
            title: "Không ai",
            desc: "Không ai có thể trò chuyện với bạn.",
          },
        ],
        chatPermission,
        handleChatPermissionChange
      )}

      <Divider sx={{ my: 3 }} />

      {/* Cấp phép cuộc gọi */}
      <Typography
        variant="subtitle1"
        sx={{
          mb: 1,
          color: "text.secondary",
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Cấp phép cuộc gọi
      </Typography>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ mb: 2, letterSpacing: 0.3 }}
      >
        Cài đặt này sẽ ảnh hưởng đến việc ai có thể gọi cho bạn.
      </Typography>
      {renderOptions(
        [
          {
            value: "everyone",
            icon: <Public sx={{ color: "primary.main" }} />,
            title: "Mọi người",
            desc: "Mọi người đều có thể gọi cho bạn.",
          },
          {
            value: "friends",
            icon: <People sx={{ color: "primary.main" }} />,
            title: "Bạn bè",
            desc: "Chỉ bạn bè mới có thể gọi cho bạn.",
          },
          {
            value: "no one",
            icon: <Lock sx={{ color: "primary.main" }} />,
            title: "Không ai",
            desc: "Không ai có thể gọi cho bạn.",
          },
        ],
        callPermission,
        handleCallPermissionChange
      )}
    </Box>
  );
};

export default Settings;
