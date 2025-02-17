import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  CircularProgress,
  Tooltip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
} from "@mui/material";
import MessageIcon from "@mui/icons-material/Message";
import GroupIcon from "@mui/icons-material/Group";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useResponsive } from "../contexts/ResponsiveContext";
import { useHome } from "../contexts/HomeContext";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import Badge from "@mui/material/Badge";
import { useSocket } from "../contexts/SocketContext";

const Sidebar = () => {
  const clientInfo = useClientInfo();
  const responsive = useResponsive();
  const {
    isSidebarHidden,
    setIsSidebarHidden,
    setIsShowList,
    setIsOpenChangeAvatarDialog,
  } = useHome();
  const userContext = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();

  const sidebarRef = useRef(null);

  // Ẩn sidebar mặc định nếu là mobile
  const [focusedIndex, setFocusedIndex] = useState(null);
  const [isLargeMobile, setisLargeMobile] = useState(responsive.isLargeMobile);

  // Kiểm soát hiển thị dialog xác nhận đăng xuất
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  useEffect(() => {
    setisLargeMobile(responsive.isLargeMobile);
  }, [responsive.isLargeMobile]);

  // Lắng nghe sự kiện nhấn ra ngoài sidebar để ẩn nó
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        isLargeMobile &&
        !isSidebarHidden &&
        !openLogoutDialog
      ) {
        setIsSidebarHidden(true);
      }
    };

    // Thêm event listener khi component mount
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup listener khi component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLargeMobile, isSidebarHidden, openLogoutDialog]);

  useEffect(() => {
    const currentRoute = location.pathname;
    const index = menuItems.findIndex((item) => item.route === currentRoute);
    setFocusedIndex(index);
  }, [location]);

  const menuItems = [
    { icon: <MessageIcon />, text: "Tin nhắn", route: "/home/messages" },
    { icon: <GroupIcon />, text: "Mọi người", route: "/home/people" },
    {
      icon: <PersonAddIcon />,
      text: "Yêu cầu kết bạn",
      route: "/home/friendRequests",
    },
    { icon: <SettingsIcon />, text: "Cài đặt", route: "/home/settings" },
  ];

  const handleOpenDialog = () => {
    setOpenLogoutDialog(true);
    // Mở dialog, ẩn phần tử khác
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };

  const handleCloseDialog = () => {
    setOpenLogoutDialog(false);
    // Đóng dialog, hiển thị lại phần tử khác
    document.getElementById("root").removeAttribute("aria-hidden");
  };

  const handleOpenUpdateProfileDialog = () => {
    setIsOpenChangeAvatarDialog(true);
    // Mở dialog, ẩn phần tử khác
    document.getElementById("root").setAttribute("aria-hidden", "true");
  };

  const handleLogout = async () => {
    if (socket && clientInfo.user._id) {
      socket.emit("user-offline", { userId: clientInfo.user._id });
    }
    await userContext.fetchLogout();
    setOpenLogoutDialog(false);
    // Đóng dialog, hiển thị lại phần tử khác
    document.getElementById("root").removeAttribute("aria-hidden");
  };

  const handleFocusIndex = (index, route) => {
    setFocusedIndex(index);
    setIsShowList(true);
    navigate(route);
  };

  return (
    <Box
      ref={sidebarRef}
      sx={{
        maxWidth: "230px",
        minWidth: isSidebarHidden ? "fit-content" : "150px",
        display: "flex",
        flexDirection: "column",
        borderRight:
          isLargeMobile && !isSidebarHidden
            ? "0px solid"
            : "1.6px solid #f2f0f0",
        padding: isLargeMobile ? 1 : 2,
        margin: isLargeMobile && !isSidebarHidden ? "10px" : "0px",
        position: isLargeMobile && !isSidebarHidden ? "fixed" : "relative",
        top: 0,
        left: 0,
        height:
          isLargeMobile && !isSidebarHidden ? "calc(100% - 36px)" : "auto",
        zIndex: 999,
        backgroundColor:
          isLargeMobile && !isSidebarHidden ? "white" : "transparent",
        borderTopLeftRadius: isLargeMobile ? 12 : 0,
        borderBottomLeftRadius: isLargeMobile ? 12 : 0,
        transition:
          "max-width 0.3s ease, min-width 0.3s ease, padding 0.3s ease",
      }}
    >
      {/* Biểu tượng trang web */}
      {!isSidebarHidden && (
        <List>
          <ListItemButton
            sx={{
              cursor: "default",
              "&:hover": {
                backgroundColor: "transparent",
              },
              "& .MuiTouchRipple-root": {
                color: "transparent",
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* Chỉ hiển thị ListItemIcon khi isSidebarHidden là false */}
              <ListItemIcon sx={{ minWidth: "40px" }}>
                <img
                  src="https://cdn-icons-png.freepik.com/256/18296/18296255.png?ga=GA1.1.882692981.1736500425&semt=ais_hybrid"
                  alt="Avatar Image"
                  style={{
                    width: "35px",
                    height: "35px",
                    objectFit: "contain",
                  }}
                />
              </ListItemIcon>

              {/* Nút ẩn/hiện Sidebar */}
              <IconButton
                onClick={() => setIsSidebarHidden(!isSidebarHidden)}
                sx={{ mb: 2 }}
              >
                <MenuIcon />
              </IconButton>
            </Box>
          </ListItemButton>
        </List>
      )}

      {/* Menu */}
      <List>
        {isSidebarHidden && (
          <IconButton
            onClick={() => setIsSidebarHidden(!isSidebarHidden)}
            sx={{ width: "40px", height: "40px", mb: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {menuItems.map((item, index) =>
          isSidebarHidden ? (
            <Tooltip title={item.text} placement="right" key={index} arrow>
              <IconButton
                onClick={() => handleFocusIndex(index, item.route)}
                sx={{
                  mb: 2,
                  color: focusedIndex === index ? "info.main" : "#424242",
                  backgroundColor:
                    focusedIndex === index ? "#d4e6fc" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "40px",
                  height: "40px",
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                }}
              >
                {item.text === "Mọi người" ? (
                  <Badge
                    color="error"
                    badgeContent={
                      clientInfo.sentRequestCount +
                      clientInfo.acceptedRequestCount
                    }
                  >
                    {item.icon}
                  </Badge>
                ) : item.text === "Yêu cầu kết bạn" ? (
                  <Badge
                    color="error"
                    badgeContent={clientInfo.friendRequestCount}
                  >
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </IconButton>
            </Tooltip>
          ) : (
            // Hiển thị ListItemButton khi Sidebar hiện
            <ListItemButton
              key={index}
              onClick={() => handleFocusIndex(index, item.route)}
              sx={{
                borderRadius: "8px",
                mb: 1,
                paddingY: 1.2,
                transition: "all 0.3s",
                backgroundColor:
                  focusedIndex === index ? "#d4e6fc" : "transparent",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                },
                "& .MuiTouchRipple-root": {
                  color: "#1976d2",
                },
              }}
            >
              <ListItemIcon>
                <IconButton
                  sx={{
                    color: focusedIndex === index ? "info.main" : "#424242",
                  }}
                >
                  {item.text === "Mọi người" ? (
                    <Badge
                      color="error"
                      badgeContent={
                        clientInfo.sentRequestCount +
                        clientInfo.acceptedRequestCount
                      }
                    >
                      {item.icon}
                    </Badge>
                  ) : item.text === "Yêu cầu kết bạn" ? (
                    <Badge
                      color="error"
                      badgeContent={clientInfo.friendRequestCount}
                    >
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </IconButton>
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  color: focusedIndex === index ? "info.main" : "#424242",
                  fontWeight: focusedIndex === index ? "bold" : 500,
                }}
              />
            </ListItemButton>
          )
        )}
      </List>

      {/* Dòng dưới cùng: Avatar, Tên người dùng, Đăng xuất */}
      {!isSidebarHidden ? (
        <React.Fragment>
          <Box
            sx={{
              marginTop: "auto",
              paddingTop: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Tooltip
              title={`Cập nhật ảnh đại diện ${clientInfo.user.username}`}
              arrow
              placement="top"
            >
              <Button
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textTransform: "none",
                  width: "100%",
                  justifyContent: isSidebarHidden ? "center" : "flex-start",
                  padding: "6px 12px",
                }}
                onClick={() => handleOpenUpdateProfileDialog()}
              >
                {clientInfo.user._id ? (
                  clientInfo.getAvatar(clientInfo.user)
                ) : (
                  <CircularProgress size={32} />
                )}
                {!isSidebarHidden && (
                  <Typography
                    sx={{
                      marginLeft: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {clientInfo.user.username}
                  </Typography>
                )}
              </Button>
            </Tooltip>

            {!isSidebarHidden && (
              <Tooltip title="Đăng xuất" arrow placement="top">
                <IconButton onClick={handleOpenDialog}>
                  <LogoutIcon sx={{ color: "primary.main" }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Dialog xác nhận đăng xuất */}
          <Dialog
            open={openLogoutDialog}
            onClose={handleCloseDialog}
            maxWidth="xs"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                p: 2,
              },
            }}
          >
            {/* Header */}
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Box display="flex" alignItems="center" gap={1}>
                <WarningAmberRoundedIcon
                  sx={{ color: "#ff9800", fontSize: 28 }}
                />
                <DialogTitle sx={{ p: 0, fontWeight: 600, fontSize: "1.2rem" }}>
                  Xác nhận đăng xuất
                </DialogTitle>
              </Box>
              <IconButton onClick={handleCloseDialog} size="small">
                <CloseRoundedIcon sx={{ fontSize: 22, color: "#757575" }} />
              </IconButton>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {/* Nội dung */}
            <DialogContent sx={{ textAlign: "center", px: 3, py: 1 }}>
              <Typography variant="body1" sx={{ mb: 2, color: "#555" }}>
                Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
              </Typography>
            </DialogContent>

            {/* Hành động */}
            <DialogActions sx={{ justifyContent: "center", gap: 2, mt: 1 }}>
              <Button
                onClick={handleCloseDialog}
                variant="outlined"
                sx={{
                  width: "120px",
                  borderRadius: 8,
                  textTransform: "none",
                  borderColor: "#b0bec5",
                  color: "#37474f",
                  "&:hover": {
                    borderColor: "#78909c",
                    backgroundColor: "#eceff1",
                  },
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleLogout}
                variant="contained"
                sx={{
                  width: "120px",
                  borderRadius: 8,
                  textTransform: "none",
                  backgroundColor: "#d32f2f",
                  "&:hover": { backgroundColor: "#c62828" },
                }}
              >
                Đăng xuất
              </Button>
            </DialogActions>
          </Dialog>
        </React.Fragment>
      ) : (
        <Tooltip title="Cập nhật ảnh đại diện" arrow placement="top">
          <IconButton
            sx={{
              width: "40px",
              height: "40px",
              marginTop: "auto",
              paddingTop: 1,
            }}
            onClick={() => handleOpenUpdateProfileDialog()}
          >
            {clientInfo.getAvatar(clientInfo.user)}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default Sidebar;
