const { google } = require("googleapis");
const { Readable } = require("stream");

require("dotenv").config();

// Chuyển đổi Buffer thành Readable Stream
function bufferToStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

// Đọc thông tin chứng thực từ credentials.json
const auth = new google.auth.GoogleAuth({
  keyFile: "./chattio-google-api-key.json",
  scopes: ["https://www.googleapis.com/auth/drive.file"],
});

const uploadFileWithGoogleDrive = async (file) => {
  try {
    // Kiểm tra kích thước file
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 10) {
      return {
        success: false,
        status: 400,
        message: `Dung lượng tập tin vượt quá giới hạn cho phép: ${maxSizeMB}MB`,
      };
    }

    // Tải lên Google Drive
    const drive = google.drive({ version: "v3", auth: await auth.getClient() });

    const fileMetadata = {
      name: file.originalname, // Tên file khi tải lên Google Drive
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferToStream(file.buffer), // Chuyển buffer thành stream
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id", // Chỉ lấy ID file sau khi tải lên
    });

    const fileId = response.data.id;

    // Đặt quyền công khai cho file
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader", // Quyền chỉ xem
        type: "anyone", // Công khai với mọi người
      },
    });

    // Trả về kết quả với link công khai
    return {
      success: true,
      status: 200,
      data: fileId,
      message: "Tải tập tin thành công",
    };
  } catch (error) {
    console.error(`Xảy ra lỗi server khi tải lên tập tin: ${error}`);
    return {
      success: false,
      status: 500,
      message: "Xảy ra lỗi server khi tải lên tập tin",
      error: error.message,
    };
  }
};

const downloadFileFromGoogleDrive = async (req, res) => {
  const { fileId } = req.params;

  const drive = google.drive({ version: "v3", auth: await auth.getClient() });

  try {
    // Lấy thông tin file từ Google Drive
    const fileInfo = await drive.files.get({
      fileId,
      fields: "name, mimeType",
    });

    const fileName = fileInfo.data.name;
    const mimeType = fileInfo.data.mimeType;

    // Tải file từ Google Drive
    const file = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "arraybuffer" }
    );

    const fileBuffer = Buffer.from(file.data);
    const fileStream = bufferToStream(fileBuffer);

    // Đặt header để tải tệp
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", mimeType);

    // Stream tệp về client
    fileStream.pipe(res);
  } catch (error) {
    console.error(`Xảy ra lỗi server khi tải file: ${error}`);
    res.json({
      success: false,
      status: 500,
      message: `Xảy ra lỗi server khi tải file: ${error}`,
    });
  }
};

module.exports = { uploadFileWithGoogleDrive, downloadFileFromGoogleDrive };
