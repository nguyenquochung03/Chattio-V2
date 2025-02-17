const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const uploadFileWithCloudinary = async (file) => {
  try {
    // Xác định `resource_type` và giới hạn dung lượng tối đa
    let resourceType;
    let maxSizeMB;
    if (file.mimetype.startsWith("image/")) {
      resourceType = "image";
      maxSizeMB = 10; // Tối đa 10MB cho ảnh
    } else if (
      file.mimetype.startsWith("video/") ||
      file.mimetype.startsWith("audio/")
    ) {
      resourceType = "video";
      maxSizeMB = 50; // Tối đa 100MB cho video/audio
    }

    // Kiểm tra kích thước file
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSizeMB) {
      return {
        success: false,
        status: 400,
        message: `Dung lượng tập tin vượt quá giới hạn cho phép: ${maxSizeMB}MB`,
      };
    }

    // Đối với ảnh, kiểm tra thêm số megapixels (chỉ với `resourceType === "image"`)
    if (resourceType === "image") {
      const sharp = require("sharp");
      const imageMetadata = await sharp(file.buffer).metadata();

      const megapixels =
        (imageMetadata.width * imageMetadata.height) / 1_000_000;
      if (megapixels > 25) {
        return {
          success: false,
          status: 400,
          message: "Số megapixels của ảnh vượt quá giới hạn cho phép: 25MP",
        };
      }
    }

    // Tải lên Cloudinary
    const uploadToCloudinary = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "chattio",
            resource_type: resourceType,
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(buffer);
      });

    // Upload file từ bộ nhớ
    const result = await uploadToCloudinary(file.buffer);

    // Trả về kết quả với link secure_url
    return {
      success: true,
      status: 200,
      data: result.secure_url,
      message: "Tải tập tin thành công",
    };
  } catch (error) {
    console.log(
      `Xảy ra lỗi server khi tải lên tập tin: ${JSON.stringify(error)}`
    );
    return {
      success: false,
      status: 500,
      message: `Xảy ra lỗi server khi tải lên tập tin: ${JSON.stringify(
        error
      )}`,
    };
  }
};

module.exports = { uploadFileWithCloudinary };
