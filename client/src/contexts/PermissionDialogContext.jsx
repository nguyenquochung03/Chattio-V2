// PermissionDialogContext.js
import { Lock, Security } from "@mui/icons-material";
import {
  Typography,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material";
import React, { createContext, useState, useContext, useCallback } from "react";

const PermissionDialogContext = createContext();

export const PermissionDialogProvider = ({ children }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const open = useCallback(() => {
    setOpenDialog(true);
    document.getElementById("root").setAttribute("aria-hidden", "true");
  }, []);
  const close = useCallback(() => {
    setOpenDialog(false);
    document.getElementById("root").removeAttribute("aria-hidden");
  }, []);

  return (
    <PermissionDialogContext.Provider value={{ open, close, openDialog }}>
      {children}
      <Dialog open={openDialog} onClose={close}>
        <DialogTitle sx={{ fontWeight: "bold" }}>Yêu cầu cấp quyền</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Để tham gia cuộc gọi video, bạn cần cấp quyền sử dụng{" "}
            <strong>micro</strong> và <strong>máy ảnh</strong>. Nếu không, bạn
            sẽ không thể tiếp tục.
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            style={{ marginTop: "8px" }}
          >
            Vui lòng cấp quyền trong cài đặt trình duyệt bằng cách nhấp vào{" "}
            <Lock
              fontSize="small"
              style={{ verticalAlign: "middle", marginRight: "4px" }}
            />
            <strong>biểu tượng khóa</strong> hoặc{" "}
            <Security
              fontSize="small"
              style={{ verticalAlign: "middle", marginRight: "4px" }}
            />
            <strong>biểu tượng quyền riêng tư</strong> ở góc trên bên trái trình
            duyệt. Sau khi cấp quyền, hãy tải lại trang để thay đổi có hiệu lực.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={close} color="primary">
            Dừng cuộc gọi và cấp quyền
          </Button>
        </DialogActions>
      </Dialog>
    </PermissionDialogContext.Provider>
  );
};

export const usePermissionDialog = () => {
  return useContext(PermissionDialogContext);
};
