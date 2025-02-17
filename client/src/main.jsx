import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { SnackbarProvider } from "./contexts/SnackbarContext.jsx";
import { LoadingProvider } from "./contexts/LoadingContext.jsx";
import { ClientInfoProvider } from "./contexts/ClientInfoContext.jsx";
import { UserProvider } from "./contexts/UserContext.jsx";
import { BrowserRouter } from "react-router-dom";
import { ResponsiveProvider } from "./contexts/ResponsiveContext.jsx";
import { FriendProvider } from "./contexts/FriendContext.jsx";
import { ChatProvider } from "./contexts/ChatContext.jsx";
import { SocketProvider } from "./contexts/SocketContext.jsx";
import { HomeProvider } from "./contexts/HomeContext.jsx";
import { PermissionDialogProvider } from "./contexts/PermissionDialogContext.jsx";
import { createTheme, ThemeProvider } from "@mui/material";

const theme = createTheme({
  typography: {
    fontFamily: "'Google Sans', 'Helvetica Neue', sans-serif",
  },
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
      <SnackbarProvider>
        <LoadingProvider>
          <ClientInfoProvider>
            <SocketProvider>
              <ResponsiveProvider>
                <HomeProvider>
                  <UserProvider>
                    <FriendProvider>
                      <ChatProvider>
                        <PermissionDialogProvider>
                          <ThemeProvider theme={theme}>
                            <App />
                          </ThemeProvider>
                        </PermissionDialogProvider>
                      </ChatProvider>
                    </FriendProvider>
                  </UserProvider>
                </HomeProvider>
              </ResponsiveProvider>
            </SocketProvider>
          </ClientInfoProvider>
        </LoadingProvider>
      </SnackbarProvider>
    </StrictMode>
  </BrowserRouter>
);
