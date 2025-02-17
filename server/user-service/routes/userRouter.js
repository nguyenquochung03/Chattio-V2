const express = require("express");
const userRouter = express.Router();
const {
  fetchUserProfileByToken,
  fetchUserById,
  searchUsersByUsername,
  fetchUsersByIds,
  updateUserStatusById,
  updateUserConversationId,
  getSuggestedUsers,
  searchUsersByUsernameInSuggestions,
  searchUsersByUsernameInFriends,
  updateLastActiveAt,
  saveSubscription,
  updateCallStatus,
  checkCallStatus,
  updateAvatar,
} = require("../controllers/userController.js");
const { authMiddleware } = require("../middleware/authMiddleware.js");

userRouter.get("/me", authMiddleware, fetchUserProfileByToken);
userRouter.get("/profile/:userId", fetchUserById);
userRouter.get("/search/userName", searchUsersByUsername);
userRouter.get(
  "/searchSuggestions/userName",
  searchUsersByUsernameInSuggestions
);
userRouter.get("/searchFriends/userName", searchUsersByUsernameInFriends);
userRouter.post("/search/usersIds", fetchUsersByIds);
userRouter.put("/status/:userId", updateUserStatusById);
userRouter.patch("/conversation", authMiddleware, updateUserConversationId);
userRouter.get("/suggestions", authMiddleware, getSuggestedUsers);
userRouter.put("/updateLastAcitve", updateLastActiveAt);
userRouter.post("/saveSubscription", saveSubscription);
userRouter.put("/updateCallStatus", updateCallStatus);
userRouter.get("/checkCallStatus/:userId", checkCallStatus);
userRouter.put("/updateAvatar/:userId", updateAvatar);

module.exports = userRouter;
