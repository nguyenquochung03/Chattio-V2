const express = require("express");
const {
  createConversation,
  getConversation,
  getLastMessageFromConversation,
  muteConversation,
  checkMuteConversation,
  unmuteConversation,
} = require("../controllers/conversationController");
const conversationRouter = express.Router();

conversationRouter.post("/create", createConversation);
conversationRouter.post("/get", getConversation);
conversationRouter.get(
  "/getLastMessage/:conversationId",
  getLastMessageFromConversation
);
conversationRouter.post("/mute", muteConversation);
conversationRouter.post("/checkMute", checkMuteConversation);
conversationRouter.post("/unMute", unmuteConversation);

module.exports = conversationRouter;
