const express = require("express");
const {
  addFriend,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequestCount,
  getSentRequestCount,
  getSentRequests,
  cancelFriendRequest,
  confirmForAcceptedRequest,
  getAcceptedFriendRequestsBySender,
  getAcceptedUnconfirmedRequestsCount,
} = require("../controllers/friendRequestsController");
const friendRequestsRouter = express.Router();

friendRequestsRouter.post("/add", addFriend);
friendRequestsRouter.get("/request", getFriendRequests);
friendRequestsRouter.get("/sentRequest", getSentRequests);
friendRequestsRouter.get("/request/count/:userId", getFriendRequestCount);
friendRequestsRouter.get("/sentRequest/count/:userId", getSentRequestCount);
friendRequestsRouter.get(
  "/acceptedRequest/count/:userId",
  getAcceptedUnconfirmedRequestsCount
);
friendRequestsRouter.post("/accept", acceptFriendRequest);
friendRequestsRouter.delete("/reject", rejectFriendRequest);
friendRequestsRouter.delete("/cancelRequest", cancelFriendRequest);
friendRequestsRouter.post("/confirmAcceptedRequest", confirmForAcceptedRequest);
friendRequestsRouter.get("/acceptRequests", getAcceptedFriendRequestsBySender);

module.exports = friendRequestsRouter;
