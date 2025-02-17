const express = require("express");
const privacySettingsRouter = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware.js");
const {
  updatePrivacySettings,
} = require("../controllers/privacySettingsController.js");

privacySettingsRouter.put("/update", authMiddleware, updatePrivacySettings);

module.exports = privacySettingsRouter;
