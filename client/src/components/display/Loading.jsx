import React from "react";
import { CircularProgress, Box } from "@mui/material";

const Loading = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 9999,
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default Loading;
