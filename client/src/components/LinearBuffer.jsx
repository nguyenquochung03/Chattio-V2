import * as React from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

export default function LinearBuffer() {
  const [progress, setProgress] = React.useState(0);
  const [buffer, setBuffer] = React.useState(10);

  // Logic for updating progress and buffer
  const progressRef = React.useRef(() => {});

  React.useEffect(() => {
    progressRef.current = () => {
      if (progress >= 100) {
        setProgress(0);
        setBuffer(10);
      } else {
        setProgress((prev) => Math.min(prev + 1, 100)); // Ensure progress does not exceed 100
        if (buffer < 100 && progress % 5 === 0) {
          const newBuffer = buffer + 1 + Math.random() * 10;
          setBuffer((prev) => Math.min(newBuffer, 100)); // Ensure buffer does not exceed 100
        }
      }
    };
  }, [progress, buffer]);

  React.useEffect(() => {
    const timer = setInterval(() => {
      progressRef.current();
    }, 100); // Adjust interval as needed

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ width: "100%" }}>
      <LinearProgress variant="buffer" value={progress} valueBuffer={buffer} />
    </Box>
  );
}
