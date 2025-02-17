import React from "react";
import { Button } from "@mui/material";

const ResponsiveButton = ({ variant, color, size, children, sx, ...props }) => {
  return (
    <Button
      variant={variant}
      color={color}
      size={size}
      sx={{ width: "100%" }}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ResponsiveButton;
