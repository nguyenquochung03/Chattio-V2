const {
  fetchGetConversation,
  fetchCheckMute,
} = require("../services/chatService");
const { getUsersByIds } = require("../services/userService");

const sendNotification = async (webPush, sender, receiver, body) => {
  try {
    // Lấy thông tin cuộc hội thoại giữa hai người
    const fetchConversation = await fetchGetConversation(sender, receiver);

    if (!fetchConversation.success) {
      console.log(fetchConversation.message);
      return;
    }

    // Kiểm tra người dùng có bật thông báo không
    const checkMute = await fetchCheckMute(
      fetchConversation.data._id,
      receiver
    );

    if (!checkMute.success || checkMute.data.isMuted) {
      console.log(checkMute.message);
      return;
    }

    // Gộp sender và receiver thành một mảng
    const userIds = [sender, receiver];

    // Gọi API để lấy thông tin người gửi và người nhận
    const users = await getUsersByIds(userIds);

    if (!users.success || !users.data?.length) {
      console.error("Không tìm thấy thông tin người dùng.");
      return;
    }

    // Tìm thông tin người gửi và người nhận
    const senderData = users.data.find((user) => user._id === sender);
    const receiverData = users.data.find((user) => user._id === receiver);

    if (!senderData || !receiverData?.subscription) {
      console.error("Không tìm thấy thông tin cần thiết để gửi thông báo.");
      return;
    }

    // Chuẩn bị payload để gửi thông báo
    const payload = JSON.stringify({
      title: senderData.username,
      body: body,
      icon: process.env.AVATAR,
      url: process.env.CLIENT_URL,
    });

    // Gửi thông báo đến người nhận
    webPush
      .sendNotification(receiverData.subscription, payload)
      .then(() => {
        console.log(
          `Thông báo đã được gửi thành công đến ${receiverData.username}`
        );
      })
      .catch((error) => {
        console.error(`Gửi thông báo thất bại:`, error);
      });
  } catch (error) {
    console.error("Lỗi khi gửi thông báo:", error.message);
  }
};

module.exports = { sendNotification };
