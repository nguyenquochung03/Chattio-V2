const axios = require("axios");

const getUsersByIds = async (userIds) => {
  try {
    if (!Array.isArray(userIds)) {
      userIds = [userIds];
    }

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

const fetchUpdateUserStatusByUserId = async (userId, status) => {
  try {
    const response = await axios.put(
      `${process.env.BASE_URL}/api/users/user/status/${userId}`,
      { status: status }
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
    };
  } catch (error) {
    console.log(
      `Xảy ra lỗi server trong quá trình cập nhật trạng thái người dùng: ${error.message}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server trong quá trình cập nhật trạng thái người dùng`,
    };
  }
};

const fetchUpdateLastActiveAt = async (userId) => {
  try {
    const response = await axios.put(
      `${process.env.BASE_URL}/api/users/user/updateLastAcitve`,
      { userId: userId }
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
    };
  } catch (error) {
    console.log(
      `Xảy ra lỗi server trong quá trình cập nhật thời gian hoạt động: ${error.message}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server trong quá trình cập nhật thời gian hoạt động`,
    };
  }
};

const fetchGetFriendIds = async (userId) => {
  try {
    const response = await axios.get(
      `${process.env.BASE_URL}/api/friends/friend/list/id/${userId}`
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
      `Xảy ra lỗi server trong quá trình cập nhật thời gian hoạt động: ${error.message}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server trong quá trình cập nhật thời gian hoạt động`,
    };
  }
};

const fetchUpdateCallStatus = async (userId, inCall, callWith) => {
  try {
    const response = await axios.put(
      `${process.env.BASE_URL}/api/users/user/updateCallStatus`,
      { userId: userId, inCall: inCall, callWith: callWith }
    );

    if (response.data.success) {
      return {
        success: true,
        status: 200,
        message: response.data.message,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        status: response.data.status,
        message: response.data.message,
      };
    }
  } catch (err) {
    console.error(
      `Có lỗi xảy ra khi cập nhật trạng thái cuộc gọi: ${err}`,
      "error"
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server khi cập nhật trạng thái cuộc gọi của người dùng: ${err}`,
    };
  }
};

module.exports = {
  getUsersByIds,
  fetchUpdateUserStatusByUserId,
  fetchUpdateLastActiveAt,
  fetchGetFriendIds,
  fetchUpdateCallStatus,
};
