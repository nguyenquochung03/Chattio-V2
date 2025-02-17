const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.Db_URL);
    console.log(
      `Đã kết nối tới MongoDB từ http://localhost:${process.env.PORT}`
    );
  } catch (err) {
    console.error("Lỗi kết nối MongoDB:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
