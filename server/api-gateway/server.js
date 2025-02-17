const express = require("express");
const cors = require("cors");
const http = require("http");
const { createProxyMiddleware } = require("http-proxy-middleware");
const socketIo = require("socket.io");
const webPush = require("web-push");
const {
  fetchUpdateUserStatusByUserId,
  fetchUpdateLastActiveAt,
  fetchGetFriendIds,
  fetchUpdateCallStatus,
} = require("./services/userService");
const {
  fetchCreateMessage,
  fetchCheckMessageIsFile,
} = require("./services/chatService");
const { sendNotification } = require("./utils/sendNotification");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Cấu hình web push
const vapidKeys = {
  publicKey: process.env.PUBLIC_VAPID_KEY,
  privateKey: process.env.PRIVATE_VAPID_KEY,
};

webPush.setVapidDetails(
  "mailto:nguyenhungnqh03@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Chỉ parse body khi không dùng proxy
app.use((req, res, next) => {
  if (
    req.path.indexOf("/api/users") !== 0 &&
    req.path.indexOf("/api/chats") !== 0 &&
    req.path.indexOf("/api/friends") !== 0
  ) {
    express.json()(req, res, next);
  } else {
    next();
  }
});

app.use((req, res, next) => {
  req.on("aborted", () => {
    console.error("Request aborted by the client.");
    res.status(499).send("Client Closed Request");
  });
  next();
});

// Proxy các request đến các dịch vụ microservices

app.use(
  "/api/users",
  createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/users": "" },
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);

        // Cập nhật header
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

        // Gửi dữ liệu body
        proxyReq.write(bodyData);
        proxyReq.end(); // Kết thúc request
      }
    },
    onError: (err, req, res) => {
      console.error("Proxy Error:", err.message);
      res.status(500).send("Proxy Error");
    },
  })
);

app.use(
  "/api/chats",
  createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL,
    changeOrigin: true,
    timeout: 10000,
    pathRewrite: { "^/api/chats": "" },
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);

        // Cập nhật header
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

        // Gửi dữ liệu body
        proxyReq.write(bodyData);
        proxyReq.end(); // Kết thúc request
      }
    },
    onError: (err, req, res) => {
      console.error("Proxy Error:", err.message);
      res.status(500).send("Proxy Error");
    },
  })
);

app.use(
  "/api/friends",
  createProxyMiddleware({
    target: process.env.FRIEND_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/friends": "" },
    onProxyReq: (proxyReq, req, res) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);

        // Cập nhật header
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

        // Gửi dữ liệu body
        proxyReq.write(bodyData);
        proxyReq.end(); // Kết thúc request
      }
    },
    onError: (err, req, res) => {
      console.error("Proxy Error:", err.message);
      res.status(500).send("Proxy Error");
    },
  })
);

