const express = require("express");
const Blog = require("../model/Blog");
const router = express.Router();

// Helper: sanitize (here we keep _id exposed; remove any fields if needed later)
function sanitize(doc) {
  if (!doc) return doc;
  // We intentionally KEEP _id. We remove __v only.
  const obj = doc.toObject ? doc.toObject() : doc;
  const { __v, ...rest } = obj;
  return rest;
}

// CREATE blog
// Frontend should NOT send _id; slug optional
router.post("/", async (req, res) => {
  try {
    const blog = new Blog(req.body);
    await blog.save();
    res.status(201).json(sanitize(blog));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all blogs (sorted by latest createdAt)
router.get("/", async (req, res) => {
  try {
    const { sort = "recent", limit = 20, page = 1 } = req.query;
    const sortObj = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };
    const perPage = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10), 1) - 1) * perPage;

    const docs = await Blog.find({})
      .sort(sortObj)
      .skip(skip)
      .limit(perPage);

    // sanitize each doc (removes __v, keeps _id)
    const sanitized = docs.map(sanitize);
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single blog by identifier: slug OR MongoDB _id
// If identifier looks like a MongoDB ObjectId, query by _id; otherwise by slug
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const blog = await Blog.findOne(query);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(sanitize(blog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE blog by identifier (slug or _id)
router.put("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const blog = await Blog.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(sanitize(blog));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE blog by identifier (slug or _id)
router.delete("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);

    const query = isObjectId ? { _id: identifier } : { slug: identifier };
    const blog = await Blog.findOneAndDelete(query);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json({ message: "Blog deleted successfully", deleted: sanitize(blog) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
