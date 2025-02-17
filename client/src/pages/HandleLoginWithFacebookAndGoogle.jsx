import { Box } from "@mui/material";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useLoading } from "../contexts/LoadingContext";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { useUser } from "../contexts/UserContext";

const HandleLoginWithFacebookAndGoogle = () => {
  const navigate = useNavigate();
  const { showLoading, hideLoading } = useLoading();
  const { showSnackbar } = useSnackbar();
  const clientInfo = useClientInfo();
  const userContext = useUser();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.size !== 0) {
      const success = urlParams.get("success");
      const message = urlParams.get("message");
      const data = urlParams.get("data");
      const accessToken = urlParams.get("accessToken");

      // Kiểm tra xem có đúng là server gọi tới component
      if (!success || !message || !accessToken) {
        navigate("/");
        return;
      } else {
        showLoading();
        try {
          const decodedAccessToken = jwtDecode(accessToken);
          if (decodedAccessToken.secret !== clientInfo.secret) {
            navigate("/");
            return;
          }

          // Nếu đúng là server gọi tới component thì thực hiện xử lý
          if (success === "true") {
            clientInfo.saveToken(data);
            navigate("/");
            showSnackbar(message, "success");
          } else {
            navigate("/");
            showSnackbar(message, "error");
          }
        } catch (error) {
          navigate("/");
          showLoading();
        } finally {
          hideLoading();
        }
      }
    }
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const result = await userContext.fetchMe();

      if (!result.success) {
        clientInfo.removeToken();
      } else {
        clientInfo.setUser(result.data);
      }
    };

    if (clientInfo.token.length !== 0) {
      loadUserData();
    }
  }, [clientInfo.token]);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f0f4f8",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    />
  );
};

export default HandleLoginWithFacebookAndGoogle;
