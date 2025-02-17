const express = require("express");
const cors = require("cors");
const http = require("http");
const connectDB = require("./config/db");
const friendRouter = require("./routes/friendsRouter");
const friendRequestsRouter = require("./routes/friendRequestsRouter");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3003;

app.use(express.json());
app.use(cors());

connectDB();

app.use("/friendRequests", friendRequestsRouter);
app.use("/friend", friendRouter);

app.get("/", (req, res) => {
  res.send("Chào mừng đến với server Node.js với Express!");
});

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
});
