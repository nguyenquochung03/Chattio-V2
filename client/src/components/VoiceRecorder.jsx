import { useState, useRef, useEffect } from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Delete, RestartAlt, Send, StopCircle } from "@mui/icons-material";
import { useResponsive } from "../contexts/ResponsiveContext";
import LinearBuffer from "./LinearBuffer";
import { useHome } from "../contexts/HomeContext";

const VoiceRecorder = ({ handleSendMessage }) => {
  const [audioBlob, setAudioBlob] = useState(null);
  const [isCompleteRecord, setIsCompleteRecord] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { isMobile } = useResponsive();
  const { selectedFile, setSelectedFile, isRecording, setIsRecording } =
    useHome();

  useEffect(() => {
    if (isRecording) startRecording();
  }, [isRecording]);

  useEffect(() => {
    if (selectedFile && isRecording) {
      handleSendMessage();
      setIsRecording(false);
    }
  }, [selectedFile, isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (event) =>
      audioChunksRef.current.push(event.data);
    mediaRecorder.onstop = () =>
      setAudioBlob(new Blob(audioChunksRef.current, { type: "audio/webm" }));
    mediaRecorder.start();
  };

  const handleCompleteRecord = () => {
    setIsCompleteRecord(true);
    mediaRecorderRef.current?.stop();
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleSubmitVoice = async () => {
    if (!audioChunksRef.current) return;

    const webmBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const audioFile = new File([webmBlob], "audio.webm", {
      type: "audio/webm",
    });

    setSelectedFile(audioFile);
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        padding: "5px 0",
        borderTop: "1.6px solid #f2f0f0",
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Tooltip title="Dừng ghi âm" arrow>
          <IconButton
            onClick={stopRecording}
            sx={{
              backgroundColor: "#FFCDD2",
              color: "#D32F2F",
              borderRadius: "50%",
              transition: "0.5s",
              "&:hover": { backgroundColor: "#EF9A9A" },
            }}
          >
            <Delete />
          </IconButton>
        </Tooltip>
        {isCompleteRecord ? (
          <Tooltip title="Ghi âm lại" arrow>
            <IconButton
              onClick={() => {
                setIsCompleteRecord(false);
                setAudioBlob(null);
                startRecording();
              }}
              sx={{
                backgroundColor: "#E3F2FD",
                color: "primary.main",
                borderRadius: "50%",
                transition: "0.5s",
                "&:hover": { backgroundColor: "#BBDEFB" },
                mr: 1,
              }}
            >
              <RestartAlt />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Kết thúc" arrow>
            <IconButton
              onClick={handleCompleteRecord}
              sx={{
                backgroundColor: "#E3F2FD",
                color: "primary.main",
                borderRadius: "50%",
                transition: "0.5s",
                "&:hover": { backgroundColor: "#BBDEFB" },
                mr: 1,
              }}
            >
              <StopCircle />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isCompleteRecord && audioBlob ? (
        <audio
          src={URL.createObjectURL(audioBlob)}
          controls
          style={{
            width: "100%",
            minWidth: isMobile ? "180px" : "280px",
            borderRadius: "8px",
            display: "block",
          }}
        />
      ) : (
        <LinearBuffer />
      )}
      {isCompleteRecord && (
        <IconButton
          onClick={() => handleSubmitVoice()}
          sx={{
            color: "#1976d2",
            borderRadius: "50%",
            boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
            transition: "0.3s",
            "&:hover": { color: "#1565c0", transform: "scale(1.1)" },
            ml: 1,
          }}
        >
          <Send />
        </IconButton>
      )}
    </Box>
  );
};

export default VoiceRecorder;
