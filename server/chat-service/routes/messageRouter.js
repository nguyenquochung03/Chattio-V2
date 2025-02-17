const express = require("express");
const {
  getMessagesByConversation,
  createMessage,
  markMessagesAsRead,
  getMessageById,
  searchMessages,
  findMessagePage,
  findMessages,
} = require("../controllers/messageController");
const messageRouter = express.Router();

messageRouter.post("/getMessagesFromConversation", getMessagesByConversation);
messageRouter.post("/create", createMessage);
messageRouter.put("/maskAsRead/:conversationId", markMessagesAsRead);
messageRouter.get("/getById/:messageId", getMessageById);
messageRouter.get("/searchMessages", searchMessages);
messageRouter.get("/findMessagePage", findMessagePage);
messageRouter.get("/findMessages", findMessages);

module.exports = messageRouter;
