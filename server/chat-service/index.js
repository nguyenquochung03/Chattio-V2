const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const conversationRouter = require("./routes/conversationRouter");
const messageRouter = require("./routes/messageRouter");
const fileRouter = require("./routes/fileRouter");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());
app.use(cors());

connectDB();

app.use("/conversation", conversationRouter);
app.use("/message", messageRouter);
app.use("/file", fileRouter);

app.get("/", (req, res) => {
  res.send("Chào mừng đến với server Node.js với Express!");
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
});
