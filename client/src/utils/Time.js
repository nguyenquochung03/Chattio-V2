import moment from "moment";

const timeAgoTranslations = {
  "a few seconds ago": "vài giây trước",
  "a minute ago": "một phút trước",
  "minutes ago": "phút trước",
  "an hour ago": "một giờ trước",
  "hours ago": "giờ trước",
  "a day ago": "một ngày trước",
  "days ago": "ngày trước",
  "a month ago": "một tháng trước",
  "months ago": "tháng trước",
  "a year ago": "một năm trước",
  "years ago": "năm trước",
  "in a few seconds": "trong vài giây",
  "in a minute": "trong một phút",
  "in minutes": "trong vài phút",
  "in an hour": "trong một giờ",
  "in hours": "trong vài giờ",
  "in a day": "trong một ngày",
  "in days": "trong vài ngày",
  "in a month": "trong một tháng",
  "in months": "trong vài tháng",
  "in a year": "trong một năm",
  "in years": "trong vài năm",
};

// Hàm chuyển đổi từ tiếng Anh sang tiếng Việt
export const translateTimeAgo = (englishTimeAgo) => {
  for (let [key, value] of Object.entries(timeAgoTranslations)) {
    if (englishTimeAgo.includes(key)) {
      return englishTimeAgo.replace(key, value);
    }
  }
  return englishTimeAgo;
};

// Hàm lấy thời gian và dịch sang tiếng Việt
export const getTimeAgoInVietnamese = (date) => {
  const englishTimeAgo = moment(date).fromNow();
  return translateTimeAgo(englishTimeAgo);
};

export const formatTime = (timeInSeconds) => {
  const hours = Math.floor(timeInSeconds / 3600); // Tính giờ
  const minutes = Math.floor((timeInSeconds % 3600) / 60); // Tính phút còn lại sau khi trừ giờ
  const seconds = timeInSeconds % 60; // Tính giây còn lại

  if (hours > 0) {
    // Định dạng khi có giờ
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  // Định dạng khi không có giờ
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

export const convertSecondsToReadableTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600); // Số giờ
  const remainingSecondsAfterHours = totalSeconds % 3600;

  const minutes = Math.floor(remainingSecondsAfterHours / 60); // Số phút
  const seconds = remainingSecondsAfterHours % 60; // Số giây còn lại

  const timeParts = [];
  if (hours > 0) {
    timeParts.push(`${hours} ${hours > 1 ? "giờ" : "giờ"}`);
  }
  if (minutes > 0) {
    timeParts.push(`${minutes} ${minutes > 1 ? "phút" : "phút"}`);
  }
  if (seconds > 0) {
    timeParts.push(`${seconds} ${seconds > 1 ? "giây" : "giây"}`);
  }

  return timeParts.join(", ");
};
