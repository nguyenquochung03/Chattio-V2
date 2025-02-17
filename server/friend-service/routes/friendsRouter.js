const express = require("express");
const friendRouter = express.Router();
const {
  getFriends,
  getUserConnections,
  getFriendsByUserId,
  getAcceptedOrBlockFriendsByUserId,
  getFriendIds,
  updateFriendStatus,
  checkIfBlocked,
  getFriendship,
} = require("../controllers/friendsController");

friendRouter.get("/list", getFriends);
friendRouter.get("/list/id/:userId", getFriendIds);
friendRouter.get("/connectFriends/:userId", getUserConnections);
friendRouter.get("/friends/:userId", getFriendsByUserId);
friendRouter.get(
  "/acceptedOrBlockedFriends/:userId",
  getAcceptedOrBlockFriendsByUserId
);
friendRouter.post("/updateStatus", updateFriendStatus);
friendRouter.post("/checkBlock", checkIfBlocked);
friendRouter.get("/friendship/:userId1/:userId2", getFriendship);

module.exports = friendRouter;
