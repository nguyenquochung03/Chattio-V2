const axios = require("axios");

const getUsersByIds = async (userIds) => {
  try {
    const response = await axios.post(
      `${process.env.BASE_URL}/api/users/user/search/usersIds`,
      { userIds }
    );

    if (!response.data.success) {
      return {
        success: false,
        status: response.data.status,
        message: response.data.message,
      };
    }

    return {
      success: true,
      status: 200,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error) {
    console.log(
      `Xảy ra lỗi server trong quá trình lấy thông tin người dùng qua các id: ${error.message}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server trong quá trình lấy thông tin người dùng qua các id`,
    };
  }
};

module.exports = { getUsersByIds };
