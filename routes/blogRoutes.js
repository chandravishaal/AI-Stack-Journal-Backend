const express = require("express");
const Blog = require("../model/Blog");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Helper: sanitize (here we keep _id exposed; remove any fields if needed later)
function sanitize(doc) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : doc;
  const { __v, ...rest } = obj;
  return rest;
}

/**
 * POST /api/blogs/upload
 * Accepts a multipart/form-data with field "image".
 * Uploads to Cloudinary (via multer-storage-cloudinary) and returns { imageUrl }.
 */
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    // console.log("POST /api/blogs/upload - file upload route hit");
    // console.log("req.file:", !!req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Use field name 'image'." });
    }

    // multer-storage-cloudinary generally sets file.path to the uploaded URL
    const file = req.file;
    const imageUrl = file.path || file.url || file.secure_url || file.location || null;

    // console.log("Cloudinary upload result (partial):", {
    //   originalname: file.originalname,
    //   filename: file.filename,
    //   imageUrl,
    // });

    if (!imageUrl) {
      return res.status(500).json({ error: "Upload succeeded but cloudinary URL not found on file object." });
    }

    return res.status(201).json({ imageUrl });
  } catch (err) {
    console.error("Error in /api/blogs/upload:", err);
    return res.status(500).json({ error: err.message || "Upload failed" });
  }
});

// accept JSON body with imageUrl (frontend can upload first, then send the imageUrl here)
router.post("/", async (req, res) => {
  try {
    // console.log("POST /api/blogs - create blog", { bodyKeys: Object.keys(req.body || {}) });
    const blogData = {
      title: req.body.title,
      excerpt: req.body.excerpt,
      content: req.body.content,
      author: req.body.author,
      date: req.body.date,
      categories: req.body.categories || [],
      tags: req.body.tags || [],
      imageUrl: req.body.imageUrl || null,
    };

    const blog = new Blog(blogData);
    await blog.save();
    // console.log("Blog saved with id:", blog._id);
    res.status(201).json(sanitize(blog));
  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(400).json({ error: err.message });
  }
});

// GET all blogs (sorted by latest createdAt)
router.get("/", async (req, res) => {
  try {
    // console.log("GET /api/blogs - list blogs", req.query);
    const { sort = "recent", limit = 20, page = 1 } = req.query;
    const sortObj = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const perPage = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * perPage;

    const docs = await Blog.find({})
      .sort(sortObj)
      .skip(skip)
      .limit(perPage);

    const sanitized = docs.map(sanitize);
    res.json(sanitized);
  } catch (err) {
    console.error("Error listing blogs:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single blog by identifier: slug OR MongoDB _id
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    // console.log("GET /api/blogs/:identifier", identifier);

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const blog = await Blog.findOne(query);
    if (!blog) {
      console.log("Blog not found for identifier:", identifier);
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(sanitize(blog));
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE blog by identifier (slug or _id)
router.put("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    // console.log("PUT /api/blogs/:identifier", identifier, "bodyKeys:", Object.keys(req.body || {}));
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const blog = await Blog.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!blog) {
      console.log("Blog not found for update:", identifier);
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json(sanitize(blog));
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE blog by identifier (slug or _id)
router.delete("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    // console.log("DELETE /api/blogs/:identifier", identifier);
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const blog = await Blog.findOneAndDelete(query);
    if (!blog) {
      // console.log("Blog not found for delete:", identifier);
      return res.status(404).json({ error: "Blog not found" });
    }
    res.json({ message: "Blog deleted successfully", deleted: sanitize(blog) });
  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
