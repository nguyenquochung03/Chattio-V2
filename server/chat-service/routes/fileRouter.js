const express = require("express");
const upload = require("../utils/upload");
const {
  uploadFile,
  getMessagesWithMediaFile,
  getMessagesWithRawFile,
  downloadFileFromGoogleDrive,
  checkMessageIsFile,
} = require("../controllers/fileController");
const fileRouter = express.Router();

fileRouter.post("/upload", upload.single("file"), uploadFile);
fileRouter.get("/getMediaFile/:conversationId", getMessagesWithMediaFile);
fileRouter.get("/getRawFile/:conversationId", getMessagesWithRawFile);
fileRouter.get(
  "/dowloadFileFromGoogleDrive/:fileId",
  downloadFileFromGoogleDrive
);
fileRouter.post("/checkMessageIsFile", checkMessageIsFile);

module.exports = fileRouter;
