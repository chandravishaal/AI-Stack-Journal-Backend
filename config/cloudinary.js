const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");


if (!process.env.CLOUDINARY_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("Cloudinary env vars missing. Backend upload will fail until these are set.");
}

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
 
// Storage engine for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "blog_images",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

// multer instance that uploads directly to Cloudinary via CloudinaryStorage
const upload = multer({ storage });

module.exports = { cloudinary, upload };