app.get("/", (req, res) => {
  res.send("Chào mừng đến với API Gateway!");
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

const userSocketsMap = new Map();
const userSocketsCallingMap = new Map();
const pendingOffers = new Map();

// Lưu trữ socket của các người dùng
io.on("connection", (socket) => {
  socket.on("register-user-calling", (data) => {
    const { userId } = data;
    const userKey = `userSockets:${userId}`;

    // Kiểm tra xem userId đã có trong Map chưa
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      // Kiểm tra nếu socket.id đã tồn tại trong danh sách
      if (!socketIds.includes(socket.id)) {
        socketIds.push(socket.id);
        userSocketsCallingMap.set(userKey, socketIds);
      }
    } else {
      // Nếu chưa có, tạo danh sách mới chỉ chứa socket.id và lưu vào Map
      userSocketsCallingMap.set(userKey, [socket.id]);
    }

    // Kiểm tra nếu có offer chờ
    if (pendingOffers.has(userKey)) {
      const { offer, from } = pendingOffers.get(userKey);
      io.to(socket.id).emit("receive-offer", { offer, from });
      pendingOffers.delete(userKey);
    }
  });

  socket.on("register", (data) => {
    const { userId } = data;
    const userKey = `userSockets:${userId}`;

    // Kiểm tra xem userId đã có trong Map chưa
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Kiểm tra nếu socket.id đã tồn tại trong danh sách
      if (!socketIds.includes(socket.id)) {
        socketIds.push(socket.id);
        userSocketsMap.set(userKey, socketIds);
      }
    } else {
      // Nếu chưa có, tạo danh sách mới chỉ chứa socket.id và lưu vào Map
      userSocketsMap.set(userKey, [socket.id]);
    }
  });

  // Lắng nghe sự kiện thêm bạn bè
  socket.on("add-friend", (data) => {
    const userKey = `userSockets:${data.receiverId}`;

    // Kiểm tra xem receiverId có trong Map không
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Gửi sự kiện "add-friend" đến tất cả socket của receiver
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("add-friend", { sender: data.sender });
      });
    }
  });

  // Lắng nghe sự kiện lời mời kết bạn được chấp nhận
  socket.on("friend-request-accepted", (data) => {
    const { friend, to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra xem receiverId có trong Map không
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Gửi sự kiện "friend-request-accepted" đến tất cả socket của to
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("friend-request-accepted", { friend: friend });
      });
    }
  });

  // Lắng nghe sự kiện hủy lời mời kết bạn
  socket.on("cancel-request", (data) => {
    const userKey = `userSockets:${data.receiverId}`;

    // Kiểm tra xem receiverId có trong Map không
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Gửi sự kiện "cancel-request" đến tất cả socket của receiver
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("cancel-request", { sender: data.sender });
      });
    }
  });

  // Lắng nghe sự kiện từ chối lời mời kết bạn
  socket.on("reject-friend-request", (data) => {
    const userKey = `userSockets:${data.senderId}`;

    // Kiểm tra xem senderId có trong Map không
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Gửi sự kiện "reject-friend-request" đến tất cả socket của sender
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("reject-friend-request", {
          receiver: data.receiver,
        });
      });
    }
  });

  // Lắng nghe sự kiện đồng ý lời mời kết bạn
  socket.on("accept-friend-request", (data) => {
    const userKey = `userSockets:${data.senderId}`;

    // Kiểm tra xem senderId có trong Map không
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Gửi sự kiện "accept-friend-request" đến tất cả socket của sender
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("accept-friend-request", {
          receiver: data.receiver,
        });
      });
    }
  });

  socket.on("user-online", async (data) => {
    const { userId } = data;

    const result = await fetchUpdateUserStatusByUserId(userId, true);

    if (result.success) {
      const friendsResponse = await fetchGetFriendIds(userId);

      if (friendsResponse.success) {
        friendsResponse.data.forEach((friendId) => {
          const userKey = `userSockets:${friendId}`;

          // Kiểm tra xem trong Map có socket của friendId không
          if (userSocketsMap.has(userKey)) {
            const socketIds = userSocketsMap.get(userKey);

            // Gửi sự kiện "user-online" đến tất cả socket của friend
            socketIds.forEach((socketId) => {
              io.to(socketId).emit("user-online", { userId });
            });
          }
        });
      }
    }
  });

  socket.on("user-offline", async (data) => {
    const { userId } = data;

    // Tạo khóa userKey dựa trên userId
    const userKey = `userSockets:${userId}`;

    // Kiểm tra xem userSocketsMap có userKey không
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      if (socketIds.length > 1) return;
    }

    // Nếu chỉ còn một socket hoặc không có socket nào
    // Tiếp tục thực hiện cập nhật
    await fetchUpdateLastActiveAt(userId);

    const result = await fetchUpdateUserStatusByUserId(userId, false);

    if (result.success) {
      const friendsResponse = await fetchGetFriendIds(userId);

      if (friendsResponse.success) {
        friendsResponse.data.forEach((friendId) => {
          const userKey = `userSockets:${friendId}`;

          // Kiểm tra xem trong Map có socket của friendId không
          if (userSocketsMap.has(userKey)) {
            const socketIds = userSocketsMap.get(userKey);

            // Gửi sự kiện "user-offline" đến tất cả socket của friend
            socketIds.forEach((socketId) => {
              io.to(socketId).emit("user-offline", { userId });
            });
          }
        });
      }
    }
  });

  socket.on("join", (data) => {
    const { conversationId } = data;

    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.leave(room);
      }
    }

    socket.join(conversationId);
  });

  socket.on("typing", (data) => {
    const { conversationId, status } = data;

    // Kiểm tra xem có những ai đang ở trong phòng
    const participantsFromRoom = io.sockets.adapter.rooms.get(conversationId);

    if (participantsFromRoom) {
      // Gửi thông tin cho những người đang ở trong phòng
      socket.to(conversationId).emit("typing", { status: status });
    }
  });

  socket.on("load-to-list", async (data) => {
    const { conversation, message, sender, receiver } = data;

    const userKeySender = `userSockets:${sender}`;

    if (userSocketsMap.has(userKeySender)) {
      const socketIds = userSocketsMap.get(userKeySender);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("load-to-list", { newMsg: message });
      });
    }

    try {
      // Lấy danh sách thành viên trong phòng trò chuyện
      const participantsInRoom = io.sockets.adapter.rooms.get(conversation._id);

      if (!participantsInRoom || participantsInRoom.size === 0) {
        return;
      }

      // Kiểm tra số lượng thành viên có mặt trong phòng chat
      const allParticipantsPresent =
        participantsInRoom.size === conversation.participants.length;

      // Cập nhật trạng thái tin nhắn dựa vào số lượng người tham gia
      message.status = allParticipantsPresent ? "read" : "sent";

      // Gửi tin nhắn đến database
      const result = await fetchCreateMessage(conversation._id, message);

      if (result.success) {
        if (userSocketsMap.has(userKeySender)) {
          const socketIds = userSocketsMap.get(userKeySender);

          socketIds.forEach((socketId) => {
            io.to(socketId).emit("update-message-status", {
              messageKey: message.messageKey,
              status: message.status,
            });

            io.to(socketId).emit("update-last-message", {
              message: message,
              sender: receiver,
            });
          });
        }

        if (allParticipantsPresent) {
          // Nếu tất cả thành viên đều có mặt, gửi tin nhắn đến các client khác trong phòng
          socket
            .to(conversation._id)
            .emit("receive-message", { message: message });

          socket.to(conversation._id).emit("update-last-message", {
            message: message,
            sender: sender,
          });
        } else {
          const userKeyReceiver = `userSockets:${receiver}`;

          // Kiểm tra xem trong Map có socket của receiver không
          if (userSocketsMap.has(userKeyReceiver)) {
            const socketIds = userSocketsMap.get(userKeyReceiver);

            // Gửi sự kiện "update-last-message" tới tất cả các socket của receiver
            socketIds.forEach((socketId) => {
              io.to(socketId).emit("update-last-message", {
                message: message,
                sender: sender,
              });
            });
          } else {
            let body = message.message;

            if (
              body.includes(process.env.AUDIO_CALL_SECRET) ||
              body.includes(process.env.VIDEO_CALL_SECRET)
            ) {
              if (body.includes(process.env.AUDIO_CALL_SECRET)) {
                body = "Bạn đã bỏ lỡ một cuộc gọi thoại";
              }
              if (body.includes(process.env.VIDEO_CALL_SECRET)) {
                body = "Bạn đã bỏ lỡ một cuộc gọi video";
              }
            }

            // Gửi thông báo cho người dùng khi họ không truy cập
            await sendNotification(webPush, sender, receiver, body);
          }
        }
      } else {
        // Xử lý trường hợp lưu tin nhắn thất bại
        if (userSocketsMap.has(userKeySender)) {
          const socketIds = userSocketsMap.get(userKeySender);

          socketIds.forEach((socketId) => {
            io.to(socketId).emit("update-message-status", {
              messageKey: message.messageKey,
              status: "sending",
            });

            io.to(socketId).emit("update-last-message", {
              message: message,
              sender: sender,
            });
          });
        }
      }
    } catch (error) {
      console.error("Lỗi khi xử lý tin nhắn:", error);
      if (userSocketsMap.has(userKeySender)) {
        const socketIds = userSocketsMap.get(userKeySender);

        socketIds.forEach((socketId) => {
          io.to(socketId).emit("update-message-status", {
            messageKey: message.messageKey,
            status: "sending",
          });

          io.to(socketId).emit("update-last-message", {
            message: message,
            sender: sender,
          });
        });
      }
    }
  });

  socket.on("send-message", async (data) => {
    const { conversation, message, sender, receiver } = data;

    try {
      // Lấy danh sách thành viên trong phòng trò chuyện
      const participantsInRoom = io.sockets.adapter.rooms.get(conversation._id);

      if (!participantsInRoom || participantsInRoom.size === 0) {
        return;
      }

      // Kiểm tra số lượng thành viên có mặt trong phòng chat
      const allParticipantsPresent =
        participantsInRoom.size === conversation.participants.length;

      // Cập nhật trạng thái tin nhắn dựa vào số lượng người tham gia
      message.status = allParticipantsPresent ? "read" : "sent";

      // Gửi tin nhắn đến database
      const result = await fetchCreateMessage(conversation._id, message);

      if (result.success) {
        socket.emit("update-message-status", {
          messageKey: message.messageKey,
          status: message.status,
        });

        if (allParticipantsPresent) {
          // Nếu tất cả thành viên đều có mặt, gửi tin nhắn đến các client khác trong phòng
          socket
            .to(conversation._id)
            .emit("receive-message", { message: message });

          socket.to(conversation._id).emit("update-last-message", {
            message: message,
            sender: sender,
          });
        } else {
          const userKey = `userSockets:${receiver}`;

          // Kiểm tra xem trong Map có socket của receiver không
          if (userSocketsMap.has(userKey)) {
            const socketIds = userSocketsMap.get(userKey);

            // Gửi sự kiện "update-last-message" tới tất cả các socket của receiver
            socketIds.forEach((socketId) => {
              io.to(socketId).emit("update-last-message", {
                message: message,
                sender: sender,
              });
            });
          } else {
            let body = message.message;
            const isFile = await fetchCheckMessageIsFile(body);

            if (isFile.success) {
              const fileTypeMap = {
                Image: "Đã gửi một ảnh cho bạn",
                Video: "Đã gửi một video cho bạn",
                Audio: "Đã gửi một audio cho bạn",
                Raw: "Đã gửi một tập tin cho bạn",
              };

              body = fileTypeMap[isFile.data] || body;
            }

            // Gửi thông báo cho người dùng khi họ không truy cập
            await sendNotification(webPush, sender, receiver, body);
          }
        }
      } else {
        // Xử lý trường hợp lưu tin nhắn thất bại
        socket.emit("update-message-status", {
          messageKey: message.messageKey,
          status: "sending",
        });
      }
    } catch (error) {
      console.error("Lỗi khi xử lý tin nhắn:", error);
      socket.emit("update-message-status", {
        messageKey: data.message.messageKey,
        status: "sending",
      });
    }
  });

  socket.on("read-message", async (data) => {
    const { user, conversationId } = data;

    const userKey = `userSockets:${user}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      // Gửi sự kiện "read-message" tới tất cả các socket của user
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("read-message", {
          conversationId: conversationId,
        });
      });
    }
  });

  socket.on("block-friend", async (data) => {
    const { userId1, userId2 } = data;

    const userKey = `userSockets:${userId2}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("block-friend", {
          userId1: userId1,
          userId2: userId2,
        });
      });
    }
  });

  socket.on("cancel-block-friend", async (data) => {
    const { userId1, userId2 } = data;

    const userKey = `userSockets:${userId2}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("cancel-block-friend", {
          userId1: userId1,
          userId2: userId2,
        });
      });
    }
  });

  socket.on("init-video-call", async (data) => {
    const { userCall, userToCall } = data;

    const userKey = `userSockets:${userToCall._id}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("init-video-call", {
          from: userCall,
          to: userToCall,
        });
      });
    } else {
      await sendNotification(
        webPush,
        userCall._id,
        userToCall._id,
        "ĐANG GỌI CHO BẠN"
      );
    }
  });

  socket.on("init-call", async (data) => {
    const { userCall, userToCall } = data;

    const userKey = `userSockets:${userToCall._id}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("init-call", {
          from: userCall,
          to: userToCall,
        });
      });
    } else {
      await sendNotification(
        webPush,
        userCall._id,
        userToCall._id,
        "ĐANG GỌI CHO BẠN"
      );
    }
  });

  socket.on("decline-calling", async (data) => {
    const { userId, callWithId } = data;

    await fetchUpdateCallStatus(userId, false, null);
    await fetchUpdateCallStatus(callWithId, false, null);

    const userKey = `userSockets:${callWithId}`;

    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("call-declined");
      });
    }
  });

  socket.on("out-init-calling", async (data) => {
    const { userId, callWithId } = data;

    await fetchUpdateCallStatus(userId, false, null);
    await fetchUpdateCallStatus(callWithId, false, null);

    const userKey = `userSockets:${callWithId}`;
    //// Của trang home
    // Kiểm tra nếu user có socket trong Map
    if (userSocketsMap.has(userKey)) {
      const socketIds = userSocketsMap.get(userKey);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("out-init-calling");
      });
    }

    //// Của trang call
    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("out-calling");
      });
    }
  });

  socket.on("call-accepted", (data) => {
    const { callerId } = data;

    const userKey = `userSockets:${callerId}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("call-accepted");
      });
    }
  });

  socket.on("send-offer", (data) => {
    const { offer, from, to } = data;

    const userKey = `userSockets:${to}`;
    // Gửi vào danh sách chờ
    pendingOffers.set(userKey, data);

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("receive-offer", { offer, from: from });
      });
    }
  });

  socket.on("send-answer", (data) => {
    const { answer, to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("receive-answer", { answer: answer });
      });
    }
  });

  socket.on("send-ice-candidate", (data) => {
    const { candidate, to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      // Gửi sự kiện "ice-candidate" tới tất cả các socket của user
      socketIds.forEach((socketId) => {
        io.to(socketId).emit("ice-candidate", {
          candidate,
        });
      });
    }
  });

  socket.on("permission-not-allowed", async (data) => {
    const { from, to } = data;

    await fetchUpdateCallStatus(from, false, null);
    await fetchUpdateCallStatus(to, false, null);

    const userKey = `userSockets:${to}`;
    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("permission-not-allowed");
      });
    }
  });

  socket.on("end-call", async (data) => {
    const { from, to, elapsedTime } = data;

    await fetchUpdateCallStatus(from, false, null);
    await fetchUpdateCallStatus(to, false, null);

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("end-call", { elapsedTime: elapsedTime });
      });
    }
  });

  socket.on("update-mic-status", (data) => {
    const { isMicOn, to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("update-mic-status", {
          isMicOn: isMicOn,
        });
      });
    }
  });

  socket.on("update-camera-status", (data) => {
    const { isCameraOn, to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("update-camera-status", {
          isCameraOn: isCameraOn,
        });
      });
    }
  });

  socket.on("video-ended", (data) => {
    const { to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("video-ended");
      });
    }
  });

  socket.on("audio-ended", (data) => {
    const { to } = data;

    const userKey = `userSockets:${to}`;

    // Kiểm tra nếu user có socket trong Map
    if (userSocketsCallingMap.has(userKey)) {
      const socketIds = userSocketsCallingMap.get(userKey);

      socketIds.forEach((socketId) => {
        io.to(socketId).emit("audio-ended");
      });
    }
  });

  socket.on("disconnect", () => {
    // Duyệt qua tất cả các người dùng trong Map để tìm socket đã ngắt kết nối
    for (const [userKey, socketIds] of userSocketsMap.entries()) {
      // Kiểm tra xem socket có tồn tại trong danh sách của người dùng không
      const index = socketIds.findIndex((id) => id === socket.id);

      if (index !== -1) {
        // Loại bỏ socket khỏi danh sách của người dùng
        socketIds.splice(index, 1);

        // Nếu không còn socket nào của người dùng, xóa khỏi Map
        if (socketIds.length === 0) {
          userSocketsMap.delete(userKey);
        } else {
          // Cập nhật lại danh sách socket của người dùng
          userSocketsMap.set(userKey, socketIds);
        }
      }
    }

    for (const [userKey, socketIds] of userSocketsCallingMap.entries()) {
      // Kiểm tra xem socket có tồn tại trong danh sách của người dùng không
      const index = socketIds.findIndex((id) => id === socket.id);

      if (index !== -1) {
        // Loại bỏ socket khỏi danh sách của người dùng
        socketIds.splice(index, 1);

        // Nếu không còn socket nào của người dùng, xóa khỏi Map
        if (socketIds.length === 0) {
          userSocketsCallingMap.delete(userKey);
        } else {
          // Cập nhật lại danh sách socket của người dùng
          userSocketsCallingMap.set(userKey, socketIds);
        }
      }
    }
  });
});

server.listen(port, () => {
  console.log(`API Gateway đang chạy trên http://localhost:${port}`);
});
