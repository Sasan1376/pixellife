const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

const ROUTE_PREFIX = "/api/products/image/";

function bucket() {
  if (!mongoose.connection.db) {
    throw new Error("اتصال پایدار دیتابیس برای ذخیرهٔ تصویر آماده نیست");
  }
  return new GridFSBucket(mongoose.connection.db, { bucketName: "product_images" });
}

function mediaPath(id) {
  return ROUTE_PREFIX + String(id);
}

function idFromPath(value) {
  const match = String(value || "").match(/\/api\/products\/image\/([a-f0-9]{24})/i);
  return match ? new ObjectId(match[1]) : null;
}

function saveProductImage(file) {
  if (!file || !file.buffer) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const stream = bucket().openUploadStream(file.originalname || "product-image", {
      contentType: file.mimetype || "application/octet-stream",
      metadata: { kind: "product-image" },
    });
    stream.on("error", reject);
    stream.on("finish", () => resolve(mediaPath(stream.id)));
    stream.end(file.buffer);
  });
}

async function removeProductImage(value) {
  const id = idFromPath(value);
  if (!id) return;
  try {
    await bucket().delete(id);
  } catch (error) {
    if (error?.code !== 26) throw error;
  }
}

function streamProductImage(idValue, res) {
  if (!ObjectId.isValid(idValue)) return false;
  const stream = bucket().openDownloadStream(new ObjectId(idValue));
  stream.on("file", (file) => {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
    res.type(file.contentType || "application/octet-stream");
  });
  stream.on("error", () => {
    if (!res.headersSent) res.status(404).end();
  });
  stream.pipe(res);
  return true;
}

module.exports = {
  removeProductImage,
  saveProductImage,
  streamProductImage,
};
