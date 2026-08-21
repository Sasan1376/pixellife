const multer = require("multer");

// فایل‌ها ابتدا در حافظه دریافت و سپس در MongoDB GridFS ذخیره می‌شوند.
// برخلاف دیسک Render، GridFS بعد از redeploy پاک نمی‌شود.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 25 },
  fileFilter(req, file, cb) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return cb(new Error("فقط فایل تصویری مجاز است"));
    }
    cb(null, true);
  },
});

module.exports = upload;
