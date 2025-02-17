const express = require("express");
const cors = require("cors");
const http = require("http");
const passport = require("passport");
const session = require("express-session");
const connectDB = require("./config/db");
const userRouter = require("./routes/userRouter");
const authRouter = require("./routes/authRouter");
const privacySettingsRouter = require("./routes/privacySettingsRouter");
require("./middleware/authFacebook");
require("./middleware/authGoogle");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

connectDB();

app.get("/", (req, res) => {
  res.send("Chào mừng đến với server Node.js với Express!");
});

app.use("/user", userRouter);
app.use("/auth", authRouter);
app.use("/setting", privacySettingsRouter);

const server = http.createServer(app);

server.listen(port, () => {
  console.log(`Server đang chạy trên http://localhost:${port}`);
});
