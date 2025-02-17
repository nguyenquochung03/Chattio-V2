import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import { useHome } from "../contexts/HomeContext";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import {
  CallEnd,
  Cancel,
  ErrorOutline,
  Mic,
  MicOff,
} from "@mui/icons-material";
import { useClientInfo } from "../contexts/ClientInfoContext";
import { useUser } from "../contexts/UserContext";
import { playRingtone } from "../utils/Ringtone";
import { usePermissionDialog } from "../contexts/PermissionDialogContext";
import { formatTime } from "../utils/Time";
import { useChat } from "../contexts/ChatContext";

const CallPage = () => {
  // Stream
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteAudioStreamEnable, setAudioRemoteStreamEnable] = useState(true);
  const [remoteVideoStreamEnable, setVideoRemoteStreamEnable] = useState(true);
  // Video hiển thị của người gọi
  const videoRef = useRef(null);
  // Video hiển thị của người được gọi
  const remoteVideoRef = useRef(null);
  // Trạng thái kết nối của WebRTC
  const peerConnection = useRef(null);
  // Kiểm tra client hiện tại có phải là người gọi không
  // State để quản lý trạng thái bật/tắt
  // Kiểm tra video có bật hoặc tắt
  const [isRemoteCameraOn, setIsRemoteCameraOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  // Sử dụng hook
  const shouldStopRef = useRef(false);
  const socket = useSocket();
  const clientInfo = useClientInfo();
  const userContext = useUser();
  const chatContext = useChat();
  const {
    callStatus,
    setCallStatus,
    userToChat,
    userToCall,
    setUserToCall,
    popupWindow,
    setPopupWindow,
    conversation,
    setConversation,
    isCaller,
    setIsCaller,
    callDeclinedHandled,
    elapsedTime,
    setElapsedTime,
    timerRef,
  } = useHome();
  const { open } = usePermissionDialog();

  useEffect(() => {
    const checkCallStatus = async () => {
      if (clientInfo.token.length !== 0) {
        const result = await userContext.fetchMe();

        if (result.success) {
          if (result.data.inCall) {
            setCallStatus("calling");
            callDeclinedHandled.current = false;
          } else {
            shouldStopRef.current = true;
            setCallStatus("");
          }
        }
      }
    };

    // Kiểm tra người dùng đang thực hiện gọi mới cho phép trạng thái là calling
    checkCallStatus();

    // Lắng nghe sự kiện thay đổi thiết bị (devicechange)
    const handleDeviceChange = () => {
      if (checkDevicePermissions()) {
      }
    };
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    // Lắng nghe sự kiện message từ cửa sổ cha
    window.addEventListener("message", (event) => {
      if (event.data.action === "reset") {
        resetVideoCall();
      }
    });

    // Cleanup khi component unmount
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  useEffect(() => {
    startOrResetTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (clientInfo.user._id) {
      socket.emit("register-user-calling", { userId: clientInfo.user._id });

      const fetchUserById = async (userId) => {
        const result = await userContext.fetchGetUsersById(userId);

        if (result.success) {
          setUserToCall(result.data);
        }
      };

      const fetchConversation = async (userId) => {
        // Tải cuộc hội thoại và đoạn chat với người dùng này
        const fetchConversation = await chatContext.fetchConversation(userId);

        if (!fetchConversation.success) {
          return;
        }
        setConversation(fetchConversation.data);
      };

      if (clientInfo.user.callWith) {
        fetchUserById(clientInfo.user.callWith);
        fetchConversation(clientInfo.user.callWith);
      }
    }
  }, [clientInfo.user]);

  useEffect(() => {
    // Lắng nghe sự kiện beforeunload để xử lý trước khi reload hoặc rời khỏi trang
    const handleBeforeUnload = () => {
      // Hành động sau khi người dùng xác nhận rời khỏi trang
      if (clientInfo.user && userToCall && callStatus === "calling") {
        socket.emit("out-init-calling", {
          userId: clientInfo.user._id,
          callWithId: userToCall._id,
        });
        setCallStatus("");
        setUserToCall({});
        setPopupWindow(null);
      }

      if (clientInfo.user && userToCall && callStatus === "connected") {
        socket.emit("end-call", {
          from: clientInfo.user._id,
          to: userToCall._id,
          elapsedTime: elapsedTime,
        });
      }

      if (
        socket &&
        clientInfo.user._id &&
        userToCall._id &&
        conversation._id &&
        callStatus === "calling"
      ) {
        shouldStopRef.current = true;
        if (isCaller && !callDeclinedHandled.current) {
          callDeclinedHandled.current = true;
          // Cập nhật tin nhắn khi kết thúc cuộc gọi
          const createdAt = Date.now();

          const newMsg = {
            messageKey: createdAt,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
            conversation: conversation._id,
            message: `${clientInfo.audioCallSecret}-failed`,
            createdAt: createdAt,
            status: "sending",
          };

          socket.emit("load-to-list", {
            conversation: conversation,
            message: newMsg,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
          });
        }
      }

      if (
        socket &&
        clientInfo.user._id &&
        userToCall._id &&
        conversation._id &&
        callStatus === "connected"
      ) {
        if (isCaller && !callDeclinedHandled.current) {
          callDeclinedHandled.current = true;
          // Cập nhật tin nhắn khi kết thúc cuộc gọi
          const createdAt = Date.now();

          const newMsg = {
            messageKey: createdAt,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
            conversation: conversation._id,
            message: `${clientInfo.audioCallSecret}-successed-${elapsedTime}`,
            createdAt: createdAt,
            status: "sending",
          };

          socket.emit("load-to-list", {
            conversation: conversation,
            message: newMsg,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
          });
        }

        setCallStatus("");
        setUserToCall({});
        setPopupWindow(null);
        endCall();
      }

      // Ngừng âm thanh
      shouldStopRef.current = true;
    };

    // Phát âm thanh khi component mount
    playRingtone("/calling_sound.wav", shouldStopRef)
      .then((message) => console.log(message))
      .catch((error) => console.error(error));

    // Gắn sự kiện trước khi rời khỏi trang
    window.addEventListener("beforeunload", handleBeforeUnload);

    window.addEventListener("message", (event) => {
      if (event.origin === `${clientInfo.clientUrl}/call`) {
        if (event.data === "reset") {
          // Gửi sự kiện "end-call" qua socket
          socket.emit("end-call", {
            from: clientInfo.user._id,
            to: userToCall._id,
            elapsedTime: elapsedTime,
          });

          // Cập nhật trạng thái cuộc gọi và thông tin người gọi
          setCallStatus("");
          setUserToCall({});
          endCall();
        }
      }
    });

    window.addEventListener("message", (event) => {
      if (event.data === "close-popup") {
        window.close();
      }
    });

    // Cleanup khi component unmount
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    socket,
    clientInfo.user,
    userToCall,
    callStatus,
    conversation,
    callDeclinedHandled,
    elapsedTime,
    isCaller,
  ]);

  useEffect(() => {
    if (socket) {
      setupLocalStream();

      socket.on("receive-offer", async (data) => {
        const { offer, from } = data;

        setIsCaller(false);
        startOrResetTimer(); // Đặt lại thời gian gọi
        await handleAnswer(offer, from);
        shouldStopRef.current = true;
      });

      socket.on("receive-answer", async (data) => {
        const { answer } = data;

        if (!peerConnection.current) {
          console.error("Peer connection is not initialized.");
          return;
        }

        try {
          // Kiểm tra trạng thái của RTCPeerConnection
          if (peerConnection.current.signalingState === "stable") {
            console.error(
              "Cannot set remote description: Already in stable state."
            );
            return;
          }

          // Thiết lập remote description với answer
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          setCallStatus("connected");
          console.log("Remote description set successfully.");
        } catch (error) {
          console.error("Error setting remote description:", error);
        }
      });

      socket.on("ice-candidate", async (data) => {
        if (
          peerConnection.current &&
          peerConnection.current.remoteDescription
        ) {
          try {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } catch (error) {
            console.error("Failed to add ICE candidate:", error);
          }
        }
      });

      socket.on("update-mic-status", (data) => {
        setAudioRemoteStreamEnable(data.isMicOn);
      });

      socket.on("audio-ended", () => {
        setAudioRemoteStreamEnable(false);
      });

      socket.on("permission-not-allowed", () => {
        shouldStopRef.current = true;
        setCallStatus("");
        alert(
          "Người bạn muốn gọi chưa cấp quyền truy cập thiết bị nên cuộc gọi đã chấm dứt."
        );
      });

      return () => {
        if (peerConnection.current) {
          peerConnection.current.close();
        }
      };
    }
  }, [socket, shouldStopRef, peerConnection]);

  useEffect(() => {
    if (socket && clientInfo.user._id && userToCall._id && conversation._id) {
      socket.on("call-declined", () => {
        setCallStatus("rejected");
        shouldStopRef.current = true;
        if (isCaller && !callDeclinedHandled.current) {
          callDeclinedHandled.current = true;
          // Cập nhật tin nhắn khi kết thúc cuộc gọi
          const createdAt = Date.now();

          const newMsg = {
            messageKey: createdAt,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
            conversation: conversation._id,
            message: `${clientInfo.audioCallSecret}-failed`,
            createdAt: createdAt,
            status: "sending",
          };

          socket.emit("load-to-list", {
            conversation: conversation,
            message: newMsg,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
          });
        }
      });

      socket.on("end-call", (data) => {
        const { elapsedTime } = data;

        if (isCaller && !callDeclinedHandled.current) {
          callDeclinedHandled.current = true;
          // Cập nhật tin nhắn khi kết thúc cuộc gọi
          const createdAt = Date.now();

          const newMsg = {
            messageKey: createdAt,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
            conversation: conversation._id,
            message: `${clientInfo.audioCallSecret}-successed-${elapsedTime}`,
            createdAt: createdAt,
            status: "sending",
          };

          socket.emit("load-to-list", {
            conversation: conversation,
            message: newMsg,
            sender: clientInfo.user._id,
            receiver: userToCall._id,
          });
        }
        setCallStatus("");
        setUserToCall({});
        endCall();
      });
    }
  }, [
    socket,
    conversation,
    userToCall,
    clientInfo.user,
    callDeclinedHandled,
    isCaller,
  ]);

  useEffect(() => {
    const getMedia = async () => {
      try {
        // Yêu cầu quyền truy cập camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        // Gán stream vào videoRef.current nếu isCameraOn là true
        if (videoRef.current && isCameraOn) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing the camera:", error);
      }
    };

    if (isCameraOn || callStatus === "calling") {
      getMedia(); // Khởi tạo video stream khi bật camera
    } else {
      if (videoRef.current) {
        videoRef.current.srcObject = null; // Dừng stream khi tắt camera
      }
    }

    // Cleanup stream khi component unmounts hoặc camera tắt
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isCameraOn, callStatus]);

  useEffect(() => {
    if (socket && callStatus === "calling" && localStream) {
      socket.on("call-accepted", async () => {
        shouldStopRef.current = true;

        await startCall();
        startOrResetTimer(); // Đặt lại thời gian gọi
      });
    }
  }, [callStatus, localStream, socket, userToCall]);

  useEffect(() => {
    if (callStatus === "connected") {
      if (videoRef.current && localStream) {
        videoRef.current.srcObject = localStream;
      }
    }
  }, [callStatus, localStream]);

  useEffect(() => {
    if (callStatus === "connected") {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;

        const audioTrack = remoteStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = remoteAudioStreamEnable;
        }

        const videoTrack = remoteStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = remoteVideoStreamEnable;
        }
      }
    }
  }, [
    callStatus,
    remoteStream,
    remoteAudioStreamEnable,
    remoteVideoStreamEnable,
  ]);

  useEffect(() => {
    if (socket) {
      socket.on("update-camera-status", (data) => {
        setVideoRemoteStreamEnable(data.isCameraOn);
        setIsRemoteCameraOn(data.isCameraOn);
      });

      socket.on("video-ended", () => {
        setVideoRemoteStreamEnable(false);
        setIsRemoteCameraOn(false);
      });
    }
  }, [socket, remoteVideoStreamEnable, isRemoteCameraOn]);

  function checkDevicePermissions() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const hasCamera = devices.some((device) => device.kind === "videoinput");
      const hasMicrophone = devices.some(
        (device) => device.kind === "audioinput"
      );

      if (!hasCamera || !hasMicrophone) {
        return false;
      }
      return true;
    });
  }

  const setupLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return { success: true, stream };
    } catch (error) {
      if (error.name === "NotAllowedError") {
        socket.emit("permission-not-allowed", {
          from: clientInfo.user._id,
          to: userToCall._id,
        });
        open(true);
      } else {
        console.error("Lỗi khi thực hiện cấp quyền:", error);
      }
      return { success: false, stream: null };
    }
  };

  const startCall = async () => {
    let stream = localStream;

    if (!localStream) {
      const { success, stream: newStream } = await setupLocalStream();

      if (!success) {
        setCallStatus("");
        alert(
          "Cuộc gọi đã chấm dứt do bạn chưa cung cấp quyền truy cập vào thiết bị"
        );
        return;
      }

      stream = newStream;
    }

    var pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("send-ice-candidate", {
          candidate: event.candidate,
          to: userToCall._id,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        handleEndCall();
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    videoTrack.addEventListener("ended", () => {
      console.warn("Video track stopped");
      setIsCameraOn(false);
      // Thông báo cho người dùng hoặc cập nhật giao diện
      socket.emit("video-ended", { to: userToCall._id });
    });

    // Lắng nghe khi audio track dừng
    audioTrack.addEventListener("ended", () => {
      console.warn("Audio track stopped");
      // Xử lý khi audio track dừng
      socket.emit("audio-ended", { to: userToCall._id });
    });

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("send-offer", {
      offer,
      from: clientInfo.user._id,
      to: userToCall._id,
    });

    peerConnection.current = pc;
    setIsCaller(true);
  };

  const handleAnswer = async (offer, from) => {
    let stream = localStream;

    if (!localStream) {
      const { success, stream: newStream } = await setupLocalStream();

      if (!success) {
        setCallStatus("");
        alert(
          "Cuộc gọi đã chấm dứt do bạn chưa cung cấp quyền truy cập vào thiết bị"
        );
        return;
      }

      stream = newStream;
    }

    var pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.relay.metered.ca:80",
        },
        {
          urls: "turn:global.relay.metered.ca:80",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
        {
          urls: "turn:global.relay.metered.ca:80?transport=tcp",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
        {
          urls: "turn:global.relay.metered.ca:443",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
        {
          urls: "turns:global.relay.metered.ca:443?transport=tcp",
          username: "ee1e392d51a4991543dec673",
          credential: "i4UXqo1y2FLF4f7q",
        },
      ],
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("send-ice-candidate", {
          candidate: event.candidate,
          to: from,
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        handleEndCall();
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    videoTrack.addEventListener("ended", () => {
      console.warn("Video track stopped");
      setIsCameraOn(false);
      socket.emit("video-ended", { to: userToCall._id });
    });

    audioTrack.addEventListener("ended", () => {
      console.warn("Audio track stopped");
      socket.emit("audio-ended", { to: userToCall._id });
    });

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("send-answer", { answer, to: from });

    peerConnection.current = pc;
    setCallStatus("connected");
  };

  const handleEndCall = () => {
    // Gửi sự kiện tới người bên kia
    socket.emit("end-call", {
      from: clientInfo.user._id,
      to: userToCall._id,
      elapsedTime: elapsedTime,
    });

    if (socket && clientInfo.user._id && userToCall._id && conversation._id) {
      if (isCaller && !callDeclinedHandled.current) {
        callDeclinedHandled.current = true;
        // Cập nhật tin nhắn khi kết thúc cuộc gọi
        const createdAt = Date.now();

        const newMsg = {
          messageKey: createdAt,
          sender: clientInfo.user._id,
          receiver: userToCall._id,
          conversation: conversation._id,
          message: `${clientInfo.audioCallSecret}-successed-${elapsedTime}`,
          createdAt: createdAt,
          status: "sending",
        };

        socket.emit("load-to-list", {
          conversation: conversation,
          message: newMsg,
          sender: clientInfo.user._id,
          receiver: userToCall._id,
        });
      }
    }

    // Đóng cửa sổ popup nếu tồn tại
    console.log("Popup Window:", popupWindow);
    if (popupWindow && !popupWindow.closed) {
      try {
        popupWindow.postMessage("close-popup", clientInfo.clientUrl);
        popupWindow.close();
        window.close();
        setPopupWindow(null); // Reset lại trạng thái popupWindow
      } catch (error) {
        console.error("Không thể đóng cửa sổ popup:", error);
      }
    } else {
      console.warn("PopupWindow không tồn tại hoặc đã đóng.");
    }

    // Thiết lập lại trạng thái cuộc gọi
    setCallStatus("");
    setUserToCall({});
    // Ngắt kết nối WebRTC và giải phóng tài nguyên
    endCall();
  };

  const endCall = () => {
    try {
      // Dừng localStream
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }

      // Dừng remoteStream
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => track.stop());
        setRemoteStream(null);
      }

      // Đóng kết nối WebRTC
      if (peerConnection.current) {
        console.log("close");
        // Kiểm tra xem peerConnection.current có tồn tại không
        if (peerConnection.current.signalingState === "stable") {
          console.log("stable");
          peerConnection.current.close();
          peerConnection.current = null;
        } else {
          console.log("!stable");
          // Xử lý trạng thái signalingState khác "stable"
          console.log(
            "Peer connection is not in a stable state. Current state:",
            peerConnection.current.signalingState
          );

          // Có một số cách để xử lý tùy thuộc vào yêu cầu của bạn:

          // 1. Chờ cho đến khi trạng thái ổn định:
          const onSignalingStateChange = () => {
            if (
              peerConnection.current &&
              peerConnection.current.signalingState === "stable"
            ) {
              console.log("wait stable");
              peerConnection.current.close();
              peerConnection.current = null;
              peerConnection.current.removeEventListener(
                "signalingstatechange",
                onSignalingStateChange
              ); // Gỡ bỏ listener sau khi đã xử lý
            }
          };
          peerConnection.current.addEventListener(
            "signalingstatechange",
            onSignalingStateChange
          );

          // 2. Force close bất kể trạng thái (cẩn thận):
          // peerConnection.current.close();
          // peerConnection.current = null;
        }
      }

      // Xóa srcObject trong video DOM
      if (videoRef.current) videoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

      // Thiết lập lại trạng thái
      setCallStatus("");
    } catch (error) {
      console.error("Lỗi khi kết thúc cuộc gọi:", error);
    }
  };

  // Hàm toggle mic
  const handleToggleMic = () => {
    const audioTrack = localStream?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
      socket.emit("update-mic-status", {
        isMicOn: audioTrack.enabled,
        to: userToCall._id,
      });
    }
  };

  const handleDecline = () => {
    if (socket) {
      if (clientInfo.user && userToCall) {
        setCallStatus("");
        socket.emit("out-init-calling", {
          userId: clientInfo.user._id,
          callWithId: userToCall._id,
        });
      }

      // Ngừng âm thanh
      shouldStopRef.current = true;
    }

    if (socket && clientInfo.user._id && userToCall._id && conversation._id) {
      shouldStopRef.current = true;
      if (isCaller && !callDeclinedHandled.current) {
        callDeclinedHandled.current = true;
        // Cập nhật tin nhắn khi kết thúc cuộc gọi
        const createdAt = Date.now();

        const newMsg = {
          messageKey: createdAt,
          sender: clientInfo.user._id,
          receiver: userToCall._id,
          conversation: conversation._id,
          message: `${clientInfo.audioCallSecret}-failed`,
          createdAt: createdAt,
          status: "sending",
        };

        socket.emit("load-to-list", {
          conversation: conversation,
          message: newMsg,
          sender: clientInfo.user._id,
          receiver: userToCall._id,
        });
      }
    }
  };

  const resetVideoCall = async () => {
    // Cập nhật lại người mà muốn gọi
    if (clientInfo.token.length !== 0) {
      const result = await userContext.fetchMe();

      if (result.success) {
        clientInfo.setUser(result.data);
      }
    }

    setCallStatus("calling");
    callDeclinedHandled.current = false;
    setIsCaller(true);

    shouldStopRef.current = false;

    playRingtone("/calling_sound.wav", shouldStopRef)
      .then((message) => console.log(message))
      .catch((error) => console.error(error));
  };

  const handleCallVideo = async () => {
    if (userToCall._id && clientInfo.user._id) {
      // Kiểm tra người dùng có đang thực hiện cuộc gọi chưa
      const checkCallStatusOfuserToCall =
        await userContext.fetchCheckCallStatus(clientInfo.user._id);
      const checkCallStatusOfUser = await userContext.fetchCheckCallStatus(
        userToCall._id
      );

      if (checkCallStatusOfUser.data.inCall) {
        alert(
          "Bạn hiện đang thực hiện một cuộc gọi. Không thể thực hiện cuộc gọi khác."
        );
        return;
      }

      if (checkCallStatusOfuserToCall.data.inCall) {
        alert("Người mà bạn đang muốn gọi đã trong cuộc gọi khác.");
        return;
      }

      // Cập nhật lại trang thái cuộc gọi ngay khi người dùng thực hiện cuộc gọi
      await userContext.fetchUpdateCallStatus(
        userToCall._id,
        true,
        clientInfo.user._id
      );
      await userContext.fetchUpdateCallStatus(
        clientInfo.user._id,
        true,
        userToCall._id
      );

      resetVideoCall();

      socket.emit("init-video-call", {
        userCall: clientInfo.user,
        userToCall: userToCall,
      });
    }
  };

  // Hàm bắt đầu và reset timer
  const startOrResetTimer = () => {
    // Đặt lại thời gian về 0
    setElapsedTime(0);

    // Dừng timer nếu đang chạy
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Bắt đầu timer mới
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  return (
    <React.Fragment>
      <Box
        sx={{
          margin: "auto",
          textAlign: "center",
        }}
      >
        {/* Màn hình chờ khi bắt đầu cuộc gọi */}
        {callStatus === "calling" && (
          <Box
            sx={{
              position: "relative",
            }}
          >
            {/* Video toàn màn hình */}
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100vw",
                  height: "100vh",
                  objectFit: "cover",
                  position: "fixed",
                  top: 0,
                  left: 0,
                  zIndex: -1,
                  opacity: 0,
                }}
              />
              <Box
                sx={{
                  width: "100vw",
                  height: "100vh",
                  position: "fixed",
                  top: 0,
                  left: 0,
                  zIndex: -1,
                  background: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              ></Box>
            </>

            {/* Overlay nội dung */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "93%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                color: "white",
                padding: 3,
              }}
            >
              {/* Header với avatar và tên người gọi */}
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mt={5}
              >
                <Avatar
                  src={userToCall?.avatar || ""}
                  alt={userToCall?.username || "User"}
                  sx={{
                    width: 100,
                    height: 100,
                    mb: 2,
                    border: "4px solid #2196F3",
                    boxShadow: 3,
                  }}
                />
                <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                  {userToCall?.username || "Người dùng"}
                </Typography>
                <Typography variant="subtitle1" sx={{ mt: 1 }}>
                  Đang gọi video...
                </Typography>
              </Box>

              {/* Footer với các button */}
              <Box
                sx={{
                  position: "fixed",
                  bottom: 20,
                  left: 0,
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  py: 2,
                }}
              >
                <IconButton
                  onClick={handleToggleMic}
                  sx={{
                    bgcolor: "#f1f1f1",
                    color: "black",
                    p: 2,
                    borderRadius: "50%",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    "&:hover": {
                      bgcolor: "#e0e0e0",
                      transform: "translateY(-3px)",
                    },
                    transition: "transform 0.3s ease",
                  }}
                >
                  {isMicOn ? (
                    <Mic sx={{ fontSize: 24 }} />
                  ) : (
                    <MicOff sx={{ fontSize: 24 }} />
                  )}
                </IconButton>

                {/* Button tắt cuộc gọi */}
                <IconButton
                  onClick={handleDecline}
                  sx={{
                    bgcolor: "#f44336",
                    color: "white",
                    p: 2,
                    borderRadius: "50%",
                    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                    "&:hover": {
                      bgcolor: "#d32f2f",
                      transform: "translateY(-3px)",
                    },
                    transition: "transform 0.3s ease",
                  }}
                >
                  <CallEnd sx={{ fontSize: 24 }} />
                </IconButton>
              </Box>
            </Box>
          </Box>
        )}

        {/* Màn hình khi cả hai bên chấp nhận cuộc gọi */}
        {callStatus === "connected" && (
          <Box
            sx={{
              position: "relative",
            }}
          >
            {/* Video toàn màn hình (Remote) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                position: "relative",
                height: "98vh",
                gap: 2,
              }}
            >
              <React.Fragment>
                <Box>
                  {/* Nền gradient khi không có âm thanh từ remote */}
                  <Box
                    sx={{
                      position: "fixed",
                      width: "100vw",
                      height: "100vh",
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #4facfe, #00f2fe)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      top: 0,
                      left: 0,
                      zIndex: -1,
                    }}
                  />

                  {/* Header với avatar và tên người gọi */}
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    mt={5}
                  >
                    <Avatar
                      src={userToCall?.avatar || ""}
                      alt={userToCall?.username || "User"}
                      sx={{
                        width: 100,
                        height: 100,
                        mb: 2,
                        border: "4px solid #4facfe",
                        boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.15)",
                      }}
                    />
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: "bold", color: "#ffffff" }}
                    >
                      {userToCall?.username || "Người dùng"}
                    </Typography>
                    <Typography sx={{ color: "#ffffff", mt: 1 }}>
                      {formatTime(elapsedTime)}
                    </Typography>
                  </Box>
                </Box>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100vw",
                    height: "100vh",
                    objectFit: "cover",
                    position: "fixed",
                    top: 0,
                    left: 0,
                    zIndex: -1,
                    opacity: 0,
                  }}
                />
              </React.Fragment>

              {/* Video local ở góc trên bên phải */}
              <Box
                sx={{
                  position: "fixed",
                  top: 20,
                  right: 20,
                  width: "20%",
                  height: "30%",
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                  zIndex: 2,
                  opacity: 0,
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0,
                  }}
                />
              </Box>
            </Box>

            {/* Footer với các button */}
            <Box
              sx={{
                position: "fixed",
                bottom: 20,
                left: 0,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                gap: 3,
                py: 2,
              }}
            >
              {/* Các nút bấm */}
              {[
                {
                  onClick: handleToggleMic,
                  icon: isMicOn ? <Mic /> : <MicOff />,
                },
                {
                  onClick: handleEndCall,
                  icon: <CallEnd />,
                  bgColor: "#ff4d4d",
                  hoverBgColor: "#e63946",
                },
              ].map((button, index) => (
                <IconButton
                  key={index}
                  onClick={button.onClick}
                  sx={{
                    bgcolor: button.bgColor || "#f1f1f1",
                    color: "black",
                    p: 2,
                    borderRadius: "50%",
                    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
                    "&:hover": {
                      bgcolor: button.hoverBgColor || "#e0e0e0",
                      transform: "translateY(-3px)",
                    },
                    transition: "transform 0.3s ease",
                  }}
                >
                  {button.icon}
                </IconButton>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      {/* Màn hình hiển thị giao diện khi người dùng từ chối cuộc gọi */}
      {callStatus === "rejected" && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            bgcolor: "rgba(245, 245, 245, 0.9)",
          }}
        >
          <Card
            sx={{
              width: 400,
              textAlign: "center",
              borderRadius: 3,
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
            }}
          >
            <CardContent>
              <Cancel
                sx={{
                  fontSize: 60,
                  color: "red",
                  mb: 2,
                }}
              />
              <Typography variant="h5" color="textPrimary" gutterBottom>
                Cuộc gọi đã bị từ chối
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                Người dùng không tham gia cuộc gọi vào lúc này. Vui lòng thử lại
                sau.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  textTransform: "none",
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
                  "&:hover": {
                    boxShadow: "0 6px 15px rgba(0, 0, 0, 0.2)",
                  },
                }}
                onClick={handleCallVideo}
              >
                Thử lại
              </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {callStatus === "" && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          sx={{
            width: "100vw",
            height: "100vh",
            objectFit: "cover",
            position: "fixed",
            top: 0,
            left: 0,
            background: "linear-gradient(135deg, #a1c4fd, #c2e9fb)",
            margin: 0,
            padding: 0,
          }}
        >
          <Card
            sx={{
              maxWidth: 450,
              textAlign: "center",
              boxShadow: 6,
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          >
            <CardContent sx={{ padding: 3 }}>
              <Avatar
                sx={{
                  margin: "0 auto",
                  backgroundColor: "error.main",
                  width: 70,
                  height: 70,
                  mb: 2,
                }}
              >
                <ErrorOutline sx={{ fontSize: 40, color: "#ffffff" }} />
              </Avatar>
              <Typography
                variant="h5"
                color="error"
                fontWeight="bold"
                gutterBottom
              >
                Cuộc gọi đã kết thúc
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Cuộc gọi của bạn đã bị ngắt kết nối. Vui lòng kiểm tra lại kết
                nối hoặc liên hệ với chúng tôi nếu bạn cần hỗ trợ thêm.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </React.Fragment>
  );
};

export default CallPage;
