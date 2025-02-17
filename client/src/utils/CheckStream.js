export const checkCallVideoStream = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    return {
      success: true,
      status: 200,
      message: "Đã cấp quyền trước khi thực hiện cuộc gọi bằng video",
    };
  } catch (error) {
    if (error.name === "NotAllowedError") {
      return {
        success: false,
        status: 400,
        message: "Chưa cấp quyền trước khi thực hiện cuộc gọi bằng video.",
      };
    } else {
      return {
        success: false,
        status: 500,
        message:
          "Xảy ra lỗi trong việc cấp quyền trước khi thực hiện cuộc gọi bằng video",
      };
    }
  }
};

export const checkCallStream = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    return {
      success: true,
      status: 200,
      message: "Đã cấp quyền trước khi thực hiện cuộc gọi",
    };
  } catch (error) {
    if (error.name === "NotAllowedError") {
      return {
        success: false,
        status: 400,
        message: "Chưa cấp quyền trước khi thực hiện cuộc gọi.",
      };
    } else {
      return {
        success: false,
        status: 500,
        message: "Xảy ra lỗi trong việc cấp quyền trước khi thực hiện cuộc gọi",
      };
    }
  }
};
